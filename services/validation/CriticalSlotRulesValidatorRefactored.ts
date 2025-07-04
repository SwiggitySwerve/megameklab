/**
 * CriticalSlotRulesValidator - Refactored version using Facade and Chain of Responsibility
 * 
 * This refactored version maintains backward compatibility while using the new 
 * service-oriented architecture with facades and validators.
 * 
 * @see TECHNICAL_ARCHITECTURE.md for service architecture patterns
 */

import { CriticalSlotValidationFacade } from './CriticalSlotValidationFacade'
import { 
  CriticalSlotValidation, 
  CriticalSlotValidationContext,
  SlotOptimization
} from './types/CriticalSlotValidationTypes'
import { UnitConfiguration } from '../../utils/criticalSlots/UnitCriticalManager'

/**
 * Refactored Critical Slot Rules Validator
 * Uses the new facade pattern to coordinate all validation services
 */
export class CriticalSlotRulesValidator {
  private static facade: CriticalSlotValidationFacade = new CriticalSlotValidationFacade()

  // Default validation context for backward compatibility
  private static readonly DEFAULT_CONTEXT: CriticalSlotValidationContext = {
    strictMode: false,
    validateSpecialComponents: true,
    validatePlacement: true,
    allowFlexiblePlacement: false,
    checkLocationRestrictions: true
  }

  /**
   * Main validation method - maintains backward compatibility with original interface
   */
  static validateCriticalSlots(
    config: UnitConfiguration, 
    equipment: any[], 
    context: Partial<CriticalSlotValidationContext> = {}
  ): CriticalSlotValidation {
    // Merge provided context with defaults
    const mergedContext = { ...this.DEFAULT_CONTEXT, ...context }

    // Use the facade for validation
    return this.facade.validateWithCustomContext(config, equipment, mergedContext)
  }

  /**
   * Validate using strict BattleTech rules
   */
  static validateStrict(config: UnitConfiguration, equipment: any[]): CriticalSlotValidation {
    return this.facade.validateCriticalSlots(config, equipment, 'Strict BattleTech Rules')
  }

  /**
   * Validate using flexible rules for better gameplay experience
   */
  static validateFlexible(config: UnitConfiguration, equipment: any[]): CriticalSlotValidation {
    return this.facade.validateCriticalSlots(config, equipment, 'Flexible Rules')
  }

  /**
   * Validate using tournament-level rules for competitive play
   */
  static validateTournament(config: UnitConfiguration, equipment: any[]): CriticalSlotValidation {
    return this.facade.validateCriticalSlots(config, equipment, 'Tournament Rules')
  }

  /**
   * Quick validation for fast iteration during design
   */
  static quickValidate(config: UnitConfiguration, equipment: any[]): boolean {
    return this.facade.quickValidate(config, equipment)
  }

  /**
   * Generate slot optimization recommendations
   */
  static generateSlotOptimizations(config: UnitConfiguration, equipment: any[]): SlotOptimization {
    return this.facade.generateOptimizations(config, equipment)
  }

