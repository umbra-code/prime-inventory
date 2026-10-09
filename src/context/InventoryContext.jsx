"use client";

import { createContext, useState, useEffect, useMemo } from "react";
import {
  buildItem as buildInventoryItem,
  clearUserData,
  loadInventory,
  resetInventory as resetUserInventory,
  saveInventory,
  sellItem as sellInventoryItem,
  toggleMastery as toggleInventoryMastery,
  updatePartCount as updateInventoryPartCount,
} from "@/services/userInventory";
import { getPrimeItems } from "@/services/warframeData";

export const InventoryContext = createContext(undefined);

const statusFilters = ["All", "Buildable", "Incomplete", "Mastered", "Extra Sets"];

const mergeWithSavedInventory = (data) => {
  const loadedData = loadInventory();
  const masteredSets = new Set(loadedData.masteredSets);
  const partCountsMap = new Map(
    loadedData.partCounts.map((p) => [p.uniqueName, p.userCount])
  );

  return data.map((item) => {
    const newItem = { ...item };

    if (masteredSets.has(newItem.name)) {
      newItem.isMastered = true;
    }

    if (newItem.components) {
      newItem.components = newItem.components.map((part) => {
        const userCount = partCountsMap.get(part.uniqueName);
        if (userCount !== undefined) {
          return { ...part, userCount };
        }
        return part;
      });
    } else if (partCountsMap.has(newItem.uniqueName)) {
      newItem.userCount = partCountsMap.get(newItem.uniqueName);
    }
    return newItem;
  });
};

export function InventoryProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPrimeItems()
      .then((data) => {
        if (!cancelled) setInventory(mergeWithSavedInventory(data ?? []));
      })
      .catch((error) => console.error("Failed to fetch inventory:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only persist once the saved data has been merged in; saving earlier would
  // overwrite localStorage with an empty inventory (e.g. StrictMode remounts).
  useEffect(() => {
    if (!loading) saveInventory(inventory);
  }, [inventory, loading]);

  const categories = useMemo(
    () => ["All", ...new Set(inventory.map((set) => set.category))],
    [inventory]
  );

  const filteredSets = useMemo(() => {
    return inventory.filter((set) => {
      const matchesSearch = set.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || set.category === selectedCategory;

      const isBuildable =
        set.components?.every((part) => part.userCount >= part.required) ??
        (set.userCount || 0) >= (set.required || 1);
      let matchesStatus = true;

      if (selectedStatus === "Buildable")
        matchesStatus = isBuildable && !set.isMastered;
      else if (selectedStatus === "Incomplete") matchesStatus = !isBuildable;
      else if (selectedStatus === "Mastered") matchesStatus = set.isMastered;
      else if (selectedStatus === "Extra Sets")
        matchesStatus = isBuildable && set.isMastered;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, selectedStatus, inventory]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const buildable = inventory.filter((set) => {
      const isBuildable =
        set.components?.every((part) => part.userCount >= part.required) ??
        (set.userCount || 0) >= (set.required || 1);
      return isBuildable && !set.isMastered;
    }).length;
    const mastered = inventory.filter((set) => set.isMastered).length;

    return { total, buildable, mastered };
  }, [inventory]);

  const handleUpdatePart = (uniqueName, newCount) => {
    const updatedInventory = updateInventoryPartCount(
      inventory,
      uniqueName,
      Math.max(0, Math.floor(newCount) || 0)
    );
    setInventory(updatedInventory);
  };

  const handleToggleMastery = (setName) => {
    const updatedInventory = toggleInventoryMastery(inventory, setName);
    setInventory(updatedInventory);
  };

  const handleBuild = (primeSet) => {
    const isBuildable =
      primeSet.components?.every((part) => part.userCount >= part.required) ??
      (primeSet.userCount || 0) >= (primeSet.required || 1);

    if (!isBuildable) {
      return;
    }

    const updatedInventory = buildInventoryItem(inventory, primeSet);
    setInventory(updatedInventory);
  };

  const handleSell = (primeSet) => {
    const isSellable =
      primeSet.components?.every((part) => part.userCount >= part.required) ??
      (primeSet.userCount || 0) >= (primeSet.required || 1);

    if (!isSellable) {
      return;
    }

    const updatedInventory = sellInventoryItem(inventory, primeSet);
    setInventory(updatedInventory);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedInventory = JSON.parse(e.target.result);
            const isValid =
              Array.isArray(importedInventory) &&
              importedInventory.every(
                (item) =>
                  item.name && (item.components || item.userCount !== undefined)
              );

            if (!isValid) {
              throw new Error("Invalid inventory structure.");
            }

            setInventory(importedInventory);
          } catch (error) {
            console.error("Failed to parse imported inventory:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(inventory, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prime_inventory.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetInventory = () => {
    if (
      window.confirm(
        "Are you sure you want to reset your inventory? This action cannot be undone."
      )
    ) {
      resetUserInventory();
      setInventory(clearUserData);
    }
  };

  const contextValue = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      selectedCategory,
      setSelectedCategory,
      selectedStatus,
      setSelectedStatus,
      inventory,
      setInventory,
      categories,
      statusFilters,
      loading,
      filteredSets,
      stats,
      handleUpdatePart,
      handleToggleMastery,
      handleBuild,
      handleSell,
      handleImport,
      handleExport,
      handleResetInventory,
    }),
    [
      searchTerm,
      selectedCategory,
      selectedStatus,
      inventory,
      categories,
      loading,
      filteredSets,
      stats,
      handleUpdatePart,
      handleToggleMastery,
      handleBuild,
      handleSell,
      handleImport,
      handleExport,
      handleResetInventory,
    ]
  );

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
}
