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
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SyncContext } from "@/context/SyncContext";
import { useI18n } from "@/i18n/I18nContext";
import { parseSyncHash } from "@/lib/syncCodec";
import { CloudAlert, CloudCheck, CloudOff, Copy, RefreshCw } from "lucide-react";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

// What the header's cloud looks like in each state.
const STATUS = {
  off: { icon: CloudOff, className: "text-oro-ink-faint" },
  syncing: { icon: RefreshCw, className: "text-oro-gold [&_svg]:animate-spin" },
  synced: { icon: CloudCheck, className: "text-oro-ready" },
  error: { icon: CloudAlert, className: "text-oro-danger" },
};

/** QR code and link that add another device to this one's group. */
function PairingCode({ link }) {
  const { t } = useI18n();
  const [qr, setQr] = useState(null);

  useEffect(() => {
    let active = true;
    // Loaded on demand: most visits never pair a device.
    import("qrcode")
      .then(({ toString }) => toString(link, { type: "svg", margin: 1, errorCorrectionLevel: "M" }))
      .then((svg) => active && setQr(svg))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [link]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(t("linkCopied"));
    } catch {
      // No clipboard access: the link stays selectable in the field.
    }
  };

  return (
    <div className='grid gap-3'>
      <p className='text-xs text-oro-ink-muted'>{t("sync.pairHint")}</p>
      {/* Always black on white, whatever the theme, so cameras read it. */}
      <div
        role='img'
        aria-label={t("sync.qr")}
        className='mx-auto size-44 bg-white p-2 [&>svg]:size-full'
        dangerouslySetInnerHTML={qr ? { __html: qr } : undefined}
      />
      <div className='flex gap-2'>
        <input
          readOnly
          value={link}
          aria-label={t("sync.link")}
          onFocus={(event) => event.currentTarget.select()}
          className='bevel h-8 min-w-0 flex-1 border border-oro-line bg-oro-surface-2 px-2 font-mono text-[11px] text-oro-ink outline-none [--cut:6px] focus-visible:border-oro-gold'
        />
        <Button size='sm' onClick={copy} className='h-8 shrink-0'>
          <Copy />
          {t("copyLink")}
        </Button>
      </div>
      <p className='text-[11px] text-oro-ink-faint'>{t("sync.pairWarning")}</p>
    </div>
  );
}

/**
 * Header cloud: shows whether this device is syncing with others and opens
 * the panel that turns sync on, pairs another device or turns it off. Also
 * handles pairing links (…/#s=<secret>) opened on this device.
 */
export function SyncMenu() {
  const { enabled, status, problem, syncedAt, secret, pairingLink, enable, join, disable, syncNow } = use(SyncContext);
  const { t, locale } = useI18n();
  const [pairing, setPairing] = useState(false);
  const [joining, setJoining] = useState(null);

  // A pairing link opened here: ask before replacing this device's inventory.
  useEffect(() => {
    const openLink = () => {
      const linked = parseSyncHash(window.location.hash);
      if (!linked) return;
      // Out of the address bar and the history entry right away, like transfer links.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setJoining(linked);
    };
    openLink();
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
  }, []);

  const { icon: Icon, className } = STATUS[status];
  const statusText =
    status === "error" ? t(`sync.problem.${problem ?? "unavailable"}`) : t(`sync.status.${status}`);
  const lastSynced = syncedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(syncedAt))
    : null;

  return (
    <>
      <Popover onOpenChange={(isOpen) => !isOpen && setPairing(false)}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className={`size-8 ${className}`}
            aria-label={`${t("sync.title")}: ${t(`sync.status.${status}`)}`}
            title={`${t("sync.title")}: ${t(`sync.status.${status}`)}`}
          >
            <Icon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align='end' className='w-[min(22rem,calc(100vw-2rem))] p-0'>
          <div className='border-b border-oro-line px-3 py-2'>
            <h2 className='font-display text-sm font-bold uppercase tracking-[0.1em] text-oro-ink'>{t("sync.title")}</h2>
          </div>

          <div className='grid gap-3 px-3 py-3'>
            {enabled ? (
              <>
                <div className='flex items-start gap-2'>
                  <Icon aria-hidden='true' className={`mt-0.5 size-4 shrink-0 ${className}`} />
                  <div className='min-w-0 text-sm'>
                    <p className='text-oro-ink'>{statusText}</p>
                    {status === "error" && <p className='text-xs text-oro-ink-muted'>{t("sync.problemHint")}</p>}
                    {lastSynced && <p className='text-xs text-oro-ink-faint'>{t("sync.lastSynced", { time: lastSynced })}</p>}
                  </div>
                </div>

                {pairing ? (
                  <PairingCode link={pairingLink} />
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' onClick={() => setPairing(true)}>
                      {t("sync.addDevice")}
                    </Button>
                    <Button size='sm' variant='outline' onClick={syncNow} disabled={status === "syncing"}>
                      {t("sync.now")}
                    </Button>
                    <Button size='sm' variant='outline' onClick={disable} className='ml-auto'>
                      {t("sync.turnOff")}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className='text-sm text-oro-ink-muted'>{t("sync.intro")}</p>
                <Button size='sm' onClick={enable} className='justify-self-start'>
                  {t("sync.turnOn")}
                </Button>
              </>
            )}
          </div>

          <p className='border-t border-oro-line px-3 py-2 text-[11px] text-oro-ink-faint'>{t("sync.privacy")}</p>
        </PopoverContent>
      </Popover>

      <AlertDialog open={joining !== null} onOpenChange={(isOpen) => !isOpen && setJoining(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sync.joinTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t(joining === secret ? "sync.joinAlready" : "sync.joinDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(joining === secret ? "close" : "cancel")}</AlertDialogCancel>
            {joining !== secret && <AlertDialogAction onClick={() => join(joining)}>{t("sync.joinConfirm")}</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
