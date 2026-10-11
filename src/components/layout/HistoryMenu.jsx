"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InventoryActionsContext, InventoryStateContext } from "@/context/InventoryContext";
import { useI18n } from "@/i18n/I18nContext";
import { describeEntry } from "@/lib/historyLabels";
import { MAX_ENTRIES } from "@/services/history";
import { History, Redo2, Trash2, Undo2 } from "lucide-react";
import { use, useEffect, useRef } from "react";
import { toast } from "sonner";

const isTyping = (target) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

/**
 * Header button listing the recent changes to the inventory, newest first,
 * with undo and redo: one step at a time (also Ctrl+Z / Ctrl+Y) or straight
 * to any entry. Undone entries stay in the list, dimmed, until a new change.
 */
export function HistoryMenu() {
  const { history, catalogIndex } = use(InventoryStateContext);
  const { undo, redo, goToHistory, clearHistory } = use(InventoryActionsContext);
  const i18n = useI18n();
  const { t, locale } = i18n;
  const { entries, position } = history;

  // Ctrl+Z / Ctrl+Y (Cmd on a Mac), except while typing, where the browser's own undo applies.
  const shortcut = useRef(null);
  useEffect(() => {
    shortcut.current = (direction) => {
      const entry = direction === "undo" ? entries[position - 1] : entries[position];
      if (!entry) {
        toast(t(direction === "undo" ? "history.nothingToUndo" : "history.nothingToRedo"));
        return;
      }
      (direction === "undo" ? undo : redo)();
      const { title } = describeEntry(entry, catalogIndex, i18n);
      toast.success(t(direction === "undo" ? "history.undone" : "history.redone", { what: title }));
    };
  });
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      const direction = key === "z" ? (event.shiftKey ? "redo" : "undo") : key === "y" ? "redo" : null;
      if (!direction) return;
      event.preventDefault();
      shortcut.current(direction);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const now = new Date();
  const timeFormat = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
  const formatTime = (at) => {
    const date = new Date(at);
    return (isSameDay(date, now) ? timeFormat : dateFormat).format(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='icon' className='size-8' aria-label={t("history.title")} title={t("history.title")}>
          <History />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[min(24rem,calc(100vw-2rem))] p-0'>
        <div className='flex items-center gap-1 border-b border-oro-line px-3 py-2'>
          <h2 className='mr-auto font-display text-sm font-bold uppercase tracking-[0.1em] text-oro-ink'>{t("history.title")}</h2>
          <Button variant='outline' size='icon-sm' onClick={undo} disabled={position === 0} aria-label={t("undo")} title={`${t("undo")} (Ctrl+Z)`}>
            <Undo2 />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={redo}
            disabled={position === entries.length}
            aria-label={t("history.redo")}
            title={`${t("history.redo")} (Ctrl+Y)`}
          >
            <Redo2 />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            onClick={clearHistory}
            disabled={entries.length === 0}
            aria-label={t("history.clear")}
            title={t("history.clear")}
            className='ml-2'
          >
            <Trash2 />
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className='px-3 py-6 text-center text-sm text-oro-ink-muted'>{t("history.empty")}</p>
        ) : (
          <ol className='max-h-[min(60vh,26rem)] overflow-y-auto py-1'>
            {entries
              .map((entry, index) => ({ entry, index }))
              .toReversed()
              .map(({ entry, index }) => {
                const applied = index < position;
                const { title, details, more } = describeEntry(entry, catalogIndex, i18n);
                const action = applied ? t("history.undoToHere") : t("history.redoToHere");
                return (
                  <li key={entry.id}>
                    {/* Marks where the inventory is now: everything above it is undone. */}
                    {index === position - 1 && position < entries.length && (
                      <div className='flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-oro-gold'>
                        <span className='h-px flex-1 bg-oro-gold/50' />
                        {t("history.current")}
                        <span className='h-px flex-1 bg-oro-gold/50' />
                      </div>
                    )}
                    <div className={`flex items-start gap-2 px-3 py-2 ${applied ? "" : "opacity-50"}`}>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-baseline gap-2'>
                          <span className='truncate text-sm font-medium text-oro-ink'>{title}</span>
                          <time dateTime={new Date(entry.at).toISOString()} className='ml-auto shrink-0 text-[11px] tabular-nums text-oro-ink-faint'>
                            {formatTime(entry.at)}
                          </time>
                        </div>
                        <p className='text-xs text-oro-ink-muted'>
                          {details.join(" · ")}
                          {more > 0 && ` · ${t("history.more", { count: more })}`}
                          {!applied && ` · ${t("history.undoneTag")}`}
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='icon-sm'
                        onClick={() => goToHistory(applied ? index : index + 1)}
                        aria-label={`${action}: ${title}`}
                        title={action}
                      >
                        {applied ? <Undo2 /> : <Redo2 />}
                      </Button>
                    </div>
                  </li>
                );
              })}
            {/* Everything undone: the inventory is back where the list starts. */}
            {position === 0 && (
              <li className='flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-oro-gold'>
                <span className='h-px flex-1 bg-oro-gold/50' />
                {t("history.current")}
                <span className='h-px flex-1 bg-oro-gold/50' />
              </li>
            )}
          </ol>
        )}

        <p className='border-t border-oro-line px-3 py-2 text-[11px] text-oro-ink-faint'>{t("history.hint", { count: MAX_ENTRIES })}</p>
      </PopoverContent>
    </Popover>
  );
}
