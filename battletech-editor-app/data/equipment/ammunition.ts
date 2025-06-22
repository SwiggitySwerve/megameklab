import { Equipment } from './types';

// Autocannon Ammunition
export const AC_2_AMMO: Equipment = {
  id: 'ac_2_ammo',
  name: 'AC/2 Ammo',
  category: 'Ammunition',
  baseType: 'AC/2 Ammo',
  description: 'Ammunition for AC/2 autocannons',
  requiresAmmo: false,
  introductionYear: 2285,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 45
    }
  }
};

export const AC_2_AMMO_HALF: Equipment = {
  id: 'ac_2_ammo_half',
  name: 'AC/2 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'AC/2 Ammo',
  description: 'Half-load ammunition for AC/2 autocannons',
  requiresAmmo: false,
  introductionYear: 2285,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 22
    }
  }
};

export const AC_5_AMMO: Equipment = {
  id: 'ac_5_ammo',
  name: 'AC/5 Ammo',
  category: 'Ammunition',
  baseType: 'AC/5 Ammo',
  description: 'Ammunition for AC/5 autocannons',
  requiresAmmo: false,
  introductionYear: 2240,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 20
    }
  }
};

export const AC_5_AMMO_HALF: Equipment = {
  id: 'ac_5_ammo_half',
  name: 'AC/5 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'AC/5 Ammo',
  description: 'Half-load ammunition for AC/5 autocannons',
  requiresAmmo: false,
  introductionYear: 2240,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 10
    }
  }
};

export const AC_10_AMMO: Equipment = {
  id: 'ac_10_ammo',
  name: 'AC/10 Ammo',
  category: 'Ammunition',
  baseType: 'AC/10 Ammo',
  description: 'Ammunition for AC/10 autocannons',
  requiresAmmo: false,
  introductionYear: 2180,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 10
    }
  }
};

export const AC_10_AMMO_HALF: Equipment = {
  id: 'ac_10_ammo_half',
  name: 'AC/10 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'AC/10 Ammo',
  description: 'Half-load ammunition for AC/10 autocannons',
  requiresAmmo: false,
  introductionYear: 2180,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 5
    }
  }
};

export const AC_20_AMMO: Equipment = {
  id: 'ac_20_ammo',
  name: 'AC/20 Ammo',
  category: 'Ammunition',
  baseType: 'AC/20 Ammo',
  description: 'Ammunition for AC/20 autocannons',
  requiresAmmo: false,
  introductionYear: 2165,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 5
    }
  }
};

export const AC_20_AMMO_HALF: Equipment = {
  id: 'ac_20_ammo_half',
  name: 'AC/20 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'AC/20 Ammo',
  description: 'Half-load ammunition for AC/20 autocannons',
  requiresAmmo: false,
  introductionYear: 2165,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 2
    }
  }
};

// Ultra AC Ammunition
export const ULTRA_AC_5_AMMO: Equipment = {
  id: 'ultra_ac_5_ammo',
  name: 'Ultra AC/5 Ammo',
  category: 'Ammunition',
  baseType: 'Ultra AC/5 Ammo',
  description: 'Ammunition for Ultra AC/5 autocannons',
  requiresAmmo: false,
  introductionYear: 2620,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 20
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 20
    }
  }
};

export const ULTRA_AC_5_AMMO_HALF: Equipment = {
  id: 'ultra_ac_5_ammo_half',
  name: 'Ultra AC/5 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'Ultra AC/5 Ammo',
  description: 'Half-load ammunition for Ultra AC/5 autocannons',
  requiresAmmo: false,
  introductionYear: 2620,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 10
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 10
    }
  }
};

export const ULTRA_AC_10_AMMO: Equipment = {
  id: 'ultra_ac_10_ammo',
  name: 'Ultra AC/10 Ammo',
  category: 'Ammunition',
  baseType: 'Ultra AC/10 Ammo',
  description: 'Ammunition for Ultra AC/10 autocannons',
  requiresAmmo: false,
  introductionYear: 2620,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 10
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 10
    }
  }
};

