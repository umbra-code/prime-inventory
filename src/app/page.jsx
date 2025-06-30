"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Package, Search, Upload, Github } from "lucide-react";

import { PrimeSet } from "@/components/inventory/PrimeSet"; // Keep existing PrimeSet component

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
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function PrimeInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define statusFilters here as it's used in the JSX directly
  const statusFilters = [
    "All",
    "Buildable",
    "Incomplete",
    "Mastered",
    "Extra Sets",
  ];

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
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            {/* Logo y título */}
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-3'>
                <Package className='h-8 w-8 text-amber-600' />
                <div>
                  <h1 className='text-xl font-bold text-gray-900'>
                    Prime Inventory
                  </h1>
                  <p className='text-xs text-gray-500'>
                    Warframe Management Tool
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones principales */}
            <div className='flex items-center space-x-3'>
              <Button variant='outline' onClick={handleImport} size='sm'>
                <Upload className='size-4' />
                Import
              </Button>
              <Button
                onClick={handleExport}
                size='sm'
                className='bg-amber-600 hover:bg-amber-700'
              >
                <Download className='size-4' />
                Export
              </Button>
              <Button
                className={"bg-red-600 hover:bg-red-700"}
                onClick={handleResetInventory}
                size='sm'
              >
                Reset
              </Button>
              <Link
                href={"https://github.com/umbra-code/prime-inventory"}
                className='hover:bg-gray-800 hover:text-white rounded-full p-1.5 transition-colors duration-200 ease-in-out'
                target='_blank'
              >
                <Github size={18} />
              </Link>
              <Link
                href={"https://github.com/umbra-code/prime-inventory"}
                className='hover:bg-gray-800 hover:text-white rounded-full p-1.5 transition-colors duration-200 ease-in-out'
                target='_blank'
              >
                <Github size={18} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Panel de control */}
        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-8'>
          {/* Estadísticas */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-gray-900'>
                {stats.total}
              </div>
              <div className='text-sm text-gray-500'>Total Prime Sets</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-green-600'>
                {stats.buildable}
              </div>
              <div className='text-sm text-gray-500'>Ready to Build</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-amber-600'>
                {stats.mastered}
              </div>
              <div className='text-sm text-gray-500'>Mastered</div>
            </div>
          </div>

          {/* Filtros */}
          <div className='flex flex-col sm:flex-row gap-4 items-center'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='text'
                  placeholder='Search Prime items...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10 border-gray-300'
                />
              </div>
            </div>

            <div className='flex gap-3'>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className='w-40 border-gray-300'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className='w-40 border-gray-300'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='mt-4 text-sm text-gray-500'>
            Showing {filteredSets.length} of {inventory.length} Prime sets
          </div>
        </div>

        {/* Grid de inventario */}
        {loading ? (
          <div className='text-center py-12 text-gray-700'>
            Loading inventory...
          </div>
        ) : filteredSets.length > 0 ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
            {filteredSets.map((primeSet) => (
              <PrimeSet
                key={primeSet.name}
                primeSet={primeSet}
                onUpdatePart={handleUpdatePart}
                onToggleMastery={handleToggleMastery}
                onBuild={handleBuild}
                onSell={handleSell}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Prime sets found
            </h3>
            <p className='text-gray-500'>Try adjusting your search filters.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className='bg-white border-t border-gray-200 mt-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center text-sm text-gray-500'>
            © {new Date().getFullYear()} Prime Inventory. Warframe content and
            materials are trademarks of Digital Extremes Ltd.
          </div>
        </div>
      </footer>
    </div>
  );
}
