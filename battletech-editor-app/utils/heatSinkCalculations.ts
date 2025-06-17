/**
 * Heat Sink Calculations Utility
 * Centralized calculations for all heat sink types with IS/Clan differentiation
 */

import { HeatSinkType } from '../types/systemComponents';

// Heat sink specifications with IS/Clan differentiation
export const HEAT_SINK_SPECIFICATIONS: Record<HeatSinkType, {
  dissipation: number;
  weight: number;
  criticalSlots: number;
  techBase: 'Inner Sphere' | 'Clan' | 'Both';
  costMultiplier: number;
}> = {
  'Single': {
    dissipation: 1,
    weight: 1,
    criticalSlots: 1,
    techBase: 'Both',
    costMultiplier: 1.0
  },
  'Double (IS)': {
    dissipation: 2,
    weight: 1,
    criticalSlots: 3,  // IS Double Heat Sinks use 3 critical slots
    techBase: 'Inner Sphere',
    costMultiplier: 6.0
  },
  'Double (Clan)': {
    dissipation: 2,
    weight: 1,
    criticalSlots: 2,  // Clan Double Heat Sinks use 2 critical slots
    techBase: 'Clan',
    costMultiplier: 6.0
  },
  'Compact': {
    dissipation: 1,
    weight: 1,
    criticalSlots: 1,
    techBase: 'Both',
    costMultiplier: 3.0
  },
  'Laser': {
    dissipation: 2,
    weight: 1,
    criticalSlots: 2,
    techBase: 'Both',
    costMultiplier: 6.0
  }
};

export interface HeatSinkCalculationResult {
  totalWeight: number;
  totalSlots: number;
  totalDissipation: number;
  engineIntegrated: number;
  externalRequired: number;
  externalWeight: number;
  externalSlots: number;
}

/**
 * Get heat sink specification
 */
export function getHeatSinkSpecification(type: HeatSinkType) {
  return HEAT_SINK_SPECIFICATIONS[type];
}

/**
 * Calculate integrated heat sinks based on engine rating
 */
export function calculateIntegratedHeatSinks(engineRating: number): number {
  // Fusion engines include 10 heat sinks for ratings 250+
  if (engineRating >= 250) {
    return 10;
  }
  // Smaller engines get fewer integrated heat sinks
  return Math.floor(engineRating / 25);
}

/**
 * Calculate external heat sink requirements
 */
export function calculateExternalHeatSinks(
  totalRequired: number,
  engineRating: number
): number {
  const integrated = calculateIntegratedHeatSinks(engineRating);
  return Math.max(0, totalRequired - integrated);
}

/**
 * Calculate heat sink weight (external only - integrated are free)
 */
export function calculateHeatSinkWeight(
  externalCount: number,
  type: HeatSinkType
): number {
  const spec = HEAT_SINK_SPECIFICATIONS[type];
  return externalCount * spec.weight;
}

/**
 * Calculate heat sink critical slots (external only)
 */
export function calculateHeatSinkSlots(
  externalCount: number,
  type: HeatSinkType
): number {
  const spec = HEAT_SINK_SPECIFICATIONS[type];
  return externalCount * spec.criticalSlots;
}

/**
 * Calculate total heat dissipation
 */
export function calculateHeatDissipation(
  totalHeatSinks: number,
  type: HeatSinkType
): number {
  const spec = HEAT_SINK_SPECIFICATIONS[type];
  return totalHeatSinks * spec.dissipation;
}

/**
 * Get comprehensive heat sink calculations
 */
export function getHeatSinkCalculations(
  totalRequired: number,
  engineRating: number,
  type: HeatSinkType
): HeatSinkCalculationResult {
  const spec = HEAT_SINK_SPECIFICATIONS[type];
  const engineIntegrated = calculateIntegratedHeatSinks(engineRating);
  const externalRequired = Math.max(0, totalRequired - engineIntegrated);
  
  return {
    totalWeight: calculateHeatSinkWeight(externalRequired, type),
    totalSlots: calculateHeatSinkSlots(externalRequired, type),
    totalDissipation: calculateHeatDissipation(totalRequired, type),
    engineIntegrated,
    externalRequired,
    externalWeight: externalRequired * spec.weight,
    externalSlots: externalRequired * spec.criticalSlots
  };
}

/**
 * Validate heat sink type compatibility with tech base
 */
export function validateHeatSinkCompatibility(
  heatSinkType: HeatSinkType,
  techBase: 'Inner Sphere' | 'Clan'
): { isCompatible: boolean; reason?: string } {
  const spec = HEAT_SINK_SPECIFICATIONS[heatSinkType];
  
  if (spec.techBase === 'Both') {
    return { isCompatible: true };
  }
  
  if (spec.techBase === techBase) {
    return { isCompatible: true };
  }
  
  return {
    isCompatible: false,
    reason: `${heatSinkType} heat sinks are ${spec.techBase} technology, incompatible with ${techBase} chassis`
  };
}

/**
 * Get available heat sink types for tech base
 */
export function getAvailableHeatSinkTypes(techBase: 'Inner Sphere' | 'Clan'): HeatSinkType[] {
  return Object.entries(HEAT_SINK_SPECIFICATIONS)
    .filter(([_, spec]) => spec.techBase === 'Both' || spec.techBase === techBase)
    .map(([type, _]) => type as HeatSinkType);
}

/**
 * Compare heat sink efficiency (dissipation per slot)
 */
export function compareHeatSinkEfficiency(type1: HeatSinkType, type2: HeatSinkType): {
  type1Efficiency: number;
  type2Efficiency: number;
  betterChoice: HeatSinkType;
} {
  const spec1 = HEAT_SINK_SPECIFICATIONS[type1];
  const spec2 = HEAT_SINK_SPECIFICATIONS[type2];
  
  const efficiency1 = spec1.dissipation / spec1.criticalSlots;
  const efficiency2 = spec2.dissipation / spec2.criticalSlots;
  
  return {
    type1Efficiency: efficiency1,
    type2Efficiency: efficiency2,
    betterChoice: efficiency1 >= efficiency2 ? type1 : type2
  };
}
