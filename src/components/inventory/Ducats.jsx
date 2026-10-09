import { useI18n } from "@/i18n/I18nContext";
import { DUCAT_ICON } from "@/lib/images";
import Image from "next/image";

/** A ducat amount with the in-game ducat icon. `label` describes the amount for screen readers. */
export function Ducats({ value, label, prefix, className = "" }) {
  const { formatNumber } = useI18n();
  const amount = formatNumber(value);

  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${className}`} title={`${amount} ${label}`}>
      {prefix && (
        <span aria-hidden='true' className='opacity-70 mr-0.5'>
          {prefix}
        </span>
      )}
      <Image src={DUCAT_ICON} alt='' width={14} height={14} className='size-3.5' />
      <span className='sr-only'>{`${amount} ${label}`}</span>
      <span aria-hidden='true'>{amount}</span>
    </span>
  );
}
