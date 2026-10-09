"use client";

import { createContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { getInitialCatalog, refreshCatalog } from "@/services/catalog";
import {
  filterAndSortSets,
  getCategories,
  loadFilters,
  saveFilters,
  sortOptions,
  statusFilters,
} from "@/services/filters";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [initialFilters] = useState(() => loadFilters(getCategories(catalog.sets)));
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [selectedSort, setSelectedSort] = useState(initialFilters.sort);

  // Read by event handlers without making the actions unstable.
  const latest = useRef({ userData, catalog });
  useEffect(() => {
    latest.current = { userData, catalog };
  }, [userData, catalog]);

  // Data received from another tab is already stored; writing it back could
  // overwrite a newer value that tab saved in the meantime.
  const receivedFromStorage = useRef(null);
  useEffect(() => {
    if (userData !== receivedFromStorage.current) saveUserData(userData);
  }, [userData]);

  useEffect(() => {
    saveFilters({ category: selectedCategory, status: selectedStatus, sort: selectedSort });
  }, [selectedCategory, selectedStatus, selectedSort]);

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
    const undoable = (message, undo) =>
      toast.success(message, { action: { label: "Undo", onClick: undo } });

    // Build and Sell only touch one set, so undo restores just that set
    // instead of discarding edits made after the toast appeared.
    const consumeSet = (type, set, message) => {
      const { counts, mastered } = latest.current.userData;
      if (!isSetComplete(set, counts)) return;
      const previous = {
        counts: set.components.map((part) => getCount(counts, part.uniqueName)),
        isMastered: Boolean(mastered[set.uniqueName]),
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
      build: (set) => consumeSet("build", set, `Built ${set.name}`),
      sell: (set) => consumeSet("sell", set, `Sold ${set.name}`),

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
          replaceAll(imported, `Imported inventory from ${file.name}`);
        } catch (error) {
          console.error("Failed to import inventory:", error);
          toast.error(`Could not import ${file.name}`, {
            description: "It is not a valid Prime Inventory backup.",
          });
        }
      },

      resetInventory: () => replaceAll(emptyUserData(), "Inventory reset"),
    };
  }, []);

  const categories = useMemo(() => getCategories(catalog.sets), [catalog]);

  // One entry per set: owned counts per component, progress and status.
  const summaries = useMemo(() => {
    const map = new Map();
    for (const set of catalog.sets) {
      const owned = getOwnedCounts(set, userData.counts);
      const isMastered = Boolean(userData.mastered[set.uniqueName]);
      map.set(set.uniqueName, { owned, isMastered, ...summarizeSet(set, owned, isMastered) });
    }
    return map;
  }, [catalog, userData]);

  const stats = useMemo(() => {
    const stats = { total: catalog.sets.length, ready: 0, extra: 0, mastered: 0 };
    for (const summary of summaries.values()) {
      if (summary.status === "ready") stats.ready++;
      if (summary.status === "extra") stats.extra++;
      if (summary.isMastered) stats.mastered++;
    }
    return stats;
  }, [catalog, summaries]);

  const filteredSets = useMemo(
    () =>
      filterAndSortSets(catalog.sets, summaries, {
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
        sort: selectedSort,
      }),
    [catalog, summaries, searchTerm, selectedCategory, selectedStatus, selectedSort]
  );

  const state = useMemo(
    () => ({
      catalog,
      userData,
      searchTerm,
      setSearchTerm,
      selectedCategory,
      setSelectedCategory,
      selectedStatus,
      setSelectedStatus,
      selectedSort,
      setSelectedSort,
      sortOptions,
      categories,
      statusFilters,
      stats,
      summaries,
      filteredSets,
    }),
    [
      catalog,
      userData,
      searchTerm,
      selectedCategory,
      selectedStatus,
      selectedSort,
      categories,
      stats,
      summaries,
      filteredSets,
    ]
  );

  return (
    <InventoryActionsContext.Provider value={actions}>
      <InventoryStateContext.Provider value={state}>{children}</InventoryStateContext.Provider>
    </InventoryActionsContext.Provider>
  );
}
