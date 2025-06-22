import { Equipment } from './types';

export const NAVAL_LASER_35: Equipment = {
  id: 'naval_laser_35',
  name: 'Naval Laser 35',
  category: 'Capital Weapons',
  baseType: 'Naval Laser 35',
  description: 'Naval Laser 35 - Light capital-class laser weapon',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 600,
      crits: 60,
      damage: 35,
      heat: 35,
      minRange: 0,
      rangeShort: 11,
      rangeMedium: 22,
      rangeLong: 33,
      cost: 6000000,
      battleValue: 900
    }
  }
};

export const NAVAL_LASER_45: Equipment = {
  id: 'naval_laser_45',
  name: 'Naval Laser 45',
  category: 'Capital Weapons',
  baseType: 'Naval Laser 45',
  description: 'Naval Laser 45 - Medium capital-class laser weapon',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 800,
      crits: 80,
      damage: 45,
      heat: 45,
      minRange: 0,
      rangeShort: 13,
      rangeMedium: 26,
      rangeLong: 39,
      cost: 8000000,
      battleValue: 1150
    }
  }
};

export const NAVAL_LASER_55: Equipment = {
  id: 'naval_laser_55',
  name: 'Naval Laser 55',
  category: 'Capital Weapons',
  baseType: 'Naval Laser 55',
  description: 'Naval Laser 55 - Heavy capital-class laser weapon',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 1000,
      crits: 100,
      damage: 55,
      heat: 55,
      minRange: 0,
      rangeShort: 15,
      rangeMedium: 30,
      rangeLong: 45,
      cost: 10000000,
      battleValue: 1400
    }
  }
};

export const NAVAL_PPC: Equipment = {
  id: 'naval_ppc',
  name: 'Naval PPC',
  category: 'Capital Weapons',
  baseType: 'Naval PPC',
  description: 'Naval Particle Projector Cannon - Capital-class energy weapon',
  requiresAmmo: false,
  introductionYear: 2400,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 1200,
      crits: 120,
      damage: 50,
      heat: 50,
      minRange: 10,
      rangeShort: 17,
      rangeMedium: 34,
      rangeLong: 51,
      cost: 12000000,
      battleValue: 1250
    }
  }
};

export const LIGHT_NAVAL_GAUSS: Equipment = {
  id: 'light_naval_gauss',
  name: 'Light Naval Gauss',
  category: 'Capital Weapons',
  baseType: 'Light Naval Gauss',
  description: 'Light Naval Gauss Rifle - Light capital-class gauss weapon',
  requiresAmmo: true,
  introductionYear: 2440,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 600,
      crits: 60,
      damage: 45,
      heat: 15,
      minRange: 0,
      rangeShort: 17,
      rangeMedium: 34,
      rangeLong: 51,
      cost: 8000000,
      battleValue: 1100
    }
  }
};

export const MEDIUM_NAVAL_GAUSS: Equipment = {
  id: 'medium_naval_gauss',
  name: 'Medium Naval Gauss',
  category: 'Capital Weapons',
  baseType: 'Medium Naval Gauss',
  description: 'Medium Naval Gauss Rifle - Medium capital-class gauss weapon',
  requiresAmmo: true,
  introductionYear: 2440,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 900,
      crits: 90,
      damage: 60,
      heat: 20,
      minRange: 0,
      rangeShort: 20,
      rangeMedium: 40,
      rangeLong: 60,
      cost: 12000000,
      battleValue: 1450
    }
  }
};

export const HEAVY_NAVAL_GAUSS: Equipment = {
  id: 'heavy_naval_gauss',
  name: 'Heavy Naval Gauss',
  category: 'Capital Weapons',
  baseType: 'Heavy Naval Gauss',
  description: 'Heavy Naval Gauss Rifle - Heavy capital-class gauss weapon',
  requiresAmmo: true,
  introductionYear: 2440,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 1200,
      crits: 120,
      damage: 75,
      heat: 25,
      minRange: 0,
      rangeShort: 23,
      rangeMedium: 46,
      rangeLong: 69,
      cost: 15000000,
      battleValue: 1800
    }
  }
};

export const LIGHT_N_GAUSS: Equipment = {
  id: 'light_n_gauss',
  name: 'Light N-Gauss',
  category: 'Capital Weapons',
  baseType: 'Light N-Gauss',
  description: 'Light N-Gauss - Light nuclear-enhanced gauss rifle',
  requiresAmmo: true,
  introductionYear: 2440,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 700,
      crits: 70,
      damage: 50,
      heat: 18,
      minRange: 0,
      rangeShort: 17,
      rangeMedium: 34,
      rangeLong: 51,
      cost: 10000000,
      battleValue: 1300
    }
  }
};

export const MEDIUM_N_GAUSS: Equipment = {
  id: 'medium_n_gauss',
  name: 'Medium N-Gauss',
  category: 'Capital Weapons',
  baseType: 'Medium N-Gauss',
  description: 'Medium N-Gauss - Medium nuclear-enhanced gauss rifle',
  requiresAmmo: true,
  introductionYear: 2440,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 1000,
      crits: 100,
      damage: 65,
      heat: 22,
      minRange: 0,
      rangeShort: 20,
      rangeMedium: 40,
      rangeLong: 60,
      cost: 14000000,
      battleValue: 1650
    }
  }
};

