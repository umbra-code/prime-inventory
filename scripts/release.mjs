// Releases a new version: development gets the version commit and tag, CI runs
// on it, and master is fast-forwarded to that exact commit once CI passes.
//
//   npm run release -- patch|minor|major [--dry-run]
//
// Set GITHUB_TOKEN to raise the GitHub API rate limit while waiting for CI.

import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const DEVELOP = "development";
const MAIN = "master";
const CI_POLL_MS = 20_000;
const CI_TIMEOUT_MS = 20 * 60_000;

const [bump, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");

const fail = (message) => {
  console.error(`\n✗ ${message}`);
  process.exit(1);
};

if (!["patch", "minor", "major"].includes(bump)) {
  fail("Usage: npm run release -- patch|minor|major [--dry-run]");
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const step = (title) => console.log(`\n→ ${title}`);

/** Runs a command that changes something; only printed in a dry run. */
const run = (command) => {
  console.log(`  $ ${command}`);
  if (!dryRun) execSync(command, { stdio: "inherit" });
};

/** Runs a read-only check, also in a dry run. */
const check = (command) => {
  console.log(`  $ ${command}`);
  execSync(command, { stdio: "inherit" });
};

const nextVersion = (version, part) => {
  const [major, minor, patch] = version.split(".").map(Number);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const githubRepo = () => {
  const url = git("remote", "get-url", "origin");
  const match = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  if (!match) fail(`origin is not a GitHub repository: ${url}`);
  return `${match[1]}/${match[2]}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits for the CI run of the pushed commit; resolves to the run, or fails. */
const waitForCi = async (repo, sha) => {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const url = `https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&event=push&branch=${DEVELOP}`;
  const deadline = Date.now() + CI_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await fetch(url, { headers });
    if (!response.ok) fail(`GitHub API returned ${response.status} while checking CI.`);
    const [ciRun] = (await response.json()).workflow_runs ?? [];
    if (ciRun?.status === "completed") return ciRun;
    process.stdout.write(`  ${ciRun ? ciRun.status : "waiting for the run to start"}…\r`);
    await sleep(CI_POLL_MS);
  }
  fail("Timed out waiting for CI. Check GitHub Actions, then fast-forward master by hand.");
};

// 1. Preconditions
step("Checking the repository");
if (git("branch", "--show-current") !== DEVELOP) fail(`Switch to ${DEVELOP} first.`);
if (git("status", "--porcelain")) fail("Commit or stash your changes first.");
const repo = githubRepo();

run("git pull --ff-only");
const current = JSON.parse(readFileSync("package.json", "utf8")).version;
const version = nextVersion(current, bump);

// 2. Local checks, so a broken build never gets a tag
step("Running lint and tests");
check("npm run lint");
check("npm test");

// 3. Confirm
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(
  `\nRelease v${version} (from v${current}) to ${MAIN}${dryRun ? " [dry run]" : ""}? [y/N] `
);
rl.close();
if (answer.trim().toLowerCase() !== "y") fail("Cancelled.");

// 4. Version commit and tag on development
step(`Creating v${version}`);
run(`npm version ${bump}`);
run("git push --follow-tags");

// 5. Wait for CI on that commit
step("Waiting for CI");
if (dryRun) {
  console.log("  (dry run: skipped)");
} else {
  const sha = git("rev-parse", "HEAD");
  const ciRun = await waitForCi(repo, sha);
  if (ciRun.conclusion !== "success") {
    fail(`CI ${ciRun.conclusion}: ${ciRun.html_url}\n  ${MAIN} was not touched. Fix it and release a patch.`);
  }
  console.log(`  ✓ CI passed: ${ciRun.html_url}`);
}

// 6. Fast-forward master to the released commit, then come back
step(`Updating ${MAIN}`);
try {
  run(`git switch ${MAIN}`);
  run("git pull --ff-only");
  run(`git merge --ff-only ${DEVELOP}`);
  run("git push");
} finally {
  run(`git switch ${DEVELOP}`);
}

console.log(`\n✓ Released v${version}${dryRun ? " (dry run, nothing changed)" : ""}`);
