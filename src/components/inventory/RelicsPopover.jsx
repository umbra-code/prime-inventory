"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n/I18nContext";
import { RARITY_CLASS } from "@/lib/relics";
import { Gem } from "lucide-react";

/** Button listing the relics a part drops from; available relics come first. */
export function RelicsPopover({ relics = [], label }) {
  const { t } = useI18n();
  if (relics.length === 0) return null;
  const availableCount = relics.filter((relic) => relic.available).length;
  const counts = { count: relics.length, available: availableCount };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={t("relicsButton", { name: label, ...counts })}
          className={`inline-flex items-center gap-1 rounded px-1 -mx-1 text-[11px] hover:bg-gray-100 dark:hover:bg-gray-700 ${
            availableCount > 0
              ? "font-medium text-sky-700 dark:text-sky-300"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <Gem className='size-3' aria-hidden='true' />
          {relics.length}
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-64 p-0'>
        <div className='border-b px-3 py-2 text-xs font-semibold'>
          {label}
          <span className='block font-normal text-muted-foreground'>
            {availableCount > 0 ? t("relicsAvailable", counts) : t("relicsAllVaulted", counts)}
          </span>
        </div>
        <ul className='max-h-64 overflow-y-auto py-1 text-sm'>
          {relics.map((relic) => (
            <li key={relic.name} className='flex items-center justify-between gap-3 px-3 py-1'>
              <span className={relic.available ? "font-medium" : "text-muted-foreground"}>
                {relic.name}
                {relic.available && (
                  <span className='ml-1.5 rounded bg-sky-100 px-1 text-[10px] font-medium text-sky-800 dark:bg-sky-900/60 dark:text-sky-200'>
                    {t("relicAvailable")}
                  </span>
                )}
              </span>
              <span className={`text-xs ${RARITY_CLASS[relic.rarity]}`}>{t(`rarity.${relic.rarity}`)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
