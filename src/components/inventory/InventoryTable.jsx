import { Button } from "@/components/ui/button";
import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { imageUrl } from "@/lib/images";
import { accentStrength, progressLabel, STATUS } from "@/lib/setStatus";
import { summarizeSet } from "@/services/userInventory";
import Image from "next/image";
import { memo, use } from "react";
import { CountStepper, PartStatus } from "./CountStepper";
import { MarketPrice } from "./MarketPrice";
import { SetToggles } from "./SetToggles";

// Compact layout: one row per set, parts as small steppers, for quick updates
// across many sets.
const ROW_GRID = "lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_auto]";

const arePropsEqual = (prev, next) =>
  prev.set === next.set &&
  prev.isMastered === next.isMastered &&
  prev.inArsenal === next.inArsenal &&
  prev.counts.length === next.counts.length &&
  prev.counts.every((count, i) => count === next.counts[i]);

const SetRow = memo(function SetRow({ set, counts, isMastered, inArsenal }) {
  const { build, sell } = use(InventoryActionsContext);
  const { t, setName, partName, fullPartName } = useI18n();
  const summary = summarizeSet(set, counts, isMastered);
  const { status } = summary;
  const styles = STATUS[status];
  const strength = accentStrength(summary);
  const isComplete = status !== "incomplete";

  return (
    <li
      className={`relative grid gap-3 border-b border-oro-line py-3 pl-4 pr-3 last:border-b-0 hover:bg-oro-surface-2/50 lg:items-center lg:gap-5 ${ROW_GRID}`}
    >
      {/* Status bar: full color for complete sets, fading in for incomplete ones */}
      <span
        aria-hidden='true'
        className='absolute inset-y-0 left-0 w-[3px]'
        style={{ background: `color-mix(in oklab, ${styles.accent} ${Math.round(strength * 100)}%, transparent)` }}
      />

      <div className='flex min-w-0 items-center gap-3'>
        <span className='bevel grid size-10 shrink-0 place-items-center bg-oro-surface-2 [--cut:6px]'>
          {set.imageName && (
            <Image src={imageUrl(set.imageName)} alt='' width={36} height={36} className='size-9 object-contain' />
          )}
        </span>
        <div className='min-w-0'>
          <div className='truncate font-display text-[13px] font-bold uppercase tracking-[0.08em] text-oro-ink'>
            {setName(set)}
          </div>
          <div className='flex items-center gap-1.5 text-xs'>
            <span aria-hidden='true' className='oro-diamond !size-[7px]' style={{ background: styles.accent }} />
            <span className={status === "incomplete" ? "text-oro-ink-muted" : "font-medium"} style={isComplete ? { color: styles.accent } : undefined}>
              {progressLabel(t, summary)}
            </span>
            <MarketPrice set={set} className='ml-1 shrink-0 text-oro-ink-muted' />
          </div>
        </div>
      </div>

      <ul className='grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-x-3 gap-y-2'>
        {set.components.map((part, i) => (
          <li key={part.uniqueName} className='min-w-0'>
            <span className='flex items-center gap-1.5 text-[11px] text-oro-ink-muted'>
              <PartStatus part={part} count={counts[i]} />
              <span className='truncate'>{partName(part)}</span>
            </span>
            <CountStepper part={part} count={counts[i]} label={fullPartName(set, part)} />
          </li>
        ))}
      </ul>

      <div className='flex flex-wrap items-center justify-between gap-2 lg:justify-end'>
        <SetToggles set={set} isMastered={isMastered} inArsenal={inArsenal} />
        <span className='flex gap-1.5'>
          <Button onClick={() => build(set)} disabled={!isComplete} variant={status === "ready" ? "default" : "outline"} size='sm'>
            {t("build")}
          </Button>
          <Button onClick={() => sell(set)} disabled={!isComplete} variant={status === "extra" ? "extra" : "outline"} size='sm'>
            {t("sell")}
          </Button>
        </span>
      </div>
    </li>
  );
}, arePropsEqual);

export function InventoryTable() {
  const { filteredSets, summaries } = use(InventoryStateContext);
  const { t } = useI18n();

  return (
    <div className='border border-oro-line bg-oro-surface'>
      <div
        aria-hidden='true'
        className={`hidden border-b border-oro-line-strong py-2 pl-4 pr-3 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-oro-gold lg:grid lg:gap-5 ${ROW_GRID}`}
      >
        <span>{t("columnSet")}</span>
        <span>{t("columnParts")}</span>
        <span />
      </div>
      <ul>
        {filteredSets.map((set) => {
          const { owned, isMastered, inArsenal } = summaries.get(set.uniqueName);
          return <SetRow key={set.uniqueName} set={set} counts={owned} isMastered={isMastered} inArsenal={inArsenal} />;
        })}
      </ul>
    </div>
  );
}
