import { emptyUserData, userDataReducer } from "@/services/userInventory";

// Change history: what each action changed in the inventory, so it can be
// undone later, also after the "Undo" toast is gone or the page was reloaded.
//
//   history: { entries: [entry], position }
//   entry:   { id, at, type, group, changes }
//   changes: { counts: { [part]: [from, to] }, mastered: { [set]: [from, to] }, arsenal: { … } }
//
// Entries only hold what changed, with the value before and after, so a full
// history weighs a few KB. `position` is how many entries are applied: undo
// moves it back and redo forward, and a new change drops the undone ones.
//
// An entry is written the moment a change happens, never after a delay, so
// closing the page right after an edit loses nothing. Quick edits to the same
// set join the previous entry instead of adding one per click.

export const HISTORY_KEY = "primeInventoryHistory";
export const MAX_ENTRIES = 50;
export const MERGE_WINDOW_MS = 5000;
const HISTORY_VERSION = 1;

const FIELDS = ["counts", "mastered", "arsenal"];
const EMPTY_VALUE = { counts: 0, mastered: false, arsenal: false };
const ENTRY_TYPES = ["edit", "build", "sell", "import", "receive", "reset", "revert", "sync"];

export const emptyHistory = () => ({ entries: [], position: 0 });

const valueOf = (field, data, key) => data[field][key] ?? EMPTY_VALUE[field];

