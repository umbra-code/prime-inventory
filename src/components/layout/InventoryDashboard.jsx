"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryStateContext } from "@/context/InventoryContext";
import { ArrowUpDown, Search, X } from "lucide-react";
import { use } from "react";

function FilterSelect({ value, onValueChange, options, label, icon, allLabel, className = "" }) {
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
            {option === "All" && allLabel ? allLabel : option}
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
    selectedSort,
    setSelectedSort,
    categories,
    statusFilters,
    sortOptions,
    stats,
    filteredSets,
  } = use(InventoryStateContext);

  const statTiles = [
    { label: "Total Prime Sets", value: stats.total, className: "text-gray-900 dark:text-gray-100" },
    { label: "Ready to Build", value: stats.ready, className: "text-green-600 dark:text-green-500" },
    { label: "Extra Sets", value: stats.extra, className: "text-violet-600 dark:text-violet-400" },
    { label: "Mastered", value: stats.mastered, className: "text-amber-600" },
  ];

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-8 dark:bg-gray-900 dark:border-gray-800'>
      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6'>
        {statTiles.map(({ label, value, className }) => (
          <div key={label} className='text-center'>
            <div className={`text-2xl sm:text-3xl font-bold ${className}`}>{value}</div>
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
              placeholder='Search Prime items...'
              aria-label='Search Prime items'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 pr-10 border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 [&::-webkit-search-cancel-button]:appearance-none'
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label='Clear search'
                className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1'
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:flex'>
          <FilterSelect
            label='Filter by category'
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            options={categories}
            allLabel='All Categories'
          />
          <FilterSelect
            label='Filter by status'
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            options={statusFilters}
            allLabel='All Statuses'
          />
          <FilterSelect
            label='Sort by'
            value={selectedSort}
            onValueChange={setSelectedSort}
            options={sortOptions}
            icon={<ArrowUpDown className='size-4 opacity-60' />}
            className='col-span-2 sm:col-span-1'
          />
        </div>
      </div>

      <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
        Showing {filteredSets.length} of {stats.total} Prime sets
      </div>
    </div>
  );
}
