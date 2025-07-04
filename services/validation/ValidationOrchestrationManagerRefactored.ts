/**
 * Validation Orchestration Manager - Refactored
 * Coordinates different validation types and manages the validation workflow.
 * Refactored to use Mediator pattern and Command pattern for better architecture.
 * Maintains backward compatibility with original interface.
 */

import { ValidationOrchestrationFacade } from './orchestration/ValidationOrchestrationFacade'
import { 
  ValidationOrchestrationResult,
  ConfigurationValidation,
  LoadoutValidation,
  TechLevelValidation,
  ComplianceReport,
  ValidationSummary,
  ValidationMetrics,
  ValidationRecommendation
} from './orchestration/ValidationOrchestrationTypes'
import { UnitConfiguration } from '../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'
import { ComponentConfiguration } from '../../battletech-editor-app/types/componentConfiguration'
import { RuleManagementManager, RuleComplianceResult, RuleScore } from '../../battletech-editor-app/services/validation/RuleManagementManager'

/**
 * Refactored ValidationOrchestrationManager
 * Maintains original interface while using new orchestration architecture
 */
export class ValidationOrchestrationManager {
  private readonly orchestrationFacade: ValidationOrchestrationFacade
  private readonly ruleManagementManager: RuleManagementManager

  constructor() {
    this.orchestrationFacade = new ValidationOrchestrationFacade()
    this.ruleManagementManager = new RuleManagementManager()
  }

  /**
   * Main validation entry point - maintains original interface
   */
  validateUnit(config: UnitConfiguration, equipment: any[]): ValidationOrchestrationResult {
    // Convert async call to sync for backward compatibility
    return this.orchestrationFacade.validateUnit(config, equipment) as any
  }

  /**
   * Validate configuration aspects (weight, heat, movement, etc.)
   */
  validateConfiguration(config: UnitConfiguration): ConfigurationValidation {
    return this.orchestrationFacade.validateConfiguration(config) as any
  }

  /**
   * Validate equipment loadout
   */
  validateEquipmentLoadout(equipment: any[], config: UnitConfiguration): LoadoutValidation {
    return this.orchestrationFacade.validateEquipmentLoadout(equipment, config) as any
  }

  /**
   * Validate tech level and era restrictions
   */
  validateTechLevel(config: UnitConfiguration, equipment: any[]): TechLevelValidation {
    return this.orchestrationFacade.validateTechLevel(config, equipment) as any
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(config: UnitConfiguration, equipment: any[]): ComplianceReport {
    return this.orchestrationFacade.generateComplianceReport(config, equipment) as any
  }

  /**
   * Generate validation recommendations
   */
  generateValidationRecommendations(
    configuration: ConfigurationValidation, 
    loadout: LoadoutValidation, 
    techLevel: TechLevelValidation
  ): ValidationRecommendation[] {
    return this.orchestrationFacade.generateValidationRecommendations(configuration, loadout, techLevel) as any
  }

  /**
   * Calculate validation metrics
   */
  calculateValidationMetrics(validationTime: number, compliance: ComplianceReport): ValidationMetrics {
    return this.orchestrationFacade.calculateValidationMetrics(validationTime, compliance) as any
  }

  /**
   * Generate overall validation summary
   */
  generateOverallSummary(validations: any[]): ValidationSummary {
    return this.orchestrationFacade.generateOverallSummary(validations)
  }

  /**
   * Generate violation summary
   */
  generateViolationSummary(ruleCompliance: RuleComplianceResult[]): any {
    const violations = ruleCompliance.flatMap(rule => rule.violations || [])
    
    return {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      majorViolations: violations.filter(v => v.severity === 'major').length,
      minorViolations: violations.filter(v => v.severity === 'minor').length,
      violationsByCategory: this.groupViolationsByCategory(violations),
      topViolations: violations
        .filter(v => v.severity === 'critical')
        .slice(0, 5)
    }
  }

  /**
   * Generate recommendation summary
   */
  generateRecommendationSummary(ruleCompliance: RuleComplianceResult[]): any {
    const recommendations = ruleCompliance.flatMap(rule => rule.recommendations || [])
    
    return {
      totalRecommendations: recommendations.length,
      criticalRecommendations: recommendations.filter(r => r.priority === 'high').length,
      implementationDifficulty: this.groupByDifficulty(recommendations),
      estimatedImpact: this.groupByImpact(recommendations),
      topRecommendations: recommendations.slice(0, 10)
    }
  }

  /**
   * Generate compliance metrics
   */
  generateComplianceMetrics(ruleCompliance: RuleComplianceResult[]): any {
    return {
      validationTime: ruleCompliance.reduce((sum, rule) => sum + (rule.executionTime || 0), 0),
      rulesChecked: ruleCompliance.length,
      componentsValidated: this.countUniqueComponents(ruleCompliance),
      performance: {
        averageRuleTime: this.calculateAverageTime(ruleCompliance),
        slowestRule: this.findSlowestRule(ruleCompliance),
        fastestRule: this.findFastestRule(ruleCompliance)
      }
    }
  }

  // ===== INDIVIDUAL VALIDATION METHODS (Original Interface) =====
  // These methods are preserved for backward compatibility but now delegate to the orchestration

  /**
   * Validate weight limits - delegates to orchestration
   */
  validateWeightLimits(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateConfiguration(config)
    return result.weight
  }

  /**
   * Validate heat management - delegates to orchestration
   */
  validateHeatManagement(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateConfiguration(config)
    return result.heat
  }

  /**
   * Validate movement rules - delegates to orchestration
   */
  validateMovementRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.movement
  }

