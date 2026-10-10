// "Now in game" highlights, computed from the catalog alone.

const NEWEST_COUNT = 4;

/**
 * - newest: the most recently released Prime sets, newest first.
 * - returned: vaulted sets whose relics drop again right now, by name.
 */
export const getHighlights = (sets, { newestCount = NEWEST_COUNT } = {}) => ({
  newest: sets
    .filter((set) => set.releaseDate)
    .toSorted((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name, "en"))
    .slice(0, newestCount),
  returned: sets.filter((set) => set.returned).toSorted((a, b) => a.name.localeCompare(b.name, "en")),
});

/** Sets the user has not mastered first, keeping each group's order. */
export const masteredLast = (sets, summaries) =>
  sets.toSorted((a, b) => Number(!!summaries.get(a.uniqueName)?.isMastered) - Number(!!summaries.get(b.uniqueName)?.isMastered));
