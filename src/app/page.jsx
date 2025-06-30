"use client";

import { Header } from "@/components/layout/Header";
import { InventoryDashboard } from "@/components/layout/InventoryDashboard";
import { InventoryGrid } from "@/components/layout/InventoryGrid";
import { Footer } from "@/components/layout/Footer";
import { InventoryContext, InventoryProvider } from "@/context/InventoryContext";
import { use } from "react";

function PrimeInventoryContent() {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    inventory,
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
  } = use(InventoryContext);

  return (
    <div className='flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950'>
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

export default function PrimeInventory() {
  return (
    <InventoryProvider>
      <PrimeInventoryContent />
    </InventoryProvider>
  );
}