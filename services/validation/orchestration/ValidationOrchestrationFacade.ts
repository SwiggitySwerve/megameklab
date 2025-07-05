/**
 * Validation Orchestration Facade
 * Provides backward compatibility with original ValidationOrchestrationManager
 * Uses Facade pattern to hide new orchestration complexity
 */

import { ValidationOrchestrationMediator } from './ValidationOrchestrationMediator'
import { 
  ValidationOrchestrationResult,
  ValidationContext,
  ValidationOptions,
  ConfigurationValidation,
  LoadoutValidation,
  TechLevelValidation,
  ComplianceReport,
  ValidationSummary,
  ValidationMetrics,
  ValidationRecommendation
} from './ValidationOrchestrationTypes'
import { UnitConfiguration } from '../../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'

/**
 * Main Validation Orchestration Facade
 * Provides clean, backward-compatible interface to validation orchestration
 */
export class ValidationOrchestrationFacade {
  private mediator: ValidationOrchestrationMediator
  private defaultOptions: ValidationOptions

  constructor() {
    this.mediator = new ValidationOrchestrationMediator()
    this.defaultOptions = {
      strictMode: false,
      skipOptional: false,
      performanceMode: false,
      includeRecommendations: true,
      validateDependencies: true
    }
  }

  /**
   * Main validation entry point - maintains original interface
   * Coordinates all validation types and manages the validation workflow
   */
  async validateUnit(config: UnitConfiguration, equipment: any[]): Promise<ValidationOrchestrationResult> {
    const context = this.mediator.createValidationContext(config, equipment, this.defaultOptions)
    return await this.mediator.executeValidation(context)
  }

  /**
   * Validate configuration only (weight, heat, movement, etc.)
   */
  async validateConfiguration(config: UnitConfiguration): Promise<ConfigurationValidation> {
    const context = this.mediator.createValidationContext(config, [], this.defaultOptions)
    const result = await this.mediator.executeValidation(context)
    return result.configuration
  }

  /**
   * Validate equipment loadout
   */
  async validateEquipmentLoadout(equipment: any[], config: UnitConfiguration): Promise<LoadoutValidation> {
    const context = this.mediator.createValidationContext(config, equipment, this.defaultOptions)
    const result = await this.mediator.executeValidation(context)
    return result.loadout
  }

