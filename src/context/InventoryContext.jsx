"use client";

import { createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nContext";
import { getInitialCatalog, refreshCatalog } from "@/services/catalog";
import {
  availabilityFilters,
  filterAndSortSets,
  getCategories,
  getTypes,
  loadFilters,
  loadView,
  saveFilters,
  saveView,
  sortOptions,
  statusFilters,
} from "@/services/filters";
import { getHighlights } from "@/services/highlights";
import { HISTORY_KEY, initialInventoryState, inventoryReducer, parseStoredHistory, saveHistory } from "@/services/history";
import { groupMissingPartsByRelic } from "@/services/missingParts";
import { sendTransfer } from "@/services/transfer";
import {
  emptyUserData,
  getCount,
  getOwnedCounts,
  isSetComplete,
  loadUserData,
  normalizeUserData,
  parseStoredUserData,
  saveUserData,
  STORAGE_KEY,
  summarizeSet,
  toExportFile,
} from "@/services/userInventory";

// State changes on every edit; actions are stable so memoized cards that only
// consume actions skip re-rendering when other sets change.
export const InventoryStateContext = createContext(undefined);
export const InventoryActionsContext = createContext(undefined);

const pickJsonFile = () =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = () => resolve(input.files[0] ?? null);
    input.click();
  });

