"use client";

import { RelicsPopover } from "@/components/inventory/RelicsPopover";
import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { imageUrl } from "@/lib/images";
import { RARITY_CLASS } from "@/lib/relics";
import { ChevronRight, PartyPopper } from "lucide-react";
import Image from "next/image";
import { use } from "react";

/** A missing part; clicking it opens its set in the inventory tab. */
function PartButton({ entry, children }) {
  const { showSetInInventory } = use(InventoryActionsContext);
  const { t, setName, fullPartName } = useI18n();
  return (
    <button
      type='button'
      onClick={() => showSetInInventory(entry.set)}
      title={t("showInInventory", { name: setName(entry.set) })}
      className='flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left hover:text-oro-gold'
    >
      {entry.part.imageName && (
        <Image
          src={imageUrl(entry.part.imageName)}
          alt=''
          width={32}
          height={32}
          className='bevel size-[34px] shrink-0 bg-oro-surface-2 object-contain p-0.5 [--cut:6px]'
        />
      )}
      <span className='min-w-0'>
        <span className='block truncate text-sm font-medium'>
          {fullPartName(entry.set, entry.part)}
        </span>
        {children}
      </span>
    </button>
  );
}

function MissingCount({ missing }) {
  if (missing <= 1) return null;
  return <span className='shrink-0 font-mono text-xs text-oro-ink-muted'>×{missing}</span>;
}

function RelicCard({ relic }) {
  const { t } = useI18n();
  // Void cyan marks relics that drop right now.
  return (
    <div className='oro-glow' style={{ "--accent": "var(--oro-void)", "--strength": 0.6 }}>
      <section className='oro-frame'>
        <div className='oro-frame-inner'>
          <header className='flex items-baseline justify-between gap-3 px-[18px] pb-3 pt-4'>
            <h3 className='font-display text-base font-bold uppercase tracking-[0.12em] text-oro-ink'>
              {t("relicTitle", { name: relic.name })}
            </h3>
            <span className='text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-oro-void'>
              {t("partsYouNeed", { count: relic.entries.length })}
            </span>
          </header>
          <ul className='space-y-0.5 px-2.5 pb-3.5'>
            {relic.entries.map((entry) => (
              <li key={entry.part.uniqueName} className='flex items-center gap-3 px-2 py-1.5 hover:bg-oro-surface-2'>
                <PartButton entry={entry} />
                <MissingCount missing={entry.missing} />
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap ${RARITY_CLASS[entry.rarity]}`}
                >
                  {t(`rarity.${entry.rarity}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function VaultedOnly({ entries }) {
  const { t, fullPartName } = useI18n();
  if (entries.length === 0) return null;
  const setCount = new Set(entries.map((entry) => entry.set.uniqueName)).size;

  return (
    <details className='group mt-8 border border-oro-line bg-oro-surface'>
      <summary className='flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-[18px] py-3.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-oro-ink'>
        <ChevronRight className='size-4 text-oro-gold transition-transform group-open:rotate-90' aria-hidden='true' />
        {t("vaultedOnlyTitle")}
        <span className='font-sans text-sm font-normal normal-case tracking-normal text-oro-ink-muted'>
          {t("vaultedOnlyCount", {
            parts: t("partsCount", { count: entries.length }),
            sets: t("setsCount", { count: setCount }),
          })}
        </span>
      </summary>
      <p className='max-w-[70ch] px-[18px] pb-3 text-sm text-oro-ink-muted'>{t("vaultedOnlyHint")}</p>
      <ul className='grid gap-x-6 gap-y-1 px-2 pb-4 sm:grid-cols-2 lg:grid-cols-3'>
        {entries.map((entry) => (
          <li key={entry.part.uniqueName} className='flex items-center gap-2 px-2 py-1.5 hover:bg-oro-surface-2'>
            <PartButton entry={entry}>
              {!entry.part.relics?.length && (
                <span className='block text-xs text-oro-ink-faint'>{t("noKnownRelic")}</span>
              )}
            </PartButton>
            <RelicsPopover relics={entry.part.relics} label={fullPartName(entry.set, entry.part)} />
            <MissingCount missing={entry.missing} />
          </li>
        ))}
      </ul>
    </details>
  );
}

export function MissingPartsView() {
  const { missingParts } = use(InventoryStateContext);
  const { t, rich } = useI18n();
  const { totalParts, totalSets, relics, vaultedOnly } = missingParts;

  if (totalParts === 0) {
    return (
      <div className='py-16 text-center'>
        <PartyPopper className='mx-auto mb-4 size-10 text-oro-gold' aria-hidden='true' />
        <h2 className='mb-2 font-display text-lg font-bold uppercase tracking-[0.12em] text-oro-ink'>
          {t("nothingMissingTitle")}
        </h2>
        <p className='text-oro-ink-muted'>{t("nothingMissingHint")}</p>
      </div>
    );
  }

  const farmable = totalParts - vaultedOnly.reduce((sum, entry) => sum + entry.missing, 0);

  return (
    <div>
      <div className='mb-6 border-l-2 border-oro-gold bg-oro-surface px-4 py-3.5 text-sm text-oro-ink-muted sm:px-5'>
        <p>
          {rich(
            "missingSummary",
            {
              parts: t("partsCount", { count: totalParts }),
              sets: t("setsCount", { count: totalSets }),
              farmable,
              relics: t("relicsCount", { count: relics.length }),
            },
            {
              b: (text, key) => (
                <strong key={key} className='font-semibold text-oro-ink'>
                  {text}
                </strong>
              ),
              em: (text, key) => (
                <strong key={key} className='font-semibold text-oro-void'>
                  {text}
                </strong>
              ),
            }
          )}
        </p>
        <p className='mt-1 text-xs text-oro-ink-faint'>{t("missingSummaryHint")}</p>
      </div>

      {relics.length > 0 && (
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {relics.map((relic) => (
            <RelicCard key={relic.name} relic={relic} />
          ))}
        </div>
      )}

      <VaultedOnly entries={vaultedOnly} />
    </div>
  );
}
