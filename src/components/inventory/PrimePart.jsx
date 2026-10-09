import { useI18n } from "@/i18n/I18nContext";
import { imageUrl } from "@/lib/images";
import Image from "next/image";
import { memo } from "react";
import { CountStepper, PartStatus } from "./CountStepper";
import { Ducats } from "./Ducats";
import { RelicsPopover } from "./RelicsPopover";

export const PrimePart = memo(function PrimePart({ part, count, set }) {
  const { t, partName, fullPartName } = useI18n();
  const name = partName(part);
  const label = fullPartName(set, part);

  return (
    <li className='grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-2 py-1.5 transition-colors hover:bg-oro-surface-2'>
      <span className='bevel grid size-[34px] place-items-center bg-oro-surface-2 [--cut:6px]'>
        {part.imageName && (
          <Image src={imageUrl(part.imageName)} alt={name} width={30} height={30} className='size-[30px] object-contain' />
        )}
      </span>

      <span className='min-w-0'>
        <span className='block truncate text-sm font-medium text-oro-ink'>{name}</span>
        <span className='flex items-center gap-2.5'>
          <Ducats value={part.ducats} label={t("partDucatsLabel")} className='text-[11px] text-oro-ink-muted' />
          <RelicsPopover relics={part.relics} label={label} />
        </span>
      </span>

      <CountStepper part={part} count={count} label={label} />
      <PartStatus part={part} count={count} />
    </li>
  );
});
