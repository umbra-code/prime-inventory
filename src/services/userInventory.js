// User inventory, kept separate from the item catalog:
//   counts:   { [partUniqueName]: number }   only parts the user owns
//   mastered: { [setUniqueName]: true }
// Counts for parts missing from the current catalog are kept untouched.

export const STORAGE_KEY = "primeInventory";
const STORAGE_VERSION = 2;
const EXPORT_APP_ID = "prime-inventory";

export const emptyUserData = () => ({ counts: {}, mastered: {} });

export const getCount = (counts, uniqueName) => counts[uniqueName] ?? 0;

export const isSetComplete = (set, counts) =>
  set.components.every((part) => getCount(counts, part.uniqueName) >= part.required);

export const getOwnedCounts = (set, counts) =>
  set.components.map((part) => getCount(counts, part.uniqueName));

/**
 * Owned parts that can be sold for ducats without losing progress: every part
 * of a mastered set, or the parts above the required amount otherwise.
 */
export const getSpareCount = (part, owned, isMastered) =>
  isMastered ? owned : Math.max(0, owned - part.required);

/**
 * Progress of a set given the owned count of each component (same order as
 * set.components). Status: "incomplete", "ready" (buildable, not mastered) or
 * "extra" (buildable and already mastered, so it can be sold).
 * `ducats` is the value of a full set; `spareDucats` the value of spare parts.
 */
export const summarizeSet = (set, owned, isMastered) => {
  let required = 0;
  let have = 0;
  let ducats = 0;
  let spareDucats = 0;
  set.components.forEach((part, i) => {
    required += part.required;
    have += Math.min(owned[i], part.required);
    ducats += part.required * part.ducats;
    spareDucats += getSpareCount(part, owned[i], isMastered) * part.ducats;
  });
  const missing = required - have;
  const status = missing > 0 ? "incomplete" : isMastered ? "extra" : "ready";
  return {
    progress: required > 0 ? (have / required) * 100 : 0,
    missing,
    status,
    ducats,
    spareDucats,
  };
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

/** Parses a stored inventory string; null or unreadable values become an empty inventory. */
export const parseStoredUserData = (value, catalogSets) => {
  try {
    return normalizeUserData(JSON.parse(value), catalogSets) ?? emptyUserData();
  } catch (error) {
    console.error("Failed to read stored inventory:", error);
    return emptyUserData();
  }
};

export const loadUserData = (catalogSets) => {
  try {
    return parseStoredUserData(localStorage.getItem(STORAGE_KEY), catalogSets);
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

    case "adjustCount":
      return {
        ...state,
        counts: setCount(
          state.counts,
          action.uniqueName,
          getCount(state.counts, action.uniqueName) + action.delta
        ),
      };

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

    // Undo for build/sell: puts back the set's previous part counts and mastery.
    case "restoreSet": {
      const counts = action.set.components.reduce(
        (next, part, i) => setCount(next, part.uniqueName, action.counts[i]),
        state.counts
      );
      const mastered = { ...state.mastered };
      if (action.isMastered) mastered[action.set.uniqueName] = true;
      else delete mastered[action.set.uniqueName];
      return { counts, mastered };
    }

    case "replace":
      return action.userData;

    case "reset":
      return emptyUserData();

    default:
      throw new Error(`Unknown inventory action: ${action.type}`);
  }
};
