// Version label shown in the app, computed at build time by next.config.mjs.

const REPO_URL = "https://github.com/umbra-code/prime-inventory";

/**
 * Turns `git describe --tags --dirty` output (or, without tags, the package
 * version and commit) into a label and a link:
 *   "v2.3.0"              built exactly from the v2.3.0 tag  -> tag page
 *   "v2.3.0-4-gabc1234"   4 commits after v2.3.0             -> commit page
 *   "v2.3.0+abc1234"      no tags available (shallow clone)  -> commit page
 * A "-dirty" suffix means the build had uncommitted changes. Without tags, a
 * build of the release branch is the release itself, since that branch only
 * receives tagged releases.
 */
export const RELEASE_BRANCH = "master";

export const getBuildVersion = ({ describe, packageVersion, commit, branch }) => {
  if (describe) {
    const exactTag = describe.match(/^(v\d+\.\d+\.\d+)(-dirty)?$/);
    const afterTag = describe.match(/-g([0-9a-f]+)(?:-dirty)?$/);
    if (exactTag && !exactTag[2]) return { label: describe, url: `${REPO_URL}/releases/tag/${describe}` };
    const sha = afterTag?.[1] ?? commit;
    return { label: describe, url: sha ? `${REPO_URL}/commit/${sha}` : REPO_URL };
  }

  if (branch === RELEASE_BRANCH) {
    return { label: `v${packageVersion}`, url: `${REPO_URL}/releases/tag/v${packageVersion}` };
  }

  const shortSha = commit?.slice(0, 7);
  return {
    label: shortSha ? `v${packageVersion}+${shortSha}` : `v${packageVersion}`,
    url: commit ? `${REPO_URL}/commit/${commit}` : REPO_URL,
  };
};
