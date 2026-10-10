"use client";

import { getCachedPrices, refreshPrices } from "@/services/prices";
import { createContext, useEffect, useState } from "react";

// Kept apart from the inventory contexts: prices arrive later and change
// rarely, and only the small price labels need to re-render when they do.
export const PricesContext = createContext(null);

export function PricesProvider({ children }) {
  const [prices, setPrices] = useState(getCachedPrices);

  useEffect(() => {
    refreshPrices().then((fresh) => {
      if (fresh) setPrices(fresh);
    });
  }, []);

  return <PricesContext.Provider value={prices}>{children}</PricesContext.Provider>;
}
