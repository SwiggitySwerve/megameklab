import { Equipment } from './types';

// Anti-Personnel Pod
export const ANTI_PERSONNEL_POD: Equipment = {
  id: 'anti_personnel_pod',
  name: 'Anti-Personnel Pod',
  category: 'Anti-Personnel Weapons',
  baseType: 'Anti-Personnel Pod',
  description: 'Defensive system designed to eliminate infantry threats',
  requiresAmmo: false,
  introductionYear: 3050,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 0, // Special damage vs. infantry
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 1500,
      battleValue: 1
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 0, // Special damage vs. infantry
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 1500,
      battleValue: 1
    }
  },
  special: ['Anti-Infantry', 'Area Effect', 'Defensive System']
};

// Machine Gun
export const MACHINE_GUN: Equipment = {
  id: 'machine_gun',
  name: 'Machine Gun',
  category: 'Anti-Personnel Weapons',
  baseType: 'Machine Gun',
  description: 'Rapid-fire weapon effective against infantry and light armor',
  requiresAmmo: true,
  introductionYear: 2100,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 2,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 5000,
      battleValue: 5
    },
    Clan: {
      weight: 0.25,
      crits: 1,
      damage: 2,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 5000,
      battleValue: 5
    }
  },
  special: ['Anti-Infantry', 'Rapid Fire', 'Low Damage vs. Armor']
};

// Light Machine Gun
export const LIGHT_MACHINE_GUN: Equipment = {
  id: 'light_machine_gun',
  name: 'Light Machine Gun',
  category: 'Anti-Personnel Weapons',
  baseType: 'Light Machine Gun',
  description: 'Lightweight rapid-fire weapon for anti-infantry work',
  requiresAmmo: true,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 1,
      heat: 0,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 4,
      rangeLong: 6,
      rangeExtreme: 8,
      cost: 5000,
      battleValue: 5
    },
    Clan: {
      weight: 0.25,
      crits: 1,
      damage: 1,
      heat: 0,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 4,
      rangeLong: 6,
      rangeExtreme: 8,
      cost: 5000,
      battleValue: 5
    }
  },
  special: ['Anti-Infantry', 'Rapid Fire', 'Extended Range']
};

// Heavy Machine Gun
export const HEAVY_MACHINE_GUN: Equipment = {
  id: 'heavy_machine_gun',
  name: 'Heavy Machine Gun',
  category: 'Anti-Personnel Weapons',
  baseType: 'Heavy Machine Gun',
  description: 'Heavy-caliber rapid-fire weapon with increased stopping power',
  requiresAmmo: true,
  introductionYear: 3068,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 3,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 7500,
      battleValue: 7
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 7500,
      battleValue: 7
    }
  },
  special: ['Anti-Infantry', 'Rapid Fire', 'Enhanced Damage']
};

// Flamer
export const FLAMER: Equipment = {
  id: 'flamer',
  name: 'Flamer',
  category: 'Anti-Personnel Weapons',
  baseType: 'Flamer',
  description: 'Incendiary weapon that projects burning fuel',
  requiresAmmo: false,
  introductionYear: 2025,
  rulesLevel: 'Introductory',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 2,
      heat: 3,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 7500,
      battleValue: 6
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 2,
      heat: 3,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 7500,
      battleValue: 6
    }
  },
  special: ['Heat Weapon', 'Incendiary', 'Anti-Infantry']
};

// Vehicle Flamer
export const VEHICLE_FLAMER: Equipment = {
  id: 'vehicle_flamer',
  name: 'Vehicle Flamer',
  category: 'Anti-Personnel Weapons',
  baseType: 'Vehicle Flamer',
  description: 'Vehicle-mounted incendiary weapon system',
  requiresAmmo: true,
  introductionYear: 2025,
  rulesLevel: 'Introductory',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 2,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 7500,
      battleValue: 5
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 2,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 7500,
      battleValue: 5
    }
  },
  special: ['Incendiary', 'Anti-Infantry', 'Ammo-Fed']
};

// Small Vibroblade
export const SMALL_VIBROBLADE: Equipment = {
  id: 'small_vibroblade',
  name: 'Small Vibroblade',
  category: 'Anti-Personnel Weapons',
  baseType: 'Small Vibroblade',
  description: 'Battle Armor-scale vibrating blade weapon',
  requiresAmmo: false,
  introductionYear: 3055,
  rulesLevel: 'Advanced',
  variants: {
    IS: {
      weight: 0.2,
      crits: 1,
      damage: 0, // Special BA damage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 30000,
      battleValue: 15
    }
  },
  special: ['Battle Armor Only', 'Melee Weapon', 'Vibro Technology']
};

// Battle Armor Flamer
export const BA_FLAMER: Equipment = {
  id: 'ba_flamer',
  name: 'Battle Armor Flamer',
  category: 'Anti-Personnel Weapons',
  baseType: 'Battle Armor Flamer',
  description: 'Miniaturized flamer for Battle Armor use',
  requiresAmmo: false,
  introductionYear: 3050,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.3,
      crits: 1,
      damage: 1,
      heat: 2,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 5000,
      battleValue: 4
    },
    Clan: {
      weight: 0.2,
      crits: 1,
      damage: 1,
      heat: 2,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      rangeExtreme: 4,
      cost: 5000,
      battleValue: 4
    }
  },
  special: ['Battle Armor Only', 'Incendiary', 'Anti-Infantry']
};

export const ANTI_PERSONNEL_WEAPONS: Equipment[] = [
  ANTI_PERSONNEL_POD,
  MACHINE_GUN,
  LIGHT_MACHINE_GUN,
  HEAVY_MACHINE_GUN,
  FLAMER,
  VEHICLE_FLAMER,
  SMALL_VIBROBLADE,
  BA_FLAMER
];
