"use client";

import { useI18n } from "@/i18n/I18nContext";
import { AppVersion } from "./AppVersion";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className='bg-white border-t border-gray-200 mt-16 dark:bg-gray-900 dark:border-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='text-center text-sm text-gray-500 dark:text-gray-400'>
          {t("footer", { year: String(new Date().getFullYear()) })}
          <AppVersion className='mt-2 block text-xs' />
        </div>
      </div>
    </footer>
  );
}