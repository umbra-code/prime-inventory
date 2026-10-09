// User inventory, kept separate from the item catalog:
//   counts:   { [partUniqueName]: number }   only parts the user owns
//   mastered: { [setUniqueName]: true }
// Counts for parts missing from the current catalog are kept untouched.

const STORAGE_KEY = "primeInventory";
const STORAGE_VERSION = 2;
const EXPORT_APP_ID = "prime-inventory";

export const emptyUserData = () => ({ counts: {}, mastered: {} });

export const getCount = (counts, uniqueName) => counts[uniqueName] ?? 0;

export const isSetComplete = (set, counts) =>
  set.components.every((part) => getCount(counts, part.uniqueName) >= part.required);

export const getSetProgress = (set, counts) => {
  const required = set.components.reduce((sum, part) => sum + part.required, 0);
  const owned = set.components.reduce(
    (sum, part) => sum + Math.min(getCount(counts, part.uniqueName), part.required),
    0
  );
  return required > 0 ? (owned / required) * 100 : 0;
};

const toCount = (value) => {
  const count = Math.floor(Number(value));
  return Number.isFinite(count) && count > 0 ? count : 0;
};

const setCount = (counts, uniqueName, value) => {
  const next = { ...counts };
  const count = toCount(value);
  if (count > 0) next[uniqueName] = count;
  else delete next[uniqueName];
  return next;
};

const consumeSet = (counts, set) =>
  set.components.reduce(
    (next, part) => setCount(next, part.uniqueName, getCount(next, part.uniqueName) - part.required),
    counts
  );

const countsFromEntries = (entries) => {
  const counts = {};
  for (const [uniqueName, value] of entries) {
    const count = toCount(value);
    if (typeof uniqueName === "string" && count > 0) counts[uniqueName] = count;
  }
  return counts;
};

const masteredFromKeys = (keys) =>
  Object.fromEntries(keys.filter((key) => typeof key === "string").map((key) => [key, true]));

/**
 * Converts any known inventory format to user data, or returns null when the
 * data is not recognized. Supported formats:
 *   - v2 (current storage and export files)
 *   - v1 storage: { masteredSets: [setName], partCounts: [{ uniqueName, userCount }] }
 *   - v1 export: the full inventory array with userCount/isMastered merged in
 * Legacy formats reference sets by name, so the catalog is needed to map them.
 */
export const normalizeUserData = (raw, catalogSets) => {
  const setUniqueNameByName = new Map(catalogSets.map((set) => [set.name, set.uniqueName]));
  const masteredFromNames = (names) =>
    masteredFromKeys(names.map((name) => setUniqueNameByName.get(name)));

  if (raw?.version === STORAGE_VERSION && raw.counts && Array.isArray(raw.mastered)) {
    return {
      counts: countsFromEntries(Object.entries(raw.counts)),
      mastered: masteredFromKeys(raw.mastered),
    };
  }

  if (Array.isArray(raw?.masteredSets) && Array.isArray(raw.partCounts)) {
    return {
      counts: countsFromEntries(raw.partCounts.map((p) => [p?.uniqueName, p?.userCount])),
      mastered: masteredFromNames(raw.masteredSets),
    };
  }

  if (Array.isArray(raw) && raw.every((set) => typeof set?.name === "string")) {
    const parts = raw.flatMap((set) => (set.components?.length ? set.components : [set]));
    return {
      counts: countsFromEntries(parts.map((p) => [p?.uniqueName, p?.userCount])),
      mastered: masteredFromNames(raw.filter((set) => set.isMastered).map((set) => set.name)),
    };
  }

  return null;
};

const serialize = ({ counts, mastered }) => ({
  version: STORAGE_VERSION,
  counts,
  mastered: Object.keys(mastered),
});

export const loadUserData = (catalogSets) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeUserData(stored, catalogSets) ?? emptyUserData();
  } catch (error) {
    console.error("Failed to load inventory from localStorage:", error);
    return emptyUserData();
  }
};

export const saveUserData = (userData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(userData)));
  } catch (error) {
    console.error("Failed to save inventory to localStorage:", error);
  }
};

export const toExportFile = (userData) => ({
  app: EXPORT_APP_ID,
  exportedAt: new Date().toISOString(),
  ...serialize(userData),
});

export const userDataReducer = (state, action) => {
  switch (action.type) {
    case "setCount":
      return { ...state, counts: setCount(state.counts, action.uniqueName, action.count) };

    case "toggleMastery": {
      const mastered = { ...state.mastered };
      if (mastered[action.set.uniqueName]) delete mastered[action.set.uniqueName];
      else mastered[action.set.uniqueName] = true;
      return { ...state, mastered };
    }

    case "build":
      if (!isSetComplete(action.set, state.counts)) return state;
      return {
        counts: consumeSet(state.counts, action.set),
        mastered: { ...state.mastered, [action.set.uniqueName]: true },
      };

    case "sell":
      if (!isSetComplete(action.set, state.counts)) return state;
      return { ...state, counts: consumeSet(state.counts, action.set) };

    case "replace":
      return action.userData;

    case "reset":
      return emptyUserData();

    default:
      throw new Error(`Unknown inventory action: ${action.type}`);
  }
};
