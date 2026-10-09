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
import { groupMissingPartsByRelic } from "@/services/missingParts";
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
  userDataReducer,
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

export function InventoryProvider({ children }) {
  const [catalog, setCatalog] = useState(getInitialCatalog);
  const [userData, dispatch] = useReducer(userDataReducer, catalog.sets, loadUserData);
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
  const [layout, setLayout] = useState(initialFilters.layout);

  // Read by event handlers without making the actions unstable.
  const latest = useRef({ userData, catalog, t, setName });
  useEffect(() => {
    latest.current = { userData, catalog, t, setName };
  }, [userData, catalog, t, setName]);

  // Data received from another tab is already stored; writing it back could
  // overwrite a newer value that tab saved in the meantime.
  const receivedFromStorage = useRef(null);
  useEffect(() => {
    if (userData !== receivedFromStorage.current) saveUserData(userData);
  }, [userData]);

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
    });
  }, [selectedCategory, selectedType, selectedStatus, selectedAvailability, selectedSort, layout]);

  // Keep other open tabs in sync (key is null when storage was cleared).
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const userData = parseStoredUserData(event.newValue, latest.current.catalog.sets);
      receivedFromStorage.current = userData;
      dispatch({ type: "replace", userData });
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
      dispatch({ type, set });
      undoable(message, () => dispatch({ type: "restoreSet", set, ...previous }));
    };

    const replaceAll = (userData, message) => {
      const previous = latest.current.userData;
      dispatch({ type: "replace", userData });
      undoable(message, () => dispatch({ type: "replace", userData: previous }));
    };

    return {
      updatePart: (uniqueName, count) => dispatch({ type: "setCount", uniqueName, count }),
      adjustPart: (uniqueName, delta) => dispatch({ type: "adjustCount", uniqueName, delta }),
      toggleMastery: (set) => dispatch({ type: "toggleMastery", set }),
      toggleArsenal: (set) => dispatch({ type: "toggleArsenal", set }),
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
          replaceAll(imported, translate("imported", { file: file.name }));
        } catch (error) {
          console.error("Failed to import inventory:", error);
          toast.error(translate("importFailed", { file: file.name }), {
            description: translate("importFailedHint"),
          });
        }
      },

      resetInventory: () => replaceAll(emptyUserData(), translate("inventoryReset")),

      showSetInInventory: (set) => {
        setSearchTerm(set.name);
        setView("inventory");
        window.scrollTo({ top: 0 });
      },
    };
  }, []);

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

  const state = useMemo(
    () => ({
      catalog,
      userData,
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
      missingParts,
      highlights,
      view,
      setView,
      layout,
      setLayout,
    }),
    [
      catalog,
      userData,
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
      missingParts,
      highlights,
      view,
      layout,
    ]
  );

  return (
    <InventoryActionsContext.Provider value={actions}>
      <InventoryStateContext.Provider value={state}>{children}</InventoryStateContext.Provider>
    </InventoryActionsContext.Provider>
  );
}
