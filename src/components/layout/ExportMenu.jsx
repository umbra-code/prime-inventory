"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { ChevronDown, Download, FileJson, MonitorSmartphone, Upload } from "lucide-react";
import { use, useState } from "react";
import { SendToDeviceDialog } from "./SendToDevice";

/**
 * The two ways of taking the inventory out of this browser: a backup file or
 * another device. On phones, where the header has no room for one more
 * button, it also holds Import.
 */
export function ExportMenu() {
  const { exportInventory, importInventory } = use(InventoryActionsContext);
  const { t } = useI18n();
  const [sending, setSending] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm' aria-label={t("backupMenu")}>
            <Download />
            <span className='hidden md:inline'>{t("export")}</span>
            <ChevronDown className='hidden opacity-70 md:block' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-56'>
          <DropdownMenuItem onSelect={exportInventory}>
            <FileJson />
            {t("exportFile")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSending(true)}>
            <MonitorSmartphone />
            {t("sendToDevice")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={importInventory} className='sm:hidden'>
            <Upload />
            {t("importFile")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SendToDeviceDialog open={sending} onOpenChange={setSending} />
    </>
  );
}
