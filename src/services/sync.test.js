import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSyncId, isSyncSecret, newSyncSecret, openSync, parseSyncHash, sealSync, syncId, syncLink } from "@/lib/syncCodec";
import { createStorage } from "@/test/fixtures";
import { emptyHistory, inventoryReducer } from "./history";
import { SyncError, loadSyncState, newSyncState, saveSyncState, syncOnce } from "./sync";
import { normalizeUserData, toExportFile } from "./userInventory";

const data = (counts = {}, mastered = {}, arsenal = {}) => ({ counts, mastered, arsenal });
const fromFile = (file) => normalizeUserData(file, []);

// A server with the real rules: a write must name the version it replaces.
const makeServer = () => {
  const rows = new Map();
  const calls = { pull: 0, push: 0 };
  return {
    rows,
    calls,
    api: {
      pull: async (id, since) => {
        calls.pull++;
        const row = rows.get(id);
        if (!row) return { status: "missing" };
        return row.version === since ? { status: "same" } : { status: "changed", ...row };
      },
      push: async (id, baseVersion, payload) => {
        calls.push++;
        const row = rows.get(id);
        if ((row?.version ?? 0) !== baseVersion) return { conflict: row ?? null };
        rows.set(id, { version: baseVersion + 1, payload });
        return { version: baseVersion + 1 };
      },
    },
  };
};

let clock = 0;
const device = (secret, userData = data()) => ({ sync: newSyncState(secret), inventory: { userData, history: emptyHistory() } });
// Like the app, a part with none left is removed rather than kept at 0.
const edit = (dev, changes) => {
  const counts = { ...dev.inventory.userData.counts, ...changes };
  for (const [part, count] of Object.entries(counts)) if (count === 0) delete counts[part];
  dev.inventory = { ...dev.inventory, userData: { ...dev.inventory.userData, counts } };
};

// What the app does around syncOnce: apply a merge, then upload the result.
const sync = async (dev, server, { pull = true } = {}) => {
  let result = await syncOnce({ state: dev.sync, local: dev.inventory.userData, pull, toFile: toExportFile, fromFile, api: server.api });
  while (result.merge) {
    dev.inventory = inventoryReducer(dev.inventory, { type: "syncMerge", ...result.merge, id: `s${++clock}`, at: clock * 60_000 });
    dev.sync = result.state;
    result = await syncOnce({ state: dev.sync, local: dev.inventory.userData, pull: false, toFile: toExportFile, fromFile, api: server.api });
  }
  dev.sync = result.state;
};

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorage());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sync codec", () => {
  it("derives a stable id that does not reveal the secret", async () => {
    const secret = newSyncSecret();
    expect(isSyncSecret(secret)).toBe(true);
    const id = await syncId(secret);
    expect(isSyncId(id)).toBe(true);
    expect(id).not.toBe(secret);
    expect(await syncId(secret)).toBe(id);
    expect(await syncId(newSyncSecret())).not.toBe(id);
  });

  it("round-trips data only with the same secret", async () => {
    const secret = newSyncSecret();
    const payload = await sealSync({ counts: { "/a": 2 } }, secret);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await openSync(payload, secret)).toEqual({ counts: { "/a": 2 } });
    await expect(openSync(payload, newSyncSecret())).rejects.toThrow();
  });

  it("builds and reads pairing links", () => {
    const secret = newSyncSecret();
    const link = syncLink("https://example.com", secret);
    expect(parseSyncHash(new URL(link).hash)).toBe(secret);
    expect(parseSyncHash("#t=abc")).toBeNull();
    expect(parseSyncHash(`#s=${secret}x`)).toBeNull();
    expect(parseSyncHash(undefined)).toBeNull();
  });
});

describe("sync state", () => {
  it("is stored and removed", () => {
    expect(loadSyncState()).toBeNull();
    const state = { ...newSyncState("s".repeat(22)), version: 3 };
    saveSyncState(state);
    expect(loadSyncState()).toEqual(state);
    saveSyncState(null);
    expect(loadSyncState()).toBeNull();
  });

  it("ignores unreadable values", () => {
    localStorage.setItem("primeInventorySync", "{nope");
    expect(loadSyncState()).toBeNull();
    localStorage.setItem("primeInventorySync", JSON.stringify({ secret: 5 }));
    expect(loadSyncState()).toBeNull();
  });
});

