/**
 * BattleTech Construction Calculations Service - Handles all BattleTech construction rule calculations
 * Provides weight calculations, tonnage limits, armor calculations, and construction validation
 * Following SOLID principles - Single Responsibility for construction calculations
 */

import { UnitConfiguration } from '../configuration/UnitConfigurationService';

export interface WeightValidationResult {
  isValid: boolean;
  overweight: number;
  warnings: string[];
}

export interface ArmorCalculationResult {
  totalArmorPoints: number;
  allocatedArmorPoints: number;
  availableArmorPoints: number;
  unallocatedArmorPoints: number;
  maxArmorPoints: number;
  maxArmorTonnage: number;
  armorEfficiency: number;
}

export interface TonnageBreakdown {
  structure: number;
  engine: number;
  gyro: number;
  cockpit: number;
  heatSinks: number;
  jumpJets: number;
  armor: number;
  equipment: number;
  total: number;
  remaining: number;
}

export interface InternalStructurePoints {
  HD: number;
  CT: number;
  LT: number;
  RT: number;
  LA: number;
  RA: number;
  LL: number;
  RL: number;
}

export interface HeatManagementCalculation {
  totalHeatSinks: number;
  internalHeatSinks: number;
  externalHeatSinks: number;
  heatDissipation: number;
  heatGeneration: number;
  heatBalance: number;
  heatSinkEfficiency: number;
}

/**
 * BattleTech Construction Calculations Service
 * Provides all calculation methods for BattleTech construction rules and limits
 */
export class BattleTechConstructionCalculations {
  
  constructor() {
    console.log('[BattleTechConstructionCalculations] Service initialized');
  }
  
  /**
   * Get complete tonnage breakdown for a unit
   */
  getTonnageBreakdown(configuration: UnitConfiguration, equipmentWeight: number = 0): TonnageBreakdown {
    const structure = this.getStructureWeight(configuration);
    const engine = this.getEngineWeight(configuration);
    const gyro = this.getGyroWeight(configuration);
    const cockpit = this.getCockpitWeight(configuration);
    const heatSinks = this.getHeatSinkWeight(configuration);
    const jumpJets = this.getJumpJetWeight(configuration);
    const armor = configuration.armorTonnage;
    const equipment = equipmentWeight;
    
    const total = structure + engine + gyro + cockpit + heatSinks + jumpJets + armor + equipment;
    const remaining = Math.max(0, configuration.tonnage - total);
    
    return {
      structure,
      engine,
      gyro,
      cockpit,
      heatSinks,
      jumpJets,
      armor,
      equipment,
      total,
      remaining
    };
  }
  
  /**
   * Get total used tonnage for a unit
   */
  getUsedTonnage(configuration: UnitConfiguration, equipmentWeight: number = 0): number {
    const breakdown = this.getTonnageBreakdown(configuration, equipmentWeight);
    return breakdown.total;
  }
  
  /**
   * Get remaining tonnage available for equipment/armor
   */
  getRemainingTonnage(configuration: UnitConfiguration, equipmentWeight: number = 0): number {
    const breakdown = this.getTonnageBreakdown(configuration, equipmentWeight);
    return breakdown.remaining;
  }
  
  /**
   * Get structure weight (10% of unit tonnage for standard structure)
   */
  getStructureWeight(configuration: UnitConfiguration): number {
    const baseWeight = configuration.tonnage * 0.1;
    
    // Structure type multipliers
    switch (configuration.structureType) {
      case 'Endo Steel':
      case 'Endo Steel (Clan)':
        return baseWeight * 0.5; // 50% weight reduction
      case 'Composite':
        return baseWeight * 0.75; // 25% weight reduction
      case 'Reinforced':
        return baseWeight * 2.0; // Double weight
      case 'Industrial':
        return baseWeight * 0.9; // 10% weight reduction
      default: // Standard
        return baseWeight;
    }
  }
  
  /**
   * Get engine weight based on type and rating
   */
  getEngineWeight(configuration: UnitConfiguration): number {
    const rating = configuration.engineRating;
    const type = configuration.engineType;
    
    let multiplier = 1.0; // Standard engine
    
    switch (type) {
      case 'XL':
      case 'Clan XL':
        multiplier = 0.5;
        break;
      case 'Light':
      case 'Clan Light':
        multiplier = 0.75;
        break;
      case 'XXL':
        multiplier = 0.33;
        break;
      case 'Compact':
        multiplier = 1.5;
        break;
      case 'ICE':
      case 'Fuel Cell':
        multiplier = 2.0;
        break;
    }
    
    return (rating * multiplier) / 25;
  }
  
