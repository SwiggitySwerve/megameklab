/**
 * Validation Orchestration Mediator
 * Central mediator that coordinates all validation commands
 * Uses Mediator pattern for decoupled validation orchestration
 */

import { 
  ValidationMediator,
  ValidationCommand,
  ValidationContext,
  ValidationOrchestrationResult,
  ValidationResult,
  ValidationObserver,
  ValidationOptions
} from './ValidationOrchestrationTypes'
import { 
  CommandExecutionStrategy,
  SequentialExecutionStrategy,
  ParallelExecutionStrategy,
  ValidationCommandFactory
} from './BaseValidationCommand'
import { ConfigurationValidationCommand } from './commands/ConfigurationValidationCommand'

/**
 * Main Validation Orchestration Mediator
 * Coordinates multiple validation commands and manages execution
 */
export class ValidationOrchestrationMediator implements ValidationMediator {
  private validators: Map<string, ValidationCommand> = new Map()
  private executionStrategy: CommandExecutionStrategy = new SequentialExecutionStrategy()
  private observers: ValidationObserver[] = []

  constructor() {
    this.initializeDefaultValidators()
  }

  /**
   * Initialize default validation commands
   */
  private initializeDefaultValidators(): void {
    // Register core validation commands
    this.addValidator(new ConfigurationValidationCommand())
    
    // Register commands with factory
    ValidationCommandFactory.registerCommand('ConfigurationValidation', ConfigurationValidationCommand)
  }

  /**
   * Add a validator to the orchestration
   */
  addValidator(validator: ValidationCommand): void {
    this.validators.set(validator.getName(), validator)
    this.notifyObservers('onValidationStart', validator.getName())
  }

  /**
   * Remove a validator from orchestration
   */
  removeValidator(validatorName: string): void {
    this.validators.delete(validatorName)
  }

  /**
   * Execute all validation commands
   */
  async executeValidation(context: ValidationContext): Promise<ValidationOrchestrationResult> {
    const startTime = performance.now()
    
    try {
      // Get all validators sorted by execution order
      const validatorsArray = Array.from(this.validators.values())
      
      // Execute validation commands using selected strategy
      const validationResults = await this.executionStrategy.executeCommands(validatorsArray, context)
      
      const endTime = performance.now()
      
      // Aggregate results into final orchestration result
      const orchestrationResult = this.aggregateResults(validationResults, endTime - startTime)
      
      // Notify observers of completion
      this.notifyObserversComplete(validationResults)
      
      return orchestrationResult
    } catch (error) {
      const endTime = performance.now()
      this.notifyObserversError(error)
      
      // Return error result
      return this.createErrorResult(endTime - startTime, error)
    }
  }

  /**
   * Get validation execution order
   */
  getValidationOrder(): string[] {
    const validators = Array.from(this.validators.values())
    
    // Sort by priority and dependencies
    return validators
      .sort((a, b) => b.getPriority() - a.getPriority())
      .map(v => v.getName())
  }

  /**
   * Optimize execution order based on dependencies and performance
   */
  optimizeExecutionOrder(): void {
    // Switch to parallel execution for better performance if no critical dependencies
    const validators = Array.from(this.validators.values())
    const hasDependencies = validators.some(v => v.getDependencies().length > 0)
    
    if (!hasDependencies) {
      this.executionStrategy = new ParallelExecutionStrategy()
    }
  }

  /**
   * Set execution strategy
   */
  setExecutionStrategy(strategy: CommandExecutionStrategy): void {
    this.executionStrategy = strategy
  }

  /**
   * Add observer for validation events
   */
  addObserver(observer: ValidationObserver): void {
    this.observers.push(observer)
  }

  /**
   * Remove observer
   */
  removeObserver(observer: ValidationObserver): void {
    const index = this.observers.indexOf(observer)
    if (index > -1) {
      this.observers.splice(index, 1)
    }
  }

  /**
   * Get available validators
   */
  getAvailableValidators(): string[] {
    return Array.from(this.validators.keys())
  }