describe("two devices", () => {
  const secret = newSyncSecret();

  it("the first device uploads its inventory, the second takes it", async () => {
    const server = makeServer();
    const pc = device(secret, data({ "/Braton/Barrel": 2 }, { "/Braton": true }));
    const phone = device(secret, data({ "/Old/Part": 9 }));

    await sync(pc, server);
    expect(pc.sync.version).toBe(1);
    expect(server.rows.size).toBe(1);
    // What the server holds is not readable.
    expect([...server.rows.values()][0].payload).not.toContain("Braton");

    await sync(phone, server);
    expect(phone.inventory.userData).toEqual(pc.inventory.userData);
    expect(phone.sync.version).toBe(1);
    // Taking the group's inventory is one undoable history entry, and uploads nothing.
    expect(phone.inventory.history.entries.map((entry) => entry.type)).toEqual(["sync"]);
    expect(server.calls.push).toBe(1);
    expect(inventoryReducer(phone.inventory, { type: "undo" }).userData).toEqual(data({ "/Old/Part": 9 }));
  });

  it("carries a change from one device to the other", async () => {
    const server = makeServer();
    const pc = device(secret, data({ "/Ivara/Systems": 1 }));
    const phone = device(secret);
    await sync(pc, server);
    await sync(phone, server);

    edit(phone, { "/Ivara/Systems": 0, "/Ivara/Chassis": 1 });
    await sync(phone, server, { pull: false });
    await sync(pc, server);

    expect(pc.inventory.userData.counts).toEqual({ "/Ivara/Chassis": 1 });
    expect(pc.sync.version).toBe(2);
    expect(phone.sync.version).toBe(2);
  });

  it("keeps edits made on both devices to different parts", async () => {
    const server = makeServer();
    const pc = device(secret, data({ "/a": 1, "/b": 1 }));
    const phone = device(secret);
    await sync(pc, server);
    await sync(phone, server);

    edit(pc, { "/a": 5 });
    edit(phone, { "/b": 7, "/c": 2 });
    await sync(pc, server, { pull: false });
    await sync(phone, server, { pull: false }); // refused as stale, merged, uploaded again
    await sync(pc, server);

    expect(phone.inventory.userData.counts).toEqual({ "/a": 5, "/b": 7, "/c": 2 });
    expect(pc.inventory.userData.counts).toEqual({ "/a": 5, "/b": 7, "/c": 2 });
    expect(pc.sync.version).toBe(3);
  });

  it("lets the device that syncs last win when both changed the same part", async () => {
    const server = makeServer();
    const pc = device(secret, data({ "/a": 1 }));
    const phone = device(secret);
    await sync(pc, server);
    await sync(phone, server);

    edit(pc, { "/a": 5 });
    edit(phone, { "/a": 3 });
    await sync(pc, server);
    await sync(phone, server);
    await sync(pc, server);

    expect(phone.inventory.userData.counts).toEqual({ "/a": 3 });
    expect(pc.inventory.userData.counts).toEqual({ "/a": 3 });
  });

  it("does not upload when nothing changed", async () => {
    const server = makeServer();
    const pc = device(secret, data({ "/a": 1 }));
    await sync(pc, server);
    await sync(pc, server);
    await sync(pc, server, { pull: false });
    expect(server.calls.push).toBe(1);
    expect(pc.sync.version).toBe(1);
  });

  it("starts the group again when the server copy is gone", async () => {
    const server = makeServer();
    const pc = device(secret, data({ "/a": 1 }));
    await sync(pc, server);
    server.rows.clear();

    await sync(pc, server); // asks first, finds nothing
    expect(server.rows.size).toBe(1);
    expect(pc.sync.version).toBe(1);

    server.rows.clear();
    edit(pc, { "/a": 2 });
    await sync(pc, server, { pull: false }); // uploads over a copy that vanished
    expect(fromFile(await openSync([...server.rows.values()][0].payload, secret)).counts).toEqual({ "/a": 2 });
  });
});

describe("failures", () => {
  const secret = newSyncSecret();
  const round = (state, api) => syncOnce({ state, local: data({ "/a": 1 }), pull: true, toFile: toExportFile, fromFile, api });

  it("pass on what went wrong and change nothing", async () => {
    const state = newSyncState(secret);
    const failing = (reason) => ({
      pull: async () => {
        throw new SyncError(reason);
      },
    });
    await expect(round(state, failing("offline"))).rejects.toMatchObject({ reason: "offline" });
    await expect(round(state, failing("unavailable"))).rejects.toMatchObject({ reason: "unavailable" });
    expect(state).toEqual(newSyncState(secret));
  });

  it("reject a copy this device cannot read", async () => {
    const server = makeServer();
    const pc = device(secret, data({ "/a": 1 }));
    await sync(pc, server);
    const [id] = server.rows.keys();

    server.rows.set(id, { version: 2, payload: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" });
    await expect(round(pc.sync, server.api)).rejects.toMatchObject({ reason: "invalid" });

    server.rows.set(id, { version: 2, payload: await sealSync({ not: "an inventory" }, secret) });
    await expect(round(pc.sync, server.api)).rejects.toMatchObject({ reason: "invalid" });
  });
});
