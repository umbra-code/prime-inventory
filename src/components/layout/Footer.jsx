"use client";

import { useI18n } from "@/i18n/I18nContext";
import { AppVersion } from "./AppVersion";

function CreditLink({ href, children }) {
  return (
    <a href={href} target='_blank' rel='noopener noreferrer' className='underline underline-offset-2 hover:text-oro-gold'>
      {children}
    </a>
  );
}

export function Footer() {
  const { t, rich } = useI18n();

  return (
    <footer className='relative mt-16 border-t border-oro-line bg-oro-surface'>
      <span aria-hidden='true' className='oro-diamond absolute -top-[5px] left-1/2 -translate-x-1/2 bg-oro-gold' />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='text-center text-sm text-oro-ink-muted'>
          {t("footer", { year: String(new Date().getFullYear()) })}
          {/* Credit for the platinum prices. */}
          <p className='mt-2 text-xs'>
            {rich(
              "pricesCredit",
              {},
              {
                b: (text, key) => (
                  <CreditLink key={key} href='https://warframe.market'>
                    {text}
                  </CreditLink>
                ),
                em: (text, key) => (
                  <CreditLink key={key} href='https://wfinfo.warframestat.us'>
                    {text}
                  </CreditLink>
                ),
              }
            )}
          </p>
          <AppVersion className='mt-2 block text-xs text-oro-gold' />
        </div>
      </div>
    </footer>
  );
}
