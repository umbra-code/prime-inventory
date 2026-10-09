"use client";

import { createContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getInitialCatalog, refreshCatalog } from "@/services/catalog";
import {
  isSetComplete,
  loadUserData,
  normalizeUserData,
  saveUserData,
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [notice, setNotice] = useState(null);

  // Read by event handlers (export) without making the actions unstable.
  const latest = useRef({ userData, catalog });
  useEffect(() => {
    latest.current = { userData, catalog };
  }, [userData, catalog]);

  useEffect(() => {
    saveUserData(userData);
  }, [userData]);

  useEffect(() => {
    let cancelled = false;
    refreshCatalog(catalog).then((newCatalog) => {
      if (!cancelled && newCatalog) setCatalog(newCatalog);
    });
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  const actions = useMemo(
    () => ({
      updatePart: (uniqueName, count) => dispatch({ type: "setCount", uniqueName, count }),
      toggleMastery: (set) => dispatch({ type: "toggleMastery", set }),
      build: (set) => dispatch({ type: "build", set }),
      sell: (set) => dispatch({ type: "sell", set }),
      dismissNotice: () => setNotice(null),

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
          dispatch({ type: "replace", userData: imported });
          setNotice({ type: "success", message: `Imported inventory from ${file.name}.` });
        } catch (error) {
          console.error("Failed to import inventory:", error);
          setNotice({
            type: "error",
            message: `Could not import ${file.name}: it is not a valid Prime Inventory backup.`,
          });
        }
      },

      resetInventory: () => {
        if (
          window.confirm(
            "Are you sure you want to reset your inventory? This action cannot be undone."
          )
        ) {
          dispatch({ type: "reset" });
        }
      },
    }),
    []
  );

  const categories = useMemo(
    () => ["All", ...new Set(catalog.sets.map((set) => set.category))],
    [catalog]
  );

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
      notice,
    }),
    [catalog, userData, searchTerm, selectedCategory, selectedStatus, categories, stats, filteredSets, notice]
  );

  return (
    <InventoryActionsContext.Provider value={actions}>
      <InventoryStateContext.Provider value={state}>{children}</InventoryStateContext.Provider>
    </InventoryActionsContext.Provider>
  );
}
