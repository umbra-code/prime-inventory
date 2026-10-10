import { describe, expect, it } from "vitest";
import { draftReleaseNotes, newReleaseUrl, versionMessage } from "./releaseNotes.mjs";

describe("versionMessage", () => {
  it("adds the title after the version", () => {
    expect(versionMessage("2.9.0", "Prime Resurgence")).toBe("2.9.0 · Prime Resurgence");
    expect(versionMessage("2.9.0", "")).toBe("2.9.0");
  });
});

describe("draftReleaseNotes", () => {
  it("groups features, fixes and performance work and skips the rest", () => {
    const notes = draftReleaseNotes([
      "feat: add a Prime Resurgence panel",
      "docs: document the panel",
      "fix(ui): keep the progress of mastered sets",
      "2.8.0 · Prime Resurgence",
      "feat!: fade mastered sets",
      "perf: memoize the summaries",
      "ci: update the data daily",
      "Merge branch 'development'",
    ]);
    expect(notes).toBe(
      [
        "## New",
        "- Add a Prime Resurgence panel",
        "- Fade mastered sets",
        "",
        "## Fixed",
        "- Keep the progress of mastered sets",
        "",
        "## Improved",
        "- Memoize the summaries",
      ].join("\n")
    );
  });

  it("is empty when there is nothing for users", () => {
    expect(draftReleaseNotes(["docs: readme", "chore: deps"])).toBe("");
  });
});

describe("newReleaseUrl", () => {
  it("prefills the tag, title and notes", () => {
    const url = new URL(newReleaseUrl("umbra/prime-inventory", { tag: "v2.9.0", title: "v2.9.0 · Prime Resurgence", body: "## New" }));
    expect(url.pathname).toBe("/umbra/prime-inventory/releases/new");
    expect(Object.fromEntries(url.searchParams)).toEqual({ tag: "v2.9.0", title: "v2.9.0 · Prime Resurgence", body: "## New" });
  });
});