  /**
   * Get gyro weight based on type and engine rating
   */
  getGyroWeight(configuration: UnitConfiguration): number {
    const rating = configuration.engineRating;
    const type = configuration.gyroType;
    
    let baseWeight = Math.ceil(rating / 100);
    
    switch (type) {
      case 'XL':
        return baseWeight * 0.5;
      case 'Compact':
        return baseWeight * 1.5;
      case 'Heavy-Duty':
        return baseWeight * 2.0;
      default: // Standard
        return baseWeight;
    }
  }
  
  /**
   * Get cockpit weight (standard is 3 tons)
   */
  getCockpitWeight(configuration: UnitConfiguration): number {
    // Future enhancement: support different cockpit types
    // For now, all cockpits are 3 tons
    return 3.0;
  }
  
  /**
   * Get heat sink weight (external heat sinks only)
   */
  getHeatSinkWeight(configuration: UnitConfiguration): number {
    const externalHeatSinks = configuration.externalHeatSinks;
    const heatSinkTonnage = this.getHeatSinkTonnage(configuration.heatSinkType);
    
    return externalHeatSinks * heatSinkTonnage;
  }
  
  /**
   * Get heat sink tonnage per unit
   */
  getHeatSinkTonnage(heatSinkType: string): number {
    switch (heatSinkType) {
      case 'Double':
      case 'Double (Clan)':
        return 1.0;
      case 'Compact':
        return 0.5;
      case 'Laser':
        return 1.5;
      default: // Single
        return 1.0;
    }
  }
  
  /**
   * Get total jump jet weight
   */
  getJumpJetWeight(configuration: UnitConfiguration): number {
    const jumpMP = configuration.jumpMP || 0;
    if (jumpMP === 0) return 0;
    
    const tonnage = configuration.tonnage;
    
    // Jump jet weight by tonnage class
    if (tonnage <= 55) {
      return jumpMP * 0.5;
    } else if (tonnage <= 85) {
      return jumpMP * 1.0;
    } else {
      return jumpMP * 2.0;
    }
  }
  
  /**
   * Calculate heat management values
   */
  getHeatManagement(configuration: UnitConfiguration): HeatManagementCalculation {
    const internalHeatSinks = this.calculateInternalHeatSinks(configuration.engineRating, configuration.engineType);
    const totalHeatSinks = Math.max(10, configuration.totalHeatSinks);
    const externalHeatSinks = Math.max(0, totalHeatSinks - internalHeatSinks);
    
    const heatSinkEfficiency = this.getHeatSinkEfficiency(configuration.heatSinkType);
    const heatDissipation = totalHeatSinks * heatSinkEfficiency;
    
    // Heat generation will be calculated from weapons when equipment system is complete
    const heatGeneration = 0;
    const heatBalance = heatDissipation - heatGeneration;
    
    return {
      totalHeatSinks,
      internalHeatSinks,
      externalHeatSinks,
      heatDissipation,
      heatGeneration,
      heatBalance,
      heatSinkEfficiency
    };
  }
  
  /**
   * Calculate internal heat sinks from engine rating
   */
  calculateInternalHeatSinks(engineRating: number, engineType: string): number {
    // Non-fusion engines don't provide heat sinks
    if (engineType === 'ICE' || engineType === 'Fuel Cell') {
      return 0;
    }
    
    // Fusion engines include 10 heat sinks for ratings 250+
    if (engineRating >= 250) {
      return 10;
    }
    
    // Smaller engines get fewer integrated heat sinks
    return Math.floor(engineRating / 25);
  }
  
  /**
   * Get heat sink efficiency based on type
   */
  getHeatSinkEfficiency(heatSinkType: string): number {
    switch (heatSinkType) {
      case 'Double':
      case 'Double (Clan)':
        return 2.0;
      case 'Compact':
        return 1.0; // Compact heat sinks are 1:1 but take 0.5 tons
      case 'Laser':
        return 1.0; // Laser heat sinks are 1:1 but immune to critical hits
      default: // Single
        return 1.0;
    }
  }
  
