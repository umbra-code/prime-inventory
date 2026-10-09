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
import { GithubIcon } from "@/components/icons/GithubIcon";
import { Download, RotateCcw, Upload } from "lucide-react";
import Image from "next/image";
import { use } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { OfflineBadge } from "./OfflineBadge";
import { PreferencesMenu } from "./PreferencesMenu";

export function Header() {
  const { importInventory, exportInventory, resetInventory } = use(InventoryActionsContext);
  const { t } = useI18n();

  return (
    <header className='bg-white border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-900 dark:border-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between gap-3 h-16'>
          {/* Logo and title */}
          <div className='flex items-center gap-3 min-w-0'>
            <Image src='/icons/logo.svg' alt='' width={32} height={33} className='size-8 shrink-0' />
            <div className='min-w-0'>
              <div className='flex items-center gap-2'>
                <h1 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate'>
                  Prime Inventory
                </h1>
                <OfflineBadge />
              </div>
              <p className='hidden sm:block text-xs text-gray-500 dark:text-gray-400'>
                {t("appTagline")}
              </p>
            </div>
          </div>

          {/* Main actions: labels collapse to icons on small screens */}
          <div className='flex items-center gap-1.5 sm:gap-3 shrink-0'>
            <PreferencesMenu />
            <Button variant='outline' onClick={importInventory} size='sm' aria-label={t("importInventory")}>
              <Upload className='size-4' />
              <span className='hidden md:inline'>{t("import")}</span>
            </Button>
            <Button
              onClick={exportInventory}
              size='sm'
              className='bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 dark:text-white'
              aria-label={t("exportInventory")}
            >
              <Download className='size-4' />
              <span className='hidden md:inline'>{t("export")}</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white' size='sm' aria-label={t("resetInventory")}>
                  <RotateCcw className='size-4' />
                  <span className='hidden md:inline'>{t("reset")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("resetTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("resetDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={resetInventory} className='bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white'>
                    {t("reset")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <a
              href='https://github.com/umbra-code/prime-inventory'
              className='hidden sm:block hover:bg-gray-800 hover:text-white rounded-full p-1.5 transition-colors duration-200 ease-in-out'
              target='_blank'
              rel='noopener noreferrer'
              aria-label={t("sourceCode")}
            >
              <GithubIcon size={18} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
