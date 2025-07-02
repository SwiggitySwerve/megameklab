import { Equipment } from './types';

export const PPC: Equipment = {
  id: 'ppc',
  name: 'PPC',
  category: 'Energy Weapons',
  baseType: 'PPC',
  description: 'Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 2594,
  rulesLevel: 'Standard',
  techRating: 'D',
  sourceBook: 'TM',
  pageReference: '273',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 10,
      minRange: 3,
      rangeShort: 6,
      rangeMedium: 12,
      rangeLong: 18,
      cost: 200000,
      battleValue: 176
    }
  }
};

export const CLAN_ERPPC: Equipment = {
  id: 'clan_erppc',
  name: 'ER PPC',
  category: 'Energy Weapons',
  baseType: 'Clan ER PPC',
  description: 'Clan Extended Range Particle Projection Cannon',
  requiresAmmo: false,
  introductionYear: 2830,
  rulesLevel: 'Standard',
  techRating: 'E',
  variants: {
    Clan: {
      weight: 6,
      crits: 2,
      damage: 15,
      heat: 15,
      minRange: 0,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 23,
      rangeExtreme: 28,
      cost: 300000,
      battleValue: 412
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
  techRating: 'E',
  variants: {
    IS: {
      weight: 7,
      crits: 3,
      damage: 10,
      heat: 15,
      minRange: 0,
      rangeShort: 7,
      rangeMedium: 14,
      rangeLong: 23,
      rangeExtreme: 28,
      cost: 300000,
      battleValue: 229
    }
  }
};

export const LIGHT_PPC: Equipment = {
  id: 'light_ppc',
  name: 'Light PPC',
  category: 'Energy Weapons',
  baseType: 'Light PPC',
  description: 'Light PPC - Lightweight particle projection cannon',
  requiresAmmo: false,
  introductionYear: 3060,
  rulesLevel: 'Standard',
  techRating: 'E',
  sourceBook: 'TM',
  pageReference: '227',
  variants: {
    Clan: {
      weight: 3,
      crits: 2,
      damage: 5,
      heat: 5,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 150000,
      battleValue: 88
    },
    IS: {
      weight: 3,
      crits: 2,
      damage: 5,
      heat: 5,
      minRange: 0,
      rangeShort: 5,
      rangeMedium: 10,
      rangeLong: 15,
      cost: 150000,
      battleValue: 88
    }
  }
};

export const ENERGY_WEAPONS_PPCS: Equipment[] = [
  PPC,
  CLAN_ERPPC,
  IS_ER_PPC,
  LIGHT_PPC
];
