"use client";

import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { imageUrl } from "@/lib/images";
import { STATUS } from "@/lib/setStatus";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";
import Image from "next/image";
import { use, useState } from "react";

// On phones each list of sets is a horizontal strip, so the panels stay short.
export const SET_LIST =
  "-mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0";

const loadOpen = (storageKey) => {
  try {
    return localStorage.getItem(storageKey) !== "closed";
  } catch {
    return true;
  }
};

/** A collapsible panel above the inventory that remembers whether it is open. */
export function HighlightPanel({ storageKey, title, children }) {
  const [open, setOpen] = useState(() => loadOpen(storageKey));

  return (
    <details
      open={open}
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        setOpen(isOpen);
        try {
          localStorage.setItem(storageKey, isOpen ? "open" : "closed");
        } catch {
          // Remembering the panel state is a convenience.
        }
      }}
      className='group/panel border border-oro-line bg-oro-surface'
    >
      <summary className='flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 px-[18px] py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-oro-ink'>
        <ChevronRight className='size-4 text-oro-gold transition-transform group-open/panel:rotate-90' aria-hidden='true' />
        {title}
      </summary>
      <div className='border-t border-oro-line px-[18px] pb-5 pt-4'>{children}</div>
    </details>
  );
}

/**
 * One set in a panel: image, name, the user's progress; opens the set.
 * Mastered sets get a thin frame and a check, and keep their progress, since
 * their parts can still be farmed to sell.
 */
export function HighlightSet({ set, children }) {
  const { showSetInInventory } = use(InventoryActionsContext);
  const { summaries } = use(InventoryStateContext);
  const { t, setName } = useI18n();
  const summary = summaries.get(set.uniqueName);
  const status = summary?.status ?? "incomplete";
  const isMastered = summary?.isMastered ?? false;
  const accent = STATUS[status].accent;
  const progress =
    status === "incomplete" ? t("highlightIncomplete", { percent: Math.floor(summary?.progress ?? 0) }) : t(STATUS[status].badge);

  return (
    <button
      type='button'
      onClick={() => showSetInInventory(set)}
      title={t("showInInventory", { name: setName(set) })}
      className={cn(
        "group flex min-w-[240px] shrink-0 snap-start cursor-pointer items-center gap-3 border p-1.5 text-left hover:bg-oro-surface-2 sm:min-w-0 sm:shrink",
        isMastered ? "border-oro-line" : "border-transparent"
      )}
    >
      <span className='bevel grid size-11 shrink-0 place-items-center bg-oro-surface-2 [--cut:7px]'>
        {set.imageName && <Image src={imageUrl(set.imageName)} alt='' width={40} height={40} className='size-10 object-contain' />}
      </span>
      <span className='min-w-0'>
        <span className='flex items-center gap-1.5'>
          <span className='truncate font-display text-[13px] font-bold uppercase tracking-[0.06em] text-oro-ink group-hover:text-oro-gold'>
            {setName(set)}
          </span>
          {isMastered && (
            // Labelled, not sr-only text: that is absolutely positioned and would
            // escape the phone strip's clipping, widening the whole page.
            <span role='img' aria-label={t("masteredToggle")} title={t("masteredToggle")} className='shrink-0 text-oro-ink-faint'>
              <Check aria-hidden='true' className='size-3.5' />
            </span>
          )}
        </span>
        <span className='flex items-center gap-1.5 text-xs text-oro-ink-muted'>
          <span aria-hidden='true' className='oro-diamond !size-[7px] shrink-0' style={{ background: accent }} />
          <span className='shrink-0 whitespace-nowrap' style={status === "incomplete" ? undefined : { color: accent }}>
            {progress}
          </span>
          {children}
        </span>
      </span>
    </button>
  );
}
