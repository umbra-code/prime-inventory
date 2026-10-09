// Shared by scripts/build-catalog.mjs (Node) and the in-app catalog refresh
// (browser), so both sources produce the exact same shape.

/** Bump when the catalog shape changes so cached catalogs in the old shape are ignored. */
export const CATALOG_FORMAT = 2;

const RARITY_ORDER = { Common: 0, Uncommon: 1, Rare: 2 };
const TIER_ORDER = { Lith: 0, Meso: 1, Neo: 2, Axi: 3 };

// @wfcd/items labels relic rarity unreliably (commons come as "Uncommon"), but
// the Intact drop chance is exact: 25.33% common, 11% uncommon, 2% rare.
const rarityFromIntactChance = (chance) =>
  chance >= 20 ? "Common" : chance >= 5 ? "Uncommon" : "Rare";

// Intact drops have no refinement suffix: "Axi S8 Relic" (vs "Axi S8 Relic (Radiant)").
const INTACT_RELIC_DROP = /^(.+) Relic$/;

/** Names of relics that currently drop, e.g. "Axi S8". */
const getAvailableRelics = (items) =>
  new Set(
    items
      .filter((item) => item.category === "Relics" && item.vaulted === false)
      .map((relic) => relic.name.match(/^(.+) Intact$/)?.[1])
      .filter(Boolean)
  );

const compareRelics = (a, b) =>
  Number(Boolean(b.available)) - Number(Boolean(a.available)) ||
  RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] ||
  (TIER_ORDER[a.name.split(" ")[0]] ?? 9) - (TIER_ORDER[b.name.split(" ")[0]] ?? 9) ||
  a.name.localeCompare(b.name, "en", { numeric: true });

const getRelics = (drops = [], availableRelics) => {
  const relics = new Map();
  for (const drop of drops) {
    const name = drop.location.match(INTACT_RELIC_DROP)?.[1];
    if (!name || relics.has(name)) continue;
    const relic = { name, rarity: rarityFromIntactChance(drop.chance) };
    // Only flag available relics, to keep the catalog small.
    if (availableRelics.has(name)) relic.available = true;
    relics.set(name, relic);
  }
  return [...relics.values()].sort(compareRelics);
};

const consolidateComponents = (components, availableRelics) => {
  const byUniqueName = new Map();

  for (const comp of components) {
    if (!comp.tradable) continue;
    const existing = byUniqueName.get(comp.uniqueName);
    if (existing) {
      existing.required += comp.itemCount || 1;
    } else {
      byUniqueName.set(comp.uniqueName, {
        uniqueName: comp.uniqueName,
        name: comp.name,
        imageName: comp.imageName,
        required: comp.itemCount || 1,
        ducats: comp.ducats ?? 0,
        relics: getRelics(comp.drops, availableRelics),
      });
    }
  }

  return [...byUniqueName.values()];
};

/**
 * Reduces raw @wfcd/items entries (including the Relics category) to the
 * Prime sets the app tracks: Prime items (not mods) with at least one
 * tradable component.
 *
 * A set counts as vaulted only when @wfcd/items marks it vaulted AND none of
 * its relics currently drop: each source has known errors on its own.
 */
export const slimCatalog = (items) => {
  const availableRelics = getAvailableRelics(items);

  return items
    .filter((item) => item.isPrime && item.category !== "Mods" && item.components?.length)
    .map((item) => {
      const components = consolidateComponents(item.components, availableRelics);
      const hasAvailableRelic = components.some((part) => part.relics.some((r) => r.available));
      return {
        uniqueName: item.uniqueName,
        name: item.name,
        category: item.category,
        imageName: item.imageName,
        vaulted: Boolean(item.vaulted) && !hasAvailableRelic,
        components,
      };
    })
    .filter((set) => set.components.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
};
