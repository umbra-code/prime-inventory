"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { parseTransferHash } from "@/lib/transferCodec";
import { TransferError, discardTransfer, receiveTransfer } from "@/services/transfer";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

const sum = (values) => values.reduce((total, value) => total + value, 0);

/**
 * Opens "Send to another device" links (…/#t=<id>.<key>): downloads the
 * inventory and asks before replacing the one in this browser.
 */
export function ReceiveFromDevice() {
  const { readReceivedInventory, applyReceivedInventory } = use(InventoryActionsContext);
  const { t, rich } = useI18n();
  const [received, setReceived] = useState(null);

  useEffect(() => {
    const openLink = async () => {
      const link = parseTransferHash(window.location.hash);
      if (!link) return;
      // The key is in the hash: take it out of the address bar and the history
      // entry, so a reload or a shared screenshot does not carry it.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);

      try {
        const userData = readReceivedInventory(await receiveTransfer(link));
        if (!userData) throw new TransferError("invalid");
        setReceived({ link, userData });
      } catch (error) {
        const reason = error.reason ?? "unavailable";
        toast.error(t(`transferError.${reason}`), { description: t(`transferError.${reason}Hint`) });
      }
    };

    openLink();
    // A link pasted while the app is open only changes the hash.
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
    // Re-running (e.g. after a language change) is harmless: the hash is gone by then.
  }, [t, readReceivedInventory]);

  if (!received) return null;
  const { link, userData } = received;

  return (
    <AlertDialog open onOpenChange={(isOpen) => !isOpen && setReceived(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("receiveTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {rich(
              "receiveDescription",
              {
                parts: t("receiveParts", { count: sum(Object.values(userData.counts)) }),
                mastered: t("receiveMastered", { count: Object.keys(userData.mastered).length }),
              },
              { b: (text, key) => <b key={key} className='font-semibold text-oro-ink'>{text}</b> }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              applyReceivedInventory(userData);
              discardTransfer(link);
            }}
          >
            {t("receiveImport")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
