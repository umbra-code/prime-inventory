"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export function InventoryDashboard({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  categories,
  statusFilters,
  stats,
  filteredSetsLength,
  inventoryLength,
}) {
  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6 mb-8'>
      {/* Estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
        <div className='text-center'>
          <div className='text-3xl font-bold text-gray-900'>{stats.total}</div>
          <div className='text-sm text-gray-500'>Total Prime Sets</div>
        </div>
        <div className='text-center'>
          <div className='text-3xl font-bold text-green-600'>
            {stats.buildable}
          </div>
          <div className='text-sm text-gray-500'>Ready to Build</div>
        </div>
        <div className='text-center'>
          <div className='text-3xl font-bold text-amber-600'>
            {stats.mastered}
          </div>
          <div className='text-sm text-gray-500'>Mastered</div>
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
              className='pl-10 border-gray-300'
            />
          </div>
        </div>

        <div className='flex gap-3'>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='w-40 border-gray-300'>
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className='w-40 border-gray-300'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='mt-4 text-sm text-gray-500'>
        Showing {filteredSetsLength} of {inventoryLength} Prime sets
      </div>
    </div>
  );
}
