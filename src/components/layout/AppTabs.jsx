"use client";

import { InventoryDashboard } from "@/components/layout/InventoryDashboard";
import { InventoryGrid } from "@/components/layout/InventoryGrid";
import { NowInGame } from "@/components/layout/NowInGame";
import { PrimeResurgence } from "@/components/layout/PrimeResurgence";
import { MissingPartsView } from "@/components/missing/MissingPartsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { use } from "react";

export function AppTabs() {
  const { view, setView, missingParts } = use(InventoryStateContext);
  const { t } = useI18n();

  return (
    <Tabs value={view} onValueChange={setView} className='gap-6'>
      <TabsList>
        <TabsTrigger value='inventory'>{t("tab.inventory")}</TabsTrigger>
        <TabsTrigger value='missing'>
          {t("tab.missing")}
          {missingParts.totalParts > 0 && (
            <span className='font-mono text-[11px] font-medium tracking-normal text-oro-void tabular-nums'>
              {missingParts.totalParts}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='inventory'>
        <div className='mb-8 flex flex-col gap-3 empty:hidden'>
          <NowInGame />
          <PrimeResurgence />
        </div>
        <InventoryDashboard />
        <InventoryGrid />
      </TabsContent>
      <TabsContent value='missing'>
        <MissingPartsView />
      </TabsContent>
    </Tabs>
  );
}
