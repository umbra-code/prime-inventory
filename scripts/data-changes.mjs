// Used by the scheduled data update workflow (.github/workflows/update-data.yml):
//
//   node scripts/data-changes.mjs snapshot <dir>          Saves the generated data
//   node scripts/data-changes.mjs compare <dir> <notes>   Compares it with the current data
//
// compare writes release notes to <notes> and changed=true|false to $GITHUB_OUTPUT.

import { appendFile, copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describeChanges, diffCatalogs } from "../src/lib/dataChanges.mjs";

const DATA_DIR = fileURLToPath(new URL("../src/data/", import.meta.url));
const isGenerated = (file) => file === "primes.json" || /^names\.[a-z-]+\.json$/.test(file);

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const readNames = async (dir) => {
  const names = {};
  for (const file of (await readdir(dir)).filter((f) => f.startsWith("names.")).sort()) {
    names[file] = await readJson(join(dir, file));
  }
  return names;
};

const setOutput = async (name, value) => {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
};

const [command, dir, notesFile] = process.argv.slice(2);

if (command === "snapshot" && dir) {
  await mkdir(dir, { recursive: true });
  for (const file of (await readdir(DATA_DIR)).filter(isGenerated)) {
    await copyFile(join(DATA_DIR, file), join(dir, file));
  }
  console.log(`Data saved to ${dir}.`);
} else if (command === "compare" && dir && notesFile) {
  const before = await readJson(join(dir, "primes.json"));
  const after = await readJson(join(DATA_DIR, "primes.json"));
  const changes = diffCatalogs(before, after, {
    namesBefore: await readNames(dir),
    namesAfter: await readNames(DATA_DIR),
  });

  if (changes) {
    const notes = describeChanges(changes, { fromVersion: before.version, toVersion: after.version });
    await writeFile(notesFile, notes);
    console.log(notes);
  } else {
    console.log(`No changes the app shows (@wfcd/items ${before.version} → ${after.version}).`);
  }
  await setOutput("changed", Boolean(changes));
} else {
  console.error("Usage: node scripts/data-changes.mjs snapshot <dir> | compare <dir> <notes-file>");
  process.exit(1);
}
