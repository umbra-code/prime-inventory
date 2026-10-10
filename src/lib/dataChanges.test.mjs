import { describe, expect, it } from "vitest";
import { describeChanges, diffCatalogs } from "./dataChanges.mjs";

const set = (name, extra = {}) => ({ uniqueName: `/${name}`, name, vaulted: false, components: [], ...extra });
const catalog = (...sets) => ({ format: 3, version: "1.0.0", generatedAt: "2026-10-01T00:00:00Z", sets });

describe("diffCatalogs", () => {
  it("ignores the version and generation date", () => {
    const before = catalog(set("Ash Prime"));
    const after = { ...catalog(set("Ash Prime")), version: "1.0.1", generatedAt: "2026-10-09T00:00:00Z" };
    expect(diffCatalogs(before, after)).toBeNull();
  });

  it("lists new, removed, vaulted, unvaulted and returned sets", () => {
    const before = catalog(set("Ash Prime"), set("Nyx Prime", { vaulted: true }), set("Old Prime"), set("Zephyr Prime"));
    const after = catalog(
      set("Ash Prime", { vaulted: true }),
      set("Nyx Prime", { vaulted: true, returned: true }),
      set("Zephyr Prime", { vaulted: false }),
      set("Citrine Prime")
    );
    expect(diffCatalogs(before, after)).toEqual({
      added: ["Citrine Prime"],
      removed: ["Old Prime"],
      vaulted: ["Ash Prime"],
      unvaulted: [],
      returned: ["Nyx Prime"],
      changed: ["Ash Prime", "Nyx Prime"],
      namesChanged: false,
    });
  });

  it("detects other changes and translated names", () => {
    const before = catalog(set("Ash Prime"));
    const after = catalog(set("Ash Prime", { type: "Warframe" }));
    expect(diffCatalogs(before, after).changed).toEqual(["Ash Prime"]);
    expect(diffCatalogs(before, before, { namesBefore: { sets: {} }, namesAfter: { sets: { "/A": "A" } } }).namesChanged).toBe(true);
  });
});

describe("describeChanges", () => {
  it("writes release notes", () => {
    const changes = {
      added: ["Citrine Prime"],
      removed: [],
      vaulted: ["Ash Prime"],
      unvaulted: [],
      returned: [],
      changed: ["Ash Prime", "Nyx Prime"],
      namesChanged: true,
    };
    expect(describeChanges(changes, { fromVersion: "1.0.0", toVersion: "1.1.0" })).toBe(
      [
        "Automatic Warframe data update.",
        "",
        "- **New Primes:** Citrine Prime",
        "- **Vaulted:** Ash Prime",
        "- **Updated details** (relics, parts or types) of 1 set",
        "- **Translated item names** updated",
        "",
        "Data: `@wfcd/items` 1.0.0 → 1.1.0",
        "",
      ].join("\n")
    );
  });
});
