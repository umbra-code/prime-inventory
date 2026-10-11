import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStorage } from "@/test/fixtures";
import {
  HISTORY_KEY,
  MAX_ENTRIES,
  MERGE_WINDOW_MS,
  countChanges,
  diffUserData,
  emptyHistory,
  inventoryReducer,
  loadHistory,
  parseStoredHistory,
  saveHistory,
} from "./history";

const braton = {
  uniqueName: "/Braton",
  name: "Braton Prime",
  components: [
    { uniqueName: "/Braton/Barrel", required: 1 },
    { uniqueName: "/Braton/Stock", required: 2 },
  ],
};
const paris = { uniqueName: "/Paris", name: "Paris Prime", components: [{ uniqueName: "/Paris/String", required: 1 }] };

const data = (counts = {}, mastered = {}, arsenal = {}) => ({ counts, mastered, arsenal });
const start = (userData = data()) => ({ userData, history: emptyHistory() });

// Runs actions one after another, giving each an id and a time like the app does.
let clock;
let ids;
const run = (state, ...actions) =>
  actions.reduce((current, action) => {
    clock += action.wait ?? 1000;
    return inventoryReducer(current, { id: `e${++ids}`, at: clock, ...action });
  }, state);
const edit = (part, delta, extra = {}) => ({ type: "adjustCount", uniqueName: part, delta, group: part.split("/").slice(0, 2).join("/"), ...extra });

