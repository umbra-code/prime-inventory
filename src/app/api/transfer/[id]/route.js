import { isTransferId } from "@/lib/transferCodec";
import { isSameOrigin, json } from "@/lib/transferHttp";
import { deleteTransfer, isTransferStoreConfigured, readTransfer } from "@/services/transferStore";

// GET /api/transfer/<id>: the encrypted inventory, while it lasts.
export async function GET(_request, { params }) {
  const { id } = await params;
  if (!isTransferStoreConfigured()) return json({ error: "unavailable" }, 503);
  if (!isTransferId(id)) return json({ error: "not_found" }, 404);

  try {
    const payload = await readTransfer(id);
    if (!payload) return json({ error: "not_found" }, 404);
    return new Response(payload, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to read a transfer:", error);
    return json({ error: "unavailable" }, 503);
  }
}

// DELETE /api/transfer/<id>: called once the inventory has been imported.
export async function DELETE(request, { params }) {
  const { id } = await params;
  if (!isTransferStoreConfigured()) return json({ error: "unavailable" }, 503);
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!isTransferId(id)) return json({ error: "not_found" }, 404);

  try {
    await deleteTransfer(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete a transfer:", error);
    return json({ error: "unavailable" }, 503);
  }
}
