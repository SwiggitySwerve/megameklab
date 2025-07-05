/**
 * Critical Slot Validation Facade
 * Coordinates all critical slot validators using Chain of Responsibility pattern
 * Uses Strategy pattern for different validation modes (strict vs flexible)
 */

import { 
  CriticalSlotValidation,
  CriticalSlotValidationContext,
  SlotOptimization 
} from './types/CriticalSlotValidationTypes'
import { BaseSlotValidator, ValidationRequest } from './validators/SlotOverflowValidator'
import { SlotOverflowValidator } from './validators/SlotOverflowValidator'
import { SpecialComponentValidator } from './validators/SpecialComponentValidator'

// Strategy interface for different validation approaches
export interface ValidationStrategy {
  getContext(): CriticalSlotValidationContext
  getName(): string
  getDescription(): string
}

// Strict validation strategy - enforces all BattleTech rules strictly
export class StrictValidationStrategy implements ValidationStrategy {
  getContext(): CriticalSlotValidationContext {
    return {
      strictMode: true,
      validateSpecialComponents: true,
      validatePlacement: true,
      allowFlexiblePlacement: false,
      checkLocationRestrictions: true
    }
  }

  getName(): string {
    return 'Strict BattleTech Rules'
  }

  getDescription(): string {
    return 'Enforces all BattleTech construction rules strictly with no flexibility'
  }
}

// Flexible validation strategy - allows some flexibility for gameplay
export class FlexibleValidationStrategy implements ValidationStrategy {
  getContext(): CriticalSlotValidationContext {
    return {
      strictMode: false,
      validateSpecialComponents: true,
      validatePlacement: true,
      allowFlexiblePlacement: true,
      checkLocationRestrictions: false
    }
  }

  getName(): string {
    return 'Flexible Rules'
  }

  getDescription(): string {
    return 'Allows flexible interpretation of rules for better gameplay experience'
  }
}

// Tournament validation strategy - strict rules for competitive play
export class TournamentValidationStrategy implements ValidationStrategy {
  getContext(): CriticalSlotValidationContext {
    return {
      strictMode: true,
      validateSpecialComponents: true,
      validatePlacement: true,
      allowFlexiblePlacement: false,
      checkLocationRestrictions: true
    }
  }

  getName(): string {
    return 'Tournament Rules'
  }

  getDescription(): string {
    return 'Tournament-level validation with strict compliance checking'
  }
}

// Quick validation strategy - basic checks only for fast iteration
export class QuickValidationStrategy implements ValidationStrategy {
  getContext(): CriticalSlotValidationContext {
    return {
      strictMode: false,
      validateSpecialComponents: false,
      validatePlacement: false,
      allowFlexiblePlacement: true,
      checkLocationRestrictions: false
    }
  }

  getName(): string {
    return 'Quick Validation'
  }

  getDescription(): string {
    return 'Basic validation for quick design iteration'
  }
}

/**
 * Critical Slot Validation Facade
 * Provides unified interface for all critical slot validation operations
 */
export class CriticalSlotValidationFacade {
  private strategies: Map<string, ValidationStrategy> = new Map()
  private defaultStrategy: string = 'Strict BattleTech Rules'
  private validationChain: BaseSlotValidator

  constructor() {
    this.initializeStrategies()
    this.buildValidationChain()
  }

  /**
   * Initialize validation strategies
   */
  private initializeStrategies(): void {
    this.registerStrategy(new StrictValidationStrategy())
    this.registerStrategy(new FlexibleValidationStrategy())
    this.registerStrategy(new TournamentValidationStrategy())
    this.registerStrategy(new QuickValidationStrategy())
  }

  /**
   * Build the chain of responsibility for validators
   */
  private buildValidationChain(): void {
    const overflowValidator = new SlotOverflowValidator()
    const specialComponentValidator = new SpecialComponentValidator()

    // Chain: Overflow -> Special Components -> (future validators)
    overflowValidator.setNext(specialComponentValidator)
    
    this.validationChain = overflowValidator
  }

  /**
   * Register a new validation strategy
   */
  registerStrategy(strategy: ValidationStrategy): void {
    this.strategies.set(strategy.getName(), strategy)
  }

  /**
   * Validate critical slots using specified strategy
   */
  validateCriticalSlots(
    config: any, 
    equipment: any[], 
    strategyName?: string
  ): CriticalSlotValidation {
    const strategy = this.getStrategy(strategyName || this.defaultStrategy)
    const context = strategy.getContext()

    // Initialize validation result with proper structure
    const result: CriticalSlotValidation = {
      isValid: true,
      totalSlotsUsed: 0,
      totalSlotsAvailable: 78, // Standard BattleMech total
      locationUtilization: {}, // Will be populated by validation chain
      specialComponentSlots: {
        endoSteel: { required: 0, allocated: 0, locations: [], isCompliant: true },
        ferroFibrous: { required: 0, allocated: 0, locations: [], isCompliant: true },
        doubleHeatSinks: { engineSlots: 0, externalSlots: 0, totalRequired: 0, isCompliant: true },
        artemis: { required: 0, allocated: 0, weaponPairings: [], isCompliant: true },
        targetingComputer: { required: 0, allocated: 0, location: '', isCompliant: true }
      },
      placementViolations: [],
      violations: [],
      recommendations: []
    }

    // Create validation request
    const request: ValidationRequest = {
      config,
      equipment,
      context,
      result
    }

    // Execute validation chain - this should populate locationUtilization
    this.validationChain.handle(request)

    // Calculate totals after validation chain has run
    this.calculateTotals(result)

    return result
  }

