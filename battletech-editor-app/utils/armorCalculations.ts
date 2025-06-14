/**
 * Armor Calculations Utility
 * Centralized calculations for all armor types
 */

import { ArmorType } from '../types/systemComponents';

// Armor points per ton for each armor type
export const ARMOR_POINTS_PER_TON: Record<ArmorType, number> = {
  'Standard': 16,
  'Ferro-Fibrous': 17.92,  // 12% more than standard
  'Ferro-Fibrous (Clan)': 19.2,  // 20% more than standard
  'Light Ferro-Fibrous': 18.56,  // 16% more than standard
  'Heavy Ferro-Fibrous': 19.2,   // 20% more than standard
  'Stealth': 16,  // Same as standard but requires ECM
  'Reactive': 14.4,  // 10% less than standard
  'Reflective': 14.4,  // 10% less than standard
  'Hardened': 8  // 50% of standard
};

// Armor critical slot requirements
export const ARMOR_SLOT_REQUIREMENTS: Record<ArmorType, { slots: number; clanSlots?: number }> = {
  'Standard': { slots: 0 },
  'Ferro-Fibrous': { slots: 14, clanSlots: 7 },
  'Ferro-Fibrous (Clan)': { slots: 7 },
  'Light Ferro-Fibrous': { slots: 7 },
  'Heavy Ferro-Fibrous': { slots: 21 },
  'Stealth': { slots: 12 },  // Plus requires ECM suite
  'Reactive': { slots: 14 },
  'Reflective': { slots: 10 },
  'Hardened': { slots: 0 }
};

// Armor technology restrictions
export const ARMOR_TECH_RESTRICTIONS: Record<ArmorType, {
  techBase: ('Inner Sphere' | 'Clan' | 'Both')[];
  rulesLevel: ('Standard' | 'Tournament' | 'Advanced' | 'Experimental')[];
  additionalRequirements?: string[];
}> = {
  'Standard': { 
    techBase: ['Inner Sphere', 'Clan', 'Both'], 
    rulesLevel: ['Standard', 'Tournament', 'Advanced', 'Experimental'] 
  },
  'Ferro-Fibrous': { 
    techBase: ['Inner Sphere', 'Both'], 
    rulesLevel: ['Tournament', 'Advanced', 'Experimental'] 
  },
  'Ferro-Fibrous (Clan)': { 
    techBase: ['Clan'], 
    rulesLevel: ['Tournament', 'Advanced', 'Experimental'] 
  },
  'Light Ferro-Fibrous': { 
    techBase: ['Inner Sphere', 'Both'], 
    rulesLevel: ['Advanced', 'Experimental'] 
  },
  'Heavy Ferro-Fibrous': { 
    techBase: ['Inner Sphere', 'Both'], 
    rulesLevel: ['Experimental'] 
  },
  'Stealth': { 
    techBase: ['Inner Sphere'], 
    rulesLevel: ['Advanced', 'Experimental'],
    additionalRequirements: ['Guardian ECM Suite']
  },
  'Reactive': { 
    techBase: ['Inner Sphere', 'Both'], 
    rulesLevel: ['Advanced', 'Experimental'] 
  },
  'Reflective': { 
    techBase: ['Inner Sphere', 'Both'], 
    rulesLevel: ['Advanced', 'Experimental'] 
  },
  'Hardened': { 
    techBase: ['Both'], 
    rulesLevel: ['Advanced', 'Experimental'] 
  }
};

// Special armor properties
export const ARMOR_SPECIAL_PROPERTIES: Record<ArmorType, {
  damageReduction?: number;
  energyDamageReduction?: number;
  ballisticDamageReduction?: number;
  criticalHitModifier?: number;
  weightMultiplier?: number;
}> = {
  'Standard': {},
  'Ferro-Fibrous': {},
  'Ferro-Fibrous (Clan)': {},
  'Light Ferro-Fibrous': {},
  'Heavy Ferro-Fibrous': {},
  'Stealth': {},
  'Reactive': { ballisticDamageReduction: 0.5 },
  'Reflective': { energyDamageReduction: 0.5 },
  'Hardened': { damageReduction: 0.5, criticalHitModifier: -2 }
};