export const ULTRA_AC_10_AMMO_HALF: Equipment = {
  id: 'ultra_ac_10_ammo_half',
  name: 'Ultra AC/10 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'Ultra AC/10 Ammo',
  description: 'Half-load ammunition for Ultra AC/10 autocannons',
  requiresAmmo: false,
  introductionYear: 2620,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 5
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 5
    }
  }
};

export const ULTRA_AC_20_AMMO: Equipment = {
  id: 'ultra_ac_20_ammo',
  name: 'Ultra AC/20 Ammo',
  category: 'Ammunition',
  baseType: 'Ultra AC/20 Ammo',
  description: 'Ammunition for Ultra AC/20 autocannons',
  requiresAmmo: false,
  introductionYear: 2620,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 5
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 5
    }
  }
};

export const ULTRA_AC_20_AMMO_HALF: Equipment = {
  id: 'ultra_ac_20_ammo_half',
  name: 'Ultra AC/20 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'Ultra AC/20 Ammo',
  description: 'Half-load ammunition for Ultra AC/20 autocannons',
  requiresAmmo: false,
  introductionYear: 2620,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 2
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 2
    }
  }
};

// LB-X AC Ammunition
export const LB_10_X_AC_AMMO: Equipment = {
  id: 'lb_10_x_ac_ammo',
  name: 'LB 10-X AC Ammo',
  category: 'Ammunition',
  baseType: 'LB 10-X AC Ammo',
  description: 'Ammunition for LB 10-X AC autocannons',
  requiresAmmo: false,
  introductionYear: 2595,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 10
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 10
    }
  }
};

export const LB_10_X_AC_AMMO_HALF: Equipment = {
  id: 'lb_10_x_ac_ammo_half',
  name: 'LB 10-X AC Ammo (Half)',
  category: 'Ammunition',
  baseType: 'LB 10-X AC Ammo',
  description: 'Half-load ammunition for LB 10-X AC autocannons',
  requiresAmmo: false,
  introductionYear: 2595,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 5
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 5
    }
  }
};

// Gauss Rifle Ammunition
export const GAUSS_AMMO: Equipment = {
  id: 'gauss_ammo',
  name: 'Gauss Ammo',
  category: 'Ammunition',
  baseType: 'Gauss Ammo',
  description: 'Ammunition for Gauss rifles',
  requiresAmmo: false,
  introductionYear: 2587,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 8
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 8
    }
  }
};

export const GAUSS_AMMO_HALF: Equipment = {
  id: 'gauss_ammo_half',
  name: 'Gauss Ammo (Half)',
  category: 'Ammunition',
  baseType: 'Gauss Ammo',
  description: 'Half-load ammunition for Gauss rifles',
  requiresAmmo: false,
  introductionYear: 2587,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 4
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 4
    }
  }
};

// SRM Ammunition
export const SRM_AMMO: Equipment = {
  id: 'srm_ammo',
  name: 'SRM Ammo',
  category: 'Ammunition',
  baseType: 'SRM Ammo',
  description: 'Ammunition for Short Range Missiles (all SRM types)',
  requiresAmmo: false,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 100
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 100
    }
  }
};

export const SRM_AMMO_HALF: Equipment = {
  id: 'srm_ammo_half',
  name: 'SRM Ammo (Half)',
  category: 'Ammunition',
  baseType: 'SRM Ammo',
  description: 'Half-load ammunition for Short Range Missiles',
  requiresAmmo: false,
  introductionYear: 2365,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 50
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 50
    }
  }
};

// Streak SRM Ammunition
export const STREAK_SRM_AMMO: Equipment = {
  id: 'streak_srm_ammo',
  name: 'Streak SRM Ammo',
  category: 'Ammunition',
  baseType: 'Streak SRM Ammo',
  description: 'Ammunition for Streak Short Range Missiles',
  requiresAmmo: false,
  introductionYear: 2647,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 100
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 100
    }
  }
};

