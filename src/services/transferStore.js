import { randomBytes } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";
import { TRANSFER_TTL_MS } from "@/lib/transferCodec";

// Server side of "Send to another device": encrypted inventories kept in a
// private Vercel Blob store for a few minutes. Blobs have no expiry of their
// own, so every stored one starts with its expiry time, and saving a new one
// first deletes the ones that ran out.

const PREFIX = "transfers/";
const EXPIRY_BYTES = 8;
// Transfers waiting to be picked up at the same time. Far above real use;
// it only keeps a flood of uploads from filling the store.
const MAX_PENDING = 200;

export class TransferStoreBusyError extends Error {}

/** False when the deployment has no Blob store connected (e.g. a fork). */
export const isTransferStoreConfigured = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

const deleteExpired = async (now) => {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  const expired = blobs.filter((blob) => now - new Date(blob.uploadedAt).getTime() > TRANSFER_TTL_MS);
  if (expired.length > 0) await del(expired.map((blob) => blob.url));
  return blobs.length - expired.length;
};

/** Stores a payload and resolves with its id and expiry time. */
export const saveTransfer = async (payload, { now = Date.now() } = {}) => {
  const pending = await deleteExpired(now);
  if (pending >= MAX_PENDING) throw new TransferStoreBusyError("Too many pending transfers");

  const id = randomBytes(12).toString("base64url");
  const expiresAt = now + TRANSFER_TTL_MS;
  const body = Buffer.alloc(EXPIRY_BYTES + payload.length);
  body.writeBigUInt64BE(BigInt(expiresAt));
  body.set(payload, EXPIRY_BYTES);

  await put(PREFIX + id, body, {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/octet-stream",
  });
  return { id, expiresAt };
};

/** The payload stored under `id`, or null when there is none or it expired. */
export const readTransfer = async (id, { now = Date.now() } = {}) => {
  // Read from the origin: the copy may have been deleted seconds ago.
  const result = await get(PREFIX + id, { access: "private", useCache: false });
  if (result?.statusCode !== 200) return null;

  const body = Buffer.from(await new Response(result.stream).arrayBuffer());
  if (body.length <= EXPIRY_BYTES || Number(body.readBigUInt64BE()) <= now) {
    await deleteTransfer(id);
    return null;
  }
  return body.subarray(EXPIRY_BYTES);
};

export const deleteTransfer = async (id) => {
  await del(PREFIX + id);
};