const downloadJson = (data, fileName) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Ids for history entries; only unique within one browser.
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function InventoryProvider({ children }) {
  const [catalog, setCatalog] = useState(getInitialCatalog);
  // The inventory and the history of its changes move together (see services/history.js).
  const [{ userData, history }, dispatch] = useReducer(inventoryReducer, catalog.sets, (sets) =>
    initialInventoryState(loadUserData(sets))
  );
  const { t, setName } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState(loadView);
  const [initialFilters] = useState(() => loadFilters(getCategories(catalog.sets)));
  const [selectedCategory, setCategoryState] = useState(initialFilters.category);
  const [selectedType, setSelectedType] = useState(initialFilters.type);
  // A new category has its own types, so the type filter starts over.
  const setSelectedCategory = useCallback((category) => {
    setCategoryState(category);
    setSelectedType("All");
  }, []);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [selectedAvailability, setSelectedAvailability] = useState(initialFilters.availability);
  const [selectedSort, setSelectedSort] = useState(initialFilters.sort);
  // Search and sorting stay: only what narrows the list is cleared.
  const clearFilters = useCallback(() => {
    setCategoryState("All");
    setSelectedType("All");
    setSelectedStatus("All");
    setSelectedAvailability("All");
  }, []);
  const [layout, setLayout] = useState(initialFilters.layout);
  const [wide, setWide] = useState(initialFilters.wide);

  // Sets and parts by uniqueName, to name what a history entry changed and to
  // know which set an edited part belongs to.
  const catalogIndex = useMemo(() => {
    const sets = new Map();
    const parts = new Map();
    for (const set of catalog.sets) {
      sets.set(set.uniqueName, set);
      for (const part of set.components) if (!parts.has(part.uniqueName)) parts.set(part.uniqueName, { part, set });
    }
    return { sets, parts };
  }, [catalog]);

  // Read by event handlers without making the actions unstable.
  const latest = useRef({ userData, catalog, catalogIndex, t, setName });
  useEffect(() => {
    latest.current = { userData, catalog, catalogIndex, t, setName };
  }, [userData, catalog, catalogIndex, t, setName]);

  // Data received from another tab is already stored; writing it back could
  // overwrite a newer value that tab saved in the meantime.
  const receivedFromStorage = useRef(null);
  useEffect(() => {
    if (userData !== receivedFromStorage.current) saveUserData(userData);
  }, [userData]);

  const historyFromStorage = useRef(null);
  useEffect(() => {
    if (history !== historyFromStorage.current) saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveView(view);
  }, [view]);

  useEffect(() => {
    saveFilters({
      category: selectedCategory,
      type: selectedType,
      status: selectedStatus,
      availability: selectedAvailability,
      sort: selectedSort,
      layout,
      wide,
    });
  }, [selectedCategory, selectedType, selectedStatus, selectedAvailability, selectedSort, layout, wide]);

  // Keep other open tabs in sync (key is null when storage was cleared).
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === HISTORY_KEY || event.key === null) {
        const history = parseStoredHistory(event.key === null ? null : event.newValue);
        historyFromStorage.current = history;
        dispatch({ type: "syncHistory", history });
      }
      if (event.key === STORAGE_KEY || event.key === null) {
        const userData = parseStoredUserData(event.key === null ? null : event.newValue, latest.current.catalog.sets);
        receivedFromStorage.current = userData;
        // No cause: the tab that made the change already recorded it.
        dispatch({ type: "replace", userData });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    refreshCatalog(catalog).then((newCatalog) => {
      if (!cancelled && newCatalog) setCatalog(newCatalog);
    });
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  const actions = useMemo(() => {
    const translate = (...args) => latest.current.t(...args);
    const nameOf = (set) => latest.current.setName(set);
    const undoable = (message, undo) =>
      toast.success(message, { action: { label: translate("undo"), onClick: undo } });
    // Recorded actions carry an id and the time, which the reducer cannot make up itself.
    const record = (action) => dispatch({ id: newId(), ...action, at: Date.now() });
    const setOf = (partUniqueName) => latest.current.catalogIndex.parts.get(partUniqueName)?.set.uniqueName;

    // Build and Sell only touch one set, so undo restores just that set
    // instead of discarding edits made after the toast appeared.
    const consumeSet = (type, set, message) => {
      const { counts, mastered, arsenal } = latest.current.userData;
      if (!isSetComplete(set, counts)) return;
      const previous = {
        counts: set.components.map((part) => getCount(counts, part.uniqueName)),
        isMastered: Boolean(mastered[set.uniqueName]),
        inArsenal: Boolean(arsenal[set.uniqueName]),
      };
      const id = newId();
      record({ type, set, id });
      undoable(message, () => record({ type: "undoEntry", entryId: id, fallback: { type: "restoreSet", set, ...previous } }));
    };

    const replaceAll = (userData, message, cause) => {
      const previous = latest.current.userData;
      const id = newId();
      record({ type: "replace", userData, cause, id });
      undoable(message, () =>
        record({ type: "undoEntry", entryId: id, fallback: { type: "replace", userData: previous, cause: "revert" } })
      );
    };

    return {
      updatePart: (uniqueName, count) => record({ type: "setCount", uniqueName, count, group: setOf(uniqueName) }),
      adjustPart: (uniqueName, delta) => record({ type: "adjustCount", uniqueName, delta, group: setOf(uniqueName) }),
      toggleMastery: (set) => record({ type: "toggleMastery", set }),
      toggleArsenal: (set) => record({ type: "toggleArsenal", set }),

      // Change history: one step back or forward, or straight to a point.
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      goToHistory: (position) => dispatch({ type: "goTo", position }),
      clearHistory: () => dispatch({ type: "clearHistory" }),
      build: (set) => consumeSet("build", set, translate("built", { name: nameOf(set) })),
      sell: (set) => consumeSet("sell", set, translate("sold", { name: nameOf(set) })),

      exportInventory: () => {
        downloadJson(toExportFile(latest.current.userData), "prime_inventory.json");
      },

      importInventory: async () => {
        const file = await pickJsonFile();
        if (!file) return;
        try {
          const raw = JSON.parse(await file.text());
          const imported = normalizeUserData(raw, latest.current.catalog.sets);
          if (!imported) throw new Error("Unrecognized inventory format");
          replaceAll(imported, translate("imported", { file: file.name }), "import");
        } catch (error) {
          console.error("Failed to import inventory:", error);
          toast.error(translate("importFailed", { file: file.name }), {
            description: translate("importFailedHint"),
          });
        }
      },

      // "Send to another device": resolves with the link and its expiry time.
      sendInventory: () => sendTransfer(toExportFile(latest.current.userData)),
      /** The inventory in data received from a link, or null if it is not one. */
      readReceivedInventory: (raw) => normalizeUserData(raw, latest.current.catalog.sets),
      applyReceivedInventory: (userData) => replaceAll(userData, translate("transferImported"), "receive"),

      resetInventory: () => replaceAll(emptyUserData(), translate("inventoryReset"), "reset"),

      showSetInInventory: (set) => {
        // A filter left on would hide the set that was asked for.
        clearFilters();
        setSearchTerm(set.name);
        setView("inventory");
        window.scrollTo({ top: 0 });
      },
    };
  }, [clearFilters]);

  const categories = useMemo(() => getCategories(catalog.sets), [catalog]);
  const highlights = useMemo(() => getHighlights(catalog.sets), [catalog]);
  const types = useMemo(() => getTypes(catalog.sets, selectedCategory), [catalog, selectedCategory]);
  // A saved type that no longer fits the category is ignored.
  const effectiveType = types.includes(selectedType) ? selectedType : "All";

  const missingParts = useMemo(
    () => groupMissingPartsByRelic(catalog.sets, userData),
    [catalog, userData]
  );

  // One entry per set: owned counts per component, progress and status.
  const summaries = useMemo(() => {
    const map = new Map();
    for (const set of catalog.sets) {
      const owned = getOwnedCounts(set, userData.counts);
      const isMastered = Boolean(userData.mastered[set.uniqueName]);
      const inArsenal = Boolean(userData.arsenal[set.uniqueName]);
      map.set(set.uniqueName, { owned, isMastered, inArsenal, ...summarizeSet(set, owned, isMastered) });
    }
    return map;
  }, [catalog, userData]);

  const stats = useMemo(() => {
    const stats = { total: catalog.sets.length, ready: 0, extra: 0, mastered: 0, spareDucats: 0 };
    for (const summary of summaries.values()) {
      if (summary.status === "ready") stats.ready++;
      if (summary.status === "extra") stats.extra++;
      if (summary.isMastered) stats.mastered++;
      stats.spareDucats += summary.spareDucats;
    }
    return stats;
  }, [catalog, summaries]);

  const filteredSets = useMemo(
    () =>
      filterAndSortSets(catalog.sets, summaries, {
        search: searchTerm,
        category: selectedCategory,
        type: effectiveType,
        status: selectedStatus,
        availability: selectedAvailability,
        sort: selectedSort,
        nameOf: setName,
      }),
    [
      catalog,
      summaries,
      setName,
      searchTerm,
      selectedCategory,
      effectiveType,
      selectedStatus,
      selectedAvailability,
      selectedSort,
    ]
  );

  const activeFilterCount = [selectedCategory, effectiveType, selectedStatus, selectedAvailability].filter(
    (value) => value !== "All"
  ).length;
  // How many sets the search would find without the filters, to explain a
  // short or empty list; null when that is not the question.
  const searchMatchesWithoutFilters = useMemo(
    () =>
      activeFilterCount > 0 && searchTerm.trim()
        ? filterAndSortSets(catalog.sets, summaries, {
            search: searchTerm,
            category: "All",
            type: "All",
            status: "All",
            availability: "All",
            sort: selectedSort,
            nameOf: setName,
          }).length
        : null,
    [activeFilterCount, searchTerm, catalog, summaries, selectedSort, setName]
  );

  const state = useMemo(
    () => ({
      catalog,
      catalogIndex,
      userData,
      history,
      searchTerm,
      setSearchTerm,
      selectedCategory,
      setSelectedCategory,
      types,
      selectedType: effectiveType,
      setSelectedType,
      selectedStatus,
      setSelectedStatus,
      selectedAvailability,
      setSelectedAvailability,
      selectedSort,
      setSelectedSort,
      availabilityFilters,
      sortOptions,
      categories,
      statusFilters,
      stats,
      summaries,
      filteredSets,
      activeFilterCount,
      searchMatchesWithoutFilters,
      clearFilters,
      missingParts,
      highlights,
      view,
      setView,
      layout,
      setLayout,
      wide,
      setWide,
    }),
    [
      catalog,
      catalogIndex,
      userData,
      history,
      searchTerm,
      selectedCategory,
      setSelectedCategory,
      types,
      effectiveType,
      selectedStatus,
      selectedAvailability,
      selectedSort,
      categories,
      stats,
      summaries,
      filteredSets,
      activeFilterCount,
      searchMatchesWithoutFilters,
      clearFilters,
      missingParts,
      highlights,
      view,
      layout,
      wide,
    ]
  );

  return (
    <InventoryActionsContext.Provider value={actions}>
      <InventoryStateContext.Provider value={state}>{children}</InventoryStateContext.Provider>
    </InventoryActionsContext.Provider>
  );
}
