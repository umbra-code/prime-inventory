// "Send to another device": the inventory is compressed and encrypted in the
// browser, stored for a few minutes, and fetched from a short link:
//
//   https://…/#t=<id>.<key>
//
// The key only exists in the link, after the "#", which browsers never send
// to a server; what the server stores cannot be read without it.

export const TRANSFER_TTL_MS = 15 * 60 * 1000;
// A full inventory is about 6 KB once compressed; this leaves plenty of room.
export const MAX_TRANSFER_BYTES = 64 * 1024;

const ID_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const HASH_PATTERN = /^#t=([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{22})$/;
const KEY_BYTES = 16;
const IV_BYTES = 12;

export const isTransferId = (id) => typeof id === "string" && ID_PATTERN.test(id);

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const fromBase64Url = (text) =>
  Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));

const pipeThrough = async (bytes, stream) =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

const importKey = (keyBytes) => crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);

/** Compresses and encrypts `data` (any JSON value) with a new random key. */
export const sealTransfer = async (data) => {
  const plain = await pipeThrough(new TextEncoder().encode(JSON.stringify(data)), new CompressionStream("deflate-raw"));
  const keyBytes = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await importKey(keyBytes), plain));

  const payload = new Uint8Array(IV_BYTES + cipher.length);
  payload.set(iv);
  payload.set(cipher, IV_BYTES);
  return { payload, key: toBase64Url(keyBytes) };
};

/** Reverses sealTransfer; throws when the key is wrong or the payload was altered. */
export const openTransfer = async (payload, key) => {
  const bytes = new Uint8Array(payload);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes.subarray(0, IV_BYTES) },
    await importKey(fromBase64Url(key)),
    bytes.subarray(IV_BYTES)
  );
  const json = await pipeThrough(new Uint8Array(plain), new DecompressionStream("deflate-raw"));
  return JSON.parse(new TextDecoder().decode(json));
};

export const transferLink = (origin, id, key) => `${origin}/#t=${id}.${key}`;

/** `{ id, key }` from a link's hash, or null when it is not a transfer link. */
export const parseTransferHash = (hash) => {
  const match = HASH_PATTERN.exec(hash ?? "");
  return match ? { id: match[1], key: match[2] } : null;
};
