import { DUCAT_ICON } from "@/lib/images";
import Image from "next/image";

/** A ducat amount with the in-game ducat icon. */
export function Ducats({ value, label = "ducats", prefix, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${className}`}
      title={`${value} ${label}`}
    >
      {prefix && (
        <span aria-hidden='true' className='opacity-70 mr-0.5'>
          {prefix}
        </span>
      )}
      <Image src={DUCAT_ICON} alt='' width={14} height={14} className='size-3.5' />
      <span className='sr-only'>{`${value} ${label}`}</span>
      <span aria-hidden='true'>{value}</span>
    </span>
  );
}
