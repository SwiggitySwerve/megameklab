import { Equipment } from './types';

export const ARROW_IV_ARTILLERY: Equipment = {
  id: 'arrow_iv_artillery',
  name: 'Arrow IV Artillery',
  category: 'Artillery Weapons',
  baseType: 'Arrow IV Artillery',
  description: 'Arrow IV Artillery System - Long-range indirect fire support weapon',
  requiresAmmo: true,
  introductionYear: 2593,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 15,
      crits: 15,
      damage: 20,
      heat: 10,
      minRange: 8,
      rangeShort: 8,
      rangeMedium: 16,
      rangeLong: 24,
      rangeExtreme: 32,
      cost: 450000,
      battleValue: 240
    },
    Clan: {
      weight: 12,
      crits: 12,
      damage: 20,
      heat: 10,
      minRange: 8,
      rangeShort: 8,
      rangeMedium: 16,
      rangeLong: 24,
      rangeExtreme: 32,
      cost: 450000,
      battleValue: 240
    }
  }
};

export const LONG_TOM_ARTILLERY: Equipment = {
  id: 'long_tom_artillery',
  name: 'Long Tom Artillery',
  category: 'Artillery Weapons',
  baseType: 'Long Tom Artillery',
  description: 'Long Tom Artillery Piece - Heavy long-range bombardment weapon',
  requiresAmmo: true,
  introductionYear: 2453,
  rulesLevel: 'Standard',
  techRating: 'B',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 30,
      crits: 30,
      damage: 25,
      heat: 20,
      minRange: 30,
      rangeShort: 30,
      rangeMedium: 60,
      rangeLong: 90,
      rangeExtreme: 120,
      cost: 750000,
      battleValue: 368
    }
  }
};

export const LONG_TOM_CANNON: Equipment = {
  id: 'long_tom_cannon',
  name: 'Long Tom Cannon',
  category: 'Artillery Weapons',
  baseType: 'Long Tom Cannon',
  description: 'Long Tom Cannon - Vehicle-mounted artillery variant',
  requiresAmmo: true,
  introductionYear: 2465,
  rulesLevel: 'Standard',
  techRating: 'B',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 30,
      crits: 15,
      damage: 25,
      heat: 20,
      minRange: 30,
      rangeShort: 30,
      rangeMedium: 60,
      rangeLong: 90,
      rangeExtreme: 120,
      cost: 750000,
      battleValue: 295
    }
  }
};

export const SNIPER_ARTILLERY: Equipment = {
  id: 'sniper_artillery',
  name: 'Sniper Artillery',
  category: 'Artillery Weapons',
  baseType: 'Sniper Artillery',
  description: 'Sniper Artillery Piece - Medium-range precision artillery',
  requiresAmmo: true,
  introductionYear: 2455,
  rulesLevel: 'Standard',
  techRating: 'B',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 20,
      crits: 20,
      damage: 20,
      heat: 10,
      minRange: 12,
      rangeShort: 12,
      rangeMedium: 24,
      rangeLong: 36,
      rangeExtreme: 48,
      cost: 300000,
      battleValue: 163
    }
  }
};

export const SNIPER_ARTILLERY_CANNON: Equipment = {
  id: 'sniper_artillery_cannon',
  name: 'Sniper Artillery Cannon',
  category: 'Artillery Weapons',
  baseType: 'Sniper Artillery Cannon',
  description: 'Sniper Artillery Cannon - Vehicle-mounted precision artillery',
  requiresAmmo: true,
  introductionYear: 2467,
  rulesLevel: 'Standard',
  techRating: 'B',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 20,
      crits: 10,
      damage: 20,
      heat: 10,
      minRange: 12,
      rangeShort: 12,
      rangeMedium: 24,
      rangeLong: 36,
      rangeExtreme: 48,
      cost: 300000,
      battleValue: 130
    }
  }
};

export const THUMPER_ARTILLERY: Equipment = {
  id: 'thumper_artillery',
  name: 'Thumper Artillery',
  category: 'Artillery Weapons',
  baseType: 'Thumper Artillery',
  description: 'Thumper Artillery Piece - Light artillery support weapon',
  requiresAmmo: true,
  introductionYear: 2439,
  rulesLevel: 'Standard',
  techRating: 'B',
  variants: {
    IS: {
      weight: 15,
      crits: 15,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      rangeExtreme: 24,
      cost: 187500,
      battleValue: 66
    }
  }
};

