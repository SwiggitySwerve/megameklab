import { Equipment } from './types';

export const ENHANCED_LRM_10: Equipment = {
  id: 'enhanced_lrm_10',
  name: 'Enhanced LRM 10',
  category: 'Missile Weapons',
  baseType: 'Enhanced LRM 10',
  description: 'Enhanced LRM 10 - Improved long-range missile system with advanced targeting',
  requiresAmmo: true,
  introductionYear: 3093,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 10,
      heat: 4,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 100000,
      battleValue: 110
    }
  }
};

export const ENHANCED_LRM_5: Equipment = {
  id: 'enhanced_lrm_5',
  name: 'Enhanced LRM 5',
  category: 'Missile Weapons',
  baseType: 'Enhanced LRM 5',
  description: 'Enhanced LRM 5 - Improved long-range missile system with advanced targeting',
  requiresAmmo: true,
  introductionYear: 3073,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 2,
      crits: 1,
      damage: 5,
      heat: 2,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 40000,
      battleValue: 55
    }
  }
};

export const EXTENDED_LRM_10: Equipment = {
  id: 'extended_lrm_10',
  name: 'Extended LRM 10',
  category: 'Missile Weapons',
  baseType: 'Extended LRM 10',
  description: 'Extended LRM 10 - Long-range missile system with extended effective range',
  requiresAmmo: true,
  introductionYear: 3075,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 10,
      heat: 4,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 125000,
      battleValue: 115
    }
  }
};

export const EXTENDED_LRM_15: Equipment = {
  id: 'extended_lrm_15',
  name: 'Extended LRM 15',
  category: 'Missile Weapons',
  baseType: 'Extended LRM 15',
  description: 'Extended LRM 15 - Long-range missile system with extended effective range',
  requiresAmmo: true,
  introductionYear: 3083,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 230000,
      battleValue: 172
    }
  }
};

export const EXTENDED_LRM_20: Equipment = {
  id: 'extended_lrm_20',
  name: 'Extended LRM 20',
  category: 'Missile Weapons',
  baseType: 'Extended LRM 20',
  description: 'Extended LRM 20 - Long-range missile system with extended effective range',
  requiresAmmo: true,
  introductionYear: 3072,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 10,
      crits: 5,
      damage: 20,
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      rangeExtreme: 28,
      cost: 350000,
      battleValue: 229
    }
  }
};

export const IMPROVED_LRM_15: Equipment = {
  id: 'improved_lrm_15',
  name: 'Improved LRM 15',
  category: 'Missile Weapons',
  baseType: 'Improved LRM 15',
  description: 'Improved LRM 15 - Star League era enhanced long-range missile system',
  requiresAmmo: true,
  introductionYear: 2824,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TRO 3058',
  pageReference: '45',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 185000,
      battleValue: 164
    }
  }
};

export const IMPROVED_LRM_20: Equipment = {
  id: 'improved_lrm_20',
  name: 'Improved LRM 20',
  category: 'Missile Weapons',
  baseType: 'Improved LRM 20',
  description: 'Improved LRM 20 - Star League era enhanced heavy long-range missile system',
  requiresAmmo: true,
  introductionYear: 2825,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TRO 3058',
  pageReference: '45',
  variants: {
    IS: {
      weight: 10,
      crits: 5,
      damage: 20,
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 280000,
      battleValue: 218
    }
  }
};

export const IMPROVED_SRM_6: Equipment = {
  id: 'improved_srm_6',
  name: 'Improved SRM 6',
  category: 'Missile Weapons',
  baseType: 'Improved SRM 6',
  description: 'Improved SRM 6 - Star League era enhanced short-range missile system',
  requiresAmmo: true,
  introductionYear: 2824,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TRO 3058',
  pageReference: '45',
  variants: {
    IS: {
      weight: 3,
      crits: 2,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 95000,
      battleValue: 71
    }
  }
};

