"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { SlidersHorizontal, X } from "lucide-react";
import { use } from "react";

/**
 * The filters that narrow the set list, behind one button: a panel with a
 * section per filter, each option a toggle. Picking the selected option
 * again goes back to "all". Sorting stays outside: it is not a filter.
 */

// What each filter shows as a chip, and how to read its options.
const useFilters = () => {
  const state = use(InventoryStateContext);
  const { t } = useI18n();
  return [
    {
      key: "category",
      title: t("filtersCategory"),
      value: state.selectedCategory,
      set: state.setSelectedCategory,
      options: state.categories,
      label: (option) => t(`category.${option}`),
    },
    {
      key: "type",
      title: t("filtersType"),
      value: state.selectedType,
      set: state.setSelectedType,
      options: state.types,
      label: (option) => t(`type.${option}`, {}, option),
      // Types depend on the category: weapons have them, Warframes do not.
      hint: state.selectedCategory === "All" ? t("filtersTypeHint") : null,
    },
    {
      key: "status",
      title: t("filtersStatus"),
      value: state.selectedStatus,
      set: state.setSelectedStatus,
      options: state.statusFilters,
      label: (option) => t(`status.${option}`),
    },
    {
      key: "availability",
      title: t("filtersAvailability"),
      value: state.selectedAvailability,
      set: state.setSelectedAvailability,
      options: state.availabilityFilters,
      label: (option) => t(`availability.${option}`),
    },
  ];
};

function Option({ selected, onClick, children }) {
  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={onClick}
      className={`chip cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors ${
        selected ? "bg-oro-gold/15 text-oro-gold shadow-[inset_0_0_0_1px_var(--oro-gold)]" : "bg-oro-surface-2 text-oro-ink-muted hover:text-oro-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** The "Filters" button and its panel. `className` sizes the button. */
export function FilterPanel({ className = "" }) {
  const { activeFilterCount, clearFilters } = use(InventoryStateContext);
  const { t } = useI18n();
  const filters = useFilters();
  const active = activeFilterCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={`bevel inline-flex h-[38px] cursor-pointer items-center gap-2 px-3 text-sm [--cut:6px] ${
            active
              ? "bg-oro-gold/10 font-medium text-oro-gold shadow-[inset_0_0_0_1px_var(--oro-gold)]"
              : "bg-oro-surface text-oro-ink shadow-[inset_0_0_0_1px_var(--oro-line)] hover:shadow-[inset_0_0_0_1px_var(--oro-line-strong)]"
          } ${className}`}
        >
          <SlidersHorizontal className={`size-4 ${active ? "" : "text-oro-ink-faint"}`} aria-hidden='true' />
          {t("filtersButton")}
          {active && <span className='ml-auto font-mono text-xs tabular-nums'>{activeFilterCount}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align='end' className='grid w-[min(26rem,calc(100vw-2rem))] gap-4 p-4'>
        {filters.map((filter) => (
          <section key={filter.key} className='grid gap-2'>
            <h3 className='text-[11px] font-semibold uppercase tracking-[0.12em] text-oro-gold'>{filter.title}</h3>
            {filter.hint ? (
              <p className='text-xs text-oro-ink-faint'>{filter.hint}</p>
            ) : (
              <div className='flex flex-wrap gap-1.5'>
                {filter.options
                  .filter((option) => option !== "All")
                  .map((option) => (
                    <Option
                      key={option}
                      selected={filter.value === option}
                      onClick={() => filter.set(filter.value === option ? "All" : option)}
                    >
                      {filter.label(option)}
                    </Option>
                  ))}
              </div>
            )}
          </section>
        ))}
        {active && (
          <button
            type='button'
            onClick={clearFilters}
            className='justify-self-start text-xs text-oro-ink-muted underline-offset-2 hover:text-oro-gold hover:underline'
          >
            {t("clearFiltersLong")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** One removable chip per active filter, so a narrowed list never goes unnoticed. */
export function ActiveFilters() {
  const { activeFilterCount, clearFilters } = use(InventoryStateContext);
  const { t } = useI18n();
  const filters = useFilters();
  if (activeFilterCount === 0) return null;

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {filters
        .filter((filter) => filter.value !== "All" && !filter.hint)
        .map((filter) => (
          <button
            key={filter.key}
            type='button'
            onClick={() => filter.set("All")}
            aria-label={t("removeFilter", { name: filter.label(filter.value) })}
            className='chip inline-flex cursor-pointer items-center gap-1 bg-oro-gold/15 py-1 pl-2.5 pr-1.5 text-xs font-medium text-oro-gold hover:bg-oro-gold/25'
          >
            {filter.label(filter.value)}
            <X className='size-3.5' aria-hidden='true' />
          </button>
        ))}
      {activeFilterCount > 1 && (
        <button type='button' onClick={clearFilters} className='px-1 text-xs text-oro-ink-muted underline-offset-2 hover:text-oro-gold hover:underline'>
          {t("clearAll")}
        </button>
      )}
    </div>
  );
}
