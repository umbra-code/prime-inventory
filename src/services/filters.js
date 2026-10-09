// Search, status filters and sorting for the Prime set grid. Works on set
// summaries from summarizeSet() plus isMastered.

const FILTERS_KEY = "primeInventoryFilters";
const ALMOST_COMPLETE_PERCENT = 75;

export const statusFilters = [
  "All",
  "Ready to Build",
  "Extra Sets",
  "Almost Complete",
  "Incomplete",
  "Mastered",
];

export const matchesStatus = (filter, { status, progress, isMastered }) => {
  switch (filter) {
    case "Ready to Build":
      return status === "ready";
    case "Extra Sets":
      return status === "extra";
    case "Almost Complete":
      return status === "incomplete" && progress >= ALMOST_COMPLETE_PERCENT;
    case "Incomplete":
      return status === "incomplete";
    case "Mastered":
      return isMastered;
    default:
      return true;
  }
};

const STATUS_RANK = { ready: 0, extra: 1, incomplete: 2 };

// The catalog is already sorted by name and Array#sort is stable, so ties keep name order.
const comparators = {
  Name: null,
  Progress: (a, b) => b.progress - a.progress,
  "Ready First": (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.progress - a.progress,
};

export const sortOptions = Object.keys(comparators);

export const getCategories = (sets) => ["All", ...new Set(sets.map((set) => set.category))];

/** Sets matching the filters, in the requested order. `summaries` is keyed by set uniqueName. */
export const filterAndSortSets = (sets, summaries, { search, category, status, sort }) => {
  const term = search.trim().toLowerCase();
  const result = sets.filter(
    (set) =>
      set.name.toLowerCase().includes(term) &&
      (category === "All" || set.category === category) &&
      matchesStatus(status, summaries.get(set.uniqueName))
  );
  const compare = comparators[sort];
  return compare
    ? result.sort((a, b) => compare(summaries.get(a.uniqueName), summaries.get(b.uniqueName)))
    : result;
};

/** Saved category/status/sort, falling back to defaults for unknown values. */
export const loadFilters = (categories) => {
  try {
    const { category, status, sort } = JSON.parse(localStorage.getItem(FILTERS_KEY)) ?? {};
    return {
      category: categories.includes(category) ? category : "All",
      status: statusFilters.includes(status) ? status : "All",
      sort: sortOptions.includes(sort) ? sort : "Name",
    };
  } catch {
    return { category: "All", status: "All", sort: "Name" };
  }
};

export const saveFilters = (filters) => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Filters are a convenience; ignore storage failures.
  }
};