export const LRM_10: Equipment = {
  id: 'lrm_10',
  name: 'LRM 10',
  category: 'Missile Weapons',
  baseType: 'LRM 10',
  description: 'Long Range Missile 10-pack - Standard indirect fire support weapon',
  requiresAmmo: true,
  introductionYear: 2473,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 2.5,
      crits: 1,
      damage: 10,
      heat: 4,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 100000,
      battleValue: 90
    },
    IS: {
      weight: 5,
      crits: 2,
      damage: 10,
      heat: 4,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 100000,
      battleValue: 90
    }
  }
};

export const LRM_15: Equipment = {
  id: 'lrm_15',
  name: 'LRM 15',
  category: 'Missile Weapons',
  baseType: 'LRM 15',
  description: 'Long Range Missile 15-pack - Heavy indirect fire support weapon',
  requiresAmmo: true,
  introductionYear: 2491,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 3.5,
      crits: 2,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 175000,
      battleValue: 136
    },
    IS: {
      weight: 7,
      crits: 3,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 175000,
      battleValue: 136
    }
  }
};

export const LRM_20: Equipment = {
  id: 'lrm_20',
  name: 'LRM 20',
  category: 'Missile Weapons',
  baseType: 'LRM 20',
  description: 'Long Range Missile 20-pack - Heavy indirect fire support weapon',
  requiresAmmo: true,
  introductionYear: 2458,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 5,
      crits: 2,
      damage: 20,
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 250000,
      battleValue: 181
    },
    IS: {
      weight: 10,
      crits: 5,
      damage: 20,
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 250000,
      battleValue: 181
    }
  }
};

export const LRM_5: Equipment = {
  id: 'lrm_5',
  name: 'LRM 5',
  category: 'Missile Weapons',
  baseType: 'LRM 5',
  description: 'Long Range Missile 5-pack - Standard indirect fire support weapon',
  requiresAmmo: true,
  introductionYear: 2456,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 2,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 30000,
      battleValue: 45
    },
    IS: {
      weight: 2,
      crits: 1,
      damage: 5,
      heat: 2,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 30000,
      battleValue: 45
    }
  }
};

export const PROTOTYPE_STREAK_SRM_4: Equipment = {
  id: 'prototype_streak_srm_4',
  name: 'Prototype Streak SRM 4',
  category: 'Missile Weapons',
  baseType: 'Prototype Streak SRM 4',
  description: 'Prototype Streak SRM 4 - Early self-guided short-range missile system',
  requiresAmmo: true,
  introductionYear: 2823,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TRO 3058',
  pageReference: '45',
  variants: {
    IS: {
      weight: 2,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 80000,
      battleValue: 54
    }
  }
};

export const PROTOTYPE_STREAK_SRM_6: Equipment = {
  id: 'prototype_streak_srm_6',
  name: 'Prototype Streak SRM 6',
  category: 'Missile Weapons',
  baseType: 'Prototype Streak SRM 6',
  description: 'Prototype Streak SRM 6 - Early self-guided heavy short-range missile system',
  requiresAmmo: true,
  introductionYear: 2801,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TRO 3058',
  pageReference: '45',
  variants: {
    IS: {
      weight: 3,
      crits: 2,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 110000,
      battleValue: 81
    }
  }
};

export const SRM_2: Equipment = {
  id: 'srm_2',
  name: 'SRM 2',
  category: 'Missile Weapons',
  baseType: 'SRM 2',
  description: 'Short Range Missile 2-pack - Light direct fire support weapon',
  requiresAmmo: true,
  introductionYear: 2462,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 4,
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 10000,
      battleValue: 21
    },
    IS: {
      weight: 1,
      crits: 1,
      damage: 4,
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 10000,
      battleValue: 21
    }
  }
};

