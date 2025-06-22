import { Equipment } from './types';

// Hatchet
export const HATCHET: Equipment = {
  id: 'hatchet',
  name: 'Hatchet',
  category: 'Physical Weapons',
  baseType: 'Hatchet',
  description: 'Mek-scale hatchet for melee combat',
  requiresAmmo: false,
  introductionYear: 3025,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 5000,
      battleValue: 5
    },
    Clan: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 5000,
      battleValue: 5
    }
  },
  special: ['Melee Weapon', 'Variable Weight', 'Variable Damage']
};

// Sword
export const SWORD: Equipment = {
  id: 'sword',
  name: 'Sword',
  category: 'Physical Weapons',
  baseType: 'Sword',
  description: 'Mek-scale sword for melee combat',
  requiresAmmo: false,
  introductionYear: 3025,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 10000,
      battleValue: 7
    },
    Clan: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 10000,
      battleValue: 7
    }
  },
  special: ['Melee Weapon', 'Variable Weight', 'Variable Damage']
};

// Mace
export const MACE: Equipment = {
  id: 'mace',
  name: 'Mace',
  category: 'Physical Weapons',
  baseType: 'Mace',
  description: 'Mek-scale mace for melee combat',
  requiresAmmo: false,
  introductionYear: 3025,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 7500,
      battleValue: 6
    },
    Clan: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 7500,
      battleValue: 6
    }
  },
  special: ['Melee Weapon', 'Variable Weight', 'Variable Damage']
};

// Lance
export const LANCE: Equipment = {
  id: 'lance',
  name: 'Lance',
  category: 'Physical Weapons',
  baseType: 'Lance',
  description: 'Mek-scale lance for charging attacks',
  requiresAmmo: false,
  introductionYear: 3025,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 7500,
      battleValue: 6
    },
    Clan: {
      weight: 0, // Variable based on Mek tonnage
      crits: 0,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 7500,
      battleValue: 6
    }
  },
  special: ['Melee Weapon', 'Variable Weight', 'Variable Damage', 'Charging Bonus']
};

// Retractable Blade
export const RETRACTABLE_BLADE: Equipment = {
  id: 'retractable_blade',
  name: 'Retractable Blade',
  category: 'Physical Weapons',
  baseType: 'Retractable Blade',
  description: 'Retractable melee weapon that can be hidden',
  requiresAmmo: false,
  introductionYear: 3050,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 1,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 20000,
      battleValue: 8
    },
    Clan: {
      weight: 0, // Variable based on Mek tonnage
      crits: 1,
      damage: 0, // Variable based on Mek tonnage
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 20000,
      battleValue: 8
    }
  },
  special: ['Melee Weapon', 'Variable Weight', 'Variable Damage', 'Retractable']
};

// Vibroblade
export const VIBROBLADE: Equipment = {
  id: 'vibroblade',
  name: 'Vibroblade',
  category: 'Physical Weapons',
  baseType: 'Vibroblade',
  description: 'High-frequency vibrating blade weapon',
  requiresAmmo: false,
  introductionYear: 3055,
  rulesLevel: 'Advanced',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 1,
      damage: 0, // Variable based on Mek tonnage + 1
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 150000,
      battleValue: 15
    }
  },
  special: ['Melee Weapon', 'Variable Weight', 'Enhanced Damage', 'Vibro Technology']
};

// Chainsword
export const CHAINSWORD: Equipment = {
  id: 'chainsword',
  name: 'Chainsword',
  category: 'Physical Weapons',
  baseType: 'Chainsword',
  description: 'Chainsaw-like melee weapon with motorized cutting edge',
  requiresAmmo: false,
  introductionYear: 3050,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 5,
      damage: 0, // Variable based on Mek tonnage
      heat: 2,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 100000,
      battleValue: 12
    }
  },
  special: ['Melee Weapon', 'Variable Weight', 'Variable Damage', 'Motorized']
};

// Combine
export const COMBINE: Equipment = {
  id: 'combine',
  name: 'Combine',
  category: 'Physical Weapons',
  baseType: 'Combine',
  description: 'Agricultural harvesting equipment repurposed as a weapon',
  requiresAmmo: false,
  introductionYear: 3025,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 2.5,
      crits: 4,
      damage: 1,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 75000,
      battleValue: 7
    }
  },
  special: ['Industrial Equipment', 'Melee Weapon', 'Fixed Damage']
};

// Rock Cutter
export const ROCK_CUTTER: Equipment = {
  id: 'rock_cutter',
  name: 'Rock Cutter',
  category: 'Physical Weapons',
  baseType: 'Rock Cutter',
  description: 'Mining equipment that can be used as a weapon',
  requiresAmmo: false,
  introductionYear: 3025,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 5,
      crits: 7,
      damage: 5,
      heat: 3,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 100000,
      battleValue: 15
    }
  },
  special: ['Industrial Equipment', 'Melee Weapon', 'Mining Tool']
};

// Claws
export const CLAWS: Equipment = {
  id: 'claws',
  name: 'Claws',
  category: 'Physical Weapons',
  baseType: 'Claws',
  description: 'Retractable claw weapons for close combat',
  requiresAmmo: false,
  introductionYear: 3050,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 3,
      crits: 3,
      damage: 0, // Special damage rules
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 200000,
      battleValue: 15
    },
    Clan: {
      weight: 3,
      crits: 3,
      damage: 0, // Special damage rules
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 200000,
      battleValue: 15
    }
  },
  special: ['Melee Weapon', 'Special Damage Rules', 'Retractable']
};

export const PHYSICAL_WEAPONS: Equipment[] = [
  HATCHET,
  SWORD,
  MACE,
  LANCE,
  RETRACTABLE_BLADE,
  VIBROBLADE,
  CHAINSWORD,
  COMBINE,
  ROCK_CUTTER,
  CLAWS
];