/** What differs between two inventories, or null when nothing does. */
export const diffUserData = (before, after) => {
  const changes = {};
  for (const field of FIELDS) {
    for (const key of new Set([...Object.keys(before[field]), ...Object.keys(after[field])])) {
      const from = valueOf(field, before, key);
      const to = valueOf(field, after, key);
      if (from !== to) (changes[field] ??= {})[key] = [from, to];
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
};

// Entries joined in time: for each value, where the first started and the second ended.
const mergeChanges = (first, second) => {
  const merged = {};
  for (const field of FIELDS) {
    const keys = new Set([...Object.keys(first[field] ?? {}), ...Object.keys(second[field] ?? {})]);
    for (const key of keys) {
      const from = (first[field]?.[key] ?? second[field][key])[0];
      const to = (second[field]?.[key] ?? first[field][key])[1];
      if (from !== to) (merged[field] ??= {})[key] = [from, to];
    }
  }
  return Object.keys(merged).length > 0 ? merged : null;
};

/** Adds a change to the history. `cause` is `{ type, group, id, at }`. */
export const recordChange = (history, cause, changes) => {
  // A new change after undoing makes the undone entries unreachable.
  const entries = history.entries.slice(0, history.position);
  const last = entries.at(-1);

  const joinsLast =
    cause.type === "edit" && last?.type === "edit" && last.group === cause.group && cause.at - last.at <= MERGE_WINDOW_MS;
  if (joinsLast) {
    const merged = mergeChanges(last.changes, changes);
    entries.pop();
    // Edits that end where they started (+1 then −1) leave no entry.
    if (merged) entries.push({ ...last, at: cause.at, changes: merged });
  } else {
    entries.push({ id: cause.id, at: cause.at, type: cause.type, group: cause.group ?? null, changes });
  }

  const kept = entries.slice(-MAX_ENTRIES);
  return { entries: kept, position: kept.length };
};

const withValue = (field, values, key, value) => {
  if (value === EMPTY_VALUE[field]) delete values[key];
  else values[key] = value;
};

// Puts every changed value back to its "from" (index 0) or forward to its "to" (index 1).
const applyChanges = (userData, changes, index) => {
  const next = { ...userData };
  for (const field of FIELDS) {
    if (!changes[field]) continue;
    next[field] = { ...userData[field] };
    for (const [key, values] of Object.entries(changes[field])) withValue(field, next[field], key, values[index]);
  }
  return next;
};

/**
 * Device sync: the inventory another device uploaded (`remote`), with what
 * this device changed since they last agreed (`base`) put back on top. Each
 * value is merged on its own, so edits to different parts both survive; when
 * both devices changed the same one, this device's value is kept.
 */
export const mergeSynced = (base, local, remote) => {
  const mine = diffUserData(base, local);
  return mine ? applyChanges(remote, mine, 1) : remote;
};

/** Undoes or redoes entries until `position` of them are applied. */
export const moveTo = (state, position) => {
  const { entries, position: current } = state.history;
  const target = Math.max(0, Math.min(entries.length, position));
  if (target === current) return state;

  let userData = state.userData;
  if (target < current) {
    for (let i = current - 1; i >= target; i--) userData = applyChanges(userData, entries[i].changes, 0);
  } else {
    for (let i = current; i < target; i++) userData = applyChanges(userData, entries[i].changes, 1);
  }
  return { userData, history: { entries, position: target } };
};

// Which inventory actions are recorded, and as what. A "replace" without a
// cause is data arriving from another tab, which that tab already recorded.
const causeType = (action) => {
  switch (action.type) {
    case "setCount":
    case "adjustCount":
    case "toggleMastery":
    case "toggleArsenal":
      return "edit";
    case "build":
    case "sell":
    case "reset":
      return action.type;
    case "restoreSet":
      return "revert";
    case "syncMerge":
      return "sync";
    case "replace":
      return action.cause ?? null;
    default:
      return null;
  }
};

/**
 * Reducer for `{ userData, history }`: runs inventory actions through
 * userDataReducer and records what they changed. Recorded actions carry
 * `id` and `at` (a new id and the current time), set by the caller so the
 * reducer stays pure; edits may carry `group`, the set they belong to.
 */
export const inventoryReducer = (state, action) => {
  switch (action.type) {
    case "undo":
      return moveTo(state, state.history.position - 1);
    case "redo":
      return moveTo(state, state.history.position + 1);
    case "goTo":
      return moveTo(state, action.position);
    case "clearHistory":
      return { ...state, history: emptyHistory() };
    // Another tab changed the history; its inventory change arrives on its own.
    case "syncHistory":
      return { ...state, history: action.history };
    // The "Undo" of a toast: a plain undo while its entry is still the latest
    // one; after other changes, `fallback` reverts just what that action did.
    case "undoEntry": {
      const { entries, position } = state.history;
      if (entries[position - 1]?.id === action.entryId) return moveTo(state, position - 1);
      return inventoryReducer(state, { ...action.fallback, id: action.id, at: action.at });
    }
    default:
  }

  // Merged here, against the inventory as it is at this instant, so an edit
  // made while the download was in flight is not lost. Recorded like any
  // other change: what another device did can be undone too.
  const userData =
    action.type === "syncMerge"
      ? mergeSynced(action.base, state.userData, action.remote)
      : userDataReducer(state.userData, action);
  if (userData === state.userData) return state;

  const type = causeType(action);
  if (!type) return { ...state, userData };
  // Same values in a new object (a count set to what it was, a sync that brought nothing new).
  const changes = diffUserData(state.userData, userData);
  if (!changes) return state;

  const cause = { type, group: action.group ?? action.set?.uniqueName, id: action.id, at: action.at };
  return { userData, history: recordChange(state.history, cause, changes) };
};

const isPair = (field, pair) =>
  Array.isArray(pair) && pair.length === 2 && pair.every((value) => typeof value === typeof EMPTY_VALUE[field]);

const isValidEntry = (entry) =>
  typeof entry?.id === "string" &&
  Number.isFinite(entry.at) &&
  ENTRY_TYPES.includes(entry.type) &&
  entry.changes !== null &&
  typeof entry.changes === "object" &&
  FIELDS.every(
    (field) =>
      entry.changes[field] === undefined ||
      (typeof entry.changes[field] === "object" && Object.values(entry.changes[field]).every((pair) => isPair(field, pair)))
  );

/** A stored history string as a history; anything unreadable becomes an empty one. */
export const parseStoredHistory = (value) => {
  try {
    const stored = JSON.parse(value);
    if (stored?.version !== HISTORY_VERSION || !Array.isArray(stored.entries) || !stored.entries.every(isValidEntry)) {
      return emptyHistory();
    }
    const entries = stored.entries.slice(-MAX_ENTRIES);
    const position = Number.isInteger(stored.position) ? Math.max(0, Math.min(entries.length, stored.position)) : entries.length;
    return { entries, position };
  } catch {
    return emptyHistory();
  }
};

export const loadHistory = () => {
  try {
    return parseStoredHistory(localStorage.getItem(HISTORY_KEY));
  } catch {
    return emptyHistory();
  }
};

export const saveHistory = (history) => {
  const store = (entries, position) =>
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: HISTORY_VERSION, entries, position }));
  try {
    store(history.entries, history.position);
  } catch {
    // Storage is full (a few huge imports in a row): keep only the applied, most recent entries.
    try {
      const recent = history.entries.slice(0, history.position).slice(-5);
      store(recent, recent.length);
    } catch (error) {
      console.error("Failed to save the change history:", error);
    }
  }
};

/** Initial reducer state; `userData` is loaded by the caller. */
export const initialInventoryState = (userData = emptyUserData()) => ({ userData, history: loadHistory() });

/** Counts of what an entry touched, for its description. */
export const countChanges = (entry) =>
  FIELDS.reduce((total, field) => total + Object.keys(entry.changes[field] ?? {}).length, 0);
