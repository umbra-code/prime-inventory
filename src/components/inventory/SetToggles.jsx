import { InventoryActionsContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { use } from "react";

function DiamondToggle({ pressed, onClick, label, hint, onColor }) {
  return (
    <button
      type='button'
      aria-pressed={pressed}
      title={hint}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 px-1.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
        pressed ? "text-oro-ink" : "text-oro-ink-faint hover:text-oro-ink-muted"
      }`}
    >
      <span
        aria-hidden='true'
        className={`oro-diamond !size-[9px] ${pressed ? onColor : "shadow-[inset_0_0_0_1.5px_currentColor]"}`}
      />
      {label}
    </button>
  );
}

/** Mastered and In Arsenal switches for a set. */
export function SetToggles({ set, isMastered, inArsenal }) {
  const { toggleMastery, toggleArsenal } = use(InventoryActionsContext);
  const { t } = useI18n();

  return (
    <span className='flex flex-wrap items-center gap-x-1'>
      <DiamondToggle
        pressed={isMastered}
        onClick={() => toggleMastery(set)}
        label={t("masteredToggle")}
        hint={t("masteredHint")}
        onColor='bg-oro-gold'
      />
      <DiamondToggle
        pressed={inArsenal}
        onClick={() => toggleArsenal(set)}
        label={t("arsenalToggle")}
        hint={t("arsenalHint")}
        onColor='bg-oro-ink'
      />
    </span>
  );
}
