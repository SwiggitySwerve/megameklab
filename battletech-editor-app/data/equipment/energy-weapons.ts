import { Equipment } from './types';
import { BASIC_LASERS, ER_LARGE_LASER, ER_LARGE_PULSE_LASER, ER_MEDIUM_LASER, ER_MEDIUM_PULSE_LASER, ER_SMALL_LASER, ER_SMALL_PULSE_LASER, HEAVY_LARGE_LASER, HEAVY_MEDIUM_LASER, HEAVY_SMALL_LASER, LARGE_PULSE_LASER, MEDIUM_LASER, MEDIUM_PULSE_LASER, SMALL_LASER, SMALL_PULSE_LASER, LARGE_LASER } from './energy-weapons-basic-lasers';
import { PPC_WEAPONS, CLAN_ERPPC, IS_ER_PPC, ENHANCED_PPC, HEAVY_PPC, LIGHT_PPC, PPC, SNUB_NOSE_PPC } from './energy-weapons-ppcs';
import { FLAMER_WEAPONS, FLAMER, HEAVY_FLAMER } from './energy-weapons-flamers';
import { DEFENSIVE_WEAPONS, LASER_AMS } from './energy-weapons-defensive';



export const ENERGY_WEAPONS: Equipment[] = [
  ...PPC_WEAPONS,
  ...FLAMER_WEAPONS,
  ...DEFENSIVE_WEAPONS,
  ...BASIC_LASERS
];

// Re-export individual weapons for compatibility
export {
  ER_LARGE_LASER,
  ER_LARGE_PULSE_LASER,
  ER_MEDIUM_LASER,
  ER_MEDIUM_PULSE_LASER,
  ER_SMALL_LASER,
  ER_SMALL_PULSE_LASER,
  HEAVY_LARGE_LASER,
  HEAVY_MEDIUM_LASER,
  HEAVY_SMALL_LASER,
  LARGE_PULSE_LASER,
  MEDIUM_LASER,
  MEDIUM_PULSE_LASER,
  SMALL_LASER,
  SMALL_PULSE_LASER,
  LARGE_LASER
} from './energy-weapons-basic-lasers';

export {
  CLAN_ERPPC,
  IS_ER_PPC,
  ENHANCED_PPC,
  HEAVY_PPC,
  LIGHT_PPC,
  PPC,
  SNUB_NOSE_PPC
} from './energy-weapons-ppcs';

export {
  FLAMER,
  HEAVY_FLAMER
} from './energy-weapons-flamers';

export {
  LASER_AMS
} from './energy-weapons-defensive';
