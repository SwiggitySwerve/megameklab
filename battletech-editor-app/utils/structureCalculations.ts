/**
 * Structure Calculations Utility
 * Centralized calculations for all structure types
 */

import { StructureType } from '../types/systemComponents';

// Structure weight multipliers (as percentage of mech tonnage)
export const STRUCTURE_WEIGHT_MULTIPLIERS: Record<StructureType, number> = {
  'Standard': 0.10,
  'Endo Steel': 0.05,
  'Endo Steel (Clan)': 0.05,
  'Composite': 0.05,
  'Reinforced': 0.20,
  'Industrial': 0.15
};

// Structure critical slot requirements
export const STRUCTURE_SLOT_REQUIREMENTS: Record<StructureType, number> = {
  'Standard': 0,
  'Endo Steel': 14,
  'Endo Steel (Clan)': 7,
  'Composite': 0,
  'Reinforced': 0,
  'Industrial': 0
};

// Structure technology restrictions
export const STRUCTURE_TECH_RESTRICTIONS: Record<StructureType, {
  techBase: ('Inner Sphere' | 'Clan' | 'Both')[];
  rulesLevel: ('Standard' | 'Tournament' | 'Advanced' | 'Experimental')[];
}> = {
  'Standard': { techBase: ['Inner Sphere', 'Clan', 'Both'], rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental'] },
  'Endo Steel': { techBase: ['Inner Sphere', 'Both'], rulesLevel: ['Tournament', 'Advanced', 'Experimental'] },
  'Endo Steel (Clan)': { techBase: ['Clan'], rulesLevel: ['Tournament', 'Advanced', 'Experimental'] },
  'Composite': { techBase: ['Both'], rulesLevel: ['Experimental'] },
  'Reinforced': { techBase: ['Both'], rulesLevel: ['Advanced', 'Experimental'] },
  'Industrial': { techBase: ['Both'], rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental'] }
};

export interface StructureCalculationResult {
  weight: number;
  slots: number;
  isValid: boolean;
  maxArmor: number;
}

/**
 * Calculate structure weight based on mech tonnage and structure type
 */
export function calculateStructureWeight(mechTonnage: number, type: StructureType): number {
  const multiplier = STRUCTURE_WEIGHT_MULTIPLIERS[type];
  const weight = mechTonnage * multiplier;
  return Math.ceil(weight * 2) / 2; // Round to nearest 0.5 ton
}

/**
 * Get structure slot requirements
 */
export function getStructureSlots(type: StructureType): number {
  return STRUCTURE_SLOT_REQUIREMENTS[type];
}

/**
 * Calculate maximum armor points based on structure type and tonnage
 */
export function calculateMaxArmorPoints(mechTonnage: number, type: StructureType): number {
  // Standard calculation: 2 points per ton of internal structure
  const internalStructure = getInternalStructurePoints(mechTonnage);
  
  // Most structures allow 2x internal structure
  let multiplier = 2;
  
  // Hardened and some other types may have different limits
  if (type === 'Industrial') {
    multiplier = 1.5; // Industrial mechs have less armor capacity
  }
  
  return Math.floor(internalStructure * multiplier);
}

/**
 * Get internal structure points by location
 */
export function getInternalStructureByLocation(mechTonnage: number): Record<string, number> {
  // This is a simplified version - actual values come from a table
  const structureTable: Record<number, Record<string, number>> = {
    20: { head: 3, centerTorso: 6, leftTorso: 5, rightTorso: 5, leftArm: 3, rightArm: 3, leftLeg: 4, rightLeg: 4 },
    25: { head: 3, centerTorso: 8, leftTorso: 6, rightTorso: 6, leftArm: 4, rightArm: 4, leftLeg: 6, rightLeg: 6 },
    30: { head: 3, centerTorso: 10, leftTorso: 7, rightTorso: 7, leftArm: 5, rightArm: 5, leftLeg: 7, rightLeg: 7 },
    35: { head: 3, centerTorso: 11, leftTorso: 8, rightTorso: 8, leftArm: 6, rightArm: 6, leftLeg: 8, rightLeg: 8 },
    40: { head: 3, centerTorso: 12, leftTorso: 10, rightTorso: 10, leftArm: 6, rightArm: 6, leftLeg: 10, rightLeg: 10 },
    45: { head: 3, centerTorso: 14, leftTorso: 11, rightTorso: 11, leftArm: 7, rightArm: 7, leftLeg: 11, rightLeg: 11 },
    50: { head: 3, centerTorso: 16, leftTorso: 12, rightTorso: 12, leftArm: 8, rightArm: 8, leftLeg: 12, rightLeg: 12 },
    55: { head: 3, centerTorso: 18, leftTorso: 13, rightTorso: 13, leftArm: 9, rightArm: 9, leftLeg: 13, rightLeg: 13 },
    60: { head: 3, centerTorso: 20, leftTorso: 14, rightTorso: 14, leftArm: 10, rightArm: 10, leftLeg: 14, rightLeg: 14 },
    65: { head: 3, centerTorso: 21, leftTorso: 15, rightTorso: 15, leftArm: 10, rightArm: 10, leftLeg: 15, rightLeg: 15 },
    70: { head: 3, centerTorso: 22, leftTorso: 15, rightTorso: 15, leftArm: 11, rightArm: 11, leftLeg: 15, rightLeg: 15 },
    75: { head: 3, centerTorso: 23, leftTorso: 16, rightTorso: 16, leftArm: 12, rightArm: 12, leftLeg: 16, rightLeg: 16 },
    80: { head: 3, centerTorso: 25, leftTorso: 17, rightTorso: 17, leftArm: 13, rightArm: 13, leftLeg: 17, rightLeg: 17 },
    85: { head: 3, centerTorso: 27, leftTorso: 18, rightTorso: 18, leftArm: 14, rightArm: 14, leftLeg: 18, rightLeg: 18 },
    90: { head: 3, centerTorso: 29, leftTorso: 19, rightTorso: 19, leftArm: 15, rightArm: 15, leftLeg: 19, rightLeg: 19 },
    95: { head: 3, centerTorso: 30, leftTorso: 20, rightTorso: 20, leftArm: 16, rightArm: 16, leftLeg: 20, rightLeg: 20 },
    100: { head: 3, centerTorso: 31, leftTorso: 21, rightTorso: 21, leftArm: 17, rightArm: 17, leftLeg: 21, rightLeg: 21 }
  };
  
  return structureTable[mechTonnage] || structureTable[100];
}

/**
 * Get total internal structure points for a mech
 */
export function getInternalStructurePoints(mechTonnage: number): number {
  const byLocation = getInternalStructureByLocation(mechTonnage);
  return Object.values(byLocation).reduce((sum, value) => sum + value, 0);
}

/**
 * Validate structure type for tech base and rules level
 */
export function validateStructureType(
  type: StructureType, 
  techBase: 'Inner Sphere' | 'Clan' | 'Both',
  rulesLevel: string
): boolean {
  const restrictions = STRUCTURE_TECH_RESTRICTIONS[type];
  if (!restrictions) return false;
  
  const validTechBase = restrictions.techBase.includes(techBase) || restrictions.techBase.includes('Both');
  const validRulesLevel = restrictions.rulesLevel.includes(rulesLevel as any);
  
  return validTechBase && validRulesLevel;
}

/**
 * Get all structure calculations
 */
export function getStructureCalculations(
  mechTonnage: number,
  type: StructureType
): StructureCalculationResult {
  return {
    weight: calculateStructureWeight(mechTonnage, type),
    slots: getStructureSlots(type),
    isValid: true, // Could add validation logic here
    maxArmor: calculateMaxArmorPoints(mechTonnage, type)
  };
}
