import { describe, expect, it } from "vitest";
import { slimCatalog } from "./slimCatalog.mjs";

const part = (uniqueName, overrides = {}) => ({
  uniqueName,
  name: uniqueName.split("/").pop(),
  imageName: `${uniqueName}.png`,
  tradable: true,
  ducats: 45,
  itemCount: 1,
  drops: [{ location: "Lith A1 Relic" }],
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
        { uniqueName: "/Parts/Barrel", name: "Barrel", imageName: "/Parts/Barrel.png", required: 1, ducats: 45 },
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

  it("sorts sets by name", () => {
    const sets = slimCatalog([item("Zephyr Prime", [part("/A")]), item("Ash Prime", [part("/B")])]);
    expect(sets.map((set) => set.name)).toEqual(["Ash Prime", "Zephyr Prime"]);
  });
});
