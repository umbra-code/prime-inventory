// Compares two generated catalogs (and their item names) to decide whether a
// data update is worth a release, and describes it for the release notes.
// Used by scripts/data-changes.mjs in the scheduled data update workflow.

import { isDeepStrictEqual } from "node:util";

const byName = (a, b) => a.name.localeCompare(b.name, "en");
const names = (sets) => sets.toSorted(byName).map((set) => set.name);

/**
 * @returns null when nothing the app shows changed, or the lists of what did.
 */
export const diffCatalogs = (before, after, { namesBefore = {}, namesAfter = {} } = {}) => {
  const oldSets = new Map(before.sets.map((set) => [set.uniqueName, set]));
  const newSets = new Map(after.sets.map((set) => [set.uniqueName, set]));

  const added = after.sets.filter((set) => !oldSets.has(set.uniqueName));
  const removed = before.sets.filter((set) => !newSets.has(set.uniqueName));
  const kept = after.sets.filter((set) => oldSets.has(set.uniqueName));

  const vaulted = kept.filter((set) => set.vaulted && !oldSets.get(set.uniqueName).vaulted);
  const unvaulted = kept.filter((set) => !set.vaulted && oldSets.get(set.uniqueName).vaulted);
  const returned = kept.filter((set) => set.returned && !oldSets.get(set.uniqueName).returned);
  const changed = kept.filter((set) => !isDeepStrictEqual(set, oldSets.get(set.uniqueName)));
  const namesChanged = !isDeepStrictEqual(namesBefore, namesAfter);

  if (added.length === 0 && removed.length === 0 && changed.length === 0 && !namesChanged) return null;

  return {
    added: names(added),
    removed: names(removed),
    vaulted: names(vaulted),
    unvaulted: names(unvaulted),
    returned: names(returned),
    changed: names(changed),
    namesChanged,
  };
};

const list = (title, items) => (items.length > 0 ? [`- **${title}:** ${items.join(", ")}`] : []);

/** Release notes for a data update. */
export const describeChanges = (changes, { fromVersion, toVersion }) => {
  const lines = [
    "Automatic Warframe data update.",
    "",
    ...list("New Primes", changes.added),
    ...list("Removed", changes.removed),
    ...list("Vaulted", changes.vaulted),
    ...list("Unvaulted", changes.unvaulted),
    ...list("Back from the vault", changes.returned),
  ];
  const listed = new Set([...changes.vaulted, ...changes.unvaulted, ...changes.returned]);
  const otherChanges = changes.changed.filter((name) => !listed.has(name)).length;
  if (otherChanges > 0) {
    lines.push(`- **Updated details** (relics, parts or types) of ${otherChanges} ${otherChanges === 1 ? "set" : "sets"}`);
  }
  if (changes.namesChanged) lines.push("- **Translated item names** updated");
  lines.push("", `Data: \`@wfcd/items\` ${fromVersion === toVersion ? toVersion : `${fromVersion} → ${toVersion}`}`);
  return lines.join("\n") + "\n";
};