export const THUMPER_ARTILLERY_CANNON: Equipment = {
  id: 'thumper_artillery_cannon',
  name: 'Thumper Artillery Cannon',
  category: 'Artillery Weapons',
  baseType: 'Thumper Artillery Cannon',
  description: 'Thumper Artillery Cannon - Vehicle-mounted light artillery',
  requiresAmmo: true,
  introductionYear: 2449,
  rulesLevel: 'Standard',
  techRating: 'B',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 15,
      crits: 7,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      rangeExtreme: 24,
      cost: 187500,
      battleValue: 53
    }
  }
};

export const ARTILLERY_CANNON: Equipment = {
  id: 'artillery_cannon',
  name: 'Artillery Cannon',
  category: 'Artillery Weapons',
  baseType: 'Artillery Cannon',
  description: 'Generic Artillery Cannon - Standard artillery piece',
  requiresAmmo: true,
  introductionYear: 2400,
  rulesLevel: 'Standard',
  techRating: 'B',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 20,
      crits: 10,
      damage: 20,
      heat: 8,
      minRange: 10,
      rangeShort: 10,
      rangeMedium: 20,
      rangeLong: 30,
      rangeExtreme: 40,
      cost: 250000,
      battleValue: 140
    }
  }
};

export const BA_TUBE_ARTILLERY: Equipment = {
  id: 'ba_tube_artillery',
  name: 'BA Tube Artillery',
  category: 'Artillery Weapons',
  baseType: 'BA Tube Artillery',
  description: 'Battle Armor Tube Artillery - Portable artillery system',
  requiresAmmo: true,
  introductionYear: 3055,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 8,
      crits: 8,
      damage: 10,
      heat: 3,
      minRange: 4,
      rangeShort: 4,
      rangeMedium: 8,
      rangeLong: 12,
      rangeExtreme: 16,
      cost: 125000,
      battleValue: 45
    },
    Clan: {
      weight: 6,
      crits: 6,
      damage: 10,
      heat: 3,
      minRange: 4,
      rangeShort: 4,
      rangeMedium: 8,
      rangeLong: 12,
      rangeExtreme: 16,
      cost: 125000,
      battleValue: 45
    }
  }
};

export const MECH_MORTAR_1: Equipment = {
  id: 'mech_mortar_1',
  name: 'Mech Mortar/1',
  category: 'Artillery Weapons',
  baseType: 'Mech Mortar/1',
  description: 'Mech Mortar/1 - Light mortar system',
  requiresAmmo: true,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 2,
      crits: 2,
      damage: 1,
      heat: 1,
      minRange: 6,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      rangeExtreme: 24,
      cost: 30000,
      battleValue: 10
    }
  }
};

export const MECH_MORTAR_2: Equipment = {
  id: 'mech_mortar_2',
  name: 'Mech Mortar/2',
  category: 'Artillery Weapons',
  baseType: 'Mech Mortar/2',
  description: 'Mech Mortar/2 - Medium mortar system',
  requiresAmmo: true,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 3,
      crits: 3,
      damage: 2,
      heat: 1,
      minRange: 6,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      rangeExtreme: 24,
      cost: 40000,
      battleValue: 15
    }
  }
};

export const MECH_MORTAR_4: Equipment = {
  id: 'mech_mortar_4',
  name: 'Mech Mortar/4',
  category: 'Artillery Weapons',
  baseType: 'Mech Mortar/4',
  description: 'Mech Mortar/4 - Heavy mortar system',
  requiresAmmo: true,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 5,
      crits: 3,
      damage: 4,
      heat: 1,
      minRange: 6,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      rangeExtreme: 24,
      cost: 70000,
      battleValue: 22
    }
  }
};

export const MECH_MORTAR_8: Equipment = {
  id: 'mech_mortar_8',
  name: 'Mech Mortar/8',
  category: 'Artillery Weapons',
  baseType: 'Mech Mortar/8',
  description: 'Mech Mortar/8 - Very heavy mortar system',
  requiresAmmo: true,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '230',
  variants: {
    IS: {
      weight: 8,
      crits: 5,
      damage: 8,
      heat: 1,
      minRange: 6,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      rangeExtreme: 24,
      cost: 110000,
      battleValue: 30
    }
  }
};

export const ARTILLERY_WEAPONS: Equipment[] = [
  ARROW_IV_ARTILLERY,
  LONG_TOM_ARTILLERY,
  LONG_TOM_CANNON,
  SNIPER_ARTILLERY,
  SNIPER_ARTILLERY_CANNON,
  THUMPER_ARTILLERY,
  THUMPER_ARTILLERY_CANNON,
  ARTILLERY_CANNON,
  BA_TUBE_ARTILLERY,
  MECH_MORTAR_1,
  MECH_MORTAR_2,
  MECH_MORTAR_4,
  MECH_MORTAR_8
];
