/**
 * Rules Data Provider - Centralized data source for BattleTech construction rules
 * 
 * This module consolidates all component and equipment serving logic into a single,
 * self-contained data provider that is isolated from the rest of the construction logic.
 * 
 * Purpose:
 * - Serve available components (engines, gyros, heat sinks, structure, armor) based on tech base and context
 * - Provide equipment compatibility and filtering rules
 * - Validate component selections against construction rules
 * - Calculate component requirements (slots, weight, cost)
 * 
 * This provider is intentionally isolated from:
 * - State management (UnitStateManager)
 * - Critical slot allocation (CriticalSlotCalculator)
 * - Unit construction (MechConstructor)
 * - Equipment data access (EquipmentDataService)
 */

import { TechBase as EquipmentTechBase } from '../../data/equipment';

// Core types for rules data
export type TechBase = 'Inner Sphere' | 'Clan' | 'Mixed (IS Chassis)' | 'Mixed (Clan Chassis)';
export type EngineType = 'Standard' | 'XL (IS)' | 'XL (Clan)' | 'Light' | 'XXL' | 'Compact' | 'ICE' | 'Fuel Cell';
export type GyroType = 'Standard' | 'XL' | 'Compact' | 'Heavy-Duty';
export type HeatSinkType = 'Single' | 'Double (IS)' | 'Double (Clan)' | 'Compact' | 'Laser';
export type StructureType = 'Standard' | 'Endo Steel' | 'Endo Steel (Clan)' | 'Composite' | 'Reinforced' | 'Industrial';
export type ArmorType = 'Standard' | 'Ferro-Fibrous' | 'Ferro-Fibrous (Clan)' | 'Light Ferro-Fibrous' | 'Heavy Ferro-Fibrous' | 'Stealth' | 'Reactive' | 'Reflective' | 'Hardened';
export type CockpitType = 'Standard' | 'Small' | 'Command Console' | 'Torso-Mounted' | 'Primitive';

export interface ComponentOption {
  id: string;
  name: string;
  displayName: string;
  techBase: TechBase | 'Both';
  available: boolean;
  reason?: string;
  requirements: {
    criticalSlots: number;
    weight: number;
    cost: number;
    techLevel: string;
    introductionYear: number;
    extinctionYear?: number;
  };
  specialRules?: string[];
}

export interface ConstructionContext {
  techBase: TechBase;
  era: string;
  techLevel: string;
  mechTonnage: number;
  engineRating?: number;
  currentComponents?: {
    engine?: EngineType;
    gyro?: GyroType;
    structure?: StructureType;
    armor?: ArmorType;
    heatSinks?: HeatSinkType;
  };
}

export interface ComponentCompatibilityResult {
  isCompatible: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface EquipmentCompatibilityRules {
  techBase: EquipmentTechBase | 'Both';
  introductionYear: number;
  extinctionYear?: number;
  weightRestrictions?: {
    minTonnage?: number;
    maxTonnage?: number;
  };
  locationRestrictions?: string[];
  incompatibleWith?: string[];
  requiredComponents?: string[];
}

/**
 * Centralized Rules Data Provider
 * Serves component and equipment availability based on construction rules
 */
export class RulesDataProvider {
  
  // ============================================================================
  // COMPONENT AVAILABILITY METHODS
  // ============================================================================
  
  /**
   * Get available engine types for the given construction context
   */
  static getAvailableEngineTypes(context: ConstructionContext): ComponentOption[] {
    const options: ComponentOption[] = [];
    
    const engineTypes: EngineType[] = ['Standard', 'XL (IS)', 'XL (Clan)', 'Light', 'XXL', 'Compact', 'ICE', 'Fuel Cell'];
    
    engineTypes.forEach(engineType => {
      const techBase = this.getEngineTechBase(engineType);
      const isCompatible = this.isComponentCompatibleWithTechBase(techBase, context.techBase);
      const slots = this.getEngineSlotRequirements(engineType);
      
      options.push({
        id: engineType,
        name: engineType,
        displayName: this.formatEngineName(engineType),
        techBase,
        available: isCompatible,
        reason: isCompatible ? undefined : `Incompatible with ${context.techBase} chassis`,
        requirements: {
          criticalSlots: slots.centerTorso + slots.leftTorso + slots.rightTorso,
          weight: this.calculateEngineWeight(engineType, context.engineRating || 0),
          cost: this.calculateEngineCost(engineType, context.engineRating || 0),
          techLevel: this.getEngineTechLevel(engineType),
          introductionYear: this.getEngineIntroductionYear(engineType),
          extinctionYear: this.getEngineExtinctionYear(engineType)
        },
        specialRules: this.getEngineSpecialRules(engineType)
      });
    });
    
    return options;
  }
  
