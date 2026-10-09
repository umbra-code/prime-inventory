import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { getBuildVersion } from "./src/lib/buildVersion.mjs";

const git = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return undefined; // Not a git checkout, or no tags (e.g. a shallow clone).
  }
};

const { version: packageVersion } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const buildVersion = getBuildVersion({
  describe: git("describe", "--tags", "--match", "v*", "--dirty"),
  packageVersion,
  // Vercel builds from a shallow clone without tags, but exposes the commit and branch.
  commit: process.env.VERCEL_GIT_COMMIT_SHA ?? git("rev-parse", "HEAD"),
  branch: process.env.VERCEL_GIT_COMMIT_REF ?? git("branch", "--show-current"),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: buildVersion.label,
    NEXT_PUBLIC_APP_VERSION_URL: buildVersion.url,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.warframestat.us',
        port: '',
        pathname: '/img/**',
      },
    ],
  },
};

export default nextConfig;