  /**
   * Get validator details
   */
  getValidatorDetails(validatorName: string): {
    name: string
    priority: number
    dependencies: string[]
  } | null {
    const validator = this.validators.get(validatorName)
    if (!validator) return null

    return {
      name: validator.getName(),
      priority: validator.getPriority(),
      dependencies: validator.getDependencies()
    }
  }

  /**
   * Create validation context with default options
   */
  createValidationContext(config: any, equipment: any[], options?: Partial<ValidationOptions>): ValidationContext {
    const defaultOptions: ValidationOptions = {
      strictMode: false,
      skipOptional: false,
      performanceMode: false,
      includeRecommendations: true,
      validateDependencies: true
    }

    return {
      config,
      equipment,
      options: { ...defaultOptions, ...options },
      results: new Map()
    }
  }

  /**
   * Quick validation - minimal checks only
   */
  async quickValidate(config: any, equipment: any[]): Promise<boolean> {
    const context = this.createValidationContext(config, equipment, {
      performanceMode: true,
      skipOptional: true,
      includeRecommendations: false
    })

    const result = await this.executeValidation(context)
    return result.isValid
  }

  // ===== PRIVATE METHODS =====

  /**
   * Aggregate individual validation results into orchestration result
   */
  private aggregateResults(
    validationResults: Map<string, ValidationResult>, 
    totalTime: number
  ): ValidationOrchestrationResult {
    const allErrors = Array.from(validationResults.values()).flatMap(r => r.errors)
    const allWarnings = Array.from(validationResults.values()).flatMap(r => r.warnings)
    const allRecommendations = Array.from(validationResults.values()).flatMap(r => r.recommendations)
    
    const isValid = Array.from(validationResults.values()).every(r => r.isValid)
    
    // Extract configuration data
    const configurationResult = validationResults.get('ConfigurationValidation')
    const configuration = configurationResult?.data || this.createEmptyConfiguration()
    
    // Create aggregated result
    return {
      isValid,
      overall: this.createValidationSummary(validationResults),
      configuration,
      loadout: this.createEmptyLoadout(), // Would be populated by LoadoutValidationCommand
      techLevel: this.createEmptyTechLevel(), // Would be populated by TechLevelValidationCommand
      compliance: this.createComplianceReport(validationResults),
      recommendations: this.aggregateRecommendations(allRecommendations),
      performanceMetrics: this.createPerformanceMetrics(validationResults, totalTime)
    }
  }

  /**
   * Create validation summary from results
   */
  private createValidationSummary(validationResults: Map<string, ValidationResult>) {
    const allResults = Array.from(validationResults.values())
    const totalRules = allResults.length
    const passedRules = allResults.filter(r => r.isValid).length
    const failedRules = totalRules - passedRules
    
    const allErrors = allResults.flatMap(r => r.errors)
    const criticalViolations = allErrors.filter(e => e.severity === 'critical').length
    const majorViolations = allErrors.filter(e => e.severity === 'major').length
    const minorViolations = allErrors.filter(e => e.severity === 'minor').length
    
    const complianceScore = totalRules > 0 ? (passedRules / totalRules) * 100 : 100

    return {
      totalRules,
      passedRules,
      failedRules,
      warningRules: allResults.filter(r => r.warnings.length > 0).length,
      complianceScore,
      criticalViolations,
      majorViolations,
      minorViolations
    }
  }

  /**
   * Create compliance report
   */
  private createComplianceReport(validationResults: Map<string, ValidationResult>) {
    const allResults = Array.from(validationResults.values())
    const allErrors = allResults.flatMap(r => r.errors)
    
    const overallCompliance = allResults.filter(r => r.isValid).length / allResults.length * 100

    return {
      overallCompliance,
      ruleCompliance: [], // Would be populated with detailed rule compliance
      violationSummary: {
        totalViolations: allErrors.length,
        criticalViolations: allErrors.filter(e => e.severity === 'critical').length,
        majorViolations: allErrors.filter(e => e.severity === 'major').length,
        minorViolations: allErrors.filter(e => e.severity === 'minor').length,
        violationsByCategory: this.groupViolationsByCategory(allErrors),
        topViolations: this.getTopViolations(allErrors)
      },
      recommendationSummary: {
        totalRecommendations: 0,
        criticalRecommendations: 0,
        implementationDifficulty: {},
        estimatedImpact: {},
        topRecommendations: []
      },
      complianceMetrics: {
        validationTime: 0,
        rulesChecked: allResults.length,
        componentsValidated: 0,
        performance: {
          averageRuleTime: 0,
          slowestRule: '',
          fastestRule: ''
        }
      }
    }
  }

