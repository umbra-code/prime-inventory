import { MAX_SYNC_PAYLOAD_CHARS, isSyncId } from "@/lib/syncCodec";
import { isSameOrigin, json } from "@/lib/transferHttp";
import { SyncStoreFullError, isSyncStoreConfigured, readSync, writeSync } from "@/services/syncStore";

const unavailable = (error) => {
  console.error("Sync store failed:", error);
  return json({ error: "unavailable" }, 503);
};

// GET /api/sync/<id>?since=<version>: the encrypted inventory of a group of
// devices; 204 when `since` is still the stored version, 404 when there is none.
export async function GET(request, { params }) {
  const { id } = await params;
  if (!isSyncStoreConfigured()) return json({ error: "unavailable" }, 503);
  if (!isSyncId(id)) return json({ error: "not_found" }, 404);

  try {
    const stored = await readSync(id);
    if (!stored) return json({ error: "not_found" }, 404);
    const since = Number(new URL(request.url).searchParams.get("since"));
    if (since === stored.version) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    return json(stored);
  } catch (error) {
    return unavailable(error);
  }
}

// PUT /api/sync/<id> with { baseVersion, payload }: stores the payload when
// baseVersion is the stored version (0 for a new group); otherwise answers
// 409 with what is stored, for the device to merge and try again.
export async function PUT(request, { params }) {
  const { id } = await params;
  if (!isSyncStoreConfigured()) return json({ error: "unavailable" }, 503);
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!isSyncId(id)) return json({ error: "not_found" }, 404);
  if (Number(request.headers.get("content-length")) > MAX_SYNC_PAYLOAD_CHARS + 200) return json({ error: "too_large" }, 413);

  const body = await request.json().catch(() => null);
  const { baseVersion, payload } = body ?? {};
  if (!Number.isInteger(baseVersion) || baseVersion < 0 || typeof payload !== "string" || !/^[A-Za-z0-9_-]+$/.test(payload)) {
    return json({ error: "invalid" }, 400);
  }
  if (payload.length > MAX_SYNC_PAYLOAD_CHARS) return json({ error: "too_large" }, 413);

  try {
    const result = await writeSync(id, baseVersion, payload);
    return result.conflict === undefined ? json({ version: result.version }) : json({ current: result.conflict }, 409);
  } catch (error) {
    if (error instanceof SyncStoreFullError) return json({ error: "full" }, 503);
    return unavailable(error);
  }
}
