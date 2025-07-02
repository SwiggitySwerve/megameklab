import { Equipment } from './types';

export const MEDIUM_LASER: Equipment = {
  id: 'medium_laser',
  name: 'Medium Laser',
  category: 'Energy Weapons',
  baseType: 'Medium Laser',
  description: 'Medium Laser - Standard medium-range energy weapon',
  requiresAmmo: false,
  introductionYear: 2442,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '226',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 40000,
      battleValue: 46
    },
    IS: {
      weight: 1,
      crits: 1,
      damage: 5,
      heat: 3,
      minRange: 0,
      rangeShort: 3,
      rangeMedium: 6,
      rangeLong: 9,
      cost: 40000,
      battleValue: 46
    }
  }
};

export const SMALL_LASER: Equipment = {
  id: 'small_laser',
  name: 'Small Laser',
  category: 'Energy Weapons',
  baseType: 'Small Laser',
  description: 'Small Laser - Standard short-range energy weapon',
  requiresAmmo: false,
  introductionYear: 2445,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '226',
  variants: {
    Clan: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 1,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 11250,
      battleValue: 20
    },
    IS: {
      weight: 0.5,
      crits: 1,
      damage: 3,
      heat: 1,
      minRange: 0,
      rangeShort: 1,
      rangeMedium: 2,
      rangeLong: 3,
      cost: 11250,
      battleValue: 20
    }
  }
};

export const LARGE_LASER: Equipment = {
  id: 'large_laser',
  name: 'Large Laser',
  category: 'Energy Weapons',
  baseType: 'Large Laser',
  description: 'Large Laser - Standard long-range energy weapon',
  requiresAmmo: false,
  introductionYear: 2316,
  rulesLevel: 'Standard',
  techRating: 'C',
  sourceBook: 'TM',
  pageReference: '227',
  variants: {
    Clan: {
      weight: 5,
      crits: 1,
      damage: 8,
      heat: 8,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 100000,
      battleValue: 123
    },
    IS: {
      weight: 5,
      crits: 2,
      damage: 8,
      heat: 8,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 100000,
      battleValue: 123
    }
  }
};

export const ENERGY_WEAPONS_BASIC_LASERS: Equipment[] = [
  MEDIUM_LASER,
  SMALL_LASER,
  LARGE_LASER
];