  /**
   * Get available gyro types for the given construction context
   */
  static getAvailableGyroTypes(context: ConstructionContext): ComponentOption[] {
    const options: ComponentOption[] = [];
    
    const gyroTypes: GyroType[] = ['Standard', 'XL', 'Compact', 'Heavy-Duty'];
    
    gyroTypes.forEach(gyroType => {
      const techBase = this.getGyroTechBase(gyroType);
      const isCompatible = this.isComponentCompatibleWithTechBase(techBase, context.techBase);
      const slots = this.getGyroSlotRequirements(gyroType);
      
      options.push({
        id: gyroType,
        name: gyroType,
        displayName: this.formatGyroName(gyroType),
        techBase,
        available: isCompatible,
        reason: isCompatible ? undefined : `Incompatible with ${context.techBase} chassis`,
        requirements: {
          criticalSlots: slots,
          weight: this.calculateGyroWeight(gyroType, context.engineRating || 0),
          cost: this.calculateGyroCost(gyroType, context.engineRating || 0),
          techLevel: this.getGyroTechLevel(gyroType),
          introductionYear: this.getGyroIntroductionYear(gyroType)
        },
        specialRules: this.getGyroSpecialRules(gyroType)
      });
    });
    
    return options;
  }
  
  /**
   * Get available heat sink types for the given construction context
   */
  static getAvailableHeatSinkTypes(context: ConstructionContext): ComponentOption[] {
    const options: ComponentOption[] = [];
    
    const heatSinkTypes: HeatSinkType[] = ['Single', 'Double (IS)', 'Double (Clan)', 'Compact', 'Laser'];
    
    heatSinkTypes.forEach(heatSinkType => {
      const techBase = this.getHeatSinkTechBase(heatSinkType);
      const isCompatible = this.isComponentCompatibleWithTechBase(techBase, context.techBase);
      const slots = this.getHeatSinkSlotRequirements(heatSinkType);
      
      options.push({
        id: heatSinkType,
        name: heatSinkType,
        displayName: this.formatHeatSinkName(heatSinkType),
        techBase,
        available: isCompatible,
        reason: isCompatible ? undefined : `Incompatible with ${context.techBase} chassis`,
        requirements: {
          criticalSlots: slots,
          weight: 1.0,
          cost: this.calculateHeatSinkCost(heatSinkType),
          techLevel: this.getHeatSinkTechLevel(heatSinkType),
          introductionYear: this.getHeatSinkIntroductionYear(heatSinkType)
        },
        specialRules: this.getHeatSinkSpecialRules(heatSinkType)
      });
    });
    
    return options;
  }
  
  /**
   * Get available structure types for the given construction context
   */
  static getAvailableStructureTypes(context: ConstructionContext): ComponentOption[] {
    const options: ComponentOption[] = [];
    
    const structureTypes: StructureType[] = ['Standard', 'Endo Steel', 'Endo Steel (Clan)', 'Composite', 'Reinforced', 'Industrial'];
    
    structureTypes.forEach(structureType => {
      const techBase = this.getStructureTechBase(structureType);
      const isCompatible = this.isComponentCompatibleWithTechBase(techBase, context.techBase);
      const slots = this.getStructureSlotRequirements(structureType);
      
      options.push({
        id: structureType,
        name: structureType,
        displayName: this.formatStructureName(structureType),
        techBase,
        available: isCompatible,
        reason: isCompatible ? undefined : `Incompatible with ${context.techBase} chassis`,
        requirements: {
          criticalSlots: slots,
          weight: this.calculateStructureWeight(structureType, context.mechTonnage),
          cost: this.calculateStructureCost(structureType, context.mechTonnage),
          techLevel: this.getStructureTechLevel(structureType),
          introductionYear: this.getStructureIntroductionYear(structureType)
        },
        specialRules: this.getStructureSpecialRules(structureType)
      });
    });
    
    return options;
  }
  