  /**
   * Validate with custom context
   */
  validateWithCustomContext(
    config: any, 
    equipment: any[], 
    context: Partial<CriticalSlotValidationContext>
  ): CriticalSlotValidation {
    const defaultContext = this.getStrategy(this.defaultStrategy).getContext()
    const mergedContext = { ...defaultContext, ...context }

    const result: CriticalSlotValidation = {
      isValid: true,
      totalSlotsUsed: 0,
      totalSlotsAvailable: 78,
      locationUtilization: {},
      specialComponentSlots: {
        endoSteel: { required: 0, allocated: 0, locations: [], isCompliant: true },
        ferroFibrous: { required: 0, allocated: 0, locations: [], isCompliant: true },
        doubleHeatSinks: { engineSlots: 0, externalSlots: 0, totalRequired: 0, isCompliant: true },
        artemis: { required: 0, allocated: 0, weaponPairings: [], isCompliant: true },
        targetingComputer: { required: 0, allocated: 0, location: '', isCompliant: true }
      },
      placementViolations: [],
      violations: [],
      recommendations: []
    }

    const request: ValidationRequest = {
      config,
      equipment,
      context: mergedContext,
      result
    }

    this.validationChain.handle(request)
    this.calculateTotals(result)

    return result
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizations(config: any, equipment: any[]): SlotOptimization {
    const validation = this.validateCriticalSlots(config, equipment)
    
    const recommendations = this.generateOptimizationRecommendations(validation)
    const alternativeLayouts = this.generateAlternativeLayouts(config, equipment, validation)
    const efficiencyImprovements = this.generateEfficiencyImprovements(validation)

    return {
      recommendations,
      alternativeLayouts,
      efficiencyImprovements
    }
  }

  /**
   * Quick validation check - returns only pass/fail
   */
  quickValidate(config: any, equipment: any[]): boolean {
    const result = this.validateCriticalSlots(config, equipment, 'Quick Validation')
    return result.isValid
  }

  /**
   * Get available validation strategies
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys())
  }

  /**
   * Get strategy details
   */
  getStrategyDetails(strategyName: string): { name: string; description: string; context: CriticalSlotValidationContext } | null {
    const strategy = this.strategies.get(strategyName)
    if (!strategy) return null

    return {
      name: strategy.getName(),
      description: strategy.getDescription(),
      context: strategy.getContext()
    }
  }

  /**
   * Set default validation strategy
   */
  setDefaultStrategy(strategyName: string): void {
    if (this.strategies.has(strategyName)) {
      this.defaultStrategy = strategyName
    } else {
      throw new Error(`Strategy '${strategyName}' not found`)
    }
  }

  /**
   * Compare results from different strategies
   */
  compareStrategies(config: any, equipment: any[]): { [strategyName: string]: CriticalSlotValidation } {
    const results: { [strategyName: string]: CriticalSlotValidation } = {}
    
    for (const strategyName of this.strategies.keys()) {
      results[strategyName] = this.validateCriticalSlots(config, equipment, strategyName)
    }
    
    return results
  }

  // ===== PRIVATE HELPER METHODS =====

  private getStrategy(strategyName: string): ValidationStrategy {
    const strategy = this.strategies.get(strategyName)
    if (!strategy) {
      throw new Error(`Validation strategy '${strategyName}' not found`)
    }
    return strategy
  }

  private calculateTotals(result: CriticalSlotValidation): void {
    if (result.locationUtilization) {
      result.totalSlotsUsed = Object.values(result.locationUtilization)
        .reduce((sum, util) => sum + util.used, 0)
      
      result.totalSlotsAvailable = Object.values(result.locationUtilization)
        .reduce((sum, util) => sum + util.available, 0)
    }
  }

  private generateOptimizationRecommendations(validation: CriticalSlotValidation) {
    const recommendations: Array<{
      type: 'relocate_component' | 'merge_locations' | 'optimize_special_components' | 'balance_utilization'
      description: string
      benefit: string
      difficulty: 'easy' | 'moderate' | 'hard'
      priority: 'high' | 'medium' | 'low'
    }> = []

    // Add optimization recommendations based on validation results
    if (validation.violations.some(v => v.type === 'overflow')) {
      recommendations.push({
        type: 'relocate_component' as const,
        description: 'Relocate equipment from overflowing locations',
        benefit: 'Resolves critical slot overflow violations',
        difficulty: 'moderate' as const,
        priority: 'high' as const
      })
    }

    // Check for unbalanced utilization
    const locations = Object.entries(validation.locationUtilization)
    const underutilized = locations.filter(([_, util]) => util.utilization < 50)
    const overutilized = locations.filter(([_, util]) => util.utilization > 90)

    if (underutilized.length > 0 && overutilized.length > 0) {
      recommendations.push({
        type: 'balance_utilization' as const,
        description: 'Rebalance equipment distribution across locations',
        benefit: 'Improves overall slot efficiency and reduces bottlenecks',
        difficulty: 'easy' as const,
        priority: 'medium' as const
      })
    }

    return recommendations
  }

  private generateAlternativeLayouts(config: any, equipment: any[], validation: CriticalSlotValidation) {
    // Generate alternative slot layouts (simplified)
    return []
  }

  private generateEfficiencyImprovements(validation: CriticalSlotValidation) {
    const improvements: Array<{
      location: string
      currentUtilization: number
      improvedUtilization: number
      improvement: number
      suggestions: string[]
    }> = []

    // Analyze each location for efficiency improvements
    Object.entries(validation.locationUtilization).forEach(([location, util]) => {
      if (util.utilization < 70 && util.used > 0) {
        improvements.push({
          location,
          currentUtilization: util.utilization,
          improvedUtilization: Math.min(90, util.utilization + 20),
          improvement: 20,
          suggestions: [`Consolidate equipment in ${location} to improve efficiency`]
        })
      }
    })

    return improvements
  }
}