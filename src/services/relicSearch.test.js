import { describe, expect, it } from "vitest";
import { searchRelics } from "./relicSearch";

const garuda = { uniqueName: "/Garuda", name: "Garuda Prime" };
const braton = { uniqueName: "/Braton", name: "Braton Prime" };
const entry = (set, name) => ({ set, part: { uniqueName: `${set.uniqueName}/${name}`, name }, missing: 1, rarity: "Common" });
const relic = (name, available, ...entries) => ({ name, available, entries });

// In the order groupMissingPartsByRelic gives them.
const relics = [
  relic("Lith G1", false, entry(garuda, "Chassis"), entry(braton, "Barrel"), entry(braton, "Stock")),
  relic("Lith G12", true, entry(braton, "Receiver")),
  relic("Meso G3", false, entry(garuda, "Systems")),
  relic("Neo G2", true, entry(garuda, "Neuroptics")),
  relic("Axi G1", true, entry(garuda, "Blueprint"), entry(garuda, "Chassis")),
];
// Spanish set names, as the app shows them with translated item names.
const names = { setName: (set) => (set === garuda ? "Garuda Prime" : "Braton Prime"), partName: (part) => (part.name === "Chassis" ? "Chasis" : part.name) };
const search = (query) => searchRelics(relics, query, names).map(({ relic: r, entries, hidden }) => [r.name, entries.length, hidden]);

describe("searchRelics", () => {
  it("returns everything as it is without a query", () => {
    expect(search("  ")).toEqual(relics.map((r) => [r.name, r.entries.length, 0]));
  });

  it("finds relics by name, the exact one first", () => {
    expect(search("lith g1")).toEqual([
      ["Lith G1", 3, 0],
      ["Lith G12", 1, 0],
    ]);
    expect(search("LITHG12")).toEqual([["Lith G12", 1, 0]]);
    expect(search("g12")).toEqual([["Lith G12", 1, 0]]);
  });

  it("finds the relics that have the parts of a Prime, showing only those parts", () => {
    expect(search("garuda")).toEqual([
      // More Garuda parts first; with as many, one that drops now first.
      ["Axi G1", 2, 0],
      ["Neo G2", 1, 0],
      ["Lith G1", 1, 2],
      ["Meso G3", 1, 0],
    ]);
  });

  it("narrows to one part with more words, in English or as translated", () => {
    expect(search("garuda chassis")).toEqual([
      ["Axi G1", 1, 1],
      ["Lith G1", 1, 2],
    ]);
    expect(search("garuda chasis")).toEqual(search("garuda chassis"));
  });

  it("finds nothing when a word matches nowhere", () => {
    expect(search("garuda zzz")).toEqual([]);
  });
});