  /**
   * Validate tech level and era restrictions
   */
  async validateTechLevel(config: UnitConfiguration, equipment: any[]): Promise<TechLevelValidation> {
    const context = this.mediator.createValidationContext(config, equipment, this.defaultOptions)
    const result = await this.mediator.executeValidation(context)
    return result.techLevel
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(config: UnitConfiguration, equipment: any[]): Promise<ComplianceReport> {
    const context = this.mediator.createValidationContext(config, equipment, this.defaultOptions)
    const result = await this.mediator.executeValidation(context)
    return result.compliance
  }

  /**
   * Generate validation recommendations
   */
  async generateValidationRecommendations(
    configuration: ConfigurationValidation, 
    loadout: LoadoutValidation, 
    techLevel: TechLevelValidation
  ): Promise<ValidationRecommendation[]> {
    // Aggregate recommendations from all validation results
    const recommendations: ValidationRecommendation[] = []
    
    // Add configuration recommendations with null checks
    if (configuration.weight?.recommendations) {
      configuration.weight.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('weight', rec, 'high'))
      })
    }
    if (configuration.heat?.recommendations) {
      configuration.heat.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('heat', rec, 'high'))
      })
    }
    if (configuration.movement?.recommendations) {
      configuration.movement.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('movement', rec, 'medium'))
      })
    }
    if (configuration.armor?.recommendations) {
      configuration.armor.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('armor', rec, 'medium'))
      })
    }

    // Add loadout recommendations with null checks
    if (loadout.weapons?.recommendations) {
      loadout.weapons.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('weapons', rec, 'medium'))
      })
    }
    if (loadout.ammunition?.recommendations) {
      loadout.ammunition.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('ammunition', rec, 'medium'))
      })
    }
    if (loadout.criticalSlots?.recommendations) {
      loadout.criticalSlots.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('critical_slots', rec, 'high'))
      })
    }
    if (loadout.efficiency?.recommendations) {
      loadout.efficiency.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('efficiency', rec, 'low'))
      })
    }

    // Add tech level recommendations with null checks
    if (techLevel.recommendations) {
      techLevel.recommendations.forEach(rec => {
        recommendations.push(this.createRecommendation('tech_level', rec, 'medium'))
      })
    }

    return recommendations.slice(0, 20) // Limit to top 20 recommendations
  }

  /**
   * Calculate validation metrics
   */
  async calculateValidationMetrics(validationTime: number, compliance: ComplianceReport): Promise<ValidationMetrics> {
    return {
      totalValidationTime: validationTime,
      ruleValidationTimes: {},
      componentValidationTimes: {},
      performanceBottlenecks: [],
      optimizationSuggestions: [
        'Enable parallel validation for better performance',
        'Use performance mode for faster iteration during design'
      ]
    }
  }

  /**
   * Generate overall validation summary
   */
  generateOverallSummary(validations: any[]): ValidationSummary {
    const totalRules = validations.length
    const passedRules = validations.filter((v: any) => v.isValid).length
    const failedRules = totalRules - passedRules

    const allViolations = validations.flatMap((v: any) => v.violations || [])
    const criticalViolations = allViolations.filter((v: any) => v.severity === 'critical').length
    const majorViolations = allViolations.filter((v: any) => v.severity === 'major').length
    const minorViolations = allViolations.filter((v: any) => v.severity === 'minor').length

    const complianceScore = totalRules > 0 ? (passedRules / totalRules) * 100 : 100

    return {
      totalRules,
      passedRules,
      failedRules,
      warningRules: validations.filter((v: any) => v.warnings && v.warnings.length > 0).length,
      complianceScore,
      criticalViolations,
      majorViolations,
      minorViolations
    }
  }

  // ===== CONFIGURATION AND OPTIONS =====

  /**
   * Set validation options
   */
  setValidationOptions(options: Partial<ValidationOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  /**
   * Enable strict validation mode
   */
  enableStrictMode(): void {
    this.defaultOptions.strictMode = true
  }

  /**
   * Enable performance mode for faster validation
   */
  enablePerformanceMode(): void {
    this.defaultOptions.performanceMode = true
    this.mediator.optimizeExecutionOrder()
  }

  /**
   * Quick validation - minimal checks only
   */
  async quickValidate(config: UnitConfiguration, equipment: any[]): Promise<boolean> {
    return await this.mediator.quickValidate(config, equipment)
  }

  // ===== UTILITY METHODS =====

  /**
   * Get available validators
   */
  getAvailableValidators(): string[] {
    return this.mediator.getAvailableValidators()
  }

  /**
   * Get validation execution order
   */
  getValidationOrder(): string[] {
    return this.mediator.getValidationOrder()
  }

  /**
   * Add custom validator
   */
  addCustomValidator(validator: any): void {
    this.mediator.addValidator(validator)
  }

  /**
   * Remove validator
   */
  removeValidator(validatorName: string): void {
    this.mediator.removeValidator(validatorName)
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.mediator = new ValidationOrchestrationMediator()
    this.defaultOptions = {
      strictMode: false,
      skipOptional: false,
      performanceMode: false,
      includeRecommendations: true,
      validateDependencies: true
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Type-safe dictionary lookup with fallback
   */
  private safeLookup<T>(dictionary: Record<string, T>, key: string, defaultValue: T): T {
    return dictionary[key] !== undefined ? dictionary[key] : defaultValue;
  }

  /**
   * Create validation recommendation from string
   */
  private createRecommendation(
    category: string, 
    description: string, 
    priority: 'high' | 'medium' | 'low'
  ): ValidationRecommendation {
    const difficulty = this.estimateDifficulty(description)
    const estimatedImpact = this.estimateImpact(priority, category)

    return {
      type: this.categorizeRecommendationType(description),
      priority,
      category,
      description,
      benefit: this.generateBenefit(category, description),
      difficulty,
      estimatedImpact
    }
  }

  /**
   * Estimate implementation difficulty based on recommendation text
   */
  private estimateDifficulty(description: string): 'easy' | 'moderate' | 'hard' {
    const easyKeywords = ['add', 'remove', 'increase', 'decrease', 'consider']
    const hardKeywords = ['redesign', 'complete', 'major', 'fundamental']

    if (hardKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
      return 'hard'
    }
    if (easyKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
      return 'easy'
    }
    return 'moderate'
  }

  /**
   * Estimate impact based on priority and category
   */
  private estimateImpact(priority: string, category: string): number {
    const priorityMultiplier: Record<string, number> = {
      'high': 80,
      'medium': 50,
      'low': 20
    }

    const categoryMultiplier: Record<string, number> = {
      'weight': 1.0,
      'heat': 1.0,
      'critical_slots': 0.9,
      'movement': 0.8,
      'armor': 0.7,
      'weapons': 0.6,
      'ammunition': 0.5,
      'efficiency': 0.4,
      'tech_level': 0.3
    }

    const basePriority = this.safeLookup(priorityMultiplier, priority, 50)
    const categoryFactor = this.safeLookup(categoryMultiplier, category, 0.5)

    return Math.round(basePriority * categoryFactor)
  }

  /**
   * Categorize recommendation type
   */
  private categorizeRecommendationType(description: string): 'fix' | 'optimization' | 'alternative' | 'upgrade' {
    if (description.toLowerCase().includes('fix') || description.toLowerCase().includes('error')) {
      return 'fix'
    }
    if (description.toLowerCase().includes('upgrade') || description.toLowerCase().includes('improve')) {
      return 'upgrade'
    }
    if (description.toLowerCase().includes('consider') || description.toLowerCase().includes('alternative')) {
      return 'alternative'
    }
    return 'optimization'
  }

  /**
   * Generate benefit description
   */
  private generateBenefit(category: string, description: string): string {
    const benefits: Record<string, string> = {
      'weight': 'Improves weight efficiency and component allocation',
      'heat': 'Enhances thermal management and sustained performance',
      'movement': 'Optimizes mobility and tactical options',
      'armor': 'Increases survivability and damage mitigation',
      'critical_slots': 'Optimizes space utilization and equipment placement',
      'weapons': 'Enhances combat effectiveness and firepower',
      'ammunition': 'Improves sustainability and combat duration',
      'efficiency': 'Optimizes overall design efficiency',
      'tech_level': 'Ensures era compliance and availability'
    }

    return this.safeLookup(benefits, category, 'Improves overall configuration quality')
  }
}

/**
 * Singleton instance for global access
 */
export const ValidationOrchestrationInstance = new ValidationOrchestrationFacade()

/**
 * Backward compatibility export
 */
export { ValidationOrchestrationFacade as ValidationOrchestrationManager }