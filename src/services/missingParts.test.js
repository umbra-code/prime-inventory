import { describe, expect, it } from "vitest";
import { getMissingParts, groupMissingPartsByRelic } from "./missingParts";

const part = (uniqueName, relics, required = 1) => ({ uniqueName, name: uniqueName, required, ducats: 15, relics });
const relic = (name, rarity, available = false) => (available ? { name, rarity, available } : { name, rarity });

// Cernos: Grip drops from available Axi S8 (common); String only from vaulted relics.
const cernos = {
  uniqueName: "/Sets/Cernos",
  name: "Cernos Prime",
  components: [
    part("Grip", [relic("Axi S8", "Common", true), relic("Lith V6", "Common")]),
    part("String", [relic("Neo V4", "Uncommon")]),
  ],
};
// Nyx: Chassis drops from Axi S8 (uncommon) and Neo C8; Neuroptics needs 2, from Neo C8.
const nyx = {
  uniqueName: "/Sets/Nyx",
  name: "Nyx Prime",
  components: [
    part("Chassis", [relic("Neo C8", "Rare", true), relic("Axi S8", "Uncommon", true)]),
    part("Neuroptics", [relic("Neo C8", "Common", true)], 2),
  ],
};
// Odonata: a part without any known relic.
const odonata = { uniqueName: "/Sets/Odonata", name: "Odonata Prime", components: [part("Blueprint", [])] };

const sets = [cernos, nyx, odonata];
const none = { counts: {}, mastered: {} };

describe("getMissingParts", () => {
  it("lists parts below their requirement with the amount missing", () => {
    const missing = getMissingParts([nyx], { counts: { Neuroptics: 1 }, mastered: {} });
    expect(missing.map((e) => [e.part.name, e.missing])).toEqual([
      ["Chassis", 1],
      ["Neuroptics", 1],
    ]);
  });

  it("skips mastered sets and parts already owned", () => {
    const missing = getMissingParts(sets, { counts: { Grip: 1 }, mastered: { "/Sets/Nyx": true } });
    expect(missing.map((e) => `${e.set.name} ${e.part.name}`)).toEqual([
      "Cernos Prime String",
      "Odonata Prime Blueprint",
    ]);
  });
});

describe("groupMissingPartsByRelic", () => {
  it("groups missing parts by available relic, most useful relic first", () => {
    const { relics } = groupMissingPartsByRelic(sets, none);
    expect(relics.map((group) => [group.name, group.entries.map((e) => `${e.set.name} ${e.part.name}`)])).toEqual([
      // Two parts each; Axi S8 has easier drops (common + uncommon vs common + rare).
      ["Axi S8", ["Cernos Prime Grip", "Nyx Prime Chassis"]],
      ["Neo C8", ["Nyx Prime Neuroptics", "Nyx Prime Chassis"]],
    ]);
  });

  it("keeps the rarity the part has in each relic", () => {
    const { relics } = groupMissingPartsByRelic([nyx], none);
    const chassisIn = (name) => relics.find((g) => g.name === name).entries.find((e) => e.part.name === "Chassis").rarity;
    expect(chassisIn("Neo C8")).toBe("Rare");
    expect(chassisIn("Axi S8")).toBe("Uncommon");
  });

  it("puts parts with no available relic in vaultedOnly", () => {
    const { vaultedOnly } = groupMissingPartsByRelic(sets, none);
    expect(vaultedOnly.map((e) => `${e.set.name} ${e.part.name}`)).toEqual([
      "Cernos Prime String",
      "Odonata Prime Blueprint",
    ]);
  });

  it("counts missing parts and the sets they belong to", () => {
    const summary = groupMissingPartsByRelic(sets, { counts: { Neuroptics: 1 }, mastered: {} });
    expect(summary.totalParts).toBe(5);
    expect(summary.totalSets).toBe(3);
  });

  it("is empty when nothing is missing", () => {
    const owned = { Grip: 1, String: 1, Chassis: 1, Neuroptics: 2, Blueprint: 1 };
    expect(groupMissingPartsByRelic(sets, { counts: owned, mastered: {} })).toEqual({
      totalParts: 0,
      totalSets: 0,
      relics: [],
      vaultedOnly: [],
    });
  });
});