  /**
   * Get available armor types for the given construction context
   */
  static getAvailableArmorTypes(context: ConstructionContext): ComponentOption[] {
    const options: ComponentOption[] = [];
    
    const armorTypes: ArmorType[] = [
      'Standard', 'Ferro-Fibrous', 'Ferro-Fibrous (Clan)', 
      'Light Ferro-Fibrous', 'Heavy Ferro-Fibrous', 
      'Stealth', 'Reactive', 'Reflective', 'Hardened'
    ];
    
    armorTypes.forEach(armorType => {
      const techBase = this.getArmorTechBase(armorType);
      const isCompatible = this.isComponentCompatibleWithTechBase(techBase, context.techBase);
      const slots = this.getArmorSlotRequirements(armorType);
      
      options.push({
        id: armorType,
        name: armorType,
        displayName: this.formatArmorName(armorType),
        techBase,
        available: isCompatible,
        reason: isCompatible ? undefined : `Incompatible with ${context.techBase} chassis`,
        requirements: {
          criticalSlots: slots,
          weight: 0, // Armor weight is calculated based on points
          cost: 0, // Armor cost is calculated based on tonnage
          techLevel: this.getArmorTechLevel(armorType),
          introductionYear: this.getArmorIntroductionYear(armorType)
        },
        specialRules: this.getArmorSpecialRules(armorType)
      });
    });
    
    return options;
  }
  
  // ============================================================================
  // TECH BASE COMPATIBILITY
  // ============================================================================
  
  /**
   * Check if a component tech base is compatible with the chassis tech base
   */
  static isComponentCompatibleWithTechBase(
    componentTechBase: TechBase | 'Both',
    chassisTechBase: TechBase
  ): boolean {
    if (componentTechBase === 'Both') return true;
    
    if (chassisTechBase === 'Inner Sphere' && componentTechBase === 'Inner Sphere') return true;
    if (chassisTechBase === 'Clan' && componentTechBase === 'Clan') return true;
    if (chassisTechBase === 'Mixed (IS Chassis)' && componentTechBase === 'Inner Sphere') return true;
    if (chassisTechBase === 'Mixed (Clan Chassis)' && componentTechBase === 'Clan') return true;
    
    // Mixed tech allows cross-compatibility with penalties
    if (chassisTechBase.startsWith('Mixed')) return true;
    
    return false;
  }
  
  /**
   * Validate component compatibility with current configuration
   */
  static validateComponentCompatibility(
    componentType: string,
    componentId: string,
    context: ConstructionContext
  ): ComponentCompatibilityResult {
    const result: ComponentCompatibilityResult = {
      isCompatible: true,
      issues: [],
      warnings: [],
      recommendations: []
    };
    
    // Get component options based on type
    let options: ComponentOption[] = [];
    switch (componentType) {
      case 'engine':
        options = this.getAvailableEngineTypes(context);
        break;
      case 'gyro':
        options = this.getAvailableGyroTypes(context);
        break;
      case 'heatSink':
        options = this.getAvailableHeatSinkTypes(context);
        break;
      case 'structure':
        options = this.getAvailableStructureTypes(context);
        break;
      case 'armor':
        options = this.getAvailableArmorTypes(context);
        break;
      default:
        result.issues.push(`Unknown component type: ${componentType}`);
        result.isCompatible = false;
        return result;
    }
    
    // Find the specific component
    const component = options.find(opt => opt.id === componentId);
    
    if (!component) {
      result.issues.push(`Component ${componentId} not found`);
      result.isCompatible = false;
      return result;
    }
    
    // Check availability
    if (!component.available) {
      result.issues.push(component.reason || 'Component not available');
      result.isCompatible = false;
    }
    
    // Add special rules as warnings
    if (component.specialRules && component.specialRules.length > 0) {
      result.warnings.push(...component.specialRules);
    }
    
    return result;
  }
  
  // ============================================================================
  // TECH BASE DETERMINATION
  // ============================================================================
  
  private static getEngineTechBase(engineType: EngineType): TechBase | 'Both' {
    const techBases: Record<EngineType, TechBase | 'Both'> = {
      'Standard': 'Both',
      'XL (IS)': 'Inner Sphere',
      'XL (Clan)': 'Clan',
      'Light': 'Inner Sphere',
      'XXL': 'Clan',
      'Compact': 'Both',
      'ICE': 'Both',
      'Fuel Cell': 'Both'
    };
    return techBases[engineType] || 'Both';
  }
  
