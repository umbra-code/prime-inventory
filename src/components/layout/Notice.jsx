"use client";

import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { X } from "lucide-react";
import { use, useEffect } from "react";

const NOTICE_DURATION_MS = 6000;

export function Notice() {
  const { notice } = use(InventoryStateContext);
  const { dismissNotice } = use(InventoryActionsContext);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(dismissNotice, NOTICE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [notice, dismissNotice]);

  if (!notice) return null;

  return (
    <div
      role={notice.type === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 mb-6 text-sm ${
        notice.type === "error"
          ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-200"
          : "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800 dark:text-green-200"
      }`}
    >
      <span>{notice.message}</span>
      <button onClick={dismissNotice} aria-label='Dismiss' className='opacity-70 hover:opacity-100'>
        <X size={16} />
      </button>
    </div>
  );
}
