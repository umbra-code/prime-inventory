// Search on the Missing Parts tab: by relic ("lith g1") or by what you need
// from it ("garuda", "garuda chassis"). Every word typed has to appear.
//
// A relic found by its name shows all the parts it has for you. A relic found
// through a part shows only the matching parts, plus how many others it has,
// so searching a Prime lists exactly the relics to farm for it.

const words = (query) => query.toLowerCase().trim().split(/\s+/).filter(Boolean);
const compact = (text) => text.toLowerCase().replace(/\s+/g, "");

/**
 * `[{ relic, entries, hidden }]` for the relics matching `query`, in the
 * order they should show. `names` gives the displayed set and part names;
 * the English ones match too, so a search works in either language.
 */
export const searchRelics = (relics, query, { setName, partName }) => {
  const terms = words(query);
  if (terms.length === 0) return relics.map((relic) => ({ relic, entries: relic.entries, hidden: 0 }));
  const matches = (text) => terms.every((term) => text.includes(term));
  const exactName = terms.join("");

  const results = [];
  relics.forEach((relic, order) => {
    // "lithg1" written together finds Lith G1 too.
    if (matches(relic.name.toLowerCase()) || compact(relic.name).includes(exactName)) {
      results.push({ relic, entries: relic.entries, hidden: 0, order, rank: compact(relic.name) === exactName ? 0 : 1 });
      return;
    }
    const entries = relic.entries.filter((entry) =>
      matches(`${setName(entry.set)} ${partName(entry.part)} ${entry.set.name} ${entry.part.name}`.toLowerCase())
    );
    if (entries.length > 0) results.push({ relic, entries, hidden: relic.entries.length - entries.length, order, rank: 2 });
  });

  // The relic named exactly as typed, then other relics by name, then the
  // relics with more of the searched parts (one that drops now first on a tie).
  return results
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        (a.rank === 2 && (b.entries.length - a.entries.length || Number(b.relic.available) - Number(a.relic.available))) ||
        a.order - b.order
    )
    .map(({ relic, entries, hidden }) => ({ relic, entries, hidden }));
};
