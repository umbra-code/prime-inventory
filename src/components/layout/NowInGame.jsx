"use client";

import { HighlightPanel, HighlightSet, SET_LIST } from "@/components/layout/HighlightPanel";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { use } from "react";

// Release dates are calendar days ("2026-09-23"); read them as local dates.
const parseDay = (day) => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
};

/** Newest Primes and Primes back from the vault, computed from the catalog. */
export function NowInGame() {
  const { highlights } = use(InventoryStateContext);
  const { t, locale } = useI18n();
  const { newest, returned } = highlights;
  if (newest.length === 0 && returned.length === 0) return null;

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <HighlightPanel storageKey='primeInventoryNowInGame' title={t("nowInGame")}>
      <div className='grid gap-6 lg:grid-cols-2'>
        {newest.length > 0 && (
          <section className='min-w-0'>
            <h3 className='mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-oro-gold'>{t("newestPrimes")}</h3>
            <div className={SET_LIST}>
              {newest.map((set) => (
                <HighlightSet key={set.uniqueName} set={set}>
                  <span className='truncate text-oro-ink-faint'>
                    · {t("releasedIn", { update: set.update ?? "", date: dateFormat.format(parseDay(set.releaseDate)) })}
                  </span>
                </HighlightSet>
              ))}
            </div>
          </section>
        )}

        {returned.length > 0 && (
          <section className='min-w-0'>
            <h3 className='text-[11px] font-semibold uppercase tracking-[0.12em] text-oro-void'>{t("backFromVault")}</h3>
            <p className='mb-2 text-xs text-oro-ink-faint'>{t("backFromVaultHint")}</p>
            <div className={SET_LIST}>
              {returned.map((set) => (
                <HighlightSet key={set.uniqueName} set={set} />
              ))}
            </div>
          </section>
        )}
      </div>
    </HighlightPanel>
  );
}
