"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { InventoryDashboard } from "@/components/layout/InventoryDashboard";
import { InventoryGrid } from "@/components/layout/InventoryGrid";
import { Toaster } from "@/components/ui/sonner";
import { InventoryProvider } from "@/context/InventoryContext";

export default function InventoryApp() {
  return (
    <InventoryProvider>
      <div className='flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950'>
        <Header />

        <div className='flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
          <InventoryDashboard />
          <InventoryGrid />
        </div>

        <Footer />
      </div>
      <Toaster position='bottom-right' richColors closeButton />
    </InventoryProvider>
  );
}