export const SRM_4: Equipment = {
  id: 'srm_4',
  name: 'SRM 4',
  category: 'Missile Weapons',
  baseType: 'SRM 4',
  description: 'Short Range Missile 4-pack - Standard direct fire support weapon',
  requiresAmmo: true,
  introductionYear: 2442,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 60000,
      battleValue: 39
    },
    IS: {
      weight: 2,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 60000,
      battleValue: 39
    }
  }
};

export const SRM_6: Equipment = {
  id: 'srm_6',
  name: 'SRM 6',
  category: 'Missile Weapons',
  baseType: 'SRM 6',
  description: 'Short Range Missile 6-pack - Heavy direct fire support weapon',
  requiresAmmo: true,
  introductionYear: 2460,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 1.5,
      crits: 1,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 80000,
      battleValue: 59
    },
    IS: {
      weight: 3,
      crits: 2,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 80000,
      battleValue: 59
    }
  }
};

export const STREAK_LRM_10: Equipment = {
  id: 'streak_lrm_10',
  name: 'Streak LRM 10',
  category: 'Missile Weapons',
  baseType: 'Streak LRM 10',
  description: 'Streak LRM 10 - Self-guided long-range missile system',
  requiresAmmo: true,
  introductionYear: 3074,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 5,
      crits: 2,
      damage: 10,
      heat: 4,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 120000,
      battleValue: 135
    }
  }
};

export const STREAK_LRM_15: Equipment = {
  id: 'streak_lrm_15',
  name: 'Streak LRM 15',
  category: 'Missile Weapons',
  baseType: 'Streak LRM 15',
  description: 'Streak LRM 15 - Self-guided long-range missile system',
  requiresAmmo: true,
  introductionYear: 3085,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 200000,
      battleValue: 203
    }
  }
};

export const STREAK_LRM_15_AMMO_OMNIPOD: Equipment = {
  id: 'streak_lrm_15_ammo_omnipod',
  name: 'Streak LRM 15 Ammo (omnipod)',
  category: 'Missile Weapons',
  baseType: 'Streak LRM 15 Ammo',
  description: 'Streak LRM 15 Ammo (omnipod) - OmniPod ammunition system for Streak LRM 15',
  requiresAmmo: false,
  introductionYear: 3127,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3151',
  pageReference: '45',
  variants: {
    Clan: {
      weight: 3.5,
      crits: 2,
      damage: 15,
      heat: 5,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 30000,
      battleValue: 203
    }
  }
};

export const STREAK_LRM_20: Equipment = {
  id: 'streak_lrm_20',
  name: 'Streak LRM 20',
  category: 'Missile Weapons',
  baseType: 'Streak LRM 20',
  description: 'Streak LRM 20 - Self-guided heavy long-range missile system',
  requiresAmmo: true,
  introductionYear: 3110,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 10,
      crits: 5,
      damage: 20,
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 300000,
      battleValue: 271
    }
  }
};

export const STREAK_LRM_20_AMMO_OMNIPOD: Equipment = {
  id: 'streak_lrm_20_ammo_omnipod',
  name: 'Streak LRM 20 Ammo (omnipod)',
  category: 'Missile Weapons',
  baseType: 'Streak LRM 20 Ammo',
  description: 'Streak LRM 20 Ammo (omnipod) - OmniPod ammunition system for Streak LRM 20',
  requiresAmmo: false,
  introductionYear: 3132,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3151',
  pageReference: '45',
  variants: {
    IS: {
      weight: 5,
      crits: 4,
      damage: 20,
      heat: 6,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 50000,
      battleValue: 271
    }
  }
};

export const STREAK_LRM_5: Equipment = {
  id: 'streak_lrm_5',
  name: 'Streak LRM 5',
  category: 'Missile Weapons',
  baseType: 'Streak LRM 5',
  description: 'Streak LRM 5 - Self-guided long-range missile system',
  requiresAmmo: true,
  introductionYear: 3093,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3145',
  pageReference: '58',
  variants: {
    IS: {
      weight: 2,
      crits: 1,
      damage: 5,
      heat: 2,
      minRange: 6,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 21,
      cost: 45000,
      battleValue: 67
    }
  }
};

