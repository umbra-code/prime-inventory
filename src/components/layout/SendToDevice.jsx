"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InventoryActionsContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { TRANSFER_TTL_MS } from "@/lib/transferCodec";
import { Copy, LoaderCircle, MonitorSmartphone } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";

const IDLE = { status: "idle" };

/**
 * Header button and dialog that copy the inventory to another device through
 * a short-lived link (see src/lib/transferCodec.js). Nothing is uploaded
 * until "Create link" is pressed.
 */
export function SendToDevice() {
  const { sendInventory } = use(InventoryActionsContext);
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [transfer, setTransfer] = useState(IDLE);

  const createLink = async () => {
    setTransfer({ status: "creating" });
    try {
      const { url, expiresAt } = await sendInventory();
      // Loaded on demand: most visits never open this dialog.
      const { toString: toQrSvg } = await import("qrcode");
      const qr = await toQrSvg(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      setTransfer({ status: "ready", url, expiresAt, qr });
    } catch (error) {
      console.error("Failed to create a transfer link:", error);
      setTransfer({ status: "error", reason: error.reason ?? "unavailable" });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(transfer.url);
      toast.success(t("linkCopied"));
    } catch {
      // No clipboard access: the link stays selectable in the field.
    }
  };

  const expiryTime = (expiresAt) => new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(expiresAt));

  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)} aria-label={t("sendToDevice")} title={t("sendToDevice")}>
        <MonitorSmartphone />
        <span className='hidden lg:inline'>{t("sendToDeviceShort")}</span>
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          // Each link works once, so a reopened dialog starts over.
          if (!isOpen) setTransfer(IDLE);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sendToDevice")}</AlertDialogTitle>
            <AlertDialogDescription>
              {transfer.status === "ready"
                ? t("sendReady", { time: expiryTime(transfer.expiresAt) })
                : transfer.status === "error"
                  ? t(`transferError.${transfer.reason}`)
                  : t("sendIntro")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {transfer.status === "ready" ? (
            <div className='grid gap-4'>
              {/* Always black on white, whatever the theme, so cameras read it. */}
              <div
                role='img'
                aria-label={t("transferQr")}
                className='mx-auto size-52 bg-white p-2 [&>svg]:size-full'
                dangerouslySetInnerHTML={{ __html: transfer.qr }}
              />
              <div className='flex gap-2'>
                <input
                  readOnly
                  value={transfer.url}
                  aria-label={t("transferLink")}
                  onFocus={(event) => event.currentTarget.select()}
                  className='bevel h-9 min-w-0 flex-1 border border-oro-line bg-oro-surface-2 px-3 font-mono text-xs text-oro-ink outline-none [--cut:6px] focus-visible:border-oro-gold'
                />
                <Button size='sm' onClick={copyLink} className='h-9 shrink-0'>
                  <Copy />
                  {t("copyLink")}
                </Button>
              </div>
              <p className='text-xs text-oro-ink-muted'>{t("sendReplaces")}</p>
            </div>
          ) : (
            <p className='text-xs text-oro-ink-muted'>
              {transfer.status === "error"
                ? t(`transferError.${transfer.reason}Hint`)
                : t("sendPrivacy", { minutes: TRANSFER_TTL_MS / 60000 })}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>{t("close")}</AlertDialogCancel>
            {transfer.status !== "ready" && (
              <Button onClick={createLink} disabled={transfer.status === "creating"}>
                {transfer.status === "creating" && <LoaderCircle className='animate-spin' />}
                {t(transfer.status === "creating" ? "creatingLink" : transfer.status === "error" ? "retry" : "createLink")}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
