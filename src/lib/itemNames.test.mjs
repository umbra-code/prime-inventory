import { describe, expect, it } from "vitest";
import { buildItemNames } from "./itemNames.mjs";

const set = (uniqueName, name, parts) => ({
  uniqueName,
  name,
  components: parts.map(([partUniqueName, partName]) => ({ uniqueName: partUniqueName, name: partName })),
});

describe("buildItemNames", () => {
  it("shortens part names by removing the set name", () => {
    const sets = [set("/Ash", "Ash Prime", [["/AshChassis", "Chassis"]])];
    const translations = { "/Ash": { name: "Ash Prime" }, "/AshChassis": { name: "Chasis de Ash Prime" } };
    expect(buildItemNames(sets, translations, "es")).toEqual({ sets: {}, parts: { "/AshChassis": "Chasis" } });
  });

  it("matches the set name regardless of case and translates set names", () => {
    const sets = [set("/Keres", "Dual Keres Prime", [["/KeresBlade", "Blade"]])];
    const translations = {
      "/Keres": { name: "Keres dobles Prime" },
      "/KeresBlade": { name: "Hoja de Keres Dobles Prime" },
    };
    expect(buildItemNames(sets, translations, "es")).toEqual({
      sets: { "/Keres": "Keres dobles Prime" },
      parts: { "/KeresBlade": "Hoja" },
    });
  });

  it("handles names without 'de' and tagged set names", () => {
    const sets = [set("/Odonata", "Odonata Prime", [["/OdonataWings", "Wings"]])];
    const translations = {
      "/Odonata": { name: "<ARCHWING> Odonata Prime" },
      "/OdonataWings": { name: "Alas Odonata Prime" },
    };
    expect(buildItemNames(sets, translations, "es").parts).toEqual({ "/OdonataWings": "Alas" });
  });

  it("uses known names for untranslated parts and English otherwise", () => {
    const sets = [set("/Ash", "Ash Prime", [["/AshBlueprint", "Blueprint"], ["/AshOther", "Gizmo"]])];
    expect(buildItemNames(sets, {}, "es").parts).toEqual({ "/AshBlueprint": "Plano" });
    expect(buildItemNames(sets, {}, "fr").parts).toEqual({});
  });

  it("keeps the full name when the set name cannot be removed", () => {
    const sets = [set("/Ash", "Ash Prime", [["/AshThing", "Thing"]])];
    const translations = { "/AshThing": { name: "Cosa rara" } };
    expect(buildItemNames(sets, translations, "es").parts).toEqual({ "/AshThing": "Cosa rara" });
  });
});