export const STREAK_SRM_2: Equipment = {
  id: 'streak_srm_2',
  name: 'Streak SRM 2',
  category: 'Missile Weapons',
  baseType: 'Streak SRM 2',
  description: 'Streak SRM 2 - Self-guided short-range missile system',
  requiresAmmo: true,
  introductionYear: 2649,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 4,
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 15000,
      battleValue: 30
    },
    IS: {
      weight: 1,
      crits: 1,
      damage: 4,
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 15000,
      battleValue: 30
    }
  }
};

export const STREAK_SRM_4_I_OS: Equipment = {
  id: 'streak_srm_4_i_os',
  name: 'Streak SRM 4 (I-OS)',
  category: 'Missile Weapons',
  baseType: 'Streak SRM 4',
  description: 'Streak SRM 4 (I-OS) - Improved One-Shot self-guided short-range missile system',
  requiresAmmo: false,
  introductionYear: 3142,
  rulesLevel: 'Standard',
  techRating: 'F',
  sourceBook: 'TRO 3151',
  pageReference: '45',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 45000,
      battleValue: 29
    },
    IS: {
      weight: 2,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 45000,
      battleValue: 29
    }
  }
};

export const STREAK_SRM_4_AMMO: Equipment = {
  id: 'streak_srm_4_ammo',
  name: 'Streak SRM 4 Ammo',
  category: 'Missile Weapons',
  baseType: 'Streak SRM 4 Ammo',
  description: 'Streak SRM 4 Ammo - Ammunition for Streak SRM 4 systems',
  requiresAmmo: false,
  introductionYear: 3078,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 27000,
      battleValue: 59
    },
    IS: {
      weight: 2,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 27000,
      battleValue: 59
    }
  }
};

export const STREAK_SRM_4: Equipment = {
  id: 'streak_srm_4',
  name: 'Streak SRM 4',
  category: 'Missile Weapons',
  baseType: 'Streak SRM 4',
  description: 'Streak SRM 4 - Self-guided short-range missile system',
  requiresAmmo: true,
  introductionYear: 2647,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 90000,
      battleValue: 59
    },
    IS: {
      weight: 2,
      crits: 1,
      damage: 8,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 90000,
      battleValue: 59
    }
  }
};

export const STREAK_SRM_6: Equipment = {
  id: 'streak_srm_6',
  name: 'Streak SRM 6',
  category: 'Missile Weapons',
  baseType: 'Streak SRM 6',
  description: 'Streak SRM 6 - Self-guided heavy short-range missile system',
  requiresAmmo: true,
  introductionYear: 2825,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 1.5,
      crits: 1,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 120000,
      battleValue: 89
    },
    IS: {
      weight: 3,
      crits: 2,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 120000,
      battleValue: 89
    }
  }
};

export const STREAK_SRM_6_AMMO: Equipment = {
  id: 'streak_srm_6_ammo',
  name: 'Streak SRM 6 Ammo',
  category: 'Missile Weapons',
  baseType: 'Streak SRM 6 Ammo',
  description: 'Streak SRM 6 Ammo - Ammunition for Streak SRM 6 systems',
  requiresAmmo: false,
  introductionYear: 2865,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '229',
  variants: {
    Clan: {
      weight: 1.5,
      crits: 1,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 40000,
      battleValue: 89
    },
    IS: {
      weight: 3,
      crits: 2,
      damage: 12,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 40000,
      battleValue: 89
    }
  }
};

// ATM (Advanced Tactical Missiles)
export const ATM_3: Equipment = {
  id: 'atm_3',
  name: 'ATM 3',
  category: 'Missile Weapons',
  baseType: 'ATM 3',
  description: 'Advanced Tactical Missile 3 - Multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3054,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    Clan: {
      weight: 1.5,
      crits: 2,
      damage: 6,
      heat: 2,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 50000,
      battleValue: 53
    },
    IS: {
      weight: 1.5,
      crits: 2,
      damage: 6,
      heat: 2,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 50000,
      battleValue: 53
    }
  }
};

