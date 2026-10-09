// How a set's status (from summarizeSet) is shown, shared by cards and table rows.

// Each status tints the frame, glow, progress line and badge.
export const STATUS = {
  incomplete: { accent: "var(--oro-gold)", badge: "badge.incomplete", badgeClass: "bg-oro-surface-2 text-oro-ink-muted" },
  ready: { accent: "var(--oro-ready)", badge: "badge.ready", badgeClass: "bg-oro-ready/15 text-oro-ready" },
  extra: { accent: "var(--oro-extra)", badge: "badge.extra", badgeClass: "bg-oro-extra/15 text-oro-extra" },
};

export const progressLabel = (t, { status, progress, missing }) => {
  if (status === "ready") return t("allPartsCollected");
  if (status === "extra") return t("readyToSell");
  return t("partsMissing", { percent: Math.floor(progress), count: missing });
};

// Weapon type shown next to the category for weapons ("Melee · Nikana").
const WEAPON_CATEGORIES = new Set(["Primary", "Secondary", "Melee"]);
export const weaponTypeLabel = (t, set) =>
  set.type && WEAPON_CATEGORIES.has(set.category) ? t(`type.${set.type}`, {}, set.type) : null;

// Complete sets get the full accent; incomplete ones fade in quadratically so
// only the sets close to completion stand out.
export const accentStrength = ({ status, progress }) =>
  status === "incomplete" ? (progress / 100) ** 2 * 0.7 : 1;
