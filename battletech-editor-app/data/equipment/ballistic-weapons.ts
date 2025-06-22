import { Equipment } from './types';

export const AP_GAUSS_RIFLE: Equipment = {
  id: 'ap_gauss_rifle',
  name: 'AP Gauss Rifle',
  category: 'Ballistic Weapons',
  baseType: 'AP Gauss Rifle',
  description: 'Anti-Personnel Gauss Rifle - Electromagnetic weapon designed for infantry suppression',
  requiresAmmo: true,
  introductionYear: 3068,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 1,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 10000,
      battleValue: 21
    }
  }
};

export const GAUSS_RIFLE: Equipment = {
  id: 'gauss_rifle',
  name: 'Gauss Rifle',
  category: 'Ballistic Weapons',
  baseType: 'Gauss Rifle',
  description: 'Gauss Rifle - Electromagnetic projectile weapon',
  requiresAmmo: true,
  introductionYear: 2592,
  rulesLevel: 'Standard',
  sourceBook: 'TM',
  pageReference: '219',
  variants: {
    Clan: {
      weight: 12,
      crits: 6,
      damage: 15,
      heat: 1,
      minRange: 2,
      rangeShort: 7,
      rangeMedium: 15,
      rangeLong: 22,
      cost: 300000,
      battleValue: 320
    },
    IS: {
      weight: 15,
      crits: 7,
      damage: 15,
      heat: 1,
      minRange: 2,
      rangeShort: 7,
      rangeMedium: 15,
      rangeLong: 22,
      cost: 300000,
      battleValue: 320
    }
  }
};

export const HEAVY_GAUSS_RIFLE: Equipment = {
  id: 'heavy_gauss_rifle',
  name: 'Heavy Gauss Rifle',
  category: 'Ballistic Weapons',
  baseType: 'Heavy Gauss Rifle',
  description: 'Heavy Gauss Rifle - High-damage electromagnetic weapon with minimum range',
  requiresAmmo: true,
  introductionYear: 3061,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 18,
      crits: 11,
      damage: 25,
      heat: 2,
      minRange: 4,
      rangeShort: 6,
      rangeMedium: 13,
      rangeLong: 20,
      cost: 500000,
      battleValue: 346
    }
  }
};

export const HYPER_ASSAULT_GAUSS_RIFLE_40_AMMO_OMNIPOD: Equipment = {
  id: 'hyper_assault_gauss_rifle_40_ammo_omnipod',
  name: 'Hyper-Assault Gauss Rifle/40 Ammo (OMNIPOD)',
  category: 'Ballistic Weapons',
  baseType: 'Hyper-Assault Gauss Rifle/40 Ammo',
  description: 'Base template for Hyper-Assault Gauss Rifle/40 Ammo equipment variants',
  requiresAmmo: false,
  introductionYear: 3070,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 15,
      crits: 7,
      damage: 15,
      heat: 1,
      minRange: 2,
      rangeShort: 4,
      rangeMedium: 8,
      rangeLong: 12,
      cost: 400000,
      battleValue: 320
    }
  }
};

export const IMPROVED_GAUSS_RIFLE: Equipment = {
  id: 'improved_gauss_rifle',
  name: 'Improved Gauss Rifle',
  category: 'Ballistic Weapons',
  baseType: 'Improved Gauss Rifle',
  description: 'Improved Gauss Rifle - Enhanced magnetic accelerator weapon',
  requiresAmmo: true,
  introductionYear: 2573,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '207',
  variants: {
    IS: {
      weight: 15,
      crits: 7,
      damage: 15,
      heat: 1,
      minRange: 2,
      rangeShort: 7,
      rangeMedium: 15,
      rangeLong: 22,
      cost: 350000,
      battleValue: 332
    }
  }
};