export const STREAK_SRM_AMMO_HALF: Equipment = {
  id: 'streak_srm_ammo_half',
  name: 'Streak SRM Ammo (Half)',
  category: 'Ammunition',
  baseType: 'Streak SRM Ammo',
  description: 'Half-load ammunition for Streak Short Range Missiles',
  requiresAmmo: false,
  introductionYear: 2647,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 50
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 50
    }
  }
};

// LRM Ammunition
export const LRM_AMMO: Equipment = {
  id: 'lrm_ammo',
  name: 'LRM Ammo',
  category: 'Ammunition',
  baseType: 'LRM Ammo',
  description: 'Ammunition for Long Range Missiles (all LRM types)',
  requiresAmmo: false,
  introductionYear: 2295,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 120
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 120
    }
  }
};

export const LRM_AMMO_HALF: Equipment = {
  id: 'lrm_ammo_half',
  name: 'LRM Ammo (Half)',
  category: 'Ammunition',
  baseType: 'LRM Ammo',
  description: 'Half-load ammunition for Long Range Missiles',
  requiresAmmo: false,
  introductionYear: 2295,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 60
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 60
    }
  }
};

// Streak LRM Ammunition
export const STREAK_LRM_AMMO: Equipment = {
  id: 'streak_lrm_ammo',
  name: 'Streak LRM Ammo',
  category: 'Ammunition',
  baseType: 'Streak LRM Ammo',
  description: 'Ammunition for Streak Long Range Missiles',
  requiresAmmo: false,
  introductionYear: 3080,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 120
    }
  }
};

export const STREAK_LRM_AMMO_HALF: Equipment = {
  id: 'streak_lrm_ammo_half',
  name: 'Streak LRM Ammo (Half)',
  category: 'Ammunition',
  baseType: 'Streak LRM Ammo',
  description: 'Half-load ammunition for Streak Long Range Missiles',
  requiresAmmo: false,
  introductionYear: 3080,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 60
    }
  }
};

// Machine Gun Ammunition
export const MACHINE_GUN_AMMO: Equipment = {
  id: 'machine_gun_ammo',
  name: 'Machine Gun Ammo',
  category: 'Ammunition',
  baseType: 'Machine Gun Ammo',
  description: 'Ammunition for Machine Guns',
  requiresAmmo: false,
  introductionYear: 2590,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 200
    },
    Clan: {
      weight: 1,
      crits: 1,
      ammoPerTon: 200
    }
  }
};

export const MACHINE_GUN_AMMO_HALF: Equipment = {
  id: 'machine_gun_ammo_half',
  name: 'Machine Gun Ammo (Half)',
  category: 'Ammunition',
  baseType: 'Machine Gun Ammo',
  description: 'Half-load ammunition for Machine Guns',
  requiresAmmo: false,
  introductionYear: 2590,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 100
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 100
    }
  }
};

// Standard AC Ammunition (missing from original list)
export const AC_20_AMMO_STANDARD: Equipment = {
  id: 'ac_20_ammo_standard',
  name: 'AC/20 Ammo',
  category: 'Ammunition',
  baseType: 'AC/20 Ammo',
  description: 'Ammunition for AC/20 autocannons',
  requiresAmmo: false,
  introductionYear: 2165,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 5,
      cost: 1000,
      battleValue: 0
    }
  }
};

export const AC_20_AMMO_STANDARD_HALF: Equipment = {
  id: 'ac_20_ammo_standard_half',
  name: 'AC/20 Ammo (Half)',
  category: 'Ammunition',
  baseType: 'AC/20 Ammo',
  description: 'Half-load ammunition for AC/20 autocannons',
  requiresAmmo: false,
  introductionYear: 2165,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      ammoPerTon: 2,
      cost: 500,
      battleValue: 0
    }
  }
};

