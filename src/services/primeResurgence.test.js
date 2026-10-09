import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStorage } from "@/test/fixtures";
import { loadPrimeResurgence, matchOfferSets, slimOffer } from "./primeResurgence";

const CACHE_KEY = "primeResurgence";
const NOW = Date.parse("2026-10-09T12:00:00Z");

const trader = (extra = {}) => ({
  id: "631f8c4ac36af423770eaa97",
  activation: "2026-10-01T18:00:00.000Z",
  expiry: "2026-10-29T18:00:00.000Z",
  character: "Varzia",
  location: "Maroo's Bazaar (Mars)",
  inventory: [
    { uniqueName: "/Lotus/Types/StoreItems/Packages/MegaPrimeVault/MPVIvaraPrimeSinglePack", item: "M P V Ivara Prime Single Pack" },
    { uniqueName: "/Lotus/StoreItems/Powersuits/Ranger/IvaraPrime", item: "Ivara Prime" },
    { uniqueName: "/Lotus/StoreItems/Upgrades/Skins/Scarves/IvaraPrimeCape", item: "Ivara Prime Cape" },
    { uniqueName: "/Lotus/StoreItems/Weapons/Tenno/Pistols/PrimeVelox/PrimeVeloxPistol", item: "Prime Velox Pistol" },
  ],
  schedule: [],
  ...extra,
});

const sets = [
  { uniqueName: "/Lotus/Powersuits/Ranger/IvaraPrime", name: "Ivara Prime" },
  { uniqueName: "/Lotus/Weapons/Tenno/Pistols/PrimeVelox/PrimeVeloxPistol", name: "Velox Prime" },
  { uniqueName: "/Lotus/Weapons/Tenno/LongGuns/PrimeBaza/PrimeBazaGun", name: "Baza Prime" },
  { uniqueName: "/Lotus/Powersuits/Odalisk/ProteaPrime", name: "Protea Prime" },
];

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

describe("matchOfferSets", () => {
  it("matches sets by store path and skips packs and cosmetics", () => {
    const matched = matchOfferSets(slimOffer(trader()), sets);
    expect(matched.map((set) => set.name)).toEqual(["Ivara Prime", "Velox Prime"]);
  });

  it("falls back to the name when the path does not match", () => {
    const offer = { items: [{ uniqueName: "/Lotus/StoreItems/Renamed/Baza", name: "Prime Baza Gun" }, { name: "Protea Prime" }] };
    expect(matchOfferSets(offer, sets).map((set) => set.name)).toEqual(["Baza Prime", "Protea Prime"]);
  });

  it("lists each set once", () => {
    const offer = { items: [{ name: "Ivara Prime" }, { uniqueName: "/Lotus/StoreItems/Powersuits/Ranger/IvaraPrime" }] };
    expect(matchOfferSets(offer, sets)).toHaveLength(1);
  });
});

describe("loadPrimeResurgence", () => {
  it("downloads the current rotation and caches it", async () => {
    const fetch = mockFetch(trader());
    const offer = await loadPrimeResurgence({ now: NOW });
    expect(offer).toMatchObject({ expiry: "2026-10-29T18:00:00.000Z", location: "Maroo's Bazaar (Mars)" });
    expect(offer.items).toHaveLength(4);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY))).toEqual(offer);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("uses the cache until the rotation ends", async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(slimOffer(trader())));
    const fetch = mockFetch(trader());
    expect(await loadPrimeResurgence({ now: NOW })).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("downloads again once the cached rotation has ended", async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(slimOffer(trader({ expiry: "2026-10-01T18:00:00.000Z" }))));
    const fetch = mockFetch(trader());
    expect((await loadPrimeResurgence({ now: NOW })).expiry).toBe("2026-10-29T18:00:00.000Z");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("returns null when the API only has an ended rotation", async () => {
    mockFetch(trader({ expiry: "2026-10-08T18:00:00.000Z" }));
    expect(await loadPrimeResurgence({ now: NOW })).toBeNull();
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it("returns null offline or when the API fails", async () => {
    mockFetch(null, { fail: true });
    expect(await loadPrimeResurgence({ now: NOW })).toBeNull();
    mockFetch(null, { ok: false });
    expect(await loadPrimeResurgence({ now: NOW })).toBeNull();
  });

  it("returns null for unexpected data", async () => {
    mockFetch({ error: "Not found" });
    expect(await loadPrimeResurgence({ now: NOW })).toBeNull();
  });
});
