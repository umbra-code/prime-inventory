export const saveInventory = (inventory) => {
  try {
    const dataToSave = {
      masteredSets: inventory
        .filter((set) => set.isMastered)
        .map((set) => set.name),
      partCounts: inventory.reduce((acc, set) => {
        if (set.components) {
          set.components.forEach((part) => {
            if (part.userCount > 0) {
              acc.push({ uniqueName: part.uniqueName, userCount: part.userCount });
            }
          });
        } else if (set.userCount > 0) {
          // For direct items (e.g., mods) that have a userCount
          acc.push({ uniqueName: set.uniqueName, userCount: set.userCount });
        }
        return acc;
      }, []),
    };
    localStorage.setItem('primeInventory', JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save inventory to localStorage:', error);
  }
};

export const loadInventory = () => {
  console.log("Loading inventory from localStorage...");
  try {
    const storedData = localStorage.getItem('primeInventory');
    console.log("Stored data:", storedData);
    return storedData ? JSON.parse(storedData) : { masteredSets: [], partCounts: [] };
  } catch (error) {
    console.error('Failed to load inventory from localStorage:', error);
    return { masteredSets: [], partCounts: [] };
  }
};

export const updatePartCount = (currentInventory, uniqueName, newCount) => {
  return currentInventory.map((set) => {
    if (set.components) {
      const newComponents = set.components.map((part) => {
        if (part.uniqueName === uniqueName) {
          return { ...part, userCount: newCount };
        }
        return part;
      });
      return { ...set, components: newComponents };
    }
    if (set.uniqueName === uniqueName) {
      return { ...set, userCount: newCount };
    }
    return set;
  });
};

export const toggleMastery = (currentInventory, setName) => {
  return currentInventory.map((set) => {
    if (set.name === setName) {
      return { ...set, isMastered: !set.isMastered };
    }
    return set;
  });
};

export const buildItem = (currentInventory, primeSet) => {
  let newInventory = currentInventory.map((set) => {
    if (set.name === primeSet.name) {
      const updatedSet = { ...set, isMastered: true };
      if (updatedSet.components) {
        updatedSet.components = updatedSet.components.map((part) => ({
          ...part,
          userCount: Math.max(0, part.userCount - part.required),
        }));
      } else {
        updatedSet.userCount = Math.max(0, updatedSet.userCount - (updatedSet.required || 1));
      }
      return updatedSet;
    }
    return set;
  });
  return newInventory;
};

export const sellItem = (currentInventory, primeSet) => {
  let newInventory = currentInventory.map((set) => {
    if (set.name === primeSet.name) {
      const updatedSet = { ...set };
      if (updatedSet.components) {
        updatedSet.components = updatedSet.components.map((part) => ({
          ...part,
          userCount: Math.max(0, part.userCount - part.required),
        }));
      } else {
        updatedSet.userCount = Math.max(0, updatedSet.userCount - (updatedSet.required || 1));
      }
      return updatedSet;
    }
    return set;
  });
  return newInventory;
};

export const resetInventory = () => {
  try {
    localStorage.removeItem('primeInventory');
    console.log('Inventory reset in localStorage.');
  } catch (error) {
    console.error('Failed to reset inventory in localStorage:', error);
  }
};