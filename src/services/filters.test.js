import { afterEach, describe, expect, it, vi } from "vitest";
import { akbronco, ash, braton, catalogSets, createStorage } from "@/test/fixtures";
import {
  filterAndSortSets,
  getCategories,
  loadFilters,
  matchesStatus,
  saveFilters,
} from "./filters";

// Akbronco: extra set; Ash: 50% incomplete; Braton: 75% incomplete and mastered.
const summaries = new Map([
  [akbronco.uniqueName, { status: "extra", progress: 100, missing: 0, isMastered: true }],
  [ash.uniqueName, { status: "incomplete", progress: 50, missing: 1, isMastered: false }],
  [braton.uniqueName, { status: "incomplete", progress: 75, missing: 1, isMastered: true }],
]);

const names = (sets) => sets.map((set) => set.name);
const query = (overrides) =>
  names(
    filterAndSortSets(catalogSets, summaries, {
      search: "",
      category: "All",
      status: "All",
      sort: "Name",
      ...overrides,
    })
  );

describe("matchesStatus", () => {
  it.each([
    ["Ready to Build", { status: "ready" }, true],
    ["Ready to Build", { status: "extra" }, false],
    ["Extra Sets", { status: "extra" }, true],
    ["Almost Complete", { status: "incomplete", progress: 75 }, true],
    ["Almost Complete", { status: "incomplete", progress: 74.9 }, false],
    ["Almost Complete", { status: "ready", progress: 100 }, false],
    ["Incomplete", { status: "incomplete", progress: 0 }, true],
    ["Mastered", { status: "incomplete", isMastered: true }, true],
    ["All", { status: "incomplete" }, true],
  ])("%s matches %j: %s", (filter, summary, expected) => {
    expect(matchesStatus(filter, summary)).toBe(expected);
  });
});

describe("filterAndSortSets", () => {
  it("searches by name, case-insensitively and ignoring outer spaces", () => {
    expect(query({ search: "  ASH " })).toEqual(["Ash Prime"]);
  });

  it("filters by category and status", () => {
    expect(query({ category: "Primary" })).toEqual(["Braton Prime"]);
    expect(query({ status: "Almost Complete" })).toEqual(["Braton Prime"]);
    expect(query({ status: "Mastered" })).toEqual(["Akbronco Prime", "Braton Prime"]);
  });

  it("sorts by progress, highest first", () => {
    expect(query({ sort: "Progress" })).toEqual(["Akbronco Prime", "Braton Prime", "Ash Prime"]);
  });

  it("sorts ready-first: ready, extra, then incomplete by progress", () => {
    const withReady = new Map(summaries).set(ash.uniqueName, { status: "ready", progress: 100 });
    const sorted = filterAndSortSets(catalogSets, withReady, {
      search: "",
      category: "All",
      status: "All",
      sort: "Ready First",
    });
    expect(names(sorted)).toEqual(["Ash Prime", "Akbronco Prime", "Braton Prime"]);
  });

  it("does not reorder the catalog array", () => {
    query({ sort: "Progress" });
    expect(names(catalogSets)).toEqual(["Akbronco Prime", "Ash Prime", "Braton Prime"]);
  });
});

describe("getCategories", () => {
  it("lists unique categories after All", () => {
    expect(getCategories([...catalogSets, ash])).toEqual(["All", "Secondary", "Warframes", "Primary"]);
  });
});

describe("saved filters", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("round-trips valid filters", () => {
    vi.stubGlobal("localStorage", createStorage());
    const filters = { category: "Primary", status: "Extra Sets", sort: "Progress" };
    saveFilters(filters);
    expect(loadFilters(getCategories(catalogSets))).toEqual(filters);
  });

  it("falls back to defaults for unknown or missing values", () => {
    vi.stubGlobal("localStorage", createStorage());
    saveFilters({ category: "Gone", status: "Buildable", sort: "Random" });
    expect(loadFilters(["All"])).toEqual({ category: "All", status: "All", sort: "Name" });
  });

  it("survives storage being unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => saveFilters({ category: "All", status: "All", sort: "Name" })).not.toThrow();
    expect(loadFilters(["All"])).toEqual({ category: "All", status: "All", sort: "Name" });
  });
});
