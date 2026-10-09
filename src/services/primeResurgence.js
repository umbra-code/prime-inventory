// Prime Resurgence: the Primes Varzia sells at Maroo's Bazaar, and until when.
// The rotation's end date comes from the game itself (via warframestat.us),
// so it is exact, not an estimate.

const SOURCE_URL = "https://api.warframestat.us/pc/vaultTrader/?language=en";
const CACHE_KEY = "primeResurgence";
const FETCH_TIMEOUT_MS = 15 * 1000;

// Store entries point to the item they sell:
//   /Lotus/StoreItems/Powersuits/Ranger/IvaraPrime → /Lotus/Powersuits/Ranger/IvaraPrime
const itemUniqueName = (storeUniqueName) => storeUniqueName?.replace("/StoreItems/", "/");

// Fallback for entries whose path does not match: "Prime Velox Pistol" → "Velox Prime".
const candidateNames = (name) => {
  const match = name.match(/^Prime (.+)$/);
  if (!match) return [name];
  const words = match[1].split(" ");
  return words.map((_, i) => `${words.slice(0, words.length - i).join(" ")} Prime`);
};

const isCurrent = (offer, now) =>
  Date.parse(offer.activation) <= now && now < Date.parse(offer.expiry);

const isValidOffer = (offer) =>
  typeof offer?.activation === "string" &&
  typeof offer.expiry === "string" &&
  Array.isArray(offer.items) &&
  !Number.isNaN(Date.parse(offer.expiry));

/** Keeps only what the app uses from the API response. */
export const slimOffer = (trader) => ({
  activation: trader.activation,
  expiry: trader.expiry,
  location: trader.location,
  items: (trader.inventory ?? []).map(({ uniqueName, item }) => ({ uniqueName, name: item })),
});

/** Catalog sets on offer, in the order Varzia lists them. */
export const matchOfferSets = (offer, sets) => {
  const byUniqueName = new Map(sets.map((set) => [set.uniqueName, set]));
  const byName = new Map(sets.map((set) => [set.name, set]));
  const matched = new Set();
  for (const item of offer.items) {
    const set =
      byUniqueName.get(itemUniqueName(item.uniqueName)) ??
      candidateNames(item.name ?? "").map((name) => byName.get(name)).find(Boolean);
    if (set) matched.add(set);
  }
  return [...matched];
};

const readCachedOffer = () => {
  try {
    const offer = JSON.parse(localStorage.getItem(CACHE_KEY));
    return isValidOffer(offer) ? offer : null;
  } catch {
    return null;
  }
};

/**
 * The current rotation, from the cache while it lasts or from the network.
 * Resolves with null when it cannot be known (offline, API down, between rotations).
 */
export const loadPrimeResurgence = async ({ now = Date.now() } = {}) => {
  const cached = readCachedOffer();
  if (cached && isCurrent(cached, now)) return cached;

  try {
    const response = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`${response.status} fetching ${SOURCE_URL}`);
    const offer = slimOffer(await response.json());
    if (!isValidOffer(offer) || !isCurrent(offer, now)) return null;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(offer));
    } catch {
      // Caching only saves a request.
    }
    return offer;
  } catch (error) {
    console.warn("Prime Resurgence unavailable:", error);
    return null;
  }
};
