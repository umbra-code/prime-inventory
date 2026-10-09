// Small synthetic catalog and helpers shared by the unit tests.

export const ash = {
  uniqueName: "/Sets/AshPrime",
  name: "Ash Prime",
  category: "Warframes",
  type: "Warframe",
  vaulted: true,
  components: [
    { uniqueName: "/Parts/AshPrimeBlueprint", name: "Blueprint", required: 1, ducats: 45 },
    { uniqueName: "/Parts/AshPrimeChassis", name: "Chassis", required: 1, ducats: 45 },
  ],
};

export const akbronco = {
  uniqueName: "/Sets/AkbroncoPrime",
  name: "Akbronco Prime",
  category: "Secondary",
  type: "Dual Pistols",
  vaulted: false,
  components: [
    { uniqueName: "/Parts/AkbroncoPrimeBlueprint", name: "Blueprint", required: 1, ducats: 15 },
    { uniqueName: "/Parts/AkbroncoPrimeLink", name: "Link", required: 2, ducats: 15 },
  ],
};

export const braton = {
  uniqueName: "/Sets/BratonPrime",
  name: "Braton Prime",
  category: "Primary",
  type: "Rifle",
  vaulted: false,
  components: [
    { uniqueName: "/Parts/BratonPrimeBarrel", name: "Barrel", required: 1, ducats: 15 },
    { uniqueName: "/Parts/BratonPrimeStock", name: "Stock", required: 1, ducats: 15 },
    { uniqueName: "/Parts/BratonPrimeReceiver", name: "Receiver", required: 1, ducats: 15 },
    { uniqueName: "/Parts/BratonPrimeBlueprint", name: "Blueprint", required: 1, ducats: 15 },
  ],
};

export const catalogSets = [akbronco, ash, braton];

/** Counts that complete every component of the given set. */
export const fullCounts = (set, extra = 0) =>
  Object.fromEntries(set.components.map((part) => [part.uniqueName, part.required + extra]));

/** Minimal in-memory Storage, enough for localStorage-backed code. */
export const createStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  };
};
