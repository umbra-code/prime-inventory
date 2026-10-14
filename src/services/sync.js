import { openSync, sealSync, syncId } from "@/lib/syncCodec";
import { diffUserData } from "@/services/history";

// Browser side of device sync (see src/lib/syncCodec.js for the pairing and
// src/services/syncStore.js for what the server keeps).
//
// Each device remembers, next to its inventory:
//   secret   shared by the paired devices
//   version  of the server copy it last agreed with (0: none yet)
//   base     that copy, as a backup-file object: what the devices had in common
// What the device changed since then is the difference between `base` and its
// inventory, so nothing has to be tracked edit by edit and nothing is lost if
// the page closes before a change was uploaded.
//
// Sync is an extra on top of the local inventory: every failure here leaves
// the app working as it does without it, and the next attempt catches up.

const STATE_KEY = "primeInventorySync";
const ENDPOINT = "/api/sync";

/** `reason`: "offline", "unavailable" (no database, or it is paused), "full" or "invalid". */
export class SyncError extends Error {
  constructor(reason) {
    super(`Sync failed: ${reason}`);
    this.reason = reason;
  }
}

const isValidState = (state) =>
  typeof state?.secret === "string" && Number.isInteger(state.version) && state.version >= 0 && typeof state.base === "object";

export const loadSyncState = () => {
  try {
    const state = JSON.parse(localStorage.getItem(STATE_KEY));
    return isValidState(state) ? state : null;
  } catch {
    return null;
  }
};

export const saveSyncState = (state) => {
  try {
    if (state) localStorage.setItem(STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STATE_KEY);
  } catch (error) {
    console.error("Failed to save the sync state:", error);
  }
};

export const SYNC_STATE_KEY = STATE_KEY;

/** State of a device that just turned sync on, or joined with another device's secret. */
export const newSyncState = (secret) => ({ secret, version: 0, base: null, syncedAt: null });

const request = async (url, options) => {
  let response;
  try {
    response = await fetch(url, { ...options, cache: "no-store" });
  } catch {
    throw new SyncError("offline");
  }
  if (response.status === 503) {
    const { error } = await response.json().catch(() => ({}));
    throw new SyncError(error === "full" ? "full" : "unavailable");
  }
  return response;
};

/** The two calls to the server; replaced by a fake in tests. */
export const syncApi = {
  /** `{ status: "same" | "missing" }` or `{ status: "changed", version, payload }`. */
  pull: async (id, since) => {
    const response = await request(`${ENDPOINT}/${id}?since=${since}`);
    if (response.status === 204) return { status: "same" };
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) throw new SyncError("unavailable");
    return { status: "changed", ...(await response.json()) };
  },
  /** `{ version }` when stored, or `{ conflict: { version, payload } | null }`. */
  push: async (id, baseVersion, payload) => {
    const response = await request(`${ENDPOINT}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseVersion, payload }),
    });
    if (response.status === 409) return { conflict: (await response.json()).current };
    if (!response.ok) throw new SyncError("unavailable");
    return { version: (await response.json()).version };
  },
};

/**
 * One round with the server. Resolves with the device's new sync `state`
 * and, when another device uploaded something, `merge: { remote, base }` for
 * the inventory reducer's "syncMerge" (what this device changed since `base`
 * goes back on top of `remote`). After a merge the caller runs another round
 * to upload the result, if it differs from what the server has.
 *
 * `pull` asks the server first (opening the app, coming back to it); without
 * it the round goes straight to uploading, and a version conflict brings the
 * newer copy back anyway. `toFile` / `fromFile` convert between the inventory
 * and its backup-file form.
 */
export const syncOnce = async ({ state, local, pull, toFile, fromFile, api = syncApi, now = Date.now() }) => {
  const id = await syncId(state.secret);
  const base = state.base ? fromFile(state.base) : null;
  let { version } = state;

  const adopt = async (remote) => {
    let file;
    try {
      file = await openSync(remote.payload, state.secret);
    } catch {
      throw new SyncError("invalid");
    }
    const remoteData = fromFile(file);
    if (!remoteData) throw new SyncError("invalid");
    // A device with no common ground yet claims no changes: it takes the group's inventory.
    return { state: { ...state, version: remote.version, base: file, syncedAt: now }, merge: { remote: remoteData, base: base ?? local } };
  };

  if (pull || version === 0) {
    const pulled = await api.pull(id, version);
    if (pulled.status === "changed") return adopt(pulled);
    // Nothing stored (a new group, or one removed after long disuse): this device starts it.
    if (pulled.status === "missing") version = 0;
  }

  const hasChanges = version === 0 || !base || diffUserData(base, local) !== null;
  if (!hasChanges) return { state: { ...state, version, syncedAt: now } };

  const file = toFile(local);
  const payload = await sealSync(file, state.secret);
  let pushed = await api.push(id, version, payload);
  // The stored copy disappeared since this device last saw it: upload it as new.
  if (pushed.conflict === null) pushed = await api.push(id, 0, payload);
  if (pushed.conflict) return adopt(pushed.conflict);
  if (!pushed.version) throw new SyncError("unavailable");
  return { state: { ...state, version: pushed.version, base: file, syncedAt: now } };
};
