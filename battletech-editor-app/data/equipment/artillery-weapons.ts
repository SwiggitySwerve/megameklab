import { Equipment } from './types';

// Long Tom Artillery Cannon
export const LONG_TOM_ARTILLERY: Equipment = {
  id: 'long_tom_artillery',
  name: 'Long Tom Artillery Cannon',
  category: 'Artillery Weapons',
  baseType: 'Long Tom',
  description: 'Heavy long-range artillery weapon with devastating area effect',
  requiresAmmo: true,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 30,
      crits: 15,
      damage: 25,
      heat: 20,
      minRange: 25,
      rangeShort: 30,
      rangeMedium: 30,
      rangeLong: 30,
      rangeExtreme: 30,
      cost: 450000,
      battleValue: 347
    }
  },
  special: ['Area Effect', 'Indirect Fire', 'Artillery Rules']
};

// Sniper Artillery Cannon
export const SNIPER_ARTILLERY: Equipment = {
  id: 'sniper_artillery',
  name: 'Sniper Artillery Cannon',
  category: 'Artillery Weapons',
  baseType: 'Sniper',
  description: 'Medium artillery weapon with good range and accuracy',
  requiresAmmo: true,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 20,
      crits: 10,
      damage: 20,
      heat: 10,
      minRange: 12,
      rangeShort: 18,
      rangeMedium: 18,
      rangeLong: 18,
      rangeExtreme: 18,
      cost: 300000,
      battleValue: 225
    }
  },
  special: ['Area Effect', 'Indirect Fire', 'Artillery Rules']
};

// Thumper Artillery Cannon
export const THUMPER_ARTILLERY: Equipment = {
  id: 'thumper_artillery',
  name: 'Thumper Artillery Cannon',
  category: 'Artillery Weapons',
  baseType: 'Thumper',
  description: 'Light artillery weapon with moderate range and damage',
  requiresAmmo: true,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 15,
      crits: 7,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 12,
      rangeMedium: 12,
      rangeLong: 12,
      rangeExtreme: 12,
      cost: 187500,
      battleValue: 135
    }
  },
  special: ['Area Effect', 'Indirect Fire', 'Artillery Rules']
};

// Arrow IV Artillery System
export const ARROW_IV_ARTILLERY: Equipment = {
  id: 'arrow_iv_artillery',
  name: 'Arrow IV Artillery System',
  category: 'Artillery Weapons',
  baseType: 'Arrow IV',
  description: 'Advanced guided artillery missile system',
  requiresAmmo: true,
  introductionYear: 2593,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 15,
      crits: 15,
      damage: 20,
      heat: 10,
      minRange: 8,
      rangeShort: 17,
      rangeMedium: 34,
      rangeLong: 51,
      rangeExtreme: 68,
      cost: 450000,
      battleValue: 240
    },
    Clan: {
      weight: 12,
      crits: 12,
      damage: 20,
      heat: 10,
      minRange: 8,
      rangeShort: 17,
      rangeMedium: 34,
      rangeLong: 51,
      rangeExtreme: 68,
      cost: 450000,
      battleValue: 240
    }
  },
  special: ['Guided', 'Area Effect', 'Special Ammunition']
};

// Long Tom Cannon (Non-Artillery Version)
export const LONG_TOM_CANNON: Equipment = {
  id: 'long_tom_cannon',
  name: 'Long Tom Cannon',
  category: 'Artillery Weapons',
  baseType: 'Long Tom Cannon',
  description: 'Direct-fire version of the Long Tom artillery system',
  requiresAmmo: true,
  introductionYear: 2000,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 20,
      crits: 10,
      damage: 20,
      heat: 8,
      minRange: 0,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 300000,
      battleValue: 175
    }
  },
  special: ['Direct Fire', 'Heavy Weapon']
};

export const ARTILLERY_WEAPONS: Equipment[] = [
  LONG_TOM_ARTILLERY,
  SNIPER_ARTILLERY,
  THUMPER_ARTILLERY,
  ARROW_IV_ARTILLERY,
  LONG_TOM_CANNON
];