export const IMPROVED_HEAVY_GAUSS_RIFLE: Equipment = {
  id: 'improved_heavy_gauss_rifle',
  name: 'Improved Heavy Gauss Rifle',
  category: 'Ballistic Weapons',
  baseType: 'Improved Heavy Gauss Rifle',
  description: 'Improved Heavy Gauss Rifle - Enhanced heavy electromagnetic weapon',
  requiresAmmo: true,
  introductionYear: 3075,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TM',
  pageReference: '207',
  variants: {
    IS: {
      weight: 18,
      crits: 11,
      damage: 25,
      heat: 2,
      minRange: 4,
      rangeShort: 6,
      rangeMedium: 13,
      rangeLong: 20,
      cost: 600000,
      battleValue: 346
    }
  }
};

export const LB_2_X_AC: Equipment = {
  id: 'lb_2_x_ac',
  name: 'LB 2-X AC',
  category: 'Ballistic Weapons',
  baseType: 'LB 2-X AC',
  description: 'LB 2-X Autocannon - Ultra-light cluster autocannon',
  requiresAmmo: true,
  introductionYear: 3058,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 9,
      rangeMedium: 18,
      rangeLong: 27,
      cost: 150000,
      battleValue: 42
    },
    Clan: {
      weight: 4,
      crits: 2,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 10,
      rangeMedium: 20,
      rangeLong: 30,
      cost: 150000,
      battleValue: 47
    }
  }
};

export const LB_5_X_AC: Equipment = {
  id: 'lb_5_x_ac',
  name: 'LB 5-X AC',
  category: 'Ballistic Weapons',
  baseType: 'LB 5-X AC',
  description: 'LB 5-X Autocannon - Light cluster autocannon',
  requiresAmmo: true,
  introductionYear: 3055,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 7,
      crits: 4,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      cost: 250000,
      battleValue: 83
    },
    Clan: {
      weight: 6,
      crits: 3,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 250000,
      battleValue: 92
    }
  }
};

export const LB_10_X_AC: Equipment = {
  id: 'lb_10_x_ac',
  name: 'LB 10-X AC',
  category: 'Ballistic Weapons',
  baseType: 'LB 10-X AC',
  description: 'LB 10-X Autocannon - Medium cluster autocannon',
  requiresAmmo: true,
  introductionYear: 2595,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 11,
      crits: 6,
      damage: 10,
      heat: 2,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 400000,
      battleValue: 148
    },
    Clan: {
      weight: 10,
      crits: 5,
      damage: 10,
      heat: 2,
      minRange: 0,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      cost: 400000,
      battleValue: 148
    }
  }
};

export const LB_20_X_AC: Equipment = {
  id: 'lb_20_x_ac',
  name: 'LB 20-X AC',
  category: 'Ballistic Weapons',
  baseType: 'LB 20-X AC',
  description: 'LB 20-X Autocannon - Heavy cluster autocannon',
  requiresAmmo: true,
  introductionYear: 2590,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 14,
      crits: 10,
      damage: 20,
      heat: 6,
      minRange: 0,
      rangeShort: 4,
      rangeMedium: 8,
      rangeLong: 12,
      cost: 600000,
      battleValue: 237
    },
    Clan: {
      weight: 12,
      crits: 9,
      damage: 20,
      heat: 6,
      minRange: 0,
      rangeShort: 4,
      rangeMedium: 8,
      rangeLong: 12,
      cost: 600000,
      battleValue: 237
    }
  }
};

export const LIGHT_GAUSS_RIFLE: Equipment = {
  id: 'light_gauss_rifle',
  name: 'Light Gauss Rifle',
  category: 'Ballistic Weapons',
  baseType: 'Light Gauss Rifle',
  description: 'Light Gauss Rifle - Lightweight electromagnetic weapon with extended range',
  requiresAmmo: true,
  introductionYear: 3058,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 12,
      crits: 5,
      damage: 8,
      heat: 1,
      minRange: 0,
      rangeShort: 8,
      rangeMedium: 17,
      rangeLong: 25,
      cost: 275000,
      battleValue: 159
    },
    Clan: {
      weight: 9,
      crits: 4,
      damage: 8,
      heat: 1,
      minRange: 0,
      rangeShort: 8,
      rangeMedium: 17,
      rangeLong: 25,
      cost: 275000,
      battleValue: 159
    }
  }
};

