"use server"
import Items from "@wfcd/items";

export const getPrimeItems = async () => {
  const items = new Items();
  const primeItems = items.filter((item) =>
    item.isPrime && // Check if the item is a Prime item
    item.category !== "Mods" && // Exclude Prime Mods
    item.components && // Ensure the item has components
    item.components.length > 0 // Ensure the item has components
  );

  // Transform items into PrimeSet and PrimePart format
  const primeSets = primeItems.map(item => {
    const components = item.components?.filter(comp => comp.tradable).map(comp => ({
      ...comp,
      required: comp.itemCount || 1,
      userCount: 0, // Default to 0 for user inventory
    })) ?? []

    return {
      ...item,
      components: components,
      isMastered: false, // Default to false for user mastery
      userCount: 0, // For items without components (e.g., Prime Mods)
      required: 1, // For items without components
    };
  });

  return primeSets;
};