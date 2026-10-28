import { describe, expect, it } from "vitest";
import { masteryReqState } from "./masteryRank";

describe("masteryReqState", () => {
  const rifle = { masteryReq: 14 };

  it("shows nothing for sets without a requirement", () => {
    expect(masteryReqState({}, null)).toBeNull();
    expect(masteryReqState({}, 3)).toBeNull();
  });

  it("shows every requirement when the player's rank is not set", () => {
    expect(masteryReqState(rifle, null)).toBe("show");
  });

  it("only flags requirements above the player's rank", () => {
    expect(masteryReqState(rifle, 13)).toBe("locked");
    expect(masteryReqState(rifle, 14)).toBeNull();
    expect(masteryReqState(rifle, 0)).toBe("locked");
  });
});
