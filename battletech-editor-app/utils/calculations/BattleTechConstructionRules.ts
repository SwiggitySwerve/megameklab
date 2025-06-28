/**
 * BattleTech Construction Rules & Calculations Service
 * Handles all BattleTech construction rule calculations, weight calculations, and validation
 * Following SOLID principles - Single Responsibility for construction rule enforcement
 */

import { UnitConfiguration, ArmorAllocation, StructureType, ArmorType, HeatSinkType } from '../criticalSlots/UnitCriticalManager';
import { EngineType, GyroType } from '../criticalSlots/SystemComponentRules';

export interface WeightBreakdown {
  structureWeight: number;
  engineWeight: number;
  gyroWeight: number;
  cockpitWeight: number;
  heatSinkWeight: number;
  jumpJetWeight: number;
  armorWeight: number;
  totalWeight: number;
  remainingWeight: number;
}

export interface ArmorCalculation {
  availableArmorPoints: number;
  allocatedArmorPoints: number;
  unallocatedArmorPoints: number;
  maxArmorPoints: number;
  armorEfficiency: number;
  maxArmorTonnage: number;
  physicalMaxArmorTonnage: number;
}

export interface WeightValidation {
  isValid: boolean;
  overweight: number;
  warnings: string[];
  utilizationPercent: number;
}

export interface HeatManagement {
  totalHeatSinks: number;
  internalHeatSinks: number;
  externalHeatSinks: number;
  heatDissipation: number;
  heatGeneration: number;
  heatSinkEfficiency: number;
  heatBalance: number;
}

export interface ConstructionLimits {
  maxWalkMP: number;
  maxArmorTonnage: number;
  maxArmorPoints: number;
  mandatoryComponentSlots: number;
  internalStructurePoints: Record<string, number>;
}

export interface LocationArmorLimits {
  [location: string]: {
    maxArmorPoints: number;
    canHaveRearArmor: boolean;
    internalStructure: number;
  };
}

export interface ConstructionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  constructionIssues: string[];
}

/**
 * BattleTech Construction Rules & Calculations Service
 * Centralized management of all BattleTech construction rules and calculations
 */
export class BattleTechConstructionRules {
  
  private configuration: UnitConfiguration;
  
  constructor(configuration: UnitConfiguration) {
    this.configuration = configuration;
  }
  
  /**
   * Update configuration reference
   */
  updateConfiguration(configuration: UnitConfiguration): void {
    this.configuration = configuration;
  }
  
  /**
   * Get comprehensive weight breakdown
   */
  getWeightBreakdown(): WeightBreakdown {
    const structureWeight = this.getStructureWeight();
    const engineWeight = this.getEngineWeight();
    const gyroWeight = this.getGyroWeight();
    const cockpitWeight = this.getCockpitWeight();
    const heatSinkWeight = this.getHeatSinkWeight();
    const jumpJetWeight = this.getJumpJetWeight();
    const armorWeight = this.configuration.armorTonnage;
    
    const totalWeight = structureWeight + engineWeight + gyroWeight + 
                       cockpitWeight + heatSinkWeight + jumpJetWeight + armorWeight;
    const remainingWeight = Math.max(0, this.configuration.tonnage - totalWeight);
    
    return {
      structureWeight,
      engineWeight,
      gyroWeight,
      cockpitWeight,
      heatSinkWeight,
      jumpJetWeight,
      armorWeight,
      totalWeight,
      remainingWeight
    };
  }
  
  /**
   * Get structure weight (10% of unit tonnage, modified by structure type)
   */
  getStructureWeight(): number {
    const baseWeight = this.configuration.tonnage * 0.1;
    
    // Structure type multipliers
    switch (this.configuration.structureType) {
      case 'Endo Steel':
      case 'Endo Steel (Clan)':
        return baseWeight * 0.5; // Endo Steel is half weight
      case 'Composite':
        return baseWeight * 0.5; // Composite is half weight
      case 'Reinforced':
        return baseWeight * 2.0; // Reinforced is double weight
      case 'Industrial':
        return baseWeight * 0.1; // Industrial is very light
      default: // Standard
        return baseWeight;
    }
  }
  
