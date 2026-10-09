import { describe, expect, it } from "vitest";
import { getHighlights } from "./highlights";

const set = (name, releaseDate, extra = {}) => ({ name, uniqueName: `/${name}`, releaseDate, ...extra });

describe("getHighlights", () => {
  const sets = [
    set("Braton Prime", "2013-07-13"),
    set("Citrine Prime", "2026-09-23"),
    set("Steflos Prime", "2026-09-23"),
    set("Afentis Prime", "2026-06-17"),
    set("Nyx Prime", "2016-03-01", { returned: true }),
    set("Cernos Prime", "2016-11-22", { returned: true }),
    set("Mystery Prime", undefined),
  ];

  it("lists the newest sets first, ties by name", () => {
    const { newest } = getHighlights(sets, { newestCount: 3 });
    expect(newest.map((s) => s.name)).toEqual(["Citrine Prime", "Steflos Prime", "Afentis Prime"]);
  });

  it("lists returned sets by name", () => {
    expect(getHighlights(sets).returned.map((s) => s.name)).toEqual(["Cernos Prime", "Nyx Prime"]);
  });

  it("does not reorder the catalog", () => {
    getHighlights(sets);
    expect(sets[0].name).toBe("Braton Prime");
  });
});
