"use client";

import { useI18n } from "@/i18n/I18nContext";

// Inlined at build time by next.config.mjs (see src/lib/buildVersion.mjs).
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const VERSION_URL = process.env.NEXT_PUBLIC_APP_VERSION_URL;

/** The build's version (e.g. "v2.3.0"), linking to its release or commit on GitHub. */
export function AppVersion({ className = "" }) {
  const { t } = useI18n();
  if (!VERSION) return null;

  return (
    <a
      href={VERSION_URL}
      target='_blank'
      rel='noopener noreferrer'
      title={t("versionLink", { version: VERSION })}
      className={`font-mono tabular-nums hover:underline ${className}`}
    >
      {VERSION}
    </a>
  );
}
