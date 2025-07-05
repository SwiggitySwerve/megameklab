/**
 * Engine Calculations Utility
 * Centralized calculations for all engine types
 */

import { EngineType } from '../types/systemComponents';
import { calculateInternalHeatSinks } from './heatSinkCalculations';

// Engine weight multipliers with IS/Clan XL differentiation
export const ENGINE_WEIGHT_MULTIPLIERS: Record<EngineType, number> = {
  'Standard': 1.0,
  'XL (IS)': 0.5,
  'XL (Clan)': 0.5,
  'Light': 0.75,
  'XXL': 0.33,
  'Compact': 1.5,
  'ICE': 2.0,
  'Fuel Cell': 1.5
};

// Engine slot requirements with IS/Clan XL differentiation
export const ENGINE_SLOT_REQUIREMENTS: Record<EngineType, { centerTorso: number; leftTorso: number; rightTorso: number }> = {
  'Standard': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
  'XL (IS)': { centerTorso: 6, leftTorso: 3, rightTorso: 3 },    // IS XL: 3 slots per side torso
  'XL (Clan)': { centerTorso: 6, leftTorso: 2, rightTorso: 2 },  // Clan XL: 2 slots per side torso
  'Light': { centerTorso: 6, leftTorso: 2, rightTorso: 2 },
  'XXL': { centerTorso: 6, leftTorso: 6, rightTorso: 6 },
  'Compact': { centerTorso: 3, leftTorso: 0, rightTorso: 0 },
  'ICE': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
  'Fuel Cell': { centerTorso: 6, leftTorso: 0, rightTorso: 0 }
};

// Engine heat sink capacity
export const ENGINE_HEAT_SINKS = {
  FUSION_BASE: 10,
  MIN_RATING_FOR_FULL: 250,
  HEAT_SINKS_PER_25_RATING: 1
};

export interface EngineCalculationResult {
  weight: number;
  totalSlots: number;
  slotDistribution: {
    centerTorso: number;
    leftTorso: number;
    rightTorso: number;
  };
  integratedHeatSinks: number;
}

/**
 * Calculate engine weight based on rating, mech tonnage, and engine type
 */
export function calculateEngineWeight(rating: number, mechTonnage: number, type: EngineType): number {
  const baseWeight = (rating * mechTonnage) / 1000;
  const multiplier = ENGINE_WEIGHT_MULTIPLIERS[type];
  return Math.ceil(baseWeight * multiplier * 2) / 2; // Round to nearest 0.5 ton
}

/**
 * Calculate total engine slots
 */
export function calculateEngineSlots(type: EngineType): number {
  const slots = ENGINE_SLOT_REQUIREMENTS[type];
  return slots.centerTorso + slots.leftTorso + slots.rightTorso;
}

/**
 * Get engine slot distribution by location
 */
export function getEngineSlotDistribution(type: EngineType) {
  return ENGINE_SLOT_REQUIREMENTS[type];
}

/**
 * Calculate integrated heat sinks based on engine rating
 * This represents the theoretical heat sink capacity without engine type limitations
 */
export function calculateIntegratedHeatSinks(engineRating: number, engineType: EngineType): number {
  // Non-fusion engines don't provide heat sinks
  if (engineType === 'ICE' || engineType === 'Fuel Cell') {
    return 0;
  }
  
  // All fusion engines follow the basic rule: rating ÷ 25, NO ARTIFICIAL MINIMUM
  return calculateInternalHeatSinks(engineRating);
}

/**
 * Get all engine calculations
 */
export function getEngineCalculations(
  rating: number, 
  mechTonnage: number, 
  type: EngineType
): EngineCalculationResult {
  return {
    weight: calculateEngineWeight(rating, mechTonnage, type),
    totalSlots: calculateEngineSlots(type),
    slotDistribution: getEngineSlotDistribution(type),
    integratedHeatSinks: calculateIntegratedHeatSinks(rating, type)
  };
}

/**
 * Validate engine rating for mech tonnage
 */
export function validateEngineRating(rating: number, mechTonnage: number, maxWalkMP: number = 20): boolean {
  const walkMP = Math.floor(rating / mechTonnage);
  return walkMP >= 1 && walkMP <= maxWalkMP;
}

/**
 * Calculate walk MP from engine rating and tonnage
 */
export function calculateWalkMP(engineRating: number, mechTonnage: number): number {
  return Math.floor(engineRating / mechTonnage);
}

/**
 * Calculate required engine rating for desired walk MP
 */
export function calculateRequiredEngineRating(walkMP: number, mechTonnage: number): number {
  return walkMP * mechTonnage;
}
