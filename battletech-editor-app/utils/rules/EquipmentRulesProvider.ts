/**
 * Equipment Rules Provider - Centralized equipment filtering and compatibility rules
 * 
 * This module provides equipment availability, filtering, and compatibility logic
 * isolated from the rest of the construction system.
 * 
 * Purpose:
 * - Filter equipment based on tech base, era, and unit configuration
 * - Validate equipment compatibility with unit configuration
 * - Provide equipment upgrade paths (IS to Clan, etc.)
 * - Calculate equipment restrictions (tonnage, location, etc.)
 */

import { TechBase as DataTechBase } from '../../data/equipment';
import { TechBase, ConstructionContext } from './RulesDataProvider';

export interface EquipmentVariant {
  id: string;
  baseEquipmentId: string;
  name: string;
  category: string;
  techBase: DataTechBase;
  weight: number;
  criticalSlots: number;
  damage?: number;
  heat?: number;
  minRange?: number;
  rangeShort?: number;
  rangeMedium?: number;
  rangeLong?: number;
  rangeExtreme?: number;
  ammoPerTon?: number;
  cost?: number;
  battleValue?: number;
  requiresAmmo: boolean;
  introductionYear: number;
  extinctionYear?: number;
  rulesLevel: string;
  baseType?: string;
  description?: string;
  special?: string[];
  sourceBook?: string;
  pageReference?: string;
}

export interface EquipmentFilterCriteria {
  techBase?: DataTechBase | 'all';
  category?: string;
  era?: string;
  techLevel?: string;
  minTonnage?: number;
  maxTonnage?: number;
  searchTerm?: string;
  rulesLevel?: string;
}

export interface EquipmentCompatibilityResult {
  isCompatible: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
  restrictedLocations?: string[];
  requiredComponents?: string[];
}

export interface EquipmentLocationRestrictions {
  allowedLocations?: string[];
  prohibitedLocations?: string[];
  requiresSpecificLocation?: string;
  maxPerLocation?: number;
}

export interface EquipmentUpgradePath {
  currentEquipment: EquipmentVariant;
  upgradeOptions: EquipmentVariant[];
  costDifference: number;
  weightDifference: number;
  performanceImprovement: string[];
}

/**
 * Equipment Rules Provider
 * Centralized equipment rules and compatibility logic
 */
export class EquipmentRulesProvider {
  
  // ============================================================================
  // EQUIPMENT FILTERING
  // ============================================================================
  
