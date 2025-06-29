
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Package, Search, Upload } from "lucide-react";

export function Navbar({ searchTerm, onSearchTermChange, onImport, onExport, onReset }) {
  return (
    <nav className='sticky top-4 z-50 mx-4 mb-6'>
      <div className='bg-gray-800/90 backdrop-blur-md border border-amber-500/30 rounded-xl shadow-2xl'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            {/* Logo */}
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-amber-600 rounded-lg'>
                <Package className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-white'>
                  Prime Inventory
                </h1>
                <p className='text-xs text-amber-300'>Warframe Manager</p>
              </div>
            </div>

            {/* Central search bar */}
            <div className='flex-1 max-w-md mx-8'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  type='text'
                  placeholder='Search Prime items...'
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className='pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-amber-500'
                />
              </div>
            </div>

            {/* Import/Export Buttons */}
            <div className='flex items-center space-x-3'>
              <Button
                variant='outline'
                onClick={onImport}
                className='bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600 hover:border-sky-500'
              >
                <Upload className='h-4 w-4 mr-2' />
                Import
              </Button>
              <Button
                onClick={onExport}
                className='bg-amber-600 hover:bg-amber-700 text-white'
              >
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
              <Button
                variant='outline'
                onClick={onReset}
                className='bg-red-700/50 border-red-600 text-white hover:bg-red-600 hover:border-red-500'
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
