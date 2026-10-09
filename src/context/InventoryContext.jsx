"use client";

import { createContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { getInitialCatalog, refreshCatalog } from "@/services/catalog";
import {
  emptyUserData,
  getCount,
  isSetComplete,
  loadUserData,
  normalizeUserData,
  parseStoredUserData,
  saveUserData,
  STORAGE_KEY,
  toExportFile,
  userDataReducer,
} from "@/services/userInventory";

// State changes on every edit; actions are stable so memoized cards that only
// consume actions skip re-rendering when other sets change.
export const InventoryStateContext = createContext(undefined);
export const InventoryActionsContext = createContext(undefined);

const statusFilters = ["All", "Buildable", "Incomplete", "Mastered", "Extra Sets"];

const matchesStatus = (status, isComplete, isMastered) => {
  switch (status) {
    case "Buildable":
      return isComplete && !isMastered;
    case "Incomplete":
      return !isComplete;
    case "Mastered":
      return isMastered;
    case "Extra Sets":
      return isComplete && isMastered;
    default:
      return true;
  }
};

const FILTERS_KEY = "primeInventoryFilters";

const loadFilters = (categories) => {
  try {
    const { category, status } = JSON.parse(localStorage.getItem(FILTERS_KEY)) ?? {};
    return {
      category: categories.includes(category) ? category : "All",
      status: statusFilters.includes(status) ? status : "All",
    };
  } catch {
    return { category: "All", status: "All" };
  }
};

const getCategories = (catalog) => ["All", ...new Set(catalog.sets.map((set) => set.category))];

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
  const [initialFilters] = useState(() => loadFilters(getCategories(catalog)));
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);

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
    try {
      localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ category: selectedCategory, status: selectedStatus })
      );
    } catch {
      // Filters are a convenience; ignore storage failures.
    }
  }, [selectedCategory, selectedStatus]);

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

  const categories = useMemo(() => getCategories(catalog), [catalog]);

  const stats = useMemo(() => {
    let buildable = 0;
    let mastered = 0;
    for (const set of catalog.sets) {
      const isMastered = Boolean(userData.mastered[set.uniqueName]);
      if (isMastered) mastered++;
      else if (isSetComplete(set, userData.counts)) buildable++;
    }
    return { total: catalog.sets.length, buildable, mastered };
  }, [catalog, userData]);

  const filteredSets = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return catalog.sets.filter(
      (set) =>
        set.name.toLowerCase().includes(search) &&
        (selectedCategory === "All" || set.category === selectedCategory) &&
        matchesStatus(
          selectedStatus,
          isSetComplete(set, userData.counts),
          Boolean(userData.mastered[set.uniqueName])
        )
    );
  }, [catalog, userData, searchTerm, selectedCategory, selectedStatus]);

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
      categories,
      statusFilters,
      stats,
      filteredSets,
    }),
    [catalog, userData, searchTerm, selectedCategory, selectedStatus, categories, stats, filteredSets]
  );

  return (
    <InventoryActionsContext.Provider value={actions}>
      <InventoryStateContext.Provider value={state}>{children}</InventoryStateContext.Provider>
    </InventoryActionsContext.Provider>
  );
}
