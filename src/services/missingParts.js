import { getCount } from "./userInventory";

// Parts still needed to build the sets that are not mastered yet, grouped by
// the relics that can drop them right now.

const RARITY_ORDER = { Common: 0, Uncommon: 1, Rare: 2 };
const TIER_ORDER = { Lith: 0, Meso: 1, Neo: 2, Axi: 3 };

const tierOf = (relicName) => TIER_ORDER[relicName.split(" ")[0]] ?? 9;

/** One entry per part of a non-mastered set that is short of its requirement. */
export const getMissingParts = (sets, { counts, mastered }) =>
  sets.flatMap((set) =>
    mastered[set.uniqueName]
      ? []
      : set.components
          .map((part) => ({ set, part, missing: part.required - getCount(counts, part.uniqueName) }))
          .filter((entry) => entry.missing > 0)
  );

const compareEntries = (a, b) =>
  RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] ||
  a.set.name.localeCompare(b.set.name, "en") ||
  a.part.name.localeCompare(b.part.name, "en");

const averageRarity = (group) =>
  group.entries.reduce((sum, entry) => sum + RARITY_ORDER[entry.rarity], 0) / group.entries.length;

// More needed parts first, then easier drops, then lower tiers, then name.
const compareRelicGroups = (a, b) =>
  b.entries.length - a.entries.length ||
  averageRarity(a) - averageRarity(b) ||
  tierOf(a.name) - tierOf(b.name) ||
  a.name.localeCompare(b.name, "en", { numeric: true });

/**
 * Groups missing parts by the available relics that drop them.
 * - `relics`: available relics, each with the missing parts it can drop.
 * - `vaultedOnly`: missing parts that no available relic drops (including
 *   parts without any known relic).
 */
export const groupMissingPartsByRelic = (sets, userData) => {
  const missingParts = getMissingParts(sets, userData);
  const relics = new Map();
  const vaultedOnly = [];

  for (const entry of missingParts) {
    const available = (entry.part.relics ?? []).filter((relic) => relic.available);
    if (available.length === 0) {
      vaultedOnly.push(entry);
      continue;
    }
    for (const relic of available) {
      if (!relics.has(relic.name)) relics.set(relic.name, { name: relic.name, entries: [] });
      relics.get(relic.name).entries.push({ ...entry, rarity: relic.rarity });
    }
  }

  for (const group of relics.values()) group.entries.sort(compareEntries);

  return {
    totalParts: missingParts.reduce((sum, entry) => sum + entry.missing, 0),
    totalSets: new Set(missingParts.map((entry) => entry.set.uniqueName)).size,
    relics: [...relics.values()].sort(compareRelicGroups),
    vaultedOnly: vaultedOnly.sort(
      (a, b) =>
        a.set.name.localeCompare(b.set.name, "en") || a.part.name.localeCompare(b.part.name, "en")
    ),
  };
};
