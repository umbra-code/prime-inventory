// When a set's Mastery Rank requirement is shown. Without the player's rank,
// every requirement is shown; with it, only the ones the player has not reached.

/** "show", "locked" (above the player's rank) or null (nothing to show). */
export const masteryReqState = (set, masteryRank) => {
  if (!set.masteryReq) return null;
  if (masteryRank === null) return "show";
  return set.masteryReq > masteryRank ? "locked" : null;
};
