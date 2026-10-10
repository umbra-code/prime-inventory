// Platinum prices: the average each set and part sells for on warframe.market,
// as summarized by WFInfo and served by warframestat.us (one small JSON, no
// key, CORS enabled). The app never calls warframe.market itself.
//
// Prices are an extra: they are cached in the browser, refreshed every few
// hours, and simply not shown when they cannot be loaded.

const SOURCE_URL = "https://api.warframestat.us/wfinfo/prices/";
const CACHE_KEY = "primePrices";
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20 * 1000;
// Guards against a truncated or reshaped response replacing good prices.
const MIN_ITEMS = 300;

/** `{ [market item name]: [average platinum, sold yesterday] }` from the raw response. */
export const parsePrices = (raw) => {
  if (!Array.isArray(raw)) return null;
  const items = {};
  for (const entry of raw) {
    const average = Number(entry?.custom_avg);
    if (typeof entry?.name !== "string" || !Number.isFinite(average) || average <= 0) continue;
    const sold = Number(entry.yesterday_vol);
    items[entry.name] = [average, Number.isFinite(sold) ? sold : 0];
  }
  return Object.keys(items).length >= MIN_ITEMS ? items : null;
};

const isValidCache = (cache) =>
  Number.isFinite(cache?.fetchedAt) && cache.items && typeof cache.items === "object" && !Array.isArray(cache.items);

const readCache = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY));
    return isValidCache(cache) ? cache : null;
  } catch {
    return null;
  }
};

/** The last prices downloaded in this browser, however old, or null. */
export const getCachedPrices = () => readCache()?.items ?? null;

/**
 * Resolves with fresh prices when the cached ones are due for a refresh, or
 * null when they are recent enough or the download fails.
 */
export const refreshPrices = async ({ now = Date.now() } = {}) => {
  const cache = readCache();
  if (cache && now - cache.fetchedAt < REFRESH_INTERVAL_MS) return null;

  try {
    const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`${response.status} fetching ${SOURCE_URL}`);
    const items = parsePrices(await response.json());
    if (!items) throw new Error("Unexpected price data");
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: now, items }));
    } catch {
      // Caching only saves a download.
    }
    return items;
  } catch (error) {
    console.warn("Prices unavailable:", error);
    return null;
  }
};

// warframe.market names: "Ivara Prime Set", "Braton Prime Barrel", and
// "Ivara Prime Systems Blueprint" for Warframe components. A part that is a
// set of its own (Bronco Prime inside Akbronco Prime) is priced as that set.
const marketNames = (set, part) =>
  part ? [`${set.name} ${part.name}`, `${set.name} ${part.name} Blueprint`, `${part.name} Set`] : [`${set.name} Set`];

/** `{ name, average, sold }` for a set, or for one of its parts, or null when unknown. */
export const findPrice = (prices, set, part) => {
  if (!prices) return null;
  const name = marketNames(set, part).find((candidate) => prices[candidate]);
  if (!name) return null;
  const [average, sold] = prices[name];
  return { name, average, sold };
};

/** The item's page on warframe.market: "Silva & Aegis Prime Set" → …/items/silva_and_aegis_prime_set */
export const marketUrl = (name) =>
  `https://warframe.market/items/${name.toLowerCase().replaceAll("&", "and").replace(/\s+/g, "_")}`;
