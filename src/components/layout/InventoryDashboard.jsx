"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryContext } from "@/context/InventoryContext";
import { Search, X } from "lucide-react";
import { use } from "react";

export function InventoryDashboard() {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    categories,
    statusFilters,
    stats,
    filteredSets,
    inventory,
  } = use(InventoryContext);

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6 mb-8 dark:bg-gray-900 dark:border-gray-800'>
      {/* Estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
        <div className='text-center'>
          <div className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
            {stats.total}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Total Prime Sets
          </div>
        </div>
        <div className='text-center'>
          <div className='text-3xl font-bold text-green-600'>
            {stats.buildable}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Ready to Build
          </div>
        </div>
        <div className='text-center'>
          <div className='text-3xl font-bold text-amber-600'>
            {stats.mastered}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Mastered
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className='flex flex-col sm:flex-row gap-4 items-center'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              type='search'
              placeholder='Search Prime items...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 pr-10 border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1'
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className='flex gap-3'>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='w-40 border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'>
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent className='dark:bg-gray-800 dark:border-gray-700'>
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className='dark:text-gray-100 dark:hover:bg-gray-700'
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className='w-40 border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent className='dark:bg-gray-800 dark:border-gray-700'>
              {statusFilters.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  className='dark:text-gray-100 dark:hover:bg-gray-700'
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
        Showing {filteredSets.length} of {inventory.length} Prime sets
      </div>
    </div>
  );
}