  /**
   * Filter equipment based on criteria
   */
  static filterEquipment(
    equipment: EquipmentVariant[],
    criteria: EquipmentFilterCriteria
  ): EquipmentVariant[] {
    let filtered = [...equipment];
    
    // Filter by tech base
    if (criteria.techBase && criteria.techBase !== 'all') {
      filtered = filtered.filter(eq => eq.techBase === criteria.techBase);
    }
    
    // Filter by category
    if (criteria.category && criteria.category !== 'all') {
      filtered = filtered.filter(eq => eq.category === criteria.category);
    }
    
    // Filter by era (introduction year)
    if (criteria.era) {
      const eraYear = this.parseEraToYear(criteria.era);
      filtered = filtered.filter(eq => {
        const availableInEra = eq.introductionYear <= eraYear;
        const notExtinctInEra = !eq.extinctionYear || eq.extinctionYear >= eraYear;
        return availableInEra && notExtinctInEra;
      });
    }
    
    // Filter by rules level
    if (criteria.rulesLevel && criteria.rulesLevel !== 'all') {
      filtered = filtered.filter(eq => eq.rulesLevel === criteria.rulesLevel);
    }
    
    // Filter by tonnage restrictions
    if (criteria.minTonnage !== undefined) {
      filtered = filtered.filter(eq => eq.weight >= criteria.minTonnage!);
    }
    if (criteria.maxTonnage !== undefined) {
      filtered = filtered.filter(eq => eq.weight <= criteria.maxTonnage!);
    }
    
    // Filter by search term
    if (criteria.searchTerm && criteria.searchTerm.trim()) {
      const searchLower = criteria.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(eq => 
        eq.name.toLowerCase().includes(searchLower) ||
        eq.baseType?.toLowerCase().includes(searchLower) ||
        eq.description?.toLowerCase().includes(searchLower) ||
        eq.category.toLowerCase().includes(searchLower) ||
        eq.special?.some(s => s.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }
  
  /**
   * Get equipment compatible with construction context
   */
  static getCompatibleEquipment(
    equipment: EquipmentVariant[],
    context: ConstructionContext
  ): EquipmentVariant[] {
    const criteria: EquipmentFilterCriteria = {
      techBase: this.convertTechBaseToDataTechBase(context.techBase),
      era: context.era,
      techLevel: context.techLevel
    };
    
    const filtered = this.filterEquipment(equipment, criteria);
    
    // Further filter by compatibility checks
    return filtered.filter(eq => {
      const compatibility = this.validateEquipmentCompatibility(eq, context);
      return compatibility.isCompatible;
    });
  }
  
  // ============================================================================
  // COMPATIBILITY VALIDATION
  // ============================================================================
  
  /**
   * Validate equipment compatibility with unit configuration
   */
  static validateEquipmentCompatibility(
    equipment: EquipmentVariant,
    context: ConstructionContext
  ): EquipmentCompatibilityResult {
    const result: EquipmentCompatibilityResult = {
      isCompatible: true,
      issues: [],
      warnings: [],
      recommendations: []
    };
    
    // Check tech base compatibility
    this.checkTechBaseCompatibility(equipment, context, result);
    
    // Check era availability
    this.checkEraAvailability(equipment, context, result);
    
    // Check tonnage restrictions
    this.checkTonnageRestrictions(equipment, context, result);
    
    // Check critical slot availability
    this.checkSlotAvailability(equipment, context, result);
    
    // Check special restrictions
    this.checkSpecialRestrictions(equipment, context, result);
    
    // Set overall compatibility
    result.isCompatible = result.issues.length === 0;
    
    return result;
  }
  
  /**
   * Check tech base compatibility
   */
  private static checkTechBaseCompatibility(
    equipment: EquipmentVariant,
    context: ConstructionContext,
    result: EquipmentCompatibilityResult
  ): void {
    const equipmentTechBase = equipment.techBase;
    const unitTechBase = context.techBase;
    
    // Check if equipment tech base matches unit tech base
    if (unitTechBase === 'Inner Sphere' && equipmentTechBase === 'Clan') {
      result.issues.push(`${equipment.name} is Clan technology and incompatible with Inner Sphere unit`);
    } else if (unitTechBase === 'Clan' && equipmentTechBase === 'IS') {
      result.warnings.push(`${equipment.name} is Inner Sphere technology on a Clan unit (may incur penalties)`);
    } else if (unitTechBase.includes('Mixed')) {
      const chassisTechBase = unitTechBase.includes('IS') ? 'IS' : 'Clan';
      if (equipmentTechBase !== chassisTechBase) {
        result.warnings.push(`Mixed technology: ${equipment.name} will incur Battle Value and cost penalties`);
      }
    }
  }
  
  /**
   * Check era availability
   */
  private static checkEraAvailability(
    equipment: EquipmentVariant,
    context: ConstructionContext,
    result: EquipmentCompatibilityResult
  ): void {
    const eraYear = this.parseEraToYear(context.era);
    
    if (equipment.introductionYear > eraYear) {
      result.issues.push(
        `${equipment.name} not available until ${equipment.introductionYear} (current era: ${context.era})`
      );
    }
    
    if (equipment.extinctionYear && equipment.extinctionYear < eraYear) {
      result.warnings.push(
        `${equipment.name} became extinct in ${equipment.extinctionYear} (current era: ${context.era})`
      );
    }
  }
  
  /**
   * Check tonnage restrictions
   */
  private static checkTonnageRestrictions(
    equipment: EquipmentVariant,
    context: ConstructionContext,
    result: EquipmentCompatibilityResult
  ): void {
    const mechTonnage = context.mechTonnage;
    
    // No single equipment should exceed 20% of mech weight
    if (equipment.weight > mechTonnage * 0.2) {
      result.warnings.push(
        `${equipment.name} (${equipment.weight} tons) is very heavy for a ${mechTonnage}-ton mech`
      );
    }
    
    // Check for minimum tonnage requirements for certain equipment
    if (this.hasMinimumTonnageRequirement(equipment)) {
      const minTonnage = this.getMinimumTonnageRequirement(equipment);
      if (mechTonnage < minTonnage) {
        result.issues.push(
          `${equipment.name} requires at least ${minTonnage} tons (unit is ${mechTonnage} tons)`
        );
      }
    }
  }
  
  /**
   * Check critical slot availability (general check)
   */
  private static checkSlotAvailability(
    equipment: EquipmentVariant,
    context: ConstructionContext,
    result: EquipmentCompatibilityResult
  ): void {
    // This is a general check - actual slot allocation is handled elsewhere
    if (equipment.criticalSlots > 12) {
      result.warnings.push(
        `${equipment.name} requires ${equipment.criticalSlots} slots and may not fit in a single location`
      );
    }
  }
  
  /**
   * Check special restrictions
   */
  private static checkSpecialRestrictions(
    equipment: EquipmentVariant,
    context: ConstructionContext,
    result: EquipmentCompatibilityResult
  ): void {
    // Check for special equipment restrictions
    const restrictions = this.getEquipmentRestrictions(equipment);
    
    // Location restrictions
    if (restrictions.prohibitedLocations && restrictions.prohibitedLocations.length > 0) {
      result.restrictedLocations = restrictions.prohibitedLocations;
      result.warnings.push(
        `${equipment.name} cannot be placed in: ${restrictions.prohibitedLocations.join(', ')}`
      );
    }
    
    if (restrictions.requiresSpecificLocation) {
      result.warnings.push(
        `${equipment.name} must be placed in: ${restrictions.requiresSpecificLocation}`
      );
    }
    
    // Component requirements
    if (equipment.special && equipment.special.length > 0) {
      equipment.special.forEach(special => {
        if (special.includes('requires')) {
          result.requiredComponents = result.requiredComponents || [];
          result.requiredComponents.push(special);
        }
      });
    }
  }
  
  // ============================================================================
  // EQUIPMENT UPGRADE PATHS
  // ============================================================================
  
  /**
   * Get equipment upgrade options (e.g., IS to Clan variants)
   */
  static getEquipmentUpgradePaths(
    currentEquipment: EquipmentVariant,
    allEquipment: EquipmentVariant[],
    targetTechBase: DataTechBase
  ): EquipmentUpgradePath {
    const upgradePath: EquipmentUpgradePath = {
      currentEquipment,
      upgradeOptions: [],
      costDifference: 0,
      weightDifference: 0,
      performanceImprovement: []
    };
    
    // Find equipment with the same base type but different tech base
    const baseType = currentEquipment.baseType || currentEquipment.name;
    const baseNameNormalized = baseType.replace(/\s*\([^)]*\)/g, ''); // Remove tech base suffixes
    
    const potentialUpgrades = allEquipment.filter(eq => {
      const eqBaseName = (eq.baseType || eq.name).replace(/\s*\([^)]*\)/g, '');
      return eqBaseName === baseNameNormalized && 
             eq.techBase === targetTechBase &&
             eq.id !== currentEquipment.id;
    });
    
    upgradePath.upgradeOptions = potentialUpgrades;
    
    // Calculate differences for the first upgrade option
    if (potentialUpgrades.length > 0) {
      const upgrade = potentialUpgrades[0];
      
      upgradePath.costDifference = (upgrade.cost || 0) - (currentEquipment.cost || 0);
      upgradePath.weightDifference = upgrade.weight - currentEquipment.weight;
      
      // Compare performance
      if (upgrade.damage && currentEquipment.damage && upgrade.damage > currentEquipment.damage) {
        upgradePath.performanceImprovement.push(
          `Damage increased: ${currentEquipment.damage} → ${upgrade.damage}`
        );
      }
      
      if (upgrade.criticalSlots < currentEquipment.criticalSlots) {
        upgradePath.performanceImprovement.push(
          `Slots reduced: ${currentEquipment.criticalSlots} → ${upgrade.criticalSlots}`
        );
      }
      
      if (upgrade.weight < currentEquipment.weight) {
        upgradePath.performanceImprovement.push(
          `Weight reduced: ${currentEquipment.weight} → ${upgrade.weight} tons`
        );
      }
      
      if (upgrade.rangeLong && currentEquipment.rangeLong && upgrade.rangeLong > currentEquipment.rangeLong) {
        upgradePath.performanceImprovement.push(
          `Range increased: ${currentEquipment.rangeLong} → ${upgrade.rangeLong}`
        );
      }
    }
    
    return upgradePath;
  }
  
  /**
   * Calculate mixed technology penalties
   */
  static calculateMixedTechPenalties(
    equipment: EquipmentVariant[],
    context: ConstructionContext
  ): {
    battleValueMultiplier: number;
    costMultiplier: number;
    restrictions: string[];
  } {
    if (!context.techBase.includes('Mixed')) {
      return {
        battleValueMultiplier: 1.0,
        costMultiplier: 1.0,
        restrictions: []
      };
    }
    
    const chassisTechBase = context.techBase.includes('IS') ? 'IS' : 'Clan';
    const mixedTechCount = equipment.filter(
      eq => eq.techBase !== chassisTechBase
    ).length;
    const totalEquipmentCount = equipment.length;
    
    if (totalEquipmentCount === 0) {
      return {
        battleValueMultiplier: 1.0,
        costMultiplier: 1.0,
        restrictions: []
      };
    }
    
    const mixedTechPercentage = mixedTechCount / totalEquipmentCount;
    
    // Calculate penalties based on mixed tech percentage
    const battleValueMultiplier = Math.min(1.0 + (mixedTechPercentage * 0.25), 2.0); // Cap at 100% penalty
    const costMultiplier = Math.min(1.0 + (mixedTechPercentage * 0.5), 3.0); // Cap at 200% penalty
    
    const restrictions: string[] = [];
    
    if (mixedTechPercentage > 0) {
      restrictions.push('Mixed technology requires specialized maintenance');
      restrictions.push('Mixed technology may be difficult to repair in the field');
    }
    
    if (mixedTechPercentage > 0.5) {
      restrictions.push('High mixed tech percentage may cause reliability issues');
    }
    
    return {
      battleValueMultiplier,
      costMultiplier,
      restrictions
    };
  }
  
  // ============================================================================
  // EQUIPMENT RESTRICTIONS
  // ============================================================================
  
  /**
   * Get equipment location restrictions
   */
  static getEquipmentRestrictions(equipment: EquipmentVariant): EquipmentLocationRestrictions {
    const restrictions: EquipmentLocationRestrictions = {};
    
    // Special location restrictions based on equipment category and special rules
    if (equipment.category === 'Weapons' && equipment.special) {
      equipment.special.forEach(special => {
        if (special.toLowerCase().includes('head mounted')) {
          restrictions.requiresSpecificLocation = 'Head';
        }
        if (special.toLowerCase().includes('torso mounted')) {
          restrictions.allowedLocations = ['Center Torso', 'Left Torso', 'Right Torso'];
        }
        if (special.toLowerCase().includes('arm mounted')) {
          restrictions.allowedLocations = ['Left Arm', 'Right Arm'];
        }
      });
    }
    
    // Engine equipment must be in torso
    if (equipment.category === 'Engine' || equipment.name.toLowerCase().includes('engine')) {
      restrictions.allowedLocations = ['Center Torso', 'Left Torso', 'Right Torso'];
    }
    
    // Cockpit equipment must be in head or center torso
    if (equipment.category === 'Cockpit' || equipment.name.toLowerCase().includes('cockpit')) {
      restrictions.allowedLocations = ['Head', 'Center Torso'];
    }
    
    // Jump jets typically distributed across legs and torso
    if (equipment.category === 'Physical' && equipment.name.toLowerCase().includes('jump jet')) {
      restrictions.allowedLocations = ['Left Leg', 'Right Leg', 'Left Torso', 'Right Torso', 'Center Torso'];
    }
    
    return restrictions;
  }
  
  /**
   * Check if equipment has minimum tonnage requirement
   */
  private static hasMinimumTonnageRequirement(equipment: EquipmentVariant): boolean {
    // Some equipment has minimum tonnage requirements
    const minTonnageEquipment = [
      'Gauss Rifle',
      'Heavy Gauss Rifle',
      'Assault Cannon',
      'Rotary AC',
      'Ultra AC'
    ];
    
    return minTonnageEquipment.some(name => 
      equipment.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  /**
   * Get minimum tonnage requirement for equipment
   */
  private static getMinimumTonnageRequirement(equipment: EquipmentVariant): number {
    // Simplified minimum tonnage requirements
    if (equipment.name.toLowerCase().includes('gauss rifle')) {
      return 50; // Gauss rifles typically require 50+ ton mechs
    }
    if (equipment.name.toLowerCase().includes('heavy gauss')) {
      return 70; // Heavy Gauss requires heavier mechs
    }
    if (equipment.name.toLowerCase().includes('assault')) {
      return 60; // Assault weapons typically require 60+ tons
    }
    
    return 20; // Default minimum
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  /**
   * Parse era string to year
   */
  private static parseEraToYear(era: string): number {
    const eraYearMap: Record<string, number> = {
      'Succession Wars': 3025,
      'Clan Invasion': 3050,
      'FedCom Civil War': 3057,
      'Jihad': 3067,
      'Dark Age': 3135,
      'Republic': 3085,
      'ilClan': 3151
    };
    
    // Try to parse as a number first
    const numericYear = parseInt(era);
    if (!isNaN(numericYear)) {
      return numericYear;
    }
    
    // Otherwise, look up the era
    return eraYearMap[era] || 3025;
  }
  
  /**
   * Convert chassis tech base to equipment data tech base
   */
  private static convertTechBaseToDataTechBase(techBase: TechBase): DataTechBase | 'all' {
    if (techBase === 'Inner Sphere' || techBase === 'Mixed (IS Chassis)') {
      return 'IS';
    }
    if (techBase === 'Clan' || techBase === 'Mixed (Clan Chassis)') {
      return 'Clan';
    }
    return 'all';
  }
  
  /**
   * Get equipment by category
   */
  static getEquipmentByCategory(
    equipment: EquipmentVariant[],
    category: string
  ): EquipmentVariant[] {
    return equipment.filter(eq => eq.category === category);
  }
  
  /**
   * Get all unique equipment categories
   */
  static getEquipmentCategories(equipment: EquipmentVariant[]): string[] {
    const categories = new Set(equipment.map(eq => eq.category));
    return Array.from(categories).sort();
  }
  
  /**
   * Get equipment statistics
   */
  static getEquipmentStatistics(equipment: EquipmentVariant[]): {
    totalCount: number;
    averageWeight: number;
    averageSlots: number;
    categoryCounts: Record<string, number>;
    techBaseDistribution: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};
    const techBaseDistribution: Record<string, number> = {};
    
    let totalWeight = 0;
    let totalSlots = 0;
    
    equipment.forEach(eq => {
      categoryCounts[eq.category] = (categoryCounts[eq.category] || 0) + 1;
      techBaseDistribution[eq.techBase] = (techBaseDistribution[eq.techBase] || 0) + 1;
      totalWeight += eq.weight;
      totalSlots += eq.criticalSlots;
    });
    
    return {
      totalCount: equipment.length,
      averageWeight: equipment.length > 0 ? totalWeight / equipment.length : 0,
      averageSlots: equipment.length > 0 ? totalSlots / equipment.length : 0,
      categoryCounts,
      techBaseDistribution
    };
  }
}
