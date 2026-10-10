"use client";

import { AppTabs } from "@/components/layout/AppTabs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReceiveFromDevice } from "@/components/layout/ReceiveFromDevice";
import { Toaster } from "@/components/ui/sonner";
import { InventoryProvider } from "@/context/InventoryContext";
import { PricesProvider } from "@/context/PricesContext";
import { I18nProvider } from "@/i18n/I18nContext";

export default function InventoryApp() {
  return (
    <I18nProvider>
      <InventoryProvider>
        <PricesProvider>
          <div className='flex min-h-screen flex-col bg-oro-bg text-oro-ink'>
            <Header />

            <div className='flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
              <AppTabs />
            </div>

            <Footer />
          </div>
          <ReceiveFromDevice />
          <Toaster position='bottom-right' richColors closeButton />
        </PricesProvider>
      </InventoryProvider>
    </I18nProvider>
  );
}
