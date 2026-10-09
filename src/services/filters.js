// Search, status filters and sorting for the Prime set grid. Works on set
// summaries from summarizeSet() plus isMastered and inArsenal.

const FILTERS_KEY = "primeInventoryFilters";
const ALMOST_COMPLETE_PERCENT = 75;

export const statusFilters = [
  "All",
  "Ready to Build",
  "Extra Sets",
  "Almost Complete",
  "Incomplete",
  "Mastered",
  "In Arsenal",
];

export const matchesStatus = (filter, { status, progress, isMastered, inArsenal }) => {
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
    case "In Arsenal":
      return inArsenal;
    default:
      return true;
  }
};

export const availabilityFilters = ["All", "Available", "Vaulted"];

const matchesAvailability = (filter, set) =>
  filter === "All" || (filter === "Vaulted") === set.vaulted;

const STATUS_RANK = { ready: 0, extra: 1, incomplete: 2 };

// The catalog is already sorted by name and Array#sort is stable, so ties keep name order.
const comparators = {
  Name: null,
  Progress: (a, b) => b.progress - a.progress,
  "Ready First": (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.progress - a.progress,
  "Spare Ducats": (a, b) => b.spareDucats - a.spareDucats,
};

export const sortOptions = Object.keys(comparators);

export const layouts = ["cards", "table"];

export const getCategories = (sets) => ["All", ...new Set(sets.map((set) => set.category))];

/** Sets matching the filters, in the requested order. `summaries` is keyed by set uniqueName. */
export const filterAndSortSets = (
  sets,
  summaries,
  { search = "", category = "All", status = "All", availability = "All", sort = "Name", nameOf }
) => {
  const term = search.trim().toLowerCase();
  // Matches the English name and, when given, the displayed (translated) one.
  const matchesSearch = (set) =>
    set.name.toLowerCase().includes(term) || Boolean(nameOf?.(set).toLowerCase().includes(term));
  const result = sets.filter(
    (set) =>
      matchesSearch(set) &&
      (category === "All" || set.category === category) &&
      matchesAvailability(availability, set) &&
      matchesStatus(status, summaries.get(set.uniqueName))
  );
  const compare = comparators[sort];
  return compare
    ? result.sort((a, b) => compare(summaries.get(a.uniqueName), summaries.get(b.uniqueName)))
    : result;
};

const DEFAULT_FILTERS = { category: "All", status: "All", availability: "All", sort: "Name", layout: "cards" };

/** Saved filters and sort, falling back to defaults for unknown values. */
export const loadFilters = (categories) => {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY)) ?? {};
    const pick = (options, value, fallback) => (options.includes(value) ? value : fallback);
    return {
      category: pick(categories, saved.category, DEFAULT_FILTERS.category),
      status: pick(statusFilters, saved.status, DEFAULT_FILTERS.status),
      availability: pick(availabilityFilters, saved.availability, DEFAULT_FILTERS.availability),
      sort: pick(sortOptions, saved.sort, DEFAULT_FILTERS.sort),
      layout: pick(layouts, saved.layout, DEFAULT_FILTERS.layout),
    };
  } catch {
    return { ...DEFAULT_FILTERS };
  }
};

export const saveFilters = (filters) => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Filters are a convenience; ignore storage failures.
  }
};

const VIEW_KEY = "primeInventoryView";
export const views = ["inventory", "missing"];

/** Last open tab, defaulting to the inventory. */
export const loadView = () => {
  try {
    const view = localStorage.getItem(VIEW_KEY);
    return views.includes(view) ? view : "inventory";
  } catch {
    return "inventory";
  }
};

export const saveView = (view) => {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Remembering the tab is a convenience; ignore storage failures.
  }
};
