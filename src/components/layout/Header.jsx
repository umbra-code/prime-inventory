"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { Download, Github, RotateCcw, Upload } from "lucide-react";
import Image from "next/image";
import { use } from "react";
import { ThemeToggler } from "./ThemeToggler";

export function Header() {
  const { importInventory, exportInventory, resetInventory } = use(InventoryActionsContext);

  return (
    <header className='bg-white border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-900 dark:border-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between gap-3 h-16'>
          {/* Logo and title */}
          <div className='flex items-center gap-3 min-w-0'>
            <Image src='/wf.png' alt='' width={32} height={32} className='size-8 shrink-0' />
            <div className='min-w-0'>
              <h1 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate'>
                Prime Inventory
              </h1>
              <p className='hidden sm:block text-xs text-gray-500 dark:text-gray-400'>
                Warframe Management Tool
              </p>
            </div>
          </div>

          {/* Main actions: labels collapse to icons on small screens */}
          <div className='flex items-center gap-1.5 sm:gap-3 shrink-0'>
            <ThemeToggler />
            <Button variant='outline' onClick={importInventory} size='sm' aria-label='Import inventory'>
              <Upload className='size-4' />
              <span className='hidden md:inline'>Import</span>
            </Button>
            <Button
              onClick={exportInventory}
              size='sm'
              className='bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 dark:text-white'
              aria-label='Export inventory'
            >
              <Download className='size-4' />
              <span className='hidden md:inline'>Export</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white' size='sm' aria-label='Reset inventory'>
                  <RotateCcw className='size-4' />
                  <span className='hidden md:inline'>Reset</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset your inventory?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All part counts and mastered sets will be cleared. Export a backup first if
                    you might want them back later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetInventory} className='bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white'>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <a
              href='https://github.com/umbra-code/prime-inventory'
              className='hidden sm:block hover:bg-gray-800 hover:text-white rounded-full p-1.5 transition-colors duration-200 ease-in-out'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Source code on GitHub'
            >
              <Github size={18} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