export const ATM_6: Equipment = {
  id: 'atm_6',
  name: 'ATM 6',
  category: 'Missile Weapons',
  baseType: 'ATM 6',
  description: 'Advanced Tactical Missile 6 - Multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3054,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    Clan: {
      weight: 3.5,
      crits: 3,
      damage: 12,
      heat: 4,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 125000,
      battleValue: 105
    },
    IS: {
      weight: 3.5,
      crits: 3,
      damage: 12,
      heat: 4,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 125000,
      battleValue: 105
    }
  }
};

export const ATM_9: Equipment = {
  id: 'atm_9',
  name: 'ATM 9',
  category: 'Missile Weapons',
  baseType: 'ATM 9',
  description: 'Advanced Tactical Missile 9 - Multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3054,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    Clan: {
      weight: 5,
      crits: 4,
      damage: 18,
      heat: 6,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 225000,
      battleValue: 158
    },
    IS: {
      weight: 5,
      crits: 4,
      damage: 18,
      heat: 6,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 225000,
      battleValue: 158
    }
  }
};

export const ATM_12: Equipment = {
  id: 'atm_12',
  name: 'ATM 12',
  category: 'Missile Weapons',
  baseType: 'ATM 12',
  description: 'Advanced Tactical Missile 12 - Multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3054,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    Clan: {
      weight: 7,
      crits: 5,
      damage: 24,
      heat: 8,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 350000,
      battleValue: 211
    },
    IS: {
      weight: 7,
      crits: 5,
      damage: 24,
      heat: 8,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 350000,
      battleValue: 211
    }
  }
};

// IATM (Improved Advanced Tactical Missiles)
export const IATM_3: Equipment = {
  id: 'iatm_3',
  name: 'IATM 3',
  category: 'Missile Weapons',
  baseType: 'IATM 3',
  description: 'Improved Advanced Tactical Missile 3 - Enhanced multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3070,
  rulesLevel: 'Standard',
  techRating: 'F',
  variants: {
    Clan: {
      weight: 1.5,
      crits: 2,
      damage: 6,
      heat: 2,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 75000,
      battleValue: 60
    },
    IS: {
      weight: 1.5,
      crits: 2,
      damage: 6,
      heat: 2,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 75000,
      battleValue: 60
    }
  }
};

export const IATM_6: Equipment = {
  id: 'iatm_6',
  name: 'IATM 6',
  category: 'Missile Weapons',
  baseType: 'IATM 6',
  description: 'Improved Advanced Tactical Missile 6 - Enhanced multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3070,
  rulesLevel: 'Standard',
  techRating: 'F',
  variants: {
    Clan: {
      weight: 3.5,
      crits: 3,
      damage: 12,
      heat: 4,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 150000,
      battleValue: 118
    },
    IS: {
      weight: 3.5,
      crits: 3,
      damage: 12,
      heat: 4,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 150000,
      battleValue: 118
    }
  }
};

export const IATM_9: Equipment = {
  id: 'iatm_9',
  name: 'IATM 9',
  category: 'Missile Weapons',
  baseType: 'IATM 9',
  description: 'Improved Advanced Tactical Missile 9 - Enhanced multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3070,
  rulesLevel: 'Standard',
  techRating: 'F',
  variants: {
    Clan: {
      weight: 5,
      crits: 4,
      damage: 18,
      heat: 6,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 280000,
      battleValue: 177
    },
    IS: {
      weight: 5,
      crits: 4,
      damage: 18,
      heat: 6,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 280000,
      battleValue: 177
    }
  }
};

