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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { AppVersion } from "./AppVersion";
import { Monitor, Moon, RotateCcw, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { use, useState } from "react";

const THEMES = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

/**
 * Theme, page width, Mastery Rank, interface language and item name language in one menu, plus the
 * inventory reset, kept here rather than in the header because it wipes
 * everything.
 */
export function PreferencesMenu() {
  const { theme = "system", setTheme } = useTheme();
  const { t, locale, setLocale, itemNames, setItemNames, languages } = useI18n();
  const { resetInventory } = use(InventoryActionsContext);
  const { wide, setWide, masteryRank, setMasteryRank, highestMasteryReq } = use(InventoryStateContext);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // The top option covers every rank from there up: it already unlocks every Prime.
  const rankLabel = (rank) =>
    rank === null
      ? t("masteryRank.notSet")
      : t(rank >= highestMasteryReq ? "masteryRank.orHigher" : "masteryRank.value", {
          rank: Math.min(rank, highestMasteryReq),
        });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='icon' className='size-8' aria-label={t("preferences")}>
            <Settings2 />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-52'>
          <DropdownMenuLabel>{t("themeLabel")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {THEMES.map(({ value, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon />
                {t(`theme.${value}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t("widthLabel")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={wide ? "full" : "centered"} onValueChange={(value) => setWide(value === "full")}>
            <DropdownMenuRadioItem value='centered'>{t("width.centered")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='full'>{t("width.full")}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t("masteryRankLabel")}</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className='text-oro-ink-muted'>{rankLabel(masteryRank)}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className='w-56'>
              <p className='px-2 py-1.5 text-xs text-oro-ink-muted'>{t("masteryRankHint")}</p>
              <DropdownMenuRadioGroup
                value={masteryRank === null ? "none" : String(Math.min(masteryRank, highestMasteryReq))}
                onValueChange={(value) => setMasteryRank(value === "none" ? null : Number(value))}
              >
                <DropdownMenuRadioItem value='none'>{rankLabel(null)}</DropdownMenuRadioItem>
                {Array.from({ length: highestMasteryReq + 1 }, (_, rank) => (
                  <DropdownMenuRadioItem key={rank} value={String(rank)}>
                    {rankLabel(rank)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t("interfaceLanguage")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={locale} onValueChange={setLocale}>
            {Object.entries(languages).map(([code, name]) => (
              <DropdownMenuRadioItem key={code} value={code} lang={code}>
                {name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t("itemNamesLabel")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={itemNames} onValueChange={setItemNames}>
            <DropdownMenuRadioItem value='en'>{t("itemNames.en")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='localized'>{t("itemNames.localized")}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className='text-oro-danger'>{t("dangerZone")}</DropdownMenuLabel>
          <DropdownMenuItem variant='destructive' onSelect={() => setConfirmingReset(true)}>
            <RotateCcw />
            {t("resetInventoryMenu")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <div className='px-2 py-1 text-right text-xs text-muted-foreground'>
            <AppVersion />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmingReset} onOpenChange={setConfirmingReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={resetInventory} variant='destructive'>
              {t("reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
