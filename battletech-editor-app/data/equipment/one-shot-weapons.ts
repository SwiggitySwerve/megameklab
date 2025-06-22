import { Equipment } from './types';

// Rocket Launcher 10
export const ROCKET_LAUNCHER_10: Equipment = {
  id: 'rocket_launcher_10',
  name: 'Rocket Launcher 10',
  category: 'One-Shot Weapons',
  baseType: 'Rocket Launcher 10',
  description: 'Single-use rocket launcher with 10 unguided rockets',
  requiresAmmo: false,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 1, // Per rocket
      heat: 3,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 11,
      rangeLong: 18,
      rangeExtreme: 22,
      cost: 15000,
      battleValue: 15
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 1, // Per rocket
      heat: 3,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 11,
      rangeLong: 18,
      rangeExtreme: 22,
      cost: 15000,
      battleValue: 15
    }
  },
  special: ['One-Shot', 'Cluster Weapon', 'No Ammo Required']
};

// Rocket Launcher 15
export const ROCKET_LAUNCHER_15: Equipment = {
  id: 'rocket_launcher_15',
  name: 'Rocket Launcher 15',
  category: 'One-Shot Weapons',
  baseType: 'Rocket Launcher 15',
  description: 'Single-use rocket launcher with 15 unguided rockets',
  requiresAmmo: false,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 2,
      damage: 1, // Per rocket
      heat: 5,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 11,
      rangeLong: 18,
      rangeExtreme: 22,
      cost: 30000,
      battleValue: 23
    },
    Clan: {
      weight: 1,
      crits: 2,
      damage: 1, // Per rocket
      heat: 5,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 11,
      rangeLong: 18,
      rangeExtreme: 22,
      cost: 30000,
      battleValue: 23
    }
  },
  special: ['One-Shot', 'Cluster Weapon', 'No Ammo Required']
};

// Rocket Launcher 20
export const ROCKET_LAUNCHER_20: Equipment = {
  id: 'rocket_launcher_20',
  name: 'Rocket Launcher 20',
  category: 'One-Shot Weapons',
  baseType: 'Rocket Launcher 20',
  description: 'Single-use rocket launcher with 20 unguided rockets',
  requiresAmmo: false,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1.5,
      crits: 3,
      damage: 1, // Per rocket
      heat: 6,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 11,
      rangeLong: 18,
      rangeExtreme: 22,
      cost: 45000,
      battleValue: 30
    },
    Clan: {
      weight: 1.5,
      crits: 3,
      damage: 1, // Per rocket
      heat: 6,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 11,
      rangeLong: 18,
      rangeExtreme: 22,
      cost: 45000,
      battleValue: 30
    }
  },
  special: ['One-Shot', 'Cluster Weapon', 'No Ammo Required']
};

// MRM 10 (One-Shot)
export const MRM_10_OS: Equipment = {
  id: 'mrm_10_os',
  name: 'MRM 10 (OS)',
  category: 'One-Shot Weapons',
  baseType: 'MRM 10 (OS)',
  description: 'One-shot Medium Range Missile launcher',
  requiresAmmo: false,
  introductionYear: 3058,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1.5,
      crits: 1,
      damage: 1, // Per missile
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 8,
      rangeLong: 15,
      rangeExtreme: 22,
      cost: 50000,
      battleValue: 30
    }
  },
  special: ['One-Shot', 'Missile Weapon', 'No Ammo Required']
};

// MRM 20 (One-Shot)
export const MRM_20_OS: Equipment = {
  id: 'mrm_20_os',
  name: 'MRM 20 (OS)',
  category: 'One-Shot Weapons',
  baseType: 'MRM 20 (OS)',
  description: 'One-shot Medium Range Missile launcher',
  requiresAmmo: false,
  introductionYear: 3058,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 3,
      crits: 2,
      damage: 1, // Per missile
      heat: 6,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 8,
      rangeLong: 15,
      rangeExtreme: 22,
      cost: 125000,
      battleValue: 60
    }
  },
  special: ['One-Shot', 'Missile Weapon', 'No Ammo Required']
};