  /**
   * Get comprehensive armor calculations
   */
  getArmorCalculation(configuration: UnitConfiguration): ArmorCalculationResult {
    const allocatedArmorPoints = this.getAllocatedArmorPoints(configuration);
    const armorEfficiency = this.getArmorEfficiency(configuration.armorType);
    const availableArmorPoints = Math.floor(configuration.armorTonnage * armorEfficiency);
    const unallocatedArmorPoints = Math.max(0, availableArmorPoints - allocatedArmorPoints);
    const maxArmorPoints = this.getMaxArmorPoints(configuration);
    const maxArmorTonnage = this.getMaxArmorTonnage(configuration);
    
    return {
      totalArmorPoints: allocatedArmorPoints,
      allocatedArmorPoints,
      availableArmorPoints,
      unallocatedArmorPoints,
      maxArmorPoints,
      maxArmorTonnage,
      armorEfficiency
    };
  }
  
  /**
   * Get allocated armor points from location assignments
   */
  getAllocatedArmorPoints(configuration: UnitConfiguration): number {
    return Object.values(configuration.armorAllocation).reduce((total, location) => {
      return total + (location.front || 0) + (location.rear || 0);
    }, 0);
  }
  
  /**
   * Get available armor points from tonnage investment
   */
  getAvailableArmorPoints(configuration: UnitConfiguration): number {
    return Math.floor(configuration.armorTonnage * this.getArmorEfficiency(configuration.armorType));
  }
  
  /**
   * Get unallocated armor points available for auto-allocation
   */
  getUnallocatedArmorPoints(configuration: UnitConfiguration): number {
    return Math.max(0, this.getAvailableArmorPoints(configuration) - this.getAllocatedArmorPoints(configuration));
  }
  
  /**
   * Get maximum armor tonnage allowed for this unit
   */
  getMaxArmorTonnage(configuration: UnitConfiguration): number {
    // BattleTech rule: Maximum armor tonnage for any unit
    // Cannot exceed remaining tonnage or physical armor limits
    const remainingTonnage = this.getRemainingTonnageForArmor(configuration);
    const physicalMaxTonnage = this.getPhysicalMaxArmorTonnage(configuration);
    
    // Return the smaller of the two limits
    const maxTonnage = Math.min(remainingTonnage, physicalMaxTonnage);
    
    // Round to nearest 0.5 ton
    return Math.ceil(maxTonnage * 2) / 2;
  }
  
  /**
   * Get the physical maximum armor tonnage based on BattleTech construction rules
   */
  getPhysicalMaxArmorTonnage(configuration: UnitConfiguration): number {
    // BattleTech rule: Maximum armor points based on internal structure
    const maxArmorPoints = this.getMaxArmorPoints(configuration);
    const armorEfficiency = this.getArmorEfficiency(configuration.armorType);
    
    // Convert max armor points to tonnage
    return maxArmorPoints / armorEfficiency;
  }
  
  /**
   * Get maximum armor points allowed for this unit
   */
  getMaxArmorPoints(configuration: UnitConfiguration): number {
    // BattleTech rule: Head max (9) + sum of all other location max armor
    const internalStructure = this.getInternalStructurePoints(configuration.tonnage);
    
    // Max armor = Head max + (sum of other locations × 2)
    const headMax = 9;
    const otherLocationsMax = (internalStructure.CT + internalStructure.LT + internalStructure.RT + 
                              internalStructure.LA + internalStructure.RA + internalStructure.LL + 
                              internalStructure.RL) * 2;
    
    return headMax + otherLocationsMax;
  }
  
  /**
   * Get maximum armor points for a specific location
   */
  getMaxArmorPointsForLocation(location: string, tonnage: number): number {
    const internalStructure = this.getInternalStructurePoints(tonnage);
    
    if (location === 'HD') {
      return 9; // Head max is always 9
    }
    
    const structurePoints = internalStructure[location as keyof InternalStructurePoints] || 0;
    return structurePoints * 2;
  }
  
