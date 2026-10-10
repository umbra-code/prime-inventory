import { describe, expect, it } from "vitest";
import bundledCatalog from "@/data/primes.json";
import {
  MAX_TRANSFER_BYTES,
  isTransferId,
  openTransfer,
  parseTransferHash,
  sealTransfer,
  transferLink,
} from "./transferCodec";

const ID = "abcDEF123_-45678";

// Every part owned and every set mastered: the largest inventory there can be.
const fullInventory = () => ({
  version: 2,
  counts: Object.fromEntries(bundledCatalog.sets.flatMap((set) => set.components.map((part) => [part.uniqueName, 12]))),
  mastered: bundledCatalog.sets.map((set) => set.uniqueName),
  arsenal: bundledCatalog.sets.map((set) => set.uniqueName),
});

describe("sealTransfer / openTransfer", () => {
  it("round-trips the data", async () => {
    const data = { version: 2, counts: { "/Lotus/Part": 3 }, mastered: ["/Lotus/Set"], note: "ñ · 日本" };
    const { payload, key } = await sealTransfer(data);
    expect(await openTransfer(payload, key)).toEqual(data);
  });

  it("uses a new key and a different payload every time", async () => {
    const first = await sealTransfer({ a: 1 });
    const second = await sealTransfer({ a: 1 });
    expect(first.key).not.toBe(second.key);
    expect(first.key).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(Buffer.from(first.payload).equals(Buffer.from(second.payload))).toBe(false);
  });

  it("does not leave the data readable in the payload", async () => {
    const { payload } = await sealTransfer({ secret: "ivara-prime-systems" });
    expect(Buffer.from(payload).toString("latin1")).not.toContain("ivara");
  });

  it("rejects a wrong key or an altered payload", async () => {
    const { payload, key } = await sealTransfer({ a: 1 });
    const other = await sealTransfer({ a: 1 });
    await expect(openTransfer(payload, other.key)).rejects.toThrow();

    const altered = payload.slice();
    altered[altered.length - 1] ^= 1;
    await expect(openTransfer(altered, key)).rejects.toThrow();
  });

  it("keeps the largest possible inventory well under the size limit", async () => {
    const { payload } = await sealTransfer(fullInventory());
    expect(payload.length).toBeLessThan(MAX_TRANSFER_BYTES / 4);
  });
});

describe("transfer links", () => {
  it("builds a link that parses back", async () => {
    const { key } = await sealTransfer({});
    const link = transferLink("https://example.com", ID, key);
    expect(link).toBe(`https://example.com/#t=${ID}.${key}`);
    expect(parseTransferHash(new URL(link).hash)).toEqual({ id: ID, key });
  });

  it("ignores other hashes", () => {
    expect(parseTransferHash("")).toBeNull();
    expect(parseTransferHash(undefined)).toBeNull();
    expect(parseTransferHash("#missing-parts")).toBeNull();
    expect(parseTransferHash(`#t=${ID}`)).toBeNull();
    expect(parseTransferHash(`#t=${ID}.short`)).toBeNull();
    expect(parseTransferHash(`#t=../../etc/passwd.${"a".repeat(22)}`)).toBeNull();
  });

  it("validates ids", () => {
    expect(isTransferId(ID)).toBe(true);
    expect(isTransferId("../secrets")).toBe(false);
    expect(isTransferId(`${ID}x`)).toBe(false);
    expect(isTransferId(undefined)).toBe(false);
  });
});
