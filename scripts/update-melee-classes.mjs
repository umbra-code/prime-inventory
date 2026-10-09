// Updates src/data/meleeClasses.json (committed) with the class of every Prime
// melee weapon (Nikana, Glaive, Heavy Blade…), from the Warframe Wiki's weapon
// data module. @wfcd/items only says "Melee" for all of them.
//
//   npm run melee-classes
//
// Run it when a new Prime melee weapon is released. Until then, new ones show
// up as "Other Melee" in the app.

import { writeFile } from "node:fs/promises";

const SOURCE = "https://wiki.warframe.com/w/Module:Weapons/data/melee";
const OUTPUT = new URL("../src/data/meleeClasses.json", import.meta.url);

const response = await fetch(`${SOURCE}?action=raw`, {
  headers: { "User-Agent": "prime-inventory (https://github.com/umbra-code/prime-inventory)" },
});
if (!response.ok) throw new Error(`${response.status} fetching ${SOURCE}`);
const lua = await response.text();

// The module is a Lua table: top-level entries look like
//   ["Nikana Prime"] = { ... Class = "Nikana", ... },
const classes = {};
for (const [, name, body] of lua.matchAll(/\n\t\["([^"]+)"\] = \{([\s\S]*?)\n\t\},/g)) {
  const weaponClass = body.match(/\n\t\tClass = "([^"]+)"/)?.[1];
  // Exalted weapons are part of a Warframe, not sets of their own.
  if (name.endsWith(" Prime") && weaponClass && weaponClass !== "Exalted Weapon") {
    classes[name] = weaponClass;
  }
}

if (Object.keys(classes).length < 30) {
  throw new Error(`Only found ${Object.keys(classes).length} Prime melee weapons; the module format may have changed.`);
}

const sorted = Object.fromEntries(Object.entries(classes).sort(([a], [b]) => a.localeCompare(b, "en")));
await writeFile(OUTPUT, JSON.stringify({ source: SOURCE, classes: sorted }, null, 2) + "\n");
console.log(`Melee classes written: ${Object.keys(sorted).length} Prime weapons.`);
