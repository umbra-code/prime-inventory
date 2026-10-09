import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bundledCatalog from "@/data/primes.json";
import { createStorage } from "@/test/fixtures";
import { compareVersions, getInitialCatalog, refreshCatalog } from "./catalog";

const CACHE_KEY = "primeCatalog";
const CHECKED_AT_KEY = "primeCatalogCheckedAt";
const DAY = 24 * 60 * 60 * 1000;

// Raw @wfcd/items data the way jsDelivr serves it: components are refs that
// get their details from Components.json.
const rawItems = (count) =>
  Array.from({ length: count }, (_, i) => ({
    uniqueName: `/Items/Test${i}`,
    name: `Test ${String(i).padStart(3, "0")} Prime`,
    category: "Primary",
    isPrime: true,
    components: [{ uniqueName: `/Parts/Test${i}Barrel`, itemCount: 2 }],
  }));
const rawComponents = (count) =>
  Array.from({ length: count }, (_, i) => ({
    uniqueName: `/Parts/Test${i}Barrel`,
    name: "Barrel",
    imageName: "barrel.png",
    tradable: true,
    ducats: 45,
  }));

const mockFetch = ({ latest = "999.0.0", sets = bundledCatalog.sets.length, fail = false } = {}) => {
  const fetch = vi.fn(async (url) => {
    if (fail) throw new TypeError("Failed to fetch");
    let body;
    if (url.includes("data.jsdelivr.com")) body = { version: latest };
    else if (url.endsWith("/Components.json")) body = rawComponents(sets);
    else if (url.endsWith("/Primary.json")) body = rawItems(sets);
    else body = [];
    return { ok: true, json: async () => body };
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorage());
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("compareVersions", () => {
  it.each([
    ["1.1276.18", "1.1276.9", 1],
    ["1.1276.18", "1.1276.18", 0],
    ["1.999.0", "2.0.0", -1],
    ["1.2", "1.2.0", 0],
  ])("%s vs %s -> %i", (a, b, expected) => {
    expect(compareVersions(a, b)).toBe(expected);
  });
});

describe("bundled catalog", () => {
  it("has a version and well-formed sets", () => {
    expect(bundledCatalog.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(bundledCatalog.sets.length).toBeGreaterThan(100);
    const uniqueNames = new Set(bundledCatalog.sets.map((set) => set.uniqueName));
    expect(uniqueNames.size).toBe(bundledCatalog.sets.length);
    for (const set of bundledCatalog.sets) {
      expect(set.components.length).toBeGreaterThan(0);
      for (const part of set.components) expect(part.required).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("getInitialCatalog", () => {
  const cache = (catalog) => localStorage.setItem(CACHE_KEY, JSON.stringify(catalog));

  it("uses the bundled catalog when nothing is cached", () => {
    expect(getInitialCatalog()).toBe(bundledCatalog);
  });

  it("prefers a cached catalog from a newer release", () => {
    cache({ ...bundledCatalog, version: "999.0.0" });
    expect(getInitialCatalog().version).toBe("999.0.0");
  });

  it("ignores cached catalogs in an older format", () => {
    cache({ ...bundledCatalog, version: "999.0.0", format: bundledCatalog.format - 1 });
    expect(getInitialCatalog()).toBe(bundledCatalog);
  });

  it("ignores cached catalogs that are older, truncated or corrupt", () => {
    cache({ ...bundledCatalog, version: "0.0.1" });
    expect(getInitialCatalog()).toBe(bundledCatalog);
    cache({ ...bundledCatalog, version: "999.0.0", sets: bundledCatalog.sets.slice(0, 10) });
    expect(getInitialCatalog()).toBe(bundledCatalog);
    localStorage.setItem(CACHE_KEY, "{oops");
    expect(getInitialCatalog()).toBe(bundledCatalog);
  });
});

describe("refreshCatalog", () => {
  it("skips the network when it checked less than a day ago", async () => {
    const fetch = mockFetch();
    localStorage.setItem(CHECKED_AT_KEY, String(Date.now() - DAY / 2));
    expect(await refreshCatalog(bundledCatalog)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("only checks the version when there is no newer release", async () => {
    const fetch = mockFetch({ latest: bundledCatalog.version });
    expect(await refreshCatalog(bundledCatalog)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Number(localStorage.getItem(CHECKED_AT_KEY))).toBeGreaterThan(0);
  });

  it("downloads, resolves, caches and returns a newer release", async () => {
    const fetch = mockFetch({ latest: "999.0.0" });
    const catalog = await refreshCatalog(bundledCatalog);

    expect(catalog.version).toBe("999.0.0");
    expect(catalog.sets).toHaveLength(bundledCatalog.sets.length);
    expect(catalog.format).toBe(bundledCatalog.format);
    expect(catalog.sets[0].components).toEqual([
      { uniqueName: "/Parts/Test0Barrel", name: "Barrel", imageName: "barrel.png", required: 2, ducats: 45, relics: [] },
    ]);
    expect(fetch.mock.calls.some(([url]) => url.endsWith("/Relics.json"))).toBe(true);
    expect(fetch.mock.calls.some(([url]) => url.includes("@wfcd/items@999.0.0/"))).toBe(true);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY))).toEqual(catalog);
    expect(getInitialCatalog().version).toBe("999.0.0");
  });

  it("rejects a truncated release and keeps checking later", async () => {
    mockFetch({ latest: "999.0.0", sets: 5 });
    expect(await refreshCatalog(bundledCatalog)).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    expect(localStorage.getItem(CHECKED_AT_KEY)).toBeNull();
  });

  it("returns null when offline", async () => {
    mockFetch({ fail: true });
    expect(await refreshCatalog(bundledCatalog)).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });
});