export const HEAVY_N_GAUSS: Equipment = {
  id: 'heavy_n_gauss',
  name: 'Heavy N-Gauss',
  category: 'Capital Weapons',
  baseType: 'Heavy N-Gauss',
  description: 'Heavy N-Gauss - Heavy nuclear-enhanced gauss rifle',
  requiresAmmo: true,
  introductionYear: 2440,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 1300,
      crits: 130,
      damage: 80,
      heat: 27,
      minRange: 0,
      rangeShort: 23,
      rangeMedium: 46,
      rangeLong: 69,
      cost: 18000000,
      battleValue: 2000
    }
  }
};

export const LIGHT_MASS_DRIVER: Equipment = {
  id: 'light_mass_driver',
  name: 'Light Mass Driver',
  category: 'Capital Weapons',
  baseType: 'Light Mass Driver',
  description: 'Light Mass Driver - Light magnetic acceleration weapon',
  requiresAmmo: true,
  introductionYear: 2600,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 1000,
      crits: 100,
      damage: 60,
      heat: 30,
      minRange: 12,
      rangeShort: 24,
      rangeMedium: 48,
      rangeLong: 72,
      cost: 15000000,
      battleValue: 1500
    }
  }
};

export const MEDIUM_MASS_DRIVER: Equipment = {
  id: 'medium_mass_driver',
  name: 'Medium Mass Driver',
  category: 'Capital Weapons',
  baseType: 'Medium Mass Driver',
  description: 'Medium Mass Driver - Medium magnetic acceleration weapon',
  requiresAmmo: true,
  introductionYear: 2600,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 1500,
      crits: 150,
      damage: 90,
      heat: 45,
      minRange: 12,
      rangeShort: 30,
      rangeMedium: 60,
      rangeLong: 90,
      cost: 22000000,
      battleValue: 2250
    }
  }
};

export const HEAVY_MASS_DRIVER: Equipment = {
  id: 'heavy_mass_driver',
  name: 'Heavy Mass Driver',
  category: 'Capital Weapons',
  baseType: 'Heavy Mass Driver',
  description: 'Heavy Mass Driver - Heavy magnetic acceleration weapon',
  requiresAmmo: true,
  introductionYear: 2600,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 2000,
      crits: 200,
      damage: 120,
      heat: 60,
      minRange: 12,
      rangeShort: 36,
      rangeMedium: 72,
      rangeLong: 108,
      cost: 30000000,
      battleValue: 3000
    }
  }
};

export const LIGHT_SUB_CAPITAL_CANNON: Equipment = {
  id: 'light_sub_capital_cannon',
  name: 'Light Sub-Capital Cannon',
  category: 'Capital Weapons',
  baseType: 'Light Sub-Capital Cannon',
  description: 'Light Sub-Capital Cannon - Light ballistic capital weapon',
  requiresAmmo: true,
  introductionYear: 2350,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 300,
      crits: 30,
      damage: 20,
      heat: 8,
      minRange: 0,
      rangeShort: 11,
      rangeMedium: 22,
      rangeLong: 33,
      cost: 3000000,
      battleValue: 400
    }
  }
};

export const MEDIUM_SUB_CAPITAL_CANNON: Equipment = {
  id: 'medium_sub_capital_cannon',
  name: 'Medium Sub-Capital Cannon',
  category: 'Capital Weapons',
  baseType: 'Medium Sub-Capital Cannon',
  description: 'Medium Sub-Capital Cannon - Medium ballistic capital weapon',
  requiresAmmo: true,
  introductionYear: 2350,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 450,
      crits: 45,
      damage: 25,
      heat: 10,
      minRange: 0,
      rangeShort: 12,
      rangeMedium: 24,
      rangeLong: 36,
      cost: 4500000,
      battleValue: 500
    }
  }
};

export const HEAVY_SUB_CAPITAL_CANNON: Equipment = {
  id: 'heavy_sub_capital_cannon',
  name: 'Heavy Sub-Capital Cannon',
  category: 'Capital Weapons',
  baseType: 'Heavy Sub-Capital Cannon',
  description: 'Heavy Sub-Capital Cannon - Heavy ballistic capital weapon',
  requiresAmmo: true,
  introductionYear: 2350,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 600,
      crits: 60,
      damage: 30,
      heat: 12,
      minRange: 0,
      rangeShort: 13,
      rangeMedium: 26,
      rangeLong: 39,
      cost: 6000000,
      battleValue: 600
    }
  }
};

export const LIGHT_SUB_CAPITAL_LASER: Equipment = {
  id: 'light_sub_capital_laser',
  name: 'Light Sub-Capital Laser',
  category: 'Capital Weapons',
  baseType: 'Light Sub-Capital Laser',
  description: 'Light Sub-Capital Laser - Light energy capital weapon',
  requiresAmmo: false,
  introductionYear: 2350,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 200,
      crits: 20,
      damage: 15,
      heat: 15,
      minRange: 0,
      rangeShort: 11,
      rangeMedium: 22,
      rangeLong: 33,
      cost: 2000000,
      battleValue: 300
    }
  }
};

