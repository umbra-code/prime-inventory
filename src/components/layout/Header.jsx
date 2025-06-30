"use client";

import { Button } from "@/components/ui/button";
import { Download, Github, Package, Upload } from "lucide-react";
import { InventoryContext } from "@/context/InventoryContext";
import { use } from "react";
import { ThemeToggler } from "./ThemeToggler";

export function Header() {
  const { handleImport, handleExport, handleResetInventory } = use(InventoryContext);

  return (
    <header className='bg-white border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-900 dark:border-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo y título */}
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-3'>
            <img src="/wf.png" alt="Warframe Logo" className='h-8 w-8' />
            <div>
              <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                Prime Inventory
              </h1>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Warframe Management Tool</p>
            </div>
          </div>
          </div>

          {/* Acciones principales */}
          <div className='flex items-center space-x-3'>
            <ThemeToggler />
            <Button variant='outline' onClick={handleImport} size='sm'>
              <Upload className='size-4' />
              Import
            </Button>
            <Button
              onClick={handleExport}
              size='sm'
              className='bg-amber-600 hover:bg-amber-700'
            >
              <Download className='size-4' />
              Export
            </Button>
            <Button
              className={"bg-red-600 hover:bg-red-700"}
              onClick={handleResetInventory}
              size='sm'
            >
              Reset
            </Button>
            <a
              href={"https://github.com/umbra-code/prime-inventory"}
              className='hover:bg-gray-800 hover:text-white rounded-full p-1.5 transition-colors duration-200 ease-in-out'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Github size={18} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}