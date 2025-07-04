import { Equipment } from '../types';

// Import all missile weapon families
export * from './lrm';
export * from './srm';
// TODO: Uncomment once these files are populated
// export * from './streak';
// export * from './atm';
// export * from './mml';
// export * from './thunderbolt';
// export * from './mrm';

// Import individual weapons for aggregation
import {
  ENHANCED_LRM_10,
  ENHANCED_LRM_5,
  EXTENDED_LRM_10,
  EXTENDED_LRM_15,
  EXTENDED_LRM_20,
  IMPROVED_LRM_15,
  IMPROVED_LRM_20,
  LRM_10,
  LRM_15,
  LRM_20,
  LRM_5
} from './lrm';

import {
  IMPROVED_SRM_6,
  SRM_2,
  SRM_4,
  SRM_6
} from './srm';

// TODO: Import from other family files once they are populated
// import { ... } from './streak';
// import { ... } from './atm';
// import { ... } from './mml';
// import { ... } from './thunderbolt';
// import { ... } from './mrm';

// Aggregate all missile weapons
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
  // TODO: Add Streak variants, ATM systems, IATM systems, MML systems, Thunderbolt missiles, MRM systems
  // once their respective files are populated
]; 