export const SILVER_BULLET_GAUSS_RIFLE: Equipment = {
  id: 'silver_bullet_gauss_rifle',
  name: 'Silver Bullet Gauss Rifle',
  category: 'Ballistic Weapons',
  baseType: 'Silver Bullet Gauss Rifle',
  description: 'Silver Bullet Gauss Rifle - Specialized electromagnetic weapon with enhanced ammunition',
  requiresAmmo: true,
  introductionYear: 3071,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3085',
  pageReference: '35',
  variants: {
    IS: {
      weight: 12,
      crits: 6,
      damage: 15,
      heat: 1,
      minRange: 2,
      rangeShort: 7,
      rangeMedium: 15,
      rangeLong: 22,
      cost: 350000,
      battleValue: 264
    }
  }
};

export const ULTRA_AC_10: Equipment = {
  id: 'ultra_ac_10',
  name: 'Ultra AC/10',
  category: 'Ballistic Weapons',
  baseType: 'Ultra AC/10',
  description: 'Ultra Autocannon/10 - Double-firing capable autocannon',
  requiresAmmo: true,
  introductionYear: 2845,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 10,
      crits: 5,
      damage: 10,
      heat: 4,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 320000,
      battleValue: 210
    },
    IS: {
      weight: 13,
      crits: 7,
      damage: 10,
      heat: 4,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 320000,
      battleValue: 210
    }
  }
};

export const ULTRA_AC_2: Equipment = {
  id: 'ultra_ac_2',
  name: 'Ultra AC/2',
  category: 'Ballistic Weapons',
  baseType: 'Ultra AC/2',
  description: 'Ultra Autocannon/2 - Double-firing capable autocannon',
  requiresAmmo: true,
  introductionYear: 2827,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 6,
      crits: 2,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 9,
      rangeLong: 18,
      cost: 120000,
      battleValue: 81
    },
    IS: {
      weight: 7,
      crits: 2,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 9,
      rangeLong: 18,
      cost: 120000,
      battleValue: 81
    }
  }
};

export const ULTRA_AC_20: Equipment = {
  id: 'ultra_ac_20',
  name: 'Ultra AC/20',
  category: 'Ballistic Weapons',
  baseType: 'Ultra AC/20',
  description: 'Ultra Autocannon/20 - Double-firing capable heavy autocannon',
  requiresAmmo: true,
  introductionYear: 2830,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 12,
      crits: 8,
      damage: 20,
      heat: 8,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 480000,
      battleValue: 335
    },
    IS: {
      weight: 15,
      crits: 10,
      damage: 20,
      heat: 8,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 480000,
      battleValue: 335
    }
  }
};

export const ULTRA_AC_5: Equipment = {
  id: 'ultra_ac_5',
  name: 'Ultra AC/5',
  category: 'Ballistic Weapons',
  baseType: 'Ultra AC/5',
  description: 'Ultra Autocannon/5 - Double-firing capable autocannon',
  requiresAmmo: true,
  introductionYear: 2750,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 7,
      crits: 4,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 200000,
      battleValue: 112
    },
    IS: {
      weight: 9,
      crits: 5,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 200000,
      battleValue: 112
    }
  }
};

// Standard AC weapons
export const AC_2: Equipment = {
  id: 'ac_2',
  name: 'AC/2',
  category: 'Ballistic Weapons',
  baseType: 'AC/2',
  description: 'Autocannon/2 - Long-range ballistic weapon',
  requiresAmmo: true,
  introductionYear: 2250,
  rulesLevel: 'Standard',
  sourceBook: 'TM',
  pageReference: '207',
  variants: {
    IS: {
      weight: 6,
      crits: 1,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 9,
      rangeLong: 18,
      cost: 75000,
      battleValue: 37
    }
  }
};

export const AC_5: Equipment = {
  id: 'ac_5',
  name: 'AC/5',
  category: 'Ballistic Weapons',
  baseType: 'AC/5',
  description: 'Autocannon/5 - Medium-range ballistic weapon',
  requiresAmmo: true,
  introductionYear: 2240,
  rulesLevel: 'Standard',
  sourceBook: 'TM',
  pageReference: '208',
  variants: {
    IS: {
      weight: 8,
      crits: 4,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 125000,
      battleValue: 70
    }
  }
};

