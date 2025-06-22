import { Equipment } from './types';
import { ENERGY_WEAPONS } from './energy-weapons';
import { BALLISTIC_WEAPONS } from './ballistic-weapons';
import { MISSILE_WEAPONS } from './missile-weapons';
import { EQUIPMENT } from './equipment';
import { HEAT_MANAGEMENT } from './heat-management';
import { ELECTRONIC_WARFARE } from './electronic-warfare';
import { AMMUNITION } from './ammunition';

export * from './types';
export { BROWSABLE_CATEGORIES, SPECIAL_CATEGORIES, ALL_CATEGORIES } from './types';

export const EQUIPMENT_DATABASE = {
  energyWeapons: ENERGY_WEAPONS,
  ballisticWeapons: BALLISTIC_WEAPONS,
  missileWeapons: MISSILE_WEAPONS,
  equipment: EQUIPMENT,
  heatManagement: HEAT_MANAGEMENT,
  electronicWarfare: ELECTRONIC_WARFARE,
  ammunition: AMMUNITION
};

// Flattened list of all equipment with tech base variants
export const ALL_EQUIPMENT_VARIANTS = [
  ...ENERGY_WEAPONS,
  ...BALLISTIC_WEAPONS,
  ...MISSILE_WEAPONS,
  ...EQUIPMENT,
  ...HEAT_MANAGEMENT,
  ...ELECTRONIC_WARFARE,
  ...AMMUNITION
];