export interface ArmorCalculationResult {
  weight: number;
  slots: number;
  maxPoints: number;
  pointsPerTon: number;
  isValid: boolean;
  specialProperties: typeof ARMOR_SPECIAL_PROPERTIES[ArmorType];
}

/**
 * Calculate armor weight based on points and armor type
 */
export function calculateArmorWeight(armorPoints: number, type: ArmorType): number {
  const pointsPerTon = ARMOR_POINTS_PER_TON[type];
  const weight = armorPoints / pointsPerTon;
  return Math.ceil(weight * 2) / 2; // Round to nearest 0.5 ton
}

/**
 * Get armor slot requirements
 */
export function getArmorSlots(type: ArmorType, techBase?: 'Inner Sphere' | 'Clan'): number {
  const requirements = ARMOR_SLOT_REQUIREMENTS[type];
  
  // Special handling for Ferro-Fibrous which has different requirements for IS vs Clan
  if (type === 'Ferro-Fibrous' && techBase === 'Clan' && requirements.clanSlots !== undefined) {
    return requirements.clanSlots;
  }
  
  return requirements.slots;
}

/**
 * Calculate maximum armor points for a given tonnage
 */
export function calculateMaxArmorForTonnage(tonnage: number, type: ArmorType): number {
  const pointsPerTon = ARMOR_POINTS_PER_TON[type];
  return Math.floor(tonnage * pointsPerTon);
}

/**
 * Get armor points per location based on allocation
 */
export function distributeArmorPoints(
  totalPoints: number,
  distribution: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  const totalPercentage = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  
  Object.entries(distribution).forEach(([location, percentage]) => {
    result[location] = Math.floor((totalPoints * percentage) / totalPercentage);
  });
  
  return result;
}

/**
 * Validate armor type for tech base and rules level
 */
export function validateArmorType(
  type: ArmorType,
  techBase: 'Inner Sphere' | 'Clan' | 'Both',
  rulesLevel: string,
  hasRequiredEquipment?: string[]
): boolean {
  const restrictions = ARMOR_TECH_RESTRICTIONS[type];
  if (!restrictions) return false;
  
  const validTechBase = restrictions.techBase.includes(techBase) || restrictions.techBase.includes('Both');
  const validRulesLevel = restrictions.rulesLevel.includes(rulesLevel as any);
  
  // Check additional requirements (like ECM for Stealth armor)
  let meetsAdditionalReqs = true;
  if (restrictions.additionalRequirements && restrictions.additionalRequirements.length > 0) {
    meetsAdditionalReqs = restrictions.additionalRequirements.every(req => 
      hasRequiredEquipment?.includes(req) || false
    );
  }
  
  return validTechBase && validRulesLevel && meetsAdditionalReqs;
}

/**
 * Get special properties for armor type
 */
export function getArmorSpecialProperties(type: ArmorType) {
  return ARMOR_SPECIAL_PROPERTIES[type] || {};
}

/**
 * Calculate armor coverage percentage
 */
export function calculateArmorCoverage(
  currentArmorPoints: number,
  maxArmorPoints: number
): number {
  if (maxArmorPoints === 0) return 0;
  return Math.round((currentArmorPoints / maxArmorPoints) * 100);
}

/**
 * Get all armor calculations
 */
export function getArmorCalculations(
  armorPoints: number,
  type: ArmorType,
  techBase?: 'Inner Sphere' | 'Clan'
): ArmorCalculationResult {
  return {
    weight: calculateArmorWeight(armorPoints, type),
    slots: getArmorSlots(type, techBase),
    maxPoints: 0, // Would need structure info to calculate
    pointsPerTon: ARMOR_POINTS_PER_TON[type],
    isValid: true,
    specialProperties: getArmorSpecialProperties(type)
  };
}
