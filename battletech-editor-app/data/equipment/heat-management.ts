import { Equipment } from './types';

export const DOUBLE_HEAT_SINK: Equipment = {
  id: 'double_heat_sink',
  name: 'Double Heat Sink',
  category: 'Heat Management',
  baseType: 'heat_sink',
  description: 'Advanced heat sink with double heat dissipation',
  requiresAmmo: false,
  introductionYear: 2824,
  rulesLevel: 'Standard',
  variants: {
    Clan: {
      weight: 1,
      crits: 1,
      heat: -1,
      minRange: 0,
      cost: 6000,
      battleValue: 0
    },
    IS: {
      weight: 1,
      crits: 1,
      heat: -1,
      minRange: 0,
      cost: 6000,
      battleValue: 0
    }
  }
};

export const HEAT_MANAGEMENT: Equipment[] = [
  DOUBLE_HEAT_SINK
];
