// Generates src/data/primes.json, the catalog bundled with the app.
// Runs before every build; `generatedAt` only changes when the data does.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { isDeepStrictEqual } from "node:util";
import { slimCatalog } from "../src/lib/slimCatalog.mjs";

const require = createRequire(import.meta.url);
const Items = require("@wfcd/items");

const OUTPUT = new URL("../src/data/primes.json", import.meta.url);
const packageJson = new URL("../node_modules/@wfcd/items/package.json", import.meta.url);

const { version } = JSON.parse(await readFile(packageJson, "utf8"));
const sets = slimCatalog(new Items());

let previous = null;
try {
  previous = JSON.parse(await readFile(OUTPUT, "utf8"));
} catch {
  // First run: no existing catalog.
}

if (previous?.version === version && isDeepStrictEqual(previous.sets, sets)) {
  console.log(`Catalog unchanged (${sets.length} sets).`);
} else {
  const catalog = {
    version,
    generatedAt: new Date().toISOString(),
    sets,
  };
  await mkdir(new URL(".", OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`Catalog written: ${sets.length} sets from @wfcd/items@${version}.`);
}
