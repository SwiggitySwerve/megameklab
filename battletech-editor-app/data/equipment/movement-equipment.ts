import { Equipment } from './types';

// Jump Jet
export const JUMP_JET: Equipment = {
  id: 'jump_jet',
  name: 'Jump Jet',
  category: 'Movement Equipment',
  baseType: 'Jump Jet',
  description: 'Propulsion system for short-range vertical movement',
  requiresAmmo: false,
  introductionYear: 2670,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 200000,
      battleValue: 0
    },
    Clan: {
      weight: 0, // Variable based on Mek tonnage
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 200000,
      battleValue: 0
    }
  },
  special: ['Jump Jets', 'Variable Weight', 'Movement Enhancement']
};

// Improved Jump Jet
export const IMPROVED_JUMP_JET: Equipment = {
  id: 'improved_jump_jet',
  name: 'Improved Jump Jet',
  category: 'Movement Equipment',
  baseType: 'Improved Jump Jet',
  description: 'Enhanced jump jet with improved efficiency',
  requiresAmmo: false,
  introductionYear: 3064,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 2,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 500000,
      battleValue: 0
    }
  },
  special: ['Jump Jets', 'Variable Weight', 'Improved Efficiency']
};

// UMU (Underwater Maneuvering Unit)
export const UMU: Equipment = {
  id: 'umu',
  name: 'UMU',
  category: 'Movement Equipment',
  baseType: 'UMU',
  description: 'Underwater propulsion system for aquatic operations',
  requiresAmmo: false,
  introductionYear: 2300,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on Mek tonnage
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 200000,
      battleValue: 0
    },
    Clan: {
      weight: 0, // Variable based on Mek tonnage
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 200000,
      battleValue: 0
    }
  },
  special: ['Underwater Movement', 'Variable Weight', 'Aquatic Operations']
};

// Supercharger
export const SUPERCHARGER: Equipment = {
  id: 'supercharger',
  name: 'Supercharger',
  category: 'Movement Equipment',
  baseType: 'Supercharger',
  description: 'Engine enhancement system for increased movement speed',
  requiresAmmo: false,
  introductionYear: 3062,
  rulesLevel: 'Standard',
  variants: {
    IS: {
      weight: 0, // Variable based on engine rating
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 0, // Variable based on engine rating
      battleValue: 0
    },
    Clan: {
      weight: 0, // Variable based on engine rating
      crits: 1,
      damage: 0,
      heat: 0,
      minRange: 0,
      rangeShort: 0,
      rangeMedium: 0,
      rangeLong: 0,
      rangeExtreme: 0,
      cost: 0, // Variable based on engine rating
      battleValue: 0
    }
  },
  special: ['Movement Enhancement', 'Variable Weight', 'Speed Boost']
};

export const MOVEMENT_EQUIPMENT: Equipment[] = [
  JUMP_JET,
  IMPROVED_JUMP_JET,
  UMU,
  SUPERCHARGER
];
