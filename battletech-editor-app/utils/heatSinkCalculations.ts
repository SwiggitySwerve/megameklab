/**
 * Heat Sink Calculations Utility
 * Centralized calculations for all heat sink types
 */

import { HeatSinkType } from '../types/systemComponents';

// Heat dissipation per heat sink
export const HEAT_DISSIPATION_RATES: Record<HeatSinkType, number> = {
  'Single': 1,
  'Double': 2,
  'Double (Clan)': 2,
  'Compact': 1,
  'Laser': 1  // Special: only dissipates energy weapon heat
};

// Heat sink weight (tons per heat sink)
export const HEAT_SINK_WEIGHTS: Record<HeatSinkType, number> = {
  'Single': 1,
  'Double': 1,
  'Double (Clan)': 1,
  'Compact': 0.5,
  'Laser': 0.5
};

// Heat sink critical slot requirements
export const HEAT_SINK_SLOT_REQUIREMENTS: Record<HeatSinkType, number> = {
  'Single': 1,
  'Double': 3,      // IS Double Heat Sinks
  'Double (Clan)': 2,  // Clan Double Heat Sinks
  'Compact': 1,
  'Laser': 1
};

// Heat sink technology restrictions
export const HEAT_SINK_TECH_RESTRICTIONS: Record<HeatSinkType, {
  techBase: ('Inner Sphere' | 'Clan' | 'Both')[];
  rulesLevel: ('Standard' | 'Tournament' | 'Advanced' | 'Experimental')[];
  engineTypes?: string[];  // Compatible engine types
}> = {
  'Single': { 
    techBase: ['Inner Sphere', 'Clan', 'Both'], 
    rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental'] 
  },
  'Double': { 
    techBase: ['Inner Sphere', 'Both'], 
    rulesLevel: ['Tournament', 'Advanced', 'Experimental'] 
  },
  'Double (Clan)': { 
    techBase: ['Clan'], 
    rulesLevel: ['Tournament', 'Advanced', 'Experimental'] 
  },
  'Compact': { 
    techBase: ['Both'], 
    rulesLevel: ['Experimental'] 
  },
  'Laser': { 
    techBase: ['Both'], 
    rulesLevel: ['Experimental'] 
  }
};

// Special properties for heat sink types
export const HEAT_SINK_SPECIAL_PROPERTIES: Record<HeatSinkType, {
  integratedSlots?: number;  // Slots when integrated in engine
  maxIntegrated?: number;    // Maximum that can be integrated
  energyOnly?: boolean;      // Only dissipates energy weapon heat
}> = {
  'Single': {
    integratedSlots: 0,  // No slots when integrated
    maxIntegrated: 10
  },
  'Double': {
    integratedSlots: 2,  // Takes 2 slots even when integrated (IS)
    maxIntegrated: 10
  },
  'Double (Clan)': {
    integratedSlots: 0,  // No slots when integrated (Clan)
    maxIntegrated: 10
  },
  'Compact': {
    integratedSlots: 0,
    maxIntegrated: 10
  },
  'Laser': {
    integratedSlots: 0,
    maxIntegrated: 0,    // Cannot be integrated
    energyOnly: true
  }
};

export interface HeatSinkCalculationResult {
  totalWeight: number;
  totalSlots: number;
  engineIntegrated: number;
  engineIntegratedSlots: number;
  externalRequired: number;
  externalSlots: number;
  totalDissipation: number;
  isValid: boolean;
}

/**
 * Calculate heat sink weight
 */
export function calculateHeatSinkWeight(count: number, type: HeatSinkType): number {
  return count * HEAT_SINK_WEIGHTS[type];
}

/**
 * Calculate heat sink slots (external only)
 */
export function calculateHeatSinkSlots(count: number, type: HeatSinkType): number {
  return count * HEAT_SINK_SLOT_REQUIREMENTS[type];
}

/**
 * Calculate integrated heat sink slots
 */