// MRM 30 (One-Shot)
export const MRM_30_OS: Equipment = {
  id: 'mrm_30_os',
  name: 'MRM 30 (OS)',
  category: 'One-Shot Weapons',
  baseType: 'MRM 30 (OS)',
  description: 'One-shot Medium Range Missile launcher',
  requiresAmmo: false,
  introductionYear: 3058,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 4.5,
      crits: 3,
      damage: 1, // Per missile
      heat: 10,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 8,
      rangeLong: 15,
      rangeExtreme: 22,
      cost: 225000,
      battleValue: 90
    }
  },
  special: ['One-Shot', 'Missile Weapon', 'No Ammo Required']
};

// SRM 2 (One-Shot)
export const SRM_2_OS: Equipment = {
  id: 'srm_2_os',
  name: 'SRM 2 (OS)',
  category: 'One-Shot Weapons',
  baseType: 'SRM 2 (OS)',
  description: 'One-shot Short Range Missile launcher',
  requiresAmmo: false,
  introductionYear: 2500,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 2, // Per missile
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      rangeExtreme: 12,
      cost: 10000,
      battleValue: 21
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 2, // Per missile
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      rangeExtreme: 12,
      cost: 10000,
      battleValue: 21
    }
  },
  special: ['One-Shot', 'Missile Weapon', 'No Ammo Required']
};

// SRM 4 (One-Shot)
export const SRM_4_OS: Equipment = {
  id: 'srm_4_os',
  name: 'SRM 4 (OS)',
  category: 'One-Shot Weapons',
  baseType: 'SRM 4 (OS)',
  description: 'One-shot Short Range Missile launcher',
  requiresAmmo: false,
  introductionYear: 2500,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 2, // Per missile
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      rangeExtreme: 12,
      cost: 60000,
      battleValue: 39
    },
    Clan: {
      weight: 1,
      crits: 1,
      damage: 2, // Per missile
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      rangeExtreme: 12,
      cost: 60000,
      battleValue: 39
    }
  },
  special: ['One-Shot', 'Missile Weapon', 'No Ammo Required']
};

// SRM 6 (One-Shot)
export const SRM_6_OS: Equipment = {
  id: 'srm_6_os',
  name: 'SRM 6 (OS)',
  category: 'One-Shot Weapons',
  baseType: 'SRM 6 (OS)',
  description: 'One-shot Short Range Missile launcher',
  requiresAmmo: false,
  introductionYear: 2500,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1.5,
      crits: 1,
      damage: 2, // Per missile
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      rangeExtreme: 12,
      cost: 80000,
      battleValue: 59
    },
    Clan: {
      weight: 1.5,
      crits: 1,
      damage: 2, // Per missile
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      rangeExtreme: 12,
      cost: 80000,
      battleValue: 59
    }
  },
  special: ['One-Shot', 'Missile Weapon', 'No Ammo Required']
};

// Thunderbolt 5 (One-Shot)
export const THUNDERBOLT_5_OS: Equipment = {
  id: 'thunderbolt_5_os',
  name: 'Thunderbolt 5 (OS)',
  category: 'One-Shot Weapons',
  baseType: 'Thunderbolt 5 (OS)',
  description: 'One-shot heavy missile launcher',
  requiresAmmo: false,
  introductionYear: 2621,
  rulesLevel: 'Advanced',
  variants: {
    IS: {
      weight: 1.5,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 5,
      rangeShort: 6,
      rangeMedium: 13,
      rangeLong: 20,
      rangeExtreme: 26,
      cost: 30000,
      battleValue: 64
    }
  },
  special: ['One-Shot', 'Heavy Missile', 'Minimum Range']
};

export const ONE_SHOT_WEAPONS: Equipment[] = [
  ROCKET_LAUNCHER_10,
  ROCKET_LAUNCHER_15,
  ROCKET_LAUNCHER_20,
  MRM_10_OS,
  MRM_20_OS,
  MRM_30_OS,
  SRM_2_OS,
  SRM_4_OS,
  SRM_6_OS,
  THUNDERBOLT_5_OS
];
