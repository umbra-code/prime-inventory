import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const categories = [
  'All',
  'Archwing',
  'Sentinels',
  'Warframes',
  'Primary',
  'Secondary',
  'Melee',
  'Arch-Gun',
];

const example =
{
  "accuracy": 23.529411,
  "attacks": [
    {
      "name": "Rocket Impact",
      "speed": 10,
      "crit_chance": 34,
      "crit_mult": 3,
      "status_chance": 18,
      "shot_type": "Projectile",
      "shot_speed": 70,
      "flight": 70,
      "damage": {
        "impact": 44
      }
    },
    {
      "name": "Rocket Explosion",
      "speed": 10,
      "crit_chance": 34,
      "crit_mult": 3,
      "status_chance": 18,
      "shot_type": "AoE",
      "falloff": {
        "start": 0,
        "end": 5,
        "reduction": 0.5
      },
      "damage": {
        "slash": 10.6,
        "puncture": 42.4
      }
    }
  ],
  "buildPrice": 15000,
  "buildQuantity": 1,
  "buildTime": 43200,
  "category": "Primary",
  "components": [
    {
      "uniqueName": "/Lotus/Types/Recipes/Weapons/WeaponParts/AcceltraPrimeBarrel",
      "name": "Barrel",
      "description": "A prime weapon-crafting component.",
      "primeSellingPrice": 100,
      "itemCount": 1,
      "imageName": "prime-barrel.png",
      "tradable": true,
      "drops": [
        {
          "chance": 0.02,
          "location": "Meso A5 Relic",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionGaussPrimeCBronze"
        },
        {
          "chance": 0.02,
          "location": "Neo A12 Relic",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeCBronze"
        },
        {
          "chance": 0.02,
          "location": "Neo A13 Relic",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeBBronze"
        },
        {
          "chance": 0.02,
          "location": "Neo A14 Relic",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionYareliPrimeABronze"
        },
        {
          "chance": 0.04,
          "location": "Meso A5 Relic (Exceptional)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionGaussPrimeCBronze"
        },
        {
          "chance": 0.04,
          "location": "Neo A12 Relic (Exceptional)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeCBronze"
        },
        {
          "chance": 0.04,
          "location": "Neo A13 Relic (Exceptional)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeBBronze"
        },
        {
          "chance": 0.04,
          "location": "Neo A14 Relic (Exceptional)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionYareliPrimeABronze"
        },
        {
          "chance": 0.06,
          "location": "Meso A5 Relic (Flawless)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionGaussPrimeCBronze"
        },
        {
          "chance": 0.06,
          "location": "Neo A12 Relic (Flawless)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeCBronze"
        },
        {
          "chance": 0.06,
          "location": "Neo A13 Relic (Flawless)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeBBronze"
        },
        {
          "chance": 0.06,
          "location": "Neo A14 Relic (Flawless)",
          "rarity": "Rare",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionYareliPrimeABronze"
        },
        {
          "chance": 0.1,
          "location": "Meso A5 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionGaussPrimeCBronze"
        },
        {
          "chance": 0.1,
          "location": "Neo A12 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeCBronze"
        },
        {
          "chance": 0.1,
          "location": "Neo A13 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeBBronze"
        },
        {
          "chance": 0.1,
          "location": "Neo A14 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Barrel",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionYareliPrimeABronze"
        }
      ],
      "masterable": false,
      "ducats": 100
    },
    {
      "uniqueName": "/Lotus/Types/Recipes/Weapons/AcceltraPrimeBlueprint",
      "name": "Blueprint",
      "description": "Engage your enemies with deadly speed. This weapon reloads even faster when its wielder sprints, faster still with Gauss.",
      "itemCount": 1,
      "primeSellingPrice": 15,
      "imageName": "blueprint.png",
      "tradable": true,
      "masterable": false,
      "ducats": 15,
      "drops": [
        {
          "chance": 0.1667,
          "location": "Axi M6 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeDBronze"
        },
        {
          "chance": 0.1667,
          "location": "Lith C11 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.1667,
          "location": "Lith M10 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionYareliPrimeABronze"
        },
        {
          "chance": 0.1667,
          "location": "Meso N17 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.1667,
          "location": "Meso V10 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.1667,
          "location": "Meso W5 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionProteaPrimeDBronze"
        },
        {
          "chance": 0.1667,
          "location": "Neo Z11 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeDBronze"
        },
        {
          "chance": 0.2,
          "location": "Axi M6 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeDBronze"
        },
        {
          "chance": 0.2,
          "location": "Lith C11 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.2,
          "location": "Lith M10 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionYareliPrimeABronze"
        },
        {
          "chance": 0.2,
          "location": "Meso N17 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.2,
          "location": "Meso V10 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.2,
          "location": "Meso W5 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionProteaPrimeDBronze"
        },
        {
          "chance": 0.2,
          "location": "Neo Z11 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeDBronze"
        },
        {
          "chance": 0.2333,
          "location": "Axi M6 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeDBronze"
        },
        {
          "chance": 0.2333,
          "location": "Lith C11 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.2333,
          "location": "Lith M10 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionYareliPrimeABronze"
        },
        {
          "chance": 0.2333,
          "location": "Meso N17 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.2333,
          "location": "Meso V10 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.2333,
          "location": "Meso W5 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionProteaPrimeDBronze"
        },
        {
          "chance": 0.2333,
          "location": "Neo Z11 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeDBronze"
        },
        {
          "chance": 0.2533,
          "location": "Axi M6 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeDBronze"
        },
        {
          "chance": 0.2533,
          "location": "Lith C11 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.2533,
          "location": "Lith M10 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T1VoidProjectionYareliPrimeABronze"
        },
        {
          "chance": 0.2533,
          "location": "Meso N17 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.2533,
          "location": "Meso V10 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.2533,
          "location": "Meso W5 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionProteaPrimeDBronze"
        },
        {
          "chance": 0.2533,
          "location": "Neo Z11 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Blueprint",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionSevagothPrimeDBronze"
        }
      ]
    },
    {
      "uniqueName": "/Lotus/Types/Items/MiscItems/OrokinCell",
      "name": "Orokin Cell",
      "description": "Ancient energy cell from the Orokin era.\n\nLocation: Ceres, Saturn, and Deimos",
      "itemCount": 10,
      "imageName": "orokin-cell-0d237af036.png",
      "tradable": false,
      "drops": [],
      "masterable": false,
      "type": "Resource"
    },
    {
      "uniqueName": "/Lotus/Types/Recipes/Weapons/WeaponParts/AcceltraPrimeReceiver",
      "name": "Receiver",
      "description": "A prime weapon-crafting component.",
      "primeSellingPrice": 45,
      "itemCount": 1,
      "imageName": "prime-receiver.png",
      "tradable": true,
      "drops": [
        {
          "chance": 0.11,
          "location": "Axi O6 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.11,
          "location": "Axi Z2 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeCBronze"
        },
        {
          "chance": 0.11,
          "location": "Meso K7 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionYareliPrimeBBronze"
        },
        {
          "chance": 0.11,
          "location": "Neo F3 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.11,
          "location": "Neo L4 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionXakuPrimeABronze"
        },
        {
          "chance": 0.11,
          "location": "Neo O2 Relic",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeABronze"
        },
        {
          "chance": 0.13,
          "location": "Axi O6 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.13,
          "location": "Axi Z2 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeCBronze"
        },
        {
          "chance": 0.13,
          "location": "Meso K7 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionYareliPrimeBBronze"
        },
        {
          "chance": 0.13,
          "location": "Neo F3 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.13,
          "location": "Neo L4 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionXakuPrimeABronze"
        },
        {
          "chance": 0.13,
          "location": "Neo O2 Relic (Exceptional)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeABronze"
        },
        {
          "chance": 0.17,
          "location": "Axi O6 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.17,
          "location": "Axi Z2 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeCBronze"
        },
        {
          "chance": 0.17,
          "location": "Meso K7 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionYareliPrimeBBronze"
        },
        {
          "chance": 0.17,
          "location": "Neo F3 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.17,
          "location": "Neo L4 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionXakuPrimeABronze"
        },
        {
          "chance": 0.17,
          "location": "Neo O2 Relic (Flawless)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeABronze"
        },
        {
          "chance": 0.2,
          "location": "Axi O6 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionSevagothPrimeABronze"
        },
        {
          "chance": 0.2,
          "location": "Axi Z2 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionLavosPrimeCBronze"
        },
        {
          "chance": 0.2,
          "location": "Meso K7 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionYareliPrimeBBronze"
        },
        {
          "chance": 0.2,
          "location": "Neo F3 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionGaussPrimeABronze"
        },
        {
          "chance": 0.2,
          "location": "Neo L4 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionXakuPrimeABronze"
        },
        {
          "chance": 0.2,
          "location": "Neo O2 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Receiver",
          "uniqueName": "/Lotus/Types/Game/Projections/T3VoidProjectionProteaPrimeABronze"
        }
      ],
      "masterable": false,
      "ducats": 45
    },
    {
      "uniqueName": "/Lotus/Types/Recipes/Weapons/WeaponParts/AcceltraPrimeStock",
      "name": "Stock",
      "description": "A prime weapon-crafting component.",
      "primeSellingPrice": 100,
      "itemCount": 1,
      "imageName": "prime-stock.png",
      "tradable": true,
      "drops": [
        {
          "chance": 0.02,
          "location": "Axi A18 Relic",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionGaussPrimeDBronze"
        },
        {
          "chance": 0.02,
          "location": "Axi A19 Relic",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.02,
          "location": "Meso A8 Relic",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionLavosPrimeABronze"
        },
        {
          "chance": 0.04,
          "location": "Axi A18 Relic (Exceptional)",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionGaussPrimeDBronze"
        },
        {
          "chance": 0.04,
          "location": "Axi A19 Relic (Exceptional)",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.04,
          "location": "Meso A8 Relic (Exceptional)",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionLavosPrimeABronze"
        },
        {
          "chance": 0.06,
          "location": "Axi A18 Relic (Flawless)",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionGaussPrimeDBronze"
        },
        {
          "chance": 0.06,
          "location": "Axi A19 Relic (Flawless)",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.06,
          "location": "Meso A8 Relic (Flawless)",
          "rarity": "Rare",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionLavosPrimeABronze"
        },
        {
          "chance": 0.1,
          "location": "Axi A18 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionGaussPrimeDBronze"
        },
        {
          "chance": 0.1,
          "location": "Axi A19 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T4VoidProjectionXakuPrimeDBronze"
        },
        {
          "chance": 0.1,
          "location": "Meso A8 Relic (Radiant)",
          "rarity": "Uncommon",
          "type": "Acceltra Prime Stock",
          "uniqueName": "/Lotus/Types/Game/Projections/T2VoidProjectionLavosPrimeABronze"
        }
      ],
      "masterable": false,
      "ducats": 100
    }
  ],
  "consumeOnBuild": true,
  "criticalChance": 0.34,
  "criticalMultiplier": 3,
  "damage": {
    "total": 97,
    "impact": 44,
    "puncture": 10.599999,
    "slash": 42.400002,
    "heat": 0,
    "cold": 0,
    "electricity": 0,
    "toxin": 0,
    "blast": 0,
    "radiation": 0,
    "gas": 0,
    "magnetic": 0,
    "viral": 0,
    "corrosive": 0,
    "void": 0,
    "tau": 0,
    "cinematic": 0,
    "shieldDrain": 0,
    "healthDrain": 0,
    "energyDrain": 0,
    "true": 0
  },
  "damagePerShot": [
    44,
    42.400002,
    10.599999,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  "description": "Engage your enemies with deadly speed. This weapon reloads even faster when its wielder sprints, faster still with Gauss.",
  "disposition": 1,
  "fireRate": 10.000001,
  "imageName": "acceltra-prime-5628f3e466.png",
  "introduced": {
    "name": "Hotfix 35.0.9",
    "url": "https://wiki.warframe.com/w/Update_35%23Hotfix_35.0.9",
    "aliases": [
      "35.0.9"
    ],
    "parent": "35.0",
    "date": "2024-01-17"
  },
  "isPrime": true,
  "magazineSize": 48,
  "masterable": true,
  "masteryReq": 14,
  "multishot": 1,
  "name": "Acceltra Prime",
  "noise": "Alarming",
  "omegaAttenuation": 0.55000001,
  "polarities": [
    "naramon",
    "madurai"
  ],
  "procChance": 0.18000001,
  "productCategory": "LongGuns",
  "releaseDate": "2024-01-17",
  "reloadTime": 1.6,
  "skipBuildTimePrice": 50,
  "slot": 1,
  "tags": [
    "Tenno",
    "Prime"
  ],
  "totalDamage": 97,
  "tradable": false,
  "trigger": "Auto",
  "type": "Rifle",
  "uniqueName": "/Lotus/Weapons/Tenno/LongGuns/PrimeAcceltra/PrimeAcceltraWeapon",
  "vaulted": false,
  "wikiAvailable": true,
  "wikiaThumbnail": "https://wiki.warframe.com/images/AcceltraPrime.png?0686c",
  "wikiaUrl": "https://wiki.warframe.com/w/Acceltra_Prime"
};