export function calculateIntegratedHeatSinkSlots(
  integratedCount: number, 
  type: HeatSinkType
): number {
  const properties = HEAT_SINK_SPECIAL_PROPERTIES[type];
  return integratedCount * (properties?.integratedSlots || 0);
}

/**
 * Calculate heat dissipation
 */
export function calculateHeatDissipation(count: number, type: HeatSinkType): number {
  return count * HEAT_DISSIPATION_RATES[type];
}

/**
 * Calculate how many heat sinks can be integrated
 */
export function calculateMaxIntegratedHeatSinks(
  engineRating: number,
  engineType: string,
  heatSinkType: HeatSinkType
): number {
  // Non-fusion engines don't provide integrated heat sinks
  if (engineType === 'ICE' || engineType === 'Fuel Cell') {
    return 0;
  }
  
  // Laser heat sinks cannot be integrated
  const properties = HEAT_SINK_SPECIAL_PROPERTIES[heatSinkType];
  if (properties?.maxIntegrated === 0) {
    return 0;
  }
  
  // Standard calculation: up to 10 heat sinks can be integrated
  // For engines under 250, it's rating / 25
  if (engineRating >= 250) {
    return 10;
  }
  
  return Math.floor(engineRating / 25);
}

/**
 * Validate heat sink type for tech base and rules level
 */
export function validateHeatSinkType(
  type: HeatSinkType,
  techBase: 'Inner Sphere' | 'Clan' | 'Both',
  rulesLevel: string,
  engineType?: string
): boolean {
  const restrictions = HEAT_SINK_TECH_RESTRICTIONS[type];
  if (!restrictions) return false;
  
  const validTechBase = restrictions.techBase.includes(techBase) || restrictions.techBase.includes('Both');
  const validRulesLevel = restrictions.rulesLevel.includes(rulesLevel as any);
  
  // Check engine compatibility if specified
  let engineCompatible = true;
  if (restrictions.engineTypes && engineType) {
    engineCompatible = restrictions.engineTypes.includes(engineType);
  }
  
  return validTechBase && validRulesLevel && engineCompatible;
}

/**
 * Get special properties for heat sink type
 */
export function getHeatSinkSpecialProperties(type: HeatSinkType) {
  return HEAT_SINK_SPECIAL_PROPERTIES[type] || {};
}

/**
 * Calculate all heat sink values
 */
export function getHeatSinkCalculations(
  totalCount: number,
  type: HeatSinkType,
  engineRating: number,
  engineType: string
): HeatSinkCalculationResult {
  const maxIntegrated = calculateMaxIntegratedHeatSinks(engineRating, engineType, type);
  const engineIntegrated = Math.min(totalCount, maxIntegrated);
  const externalRequired = Math.max(0, totalCount - engineIntegrated);
  
  const engineIntegratedSlots = calculateIntegratedHeatSinkSlots(engineIntegrated, type);
  const externalSlots = calculateHeatSinkSlots(externalRequired, type);
  
  return {
    totalWeight: calculateHeatSinkWeight(totalCount, type),
    totalSlots: engineIntegratedSlots + externalSlots,
    engineIntegrated,
    engineIntegratedSlots,
    externalRequired,
    externalSlots,
    totalDissipation: calculateHeatDissipation(totalCount, type),
    isValid: true
  };
}

/**
 * Calculate required heat sinks based on heat generation
 */
export function calculateRequiredHeatSinks(
  heatGenerated: number,
  type: HeatSinkType,
  safetyMargin: number = 0
): number {
  const dissipationRate = HEAT_DISSIPATION_RATES[type];
  const requiredDissipation = heatGenerated + safetyMargin;
  return Math.ceil(requiredDissipation / dissipationRate);
}

/**
 * Check if heat sink configuration is valid
 */
export function validateHeatSinkConfiguration(
  totalCount: number,
  engineRating: number
): boolean {
  // Mechs must have at least 10 heat sinks
  if (totalCount < 10) {
    return false;
  }
  
  // Additional validation could go here
  return true;
}
