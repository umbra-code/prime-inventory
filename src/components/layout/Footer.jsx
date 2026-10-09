"use client";

import { useI18n } from "@/i18n/I18nContext";
import { AppVersion } from "./AppVersion";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className='relative mt-16 border-t border-oro-line bg-oro-surface'>
      <span aria-hidden='true' className='oro-diamond absolute -top-[5px] left-1/2 -translate-x-1/2 bg-oro-gold' />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='text-center text-sm text-oro-ink-muted'>
          {t("footer", { year: String(new Date().getFullYear()) })}
          <AppVersion className='mt-2 block text-xs text-oro-gold' />
        </div>
      </div>
    </footer>
  );
}