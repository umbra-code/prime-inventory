"use client";

import { InventoryTable } from "@/components/inventory/InventoryTable";
import { PrimeSet } from "@/components/inventory/PrimeSet";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import Image from "next/image";
import { use } from "react";

export function InventoryGrid() {
  const { filteredSets, summaries, layout } = use(InventoryStateContext);
  const { t } = useI18n();

  if (filteredSets.length === 0) {
    return (
      <div className='text-center py-12'>
        <Image src='/icons/logo.svg' alt='' width={48} height={49} className='size-12 mx-auto mb-4 opacity-60' />
        <h3 className='mb-2 font-display text-lg font-bold uppercase tracking-[0.12em] text-oro-ink'>
          {t("noSetsTitle")}
        </h3>
        <p className='text-oro-ink-muted'>{t("noSetsHint")}</p>
      </div>
    );
  }

  if (layout === "table") return <InventoryTable />;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {filteredSets.map((primeSet) => {
        const { owned, isMastered, inArsenal } = summaries.get(primeSet.uniqueName);
        return (
          <PrimeSet
            key={primeSet.uniqueName}
            primeSet={primeSet}
            counts={owned}
            isMastered={isMastered}
            inArsenal={inArsenal}
          />
        );
      })}
    </div>
  );
}
