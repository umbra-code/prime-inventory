
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusFilters = [
  "All",
  "Buildable",
  "Incomplete",
  "Mastered",
  "Extra Sets",
];

export function StatsPanel({
  stats,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  filteredSetsCount,
  totalSetsCount,
  categories,
}) {
  return (
    <div className='mb-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6'>
      {/* Estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-gray-700/50 rounded-lg p-4 text-center border border-gray-600'>
          <div className='text-2xl font-bold text-white'>{stats.total}</div>
          <div className='text-sm text-gray-300'>Total Sets</div>
        </div>
        <div className='bg-green-900/30 rounded-lg p-4 text-center border border-green-700/50'>
          <div className='text-2xl font-bold text-green-400'>
            {stats.buildable}
          </div>
          <div className='text-sm text-gray-300'>Ready to Build</div>
        </div>
        <div className='bg-amber-900/30 rounded-lg p-4 text-center border border-amber-600/50'>
          <div className='text-2xl font-bold text-amber-400'>
            {stats.mastered}
          </div>
          <div className='text-sm text-gray-300'>Mastered</div>
        </div>
      </div>

      {/* Filtros */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='sm:w-48'>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className='bg-gray-700/50 border-gray-600 text-white focus:border-amber-500'>
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent className='bg-gray-800 border-gray-600'>
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className='text-white hover:bg-gray-700'
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='sm:w-48'>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className='bg-gray-700/50 border-gray-600 text-white focus:border-amber-500'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent className='bg-gray-800 border-gray-600'>
              {statusFilters.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  className='text-white hover:bg-gray-700'
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex-1 text-sm text-gray-300 flex items-center'>
          Showing {filteredSetsCount} of {totalSetsCount} Prime sets
        </div>
      </div>
    </div>
  );
}
