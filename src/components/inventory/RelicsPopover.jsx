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
          className={`-mx-1 inline-flex cursor-pointer items-center gap-1 px-1 text-[11px] hover:bg-oro-surface-2 ${
            availableCount > 0 ? "font-semibold text-oro-void" : "text-oro-ink-faint hover:text-oro-ink-muted"
          }`}
        >
          <Gem className='size-3' aria-hidden='true' />
          {relics.length}
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-64 p-0'>
        <div className='border-b border-oro-line px-3 py-2.5 text-xs font-semibold text-oro-ink'>
          {label}
          <span className={`block font-normal ${availableCount > 0 ? "text-oro-void" : "text-oro-ink-muted"}`}>
            {availableCount > 0 ? t("relicsAvailable", counts) : t("relicsAllVaulted", counts)}
          </span>
        </div>
        <ul className='max-h-64 overflow-y-auto py-1 text-sm'>
          {relics.map((relic) => (
            <li key={relic.name} className='flex items-center justify-between gap-3 px-3 py-1'>
              <span className={relic.available ? "font-semibold text-oro-ink" : "text-oro-ink-muted"}>
                {relic.name}
                {relic.available && (
                  <span className='chip ml-2 inline-block bg-oro-void/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-oro-void'>
                    {t("relicAvailable")}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${RARITY_CLASS[relic.rarity]}`}>
                {t(`rarity.${relic.rarity}`)}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
