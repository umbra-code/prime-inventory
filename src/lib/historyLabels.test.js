import { describe, expect, it } from "vitest";
import { createTranslator } from "@/i18n/translate";
import { describeEntry } from "./historyLabels";

const braton = {
  uniqueName: "/Braton",
  name: "Braton Prime",
  components: ["Barrel", "Blueprint", "Receiver", "Stock", "Link"].map((name) => ({ uniqueName: `/Braton/${name}`, name })),
};
const paris = { uniqueName: "/Paris", name: "Paris Prime", components: [{ uniqueName: "/Paris/String", name: "String" }] };

const catalogIndex = {
  sets: new Map([braton, paris].map((set) => [set.uniqueName, set])),
  parts: new Map([braton, paris].flatMap((set) => set.components.map((part) => [part.uniqueName, { part, set }]))),
};
const names = { t: createTranslator("en"), setName: (set) => set.name, partName: (part) => part.name };
const describe_ = (entry) => describeEntry({ id: "e", at: 0, group: null, ...entry }, catalogIndex, names);

describe("describeEntry", () => {
  it("names the set of an edit and lists what changed", () => {
    expect(
      describe_({
        type: "edit",
        group: "/Braton",
        changes: { counts: { "/Braton/Barrel": [0, 2], "/Braton/Stock": [3, 1] }, mastered: { "/Braton": [false, true] }, arsenal: { "/Braton": [true, false] } },
      })
    ).toEqual({ title: "Braton Prime", details: ["Barrel 0 → 2", "Stock 3 → 1", "Mastered: on", "In Arsenal: off"], more: 0 });
  });

  it("describes Build and Sell", () => {
    expect(describe_({ type: "sell", group: "/Braton", changes: { counts: { "/Braton/Barrel": [1, 0] } } }).title).toBe("Sold Braton Prime");
    expect(describe_({ type: "build", group: "/Paris", changes: { counts: { "/Paris/String": [1, 0] } } }).title).toBe("Built Paris Prime");
  });

  it("shows only the first details and counts the rest", () => {
    const counts = Object.fromEntries(braton.components.map((part) => [part.uniqueName, [0, 1]]));
    const { details, more } = describe_({ type: "edit", group: "/Braton", changes: { counts, mastered: { "/Braton": [false, true] } } });
    expect(details).toHaveLength(4);
    expect(more).toBe(2);
  });

  it("sums up whole-inventory changes", () => {
    const changes = { counts: { "/Braton/Barrel": [0, 2], "/Paris/String": [1, 0] }, mastered: { "/Paris": [false, true] } };
    expect(describe_({ type: "import", changes })).toEqual({ title: "Imported a backup", details: ["3 changes"], more: 0 });
    expect(describe_({ type: "reset", changes: { counts: { "/Paris/String": [1, 0] } } })).toEqual({
      title: "Reset the inventory",
      details: ["1 change"],
      more: 0,
    });
  });

  it("names the set of parts and flags outside the entry's own set", () => {
    const { title, details } = describe_({
      type: "revert",
      group: "/Braton",
      changes: { counts: { "/Paris/String": [0, 1], "/Braton/Barrel": [1, 0] }, mastered: { "/Paris": [true, false] } },
    });
    expect(title).toBe("Undid an earlier change");
    expect(details).toEqual(["Paris Prime String 0 → 1", "Barrel 1 → 0", "Paris Prime: Mastered: off"]);
  });

  it("copes with sets and parts that left the catalog", () => {
    expect(describe_({ type: "edit", group: "/Gone", changes: { counts: { "/Gone/Part": [0, 1] } } })).toEqual({
      title: "Edited parts",
      details: ["A part 0 → 1"],
      more: 0,
    });
    expect(describe_({ type: "sell", group: "/Gone", changes: { counts: { "/Gone/Part": [1, 0] } } }).title).toBe("Sold a set");
  });
});
