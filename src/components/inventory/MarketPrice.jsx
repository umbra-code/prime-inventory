"use client";

import { PricesContext } from "@/context/PricesContext";
import { useI18n } from "@/i18n/I18nContext";
import { findPrice, marketUrl } from "@/services/prices";
import { ExternalLink } from "lucide-react";
import { use } from "react";

/**
 * The average platinum price of a set (or of one of its parts), linking to the
 * item on warframe.market. Renders nothing while prices are not available.
 */
export function MarketPrice({ set, part, prefix, className = "" }) {
  const prices = use(PricesContext);
  const { t, formatNumber } = useI18n();
  const price = findPrice(prices, set, part);
  if (!price) return null;

  // Cheap parts differ by decimals; above that, whole platinum reads better.
  const amount = formatNumber(price.average < 10 ? Math.round(price.average * 10) / 10 : Math.round(price.average));
  const label = t("marketPriceLabel", { amount, sold: formatNumber(price.sold) });

  return (
    <a
      href={marketUrl(price.name)}
      target='_blank'
      rel='noopener noreferrer'
      title={label}
      aria-label={label}
      className={`group/price inline-flex items-center gap-1 tabular-nums underline-offset-2 hover:text-oro-gold hover:underline ${className}`}
    >
      {prefix && <span className='mr-0.5 opacity-70'>{prefix}</span>}
      <span>
        {amount}
        <span className='ml-px text-[0.85em] opacity-70'>{t("platinumUnit")}</span>
      </span>
      <ExternalLink aria-hidden='true' className='size-3 opacity-50 group-hover/price:opacity-100' />
    </a>
  );
}
