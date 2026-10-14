import { connect } from "@/services/postgres";

// Server side of device sync: one row per group of paired devices, holding
// their inventory encrypted with a key the server never sees (see
// src/services/sync.js). `version` grows by one with every accepted write, so
// a device that writes over a version it has not seen is told to merge first.
//
//   sync_inventories (id text primary key, payload text, version integer, updated_at timestamptz)

// A database that does not answer (wrong address, an outage, a slow wake-up)
// must not leave the request hanging: the device is told sync is unavailable
// and tries again later.
const QUERY_TIMEOUT_MS = 8000;

// Far above real use; keeps a flood of new groups from filling the free database.
const MAX_GROUPS = 20000;
// Groups nobody has written to for this long are removed. A device that
// comes back later simply uploads its copy again.
const STALE_AFTER = "400 days";

export class SyncStoreFullError extends Error {}

/** False when the deployment has no database connected (e.g. a fork). */
export const isSyncStoreConfigured = () => Boolean(process.env.DATABASE_URL);

let ready = null;
// The table is created on first use, so a new deployment needs no setup step.
const database = async () => {
  const sql = connect(process.env.DATABASE_URL, { timeoutMs: QUERY_TIMEOUT_MS });
  ready ??= sql`
    CREATE TABLE IF NOT EXISTS sync_inventories (
      id text PRIMARY KEY,
      payload text NOT NULL,
      version integer NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`.catch((error) => {
    ready = null;
    throw error;
  });
  await ready;
  return sql;
};

/** `{ version, payload }` stored under `id`, or null. */
export const readSync = async (id) => {
  const sql = await database();
  const [row] = await sql`SELECT version, payload FROM sync_inventories WHERE id = ${id}`;
  return row ?? null;
};

/**
 * Stores `payload` if `baseVersion` is the version currently stored (0 when
 * there is none yet). Resolves with `{ version }` when it was stored, or with
 * `{ conflict: { version, payload } | null }` holding what is there instead.
 */
export const writeSync = async (id, baseVersion, payload) => {
  const sql = await database();

  if (baseVersion === 0) {
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM sync_inventories`;
    if (count >= MAX_GROUPS) {
      await sql`DELETE FROM sync_inventories WHERE updated_at < now() - ${STALE_AFTER}::interval`;
      const [{ count: remaining }] = await sql`SELECT count(*)::int AS count FROM sync_inventories`;
      if (remaining >= MAX_GROUPS) throw new SyncStoreFullError("Too many sync groups");
    }
    const [created] = await sql`
      INSERT INTO sync_inventories (id, payload, version) VALUES (${id}, ${payload}, 1)
      ON CONFLICT (id) DO NOTHING
      RETURNING version`;
    if (created) return { version: created.version };
  } else {
    const [updated] = await sql`
      UPDATE sync_inventories SET payload = ${payload}, version = version + 1, updated_at = now()
      WHERE id = ${id} AND version = ${baseVersion}
      RETURNING version`;
    if (updated) return { version: updated.version };
  }

  return { conflict: await readSync(id) };
};
