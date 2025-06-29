"use client";

import { Footer } from "@/components/inventory/Footer";
import { Navbar } from "@/components/inventory/Navbar";
import { NoResults } from "@/components/inventory/NoResults";
import { PrimeSetGrid } from "@/components/inventory/PrimeSetGrid";
import { StatsPanel } from "@/components/inventory/StatsPanel";
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
import { useEffect, useMemo, useState } from "react";

export default function PrimeInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from the API route
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await getPrimeItems();
        setCategories(allCategories);
        const loadedInventory = loadInventory();
        if (loadedInventory) {
          // Merge loaded inventory with fetched data
          const mergedInventory = data?.map((item) => {
            const userItem = loadedInventory.find(
              (userItem) => userItem.name === item.name
            );
            if (userItem) {
              return { ...item, ...userItem };
            }
            return item;
          });
          setInventory(mergedInventory);
        } else {
          setInventory(data);
        }
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    saveInventory(inventory);
  }, [inventory]);

  // Filtrar sets basado en búsqueda, categoría y estado
  const filteredSets = useMemo(() => {
    return inventory.filter((set) => {
      const matchesSearch = set.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || set.category === selectedCategory;

      // Filtro por estado
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

  // Estadísticas del inventario
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
    updateInventoryPartCount(uniqueName, newCount);
    const newInventory = inventory.map((set) => {
      if (set.components) {
        const newComponents = set.components.map((part) => {
          if (part.uniqueName === uniqueName) {
            return { ...part, userCount: newCount };
          }
          return part;
        });
        return { ...set, components: newComponents };
      }
      if (set.uniqueName === uniqueName) {
        return { ...set, userCount: newCount };
      }
      return set;
    });
    setInventory(newInventory);
    
  };

  const handleToggleMastery = (setName) => {
    toggleInventoryMastery(setName);
    const newInventory = inventory.map((set) => {
      if (set.name === setName) {
        return { ...set, isMastered: !set.isMastered };
      }
      return set;
    });
    setInventory(newInventory);
    
  };

  const handleBuild = (primeSet) => {
    const isBuildable =
      primeSet.components?.every((part) => part.userCount >= part.required) ??
      (primeSet.userCount || 0) >= (primeSet.required || 1);

    if (primeSet.isMastered) {
      
      return;
    }

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
            // Validación básica
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
      setInventory([]); // Reset the state as well
      
      // Optionally, re-fetch initial data if needed
      // fetchInventory();
    }
  };

  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
      <Navbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onImport={handleImport}
        onExport={handleExport}
        onReset={handleResetInventory}
      />

      <main className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8'>
        {loading ? (
          <div className='text-center py-12 text-white'>
            Loading inventory...
          </div>
        ) : (
          <>
            <StatsPanel
              stats={stats}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              filteredSetsCount={filteredSets.length}
              totalSetsCount={inventory.length}
              categories={categories}
            />

            {filteredSets.length > 0 ? (
              <PrimeSetGrid
                sets={filteredSets}
                onUpdatePart={handleUpdatePart}
                onToggleMastery={handleToggleMastery}
                onBuild={handleBuild}
                onSell={handleSell}
              />
            ) : (
              <NoResults />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
