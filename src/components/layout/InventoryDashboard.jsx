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
import { ArrowUpDown, Search, X } from "lucide-react";
import { use } from "react";

function FilterSelect({ value, onValueChange, options, optionLabel, label, icon, className = "" }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        className={`w-full sm:w-44 justify-start [&>svg:last-child]:ml-auto border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 ${className}`}
      >
        {icon}
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='dark:bg-gray-800 dark:border-gray-700'>
        {options.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className='dark:text-gray-100 dark:hover:bg-gray-700'
          >
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
  } = use(InventoryStateContext);
  const { t } = useI18n();
  // Option values are internal keys; "All" gets a label per filter.
  const labelFor = (prefix, allKey) => (option) =>
    option === "All" ? t(allKey) : t(`${prefix}.${option}`);

  const statTiles = [
    { label: t("stat.total"), value: stats.total, className: "text-gray-900 dark:text-gray-100" },
    { label: t("stat.ready"), value: stats.ready, className: "text-green-600 dark:text-green-500" },
    { label: t("stat.extra"), value: stats.extra, className: "text-violet-600 dark:text-violet-400" },
    { label: t("stat.mastered"), value: stats.mastered, className: "text-amber-600" },
    {
      label: t("stat.spareDucats"),
      value: (
        <Ducats value={stats.spareDucats} label={t("spareDucatsLabel")} className='[&_img]:size-6 gap-1.5' />
      ),
      className: "text-gray-900 dark:text-gray-100 col-span-2 sm:col-span-1",
    },
  ];

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-8 dark:bg-gray-900 dark:border-gray-800'>
      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 mb-6'>
        {statTiles.map(({ label, value, className }) => (
          <div key={label} className={`text-center ${className}`}>
            <div className='text-2xl sm:text-3xl font-bold'>{value}</div>
            <div className='text-xs sm:text-sm text-gray-500 dark:text-gray-400'>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className='flex flex-col lg:flex-row gap-4 lg:items-center'>
        <div className='w-full lg:flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              type='search'
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 pr-10 border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 [&::-webkit-search-cancel-button]:appearance-none'
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label={t("clearSearch")}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1'
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:flex'>
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
            icon={<ArrowUpDown className='size-4 opacity-60' />}
          />
        </div>
      </div>

      <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
        {t("showing", { shown: filteredSets.length, total: stats.total })}
      </div>
    </div>
  );
}
