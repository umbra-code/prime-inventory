"use client";

import { InventoryTable } from "@/components/inventory/InventoryTable";
import { PrimeSet } from "@/components/inventory/PrimeSet";
import { Button } from "@/components/ui/button";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { useProgressiveCount } from "@/lib/useProgressiveCount";
import Image from "next/image";
import { use } from "react";

/** Nothing to show: says whether the search or the filters are to blame. */
function NoSets() {
  const { searchTerm, activeFilterCount, searchMatchesWithoutFilters, clearFilters } = use(InventoryStateContext);
  const { t, rich } = useI18n();

  return (
    <div className='text-center py-12'>
      <Image src='/icons/logo.svg' alt='' width={48} height={49} className='size-12 mx-auto mb-4 opacity-60' />
      <h3 className='mb-2 font-display text-lg font-bold uppercase tracking-[0.12em] text-oro-ink'>{t("noSetsTitle")}</h3>
      <p className='text-oro-ink-muted'>
        {searchMatchesWithoutFilters > 0
          ? rich(
              "noSetsSearchFilteredHint",
              { count: searchMatchesWithoutFilters, search: searchTerm.trim() },
              {
                b: (text, key) => (
                  <b key={key} className='font-semibold text-oro-ink'>
                    {text}
                  </b>
                ),
              }
            )
          : t(activeFilterCount > 0 && !searchTerm.trim() ? "noSetsFilteredHint" : "noSetsHint")}
      </p>
      {activeFilterCount > 0 && (
        <Button onClick={clearFilters} size='sm' className='mt-4'>
          {t("clearFiltersLong")}
        </Button>
      )}
    </div>
  );
}

export function InventoryGrid() {
  const {
    filteredSets,
    summaries,
    layout,
    searchTerm,
    selectedCategory,
    selectedType,
    selectedStatus,
    selectedAvailability,
    selectedSort,
  } = use(InventoryStateContext);

  // The full list can be 160+ sets: the first ones show at once and the rest
  // follow in batches. A new search, filter, order or layout starts over;
  // editing counts does not, so the list never collapses under the user.
  const listKey = [layout, searchTerm, selectedCategory, selectedType, selectedStatus, selectedAvailability, selectedSort].join("|");
  const shown = useProgressiveCount(filteredSets.length, listKey);
  const sets = shown < filteredSets.length ? filteredSets.slice(0, shown) : filteredSets;

  if (filteredSets.length === 0) return <NoSets />;
  if (layout === "table") return <InventoryTable sets={sets} />;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
      {sets.map((primeSet) => {
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
