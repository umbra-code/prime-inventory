import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { memo, use, useState } from "react";

const IMAGE_BASE_URL = "https://cdn.warframestat.us/img/";

export const PrimePart = memo(function PrimePart({ part, count, setName }) {
  const { updatePart, adjustPart } = use(InventoryActionsContext);
  const label = `${setName} ${part.name}`;
  // Raw text while the input is focused, so it can be emptied before typing a
  // new number; null when not editing (the stored count is shown).
  const [draft, setDraft] = useState(null);

  const getPartStatus = () => {
    if (count === 0) return "missing";
    if (count < part.required) return "partial";
    return "complete";
  };

  return (
    <div className='flex items-center justify-between py-2 px-3 border-l-4 border-l-gray-200 hover:border-l-amber-500 hover:bg-gray-50 transition-colors dark:border-l-gray-700 dark:hover:bg-gray-800'>
      <div className='flex items-center space-x-3'>
        <div className='p-px bg-gray-100/50 rounded dark:bg-gray-800/50'>
          {part.imageName && (
            <Image
              src={`${IMAGE_BASE_URL}${part.imageName}`}
              alt={part.name}
              width={32}
              height={32}
            />
          )}
        </div>
        <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>{part.name}</span>
      </div>

      <div className='flex items-center space-x-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() => adjustPart(part.uniqueName, -1)}
          disabled={count === 0}
          aria-label={`Decrease ${label}`}
          className='h-7 w-7 p-0 border-gray-300 dark:border-gray-600'
        >
          <Minus className='h-3 w-3' />
        </Button>

        <div className='flex items-center space-x-1 min-w-[60px] justify-center'>
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
            aria-label={`${label} owned`}
            className='w-10 h-7 text-center text-xs border-gray-300 dark:bg-gray-900 dark:border-gray-600'
          />
          <span className='text-xs text-gray-500 dark:text-gray-400'>/{part.required}</span>
        </div>

        <Button
          size='sm'
          variant='outline'
          onClick={() => adjustPart(part.uniqueName, 1)}
          aria-label={`Increase ${label}`}
          className='h-7 w-7 p-0 border-gray-300 dark:border-gray-600'
        >
          <Plus className='h-3 w-3' />
        </Button>

        <div
          className={`w-2 h-2 rounded-full ml-2 ${
            getPartStatus() === "missing"
              ? "bg-red-500"
              : getPartStatus() === "partial"
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
        />
      </div>
    </div>
  );
});