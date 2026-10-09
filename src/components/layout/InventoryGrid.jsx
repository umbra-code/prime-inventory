"use client";

import { PrimeSet } from "@/components/inventory/PrimeSet";
import { InventoryStateContext } from "@/context/InventoryContext";
import { getCount } from "@/services/userInventory";
import Image from "next/image";
import { use } from "react";

export function InventoryGrid() {
  const { filteredSets, userData } = use(InventoryStateContext);

  if (filteredSets.length === 0) {
    return (
      <div className='text-center py-12'>
        <Image src='/wf.png' alt='' width={48} height={48} className='size-12 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
          No Prime sets found
        </h3>
        <p className='text-gray-500 dark:text-gray-400'>Try adjusting your search filters.</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {filteredSets.map((primeSet) => (
        <PrimeSet
          key={primeSet.uniqueName}
          primeSet={primeSet}
          counts={primeSet.components.map((part) => getCount(userData.counts, part.uniqueName))}
          isMastered={Boolean(userData.mastered[primeSet.uniqueName])}
        />
      ))}
    </div>
  );
}
