// Shared by scripts/build-catalog.mjs (Node) and the in-app catalog refresh
// (browser), so both sources produce the exact same shape.

const consolidateComponents = (components) => {
  const byUniqueName = new Map();

  for (const comp of components) {
    if (!comp.tradable) continue;
    const existing = byUniqueName.get(comp.uniqueName);
    if (existing) {
      existing.required += comp.itemCount || 1;
    } else {
      byUniqueName.set(comp.uniqueName, {
        uniqueName: comp.uniqueName,
        name: comp.name,
        imageName: comp.imageName,
        required: comp.itemCount || 1,
        ducats: comp.ducats ?? 0,
      });
    }
  }

  return [...byUniqueName.values()];
};

/**
 * Reduces raw @wfcd/items entries to the Prime sets the app tracks: Prime
 * items (not mods) with at least one tradable component.
 */
export const slimCatalog = (items) =>
  items
    .filter((item) => item.isPrime && item.category !== "Mods" && item.components?.length)
    .map((item) => ({
      uniqueName: item.uniqueName,
      name: item.name,
      category: item.category,
      imageName: item.imageName,
      vaulted: Boolean(item.vaulted),
      components: consolidateComponents(item.components),
    }))
    .filter((set) => set.components.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
