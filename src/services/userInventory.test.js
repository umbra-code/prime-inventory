import { beforeEach, describe, expect, it, vi } from "vitest";
import { akbronco, ash, catalogSets, createStorage, fullCounts } from "@/test/fixtures";
import {
  emptyUserData,
  getOwnedCounts,
  isSetComplete,
  loadUserData,
  normalizeUserData,
  parseStoredUserData,
  saveUserData,
  STORAGE_KEY,
  summarizeSet,
  toExportFile,
  userDataReducer,
} from "./userInventory";

const reduce = (state, ...actions) => actions.reduce(userDataReducer, state);

describe("summarizeSet", () => {
  it("reports progress by parts and the missing count", () => {
    const owned = getOwnedCounts(akbronco, { "/Parts/AkbroncoPrimeLink": 1 });
    expect(summarizeSet(akbronco, owned, false)).toMatchObject({
      progress: (1 / 3) * 100,
      missing: 2,
      status: "incomplete",
    });
  });

  it("does not count parts above the required amount", () => {
    const owned = getOwnedCounts(akbronco, { "/Parts/AkbroncoPrimeLink": 5 });
    expect(summarizeSet(akbronco, owned, false).missing).toBe(1);
  });

  it("values a full set in ducats", () => {
    // Akbronco: Blueprint 1 x 15 + Link 2 x 15
    expect(summarizeSet(akbronco, [0, 0], false).ducats).toBe(45);
  });

  it("counts only parts above the requirement as spare while not mastered", () => {
    expect(summarizeSet(akbronco, [1, 3], false).spareDucats).toBe(15);
    expect(summarizeSet(akbronco, [1, 2], false).spareDucats).toBe(0);
  });

  it("counts every owned part as spare once the set is mastered", () => {
    expect(summarizeSet(akbronco, [1, 3], true).spareDucats).toBe(60);
    expect(summarizeSet(ash, [0, 1], true).spareDucats).toBe(45);
  });

  it("is ready when complete and not mastered, extra when mastered", () => {
    const owned = getOwnedCounts(ash, fullCounts(ash));
    expect(summarizeSet(ash, owned, false).status).toBe("ready");
    expect(summarizeSet(ash, owned, true).status).toBe("extra");
  });
});

describe("userDataReducer", () => {
  it("setCount stores positive counts and removes zero or negative ones", () => {
    const state = reduce(
      emptyUserData(),
      { type: "setCount", uniqueName: "a", count: 3 },
      { type: "setCount", uniqueName: "b", count: -2 },
      { type: "setCount", uniqueName: "c", count: Number.NaN }
    );
    expect(state.counts).toEqual({ a: 3 });
    expect(reduce(state, { type: "setCount", uniqueName: "a", count: 0 }).counts).toEqual({});
  });

  it("adjustCount is relative and never goes below zero", () => {
    const state = reduce(
      emptyUserData(),
      { type: "adjustCount", uniqueName: "a", delta: 1 },
      { type: "adjustCount", uniqueName: "a", delta: 1 },
      { type: "adjustCount", uniqueName: "b", delta: -1 }
    );
    expect(state.counts).toEqual({ a: 2 });
  });

  it("toggleMastery flips the set's mastery", () => {
    const on = reduce(emptyUserData(), { type: "toggleMastery", set: ash });
    expect(on.mastered).toEqual({ [ash.uniqueName]: true });
    expect(reduce(on, { type: "toggleMastery", set: ash }).mastered).toEqual({});
  });

  it("toggleArsenal flips whether the set is kept, independently of mastery", () => {
    const on = reduce(emptyUserData(), { type: "toggleArsenal", set: ash });
    expect(on).toEqual({ counts: {}, mastered: {}, arsenal: { [ash.uniqueName]: true } });
    expect(reduce(on, { type: "toggleArsenal", set: ash }).arsenal).toEqual({});
  });

  it("build consumes one set of parts, masters it and puts it in the arsenal", () => {
    const state = reduce({ ...emptyUserData(), counts: fullCounts(akbronco, 1) }, { type: "build", set: akbronco });
    expect(state.counts).toEqual({ "/Parts/AkbroncoPrimeBlueprint": 1, "/Parts/AkbroncoPrimeLink": 1 });
    expect(state.mastered[akbronco.uniqueName]).toBe(true);
    expect(state.arsenal[akbronco.uniqueName]).toBe(true);
  });

  it("sell consumes parts without touching mastery or the arsenal", () => {
    const state = reduce({ ...emptyUserData(), counts: fullCounts(ash) }, { type: "sell", set: ash });
    expect(state).toEqual(emptyUserData());
  });

  it("build and sell are no-ops on incomplete sets", () => {
    const state = { counts: { "/Parts/AshPrimeBlueprint": 1 }, mastered: {} };
    expect(userDataReducer(state, { type: "build", set: ash })).toBe(state);
    expect(userDataReducer(state, { type: "sell", set: ash })).toBe(state);
  });

  it("restoreSet undoes a build for that set only", () => {
    const before = { counts: { ...fullCounts(ash), other: 4 }, mastered: {}, arsenal: {} };
    const previous = { counts: getOwnedCounts(ash, before.counts), isMastered: false, inArsenal: false };
    const built = reduce(before, { type: "build", set: ash }, { type: "setCount", uniqueName: "other", count: 9 });
    const restored = reduce(built, { type: "restoreSet", set: ash, ...previous });
    expect(restored).toEqual({ counts: { ...fullCounts(ash), other: 9 }, mastered: {}, arsenal: {} });
  });

  it("replace and reset swap the whole inventory", () => {
    const data = { counts: { a: 1 }, mastered: {} };
    expect(userDataReducer(emptyUserData(), { type: "replace", userData: data })).toBe(data);
    expect(userDataReducer(data, { type: "reset" })).toEqual(emptyUserData());
  });

  it("throws on unknown actions", () => {
    expect(() => userDataReducer(emptyUserData(), { type: "nope" })).toThrow(/nope/);
  });
});

