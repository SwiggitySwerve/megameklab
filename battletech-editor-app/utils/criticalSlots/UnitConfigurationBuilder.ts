/**
 * Unit Configuration Builder
 * Extracted from UnitCriticalManager.ts for better organization
 */

import { EngineType } from './SystemComponentRules'
import { 
  UnitConfiguration, 
  LegacyUnitConfiguration, 
  StructureType, 
  ArmorType, 
  HeatSinkType 
} from './UnitCriticalManagerTypes'
// Import heat sink calculations
const heatSinkCalculations = require('../heatSinkCalculations');
const { calculateInternalHeatSinks, calculateInternalHeatSinksForEngine } = heatSinkCalculations;

/**
 * Utility functions for unit configuration
 */
export class UnitConfigurationBuilder {
  /**
   * Create a complete UnitConfiguration from legacy or partial configuration
   */
  static buildConfiguration(input: Partial<UnitConfiguration> | LegacyUnitConfiguration): UnitConfiguration {
    // Handle undefined or null input
    if (!input) {
      return this.getDefaultConfiguration()
    }
    
    // Handle legacy configuration
    if ('mass' in input && !('tonnage' in input)) {
      return this.fromLegacyConfiguration(input as LegacyUnitConfiguration)
    }
    
    // Handle partial configuration
    const defaults = this.getDefaultConfiguration()
    const config = { ...defaults, ...input } as UnitConfiguration
    
    // Ensure armorAllocation is properly merged if provided in input
    if (input && 'armorAllocation' in input && input.armorAllocation) {
      const mergedArmorAllocation = { ...defaults.armorAllocation };
      (Object.keys(defaults.armorAllocation) as (keyof typeof defaults.armorAllocation)[]).forEach(loc => {
        if (input.armorAllocation![loc]) {
          mergedArmorAllocation[loc] = {
            ...defaults.armorAllocation[loc],
            ...input.armorAllocation![loc]
          };
        }
      });
      config.armorAllocation = mergedArmorAllocation;
    }
    
    // Always recalculate engineRating unless explicitly set in the input
    if (!Object.prototype.hasOwnProperty.call(input, 'engineRating')) {
      config.engineRating = config.tonnage * config.walkMP
    }

    // Ensure enhancements is always an array
    if (!Array.isArray(config.enhancements)) {
      config.enhancements = [];
    }

    // Calculate dependent values
    const result = this.calculateDependentValues(config)
    if (process.env.NODE_ENV === 'test') {
      console.log('[DEBUG] buildConfiguration output armorAllocation:', JSON.stringify(result.armorAllocation));
    }
    return result
  }
  
  /**
   * Convert legacy configuration to new format
   */
  private static fromLegacyConfiguration(legacy: LegacyUnitConfiguration): UnitConfiguration {
    const tonnage = legacy.mass
    const walkMP = 4 // Default reasonable walk speed
    
    return this.calculateDependentValues({
      // Default chassis/model for legacy units
      chassis: 'Unknown',
      model: 'Legacy',
      tonnage,
      unitType: legacy.unitType,
      techBase: 'Inner Sphere',
      walkMP,
      engineRating: tonnage * walkMP,
      runMP: Math.floor(walkMP * 1.5),
      engineType: legacy.engineType,
      gyroType: { type: legacy.gyroType, techBase: 'Inner Sphere' },
      structureType: { type: 'Standard', techBase: 'Inner Sphere' },
      armorType: { type: 'Standard', techBase: 'Inner Sphere' },
      // Default armor allocation (minimal)
      armorAllocation: {
        HD: { front: 0, rear: 0 },
        CT: { front: 0, rear: 0 },
        LT: { front: 0, rear: 0 },
        RT: { front: 0, rear: 0 },
        LA: { front: 0, rear: 0 },
        RA: { front: 0, rear: 0 },
        LL: { front: 0, rear: 0 },
        RL: { front: 0, rear: 0 }
      },
      armorTonnage: 0,
      jumpMP: 0,
      jumpJetType: { type: 'None', techBase: 'Inner Sphere' },
      jumpJetCounts: {},
      hasPartialWing: false,
      heatSinkType: { type: 'Single', techBase: 'Inner Sphere' },
      totalHeatSinks: 10,
      internalHeatSinks: this.calculateInternalHeatSinksForEngine(tonnage * walkMP, legacy.engineType),
      externalHeatSinks: 0,
      enhancements: [],
      mass: tonnage
    })
  }
  
