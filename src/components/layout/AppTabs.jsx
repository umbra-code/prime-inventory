"use client";

import { InventoryDashboard } from "@/components/layout/InventoryDashboard";
import { InventoryGrid } from "@/components/layout/InventoryGrid";
import { MissingPartsView } from "@/components/missing/MissingPartsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryStateContext } from "@/context/InventoryContext";
import { use } from "react";

export function AppTabs() {
  const { view, setView, missingParts } = use(InventoryStateContext);

  return (
    <Tabs value={view} onValueChange={setView} className='gap-6'>
      <TabsList className='w-full sm:w-fit'>
        <TabsTrigger value='inventory'>Inventory</TabsTrigger>
        <TabsTrigger value='missing'>
          Missing Parts
          {missingParts.totalParts > 0 && (
            <span className='rounded-full bg-sky-100 px-1.5 text-xs font-semibold text-sky-800 tabular-nums dark:bg-sky-900/60 dark:text-sky-200'>
              {missingParts.totalParts}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='inventory'>
        <InventoryDashboard />
        <InventoryGrid />
      </TabsContent>
      <TabsContent value='missing'>
        <MissingPartsView />
      </TabsContent>
    </Tabs>
  );
}
