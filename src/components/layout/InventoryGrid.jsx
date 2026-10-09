"use client";

import { PrimeSet } from "@/components/inventory/PrimeSet";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import Image from "next/image";
import { use } from "react";

export function InventoryGrid() {
  const { filteredSets, summaries } = use(InventoryStateContext);
  const { t } = useI18n();

  if (filteredSets.length === 0) {
    return (
      <div className='text-center py-12'>
        <Image src='/icons/logo.svg' alt='' width={48} height={49} className='size-12 mx-auto mb-4 opacity-60' />
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
          {t("noSetsTitle")}
        </h3>
        <p className='text-gray-500 dark:text-gray-400'>{t("noSetsHint")}</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {filteredSets.map((primeSet) => {
        const { owned, isMastered } = summaries.get(primeSet.uniqueName);
        return (
          <PrimeSet
            key={primeSet.uniqueName}
            primeSet={primeSet}
            counts={owned}
            isMastered={isMastered}
          />
        );
      })}
    </div>
  );
}