  /**
   * Get default configuration values
   */
  private static getDefaultConfiguration(): UnitConfiguration {
    return {
      chassis: 'Custom',
      model: 'Default',
      tonnage: 50,
      unitType: 'BattleMech',
      techBase: 'Inner Sphere',
      walkMP: 4,
      engineRating: 200,
      runMP: 6,
      engineType: 'Standard',
      gyroType: { type: 'Standard', techBase: 'Inner Sphere' },
      structureType: { type: 'Standard', techBase: 'Inner Sphere' },
      armorType: { type: 'Standard', techBase: 'Inner Sphere' },
      armorAllocation: {
        HD: { front: 0, rear: 0 },
        CT: { front: 0, rear: 0 },
        LT: { front: 0, rear: 0 },
        RT: { front: 0, rear: 0 },
        LA: { front: 0, rear: 0 },
        RA: { front: 0, rear: 0 },
        LL: { front: 0, rear: 0 },
        RL: { front: 0, rear: 0 }
      },
      armorTonnage: 0,
      jumpMP: 0,
      jumpJetType: { type: 'None', techBase: 'Inner Sphere' },
      jumpJetCounts: {},
      hasPartialWing: false,
      heatSinkType: { type: 'Single', techBase: 'Inner Sphere' },
      totalHeatSinks: 10,
      internalHeatSinks: 8, // 200 rating ÷ 25 = 8 heat sinks
      externalHeatSinks: 2, // 10 total - 8 internal = 2 external
      enhancements: [],
      mass: 50
    }
  }
  
  /**
   * Calculate dependent values based on primary configuration
   */
  private static calculateDependentValues(config: UnitConfiguration): UnitConfiguration {
    // Calculate engine rating if not provided
    if (!config.engineRating) {
      config.engineRating = config.tonnage * config.walkMP
    }
    
    // Calculate run MP if not provided
    if (!config.runMP) {
      config.runMP = Math.floor(config.walkMP * 1.5)
    }
    
    // Always recalculate internal heat sinks unless explicitly set in the input object
    if (!Object.prototype.hasOwnProperty.call(config, 'internalHeatSinks')) {
      config.internalHeatSinks = this.calculateInternalHeatSinksForEngine(config.engineRating, config.engineType)
    }
    // Only recalculate external heat sinks if not explicitly set in the input
    if (!Object.prototype.hasOwnProperty.call(config, 'externalHeatSinks')) {
      config.externalHeatSinks = Math.max(0, config.totalHeatSinks - config.internalHeatSinks)
    }
    // Set mass alias
    config.mass = config.tonnage
    
    return config
  }
  
  /**
   * Calculate internal heat sinks based on engine rating and type
   */
  private static calculateInternalHeatSinksForEngine(engineRating: number, engineType: EngineType): number {
    // Fallback implementation if import fails
    if (typeof calculateInternalHeatSinksForEngine === 'function') {
      return calculateInternalHeatSinksForEngine(engineRating, engineType);
    }
    
    // Direct implementation as fallback
    if (engineRating <= 0) return 0;
    
    // Non-fusion engines don't provide heat sinks
    if (engineType === 'ICE' || engineType === 'Fuel Cell') {
      return 0;
    }
    
    // Compact engines cannot integrate heat sinks
    if (engineType === 'Compact') {
      return 0;
    }
    
    // Official BattleTech rule: Engine Rating ÷ 25 (rounded down), NO MINIMUM for engine heat sinks
    return Math.floor(engineRating / 25);
  }
  
  /**
   * Calculate armor values based on configuration
   */
  private static calculateArmorValues(config: UnitConfiguration): {
    totalArmorPoints: number;
    armorTonnage: number;
    maxArmorPoints: number;
  } {
    // Calculate total allocated armor points
    const totalAllocated = Object.values(config.armorAllocation).reduce((sum, location) => {
      return sum + location.front + location.rear
    }, 0)
    
    // Calculate armor tonnage based on allocated points
    const armorTonnage = totalAllocated / 16 // Standard armor is 16 points per ton
    
    // Calculate maximum possible armor points
    const maxArmorPoints = Math.floor(config.tonnage * 2) // 2 points per ton maximum
    
    return {
      totalArmorPoints: totalAllocated,
      armorTonnage,
      maxArmorPoints
    }
  }
  
  /**
   * Validate engine rating against tonnage and walk MP
   */
  static validateEngineRating(tonnage: number, walkMP: number): { isValid: boolean, maxWalkMP: number, errors: string[] } {
    const errors: string[] = []
    const engineRating = tonnage * walkMP
    const maxEngineRating = 400
    
    // Check if engine rating exceeds maximum
    if (engineRating > maxEngineRating) {
      const maxWalkMP = Math.floor(maxEngineRating / tonnage)
      errors.push(`Engine rating ${engineRating} exceeds maximum of ${maxEngineRating}. Maximum walk MP for ${tonnage} tons is ${maxWalkMP}.`)
      return {
        isValid: false,
        maxWalkMP,
        errors
      }
    }
    
    // Check if walk MP is reasonable
    if (walkMP < 1) {
      errors.push('Walk MP must be at least 1.')
    }
    
    if (walkMP > 20) {
      errors.push('Walk MP cannot exceed 20.')
    }
    
    return {
      isValid: errors.length === 0,
      maxWalkMP: Math.floor(maxEngineRating / tonnage),
      errors
    }
  }
} 