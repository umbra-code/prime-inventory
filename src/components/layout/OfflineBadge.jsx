"use client";

import { useI18n } from "@/i18n/I18nContext";
import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribe = (callback) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

/** Small notice shown while the browser is offline. */
export function OfflineBadge() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const { t } = useI18n();
  if (online) return null;

  return (
    <span
      role='status'
      title={t("offlineHint")}
      className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    >
      <WifiOff className='size-3' aria-hidden='true' />
      {t("offline")}
    </span>
  );
}
