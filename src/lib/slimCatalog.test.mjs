import { describe, expect, it } from "vitest";
import { OTHER_MELEE, slimCatalog } from "./slimCatalog.mjs";

const part = (uniqueName, overrides = {}) => ({
  uniqueName,
  name: uniqueName.split("/").pop(),
  imageName: `${uniqueName}.png`,
  tradable: true,
  ducats: 45,
  itemCount: 1,
  drops: [
    { location: "Lith A1 Relic", chance: 25.33, rarity: "Uncommon" },
    { location: "Lith A1 Relic (Radiant)", chance: 16.67, rarity: "Uncommon" },
  ],
  ...overrides,
});

const item = (name, components, overrides = {}) => ({
  uniqueName: `/Items/${name}`,
  name,
  category: "Primary",
  imageName: `${name}.png`,
  isPrime: true,
  vaulted: true,
  description: "Long text the app does not need",
  components,
  ...overrides,
});

describe("slimCatalog", () => {
  it("keeps only the fields the app uses", () => {
    const [set] = slimCatalog([item("Braton Prime", [part("/Parts/Barrel")])]);
    expect(set).toEqual({
      uniqueName: "/Items/Braton Prime",
      name: "Braton Prime",
      category: "Primary",
      imageName: "Braton Prime.png",
      vaulted: true,
      components: [
        {
          uniqueName: "/Parts/Barrel",
          name: "Barrel",
          imageName: "/Parts/Barrel.png",
          required: 1,
          ducats: 45,
          relics: [{ name: "Lith A1", rarity: "Common" }],
        },
      ],
    });
  });

  it("drops non-Prime items, Prime mods and items without components", () => {
    const sets = slimCatalog([
      item("Braton", [part("/Parts/A")], { isPrime: false }),
      item("Primed Flow", [part("/Parts/B")], { category: "Mods" }),
      item("Excalibur Prime", []),
      item("Lato Prime", undefined),
    ]);
    expect(sets).toEqual([]);
  });

  it("ignores non-tradable components and drops sets left without any", () => {
    const sets = slimCatalog([
      item("Akbronco Prime", [
        part("/Parts/Link"),
        part("/Weapons/BroncoPrime", { tradable: false }),
        part("/Resources/OrokinCell", { tradable: false }),
      ]),
      item("Only Resources Prime", [part("/Resources/Forma", { tradable: false })]),
    ]);
    expect(sets.map((set) => set.name)).toEqual(["Akbronco Prime"]);
    expect(sets[0].components.map((c) => c.uniqueName)).toEqual(["/Parts/Link"]);
  });

  it("merges duplicate components into one required count", () => {
    const [set] = slimCatalog([
      item("Akbolto Prime", [part("/Parts/Barrel", { itemCount: 1 }), part("/Parts/Barrel")]),
    ]);
    expect(set.components).toHaveLength(1);
    expect(set.components[0].required).toBe(2);
  });

  it("defaults missing itemCount to 1 and ducats to 0", () => {
    const [set] = slimCatalog([
      item("Braton Prime", [part("/Parts/Barrel", { itemCount: undefined, ducats: undefined })]),
    ]);
    expect(set.components[0]).toMatchObject({ required: 1, ducats: 0 });
  });

  describe("relics", () => {
    const relic = (name, vaulted) => ({ name: `${name} Intact`, category: "Relics", vaulted });
    const drops = (...entries) =>
      entries.flatMap(([relicName, chance]) => [
        { location: `${relicName} Relic`, chance, rarity: "Uncommon" },
        { location: `${relicName} Relic (Radiant)`, chance: 10, rarity: "Uncommon" },
      ]);

    it("derives rarity from the Intact chance and lists each relic once", () => {
      const [set] = slimCatalog([
        item("Braton Prime", [part("/Parts/Barrel", { drops: drops(["Lith A1", 25.33], ["Meso B2", 11], ["Neo C3", 2]) })]),
      ]);
      expect(set.components[0].relics).toEqual([
        { name: "Lith A1", rarity: "Common" },
        { name: "Meso B2", rarity: "Uncommon" },
        { name: "Neo C3", rarity: "Rare" },
      ]);
    });

    it("flags relics that currently drop and lists them first", () => {
      const [set] = slimCatalog([
        relic("Lith A1", true),
        relic("Axi Z9", false),
        item("Braton Prime", [part("/Parts/Barrel", { drops: drops(["Lith A1", 25.33], ["Axi Z9", 2]) })]),
      ]);
      expect(set.components[0].relics).toEqual([
        { name: "Axi Z9", rarity: "Rare", available: true },
        { name: "Lith A1", rarity: "Common" },
      ]);
    });

    it("sorts by rarity, then tier, then relic number", () => {
      const [set] = slimCatalog([
        item("Braton Prime", [
          part("/Parts/Barrel", {
            drops: drops(["Axi A1", 25.33], ["Lith A10", 25.33], ["Lith A2", 25.33], ["Meso A1", 2]),
          }),
        ]),
      ]);
      expect(set.components[0].relics.map((r) => r.name)).toEqual(["Lith A2", "Lith A10", "Axi A1", "Meso A1"]);
    });

    it("treats a vaulted set as available when one of its relics drops", () => {
      const sets = slimCatalog([
        relic("Axi Z9", false),
        item("Cernos Prime", [part("/Parts/Grip", { drops: drops(["Axi Z9", 25.33]) })], { vaulted: true }),
        item("Nyx Prime", [part("/Parts/Chassis", { drops: drops(["Lith A1", 25.33]) })], { vaulted: true }),
        item("Citrine Prime", [part("/Parts/Systems", { drops: drops(["Lith A1", 25.33]) })], { vaulted: false }),
      ]);
      expect(Object.fromEntries(sets.map((s) => [s.name, s.vaulted]))).toEqual({
        "Cernos Prime": false,
        "Citrine Prime": false,
        "Nyx Prime": true,
      });
    });

    it("handles parts without drops", () => {
      const [set] = slimCatalog([item("Odonata Prime", [part("/Parts/Blueprint", { drops: undefined })])]);
      expect(set.components[0].relics).toEqual([]);
    });
  });

  it("uses the item type, and the given class for melee weapons", () => {
    const sets = slimCatalog(
      [
        item("Braton Prime", [part("/A")], { type: "Rifle" }),
        item("Nikana Prime", [part("/B")], { category: "Melee", type: "Melee" }),
        item("Newblade Prime", [part("/C")], { category: "Melee", type: "Melee" }),
      ],
      { meleeClasses: { "Nikana Prime": "Nikana" } }
    );
    expect(Object.fromEntries(sets.map((s) => [s.name, s.type]))).toEqual({
      "Braton Prime": "Rifle",
      "Newblade Prime": OTHER_MELEE,
      "Nikana Prime": "Nikana",
    });
  });

  it("keeps the release date and the update that introduced the set", () => {
    const [set] = slimCatalog([
      item("Citrine Prime", [part("/A")], { releaseDate: "2026-09-23", introduced: { name: "Update 44.0", date: "2026-09-23" } }),
    ]);
    expect(set).toMatchObject({ releaseDate: "2026-09-23", update: "Update 44.0" });
  });

  it("flags vaulted sets whose relics drop again as returned", () => {
    const relic = { name: "Axi Z9 Intact", category: "Relics", vaulted: false };
    const drops = [{ location: "Axi Z9 Relic", chance: 25.33 }];
    const sets = slimCatalog([
      relic,
      item("Cernos Prime", [part("/A", { drops })], { vaulted: true }),
      item("Nyx Prime", [part("/B")], { vaulted: true }),
      item("Braton Prime", [part("/C", { drops })], { vaulted: false }),
    ]);
    expect(Object.fromEntries(sets.map((s) => [s.name, Boolean(s.returned)]))).toEqual({
      "Braton Prime": false,
      "Cernos Prime": true,
      "Nyx Prime": false,
    });
  });

  it("sorts sets by name", () => {
    const sets = slimCatalog([item("Zephyr Prime", [part("/A")]), item("Ash Prime", [part("/B")])]);
    expect(sets.map((set) => set.name)).toEqual(["Ash Prime", "Zephyr Prime"]);
  });
});
