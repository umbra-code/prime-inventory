"use client";

import { AppTabs } from "@/components/layout/AppTabs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReceiveFromDevice } from "@/components/layout/ReceiveFromDevice";
import { Toaster } from "@/components/ui/sonner";
import { InventoryProvider, InventoryStateContext } from "@/context/InventoryContext";
import { PricesProvider } from "@/context/PricesContext";
import { I18nProvider } from "@/i18n/I18nContext";
import { use } from "react";

/**
 * Page frame. The "Full width" preference is exposed as data-wide, which the
 * header, the footer and the grids pick up with group-data-[wide=true]/app.
 */
function AppShell() {
  const { wide } = use(InventoryStateContext);

  return (
    <div data-wide={wide} className='group/app flex min-h-screen flex-col bg-oro-bg text-oro-ink'>
      <Header />

      <div className='mx-auto w-full max-w-7xl flex-grow px-4 py-8 group-data-[wide=true]/app:max-w-none sm:px-6 lg:px-8'>
        <AppTabs />
      </div>

      <Footer />
    </div>
  );
}

export default function InventoryApp() {
  return (
    <I18nProvider>
      <InventoryProvider>
        <PricesProvider>
          <AppShell />
          <ReceiveFromDevice />
          <Toaster position='bottom-right' richColors closeButton />
        </PricesProvider>
      </InventoryProvider>
    </I18nProvider>
  );
}