  private static getGyroTechBase(gyroType: GyroType): TechBase | 'Both' {
    const techBases: Record<GyroType, TechBase | 'Both'> = {
      'Standard': 'Both',
      'XL': 'Inner Sphere',
      'Compact': 'Inner Sphere',
      'Heavy-Duty': 'Inner Sphere'
    };
    return techBases[gyroType] || 'Both';
  }
  
  private static getHeatSinkTechBase(heatSinkType: HeatSinkType): TechBase | 'Both' {
    const techBases: Record<HeatSinkType, TechBase | 'Both'> = {
      'Single': 'Both',
      'Double (IS)': 'Inner Sphere',
      'Double (Clan)': 'Clan',
      'Compact': 'Clan',
      'Laser': 'Clan'
    };
    return techBases[heatSinkType] || 'Both';
  }
  
  private static getStructureTechBase(structureType: StructureType): TechBase | 'Both' {
    const techBases: Record<StructureType, TechBase | 'Both'> = {
      'Standard': 'Both',
      'Endo Steel': 'Inner Sphere',
      'Endo Steel (Clan)': 'Clan',
      'Composite': 'Both',
      'Reinforced': 'Both',
      'Industrial': 'Both'
    };
    return techBases[structureType] || 'Both';
  }
  
  private static getArmorTechBase(armorType: ArmorType): TechBase | 'Both' {
    const techBases: Record<ArmorType, TechBase | 'Both'> = {
      'Standard': 'Both',
      'Ferro-Fibrous': 'Inner Sphere',
      'Ferro-Fibrous (Clan)': 'Clan',
      'Light Ferro-Fibrous': 'Clan',
      'Heavy Ferro-Fibrous': 'Inner Sphere',
      'Stealth': 'Both',
      'Reactive': 'Inner Sphere',
      'Reflective': 'Inner Sphere',
      'Hardened': 'Both'
    };
    return techBases[armorType] || 'Both';
  }
  
  // ============================================================================
  // SLOT REQUIREMENTS
  // ============================================================================
  
  private static getEngineSlotRequirements(engineType: EngineType): { centerTorso: number; leftTorso: number; rightTorso: number } {
    const requirements: Record<EngineType, { centerTorso: number; leftTorso: number; rightTorso: number }> = {
      'Standard': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
      'XL (IS)': { centerTorso: 6, leftTorso: 3, rightTorso: 3 },
      'XL (Clan)': { centerTorso: 6, leftTorso: 3, rightTorso: 3 },
      'Light': { centerTorso: 6, leftTorso: 2, rightTorso: 2 },
      'XXL': { centerTorso: 6, leftTorso: 6, rightTorso: 6 },
      'Compact': { centerTorso: 3, leftTorso: 0, rightTorso: 0 },
      'ICE': { centerTorso: 6, leftTorso: 0, rightTorso: 0 },
      'Fuel Cell': { centerTorso: 6, leftTorso: 0, rightTorso: 0 }
    };
    return requirements[engineType] || { centerTorso: 6, leftTorso: 0, rightTorso: 0 };
  }
  
  private static getGyroSlotRequirements(gyroType: GyroType): number {
    const requirements: Record<GyroType, number> = {
      'Standard': 4,
      'XL': 6,
      'Compact': 2,
      'Heavy-Duty': 4
    };
    return requirements[gyroType] || 4;
  }
  
  private static getHeatSinkSlotRequirements(heatSinkType: HeatSinkType): number {
    const requirements: Record<HeatSinkType, number> = {
      'Single': 1,
      'Double (IS)': 3,
      'Double (Clan)': 2,
      'Compact': 1,
      'Laser': 2
    };
    return requirements[heatSinkType] || 1;
  }
  
  private static getStructureSlotRequirements(structureType: StructureType): number {
    const requirements: Record<StructureType, number> = {
      'Standard': 0,
      'Endo Steel': 14,
      'Endo Steel (Clan)': 7,
      'Composite': 0,
      'Reinforced': 0,
      'Industrial': 0
    };
    return requirements[structureType] || 0;
  }
  
