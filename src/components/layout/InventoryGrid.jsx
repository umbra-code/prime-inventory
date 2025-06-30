"use client";

import { PrimeSet } from "@/components/inventory/PrimeSet";
import { InventoryContext } from "@/context/InventoryContext";
import { Package } from "lucide-react";
import { use } from "react";

export function InventoryGrid() {
  const { loading, filteredSets } = use(InventoryContext);

  if (loading) {
    return (
      <div className='text-center py-12 text-gray-700'>
        Loading inventory...
      </div>
    );
  }

  if (filteredSets.length === 0) {
    return (
      <div className='text-center py-12'>
        <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          No Prime sets found
        </h3>
        <p className='text-gray-500'>Try adjusting your search filters.</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {filteredSets.map((primeSet) => (
        <PrimeSet key={primeSet.name} primeSet={primeSet} />
      ))}
    </div>
  );
}