export const AC_10: Equipment = {
  id: 'ac_10',
  name: 'AC/10',
  category: 'Ballistic Weapons',
  baseType: 'AC/10',
  description: 'Autocannon/10 - Medium-range ballistic weapon',
  requiresAmmo: true,
  introductionYear: 2180,
  rulesLevel: 'Standard',
  sourceBook: 'TM',
  pageReference: '208',
  variants: {
    IS: {
      weight: 12,
      crits: 7,
      damage: 10,
      heat: 3,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 200000,
      battleValue: 123
    }
  }
};

export const AC_20: Equipment = {
  id: 'ac_20',
  name: 'AC/20',
  category: 'Ballistic Weapons',
  baseType: 'AC/20',
  description: 'Autocannon/20 - Heavy short-range ballistic weapon',
  requiresAmmo: true,
  introductionYear: 2165,
  rulesLevel: 'Standard',
  sourceBook: 'TM',
  pageReference: '208',
  variants: {
    IS: {
      weight: 14,
      crits: 10,
      damage: 20,
      heat: 7,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 300000,
      battleValue: 178
    }
  }
};

// Light AC variants
export const LAC_2: Equipment = {
  id: 'lac_2',
  name: 'LAC/2',
  category: 'Ballistic Weapons',
  baseType: 'LAC/2',
  description: 'Light Autocannon/2',
  requiresAmmo: true,
  introductionYear: 3080,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 4,
      crits: 1,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 10,
      rangeLong: 20,
      cost: 100000,
      battleValue: 30
    }
  }
};

export const LAC_5: Equipment = {
  id: 'lac_5',
  name: 'LAC/5',
  category: 'Ballistic Weapons',
  baseType: 'LAC/5',
  description: 'Light Autocannon/5',
  requiresAmmo: true,
  introductionYear: 3069,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 7,
      rangeLong: 14,
      cost: 150000,
      battleValue: 62
    }
  }
};

export const LIGHT_AC_2: Equipment = {
  id: 'light_ac_2',
  name: 'Light AC/2',
  category: 'Ballistic Weapons',
  baseType: 'Light AC/2',
  description: 'Light Autocannon/2 variant',
  requiresAmmo: true,
  introductionYear: 3107,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 4,
      crits: 1,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 10,
      rangeLong: 20,
      cost: 100000,
      battleValue: 30
    }
  }
};

export const LIGHT_AC_5: Equipment = {
  id: 'light_ac_5',
  name: 'Light AC/5',
  category: 'Ballistic Weapons',
  baseType: 'Light AC/5',
  description: 'Light Autocannon/5 variant',
  requiresAmmo: true,
  introductionYear: 3068,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 7,
      rangeLong: 14,
      cost: 150000,
      battleValue: 62
    }
  }
};

// Rotary AC variants
export const ROTARY_AC_2: Equipment = {
  id: 'rotary_ac_2',
  name: 'Rotary AC/2',
  category: 'Ballistic Weapons',
  baseType: 'Rotary AC/2',
  description: 'Rotary Autocannon/2 - Multiple barrel rapid-fire weapon',
  requiresAmmo: true,
  introductionYear: 3062,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 8,
      crits: 3,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 9,
      rangeLong: 18,
      cost: 175000,
      battleValue: 118
    }
  }
};

export const ROTARY_AC_5: Equipment = {
  id: 'rotary_ac_5',
  name: 'Rotary AC/5',
  category: 'Ballistic Weapons',
  baseType: 'Rotary AC/5',
  description: 'Rotary Autocannon/5 - Multiple barrel rapid-fire weapon',
  requiresAmmo: true,
  introductionYear: 3062,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 10,
      crits: 6,
      damage: 5,
      heat: 1,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 275000,
      battleValue: 247
    }
  }
};

// Hyper-Velocity AC
export const HVAC_10: Equipment = {
  id: 'hvac_10',
  name: 'HVAC/10',
  category: 'Ballistic Weapons',
  baseType: 'HVAC/10',
  description: 'Hyper-Velocity Autocannon/10',
  requiresAmmo: true,
  introductionYear: 3070,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 10,
      crits: 4,
      damage: 10,
      heat: 3,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 230000,
      battleValue: 120
    }
  }
};

