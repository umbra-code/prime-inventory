"use client";

import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { newSyncSecret, syncLink } from "@/lib/syncCodec";
import { SYNC_STATE_KEY, loadSyncState, newSyncState, saveSyncState, syncOnce } from "@/services/sync";
import { normalizeUserData, toExportFile } from "@/services/userInventory";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";

// Runs device sync (see src/services/sync.js) around the inventory: when to
// talk to the server, and what the header's cloud shows.
//
// When it syncs: on opening the app, on coming back to it, when the
// connection returns, and a moment after the inventory changes. It never
// polls on a timer: the free database sleeps when idle, and an open tab
// checking every few minutes would keep it awake all month.

export const SyncContext = createContext(null);

// Edits are uploaded together once they pause for this long.
const PUSH_DELAY_MS = 2500;
// Coming back to the tab asks the server at most this often.
const MIN_PULL_INTERVAL_MS = 30 * 1000;
const RETRY_DELAY_MS = 60 * 1000;
const LEADER_LOCK = "primeInventorySyncLeader";

export function SyncProvider({ children }) {
  const { userData, catalog } = use(InventoryStateContext);
  const { mergeSynced } = use(InventoryActionsContext);
  const [sync, setSync] = useState(loadSyncState); // null: off on this device
  const [status, setStatus] = useState("idle"); // idle | syncing | synced | error
  const [problem, setProblem] = useState(null);

  const latest = useRef({ userData, catalog });
  useEffect(() => {
    latest.current = { userData, catalog };
  }, [userData, catalog]);

  // With several tabs open only one of them syncs. The others already share
  // the inventory through localStorage, and two tabs merging at once could
  // upload a copy that misses what the other just downloaded. The lock is
  // held for the life of the tab; when it closes, another tab takes over.
  // Browsers without the Web Locks API cannot coordinate tabs: every tab syncs.
  const [isLeader, setIsLeader] = useState(() => !navigator.locks?.request);
  const leader = useRef(false);
  useEffect(() => {
    leader.current = isLeader;
  }, [isLeader]);
  useEffect(() => {
    if (!navigator.locks?.request) return undefined;
    let release;
    let cancelled = false;
    navigator.locks.request(LEADER_LOCK, () => {
      if (cancelled) return undefined;
      setIsLeader(true);
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    return () => {
      cancelled = true;
      release?.();
    };
  }, []);

  // Another tab turned sync on or off, or finished a round.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === SYNC_STATE_KEY || event.key === null) setSync(loadSyncState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const running = useRef(false);
  const queued = useRef(null);
  const lastPull = useRef(0);
  const pushTimer = useRef(null);

  const run = useCallback(
    async (pull) => {
      if (!leader.current) return;
      if (running.current) {
        // One round at a time; remember that another was asked for.
        queued.current = { pull: Boolean(queued.current?.pull || pull) };
        return;
      }
      running.current = true;
      try {
        for (let next = { pull }; next; next = queued.current, queued.current = null) {
          const state = loadSyncState();
          if (!state) break;
          setStatus("syncing");
          const { sets } = latest.current.catalog;
          const result = await syncOnce({
            state,
            local: latest.current.userData,
            pull: next.pull,
            toFile: toExportFile,
            fromFile: (file) => normalizeUserData(file, sets),
          });
          // Turned off, or paired with other devices, while the round was in flight.
          if (loadSyncState()?.secret !== state.secret) break;

          if (result.merge) mergeSynced(result.merge.remote, result.merge.base);
          saveSyncState(result.state);
          setSync(result.state);
          if (next.pull) lastPull.current = Date.now();
          setStatus("synced");
          setProblem(null);
          // The merged inventory only exists after React has applied it, so
          // uploading it is left to a later round, never done in this one.
          if (result.merge) {
            clearTimeout(pushTimer.current);
            pushTimer.current = setTimeout(() => run(false), PUSH_DELAY_MS);
          }
        }
      } catch (error) {
        queued.current = null;
        setStatus("error");
        setProblem(error.reason ?? "unavailable");
      } finally {
        running.current = false;
      }
    },
    [mergeSynced]
  );

  const secret = sync?.secret;
  const active = isLeader && Boolean(secret);

  // Opening the app, turning sync on, or pairing with other devices.
  useEffect(() => {
    if (active) run(true);
  }, [active, secret, run]);

  // A moment after the inventory changes (from this tab or another one).
  useEffect(() => {
    if (!active) return undefined;
    pushTimer.current = setTimeout(() => run(false), PUSH_DELAY_MS);
    return () => clearTimeout(pushTimer.current);
  }, [active, userData, run]);

  // Coming back to the app, or the connection returning.
  useEffect(() => {
    if (!active) return undefined;
    const check = () => {
      if (document.visibilityState === "visible" && Date.now() - lastPull.current > MIN_PULL_INTERVAL_MS) run(true);
    };
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [active, run]);

  // After a failure, one more try a little later; then it waits for the next reason to sync.
  useEffect(() => {
    if (!active || status !== "error") return undefined;
    const timer = setTimeout(() => run(true), RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [active, status, run]);

  const value = useMemo(() => {
    const start = (newSecret) => {
      const state = newSyncState(newSecret);
      saveSyncState(state);
      setStatus("idle");
      setProblem(null);
      setSync(state);
    };
    return {
      enabled: Boolean(sync),
      // A tab that is not the one syncing shows what the syncing tab last achieved.
      status: !sync ? "off" : status === "idle" ? (sync.syncedAt ? "synced" : "syncing") : status,
      problem: sync ? problem : null,
      syncedAt: sync?.syncedAt ?? null,
      secret: sync?.secret ?? null,
      pairingLink: sync ? syncLink(window.location.origin, sync.secret) : null,
      /** Starts a new group of devices with this one. */
      enable: () => start(newSyncSecret()),
      /** Joins the group of the device that showed this secret. */
      join: (otherSecret) => start(otherSecret),
      /** Stops syncing on this device; its inventory and the other devices are untouched. */
      disable: () => {
        saveSyncState(null);
        setSync(null);
        setStatus("idle");
        setProblem(null);
      },
      syncNow: () => run(true),
    };
  }, [sync, status, problem, run]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
