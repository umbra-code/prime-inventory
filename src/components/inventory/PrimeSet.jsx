import { Button } from "@/components/ui/button";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { imageUrl } from "@/lib/images";
import { summarizeSet } from "@/services/userInventory";
import { Lock } from "lucide-react";
import Image from "next/image";
import { memo, use } from "react";
import { Ducats } from "./Ducats";
import { PrimePart } from "./PrimePart";

// Each status tints the card frame, glow, progress line and badge.
const STATUS = {
  incomplete: { accent: "var(--oro-gold)", badge: "badge.incomplete", badgeClass: "bg-oro-surface-2 text-oro-ink-muted" },
  ready: { accent: "var(--oro-ready)", badge: "badge.ready", badgeClass: "bg-oro-ready/15 text-oro-ready" },
  extra: { accent: "var(--oro-extra)", badge: "badge.extra", badgeClass: "bg-oro-extra/15 text-oro-extra" },
};

const progressLabel = (t, { status, progress, missing }) => {
  if (status === "ready") return t("allPartsCollected");
  if (status === "extra") return t("readyToSell");
  return t("partsMissing", { percent: Math.floor(progress), count: missing });
};

// Complete sets get the full accent; incomplete ones fade in quadratically so
// only the sets close to completion stand out.
const accentStrength = ({ status, progress }) =>
  status === "incomplete" ? (progress / 100) ** 2 * 0.7 : 1;

// `counts` holds the owned count of each component, in the same order as
// `primeSet.components`; comparing it element-wise lets unaffected cards skip renders.
const arePropsEqual = (prev, next) =>
  prev.primeSet === next.primeSet &&
  prev.isMastered === next.isMastered &&
  prev.counts.length === next.counts.length &&
  prev.counts.every((count, i) => count === next.counts[i]);

export const PrimeSet = memo(function PrimeSet({ primeSet, counts, isMastered }) {
  const { toggleMastery, build, sell } = use(InventoryActionsContext);
  const { t, setName } = useI18n();
  const name = setName(primeSet);

  const summary = summarizeSet(primeSet, counts, isMastered);
  const { status, progress } = summary;
  const styles = STATUS[status];
  const strength = accentStrength(summary);
  const isComplete = status !== "incomplete";

  return (
    <div
      className={`h-full ${strength > 0 ? "oro-glow" : ""}`}
      style={{ "--accent": styles.accent, "--strength": strength }}
    >
      <div className='oro-frame h-full'>
        <article className='oro-frame-inner flex flex-col'>
          <header className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 p-4 pb-3 sm:p-[18px] sm:pb-3.5'>
            <div className='bevel grid size-16 place-items-center bg-oro-surface-2 [--cut:9px] sm:size-[68px]'>
              {primeSet.imageName && (
                <Image
                  src={imageUrl(primeSet.imageName)}
                  alt={name}
                  width={80}
                  height={80}
                  className='size-14 object-contain sm:size-[60px]'
                />
              )}
            </div>

            <div className='min-w-0'>
              <span
                className={`chip inline-block px-2.5 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.14em] whitespace-nowrap ${styles.badgeClass}`}
              >
                {t(styles.badge)}
              </span>
              <h3 className='mt-1.5 font-display text-[15px] font-bold uppercase leading-tight tracking-[0.08em] text-balance text-oro-ink sm:text-base'>
                {name}
              </h3>
              <p className='mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-oro-ink-muted'>
                <span className='whitespace-nowrap'>{t(`category.${primeSet.category}`)}</span>
                {primeSet.vaulted && (
                  <span className='inline-flex items-center gap-1 whitespace-nowrap' title={t("vaultedHint")}>
                    <Lock className='size-3' aria-hidden='true' /> {t("vaulted")}
                  </span>
                )}
              </p>
              <p className='mt-1 text-xs font-medium text-oro-ink'>{progressLabel(t, summary)}</p>
            </div>

            <div className='grid justify-items-end gap-1.5 self-start'>
              <Ducats
                value={summary.ducats}
                prefix={t("setDucatsPrefix")}
                label={t("setDucatsLabel")}
                className='text-xs text-oro-ink-muted'
              />
              {summary.spareDucats > 0 && (
                <Ducats
                  value={summary.spareDucats}
                  prefix={t("spareDucatsPrefix")}
                  label={t("spareDucatsLabel")}
                  className='text-xs font-semibold text-oro-extra'
                />
              )}
            </div>
          </header>

          {/* Gilded line with a diamond marking the set's progress */}
          <div className='oro-divider mx-4 sm:mx-[18px]' style={{ "--progress": `${progress}%` }}>
            <span className='oro-divider-fill' />
            <span className='oro-divider-gem' />
          </div>

          <ul className='flex-1 space-y-0.5 px-2.5 pb-1 pt-2.5'>
            {primeSet.components.map((part, i) => (
              <PrimePart key={part.uniqueName} part={part} count={counts[i]} set={primeSet} />
            ))}
          </ul>

          {/* Set actions: the primary action follows the set status */}
          <footer className='mt-1.5 flex items-center justify-between gap-2 border-t border-oro-line px-4 pb-4 pt-3 sm:px-[18px]'>
            <Button
              onClick={() => toggleMastery(primeSet)}
              variant='ghost'
              size='sm'
              className={`px-2 ${isMastered ? "text-oro-gold" : ""}`}
            >
              {isMastered ? t("mastered") : t("markMastered")}
            </Button>

            <div className='flex gap-2'>
              <Button
                onClick={() => build(primeSet)}
                disabled={!isComplete}
                variant={status === "ready" ? "default" : "outline"}
                size='sm'
              >
                {t("build")}
              </Button>
              <Button
                onClick={() => sell(primeSet)}
                disabled={!isComplete}
                variant={status === "extra" ? "extra" : "outline"}
                size='sm'
              >
                {t("sell")}
              </Button>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}, arePropsEqual);
