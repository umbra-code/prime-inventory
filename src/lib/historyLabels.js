import { countChanges } from "@/services/history";

// How a history entry (see services/history.js) reads in the History menu.

const MAX_DETAILS = 4;

/**
 * `{ title, details, more }` for an entry: what happened, up to a few of the
 * values it changed, and how many more there were. `names` is
 * `{ t, setName, partName }` from the i18n context; `catalogIndex` maps
 * uniqueNames to sets and parts.
 */
export const describeEntry = (entry, catalogIndex, { t, setName, partName }) => {
  const set = catalogIndex.sets.get(entry.group);
  const name = set ? setName(set) : null;
  const total = countChanges(entry);

  // Whole-inventory changes are summed up, not listed.
  if (["import", "receive", "reset", "sync"].includes(entry.type)) {
    return { title: t(`history.${entry.type}`), details: [t("history.changes", { count: total })], more: 0 };
  }

  const title =
    entry.type === "build" || entry.type === "sell"
      ? t(entry.type === "build" ? "built" : "sold", { name: name ?? t("history.unknownSet") })
      : entry.type === "revert"
        ? t("history.revert")
        : (name ?? t("history.edit"));

  const details = [];
  for (const [uniqueName, [from, to]] of Object.entries(entry.changes.counts ?? {})) {
    const owner = catalogIndex.parts.get(uniqueName);
    // The set is in the title, unless the part belongs to another one.
    const label = !owner ? t("history.unknownPart") : owner.set === set ? partName(owner.part) : `${setName(owner.set)} ${partName(owner.part)}`;
    details.push(`${label} ${from} → ${to}`);
  }
  for (const [field, flag] of [
    ["mastered", "masteredToggle"],
    ["arsenal", "arsenalToggle"],
  ]) {
    for (const [uniqueName, [, to]] of Object.entries(entry.changes[field] ?? {})) {
      const flagged = catalogIndex.sets.get(uniqueName);
      const label = flagged && flagged !== set ? `${setName(flagged)}: ${t(flag)}` : t(flag);
      details.push(t(to ? "history.flagOn" : "history.flagOff", { flag: label }));
    }
  }

  return { title, details: details.slice(0, MAX_DETAILS), more: Math.max(0, details.length - MAX_DETAILS) };
};