  private static getArmorSlotRequirements(armorType: ArmorType): number {
    const requirements: Record<ArmorType, number> = {
      'Standard': 0,
      'Ferro-Fibrous': 14,
      'Ferro-Fibrous (Clan)': 7,
      'Light Ferro-Fibrous': 7,
      'Heavy Ferro-Fibrous': 21,
      'Stealth': 12,
      'Reactive': 14,
      'Reflective': 10,
      'Hardened': 0
    };
    return requirements[armorType] || 0;
  }
  
  // ============================================================================
  // WEIGHT CALCULATIONS
  // ============================================================================
  
  private static calculateEngineWeight(engineType: EngineType, rating: number): number {
    if (rating === 0) return 0;
    
    // Weight multipliers by engine type
    const multipliers: Record<EngineType, number> = {
      'Standard': 1.0,
      'XL (IS)': 0.5,
      'XL (Clan)': 0.5,
      'Light': 0.75,
      'XXL': 0.333,
      'Compact': 1.5,
      'ICE': 2.0,
      'Fuel Cell': 1.2
    };
    
    const multiplier = multipliers[engineType] || 1.0;
    const baseWeight = Math.ceil(rating / 25) * 0.5;
    return Math.ceil(baseWeight * multiplier * 2) / 2;
  }
  
  private static calculateGyroWeight(gyroType: GyroType, engineRating: number): number {
    if (engineRating === 0) return 0;
    
    const multipliers: Record<GyroType, number> = {
      'Standard': 1.0,
      'XL': 0.5,
      'Compact': 1.5,
      'Heavy-Duty': 2.0
    };
    
    const multiplier = multipliers[gyroType] || 1.0;
    const baseWeight = Math.ceil(engineRating / 100);
    return Math.ceil(baseWeight * multiplier * 2) / 2;
  }
  
  private static calculateStructureWeight(structureType: StructureType, tonnage: number): number {
    const multipliers: Record<StructureType, number> = {
      'Standard': 0.1,
      'Endo Steel': 0.05,
      'Endo Steel (Clan)': 0.05,
      'Composite': 0.05,
      'Reinforced': 0.2,
      'Industrial': 0.1
    };
    
    const multiplier = multipliers[structureType] || 0.1;
    return Math.ceil(tonnage * multiplier * 2) / 2;
  }
  
  // ============================================================================
  // COST CALCULATIONS
  // ============================================================================
  
  private static calculateEngineCost(engineType: EngineType, rating: number): number {
    if (rating === 0) return 0;
    
    const costMultipliers: Record<EngineType, number> = {
      'Standard': 5000,
      'XL (IS)': 20000,
      'XL (Clan)': 20000,
      'Light': 15000,
      'XXL': 100000,
      'Compact': 10000,
      'ICE': 1250,
      'Fuel Cell': 3500
    };
    
    return (costMultipliers[engineType] || 5000) * rating;
  }
  
  private static calculateGyroCost(gyroType: GyroType, engineRating: number): number {
    if (engineRating === 0) return 0;
    
    const costMultipliers: Record<GyroType, number> = {
      'Standard': 300000,
      'XL': 750000,
      'Compact': 400000,
      'Heavy-Duty': 500000
    };
    
    return costMultipliers[gyroType] || 300000;
  }
  
  private static calculateHeatSinkCost(heatSinkType: HeatSinkType): number {
    const costs: Record<HeatSinkType, number> = {
      'Single': 2000,
      'Double (IS)': 6000,
      'Double (Clan)': 6000,
      'Compact': 3000,
      'Laser': 6000
    };
    return costs[heatSinkType] || 2000;
  }
  
  private static calculateStructureCost(structureType: StructureType, tonnage: number): number {
    const costPerTon: Record<StructureType, number> = {
      'Standard': 0,
      'Endo Steel': 1600,
      'Endo Steel (Clan)': 1600,
      'Composite': 1200,
      'Reinforced': 6400,
      'Industrial': 0
    };
    
    return (costPerTon[structureType] || 0) * tonnage;
  }
  
  // ============================================================================
  // DISPLAY NAMES
  // ============================================================================
  
  private static formatEngineName(engineType: EngineType): string {
    const names: Record<EngineType, string> = {
      'Standard': 'Fusion Engine',
      'XL (IS)': 'XL Engine (IS)',
      'XL (Clan)': 'XL Engine (Clan)',
      'Light': 'Light Engine',
      'XXL': 'XXL Engine',
      'Compact': 'Compact Engine',
      'ICE': 'I.C.E. Engine',
      'Fuel Cell': 'Fuel Cell Engine'
    };
    return names[engineType] || engineType;
  }
  
