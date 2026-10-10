import { openTransfer, sealTransfer, transferLink } from "@/lib/transferCodec";

// Browser side of "Send to another device"; see src/lib/transferCodec.js.

const ENDPOINT = "/api/transfer";

/** `reason` is "expired", "busy" or "unavailable"; the interface has a message for each. */
export class TransferError extends Error {
  constructor(reason) {
    super(`Transfer failed: ${reason}`);
    this.reason = reason;
  }
}

const request = async (url, options) => {
  let response;
  try {
    response = await fetch(url, { ...options, cache: "no-store" });
  } catch {
    throw new TransferError("unavailable"); // Offline, most likely.
  }
  if (response.ok) return response;
  if (response.status === 404) throw new TransferError("expired");
  const { error } = await response.json().catch(() => ({}));
  throw new TransferError(error === "busy" ? "busy" : "unavailable");
};

/** Uploads the encrypted data and resolves with the link that opens it. */
export const sendTransfer = async (data) => {
  const { payload, key } = await sealTransfer(data);
  const response = await request(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: payload,
  });
  const { id, expiresAt } = await response.json();
  return { url: transferLink(window.location.origin, id, key), expiresAt };
};

/** Downloads and decrypts the data a link points to. */
export const receiveTransfer = async ({ id, key }) => {
  const response = await request(`${ENDPOINT}/${id}`);
  try {
    return await openTransfer(await response.arrayBuffer(), key);
  } catch {
    throw new TransferError("expired"); // Wrong or damaged link: nothing usable either way.
  }
};

/** Removes a transfer once used; it would expire on its own anyway. */
export const discardTransfer = ({ id }) => fetch(`${ENDPOINT}/${id}`, { method: "DELETE" }).catch(() => {});
