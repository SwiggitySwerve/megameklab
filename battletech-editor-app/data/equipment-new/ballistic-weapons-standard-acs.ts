import { Equipment } from './types';

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

export const BALLISTIC_WEAPONS_STANDARD_ACS: Equipment[] = [
  AC_2,
  AC_5,
  AC_10,
  AC_20
];