export const IATM_12: Equipment = {
  id: 'iatm_12',
  name: 'IATM 12',
  category: 'Missile Weapons',
  baseType: 'IATM 12',
  description: 'Improved Advanced Tactical Missile 12 - Enhanced multi-mode missile launcher',
  requiresAmmo: true,
  introductionYear: 3070,
  rulesLevel: 'Standard',
  techRating: 'F',
  variants: {
    Clan: {
      weight: 7,
      crits: 5,
      damage: 24,
      heat: 8,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 400000,
      battleValue: 236
    },
    IS: {
      weight: 7,
      crits: 5,
      damage: 24,
      heat: 8,
      minRange: 4,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 400000,
      battleValue: 236
    }
  }
};

// MML (Multi-Missile Launcher)
export const MML_3: Equipment = {
  id: 'mml_3',
  name: 'MML-3',
  category: 'Missile Weapons',
  baseType: 'MML-3',
  description: 'Multi-Missile Launcher 3 - Dual-mode SRM/LRM launcher',
  requiresAmmo: true,
  introductionYear: 3067,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 1.5,
      crits: 2,
      damage: 6,
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 7,
      rangeLong: 12,
      cost: 45000,
      battleValue: 29
    }
  }
};

export const MML_5: Equipment = {
  id: 'mml_5',
  name: 'MML-5',
  category: 'Missile Weapons',
  baseType: 'MML-5',
  description: 'Multi-Missile Launcher 5 - Dual-mode SRM/LRM launcher',
  requiresAmmo: true,
  introductionYear: 3067,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 3,
      crits: 3,
      damage: 10,
      heat: 2,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 7,
      rangeLong: 12,
      cost: 75000,
      battleValue: 45
    }
  }
};

export const MML_7: Equipment = {
  id: 'mml_7',
  name: 'MML-7',
  category: 'Missile Weapons',
  baseType: 'MML-7',
  description: 'Multi-Missile Launcher 7 - Dual-mode SRM/LRM launcher',
  requiresAmmo: true,
  introductionYear: 3067,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 4.5,
      crits: 4,
      damage: 14,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 7,
      rangeLong: 12,
      cost: 105000,
      battleValue: 67
    }
  }
};

export const MML_9: Equipment = {
  id: 'mml_9',
  name: 'MML-9',
  category: 'Missile Weapons',
  baseType: 'MML-9',
  description: 'Multi-Missile Launcher 9 - Dual-mode SRM/LRM launcher',
  requiresAmmo: true,
  introductionYear: 3067,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 6,
      crits: 5,
      damage: 18,
      heat: 5,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 7,
      rangeLong: 12,
      cost: 125000,
      battleValue: 86
    }
  }
};

// Thunderbolt Missiles
export const THUNDERBOLT_5: Equipment = {
  id: 'thunderbolt_5',
  name: 'Thunderbolt 5',
  category: 'Missile Weapons',
  baseType: 'Thunderbolt 5',
  description: 'Thunderbolt 5 - Heavy single-shot missile',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 3,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 5,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      cost: 50000,
      battleValue: 64
    }
  }
};

export const THUNDERBOLT_10: Equipment = {
  id: 'thunderbolt_10',
  name: 'Thunderbolt 10',
  category: 'Missile Weapons',
  baseType: 'Thunderbolt 10',
  description: 'Thunderbolt 10 - Heavy single-shot missile',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 7,
      crits: 2,
      damage: 10,
      heat: 5,
      minRange: 5,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      cost: 175000,
      battleValue: 127
    }
  }
};

export const THUNDERBOLT_15: Equipment = {
  id: 'thunderbolt_15',
  name: 'Thunderbolt 15',
  category: 'Missile Weapons',
  baseType: 'Thunderbolt 15',
  description: 'Thunderbolt 15 - Heavy single-shot missile',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 11,
      crits: 3,
      damage: 15,
      heat: 7,
      minRange: 5,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      cost: 325000,
      battleValue: 229
    }
  }
};

