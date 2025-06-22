import { Equipment } from './types';

// LRM Torpedo 5
export const LRM_TORPEDO_5: Equipment = {
  id: 'lrm_torpedo_5',
  name: 'LRM Torpedo 5',
  category: 'Torpedoes',
  baseType: 'LRM Torpedo 5',
  description: 'Long-range torpedo launcher for underwater combat',
  requiresAmmo: true,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 2,
      crits: 1,
      damage: 1, // Per torpedo
      heat: 2,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 30000,
      battleValue: 45
    },
    Clan: {
      weight: 1,
      crits: 1,
      damage: 1, // Per torpedo
      heat: 2,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 30000,
      battleValue: 45
    }
  },
  special: ['Torpedo', 'Underwater Only', 'Minimum Range']
};

// LRM Torpedo 10
export const LRM_TORPEDO_10: Equipment = {
  id: 'lrm_torpedo_10',
  name: 'LRM Torpedo 10',
  category: 'Torpedoes',
  baseType: 'LRM Torpedo 10',
  description: 'Long-range torpedo launcher for underwater combat',
  requiresAmmo: true,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 1, // Per torpedo
      heat: 4,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 100000,
      battleValue: 90
    },
    Clan: {
      weight: 2.5,
      crits: 1,
      damage: 1, // Per torpedo
      heat: 4,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 100000,
      battleValue: 90
    }
  },
  special: ['Torpedo', 'Underwater Only', 'Minimum Range']
};

// LRM Torpedo 15
export const LRM_TORPEDO_15: Equipment = {
  id: 'lrm_torpedo_15',
  name: 'LRM Torpedo 15',
  category: 'Torpedoes',
  baseType: 'LRM Torpedo 15',
  description: 'Long-range torpedo launcher for underwater combat',
  requiresAmmo: true,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 1, // Per torpedo
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 175000,
      battleValue: 136
    },
    Clan: {
      weight: 3.5,
      crits: 2,
      damage: 1, // Per torpedo
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 175000,
      battleValue: 136
    }
  },
  special: ['Torpedo', 'Underwater Only', 'Minimum Range']
};

// LRM Torpedo 20
export const LRM_TORPEDO_20: Equipment = {
  id: 'lrm_torpedo_20',
  name: 'LRM Torpedo 20',
  category: 'Torpedoes',
  baseType: 'LRM Torpedo 20',
  description: 'Long-range torpedo launcher for underwater combat',
  requiresAmmo: true,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 10,
      crits: 5,
      damage: 1, // Per torpedo
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 250000,
      battleValue: 181
    },
    Clan: {
      weight: 5,
      crits: 2,
      damage: 1, // Per torpedo
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 250000,
      battleValue: 181
    }
  },
  special: ['Torpedo', 'Underwater Only', 'Minimum Range']
};

// SRM Torpedo 2
export const SRM_TORPEDO_2: Equipment = {
  id: 'srm_torpedo_2',
  name: 'SRM Torpedo 2',
  category: 'Torpedoes',
  baseType: 'SRM Torpedo 2',
  description: 'Short-range torpedo launcher for underwater combat',
  requiresAmmo: true,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 2, // Per torpedo
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
      damage: 2, // Per torpedo
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
  special: ['Torpedo', 'Underwater Only']
};

// SRM Torpedo 4
export const SRM_TORPEDO_4: Equipment = {
  id: 'srm_torpedo_4',
  name: 'SRM Torpedo 4',
  category: 'Torpedoes',
  baseType: 'SRM Torpedo 4',
  description: 'Short-range torpedo launcher for underwater combat',
  requiresAmmo: true,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 2,
      crits: 1,
      damage: 2, // Per torpedo
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
      damage: 2, // Per torpedo
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
  special: ['Torpedo', 'Underwater Only']
};

// SRM Torpedo 6
export const SRM_TORPEDO_6: Equipment = {
  id: 'srm_torpedo_6',
  name: 'SRM Torpedo 6',
  category: 'Torpedoes',
  baseType: 'SRM Torpedo 6',
  description: 'Short-range torpedo launcher for underwater combat',
  requiresAmmo: true,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 3,
      crits: 2,
      damage: 2, // Per torpedo
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
      damage: 2, // Per torpedo
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
  special: ['Torpedo', 'Underwater Only']
};

// Piranha
export const PIRANHA: Equipment = {
  id: 'piranha',
  name: 'Piranha',
  category: 'Torpedoes',
  baseType: 'Piranha',
  description: 'Advanced homing torpedo system',
  requiresAmmo: true,
  introductionYear: 3064,
  rulesLevel: 'Advanced',
  variants: {
    IS: {
      weight: 3,
      crits: 5,
      damage: 3,
      heat: 4,
      minRange: 6,
      rangeShort: 12,
      rangeMedium: 20,
      rangeLong: 30,
      rangeExtreme: 40,
      cost: 150000,
      battleValue: 90
    }
  },
  special: ['Torpedo', 'Underwater Only', 'Homing', 'Minimum Range']
};

// Swordfish
export const SWORDFISH: Equipment = {
  id: 'swordfish',
  name: 'Swordfish',
  category: 'Torpedoes',
  baseType: 'Swordfish',
  description: 'Heavy anti-submarine torpedo system',
  requiresAmmo: true,
  introductionYear: 3064,
  rulesLevel: 'Advanced',
  variants: {
    IS: {
      weight: 7,
      crits: 7,
      damage: 6,
      heat: 8,
      minRange: 6,
      rangeShort: 15,
      rangeMedium: 25,
      rangeLong: 35,
      rangeExtreme: 45,
      cost: 300000,
      battleValue: 150
    }
  },
  special: ['Torpedo', 'Underwater Only', 'Heavy Torpedo', 'Minimum Range']
};

// White Shark
export const WHITE_SHARK: Equipment = {
  id: 'white_shark',
  name: 'White Shark',
  category: 'Torpedoes',
  baseType: 'White Shark',
  description: 'Capital-scale torpedo for large naval vessels',
  requiresAmmo: true,
  introductionYear: 2370,
  rulesLevel: 'Advanced',
  variants: {
    IS: {
      weight: 15,
      crits: 15,
      damage: 15,
      heat: 12,
      minRange: 12,
      rangeShort: 24,
      rangeMedium: 40,
      rangeLong: 60,
      rangeExtreme: 80,
      cost: 500000,
      battleValue: 300
    }
  },
  special: ['Capital Torpedo', 'Underwater Only', 'Capital Weapon', 'Minimum Range']
};

export const TORPEDOES: Equipment[] = [
  LRM_TORPEDO_5,
  LRM_TORPEDO_10,
  LRM_TORPEDO_15,
  LRM_TORPEDO_20,
  SRM_TORPEDO_2,
  SRM_TORPEDO_4,
  SRM_TORPEDO_6,
  PIRANHA,
  SWORDFISH,
  WHITE_SHARK
];
