"use client";

import { Button } from "@/components/ui/button";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { Download, Upload } from "lucide-react";
import Image from "next/image";
import { use } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { AppVersion } from "./AppVersion";
import { OfflineBadge } from "./OfflineBadge";
import { PreferencesMenu } from "./PreferencesMenu";
import { SendToDevice } from "./SendToDevice";

export function Header() {
  const { importInventory, exportInventory } = use(InventoryActionsContext);
  const { t } = useI18n();

  return (
    <header className='sticky top-0 z-50 border-b border-oro-line bg-oro-surface'>
      {/* Gilded diamond centred on the bottom edge */}
      <span
        aria-hidden='true'
        className='oro-diamond absolute -bottom-[5px] left-1/2 -translate-x-1/2 bg-oro-gold'
      />
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between gap-3'>
          {/* Logo and title */}
          <div className='flex min-w-0 items-center gap-3'>
            <Image src='/icons/logo.svg' alt='' width={34} height={35} className='size-8 shrink-0 sm:size-9' />
            <div className='min-w-0'>
              <div className='flex items-center gap-2'>
                <h1 className='truncate font-display text-[13px] font-bold uppercase tracking-[0.04em] text-oro-ink min-[400px]:text-sm sm:text-lg sm:tracking-[0.12em]'>
                  Prime Inventory
                </h1>
                <OfflineBadge />
              </div>
              <p className='hidden text-xs text-oro-ink-muted sm:block'>
                {t("appTagline")} · <AppVersion className='text-[11px] text-oro-gold' />
              </p>
            </div>
          </div>

          {/* Main actions: labels collapse to icons on small screens */}
          <div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
            <PreferencesMenu />
            <SendToDevice />
            <Button variant='outline' onClick={importInventory} size='sm' aria-label={t("importInventory")}>
              <Upload />
              <span className='hidden md:inline'>{t("import")}</span>
            </Button>
            <Button onClick={exportInventory} size='sm' aria-label={t("exportInventory")}>
              <Download />
              <span className='hidden md:inline'>{t("export")}</span>
            </Button>
            <Button asChild variant='outline' size='icon' className='hidden size-8 sm:inline-flex'>
              <a
                href='https://github.com/umbra-code/prime-inventory'
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t("sourceCode")}
              >
                <GithubIcon size={16} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