  /**
   * Validate armor rules - delegates to orchestration
   */
  validateArmorRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.armor
  }

  /**
   * Validate structure rules - delegates to orchestration
   */
  validateStructureRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.structure
  }

  /**
   * Validate engine rules - delegates to orchestration
   */
  validateEngineRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.engine
  }

  /**
   * Validate gyro rules - delegates to orchestration
   */
  validateGyroRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.gyro
  }

  /**
   * Validate cockpit rules - delegates to orchestration
   */
  validateCockpitRules(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.cockpit
  }

  /**
   * Validate weapon rules - delegates to orchestration
   */
  validateWeaponRules(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.weapons
  }

  /**
   * Validate ammo rules - delegates to orchestration
   */
  validateAmmoRules(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.ammunition
  }

  /**
   * Validate jump jet rules - delegates to orchestration
   */
  validateJumpJetRules(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.jumpJets
  }

  /**
   * Validate special equipment rules - delegates to orchestration
   */
  validateSpecialEquipmentRules(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.specialEquipment
  }

  /**
   * Validate critical slots - delegates to orchestration
   */
  validateCriticalSlots(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.criticalSlots
  }

  /**
   * Validate construction efficiency - delegates to orchestration
   */
  validateConstructionEfficiency(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateEquipmentLoadout(equipment, config)
    return result.efficiency
  }

  /**
   * Validate component compatibility - delegates to orchestration
   */
  validateComponentCompatibility(config: UnitConfiguration): any {
    const result = this.validateConfiguration(config)
    return result.compatibility
  }

  /**
   * Validate mixed tech - delegates to orchestration
   */
  validateMixedTech(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateTechLevel(config, equipment)
    return result.mixedTech
  }

  /**
   * Validate era restrictions - delegates to orchestration
   */
  validateEraRestrictions(config: UnitConfiguration, equipment: any[]): any {
    const result = this.validateTechLevel(config, equipment)
    return result.eraRestrictions
  }

  /**
   * Validate availability rating - delegates to orchestration
   */
  validateAvailabilityRating(equipment: any[], config: UnitConfiguration): any {
    const result = this.validateTechLevel(config, equipment)
    return result.availability
  }

  // ===== CONFIGURATION METHODS =====

  /**
   * Enable strict validation mode
   */
  enableStrictMode(): void {
    this.orchestrationFacade.enableStrictMode()
  }

  /**
   * Enable performance mode
   */
  enablePerformanceMode(): void {
    this.orchestrationFacade.enablePerformanceMode()
  }

  /**
   * Quick validation
   */
  quickValidate(config: UnitConfiguration, equipment: any[]): boolean {
    return this.orchestrationFacade.quickValidate(config, equipment) as any
  }

  /**
   * Reset orchestration to defaults
   */
  reset(): void {
    this.orchestrationFacade.reset()
  }

  // ===== PRIVATE HELPER METHODS =====

  private groupViolationsByCategory(violations: any[]): { [category: string]: number } {
    const categories: { [category: string]: number } = {}
    
    for (const violation of violations) {
      const category = violation.type?.split('_')[0] || 'general'
      categories[category] = (categories[category] || 0) + 1
    }
    
    return categories
  }

  private groupByDifficulty(recommendations: any[]): { [difficulty: string]: number } {
    const difficulties: { [difficulty: string]: number } = {}
    
    for (const recommendation of recommendations) {
      const difficulty = recommendation.difficulty || 'moderate'
      difficulties[difficulty] = (difficulties[difficulty] || 0) + 1
    }
    
    return difficulties
  }

  private groupByImpact(recommendations: any[]): { [impact: string]: number } {
    const impacts: { [impact: string]: number } = {}
    
    for (const recommendation of recommendations) {
      const impact = recommendation.estimatedImpact > 70 ? 'high' : 
                    recommendation.estimatedImpact > 40 ? 'medium' : 'low'
      impacts[impact] = (impacts[impact] || 0) + 1
    }
    
    return impacts
  }

  private countUniqueComponents(ruleCompliance: RuleComplianceResult[]): number {
    const components = new Set()
    
    for (const rule of ruleCompliance) {
      if (rule.component) {
        components.add(rule.component)
      }
    }
    
    return components.size
  }

  private calculateAverageTime(ruleCompliance: RuleComplianceResult[]): number {
    const times = ruleCompliance.map(rule => rule.executionTime || 0)
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0
  }

  private findSlowestRule(ruleCompliance: RuleComplianceResult[]): string {
    let slowest = ruleCompliance[0]
    
    for (const rule of ruleCompliance) {
      if ((rule.executionTime || 0) > (slowest?.executionTime || 0)) {
        slowest = rule
      }
    }
    
    return slowest?.ruleName || ''
  }

  private findFastestRule(ruleCompliance: RuleComplianceResult[]): string {
    let fastest = ruleCompliance[0]
    
    for (const rule of ruleCompliance) {
      if ((rule.executionTime || Infinity) < (fastest?.executionTime || Infinity)) {
        fastest = rule
      }
    }
    
    return fastest?.ruleName || ''
  }
}