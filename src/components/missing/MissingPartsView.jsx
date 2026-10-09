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
      className='flex min-w-0 flex-1 items-center gap-3 rounded text-left hover:bg-gray-50 dark:hover:bg-gray-800'
    >
      {entry.part.imageName && (
        <Image
          src={imageUrl(entry.part.imageName)}
          alt=''
          width={32}
          height={32}
          className='size-8 shrink-0 rounded bg-gray-100 dark:bg-gray-800'
        />
      )}
      <span className='min-w-0'>
        <span className='block truncate text-sm font-medium text-gray-900 dark:text-gray-100'>
          {fullPartName(entry.set, entry.part)}
        </span>
        {children}
      </span>
    </button>
  );
}

function MissingCount({ missing }) {
  if (missing <= 1) return null;
  return <span className='shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400'>×{missing}</span>;
}

function RelicCard({ relic }) {
  const { t } = useI18n();
  return (
    <section className='rounded-lg border border-sky-200 bg-white dark:border-sky-900 dark:bg-gray-900'>
      <header className='flex items-baseline justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800'>
        <h3 className='font-semibold text-gray-900 dark:text-gray-100'>{t("relicTitle", { name: relic.name })}</h3>
        <span className='text-xs font-medium text-sky-700 dark:text-sky-300'>
          {t("partsYouNeed", { count: relic.entries.length })}
        </span>
      </header>
      <ul className='space-y-1 p-2'>
        {relic.entries.map((entry) => (
          <li key={entry.part.uniqueName} className='flex items-center gap-2 px-2 py-1'>
            <PartButton entry={entry}>
              <span className={`text-xs ${RARITY_CLASS[entry.rarity]}`}>{t(`rarity.${entry.rarity}`)}</span>
            </PartButton>
            <MissingCount missing={entry.missing} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function VaultedOnly({ entries }) {
  const { t, fullPartName } = useI18n();
  if (entries.length === 0) return null;
  const setCount = new Set(entries.map((entry) => entry.set.uniqueName)).size;

  return (
    <details className='group mt-8 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'>
      <summary className='flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-gray-900 dark:text-gray-100'>
        <ChevronRight className='size-4 transition-transform group-open:rotate-90' aria-hidden='true' />
        {t("vaultedOnlyTitle")}
        <span className='text-sm font-normal text-gray-500 dark:text-gray-400'>
          {t("vaultedOnlyCount", {
            parts: t("partsCount", { count: entries.length }),
            sets: t("setsCount", { count: setCount }),
          })}
        </span>
      </summary>
      <p className='px-4 pb-2 text-sm text-gray-500 dark:text-gray-400'>{t("vaultedOnlyHint")}</p>
      <ul className='grid gap-x-6 gap-y-1 px-2 pb-4 sm:grid-cols-2 lg:grid-cols-3'>
        {entries.map((entry) => (
          <li key={entry.part.uniqueName} className='flex items-center gap-2 px-2 py-1'>
            <PartButton entry={entry}>
              {!entry.part.relics?.length && (
                <span className='block text-xs text-gray-500 dark:text-gray-400'>{t("noKnownRelic")}</span>
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
        <PartyPopper className='mx-auto mb-4 size-10 text-amber-500' aria-hidden='true' />
        <h2 className='mb-2 text-lg font-medium text-gray-900 dark:text-gray-100'>{t("nothingMissingTitle")}</h2>
        <p className='text-gray-500 dark:text-gray-400'>{t("nothingMissingHint")}</p>
      </div>
    );
  }

  const farmable = totalParts - vaultedOnly.reduce((sum, entry) => sum + entry.missing, 0);

  return (
    <div>
      <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 sm:p-6 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'>
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
                <strong key={key} className='text-gray-900 dark:text-gray-100'>
                  {text}
                </strong>
              ),
              em: (text, key) => (
                <strong key={key} className='text-sky-700 dark:text-sky-300'>
                  {text}
                </strong>
              ),
            }
          )}
        </p>
        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>{t("missingSummaryHint")}</p>
      </div>

      {relics.length > 0 && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {relics.map((relic) => (
            <RelicCard key={relic.name} relic={relic} />
          ))}
        </div>
      )}

      <VaultedOnly entries={vaultedOnly} />
    </div>
  );
}
