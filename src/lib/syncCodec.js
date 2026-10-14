import { MAX_TRANSFER_BYTES, fromBase64Url, openWithKey, sealWithKey, toBase64Url } from "@/lib/transferCodec";

// Device sync: devices that share a secret key keep the same inventory.
//
//   pairing link:  https://…/#s=<secret>
//
// The secret never leaves the devices. Two things are derived from it: the id
// under which the server stores the group's inventory, and the key that
// encrypts it. The server sees the id and an unreadable payload; knowing the
// id does not give the key back.

const SECRET_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const HASH_PATTERN = /^#s=([A-Za-z0-9_-]{22})$/;
const SECRET_BYTES = 16;

// Payloads travel as base64url text: 4 characters for every 3 bytes.
export const MAX_SYNC_PAYLOAD_CHARS = Math.ceil((MAX_TRANSFER_BYTES * 4) / 3);

export const isSyncId = (id) => typeof id === "string" && ID_PATTERN.test(id);
export const isSyncSecret = (secret) => typeof secret === "string" && SECRET_PATTERN.test(secret);

export const newSyncSecret = () => toBase64Url(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)));

const digest = async (label, secret) =>
  new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`prime-inventory-sync:${label}:${secret}`)));

/** The server id of a secret's group. */
export const syncId = async (secret) => toBase64Url(await digest("id", secret)).slice(0, 22);

const encryptionKey = async (secret) => (await digest("key", secret)).subarray(0, 16);

/** `data` (any JSON value) as the text stored on the server. */
export const sealSync = async (data, secret) => toBase64Url(await sealWithKey(data, await encryptionKey(secret)));

/** Reverses sealSync; throws when the secret is wrong or the payload was altered. */
export const openSync = async (payload, secret) => openWithKey(fromBase64Url(payload), await encryptionKey(secret));

export const syncLink = (origin, secret) => `${origin}/#s=${secret}`;

/** The secret in a pairing link's hash, or null when it is not one. */
export const parseSyncHash = (hash) => HASH_PATTERN.exec(hash ?? "")?.[1] ?? null;