export const MEDIUM_SUB_CAPITAL_LASER: Equipment = {
  id: 'medium_sub_capital_laser',
  name: 'Medium Sub-Capital Laser',
  category: 'Capital Weapons',
  baseType: 'Medium Sub-Capital Laser',
  description: 'Medium Sub-Capital Laser - Medium energy capital weapon',
  requiresAmmo: false,
  introductionYear: 2350,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 300,
      crits: 30,
      damage: 20,
      heat: 20,
      minRange: 0,
      rangeShort: 12,
      rangeMedium: 24,
      rangeLong: 36,
      cost: 3000000,
      battleValue: 400
    }
  }
};

export const HEAVY_SUB_CAPITAL_LASER: Equipment = {
  id: 'heavy_sub_capital_laser',
  name: 'Heavy Sub-Capital Laser',
  category: 'Capital Weapons',
  baseType: 'Heavy Sub-Capital Laser',
  description: 'Heavy Sub-Capital Laser - Heavy energy capital weapon',
  requiresAmmo: false,
  introductionYear: 2350,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 400,
      crits: 40,
      damage: 25,
      heat: 25,
      minRange: 0,
      rangeShort: 13,
      rangeMedium: 26,
      rangeLong: 39,
      cost: 4000000,
      battleValue: 500
    }
  }
};

// Capital Missiles
export const KILLER_WHALE: Equipment = {
  id: 'killer_whale',
  name: 'Killer Whale',
  category: 'Capital Weapons',
  baseType: 'Killer Whale',
  description: 'Killer Whale - Anti-ship capital missile',
  requiresAmmo: true,
  introductionYear: 2400,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 150,
      crits: 15,
      damage: 40,
      heat: 0,
      minRange: 12,
      rangeShort: 24,
      rangeMedium: 48,
      rangeLong: 72,
      cost: 8000000,
      battleValue: 800
    }
  }
};

export const KILLER_WHALE_T: Equipment = {
  id: 'killer_whale_t',
  name: 'Killer Whale-T',
  category: 'Capital Weapons',
  baseType: 'Killer Whale-T',
  description: 'Killer Whale-T - Nuclear anti-ship capital missile',
  requiresAmmo: true,
  introductionYear: 2400,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 150,
      crits: 15,
      damage: 50,
      heat: 0,
      minRange: 12,
      rangeShort: 24,
      rangeMedium: 48,
      rangeLong: 72,
      cost: 10000000,
      battleValue: 1000
    }
  }
};

export const WHITE_SHARK: Equipment = {
  id: 'white_shark',
  name: 'White Shark',
  category: 'Capital Weapons',
  baseType: 'White Shark',
  description: 'White Shark - Medium capital missile',
  requiresAmmo: true,
  introductionYear: 2400,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 100,
      crits: 10,
      damage: 30,
      heat: 0,
      minRange: 10,
      rangeShort: 20,
      rangeMedium: 40,
      rangeLong: 60,
      cost: 6000000,
      battleValue: 600
    }
  }
};

export const WHITE_SHARK_T: Equipment = {
  id: 'white_shark_t',
  name: 'White Shark-T',
  category: 'Capital Weapons',
  baseType: 'White Shark-T',
  description: 'White Shark-T - Nuclear medium capital missile',
  requiresAmmo: true,
  introductionYear: 2400,
  rulesLevel: 'Standard',
  techRating: 'D',
  variants: {
    IS: {
      weight: 100,
      crits: 10,
      damage: 40,
      heat: 0,
      minRange: 10,
      rangeShort: 20,
      rangeMedium: 40,
      rangeLong: 60,
      cost: 8000000,
      battleValue: 800
    }
  }
};

export const CAPITAL_WEAPONS: Equipment[] = [
  NAVAL_LASER_35,
  NAVAL_LASER_45,
  NAVAL_LASER_55,
  NAVAL_PPC,
  LIGHT_NAVAL_GAUSS,
  MEDIUM_NAVAL_GAUSS,
  HEAVY_NAVAL_GAUSS,
  LIGHT_N_GAUSS,
  MEDIUM_N_GAUSS,
  HEAVY_N_GAUSS,
  LIGHT_MASS_DRIVER,
  MEDIUM_MASS_DRIVER,
  HEAVY_MASS_DRIVER,
  LIGHT_SUB_CAPITAL_CANNON,
  MEDIUM_SUB_CAPITAL_CANNON,
  HEAVY_SUB_CAPITAL_CANNON,
  LIGHT_SUB_CAPITAL_LASER,
  MEDIUM_SUB_CAPITAL_LASER,
  HEAVY_SUB_CAPITAL_LASER,
  KILLER_WHALE,
  KILLER_WHALE_T,
  WHITE_SHARK,
  WHITE_SHARK_T
];