describe("normalizeUserData", () => {
  it("reads the current v2 format", () => {
    const raw = { version: 2, counts: { a: 2 }, mastered: [ash.uniqueName], arsenal: [akbronco.uniqueName] };
    expect(normalizeUserData(raw, catalogSets)).toEqual({
      counts: { a: 2 },
      mastered: { [ash.uniqueName]: true },
      arsenal: { [akbronco.uniqueName]: true },
    });
  });

  it("reads v2 data saved before the arsenal existed", () => {
    const raw = { version: 2, counts: { a: 2 }, mastered: [ash.uniqueName] };
    expect(normalizeUserData(raw, catalogSets).arsenal).toEqual({});
  });

  it("migrates v1 storage, mapping set names and keeping unknown parts", () => {
    const raw = {
      masteredSets: ["Ash Prime", "Removed Prime"],
      partCounts: [
        { uniqueName: "/Parts/AshPrimeChassis", userCount: 2 },
        { uniqueName: "/Old/Part", userCount: 1 },
        { uniqueName: "/Bad", userCount: -3 },
      ],
    };
    expect(normalizeUserData(raw, catalogSets)).toEqual({
      counts: { "/Parts/AshPrimeChassis": 2, "/Old/Part": 1 },
      mastered: { [ash.uniqueName]: true },
      arsenal: {},
    });
  });

  it("migrates v1 exports (the full inventory array)", () => {
    const raw = [
      { ...ash, isMastered: true, components: ash.components.map((p) => ({ ...p, userCount: 1 })) },
      { ...akbronco, isMastered: false, components: [] },
    ];
    expect(normalizeUserData(raw, catalogSets)).toEqual({
      counts: fullCounts(ash),
      mastered: { [ash.uniqueName]: true },
      arsenal: {},
    });
  });

  it.each([null, undefined, 42, "x", {}, { version: 3 }, [{ nope: true }]])(
    "rejects unrecognized data: %j",
    (raw) => {
      expect(normalizeUserData(raw, catalogSets)).toBeNull();
    }
  );

  it("round-trips export files", () => {
    const data = {
      counts: fullCounts(akbronco),
      mastered: { [ash.uniqueName]: true },
      arsenal: { [akbronco.uniqueName]: true },
    };
    const file = JSON.parse(JSON.stringify(toExportFile(data)));
    expect(file.app).toBe("prime-inventory");
    expect(normalizeUserData(file, catalogSets)).toEqual(data);
  });
});

describe("storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
    return () => vi.unstubAllGlobals();
  });

  it("saves and loads the same data", () => {
    const data = { counts: { a: 2 }, mastered: { [ash.uniqueName]: true }, arsenal: { [ash.uniqueName]: true } };
    saveUserData(data);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).version).toBe(2);
    expect(loadUserData(catalogSets)).toEqual(data);
  });

  it("loads an empty inventory when nothing is stored", () => {
    expect(loadUserData(catalogSets)).toEqual(emptyUserData());
  });

  it("treats unreadable stored values as empty", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseStoredUserData("{not json", catalogSets)).toEqual(emptyUserData());
    expect(parseStoredUserData(null, catalogSets)).toEqual(emptyUserData());
  });
});

describe("isSetComplete", () => {
  it("needs every component at its required amount", () => {
    expect(isSetComplete(akbronco, { "/Parts/AkbroncoPrimeBlueprint": 1, "/Parts/AkbroncoPrimeLink": 1 })).toBe(false);
    expect(isSetComplete(akbronco, fullCounts(akbronco))).toBe(true);
  });
});