  /**
   * Create performance metrics
   */
  private createPerformanceMetrics(
    validationResults: Map<string, ValidationResult>, 
    totalTime: number
  ) {
    const ruleValidationTimes: { [rule: string]: number } = {}
    const componentValidationTimes: { [component: string]: number } = {}
    
    for (const [name, result] of validationResults.entries()) {
      ruleValidationTimes[name] = result.executionTime
    }
    
    const times = Array.from(validationResults.values()).map(r => r.executionTime)
    const averageTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0
    const slowestTime = Math.max(...times, 0)
    const fastestTime = Math.min(...times, 0)
    
    return {
      totalValidationTime: totalTime,
      ruleValidationTimes,
      componentValidationTimes,
      performanceBottlenecks: this.identifyBottlenecks(validationResults),
      optimizationSuggestions: this.generateOptimizationSuggestions(validationResults)
    }
  }

  /**
   * Aggregate and deduplicate recommendations
   */
  private aggregateRecommendations(recommendations: string[]) {
    // Remove duplicates and categorize
    const uniqueRecommendations = [...new Set(recommendations)]
    
    return uniqueRecommendations.slice(0, 10).map(rec => ({
      type: 'optimization' as const,
      priority: 'medium' as const,
      category: 'general',
      description: rec,
      benefit: 'Improves configuration compliance',
      difficulty: 'moderate' as const,
      estimatedImpact: 50
    }))
  }

  /**
   * Create empty configuration for fallback
   */
  private createEmptyConfiguration() {
    return {
      isValid: false,
      weight: { isValid: false, totalWeight: 0, maxWeight: 0, overweight: 0, underweight: 0, distribution: { structure: 0, armor: 0, engine: 0, equipment: 0, ammunition: 0, systems: 0 }, violations: [], recommendations: [] },
      heat: { isValid: false, heatGeneration: 0, heatDissipation: 0, heatDeficit: 0, minimumHeatSinks: 0, actualHeatSinks: 0, engineHeatSinks: 0, externalHeatSinks: 0, violations: [], recommendations: [] },
      movement: { isValid: false, walkMP: 0, runMP: 0, jumpMP: 0, engineRating: 0, tonnage: 0, engineType: '', violations: [], recommendations: [] },
      armor: { isValid: false, totalArmor: 0, maxArmor: 0, armorType: '', armorWeight: 0, locationLimits: {}, violations: [], recommendations: [] },
      structure: { isValid: false, structureType: '', structureWeight: 0, internalStructure: 0, violations: [], recommendations: [] },
      engine: { isValid: false, engineType: '', engineRating: 0, engineWeight: 0, walkMP: 0, maxRating: 0, minRating: 0, violations: [], recommendations: [] },
      gyro: { isValid: false, gyroType: '', gyroWeight: 0, engineCompatible: false, violations: [], recommendations: [] },
      cockpit: { isValid: false, cockpitType: '', cockpitWeight: 0, violations: [], recommendations: [] },
      compatibility: { isValid: false, componentCompatibility: [], systemIntegration: [], violations: [], recommendations: [] }
    }
  }

