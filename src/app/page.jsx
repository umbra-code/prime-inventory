"use client";

import dynamic from "next/dynamic";

// The inventory lives in localStorage, so it is rendered on the client only;
// this avoids hydration mismatches and lets state initialize synchronously.
const InventoryApp = dynamic(() => import("@/components/layout/InventoryApp"), {
  ssr: false,
  loading: () => (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300'>
      Loading inventory...
    </div>
  ),
});

export default function Page() {
  return <InventoryApp />;
}
