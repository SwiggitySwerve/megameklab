import { Equipment } from './types';

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

export const MISSILE_WEAPONS_STANDARD_LRMS: Equipment[] = [
  LRM_5,
  LRM_10,
  LRM_15,
  LRM_20
];