// Light AC Ammunition
export const LAC_2_AMMO: Equipment = {
  id: 'lac_2_ammo',
  name: 'LAC/2 Ammo',
  category: 'Ammunition',
  baseType: 'LAC/2 Ammo',
  description: 'Ammunition for Light AC/2 autocannons',
  requiresAmmo: false,
  introductionYear: 3080,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 45,
      cost: 1000,
      battleValue: 0
    }
  }
};

export const LAC_5_AMMO: Equipment = {
  id: 'lac_5_ammo',
  name: 'LAC/5 Ammo',
  category: 'Ammunition',
  baseType: 'LAC/5 Ammo',
  description: 'Ammunition for Light AC/5 autocannons',
  requiresAmmo: false,
  introductionYear: 3069,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 20,
      cost: 1000,
      battleValue: 0
    }
  }
};

// Rotary AC Ammunition
export const ROTARY_AC_2_AMMO: Equipment = {
  id: 'rotary_ac_2_ammo',
  name: 'Rotary AC/2 Ammo',
  category: 'Ammunition',
  baseType: 'Rotary AC/2 Ammo',
  description: 'Ammunition for Rotary AC/2 autocannons',
  requiresAmmo: false,
  introductionYear: 3062,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 45,
      cost: 1000,
      battleValue: 0
    }
  }
};

export const ROTARY_AC_5_AMMO: Equipment = {
  id: 'rotary_ac_5_ammo',
  name: 'Rotary AC/5 Ammo',
  category: 'Ammunition',
  baseType: 'Rotary AC/5 Ammo',
  description: 'Ammunition for Rotary AC/5 autocannons',
  requiresAmmo: false,
  introductionYear: 3062,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 20,
      cost: 1000,
      battleValue: 0
    }
  }
};

// Hyper-Velocity AC Ammunition
export const HVAC_10_AMMO: Equipment = {
  id: 'hvac_10_ammo',
  name: 'HVAC/10 Ammo',
  category: 'Ammunition',
  baseType: 'HVAC/10 Ammo',
  description: 'Ammunition for Hyper-Velocity AC/10 autocannons',
  requiresAmmo: false,
  introductionYear: 3070,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 1,
      crits: 1,
      ammoPerTon: 10,
      cost: 1000,
      battleValue: 0
    }
  }
};

export const AMMUNITION: Equipment[] = [
  // Standard AC Ammo
  AC_2_AMMO,
  AC_2_AMMO_HALF,
  AC_5_AMMO,
  AC_5_AMMO_HALF,
  AC_10_AMMO,
  AC_10_AMMO_HALF,
  AC_20_AMMO,
  AC_20_AMMO_HALF,
  AC_20_AMMO_STANDARD,
  AC_20_AMMO_STANDARD_HALF,
  // Ultra AC Ammo
  ULTRA_AC_5_AMMO,
  ULTRA_AC_5_AMMO_HALF,
  ULTRA_AC_10_AMMO,
  ULTRA_AC_10_AMMO_HALF,
  ULTRA_AC_20_AMMO,
  ULTRA_AC_20_AMMO_HALF,
  // LB-X AC Ammo
  LB_10_X_AC_AMMO,
  LB_10_X_AC_AMMO_HALF,
  // Light AC Ammo
  LAC_2_AMMO,
  LAC_5_AMMO,
  // Rotary AC Ammo
  ROTARY_AC_2_AMMO,
  ROTARY_AC_5_AMMO,
  // Hyper-Velocity AC Ammo
  HVAC_10_AMMO,
  // Gauss Ammo
  GAUSS_AMMO,
  GAUSS_AMMO_HALF,
  // Missile Ammo
  SRM_AMMO,
  SRM_AMMO_HALF,
  STREAK_SRM_AMMO,
  STREAK_SRM_AMMO_HALF,
  LRM_AMMO,
  LRM_AMMO_HALF,
  STREAK_LRM_AMMO,
  STREAK_LRM_AMMO_HALF,
  // Other Ammo
  MACHINE_GUN_AMMO,
  MACHINE_GUN_AMMO_HALF
];