  private static formatGyroName(gyroType: GyroType): string {
    return `${gyroType} Gyro`;
  }
  
  private static formatHeatSinkName(heatSinkType: HeatSinkType): string {
    const names: Record<HeatSinkType, string> = {
      'Single': 'Single Heat Sink',
      'Double (IS)': 'Double Heat Sink (IS)',
      'Double (Clan)': 'Double Heat Sink (Clan)',
      'Compact': 'Compact Heat Sink',
      'Laser': 'Laser Heat Sink'
    };
    return names[heatSinkType] || heatSinkType;
  }
  
  private static formatStructureName(structureType: StructureType): string {
    return `${structureType} Structure`;
  }
  
  private static formatArmorName(armorType: ArmorType): string {
    return `${armorType} Armor`;
  }
  
  // ============================================================================
  // TECH LEVELS AND INTRODUCTION YEARS
  // ============================================================================
  
  private static getEngineTechLevel(engineType: EngineType): string {
    const techLevels: Record<EngineType, string> = {
      'Standard': 'Introductory',
      'XL (IS)': 'Tournament',
      'XL (Clan)': 'Tournament',
      'Light': 'Advanced',
      'XXL': 'Experimental',
      'Compact': 'Standard',
      'ICE': 'Introductory',
      'Fuel Cell': 'Advanced'
    };
    return techLevels[engineType] || 'Standard';
  }
  
  private static getEngineIntroductionYear(engineType: EngineType): number {
    const years: Record<EngineType, number> = {
      'Standard': 2470,
      'XL (IS)': 2579,
      'XL (Clan)': 2824,
      'Light': 3055,
      'XXL': 3109,
      'Compact': 2460,
      'ICE': 1950,
      'Fuel Cell': 3045
    };
    return years[engineType] || 2470;
  }
  
  private static getEngineExtinctionYear(engineType: EngineType): number | undefined {
    // Most engines don't go extinct, but some might in specific eras
    return undefined;
  }
  
  private static getGyroTechLevel(gyroType: GyroType): string {
    const techLevels: Record<GyroType, string> = {
      'Standard': 'Introductory',
      'XL': 'Advanced',
      'Compact': 'Tournament',
      'Heavy-Duty': 'Tournament'
    };
    return techLevels[gyroType] || 'Standard';
  }
  
  private static getGyroIntroductionYear(gyroType: GyroType): number {
    const years: Record<GyroType, number> = {
      'Standard': 2470,
      'XL': 3067,
      'Compact': 3068,
      'Heavy-Duty': 3067
    };
    return years[gyroType] || 2470;
  }
  
  private static getHeatSinkTechLevel(heatSinkType: HeatSinkType): string {
    const techLevels: Record<HeatSinkType, string> = {
      'Single': 'Introductory',
      'Double (IS)': 'Tournament',
      'Double (Clan)': 'Tournament',
      'Compact': 'Advanced',
      'Laser': 'Experimental'
    };
    return techLevels[heatSinkType] || 'Standard';
  }
  
  private static getHeatSinkIntroductionYear(heatSinkType: HeatSinkType): number {
    const years: Record<HeatSinkType, number> = {
      'Single': 2470,
      'Double (IS)': 3040,
      'Double (Clan)': 2824,
      'Compact': 3068,
      'Laser': 3059
    };
    return years[heatSinkType] || 2470;
  }
  
  private static getStructureTechLevel(structureType: StructureType): string {
    const techLevels: Record<StructureType, string> = {
      'Standard': 'Introductory',
      'Endo Steel': 'Tournament',
      'Endo Steel (Clan)': 'Tournament',
      'Composite': 'Advanced',
      'Reinforced': 'Advanced',
      'Industrial': 'Introductory'
    };
    return techLevels[structureType] || 'Standard';
  }
  
  private static getStructureIntroductionYear(structureType: StructureType): number {
    const years: Record<StructureType, number> = {
      'Standard': 2439,
      'Endo Steel': 2487,
      'Endo Steel (Clan)': 2547,
      'Composite': 3078,
      'Reinforced': 3057,
      'Industrial': 2470
    };
    return years[structureType] || 2470;
  }
  