beforeEach(() => {
  clock = 1_000_000;
  ids = 0;
  vi.stubGlobal("localStorage", createStorage());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("diffUserData", () => {
  it("lists what changed with the value before and after", () => {
    const before = data({ "/a": 1, "/b": 2 }, { "/s": true });
    const after = data({ "/a": 3, "/c": 1 }, {}, { "/s": true });
    expect(diffUserData(before, after)).toEqual({
      counts: { "/a": [1, 3], "/b": [2, 0], "/c": [0, 1] },
      mastered: { "/s": [true, false] },
      arsenal: { "/s": [false, true] },
    });
  });

  it("is null when nothing changed", () => {
    expect(diffUserData(data({ "/a": 1 }), data({ "/a": 1 }))).toBeNull();
  });
});

describe("recording", () => {
  it("records an edit the moment it happens", () => {
    const state = run(start(), edit("/Braton/Barrel", 1));
    expect(state.userData.counts).toEqual({ "/Braton/Barrel": 1 });
    expect(state.history).toEqual({
      entries: [{ id: "e1", at: clock, type: "edit", group: "/Braton", changes: { counts: { "/Braton/Barrel": [0, 1] } } }],
      position: 1,
    });
  });

  it("joins quick edits to the same set into one entry", () => {
    const state = run(start(), edit("/Braton/Barrel", 1), edit("/Braton/Barrel", 1), edit("/Braton/Stock", 2), {
      type: "toggleMastery",
      set: braton,
    });
    expect(state.history.entries).toHaveLength(1);
    expect(state.history.entries[0]).toMatchObject({
      id: "e1",
      at: clock,
      changes: { counts: { "/Braton/Barrel": [0, 2], "/Braton/Stock": [0, 2] }, mastered: { "/Braton": [false, true] } },
    });
  });

  it("starts a new entry after a pause or for another set", () => {
    const paused = run(start(), edit("/Braton/Barrel", 1), edit("/Braton/Barrel", 1, { wait: MERGE_WINDOW_MS + 1 }));
    expect(paused.history.entries.map((entry) => entry.changes.counts["/Braton/Barrel"])).toEqual([
      [0, 1],
      [1, 2],
    ]);

    const otherSet = run(start(), edit("/Braton/Barrel", 1), edit("/Paris/String", 1));
    expect(otherSet.history.entries.map((entry) => entry.group)).toEqual(["/Braton", "/Paris"]);
  });

  it("measures the pause from the last edit, not the first", () => {
    const state = run(start(), edit("/Braton/Barrel", 1), edit("/Braton/Barrel", 1, { wait: 4000 }), edit("/Braton/Barrel", 1, { wait: 4000 }));
    expect(state.history.entries).toHaveLength(1);
  });

  it("leaves no entry for edits that end where they started", () => {
    const state = run(start(data({ "/Braton/Barrel": 1 })), edit("/Braton/Barrel", 1), edit("/Braton/Barrel", -1));
    expect(state.history).toEqual(emptyHistory());
    expect(state.userData.counts).toEqual({ "/Braton/Barrel": 1 });
  });

  it("gives Build and Sell their own entries, never joined", () => {
    const state = run(start(data({ "/Braton/Barrel": 2, "/Braton/Stock": 4 })), { type: "sell", set: braton }, { type: "build", set: braton });
    expect(state.history.entries.map((entry) => [entry.type, entry.group])).toEqual([
      ["sell", "/Braton"],
      ["build", "/Braton"],
    ]);
    expect(state.history.entries[1].changes).toEqual({
      counts: { "/Braton/Barrel": [1, 0], "/Braton/Stock": [2, 0] },
      mastered: { "/Braton": [false, true] },
      arsenal: { "/Braton": [false, true] },
    });
  });

  it("records imports and resets, but not data arriving from another tab", () => {
    const imported = data({ "/Paris/String": 3 });
    const state = run(
      start(data({ "/Braton/Barrel": 1 })),
      { type: "replace", userData: imported, cause: "import" },
      { type: "replace", userData: data(), cause: "reset" },
      { type: "replace", userData: data({ "/Braton/Stock": 9 }) }
    );
    expect(state.history.entries.map((entry) => entry.type)).toEqual(["import", "reset"]);
    expect(state.userData.counts).toEqual({ "/Braton/Stock": 9 });
  });

  it("does not record actions that change nothing", () => {
    const state = run(start(), { type: "sell", set: braton }, edit("/Braton/Barrel", -1));
    expect(state.history).toEqual(emptyHistory());
  });

  it("keeps only the most recent entries", () => {
    const actions = Array.from({ length: MAX_ENTRIES + 5 }, () => edit("/Braton/Barrel", 1, { wait: MERGE_WINDOW_MS + 1 }));
    const state = run(start(), ...actions);
    expect(state.history.entries).toHaveLength(MAX_ENTRIES);
    expect(state.history.position).toBe(MAX_ENTRIES);
    expect(state.history.entries[0].changes.counts["/Braton/Barrel"]).toEqual([5, 6]);
  });
});

describe("undo and redo", () => {
  const worked = () =>
    run(
      start(data({ "/Braton/Barrel": 1, "/Braton/Stock": 2 })),
      edit("/Paris/String", 2),
      { type: "build", set: braton },
      { type: "toggleArsenal", set: braton, wait: MERGE_WINDOW_MS + 1 }
    );

  it("undoes one entry at a time, back to the start", () => {
    let state = worked();
    expect(state.userData).toEqual(data({ "/Paris/String": 2 }, { "/Braton": true }));

    state = run(state, { type: "undo" });
    expect(state.userData).toEqual(data({ "/Paris/String": 2 }, { "/Braton": true }, { "/Braton": true }));
    state = run(state, { type: "undo" });
    expect(state.userData).toEqual(data({ "/Braton/Barrel": 1, "/Braton/Stock": 2, "/Paris/String": 2 }));
    state = run(state, { type: "undo" });
    expect(state.userData).toEqual(data({ "/Braton/Barrel": 1, "/Braton/Stock": 2 }));

    expect(state.history.position).toBe(0);
    expect(state.history.entries).toHaveLength(3);
    expect(run(state, { type: "undo" })).toBe(state);
  });

  it("redoes what was undone", () => {
    const done = worked();
    const state = run(done, { type: "undo" }, { type: "undo" }, { type: "redo" }, { type: "redo" });
    expect(state.userData).toEqual(done.userData);
    expect(state.history.position).toBe(3);
    expect(run(state, { type: "redo" })).toBe(state);
  });

  it("jumps to any point", () => {
    const done = worked();
    const back = run(done, { type: "goTo", position: 1 });
    expect(back.userData).toEqual(data({ "/Braton/Barrel": 1, "/Braton/Stock": 2, "/Paris/String": 2 }));
    expect(run(back, { type: "goTo", position: 3 }).userData).toEqual(done.userData);
    expect(run(done, { type: "goTo", position: -4 }).history.position).toBe(0);
    expect(run(done, { type: "goTo", position: 99 })).toBe(done);
  });

  it("drops the undone entries when a new change is made", () => {
    const state = run(worked(), { type: "undo" }, { type: "undo" }, edit("/Paris/String", 1, { wait: MERGE_WINDOW_MS + 1 }));
    expect(state.history.entries.map((entry) => entry.type)).toEqual(["edit", "edit"]);
    expect(state.history.position).toBe(2);
    expect(state.userData.counts["/Paris/String"]).toBe(3);
  });

  it("undoes an import exactly", () => {
    const original = data({ "/Braton/Barrel": 1 }, { "/Braton": true }, { "/Paris": true });
    const state = run(start(original), { type: "replace", userData: data({ "/Paris/String": 5 }, { "/Paris": true }), cause: "import" }, { type: "undo" });
    expect(state.userData).toEqual(original);
  });

  it("clears the history without touching the inventory", () => {
    const done = worked();
    const state = run(done, { type: "clearHistory" });
    expect(state.history).toEqual(emptyHistory());
    expect(state.userData).toBe(done.userData);
  });
});

describe("undoEntry (the toast's Undo)", () => {
  const sold = () => run(start(data({ "/Braton/Barrel": 2, "/Braton/Stock": 4 })), { type: "sell", set: braton, id: "sale" });
  const fallback = { type: "restoreSet", set: braton, counts: [2, 4], isMastered: false, inArsenal: false };

  it("is a plain undo while that entry is the latest", () => {
    const state = run(sold(), { type: "undoEntry", entryId: "sale", fallback });
    expect(state.userData.counts).toEqual({ "/Braton/Barrel": 2, "/Braton/Stock": 4 });
    expect(state.history.position).toBe(0);
    expect(state.history.entries).toHaveLength(1);
  });

  it("reverts only that action after other changes, as a new entry", () => {
    const state = run(sold(), edit("/Paris/String", 1), { type: "undoEntry", entryId: "sale", fallback });
    expect(state.userData.counts).toEqual({ "/Braton/Barrel": 2, "/Braton/Stock": 4, "/Paris/String": 1 });
    expect(state.history.entries.map((entry) => entry.type)).toEqual(["sell", "edit", "revert"]);
  });
});

describe("storage", () => {
  it("round-trips the history", () => {
    const { history } = run(start(), edit("/Braton/Barrel", 1), { type: "toggleMastery", set: paris }, { type: "undo" });
    saveHistory(history);
    expect(loadHistory()).toEqual(history);
  });

  it("starts empty when there is none or it is not readable", () => {
    expect(loadHistory()).toEqual(emptyHistory());
    for (const value of ["{not json", "null", '{"version":99,"entries":[]}', '{"version":1,"entries":[{"id":1}]}']) {
      expect(parseStoredHistory(value)).toEqual(emptyHistory());
    }
    const badPair = { version: 1, position: 1, entries: [{ id: "a", at: 1, type: "edit", changes: { counts: { "/a": ["x", 2] } } }] };
    expect(parseStoredHistory(JSON.stringify(badPair))).toEqual(emptyHistory());
  });

  it("keeps the position within the entries", () => {
    const entry = { id: "a", at: 1, type: "edit", group: null, changes: { counts: { "/a": [0, 1] } } };
    expect(parseStoredHistory(JSON.stringify({ version: 1, entries: [entry], position: 7 })).position).toBe(1);
    expect(parseStoredHistory(JSON.stringify({ version: 1, entries: [entry] })).position).toBe(1);
  });

  it("falls back to the latest entries when storage is full", () => {
    const { history } = run(start(), ...Array.from({ length: 8 }, () => edit("/Braton/Barrel", 1, { wait: MERGE_WINDOW_MS + 1 })));
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    saveHistory(history);
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY)).entries).toHaveLength(5);
  });
});

describe("countChanges", () => {
  it("counts everything an entry touched", () => {
    const state = run(start(data({ "/Braton/Barrel": 1, "/Braton/Stock": 2 })), { type: "build", set: braton });
    expect(countChanges(state.history.entries[0])).toBe(4);
  });
});
