/**
 * Gyro Calculations Utility
 * Centralized calculations for all gyro types
 */

import { GyroType } from '../types/systemComponents';

// Gyro weight multipliers
export const GYRO_WEIGHT_MULTIPLIERS: Record<GyroType, number> = {
  'Standard': 1.0,
  'Compact': 1.5,
  'Heavy-Duty': 2.0,
  'XL': 0.5
};

// Gyro critical slot requirements
export const GYRO_SLOT_REQUIREMENTS: Record<GyroType, number> = {
  'Standard': 4,
  'Compact': 2,
  'Heavy-Duty': 4,
  'XL': 6
};

// Gyro technology restrictions
export const GYRO_TECH_RESTRICTIONS: Record<GyroType, {
  techBase: ('Inner Sphere' | 'Clan' | 'Both')[];
  rulesLevel: ('Standard' | 'Tournament' | 'Advanced' | 'Experimental')[];
}> = {
  'Standard': { 
    techBase: ['Inner Sphere', 'Clan', 'Both'], 
    rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental'] 
  },
  'Compact': { 
    techBase: ['Both'], 
    rulesLevel: ['Advanced', 'Experimental'] 
  },
  'Heavy-Duty': { 
    techBase: ['Both'], 
    rulesLevel: ['Tournament', 'Advanced', 'Experimental'] 
  },
  'XL': { 
    techBase: ['Both'], 
    rulesLevel: ['Advanced', 'Experimental'] 
  }
};

// Gyro special properties
export const GYRO_SPECIAL_PROPERTIES: Record<GyroType, {
  hitPointsModifier?: number;
  pilotingModifier?: number;
  criticalHitPenalty?: number;
}> = {
  'Standard': {},
  'Compact': {},
  'Heavy-Duty': { 
    hitPointsModifier: 2, // Can take 2 critical hits instead of 1
    pilotingModifier: -1  // Easier piloting
  },
  'XL': { 
    criticalHitPenalty: 1 // More vulnerable to criticals
  }
};

export interface GyroCalculationResult {
  weight: number;
  slots: number;
  isValid: boolean;
  specialProperties: typeof GYRO_SPECIAL_PROPERTIES[GyroType];
}

/**
 * Calculate gyro weight based on engine rating and gyro type
 */
export function calculateGyroWeight(engineRating: number, type: GyroType): number {
  // Handle edge cases
  if (engineRating <= 0) return 0;
  
  // Gyro weight is based on engine rating (1 ton per 100 rating, rounded up)
  const baseWeight = Math.ceil(engineRating / 100);
  const multiplier = GYRO_WEIGHT_MULTIPLIERS[type];
  return baseWeight * multiplier;
}

/**
 * Get gyro slot requirements
 */
export function getGyroSlots(type: GyroType): number {
  return GYRO_SLOT_REQUIREMENTS[type];
}

/**
 * Validate gyro type for tech base and rules level
 */
export function validateGyroType(
  type: GyroType,
  techBase: 'Inner Sphere' | 'Clan' | 'Both',
  rulesLevel: string
): boolean {
  const restrictions = GYRO_TECH_RESTRICTIONS[type];
  if (!restrictions) return false;
  
  const validTechBase = restrictions.techBase.includes(techBase) || restrictions.techBase.includes('Both');
  // Type-safe rules level validation
  const validRulesLevels = ['Standard', 'Tournament', 'Advanced', 'Experimental'] as const;
  const safeRulesLevel = validRulesLevels.includes(rulesLevel as any) ? rulesLevel as 'Standard' | 'Tournament' | 'Advanced' | 'Experimental' : 'Standard';
  const validRulesLevel = restrictions.rulesLevel.includes(safeRulesLevel);
  
  return validTechBase && validRulesLevel;
}

/**
 * Get special properties for gyro type
 */
export function getGyroSpecialProperties(type: GyroType) {
  return GYRO_SPECIAL_PROPERTIES[type] || {};
}

/**
 * Check if gyro type supports torso-mounted cockpit
 */
export function supportsTorsoMountedCockpit(type: GyroType): boolean {
  // Torso-mounted cockpits are incompatible with XL gyros
  return type !== 'XL';
}

/**
 * Calculate gyro location (always center torso)
 */
export function getGyroLocation(): string {
  return 'Center Torso';
}

/**
 * Get all gyro calculations
 */
export function getGyroCalculations(
  engineRating: number,
  type: GyroType
): GyroCalculationResult {
  return {
    weight: calculateGyroWeight(engineRating, type),
    slots: getGyroSlots(type),
    isValid: true,
    specialProperties: getGyroSpecialProperties(type)
  };
}

/**
 * Calculate minimum engine rating for gyro
 * (Gyros need at least 100 rating to function)
 */
export function getMinimumEngineRating(): number {
  return 100;
}
