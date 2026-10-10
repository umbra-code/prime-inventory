import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStorage } from "@/test/fixtures";
import { findPrice, getCachedPrices, marketUrl, parsePrices, refreshPrices } from "./prices";

const CACHE_KEY = "primePrices";
const NOW = Date.parse("2026-10-10T12:00:00Z");
const HOUR = 60 * 60 * 1000;

const entry = (name, avg = "10.5", sold = "20") => ({ name, yesterday_vol: sold, today_vol: "3", custom_avg: avg });
// The real file has several hundred entries; parsePrices rejects much smaller ones.
const response = (...entries) => [...entries, ...Array.from({ length: 320 }, (_, i) => entry(`Filler ${i} Prime Set`))];

const mockFetch = (body, { ok = true, fail = false } = {}) => {
  const fetch = vi.fn(async () => {
    if (fail) throw new TypeError("Failed to fetch");
    return { ok, status: ok ? 200 : 503, json: async () => body };
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

describe("parsePrices", () => {
  it("keeps the average and yesterday's sales of each item", () => {
    const prices = parsePrices(response(entry("Ivara Prime Set", "58.6", "105")));
    expect(prices["Ivara Prime Set"]).toEqual([58.6, 105]);
  });

  it("skips entries without a usable price", () => {
    const prices = parsePrices(response(entry("No Price Prime Set", ""), entry("Zero Prime Set", "0"), { name: 5 }, null));
    expect(prices["No Price Prime Set"]).toBeUndefined();
    expect(prices["Zero Prime Set"]).toBeUndefined();
  });

  it("rejects unexpected or truncated data", () => {
    expect(parsePrices({ error: "Not found" })).toBeNull();
    expect(parsePrices([entry("Ivara Prime Set")])).toBeNull();
  });
});

describe("refreshPrices", () => {
  it("downloads and caches prices", async () => {
    const fetch = mockFetch(response(entry("Ivara Prime Set", "58.6", "105")));
    const prices = await refreshPrices({ now: NOW });
    expect(prices["Ivara Prime Set"]).toEqual([58.6, 105]);
    expect(getCachedPrices()).toEqual(prices);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("does not download again for a few hours", async () => {
    mockFetch(response(entry("Ivara Prime Set")));
    await refreshPrices({ now: NOW });
    const fetch = mockFetch(response(entry("Ivara Prime Set", "99")));

    expect(await refreshPrices({ now: NOW + 5 * HOUR })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();

    expect((await refreshPrices({ now: NOW + 7 * HOUR }))["Ivara Prime Set"][0]).toBe(99);
  });

  it("keeps the cached prices when the download fails or is not valid", async () => {
    mockFetch(response(entry("Ivara Prime Set", "58.6")));
    await refreshPrices({ now: NOW });

    mockFetch(null, { fail: true });
    expect(await refreshPrices({ now: NOW + 7 * HOUR })).toBeNull();
    mockFetch(null, { ok: false });
    expect(await refreshPrices({ now: NOW + 7 * HOUR })).toBeNull();
    mockFetch({ error: "Not found" });
    expect(await refreshPrices({ now: NOW + 7 * HOUR })).toBeNull();

    expect(getCachedPrices()["Ivara Prime Set"][0]).toBe(58.6);
  });

  it("ignores a broken cache", async () => {
    localStorage.setItem(CACHE_KEY, "{not json");
    expect(getCachedPrices()).toBeNull();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items: [] }));
    expect(getCachedPrices()).toBeNull();
  });
});

describe("findPrice", () => {
  const prices = {
    "Ivara Prime Set": [58.6, 105],
    "Ivara Prime Systems Blueprint": [10.2, 64],
    "Ivara Prime Blueprint": [6, 30],
    "Braton Prime Barrel": [4, 12],
    "Bronco Prime Set": [15, 9],
    "Akbronco Prime Link": [8, 5],
  };
  const ivara = { name: "Ivara Prime" };
  const akbronco = { name: "Akbronco Prime" };

  it("finds a set", () => {
    expect(findPrice(prices, ivara)).toEqual({ name: "Ivara Prime Set", average: 58.6, sold: 105 });
  });

  it("finds parts, with or without the Blueprint suffix", () => {
    expect(findPrice(prices, ivara, { name: "Systems" }).name).toBe("Ivara Prime Systems Blueprint");
    expect(findPrice(prices, ivara, { name: "Blueprint" }).name).toBe("Ivara Prime Blueprint");
    expect(findPrice(prices, { name: "Braton Prime" }, { name: "Barrel" }).name).toBe("Braton Prime Barrel");
  });

  it("prices a part that is a set of its own as that set", () => {
    expect(findPrice(prices, akbronco, { name: "Bronco Prime" }).name).toBe("Bronco Prime Set");
    expect(findPrice(prices, akbronco, { name: "Link" }).name).toBe("Akbronco Prime Link");
  });

  it("returns null without prices or for unknown items", () => {
    expect(findPrice(null, ivara)).toBeNull();
    expect(findPrice(prices, { name: "Newest Prime" })).toBeNull();
    expect(findPrice(prices, ivara, { name: "Chassis" })).toBeNull();
  });
});

describe("marketUrl", () => {
  it("builds the item page address", () => {
    expect(marketUrl("Ivara Prime Systems Blueprint")).toBe("https://warframe.market/items/ivara_prime_systems_blueprint");
    expect(marketUrl("Silva & Aegis Prime Set")).toBe("https://warframe.market/items/silva_and_aegis_prime_set");
  });
});
