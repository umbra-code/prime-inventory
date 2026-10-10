"use client";

import { HighlightPanel, HighlightSet, SET_LIST } from "@/components/layout/HighlightPanel";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { masteredLast } from "@/services/highlights";
import { loadPrimeResurgence, matchOfferSets } from "@/services/primeResurgence";
import { use, useEffect, useMemo, useState } from "react";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// "in 20 days", or hours on the last day.
const formatTimeLeft = (expiry, locale) => {
  const left = Date.parse(expiry) - Date.now();
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return left >= DAY ? relative.format(Math.round(left / DAY), "day") : relative.format(Math.max(1, Math.ceil(left / HOUR)), "hour");
};

/** The Primes Varzia sells right now, with the exact end of the rotation. */
export function PrimeResurgence() {
  const { catalog, summaries } = use(InventoryStateContext);
  const { t, locale } = useI18n();
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    let active = true;
    loadPrimeResurgence().then((result) => {
      if (active) setOffer(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const offered = useMemo(() => (offer ? matchOfferSets(offer, catalog.sets) : []), [offer, catalog]);
  const sets = useMemo(() => masteredLast(offered, summaries), [offered, summaries]);
  if (!offer || sets.length === 0) return null;

  const endDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(offer.expiry));

  return (
    <HighlightPanel
      storageKey='primeInventoryResurgence'
      title={
        <>
          {t("primeResurgence")}
          <span className='font-sans text-xs font-medium normal-case tracking-normal text-oro-ink-faint'>
            <span className='hidden sm:inline'>· </span>
            {t("resurgenceEnds", { relative: formatTimeLeft(offer.expiry, locale) })}
          </span>
        </>
      }
    >
      <p className='mb-2 text-xs text-oro-ink-faint'>
        {t("resurgenceHint", { location: offer.location ?? "Maroo's Bazaar", date: endDate })}
      </p>
      <div className={`${SET_LIST} lg:grid-cols-4`}>
        {sets.map((set) => (
          <HighlightSet key={set.uniqueName} set={set} />
        ))}
      </div>
    </HighlightPanel>
  );
}
