import bundledCatalog from "@/data/primes.json";
import { slimCatalog } from "@/lib/slimCatalog.mjs";

// Catalog sources, in order of preference:
//   1. A newer @wfcd/items release downloaded from jsDelivr (checked at most daily)
//   2. The last downloaded copy, cached in localStorage
//   3. The catalog bundled at build time (always available, works offline)

const CACHE_KEY = "primeCatalog";
const CHECKED_AT_KEY = "primeCatalogCheckedAt";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 30 * 1000;

const PACKAGE = "@wfcd/items";
const LATEST_VERSION_URL = `https://data.jsdelivr.com/v1/packages/npm/${PACKAGE}/resolved?specifier=latest`;
const dataUrl = (version, file) =>
  `https://cdn.jsdelivr.net/npm/${PACKAGE}@${version}/data/json/${file}.json`;

// Category files that contain Prime sets; they also resolve sets used as
// components (e.g. Bronco Prime inside Akbronco Prime).
const CATEGORY_FILES = [
  "Primary",
  "Secondary",
  "Melee",
  "Warframes",
  "Sentinels",
  "Arch-Gun",
  "Arch-Melee",
  "Archwing",
];

export const compareVersions = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
};

const isValidCatalog = (catalog) =>
  typeof catalog?.version === "string" &&
  Array.isArray(catalog.sets) &&
  // Guard against truncated or broken upstream data.
  catalog.sets.length >= bundledCatalog.sets.length * 0.9;

const readCachedCatalog = () => {
  try {
    const catalog = JSON.parse(localStorage.getItem(CACHE_KEY));
    return isValidCatalog(catalog) ? catalog : null;
  } catch {
    return null;
  }
};

/** Newest catalog available without network access. */
export const getInitialCatalog = () => {
  const cached = readCachedCatalog();
  return cached && compareVersions(cached.version, bundledCatalog.version) > 0
    ? cached
    : bundledCatalog;
};

const fetchJson = async (url, signal) => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return response.json();
};

// Mirrors @wfcd/items' own component resolution: component refs only carry
// uniqueName + itemCount, the details live in Components.json or the category files.
const resolveComponents = (items, componentsCatalog) => {
  const byUniqueName = new Map(componentsCatalog.map((entry) => [entry.uniqueName, entry]));
  for (const item of items) byUniqueName.set(item.uniqueName, item);

  return items.map((item) => ({
    ...item,
    components: item.components?.map((ref) => {
      const entry = ref.name ? null : byUniqueName.get(ref.uniqueName);
      return entry ? { ...entry, itemCount: ref.itemCount ?? 1 } : ref;
    }),
  }));
};

/** Downloads and slims the given @wfcd/items release. */
export const downloadCatalog = async (version, signal) => {
  const [componentsCatalog, ...categories] = await Promise.all(
    ["Components", ...CATEGORY_FILES].map((file) => fetchJson(dataUrl(version, file), signal))
  );
  const items = resolveComponents(categories.flat(), componentsCatalog);
  return { version, generatedAt: new Date().toISOString(), sets: slimCatalog(items) };
};

/**
 * Resolves with a newer catalog than `current` when one has been published,
 * or null when there is nothing new, it was checked recently, or the network fails.
 */
export const refreshCatalog = async (current) => {
  try {
    const checkedAt = Number(localStorage.getItem(CHECKED_AT_KEY));
    if (Date.now() - checkedAt < CHECK_INTERVAL_MS) return null;

    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    const { version } = await fetchJson(LATEST_VERSION_URL, signal);
    if (compareVersions(version, current.version) <= 0) {
      localStorage.setItem(CHECKED_AT_KEY, String(Date.now()));
      return null;
    }

    const catalog = await downloadCatalog(version, signal);
    if (!isValidCatalog(catalog)) throw new Error(`Invalid catalog for ${version}`);

    localStorage.setItem(CACHE_KEY, JSON.stringify(catalog));
    localStorage.setItem(CHECKED_AT_KEY, String(Date.now()));
    return catalog;
  } catch (error) {
    // Offline or upstream problems are expected; keep using the current catalog.
    console.warn("Catalog refresh skipped:", error);
    return null;
  }
};