// ProtoMech weapons
export const PROTOMECH_AC_2: Equipment = {
  id: 'protomech_ac_2',
  name: 'ProtoMech AC/2',
  category: 'Ballistic Weapons',
  baseType: 'ProtoMech AC/2',
  description: 'ProtoMech Autocannon/2',
  requiresAmmo: true,
  introductionYear: 3110,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 4,
      crits: 1,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 2,
      rangeMedium: 9,
      rangeLong: 18,
      cost: 80000,
      battleValue: 30
    }
  }
};

// Machine Gun weapons
export const MACHINE_GUN: Equipment = {
  id: 'machine_gun',
  name: 'Machine Gun',
  category: 'Ballistic Weapons',
  baseType: 'Machine Gun',
  description: 'Standard Machine Gun - Anti-infantry ballistic weapon',
  requiresAmmo: true,
  introductionYear: 1950,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 0.25,
      crits: 1,
      damage: 2,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 5000,
      battleValue: 5
    },
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 2,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 5000,
      battleValue: 5
    }
  }
};

export const LIGHT_MACHINE_GUN: Equipment = {
  id: 'light_machine_gun',
  name: 'Light Machine Gun',
  category: 'Ballistic Weapons',
  baseType: 'Light Machine Gun',
  description: 'Light Machine Gun - Lightweight anti-infantry weapon',
  requiresAmmo: true,
  introductionYear: 3068,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.25,
      crits: 1,
      damage: 1,
      heat: 0,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 5000,
      battleValue: 5
    }
  }
};

export const HEAVY_MACHINE_GUN: Equipment = {
  id: 'heavy_machine_gun',
  name: 'Heavy Machine Gun',
  category: 'Ballistic Weapons',
  baseType: 'Heavy Machine Gun',
  description: 'Heavy Machine Gun - Enhanced anti-infantry weapon',
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
      cost: 7500,
      battleValue: 7
    }
  }
};

// Defensive Systems
export const ANTI_MISSILE_SYSTEM: Equipment = {
  id: 'anti_missile_system',
  name: 'Anti-Missile System',
  category: 'Ballistic Weapons',
  baseType: 'Anti-Missile System',
  description: 'Anti-Missile System for intercepting incoming missiles',
  requiresAmmo: true,
  introductionYear: 2617,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 100000,
      battleValue: 32
    },
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 2,
      heat: 1,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 100000,
      battleValue: 32
    }
  }
};

export const BALLISTIC_WEAPONS: Equipment[] = [
  // Gauss Rifles
  AP_GAUSS_RIFLE,
  GAUSS_RIFLE,
  HEAVY_GAUSS_RIFLE,
  HYPER_ASSAULT_GAUSS_RIFLE_40_AMMO_OMNIPOD,
  IMPROVED_GAUSS_RIFLE,
  IMPROVED_HEAVY_GAUSS_RIFLE,
  LIGHT_GAUSS_RIFLE,
  SILVER_BULLET_GAUSS_RIFLE,
  // Standard ACs
  AC_2,
  AC_5,
  AC_10,
  AC_20,
  // Ultra ACs
  ULTRA_AC_2,
  ULTRA_AC_5,
  ULTRA_AC_10,
  ULTRA_AC_20,
  // LB-X ACs
  LB_2_X_AC,
  LB_5_X_AC,
  LB_10_X_AC,
  LB_20_X_AC,
  // Light ACs
  LAC_2,
  LAC_5,
  LIGHT_AC_2,
  LIGHT_AC_5,
  // Rotary ACs
  ROTARY_AC_2,
  ROTARY_AC_5,
  // Hyper-Velocity AC
  HVAC_10,
  // Machine Guns
  MACHINE_GUN,
  LIGHT_MACHINE_GUN,
  HEAVY_MACHINE_GUN,
  // ProtoMech weapons
  PROTOMECH_AC_2,
  // Defensive Systems
  ANTI_MISSILE_SYSTEM
];