export const THUNDERBOLT_20: Equipment = {
  id: 'thunderbolt_20',
  name: 'Thunderbolt 20',
  category: 'Missile Weapons',
  baseType: 'Thunderbolt 20',
  description: 'Thunderbolt 20 - Heavy single-shot missile',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    IS: {
      weight: 15,
      crits: 5,
      damage: 20,
      heat: 8,
      minRange: 5,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      cost: 450000,
      battleValue: 305
    }
  }
};

// MRM (Medium Range Missiles)
export const MRM_10: Equipment = {
  id: 'mrm_10',
  name: 'MRM 10',
  category: 'Missile Weapons',
  baseType: 'MRM 10',
  description: 'Medium Range Missile 10',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 3,
      crits: 2,
      damage: 10,
      heat: 4,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 8,
      rangeLong: 15,
      cost: 50000,
      battleValue: 56
    }
  }
};

export const MRM_20: Equipment = {
  id: 'mrm_20',
  name: 'MRM 20',
  category: 'Missile Weapons',
  baseType: 'MRM 20',
  description: 'Medium Range Missile 20',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 20,
      heat: 6,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 8,
      rangeLong: 15,
      cost: 125000,
      battleValue: 112
    }
  }
};

export const MRM_30: Equipment = {
  id: 'mrm_30',
  name: 'MRM 30',
  category: 'Missile Weapons',
  baseType: 'MRM 30',
  description: 'Medium Range Missile 30',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 10,
      crits: 5,
      damage: 30,
      heat: 10,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 8,
      rangeLong: 15,
      cost: 225000,
      battleValue: 168
    }
  }
};

export const MRM_40: Equipment = {
  id: 'mrm_40',
  name: 'MRM 40',
  category: 'Missile Weapons',
  baseType: 'MRM 40',
  description: 'Medium Range Missile 40',
  requiresAmmo: true,
  introductionYear: 3052,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 12,
      crits: 7,
      damage: 40,
      heat: 12,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 8,
      rangeLong: 15,
      cost: 350000,
      battleValue: 224
    }
  }
};

export const MISSILE_WEAPONS: Equipment[] = [
  // Enhanced/Extended/Improved LRMs
  ENHANCED_LRM_10,
  ENHANCED_LRM_5,
  EXTENDED_LRM_10,
  EXTENDED_LRM_15,
  EXTENDED_LRM_20,
  IMPROVED_LRM_15,
  IMPROVED_LRM_20,
  IMPROVED_SRM_6,
  // Standard LRMs/SRMs
  LRM_10,
  LRM_15,
  LRM_20,
  LRM_5,
  SRM_2,
  SRM_4,
  SRM_6,
  // Streak variants
  STREAK_LRM_10,
  STREAK_LRM_15,
  STREAK_LRM_15_AMMO_OMNIPOD,
  STREAK_LRM_20,
  STREAK_LRM_20_AMMO_OMNIPOD,
  STREAK_LRM_5,
  STREAK_SRM_2,
  STREAK_SRM_4,
  STREAK_SRM_4_I_OS,
  STREAK_SRM_4_AMMO,
  STREAK_SRM_6,
  STREAK_SRM_6_AMMO,
  // Prototype variants
  PROTOTYPE_STREAK_SRM_4,
  PROTOTYPE_STREAK_SRM_6,
  // ATM systems
  ATM_3,
  ATM_6,
  ATM_9,
  ATM_12,
  // IATM systems
  IATM_3,
  IATM_6,
  IATM_9,
  IATM_12,
  // MML systems
  MML_3,
  MML_5,
  MML_7,
  MML_9,
  // Thunderbolt missiles
  THUNDERBOLT_5,
  THUNDERBOLT_10,
  THUNDERBOLT_15,
  THUNDERBOLT_20,
  // MRM systems
  MRM_10,
  MRM_20,
  MRM_30,
  MRM_40
];
