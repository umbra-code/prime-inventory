export const saveInventory = (inventory) => {
  try {
    localStorage.setItem('primeInventory', JSON.stringify(inventory));
  } catch (error) {
    console.error('Failed to save inventory to localStorage:', error);
  }
};

export const loadInventory = () => {
  try {
    const storedInventory = localStorage.getItem('primeInventory');
    return storedInventory ? JSON.parse(storedInventory) : null;
  } catch (error) {
    console.error('Failed to load inventory from localStorage:', error);
    return null;
  }
};

export const updatePartCount = (partName, newCount) => {
  console.log(`Updating ${partName} to ${newCount}`);
};

export const toggleMastery = (setName) => {
  console.log(`Toggling mastery for ${setName}`);
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