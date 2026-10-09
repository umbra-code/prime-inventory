import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { Minus, Plus } from "lucide-react";
import { use, useState } from "react";

/** − / editable count / required / + for one part. `label` names the part for screen readers. */
export function CountStepper({ part, count, label }) {
  const { updatePart, adjustPart } = use(InventoryActionsContext);
  const { t } = useI18n();
  // Raw text while the input is focused, so it can be emptied before typing a
  // new number; null when not editing (the stored count is shown).
  const [draft, setDraft] = useState(null);

  return (
    <span className='flex items-center gap-1'>
      <Button
        size='icon-sm'
        variant='outline'
        onClick={() => adjustPart(part.uniqueName, -1)}
        disabled={count === 0}
        aria-label={t("decreasePart", { name: label })}
      >
        <Minus className='size-3' />
      </Button>

      <span className='flex min-w-[46px] items-baseline justify-center font-mono text-[13px] tabular-nums'>
        <Input
          type='text'
          value={draft ?? count}
          onChange={(e) => {
            const value = e.target.value;
            if (!/^\d*$/.test(value)) return;
            setDraft(value);
            if (value !== "") updatePart(part.uniqueName, Number.parseInt(value, 10));
          }}
          onFocus={(e) => {
            setDraft(String(count));
            e.target.select();
          }}
          onBlur={() => {
            if (draft === "") updatePart(part.uniqueName, 0);
            setDraft(null);
          }}
          inputMode='numeric'
          pattern='[0-9]*'
          aria-label={t("ownedPart", { name: label })}
          className='h-7 w-7 rounded-none border-0 bg-transparent p-0 text-right font-mono text-[13px] text-oro-ink shadow-none focus-visible:ring-0 focus-visible:bg-oro-surface-2 dark:bg-transparent md:text-[13px]'
        />
        <span className='text-[11px] text-oro-ink-faint'>/{part.required}</span>
      </span>

      <Button
        size='icon-sm'
        variant='outline'
        onClick={() => adjustPart(part.uniqueName, 1)}
        aria-label={t("increasePart", { name: label })}
      >
        <Plus className='size-3' />
      </Button>
    </span>
  );
}

const STATUS_COLOR = { missing: "bg-oro-danger", partial: "bg-oro-gold", complete: "bg-oro-ready" };

/** Diamond marking whether a part is missing, partial or complete. */
export function PartStatus({ part, count }) {
  const status = count === 0 ? "missing" : count < part.required ? "partial" : "complete";
  return <span aria-hidden='true' className={`oro-diamond ${STATUS_COLOR[status]}`} />;
}
