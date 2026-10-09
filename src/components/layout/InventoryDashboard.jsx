"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ducats } from "@/components/inventory/Ducats";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { ArrowUpDown, LayoutGrid, Rows3, Search, X } from "lucide-react";
import { use } from "react";

// Beveled field; the border is an inset shadow so the bevel does not cut it.
const FIELD =
  "bevel [--cut:6px] h-[38px] rounded-none border-0 bg-oro-surface dark:bg-oro-surface dark:hover:bg-oro-surface text-oro-ink shadow-[inset_0_0_0_1px_var(--oro-line)] hover:shadow-[inset_0_0_0_1px_var(--oro-line-strong)] focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_1px_var(--oro-gold)]";

function FilterSelect({ value, onValueChange, options, optionLabel, label, icon, className = "" }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        className={`${FIELD} w-full justify-start lg:w-44 data-[size=default]:h-[38px] [&>svg:last-child]:ml-auto ${className}`}
      >
        {icon}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {optionLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function InventoryDashboard() {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedAvailability,
    setSelectedAvailability,
    selectedSort,
    setSelectedSort,
    categories,
    statusFilters,
    availabilityFilters,
    sortOptions,
    stats,
    filteredSets,
    layout,
    setLayout,
  } = use(InventoryStateContext);
  const { t } = useI18n();
  // Option values are internal keys; "All" gets a label per filter.
  const labelFor = (prefix, allKey) => (option) =>
    option === "All" ? t(allKey) : t(`${prefix}.${option}`);

  const statTiles = [
    { label: t("stat.total"), value: stats.total, className: "text-oro-ink" },
    { label: t("stat.ready"), value: stats.ready, className: "text-oro-ready" },
    { label: t("stat.extra"), value: stats.extra, className: "text-oro-extra" },
    { label: t("stat.mastered"), value: stats.mastered, className: "text-oro-gold" },
    {
      label: t("stat.spareDucats"),
      value: (
        <Ducats
          value={stats.spareDucats}
          label={t("spareDucatsLabel")}
          className='gap-2 text-[length:inherit] text-oro-ink [&_img]:size-6'
        />
      ),
      className: "text-oro-ink col-span-2 sm:col-span-1",
    },
  ];

  return (
    <div className='mb-8 grid gap-6'>
      {/* Stats: Cinzel figures between thin dividers */}
      <div className='grid grid-cols-2 gap-y-4 sm:grid-cols-5'>
        {statTiles.map(({ label, value, className }) => (
          <div
            key={label}
            className={`px-2 text-center sm:border-l sm:border-oro-line sm:first:border-l-0 ${className}`}
          >
            <div className='font-display text-2xl font-semibold tabular-nums sm:text-[34px] sm:leading-tight'>{value}</div>
            <div className='text-[11px] uppercase tracking-[0.12em] text-oro-ink-muted'>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
        <div className='w-full lg:flex-1'>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-oro-ink-faint' />
            <Input
              type='search'
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${FIELD} pl-10 pr-10 placeholder:text-oro-ink-faint [&::-webkit-search-cancel-button]:appearance-none`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label={t("clearSearch")}
                className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-oro-ink-faint hover:text-oro-gold'
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex'>
          <FilterSelect
            label={t("filterCategory")}
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            options={categories}
            optionLabel={labelFor("category", "allCategories")}
          />
          <FilterSelect
            label={t("filterStatus")}
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            options={statusFilters}
            optionLabel={labelFor("status", "allStatuses")}
          />
          <FilterSelect
            label={t("filterAvailability")}
            value={selectedAvailability}
            onValueChange={setSelectedAvailability}
            options={availabilityFilters}
            optionLabel={labelFor("availability", "anyAvailability")}
          />
          <FilterSelect
            label={t("sortBy")}
            value={selectedSort}
            onValueChange={setSelectedSort}
            options={sortOptions}
            optionLabel={(option) => t(`sort.${option}`)}
            icon={<ArrowUpDown className='size-4 text-oro-ink-faint' />}
          />
        </div>
      </div>

      <div className='flex items-center justify-between gap-3'>
        <span className='text-sm text-oro-ink-muted'>
          {t("showing", { shown: filteredSets.length, total: stats.total })}
        </span>
        <div role='group' aria-label={t("layoutLabel")} className='flex gap-1'>
          {[
            ["cards", LayoutGrid],
            ["table", Rows3],
          ].map(([value, Icon]) => (
            <button
              key={value}
              type='button'
              aria-pressed={layout === value}
              onClick={() => setLayout(value)}
              title={t(`layout.${value}`)}
              className={`bevel inline-flex h-8 cursor-pointer items-center gap-1.5 px-2.5 text-xs font-medium transition-colors [--cut:5px] ${
                layout === value
                  ? "bg-oro-surface-2 text-oro-gold shadow-[inset_0_0_0_1px_var(--oro-gold)]"
                  : "text-oro-ink-faint shadow-[inset_0_0_0_1px_var(--oro-line)] hover:text-oro-ink"
              }`}
            >
              <Icon className='size-4' aria-hidden='true' />
              <span className='hidden sm:inline'>{t(`layout.${value}`)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