  private createEmptyLoadout() {
    return {
      isValid: false,
      weapons: { isValid: false, weaponCount: 0, totalWeaponWeight: 0, heatGeneration: 0, violations: [], recommendations: [] },
      ammunition: { isValid: false, totalAmmoWeight: 0, ammoBalance: [], caseProtection: { requiredLocations: [], protectedLocations: [], unprotectedLocations: [], isCompliant: false }, violations: [], recommendations: [] },
      jumpJets: { isValid: false, jumpJetCount: 0, jumpMP: 0, maxJumpMP: 0, jumpJetWeight: 0, jumpJetType: '', violations: [], recommendations: [] },
      specialEquipment: { isValid: false, specialEquipment: [], violations: [], recommendations: [] },
      criticalSlots: { isValid: false, totalSlotsUsed: 0, totalSlotsAvailable: 0, locationUtilization: {}, violations: [], recommendations: [] },
      efficiency: { isValid: false, overallEfficiency: 0, weightEfficiency: 0, slotEfficiency: 0, heatEfficiency: 0, firepowerEfficiency: 0, violations: [], recommendations: [] }
    }
  }

  private createEmptyTechLevel() {
    return {
      isValid: false,
      unitTechLevel: '',
      unitTechBase: '',
      era: '',
      mixedTech: { isMixed: false, innerSphereComponents: 0, clanComponents: 0, allowedMixed: false, violations: [] },
      eraRestrictions: { isValid: false, era: '', invalidComponents: [], recommendations: [] },
      availability: { isValid: false, overallRating: '', componentRatings: [], violations: [] },
      violations: [],
      recommendations: []
    }
  }

  private createErrorResult(totalTime: number, error: any): ValidationOrchestrationResult {
    return {
      isValid: false,
      overall: { totalRules: 0, passedRules: 0, failedRules: 1, warningRules: 0, complianceScore: 0, criticalViolations: 1, majorViolations: 0, minorViolations: 0 },
      configuration: this.createEmptyConfiguration(),
      loadout: this.createEmptyLoadout(),
      techLevel: this.createEmptyTechLevel(),
      compliance: this.createComplianceReport(new Map()),
      recommendations: [],
      performanceMetrics: { totalValidationTime: totalTime, ruleValidationTimes: {}, componentValidationTimes: {}, performanceBottlenecks: ['System Error'], optimizationSuggestions: ['Check system configuration'] }
    }
  }

  private groupViolationsByCategory(errors: any[]): { [category: string]: number } {
    const categories: { [category: string]: number } = {}
    
    for (const error of errors) {
      const category = error.type.split('_')[0] || 'general'
      categories[category] = (categories[category] || 0) + 1
    }
    
    return categories
  }

  private getTopViolations(errors: any[]): any[] {
    return errors
      .filter(e => e.severity === 'critical')
      .slice(0, 5)
      .map(e => ({
        ruleName: e.type,
        description: e.message,
        severity: e.severity,
        impact: 'High',
        suggestedFix: e.suggestedFix
      }))
  }

  private identifyBottlenecks(validationResults: Map<string, ValidationResult>): string[] {
    const times = Array.from(validationResults.entries())
      .map(([name, result]) => ({ name, time: result.executionTime }))
      .sort((a, b) => b.time - a.time)
    
    return times.slice(0, 3).map(t => t.name)
  }

  private generateOptimizationSuggestions(validationResults: Map<string, ValidationResult>): string[] {
    const suggestions: string[] = []
    
    const avgTime = Array.from(validationResults.values())
      .reduce((sum, r) => sum + r.executionTime, 0) / validationResults.size
    
    const slowValidators = Array.from(validationResults.entries())
      .filter(([_, result]) => result.executionTime > avgTime * 2)
    
    if (slowValidators.length > 0) {
      suggestions.push('Consider optimizing slow validators: ' + slowValidators.map(([name, _]) => name).join(', '))
    }
    
    if (validationResults.size > 5) {
      suggestions.push('Consider parallel execution for better performance')
    }
    
    return suggestions
  }

  private notifyObservers(method: keyof ValidationObserver, ...args: any[]): void {
    this.observers.forEach(observer => {
      try {
        (observer[method] as any)(...args)
      } catch (error) {
        console.warn('Observer notification failed:', error)
      }
    })
  }

  private notifyObserversComplete(results: Map<string, ValidationResult>): void {
    for (const [name, result] of results.entries()) {
      this.notifyObservers('onValidationComplete', name, result)
    }
  }

  private notifyObserversError(error: any): void {
    this.notifyObservers('onValidationError', 'system', error)
  }
}