  /**
   * Get internal structure points for each location using official BattleTech table
   */
  getInternalStructurePoints(tonnage: number): InternalStructurePoints {
    try {
      const { getInternalStructurePoints } = require('../internalStructureTable');
      const structure = getInternalStructurePoints(tonnage);
      
      return {
        HD: structure.HD,
        CT: structure.CT,
        LT: structure.LT,
        RT: structure.RT,
        LA: structure.LA,
        RA: structure.RA,
        LL: structure.LL,
        RL: structure.RL
      };
    } catch (error) {
      console.warn('[BattleTechConstructionCalculations] Using fallback internal structure calculation');
      return this.getFallbackInternalStructure(tonnage);
    }
  }
  
  /**
   * Fallback internal structure calculation if table is unavailable
   */
  private getFallbackInternalStructure(tonnage: number): InternalStructurePoints {
    // Simplified internal structure calculation
    const baseCT = Math.floor(tonnage / 10) + 3;
    const baseSide = Math.floor(baseCT * 0.8);
    const baseLimb = Math.floor(baseCT * 0.6);
    
    return {
      HD: 3,
      CT: baseCT,
      LT: baseSide,
      RT: baseSide,
      LA: baseLimb,
      RA: baseLimb,
      LL: baseLimb,
      RL: baseLimb
    };
  }
  
  /**
   * Get armor efficiency for armor type
   */
  getArmorEfficiency(armorType: string): number {
    const armorPointsPerTon: Record<string, number> = {
      'Standard': 16,
      'Ferro-Fibrous': 17.92,
      'Ferro-Fibrous (Clan)': 17.92,
      'Light Ferro-Fibrous': 16.8,
      'Heavy Ferro-Fibrous': 19.2,
      'Stealth': 16,
      'Reactive': 16,
      'Reflective': 16,
      'Hardened': 8
    };
    
    return armorPointsPerTon[armorType] || 16;
  }
  
  /**
   * Get remaining tonnage that could be used for armor
   */
  getRemainingTonnageForArmor(configuration: UnitConfiguration): number {
    // Calculate what tonnage would be without current armor allocation
    const usedWithoutArmor = this.getUsedTonnage(configuration) - configuration.armorTonnage;
    const availableForArmor = configuration.tonnage - usedWithoutArmor;
    
    // Return raw available tonnage (no circular dependency)
    return Math.max(0, availableForArmor);
  }
  
  /**
   * Get maximum walk MP for this tonnage
   */
  getMaxWalkMP(tonnage: number): number {
    return Math.floor(400 / tonnage);
  }
  
  /**
   * Validate if current configuration exceeds any limits
   */
  isOverweight(configuration: UnitConfiguration, equipmentWeight: number = 0): boolean {
    return this.getUsedTonnage(configuration, equipmentWeight) > configuration.tonnage;
  }
  
  /**
   * Get weight validation status
   */
  getWeightValidation(configuration: UnitConfiguration, equipmentWeight: number = 0): WeightValidationResult {
    const usedTonnage = this.getUsedTonnage(configuration, equipmentWeight);
    const maxTonnage = configuration.tonnage;
    const overweight = Math.max(0, usedTonnage - maxTonnage);
    
    const warnings: string[] = [];
    
    if (overweight > 0) {
      warnings.push(`Unit is ${overweight.toFixed(1)} tons overweight`);
    }
    
    // Check if close to limit
    const remaining = maxTonnage - usedTonnage;
    if (remaining > 0 && remaining < 1) {
      warnings.push(`Only ${remaining.toFixed(1)} tons remaining`);
    }
    
    return {
      isValid: overweight === 0,
      overweight,
      warnings
    };
  }
  
  /**
   * Calculate tonnage efficiency (used tonnage vs max tonnage)
   */
  getTonnageEfficiency(configuration: UnitConfiguration, equipmentWeight: number = 0): number {
    const usedTonnage = this.getUsedTonnage(configuration, equipmentWeight);
    return (usedTonnage / configuration.tonnage) * 100;
  }
  
  /**
   * Get tonnage utilization categories
   */
  getTonnageUtilization(configuration: UnitConfiguration, equipmentWeight: number = 0): {
    category: 'Underweight' | 'Efficient' | 'Near Limit' | 'Overweight';
    efficiency: number;
    description: string;
  } {
    const efficiency = this.getTonnageEfficiency(configuration, equipmentWeight);
    
    if (efficiency > 100) {
      return {
        category: 'Overweight',
        efficiency,
        description: 'Unit exceeds tonnage limit'
      };
    } else if (efficiency > 95) {
      return {
        category: 'Near Limit',
        efficiency,
        description: 'Excellent tonnage utilization'
      };
    } else if (efficiency > 85) {
      return {
        category: 'Efficient',
        efficiency,
        description: 'Good tonnage utilization'
      };
    } else {
      return {
        category: 'Underweight',
        efficiency,
        description: 'Room for additional equipment or armor'
      };
    }
  }
  
