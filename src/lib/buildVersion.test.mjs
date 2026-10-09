import { describe, expect, it } from "vitest";
import { getBuildVersion } from "./buildVersion.mjs";

const REPO = "https://github.com/umbra-code/prime-inventory";

describe("getBuildVersion", () => {
  it("links a build of an exact tag to its release page", () => {
    expect(getBuildVersion({ describe: "v2.3.0", packageVersion: "2.3.0" })).toEqual({
      label: "v2.3.0",
      url: `${REPO}/releases/tag/v2.3.0`,
    });
  });

  it("links a build after a tag to its commit", () => {
    expect(getBuildVersion({ describe: "v2.3.0-4-gabc1234", packageVersion: "2.3.0" })).toEqual({
      label: "v2.3.0-4-gabc1234",
      url: `${REPO}/commit/abc1234`,
    });
  });

  it("keeps the dirty marker", () => {
    expect(getBuildVersion({ describe: "v2.3.0-4-gabc1234-dirty", packageVersion: "2.3.0" }).label).toBe(
      "v2.3.0-4-gabc1234-dirty"
    );
    expect(getBuildVersion({ describe: "v2.3.0-dirty", packageVersion: "2.3.0", commit: "abc1234def" })).toEqual({
      label: "v2.3.0-dirty",
      url: `${REPO}/commit/abc1234def`,
    });
  });

  it("treats a release-branch build without tags as the release", () => {
    expect(getBuildVersion({ packageVersion: "2.3.0", commit: "abc1234def", branch: "master" })).toEqual({
      label: "v2.3.0",
      url: `${REPO}/releases/tag/v2.3.0`,
    });
  });

  it("falls back to the package version and commit without tags", () => {
    expect(getBuildVersion({ packageVersion: "2.3.0", commit: "abc1234def5678" })).toEqual({
      label: "v2.3.0+abc1234",
      url: `${REPO}/commit/abc1234def5678`,
    });
    expect(getBuildVersion({ packageVersion: "2.3.0" })).toEqual({ label: "v2.3.0", url: REPO });
  });
});