  /**
   * Calculate overall slot efficiency as a percentage
   */
  static calculateSlotEfficiency(config: UnitConfiguration, equipment: any[]): number {
    const validation = this.facade.validateCriticalSlots(config, equipment)
    
    if (validation.totalSlotsAvailable === 0) return 0
    
    // Calculate efficiency based on balanced utilization
    const locations = Object.values(validation.locationUtilization)
    const utilizations = locations.map(loc => loc.utilization)
    
    // Efficiency is higher when utilization is balanced across locations
    const averageUtilization = utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length
    const variance = this.calculateVariance(utilizations)
    
    // Penalize high variance (unbalanced distribution)
    const balancePenalty = Math.min(50, variance / 10)
    const efficiency = Math.max(0, averageUtilization - balancePenalty)
    
    return Math.round(efficiency * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Get validation rules documentation
   */
  static getValidationRules(): Array<{
    name: string
    description: string
    severity: string
    category: string
  }> {
    return [
      {
        name: 'Slot Overflow',
        description: 'Equipment exceeds available critical slots in a location',
        severity: 'Critical',
        category: 'Slot Management'
      },
      {
        name: 'Endo Steel Slots',
        description: 'Endo Steel structure requires correct slot allocation',
        severity: 'Critical',
        category: 'Special Components'
      },
      {
        name: 'Ferro-Fibrous Slots',
        description: 'Ferro-Fibrous armor requires correct slot allocation',
        severity: 'Critical',
        category: 'Special Components'
      },
      {
        name: 'Double Heat Sink Slots',
        description: 'External Double Heat Sinks require 3 critical slots each',
        severity: 'Major',
        category: 'Heat Management'
      },
      {
        name: 'Artemis Pairing',
        description: 'Artemis-capable weapons must be paired with Artemis systems',
        severity: 'Major',
        category: 'Fire Control'
      },
      {
        name: 'Targeting Computer Slots',
        description: 'Targeting Computer requires slots based on mech tonnage',
        severity: 'Major',
        category: 'Fire Control'
      },
      {
        name: 'Component Placement',
        description: 'Equipment must be placed in valid locations',
        severity: 'Major',
        category: 'Placement Rules'
      },
      {
        name: 'Location Restrictions',
        description: 'Some equipment has specific location requirements',
        severity: 'Minor',
        category: 'Placement Rules'
      }
    ]
  }

  /**
   * Compare validation results across different rule sets
   */
  static compareValidationStrategies(config: UnitConfiguration, equipment: any[]): {
    [strategyName: string]: CriticalSlotValidation
  } {
    return this.facade.compareStrategies(config, equipment)
  }

  /**
   * Get available validation strategies
   */
  static getAvailableStrategies(): string[] {
    return this.facade.getAvailableStrategies()
  }

  /**
   * Get detailed information about a validation strategy
   */
  static getStrategyDetails(strategyName: string): {
    name: string
    description: string
    context: CriticalSlotValidationContext
  } | null {
    return this.facade.getStrategyDetails(strategyName)
  }

  /**
   * Set the default validation strategy for all operations
   */
  static setDefaultValidationStrategy(strategyName: string): void {
    this.facade.setDefaultStrategy(strategyName)
  }

  /**
   * Validate critical slots with detailed configuration options
   */
  static validateWithOptions(
    config: UnitConfiguration,
    equipment: any[],
    options: {
      strategy?: string
      strictMode?: boolean
      validateSpecialComponents?: boolean
      validatePlacement?: boolean
      allowFlexiblePlacement?: boolean
      checkLocationRestrictions?: boolean
    } = {}
  ): CriticalSlotValidation {
    if (options.strategy) {
      return this.facade.validateCriticalSlots(config, equipment, options.strategy)
    } else {
      // Use custom context
      const context: Partial<CriticalSlotValidationContext> = {
        strictMode: options.strictMode,
        validateSpecialComponents: options.validateSpecialComponents,
        validatePlacement: options.validatePlacement,
        allowFlexiblePlacement: options.allowFlexiblePlacement,
        checkLocationRestrictions: options.checkLocationRestrictions
      }
      return this.facade.validateWithCustomContext(config, equipment, context)
    }
  }

  /**
   * Get validation summary for display purposes
   */
  static getValidationSummary(config: UnitConfiguration, equipment: any[]): {
    overallValid: boolean
    criticalViolations: number
    majorViolations: number
    minorViolations: number
    totalSlotUsage: string
    efficiency: number
    recommendations: string[]
  } {
    const validation = this.validateCriticalSlots(config, equipment)
    
    const criticalViolations = validation.violations.filter(v => v.severity === 'critical').length
    const majorViolations = validation.violations.filter(v => v.severity === 'major').length
    const minorViolations = validation.violations.filter(v => v.severity === 'minor').length
    
    const efficiency = this.calculateSlotEfficiency(config, equipment)
    const slotUsage = `${validation.totalSlotsUsed}/${validation.totalSlotsAvailable}`
    
    return {
      overallValid: validation.isValid,
      criticalViolations,
      majorViolations,
      minorViolations,
      totalSlotUsage: slotUsage,
      efficiency,
      recommendations: validation.recommendations.slice(0, 5) // Top 5 recommendations
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Calculate variance for utilization balance analysis
   */
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2))
    return squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * Reset facade instance (for testing purposes)
   */
  static resetFacade(): void {
    this.facade = new CriticalSlotValidationFacade()
  }
}