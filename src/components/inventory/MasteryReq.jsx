import { useI18n } from "@/i18n/I18nContext";
import { masteryReqState } from "@/lib/masteryRank";

/** The set's Mastery Rank requirement, in red when the player has not reached it. */
export function MasteryReq({ set, masteryRank, className = "" }) {
  const { t } = useI18n();
  const state = masteryReqState(set, masteryRank);
  if (!state) return null;

  const title =
    state === "locked"
      ? t("masteryReqLocked", { rank: set.masteryReq, yours: masteryRank })
      : t("masteryReqTitle", { rank: set.masteryReq });

  return (
    <span title={title} className={`whitespace-nowrap ${state === "locked" ? "font-medium text-oro-danger" : "text-oro-ink-muted"} ${className}`}>
      <span className='sr-only'>{title}</span>
      <span aria-hidden='true'>{t("masteryReqShort", { rank: set.masteryReq })}</span>
    </span>
  );
}
