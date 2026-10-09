"use client";

import { LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";

// The inventory lives in localStorage, so it is rendered on the client only;
// this avoids hydration mismatches and lets state initialize synchronously.
// The loading state is prerendered before the language is known, so it has no text.
const InventoryApp = dynamic(() => import("@/components/layout/InventoryApp"), {
  ssr: false,
  loading: () => (
    <div
      role='status'
      aria-label='Loading'
      className='flex min-h-screen items-center justify-center bg-oro-bg text-oro-gold'
    >
      <LoaderCircle className='size-8 animate-spin' aria-hidden='true' />
    </div>
  ),
});

export default function Page() {
  return <InventoryApp />;
}
