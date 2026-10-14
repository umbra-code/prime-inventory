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

// In chunks: a long payload must not become one call with thousands of arguments.
export const toBase64Url = (bytes) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

export const fromBase64Url = (text) =>
  Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));

const pipeThrough = async (bytes, stream) =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

const importKey = (keyBytes) => crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);

/** Compresses `data` (any JSON value) and encrypts it with the given AES key bytes. */
export const sealWithKey = async (data, keyBytes) => {
  const plain = await pipeThrough(new TextEncoder().encode(JSON.stringify(data)), new CompressionStream("deflate-raw"));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await importKey(keyBytes), plain));

  const payload = new Uint8Array(IV_BYTES + cipher.length);
  payload.set(iv);
  payload.set(cipher, IV_BYTES);
  return payload;
};

/** Reverses sealWithKey; throws when the key is wrong or the payload was altered. */
export const openWithKey = async (payload, keyBytes) => {
  const bytes = new Uint8Array(payload);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes.subarray(0, IV_BYTES) },
    await importKey(keyBytes),
    bytes.subarray(IV_BYTES)
  );
  const json = await pipeThrough(new Uint8Array(plain), new DecompressionStream("deflate-raw"));
  return JSON.parse(new TextDecoder().decode(json));
};

/** Compresses and encrypts `data` with a new random key. */
export const sealTransfer = async (data) => {
  const keyBytes = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  return { payload: await sealWithKey(data, keyBytes), key: toBase64Url(keyBytes) };
};

/** Reverses sealTransfer. */
export const openTransfer = (payload, key) => openWithKey(payload, fromBase64Url(key));

export const transferLink = (origin, id, key) => `${origin}/#t=${id}.${key}`;

/** `{ id, key }` from a link's hash, or null when it is not a transfer link. */
export const parseTransferHash = (hash) => {
  const match = HASH_PATTERN.exec(hash ?? "");
  return match ? { id: match[1], key: match[2] } : null;
};
