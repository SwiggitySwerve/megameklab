import { Equipment } from './types';

export const CLAN_ERPPC: Equipment = {
  id: 'clan_erppc',
  name: 'ER PPC',
  category: 'Energy Weapons',
  baseType: 'Clan ER PPC',
  description: 'Clan Extended Range Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 2830,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 6,
      crits: 2,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const ER_LARGE_LASER: Equipment = {
  id: 'er_large_laser',
  name: 'ER Large Laser',
  category: 'Energy Weapons',
  baseType: 'ER Large Laser',
  description: 'Extended Range Large Laser',
  requiresAmmo: false,
  introductionYear: 2620,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 4,
      crits: 1,
      damage: 8,
      heat: 12,
      minRange: 0,
      cost: 0,
      battleValue: 0
    },
    IS: {
      weight: 5,
      crits: 2,
      damage: 8,
      heat: 12,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const ER_LARGE_PULSE_LASER: Equipment = {
  id: 'er_large_pulse_laser',
  name: 'ER Large Pulse Laser',
  category: 'Energy Weapons',
  baseType: 'ER Large Pulse Laser',
  description: 'Extended Range Large Pulse Laser',
  requiresAmmo: false,
  introductionYear: 3068,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 2,
      damage: 9,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const ER_MEDIUM_LASER: Equipment = {
  id: 'er_medium_laser',
  name: 'ER Medium Laser',
  category: 'Energy Weapons',
  baseType: 'ER Medium Laser',
  description: 'Extended Range Medium Laser',
  requiresAmmo: false,
  introductionYear: 2824,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 5,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const ER_MEDIUM_PULSE_LASER: Equipment = {
  id: 'er_medium_pulse_laser',
  name: 'ER Medium Pulse Laser',
  category: 'Energy Weapons',
  baseType: 'ER Medium Pulse Laser',
  description: 'Extended Range Medium Pulse Laser',
  requiresAmmo: false,
  introductionYear: 3063,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 2,
      crits: 1,
      damage: 6,
      heat: 4,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const IS_ER_PPC: Equipment = {
  id: 'is_er_ppc',
  name: 'ER PPC',
  category: 'Energy Weapons',
  baseType: 'IS ER PPC',
  description: 'Inner Sphere Extended Range PPC',
  requiresAmmo: false,
  introductionYear: 2760,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 15,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const ER_SMALL_LASER: Equipment = {
  id: 'er_small_laser',
  name: 'ER Small Laser',
  category: 'Energy Weapons',
  baseType: 'ER Small Laser',
  description: 'Extended Range Small Laser',
  requiresAmmo: false,
  introductionYear: 2825,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 2,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const ER_SMALL_PULSE_LASER: Equipment = {
  id: 'er_small_pulse_laser',
  name: 'ER Small Pulse Laser',
  category: 'Energy Weapons',
  baseType: 'ER Small Pulse Laser',
  description: 'Extended Range Small Pulse Laser',
  requiresAmmo: false,
  introductionYear: 3068,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 3,
      heat: 2,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const ENHANCED_PPC: Equipment = {
  id: 'enhanced_ppc',
  name: 'Enhanced PPC',
  category: 'Energy Weapons',
  baseType: 'Enhanced PPC',
  description: 'Enhanced Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 2823,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const HEAVY_LARGE_LASER: Equipment = {
  id: 'heavy_large_laser',
  name: 'Heavy Large Laser',
  category: 'Energy Weapons',
  baseType: 'Heavy Large Laser',
  description: 'Heavy Large Laser',
  requiresAmmo: false,
  introductionYear: 3059,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 8,
      heat: 8,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const HEAVY_MEDIUM_LASER: Equipment = {
  id: 'heavy_medium_laser',
  name: 'Heavy Medium Laser',
  category: 'Energy Weapons',
  baseType: 'Heavy Medium Laser',
  description: 'Heavy Medium Laser',
  requiresAmmo: false,
  introductionYear: 3059,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const HEAVY_PPC: Equipment = {
  id: 'heavy_ppc',
  name: 'Heavy PPC',
  category: 'Energy Weapons',
  baseType: 'Heavy PPC',
  description: 'Heavy Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 3067,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 6,
      crits: 2,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    },
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const HEAVY_SMALL_LASER: Equipment = {
  id: 'heavy_small_laser',
  name: 'Heavy Small Laser',
  category: 'Energy Weapons',
  baseType: 'Heavy Small Laser',
  description: 'Heavy Small Laser',
  requiresAmmo: false,
  introductionYear: 3059,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 1,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const LIGHT_PPC: Equipment = {
  id: 'light_ppc',
  name: 'Light PPC',
  category: 'Energy Weapons',
  baseType: 'Light PPC',
  description: 'Light Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 3060,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 6,
      crits: 2,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    },
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const PPC: Equipment = {
  id: 'ppc',
  name: 'PPC',
  category: 'Energy Weapons',
  baseType: 'PPC',
  description: 'Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 2594,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const SNUB_NOSE_PPC: Equipment = {
  id: 'snub_nose_ppc',
  name: 'Snub-Nose PPC',
  category: 'Energy Weapons',
  baseType: 'Snub-Nose PPC',
  description: 'Snub-Nose Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 2695,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const LARGE_PULSE_LASER: Equipment = {
  id: 'large_pulse_laser',
  name: 'Large Pulse Laser',
  category: 'Energy Weapons',
  baseType: 'Large Pulse Laser',
  description: 'Large Pulse Laser',
  requiresAmmo: false,
  introductionYear: 2660,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 2,
      damage: 9,
      heat: 10,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const MEDIUM_LASER: Equipment = {
  id: 'medium_laser',
  name: 'Medium Laser',
  category: 'Energy Weapons',
  baseType: 'Medium Laser',
  description: 'Medium Laser',
  requiresAmmo: false,
  introductionYear: 2442,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 0,
      cost: 0,
      battleValue: 0
    },
    IS: {
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const MEDIUM_PULSE_LASER: Equipment = {
  id: 'medium_pulse_laser',
  name: 'Medium Pulse Laser',
  category: 'Energy Weapons',
  baseType: 'Medium Pulse Laser',
  description: 'Medium Pulse Laser',
  requiresAmmo: false,
  introductionYear: 2609,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 2,
      crits: 1,
      damage: 6,
      heat: 4,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const SMALL_LASER: Equipment = {
  id: 'small_laser',
  name: 'Small Laser',
  category: 'Energy Weapons',
  baseType: 'Small Laser',
  description: 'Small Laser',
  requiresAmmo: false,
  introductionYear: 2445,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 1,
      minRange: 0,
      cost: 0,
      battleValue: 0
    },
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 1,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const SMALL_PULSE_LASER: Equipment = {
  id: 'small_pulse_laser',
  name: 'Small Pulse Laser',
  category: 'Energy Weapons',
  baseType: 'Small Pulse Laser',
  description: 'Small Pulse Laser',
  requiresAmmo: false,
  introductionYear: 2610,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      damage: 3,
      heat: 2,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

export const LARGE_LASER: Equipment = {
  id: 'large_laser',
  name: 'Large Laser',
  category: 'Energy Weapons',
  baseType: 'Large Laser',
  description: 'Large Laser',
  requiresAmmo: false,
  introductionYear: 2316,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 5,
      crits: 1,
      damage: 8,
      heat: 8,
      minRange: 0,
      cost: 0,
      battleValue: 0
    },
    IS: {
      weight: 5,
      crits: 2,
      damage: 8,
      heat: 8,
      minRange: 0,
      cost: 0,
      battleValue: 0
    }
  }
};

// Defensive Systems
export const LASER_AMS: Equipment = {
  id: 'laser_ams',
  name: 'Laser AMS',
  category: 'Energy Weapons',
  baseType: 'Laser Anti-Missile System',
  description: 'Laser Anti-Missile System for intercepting incoming missiles',
  requiresAmmo: false,
  introductionYear: 3059,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1.5,
      crits: 2,
      damage: 2,
      heat: 7,
      minRange: 0,
      cost: 225000,
      battleValue: 45
    },
    Clan: {
      weight: 1,
      crits: 1,
      damage: 2,
      heat: 5,
      minRange: 0,
      cost: 225000,
      battleValue: 45
    }
  }
};

export const ENERGY_WEAPONS: Equipment[] = [
  CLAN_ERPPC,
  ER_LARGE_LASER,
  ER_LARGE_PULSE_LASER,
  ER_MEDIUM_LASER,
  ER_MEDIUM_PULSE_LASER,
  IS_ER_PPC,
  ER_SMALL_LASER,
  ER_SMALL_PULSE_LASER,
  ENHANCED_PPC,
  HEAVY_LARGE_LASER,
  HEAVY_MEDIUM_LASER,
  HEAVY_PPC,
  HEAVY_SMALL_LASER,
  LIGHT_PPC,
  PPC,
  SNUB_NOSE_PPC,
  LARGE_PULSE_LASER,
  MEDIUM_LASER,
  MEDIUM_PULSE_LASER,
  SMALL_LASER,
  SMALL_PULSE_LASER,
  LARGE_LASER,
  LASER_AMS
];