  /**
   * Get engine weight based on type and rating
   */
  getEngineWeight(): number {
    const rating = this.configuration.engineRating;
    const type = this.configuration.engineType;
    
    let multiplier = 1.0; // Standard engine
    
    switch (type) {
      case 'XL':
        multiplier = 0.5;
        break;
      case 'Light':
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
  getGyroWeight(): number {
    const rating = this.configuration.engineRating;
    const type = this.configuration.gyroType;
    
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
   * Get cockpit weight (always 3 tons for standard)
   */
  getCockpitWeight(): number {
    // Future enhancement: Support for different cockpit types
    return 3.0;
  }
  
  /**
   * Get heat sink weight (external only, internal are part of engine)
   */
  getHeatSinkWeight(): number {
    return this.configuration.externalHeatSinks * this.getHeatSinkTonnage();
  }
  
  /**
   * Get heat sink tonnage per unit
   */
  getHeatSinkTonnage(): number {
    const type = this.configuration.heatSinkType;
    
    switch (type) {
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
  getJumpJetWeight(): number {
    const jumpMP = this.configuration.jumpMP || 0;
    if (jumpMP === 0) return 0;
    
    const tonnage = this.configuration.tonnage;
    
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
   * Get total tonnage used by all components
   */
  getUsedTonnage(): number {
    const breakdown = this.getWeightBreakdown();
    return breakdown.totalWeight;
  }
  
  /**
   * Get remaining tonnage available for equipment/armor
   */
  getRemainingTonnage(): number {
    const usedTonnage = this.getUsedTonnage();
    return Math.max(0, this.configuration.tonnage - usedTonnage);
  }
  
  /**
   * Get remaining tonnage that could be used for armor
   */
  getRemainingTonnageForArmor(): number {
    // Calculate what tonnage would be without current armor allocation
    const usedWithoutArmor = this.getUsedTonnage() - this.configuration.armorTonnage;
    const availableForArmor = this.configuration.tonnage - usedWithoutArmor;
    
    // Return raw available tonnage (no circular dependency)
    return Math.max(0, availableForArmor);
  }
  
  /**
   * Get comprehensive armor calculation
   */
  getArmorCalculation(): ArmorCalculation {
    const armorEfficiency = this.getArmorEfficiency();
    const availableArmorPoints = Math.floor(this.configuration.armorTonnage * armorEfficiency);
    const allocatedArmorPoints = this.getAllocatedArmorPoints();
    const unallocatedArmorPoints = Math.max(0, availableArmorPoints - allocatedArmorPoints);
    const maxArmorPoints = this.getMaxArmorPoints();
    const maxArmorTonnage = this.getMaxArmorTonnage();
    const physicalMaxArmorTonnage = this.getPhysicalMaxArmorTonnage();
    
    return {
      availableArmorPoints,
      allocatedArmorPoints,
      unallocatedArmorPoints,
      maxArmorPoints,
      armorEfficiency,
      maxArmorTonnage,
      physicalMaxArmorTonnage
    };
  }
  
  /**
   * Get armor efficiency for current armor type
   */
  getArmorEfficiency(): number {
    const { ARMOR_POINTS_PER_TON } = require('../armorCalculations');
    return ARMOR_POINTS_PER_TON[this.configuration.armorType] || 16;
  }
  
  /**
   * Get allocated armor points from location assignments
   */
  getAllocatedArmorPoints(): number {
    return Object.values(this.configuration.armorAllocation).reduce((total, location) => {
      return total + (location.front || 0) + (location.rear || 0);
    }, 0);
  }
  
  /**
   * Get available armor points from tonnage investment
   */
  getAvailableArmorPoints(): number {
    return Math.floor(this.configuration.armorTonnage * this.getArmorEfficiency());
  }
  
  /**
   * Get unallocated armor points available for auto-allocation
   */
  getUnallocatedArmorPoints(): number {
    return Math.max(0, this.getAvailableArmorPoints() - this.getAllocatedArmorPoints());
  }
  
  /**
   * Get armor points remaining for allocation (legacy compatibility)
   */
  getRemainingArmorPoints(): number {
    return this.getUnallocatedArmorPoints();
  }
  
  /**
   * Get maximum armor tonnage allowed for this unit
   */
  getMaxArmorTonnage(): number {
    // BattleTech rule: Maximum armor tonnage for any unit
    // Cannot exceed remaining tonnage or physical armor limits
    const remainingTonnage = this.getRemainingTonnageForArmor();
    const physicalMaxTonnage = this.getPhysicalMaxArmorTonnage();
    
    // Return the smaller of the two limits
    const maxTonnage = Math.min(remainingTonnage, physicalMaxTonnage);
    
    // Round to nearest 0.5 ton
    return Math.ceil(maxTonnage * 2) / 2;
  }
  
  /**
   * Get the physical maximum armor tonnage based on BattleTech construction rules
   */
  getPhysicalMaxArmorTonnage(): number {
    // BattleTech rule: Maximum armor points based on internal structure
    const maxArmorPoints = this.getMaxArmorPoints();
    const armorEfficiency = this.getArmorEfficiency();
    
    // Convert max armor points to tonnage
    return maxArmorPoints / armorEfficiency;
  }
  
  /**
   * Get maximum armor points allowed for this unit
   */
  getMaxArmorPoints(): number {
    // BattleTech rule: Head max (9) + sum of all other location max armor
    const internalStructure = this.getInternalStructurePoints();
    
    // Max armor = Head max + (sum of other locations × 2)
    const headMax = 9;
    const otherLocationsMax = (internalStructure.CT + internalStructure.LT + internalStructure.RT + 
                              internalStructure.LA + internalStructure.RA + internalStructure.LL + 
                              internalStructure.RL) * 2;
    
    return headMax + otherLocationsMax;
  }
  
  /**
   * Get internal structure points for each location using official BattleTech table
   */
  getInternalStructurePoints(): Record<string, number> {
    const { getInternalStructurePoints } = require('../internalStructureTable');
    const structure = getInternalStructurePoints(this.configuration.tonnage);
    
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
  }
  
  /**
   * Get maximum armor points for a specific location
   */
  getMaxArmorPointsForLocation(location: string): number {
    const internalStructure = this.getInternalStructurePoints();
    
    if (location === 'HD') {
      return 9; // Head max is always 9
    }
    
    const structurePoints = internalStructure[location] || 0;
    return structurePoints * 2;
  }
  
  /**
   * Get location armor limits with detailed information
   */
  getLocationArmorLimits(): LocationArmorLimits {
    const internalStructure = this.getInternalStructurePoints();
    const limits: LocationArmorLimits = {};
    
    // Locations that can have rear armor
    const rearArmorLocations = ['CT', 'LT', 'RT'];
    
    Object.keys(internalStructure).forEach(location => {
      limits[location] = {
        maxArmorPoints: this.getMaxArmorPointsForLocation(location),
        canHaveRearArmor: rearArmorLocations.includes(location),
        internalStructure: internalStructure[location]
      };
    });
    
    return limits;
  }
  
  /**
   * Get maximum walk MP for this tonnage
   */
  getMaxWalkMP(): number {
    return Math.floor(400 / this.configuration.tonnage);
  }
  
  /**
   * Validate if current configuration exceeds any limits
   */
  isOverweight(): boolean {
    return this.getUsedTonnage() > this.configuration.tonnage;
  }
  
  /**
   * Get weight validation status
   */
  getWeightValidation(): WeightValidation {
    const usedTonnage = this.getUsedTonnage();
    const maxTonnage = this.configuration.tonnage;
    const overweight = Math.max(0, usedTonnage - maxTonnage);
    const utilizationPercent = (usedTonnage / maxTonnage) * 100;
    
    const warnings: string[] = [];
    
    if (overweight > 0) {
      warnings.push(`Unit is ${overweight.toFixed(1)} tons overweight`);
    }
    
    // Check if close to limit
    const remaining = maxTonnage - usedTonnage;
    if (remaining > 0 && remaining < 1) {
      warnings.push(`Only ${remaining.toFixed(1)} tons remaining`);
    }
    
    // Efficiency warnings
    if (utilizationPercent < 95 && remaining > 2) {
      warnings.push(`Unit is underutilized at ${utilizationPercent.toFixed(1)}% capacity`);
    }
    
    return {
      isValid: overweight === 0,
      overweight,
      warnings,
      utilizationPercent
    };
  }
  
  /**
   * Get heat management information
   */
  getHeatManagement(): HeatManagement {
    const totalHeatSinks = this.configuration.totalHeatSinks;
    const internalHeatSinks = this.configuration.internalHeatSinks;
    const externalHeatSinks = this.configuration.externalHeatSinks;
    const heatSinkEfficiency = this.getHeatSinkEfficiency();
    const heatDissipation = totalHeatSinks * heatSinkEfficiency;
    const heatGeneration = this.getHeatGeneration();
    const heatBalance = heatDissipation - heatGeneration;
    
    return {
      totalHeatSinks,
      internalHeatSinks,
      externalHeatSinks,
      heatDissipation,
      heatGeneration,
      heatSinkEfficiency,
      heatBalance
    };
  }
  
  /**
   * Get total heat dissipation capacity
   */
  getHeatDissipation(): number {
    const config = this.configuration;
    const efficiency = this.getHeatSinkEfficiency();
    return config.totalHeatSinks * efficiency;
  }
  
  /**
   * Get current heat generation from all equipment
   */
  getHeatGeneration(): number {
    // Currently no weapons/equipment generating heat in base configuration
    // This will be calculated from allocated weapons when equipment system is implemented
    return 0;
  }
  
  /**
   * Get heat sink efficiency based on type
   */
  getHeatSinkEfficiency(): number {
    const type = this.configuration.heatSinkType;
    
    switch (type) {
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
   * Get construction limits and constraints
   */
  getConstructionLimits(): ConstructionLimits {
    return {
      maxWalkMP: this.getMaxWalkMP(),
      maxArmorTonnage: this.getMaxArmorTonnage(),
      maxArmorPoints: this.getMaxArmorPoints(),
      mandatoryComponentSlots: this.getMandatoryComponentSlots(),
      internalStructurePoints: this.getInternalStructurePoints()
    };
  }
  
  /**
   * Get mandatory component critical slots that are always present
   */
  getMandatoryComponentSlots(): number {
    // Fixed components that are always present:
    // - Cockpit: 1 slot (Head)
    // - Life Support: 2 slots (Head) 
    // - Sensors: 2 slots (Head)
    // - Actuators: 4 slots per arm (shoulder, upper, lower, hand) + 4 slots per leg (hip, upper, lower, foot)
    
    const cockpitSlots = 1;
    const lifeSupportSlots = 2;
    const sensorSlots = 2;
    const armActuatorSlots = 4 * 2; // 4 slots per arm × 2 arms
    const legActuatorSlots = 4 * 2; // 4 slots per leg × 2 legs
    
    return cockpitSlots + lifeSupportSlots + sensorSlots + armActuatorSlots + legActuatorSlots;
  }
  
  /**
   * Validate engine rating constraints
   */
  validateEngineRating(tonnage?: number, walkMP?: number): { 
    isValid: boolean; 
    maxWalkMP: number; 
    errors: string[]; 
    requiredRating: number;
  } {
    const unitTonnage = tonnage || this.configuration.tonnage;
    const unitWalkMP = walkMP || this.configuration.walkMP;
    const requiredRating = unitTonnage * unitWalkMP;
    const errors: string[] = [];
    let isValid = true;
    
    if (requiredRating > 400) {
      errors.push(`Engine rating ${requiredRating} exceeds maximum of 400`);
      isValid = false;
    }
    
    if (unitWalkMP < 1) {
      errors.push('Walk MP must be at least 1');
      isValid = false;
    }
    
    const maxWalkMP = Math.floor(400 / unitTonnage);
    
    return { isValid, maxWalkMP, errors, requiredRating };
  }
  
  /**
   * Validate armor allocation against BattleTech rules
   */
  validateArmorAllocation(): ConstructionValidation {
    const result: ConstructionValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      constructionIssues: []
    };
    
    const armorAllocation = this.configuration.armorAllocation;
    const locationLimits = this.getLocationArmorLimits();
    
    // Validate each location
    Object.entries(armorAllocation).forEach(([location, armor]) => {
      const limits = locationLimits[location];
      if (!limits) return;
      
      const totalArmor = armor.front + armor.rear;
      
      // Check maximum armor
      if (totalArmor > limits.maxArmorPoints) {
        result.errors.push(`${location} armor (${totalArmor}) exceeds maximum (${limits.maxArmorPoints})`);
        result.isValid = false;
      }
      
      // Check rear armor restrictions
      if (armor.rear > 0 && !limits.canHaveRearArmor) {
        result.errors.push(`${location} cannot have rear armor`);
        result.isValid = false;
      }
      
      // Check head armor special case
      if (location === 'HD' && armor.front > 9) {
        result.errors.push(`Head armor cannot exceed 9 points`);
        result.isValid = false;
      }
      
      // Suggestions for optimization
      if (totalArmor < limits.maxArmorPoints * 0.8) {
        result.suggestions.push(`Consider increasing ${location} armor for better protection`);
      }
    });
    
    // Check overall armor efficiency
    const armorCalc = this.getArmorCalculation();
    if (armorCalc.allocatedArmorPoints < armorCalc.maxArmorPoints * 0.85) {
      result.suggestions.push('Consider allocating more armor points for better protection');
    }
    
    return result;
  }
  
  /**
   * Validate heat management
   */
  validateHeatManagement(): ConstructionValidation {
    const result: ConstructionValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      constructionIssues: []
    };
    
    const heatMgmt = this.getHeatManagement();
    
    // Check minimum heat sinks
    if (heatMgmt.totalHeatSinks < 10) {
      result.errors.push('Unit must have at least 10 heat sinks');
      result.isValid = false;
    }
    
    // Check heat balance
    if (heatMgmt.heatBalance < 0) {
      result.warnings.push(`Unit generates more heat than it can dissipate (${Math.abs(heatMgmt.heatBalance)} excess)`);
    }
    
    // Suggestions for heat efficiency
    if (heatMgmt.heatSinkEfficiency < 2.0 && this.configuration.techBase === 'Inner Sphere') {
      result.suggestions.push('Consider upgrading to Double Heat Sinks for better heat efficiency');
    }
    
    return result;
  }
  
  /**
   * Comprehensive construction validation
   */
  validateConstruction(): ConstructionValidation {
    const result: ConstructionValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      constructionIssues: []
    };
    
    // Weight validation
    const weightValidation = this.getWeightValidation();
    if (!weightValidation.isValid) {
      result.errors.push(`Unit is overweight by ${weightValidation.overweight.toFixed(1)} tons`);
      result.isValid = false;
    }
    result.warnings.push(...weightValidation.warnings);
    
    // Engine validation
    const engineValidation = this.validateEngineRating();
    if (!engineValidation.isValid) {
      result.errors.push(...engineValidation.errors);
      result.isValid = false;
    }
    
    // Armor validation
    const armorValidation = this.validateArmorAllocation();
    if (!armorValidation.isValid) {
      result.errors.push(...armorValidation.errors);
      result.isValid = false;
    }
    result.warnings.push(...armorValidation.warnings);
    result.suggestions.push(...armorValidation.suggestions);
    
    // Heat validation
    const heatValidation = this.validateHeatManagement();
    if (!heatValidation.isValid) {
      result.errors.push(...heatValidation.errors);
      result.isValid = false;
    }
    result.warnings.push(...heatValidation.warnings);
    result.suggestions.push(...heatValidation.suggestions);
    
    return result;
  }
  
  /**
   * Get construction efficiency analysis
   */
  getConstructionEfficiency(): {
    weightEfficiency: number;
    armorEfficiency: number;
    heatEfficiency: number;
    overallEfficiency: number;
    recommendations: string[];
  } {
    const weightValidation = this.getWeightValidation();
    const armorCalc = this.getArmorCalculation();
    const heatMgmt = this.getHeatManagement();
    
    const weightEfficiency = Math.min(100, weightValidation.utilizationPercent);
    const armorEfficiency = (armorCalc.allocatedArmorPoints / armorCalc.maxArmorPoints) * 100;
    const heatEfficiency = Math.min(100, (heatMgmt.heatDissipation / Math.max(1, heatMgmt.heatGeneration)) * 100);
    
    const overallEfficiency = (weightEfficiency + armorEfficiency + heatEfficiency) / 3;
    
    const recommendations: string[] = [];
    
    if (weightEfficiency < 90) {
      recommendations.push('Consider adding more equipment to utilize available tonnage');
    }
    
    if (armorEfficiency < 85) {
      recommendations.push('Consider increasing armor allocation for better protection');
    }
    
    if (heatEfficiency < 100 && heatMgmt.heatGeneration > 0) {
      recommendations.push('Consider adding more heat sinks or reducing heat generation');
    }
    
    return {
      weightEfficiency,
      armorEfficiency,
      heatEfficiency,
      overallEfficiency,
      recommendations
    };
  }
}

// Singleton instance for global use
let globalConstructionRules: BattleTechConstructionRules | null = null;

/**
 * Initialize global construction rules service
 */
export function initializeBattleTechConstructionRules(configuration: UnitConfiguration): BattleTechConstructionRules {
  globalConstructionRules = new BattleTechConstructionRules(configuration);
  return globalConstructionRules;
}

/**
 * Get global construction rules service
 */
export function getBattleTechConstructionRules(): BattleTechConstructionRules | null {
  return globalConstructionRules;
}

/**
 * Reset global construction rules service (for testing)
 */
export function resetBattleTechConstructionRules(): void {
  globalConstructionRules = null;
}
