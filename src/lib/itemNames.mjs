// Builds the in-game item names for a language from @wfcd/items translations
// (data/json/i18n/<lang>.json). Used by scripts/build-catalog.mjs.

// Part names the translations leave out; every Prime set has a Blueprint.
const MISSING_PART_NAMES = {
  es: { Blueprint: "Plano" },
};

// Some names carry a tag, e.g. "<ARCHWING> Odonata Prime".
const cleanName = (name) => name.replace(/^<[^>]+>\s*/, "").trim();

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Translations name parts in full ("Chasis de Ash Prime"); cards only show the
// part ("Chasis"), so drop the set name with or without the "de" joiner.
const shortPartName = (fullName, setName) => {
  const suffix = new RegExp(`\\s+(?:de\\s+)?${escapeRegExp(setName)}$`, "i");
  const short = fullName.replace(suffix, "");
  return short && short !== fullName ? short : fullName;
};

/**
 * Returns `{ sets, parts }`, each mapping uniqueName to the translated name.
 * Only names that differ from English are included; anything missing falls
 * back to English in the app.
 */
export const buildItemNames = (sets, translations, language) => {
  const names = { sets: {}, parts: {} };
  const fallbacks = MISSING_PART_NAMES[language] ?? {};

  for (const set of sets) {
    const setName = cleanName(translations[set.uniqueName]?.name ?? set.name);
    if (setName !== set.name) names.sets[set.uniqueName] = setName;

    for (const part of set.components) {
      const fullName = translations[part.uniqueName]?.name;
      const partName = fullName
        ? shortPartName(cleanName(fullName), setName)
        : fallbacks[part.name] ?? part.name;
      if (partName !== part.name) names.parts[part.uniqueName] = partName;
    }
  }

  return names;
};
