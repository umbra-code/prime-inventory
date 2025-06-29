"use server";
import Items from "@wfcd/items";

const category = [
  "Primary",
  "Secondary",
  "Melee",
  "Warframes",
  "Sentinels",
  "Arch-Gun",
  "Archwing",
];

export const fetchItems = async () => {
  let items = new Items({ category });

  // Filter for prime items
  items = items.filter((item) => item.isPrime);

  return items;
};