  /**
   * Calculate total critical slots used by special components
   */
  getSpecialComponentSlots(configuration: UnitConfiguration): {
    structure: number;
    armor: number;
    jumpJets: number;
    total: number;
  } {
    const structureSlots = this.getStructureCriticalSlots(configuration.structureType);
    const armorSlots = this.getArmorCriticalSlots(configuration.armorType, configuration.techBase);
    const jumpJetSlots = configuration.jumpMP; // Each jump jet takes 1 slot
    
    return {
      structure: structureSlots,
      armor: armorSlots,
      jumpJets: jumpJetSlots,
      total: structureSlots + armorSlots + jumpJetSlots
    };
  }
  
  /**
   * Get critical slot requirements for structure type
   */
  getStructureCriticalSlots(structureType: string): number {
    const structureSlotMap: Record<string, number> = {
      'Standard': 0,
      'Endo Steel': 14,
      'Endo Steel (Clan)': 7,
      'Composite': 0,
      'Reinforced': 0,
      'Industrial': 0
    };
    return structureSlotMap[structureType] || 0;
  }
  
  /**
   * Get critical slot requirements for armor type
   */
  getArmorCriticalSlots(armorType: string, techBase: string): number {
    try {
      const { getArmorSlots } = require('../armorCalculations');
      return getArmorSlots(armorType as any, techBase as any) || 0;
    } catch (error) {
      // Fallback for armor types not in the armor calculations
      const armorSlotMap: Record<string, number> = {
        'Standard': 0,
        'Ferro-Fibrous': 14,
        'Ferro-Fibrous (Clan)': 7,
        'Light Ferro-Fibrous': 7,
        'Heavy Ferro-Fibrous': 21,
        'Stealth': 12,
        'Reactive': 14,
        'Reflective': 10,
        'Hardened': 0  // Hardened armor takes 0 slots
      };
      return armorSlotMap[armorType] || 0;
    }
  }
  
  /**
   * Calculate construction feasibility
   */
  getConstructionFeasibility(configuration: UnitConfiguration): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check engine rating feasibility
    const requiredEngineRating = configuration.tonnage * configuration.walkMP;
    if (requiredEngineRating > 400) {
      issues.push(`Engine rating ${requiredEngineRating} exceeds maximum of 400`);
      const maxWalkMP = this.getMaxWalkMP(configuration.tonnage);
      suggestions.push(`Maximum walk MP for ${configuration.tonnage} tons is ${maxWalkMP}`);
    }
    
    // Check weight limits
    const weightValidation = this.getWeightValidation(configuration);
    if (!weightValidation.isValid) {
      issues.push(...weightValidation.warnings);
      suggestions.push('Reduce equipment weight or increase unit tonnage');
    }
    
    // Check armor limits
    const armorCalc = this.getArmorCalculation(configuration);
    if (armorCalc.allocatedArmorPoints > armorCalc.maxArmorPoints) {
      issues.push(`Armor points ${armorCalc.allocatedArmorPoints} exceed maximum ${armorCalc.maxArmorPoints}`);
      suggestions.push('Reduce armor allocation to fit within structural limits');
    }
    
    // Check critical slot availability
    const specialSlots = this.getSpecialComponentSlots(configuration);
    if (specialSlots.total > 50) { // Rough estimate of available slots
      issues.push(`Special components require ${specialSlots.total} slots, may exceed availability`);
      suggestions.push('Consider using fewer special component types');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Singleton instance for global use
let globalConstructionCalculations: BattleTechConstructionCalculations | null = null;

/**
 * Get or create global construction calculations service
 */
export function getBattleTechConstructionCalculations(): BattleTechConstructionCalculations {
  if (!globalConstructionCalculations) {
    globalConstructionCalculations = new BattleTechConstructionCalculations();
  }
  return globalConstructionCalculations;
}

/**
 * Reset global construction calculations service (for testing)
 */
export function resetBattleTechConstructionCalculations(): void {
  globalConstructionCalculations = null;
}
