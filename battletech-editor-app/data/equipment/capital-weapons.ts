import { Equipment } from './types';

// Naval Autocannon (NAC) 10
export const NAC_10: Equipment = {
  id: 'nac_10',
  name: 'Naval Autocannon/10',
  category: 'Capital Weapons',
  baseType: 'NAC/10',
  description: 'Light naval autocannon for capital ship combat',
  requiresAmmo: true,
  introductionYear: 2200,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 100,
      crits: 10,
      damage: 10,
      heat: 3,
      minRange: 0,
      rangeShort: 12,
      rangeMedium: 24,
      rangeLong: 36,
      rangeExtreme: 48,
      cost: 200000,
      battleValue: 105
    }
  },
  special: ['Capital Weapon', 'Standard Damage']
};

// Naval Autocannon (NAC) 20
export const NAC_20: Equipment = {
  id: 'nac_20',
  name: 'Naval Autocannon/20',
  category: 'Capital Weapons',
  baseType: 'NAC/20',
  description: 'Medium naval autocannon for capital ship combat',
  requiresAmmo: true,
  introductionYear: 2200,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 150,
      crits: 15,
      damage: 20,
      heat: 6,
      minRange: 0,
      rangeShort: 10,
      rangeMedium: 20,
      rangeLong: 30,
      rangeExtreme: 40,
      cost: 300000,
      battleValue: 180
    }
  },
  special: ['Capital Weapon', 'Standard Damage']
};

// Naval Autocannon (NAC) 30
export const NAC_30: Equipment = {
  id: 'nac_30',
  name: 'Naval Autocannon/30',
  category: 'Capital Weapons',
  baseType: 'NAC/30',
  description: 'Heavy naval autocannon for capital ship combat',
  requiresAmmo: true,
  introductionYear: 2200,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 200,
      crits: 20,
      damage: 30,
      heat: 10,
      minRange: 0,
      rangeShort: 8,
      rangeMedium: 16,
      rangeLong: 24,
      rangeExtreme: 32,
      cost: 400000,
      battleValue: 237
    }
  },
  special: ['Capital Weapon', 'Standard Damage']
};

// Naval Autocannon (NAC) 40
export const NAC_40: Equipment = {
  id: 'nac_40',
  name: 'Naval Autocannon/40',
  category: 'Capital Weapons',
  baseType: 'NAC/40',
  description: 'Very heavy naval autocannon for capital ship combat',
  requiresAmmo: true,
  introductionYear: 2200,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 250,
      crits: 25,
      damage: 40,
      heat: 12,
      minRange: 0,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      rangeExtreme: 24,
      cost: 500000,
      battleValue: 288
    }
  },
  special: ['Capital Weapon', 'Standard Damage']
};

// Naval Laser 35
export const NLASER_35: Equipment = {
  id: 'nlaser_35',
  name: 'Naval Laser 35',
  category: 'Capital Weapons',
  baseType: 'NL35',
  description: 'Medium naval laser for capital ship combat',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 120,
      crits: 12,
      damage: 35,
      heat: 35,
      minRange: 0,
      rangeShort: 11,
      rangeMedium: 22,
      rangeLong: 33,
      rangeExtreme: 44,
      cost: 600000,
      battleValue: 295
    }
  },
  special: ['Capital Weapon', 'Energy Weapon']
};

// Naval Laser 45
export const NLASER_45: Equipment = {
  id: 'nlaser_45',
  name: 'Naval Laser 45',
  category: 'Capital Weapons',
  baseType: 'NL45',
  description: 'Heavy naval laser for capital ship combat',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 180,
      crits: 18,
      damage: 45,
      heat: 45,
      minRange: 0,
      rangeShort: 10,
      rangeMedium: 20,
      rangeLong: 30,
      rangeExtreme: 40,
      cost: 900000,
      battleValue: 351
    }
  },
  special: ['Capital Weapon', 'Energy Weapon']
};

// Naval Laser 55
export const NLASER_55: Equipment = {
  id: 'nlaser_55',
  name: 'Naval Laser 55',
  category: 'Capital Weapons',
  baseType: 'NL55',
  description: 'Very heavy naval laser for capital ship combat',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 220,
      crits: 22,
      damage: 55,
      heat: 55,
      minRange: 0,
      rangeShort: 9,
      rangeMedium: 18,
      rangeLong: 27,
      rangeExtreme: 36,
      cost: 1200000,
      battleValue: 400
    }
  },
  special: ['Capital Weapon', 'Energy Weapon']
};

// Naval PPC
export const NAVAL_PPC: Equipment = {
  id: 'naval_ppc',
  name: 'Naval PPC',
  category: 'Capital Weapons',
  baseType: 'NPPC',
  description: 'Capital-scale particle projection cannon',
  requiresAmmo: false,
  introductionYear: 2350,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 165,
      crits: 16,
      damage: 15,
      heat: 15,
      minRange: 3,
      rangeShort: 12,
      rangeMedium: 24,
      rangeLong: 36,
      rangeExtreme: 48,
      cost: 750000,
      battleValue: 165
    }
  },
  special: ['Capital Weapon', 'Energy Weapon', 'No Minimum Range Penalty']
};

// Mass Driver
export const MASS_DRIVER: Equipment = {
  id: 'mass_driver',
  name: 'Mass Driver',
  category: 'Capital Weapons',
  baseType: 'Mass Driver',
  description: 'Massive kinetic weapon for capital ship combat',
  requiresAmmo: true,
  introductionYear: 2200,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 200,
      crits: 20,
      damage: 40,
      heat: 0,
      minRange: 12,
      rangeShort: 24,
      rangeMedium: 48,
      rangeLong: 72,
      rangeExtreme: 96,
      cost: 500000,
      battleValue: 320
    }
  },
  special: ['Capital Weapon', 'Kinetic Weapon', 'No Heat']
};

// Killer Whale Missile
export const KILLER_WHALE: Equipment = {
  id: 'killer_whale',
  name: 'Killer Whale Missile',
  category: 'Capital Weapons',
  baseType: 'Killer Whale',
  description: 'Heavy capital missile system',
  requiresAmmo: true,
  introductionYear: 2380,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 150,
      crits: 15,
      damage: 40,
      heat: 12,
      minRange: 0,
      rangeShort: 12,
      rangeMedium: 24,
      rangeLong: 40,
      rangeExtreme: 50,
      cost: 400000,
      battleValue: 345
    }
  },
  special: ['Capital Weapon', 'Missile Weapon', 'Capital Missile']
};

export const CAPITAL_WEAPONS: Equipment[] = [
  NAC_10,
  NAC_20,
  NAC_30,
  NAC_40,
  NLASER_35,
  NLASER_45,
  NLASER_55,
  NAVAL_PPC,
  MASS_DRIVER,
  KILLER_WHALE
];
