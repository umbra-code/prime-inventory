import { MAX_TRANSFER_BYTES } from "@/lib/transferCodec";
import { isSameOrigin, json } from "@/lib/transferHttp";
import { TransferStoreBusyError, isTransferStoreConfigured, saveTransfer } from "@/services/transferStore";

// POST /api/transfer: stores an encrypted inventory for a few minutes.
export async function POST(request) {
  if (!isTransferStoreConfigured()) return json({ error: "unavailable" }, 503);
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (Number(request.headers.get("content-length")) > MAX_TRANSFER_BYTES) return json({ error: "too_large" }, 413);

  const payload = new Uint8Array(await request.arrayBuffer());
  if (payload.length === 0) return json({ error: "empty" }, 400);
  if (payload.length > MAX_TRANSFER_BYTES) return json({ error: "too_large" }, 413);

  try {
    return json(await saveTransfer(payload), 201);
  } catch (error) {
    if (error instanceof TransferStoreBusyError) return json({ error: "busy" }, 503);
    console.error("Failed to store a transfer:", error);
    return json({ error: "unavailable" }, 503);
  }
}