  private static getArmorTechLevel(armorType: ArmorType): string {
    const techLevels: Record<ArmorType, string> = {
      'Standard': 'Introductory',
      'Ferro-Fibrous': 'Tournament',
      'Ferro-Fibrous (Clan)': 'Tournament',
      'Light Ferro-Fibrous': 'Tournament',
      'Heavy Ferro-Fibrous': 'Advanced',
      'Stealth': 'Advanced',
      'Reactive': 'Advanced',
      'Reflective': 'Advanced',
      'Hardened': 'Advanced'
    };
    return techLevels[armorType] || 'Standard';
  }
  
  private static getArmorIntroductionYear(armorType: ArmorType): number {
    const years: Record<ArmorType, number> = {
      'Standard': 2439,
      'Ferro-Fibrous': 2571,
      'Ferro-Fibrous (Clan)': 2557,
      'Light Ferro-Fibrous': 3058,
      'Heavy Ferro-Fibrous': 3069,
      'Stealth': 3063,
      'Reactive': 3063,
      'Reflective': 3058,
      'Hardened': 3047
    };
    return years[armorType] || 2470;
  }
  
  // ============================================================================
  // SPECIAL RULES
  // ============================================================================
  
  private static getEngineSpecialRules(engineType: EngineType): string[] {
    const rules: Record<EngineType, string[]> = {
      'Standard': [],
      'XL (IS)': ['Destroyed if either side torso is lost'],
      'XL (Clan)': ['Operates with -2 penalty if one side torso is lost'],
      'Light': ['Operates with -1 penalty if one side torso is lost'],
      'XXL': ['Destroyed if any torso section is lost'],
      'Compact': ['More vulnerable to damage'],
      'ICE': ['No integrated heat sinks', 'Requires fuel'],
      'Fuel Cell': ['No integrated heat sinks', 'Requires fuel']
    };
    return rules[engineType] || [];
  }
  
  private static getGyroSpecialRules(gyroType: GyroType): string[] {
    const rules: Record<GyroType, string[]> = {
      'Standard': [],
      'XL': ['More fragile than standard gyro'],
      'Compact': ['Less efficient', 'Heavier than standard'],
      'Heavy-Duty': ['More resistant to damage', 'Significantly heavier']
    };
    return rules[gyroType] || [];
  }
  
  private static getHeatSinkSpecialRules(heatSinkType: HeatSinkType): string[] {
    const rules: Record<HeatSinkType, string[]> = {
      'Single': ['Dissipates 1 heat per turn'],
      'Double (IS)': ['Dissipates 2 heat per turn', 'Requires 3 critical slots'],
      'Double (Clan)': ['Dissipates 2 heat per turn', 'Requires 2 critical slots'],
      'Compact': ['Dissipates 1 heat per turn', 'More vulnerable to critical hits'],
      'Laser': ['Dissipates 2 heat per turn', 'Can be damaged by enemy fire']
    };
    return rules[heatSinkType] || [];
  }
  
  private static getStructureSpecialRules(structureType: StructureType): string[] {
    const rules: Record<StructureType, string[]> = {
      'Standard': [],
      'Endo Steel': ['Requires 14 critical slots', 'Reduces weight by 50%'],
      'Endo Steel (Clan)': ['Requires 7 critical slots', 'Reduces weight by 50%'],
      'Composite': ['Mixed structure', 'No critical slots required'],
      'Reinforced': ['Doubled internal structure points', 'Significantly heavier'],
      'Industrial': ['Standard industrial structure']
    };
    return rules[structureType] || [];
  }
  
  private static getArmorSpecialRules(armorType: ArmorType): string[] {
    const rules: Record<ArmorType, string[]> = {
      'Standard': [],
      'Ferro-Fibrous': ['Requires 14 critical slots', '12% more protection per ton'],
      'Ferro-Fibrous (Clan)': ['Requires 7 critical slots', '12% more protection per ton'],
      'Light Ferro-Fibrous': ['Requires 7 critical slots', '5% more protection per ton'],
      'Heavy Ferro-Fibrous': ['Requires 21 critical slots', '20% more protection per ton'],
      'Stealth': ['Requires 12 critical slots', 'Provides stealth capabilities'],
      'Reactive': ['Reactive to energy and missile weapons'],
      'Reflective': ['Reflects energy weapons'],
      'Hardened': ['Double armor protection', 'Twice as heavy']
    };
    return rules[armorType] || [];
  }
}
