import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSFER_TTL_MS, isTransferId } from "@/lib/transferCodec";

// An in-memory stand-in for the Blob store.
const blobs = new Map();
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (pathname, body, options) => {
    blobs.set(pathname, { body: Buffer.from(body), uploadedAt: new Date(globalThis.__now), options });
    return { pathname, url: `https://store.example/${pathname}` };
  }),
  get: vi.fn(async (pathname) => {
    const blob = blobs.get(pathname);
    return blob ? { statusCode: 200, stream: new Blob([blob.body]).stream(), blob: { pathname } } : null;
  }),
  del: vi.fn(async (targets) => {
    for (const target of [targets].flat()) blobs.delete(target.replace("https://store.example/", ""));
  }),
  list: vi.fn(async ({ prefix }) => ({
    blobs: [...blobs]
      .filter(([pathname]) => pathname.startsWith(prefix))
      .map(([pathname, blob]) => ({ pathname, url: `https://store.example/${pathname}`, uploadedAt: blob.uploadedAt })),
  })),
}));

const { TransferStoreBusyError, deleteTransfer, isTransferStoreConfigured, readTransfer, saveTransfer } = await import(
  "./transferStore"
);

const NOW = Date.parse("2026-10-10T12:00:00Z");
const payload = (text) => new Uint8Array(Buffer.from(text));
const save = (text, now) => {
  globalThis.__now = now;
  return saveTransfer(payload(text), { now });
};

beforeEach(() => blobs.clear());
afterEach(() => vi.unstubAllEnvs());

describe("transfer store", () => {
  it("stores a payload privately and returns it while it lasts", async () => {
    const { id, expiresAt } = await save("inventory", NOW);
    expect(isTransferId(id)).toBe(true);
    expect(expiresAt).toBe(NOW + TRANSFER_TTL_MS);
    expect(blobs.get(`transfers/${id}`).options).toMatchObject({ access: "private", addRandomSuffix: false });

    const read = await readTransfer(id, { now: NOW + TRANSFER_TTL_MS - 1 });
    expect(Buffer.from(read).toString()).toBe("inventory");
  });

  it("gives every transfer a different id", async () => {
    const first = await save("a", NOW);
    const second = await save("a", NOW);
    expect(first.id).not.toBe(second.id);
  });

  it("returns nothing for unknown, deleted or expired transfers", async () => {
    expect(await readTransfer("AAAAAAAAAAAAAAAA", { now: NOW })).toBeNull();

    const deleted = await save("gone", NOW);
    await deleteTransfer(deleted.id);
    expect(await readTransfer(deleted.id, { now: NOW })).toBeNull();

    const expired = await save("old", NOW);
    expect(await readTransfer(expired.id, { now: NOW + TRANSFER_TTL_MS })).toBeNull();
    expect(blobs.has(`transfers/${expired.id}`)).toBe(false);
  });

  it("deletes expired transfers when a new one is saved", async () => {
    const old = await save("old", NOW);
    const recent = await save("recent", NOW + TRANSFER_TTL_MS - 1000);
    await save("new", NOW + TRANSFER_TTL_MS + 1);
    expect(blobs.has(`transfers/${old.id}`)).toBe(false);
    expect(blobs.has(`transfers/${recent.id}`)).toBe(true);
    expect(blobs.size).toBe(2);
  });

  it("refuses new transfers while too many are pending", async () => {
    for (let i = 0; i < 200; i++) await save("x", NOW);
    await expect(save("one too many", NOW)).rejects.toBeInstanceOf(TransferStoreBusyError);
    // They free up as they expire.
    await expect(save("later", NOW + TRANSFER_TTL_MS + 1)).resolves.toBeTruthy();
  });

  it("knows whether a Blob store is connected", () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("BLOB_STORE_ID", "");
    expect(isTransferStoreConfigured()).toBe(false);
    vi.stubEnv("BLOB_STORE_ID", "store_123");
    expect(isTransferStoreConfigured()).toBe(true);
  });
});
