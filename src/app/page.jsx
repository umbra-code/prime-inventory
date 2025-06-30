"use client";

import { Header } from "@/components/layout/Header";
import { InventoryDashboard } from "@/components/layout/InventoryDashboard";
import { InventoryGrid } from "@/components/layout/InventoryGrid";
import { Footer } from "@/components/layout/Footer";

import { categories as allCategories } from "@/lib/utils";
import {
  buildItem as buildInventoryItem,
  loadInventory,
  resetInventory as resetUserInventory,
  saveInventory,
  sellItem as sellInventoryItem,
  toggleMastery as toggleInventoryMastery,
  updatePartCount as updateInventoryPartCount,
} from "@/services/userInventory";
import { getPrimeItems } from "@/services/warframeData";
import { useEffect, useMemo, useRef, useState } from "react";

export default function PrimeInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  const statusFilters = [
    "All",
    "Buildable",
    "Incomplete",
    "Mastered",
    "Extra Sets",
  ];

  const fetchInventory = async () => {
    try {
      const data = await getPrimeItems();
      setCategories(allCategories);
      const loadedData = loadInventory();
      const masteredSets = new Set(loadedData.masteredSets);
      const partCountsMap = new Map(
        loadedData.partCounts.map((p) => [p.uniqueName, p.userCount])
      );

      const mergedInventory = data?.map((item) => {
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
      setInventory(mergedInventory);
      saveInventory(mergedInventory);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      saveInventory(inventory);
    }
  }, [inventory]);

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
      newCount
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
            saveInventory(importedInventory);
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
      setInventory([]);
      fetchInventory();
    }
  };

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <Header
        handleImport={handleImport}
        handleExport={handleExport}
        handleResetInventory={handleResetInventory}
      />

      <div className='flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
        <InventoryDashboard
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          categories={categories}
          statusFilters={statusFilters}
          stats={stats}
          filteredSetsLength={filteredSets.length}
          inventoryLength={inventory.length}
        />

        <InventoryGrid
          loading={loading}
          filteredSets={filteredSets}
          handleUpdatePart={handleUpdatePart}
          handleToggleMastery={handleToggleMastery}
          handleBuild={handleBuild}
          handleSell={handleSell}
        />
      </div>

      <Footer />
    </div>
  );
}