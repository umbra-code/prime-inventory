"use client";

import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { imageUrl } from "@/lib/images";
import { STATUS } from "@/lib/setStatus";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { use, useState } from "react";

const OPEN_KEY = "primeInventoryNowInGame";

// On phones each section is a horizontal strip, so the panel stays short.
const SET_LIST = "-mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0";

const loadOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) !== "closed";
  } catch {
    return true;
  }
};

// Release dates are calendar days ("2026-09-23"); read them as local dates.
const parseDay = (day) => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
};

/** One set in the panel: image, name, the user's progress; opens the set. */
function HighlightSet({ set, children }) {
  const { showSetInInventory } = use(InventoryActionsContext);
  const { summaries } = use(InventoryStateContext);
  const { t, setName } = useI18n();
  const summary = summaries.get(set.uniqueName);
  const status = summary?.status ?? "incomplete";
  const accent = STATUS[status].accent;
  const progress =
    status === "incomplete" ? t("highlightIncomplete", { percent: Math.floor(summary?.progress ?? 0) }) : t(STATUS[status].badge);

  return (
    <button
      type='button'
      onClick={() => showSetInInventory(set)}
      title={t("showInInventory", { name: setName(set) })}
      className='group flex min-w-[240px] shrink-0 snap-start cursor-pointer items-center gap-3 p-1.5 text-left hover:bg-oro-surface-2 sm:min-w-0 sm:shrink'
    >
      <span className='bevel grid size-11 shrink-0 place-items-center bg-oro-surface-2 [--cut:7px]'>
        {set.imageName && <Image src={imageUrl(set.imageName)} alt='' width={40} height={40} className='size-10 object-contain' />}
      </span>
      <span className='min-w-0'>
        <span className='block truncate font-display text-[13px] font-bold uppercase tracking-[0.06em] text-oro-ink group-hover:text-oro-gold'>
          {setName(set)}
        </span>
        <span className='flex items-center gap-1.5 text-xs text-oro-ink-muted'>
          <span aria-hidden='true' className='oro-diamond !size-[7px]' style={{ background: accent }} />
          <span style={status === "incomplete" ? undefined : { color: accent }}>{progress}</span>
          {children}
        </span>
      </span>
    </button>
  );
}

/** Newest Primes and Primes back from the vault, computed from the catalog. */
export function NowInGame() {
  const { highlights } = use(InventoryStateContext);
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(loadOpen);
  const { newest, returned } = highlights;
  if (newest.length === 0 && returned.length === 0) return null;

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <details
      open={open}
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        setOpen(isOpen);
        try {
          localStorage.setItem(OPEN_KEY, isOpen ? "open" : "closed");
        } catch {
          // Remembering the panel state is a convenience.
        }
      }}
      className='group/panel mb-8 border border-oro-line bg-oro-surface'
    >
      <summary className='flex cursor-pointer list-none items-center gap-2 px-[18px] py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-oro-ink'>
        <ChevronRight className='size-4 text-oro-gold transition-transform group-open/panel:rotate-90' aria-hidden='true' />
        {t("nowInGame")}
      </summary>

      <div className='grid gap-6 border-t border-oro-line px-[18px] pb-5 pt-4 lg:grid-cols-2'>
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
    </details>
  );
}
