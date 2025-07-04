/**
 * Equipment Validation Facade
 * Main interface for equipment validation using pipeline pattern
 * Coordinates multiple validation stages and strategies
 */

import { EquipmentValidationPipeline, ValidationStrategy } from './BaseEquipmentValidator'
import { PlacementValidator } from './PlacementValidator'
import { RuleComplianceValidator } from './RuleComplianceValidator'
import { 
  ValidationResult,
  ValidationContext,
  ValidationStageResult,
  PipelineResult,
  ValidationSummary,
  ComplianceStatus,
  EquipmentPlacement
} from './EquipmentValidationTypes'

/**
 * Standard validation strategy implementation
 */
export class StandardValidationStrategy implements ValidationStrategy {
  name = 'Standard BattleTech'
  description = 'Standard BattleTech construction rules validation'
  strictMode = false
  enabledStages = ['PlacementValidator', 'RuleComplianceValidator']

  getValidators() {
    return [
      new PlacementValidator(),
      new RuleComplianceValidator()
    ]
  }
}

/**
 * Strict validation strategy implementation
 */
export class StrictValidationStrategy implements ValidationStrategy {
  name = 'Strict BattleTech'
  description = 'Strict BattleTech rules with enhanced compliance checking'
  strictMode = true
  enabledStages = ['PlacementValidator', 'RuleComplianceValidator']

  getValidators() {
    return [
      new PlacementValidator(),
      new RuleComplianceValidator()
    ]
  }
}

/**
 * Quick validation strategy implementation
 */
export class QuickValidationStrategy implements ValidationStrategy {
  name = 'Quick Validation'
  description = 'Basic validation for fast iteration'
  strictMode = false
  enabledStages = ['PlacementValidator']

  getValidators() {
    return [new PlacementValidator()]
  }
}

/**
 * Equipment Validation Facade
 * Provides unified interface for all equipment validation operations
 */
export class EquipmentValidationFacade {
  private strategies: Map<string, ValidationStrategy> = new Map()
  private defaultStrategy: string = 'Standard BattleTech'

  constructor() {
    this.initializeStrategies()
  }

  /**
   * Initialize validation strategies
   */
  private initializeStrategies(): void {
    this.registerStrategy(new StandardValidationStrategy())
    this.registerStrategy(new StrictValidationStrategy())
    this.registerStrategy(new QuickValidationStrategy())
  }

  /**
   * Register a validation strategy
   */
  registerStrategy(strategy: ValidationStrategy): void {
    this.strategies.set(strategy.name, strategy)
  }

  /**
   * Main validation method with full pipeline execution
   */
  async validateEquipment(
    config: any,
    allocations: EquipmentPlacement[],
    strategyName?: string
  ): Promise<PipelineResult> {
    const startTime = performance.now()
    const strategy = this.getStrategy(strategyName || this.defaultStrategy)
    
    // Create validation context
    const context: ValidationContext = {
      config,
      allocations,
      strictMode: strategy.strictMode,
      techLevel: config.techLevel || 'Inner Sphere',
      era: config.era || '3025'
    }

    // Build and execute pipeline
    const pipeline = this.buildPipeline(strategy)
    const stageResults = await pipeline.execute(context)
    
    const endTime = performance.now()
    const processingTime = endTime - startTime

    // Aggregate results
    const overall = this.aggregateResults(stageResults)
    const summary = this.createSummary(stageResults)

    return {
      overall,
      stages: stageResults,
      processingTime,
      summary
    }
  }

  /**
   * Quick validation - returns only pass/fail
   */
  async quickValidate(config: any, allocations: EquipmentPlacement[]): Promise<boolean> {
    const result = await this.validateEquipment(config, allocations, 'Quick Validation')
    return result.overall.isValid
  }

  /**
   * Validate with custom strategy
   */
  async validateWithStrategy(
    config: any,
    allocations: EquipmentPlacement[],
    strategy: ValidationStrategy
  ): Promise<PipelineResult> {
    const context: ValidationContext = {
      config,
      allocations,
      strictMode: strategy.strictMode,
      techLevel: config.techLevel || 'Inner Sphere',
      era: config.era || '3025'
    }

    const pipeline = this.buildPipeline(strategy)
    const stageResults = await pipeline.execute(context)
    
    const overall = this.aggregateResults(stageResults)
    const summary = this.createSummary(stageResults)

    return {
      overall,
      stages: stageResults,
      processingTime: 0,
      summary
    }
  }

  /**
   * Compare validation results across different strategies
   */
  async compareStrategies(
    config: any,
    allocations: EquipmentPlacement[]
  ): Promise<{ [strategyName: string]: PipelineResult }> {
    const results: { [strategyName: string]: PipelineResult } = {}
    
    for (const strategyName of this.strategies.keys()) {
      results[strategyName] = await this.validateEquipment(config, allocations, strategyName)
    }
    
    return results
  }

  /**
   * Get validation summary for display
   */
  async getValidationSummary(
    config: any,
    allocations: EquipmentPlacement[]
  ): Promise<{
    isValid: boolean
    criticalErrors: number
    majorErrors: number
    minorErrors: number
    warnings: number
    complianceScore: number
    suggestions: string[]
  }> {
    const result = await this.validateEquipment(config, allocations)
    
    const criticalErrors = result.overall.errors.filter(e => e.severity === 'critical').length
    const majorErrors = result.overall.errors.filter(e => e.severity === 'major').length
    const minorErrors = result.overall.errors.filter(e => e.severity === 'minor').length
    
    return {
      isValid: result.overall.isValid,
      criticalErrors,
      majorErrors,
      minorErrors,
      warnings: result.overall.warnings.length,
      complianceScore: result.summary.complianceScore,
      suggestions: result.overall.suggestions.slice(0, 5) // Top 5 suggestions
    }
  }

  /**
   * Generate validation report
   */
  async generateValidationReport(
    config: any,
    allocations: EquipmentPlacement[],
    strategyName?: string
  ): Promise<string> {
    const result = await this.validateEquipment(config, allocations, strategyName)
    return this.formatValidationReport(result)
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
  getStrategyDetails(strategyName: string): ValidationStrategy | null {
    return this.strategies.get(strategyName) || null
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

  // ===== PRIVATE METHODS =====

  private getStrategy(strategyName: string): ValidationStrategy {
    const strategy = this.strategies.get(strategyName)
    if (!strategy) {
      throw new Error(`Validation strategy '${strategyName}' not found`)
    }
    return strategy
  }

  private buildPipeline(strategy: ValidationStrategy): EquipmentValidationPipeline {
    const pipeline = new EquipmentValidationPipeline()
    const validators = strategy.getValidators()
    
    for (const validator of validators) {
      pipeline.addValidator(validator)
    }
    
    return pipeline
  }

  private aggregateResults(stageResults: ValidationStageResult[]): ValidationResult {
    const allErrors = stageResults.flatMap(stage => stage.errors)
    const allWarnings = stageResults.flatMap(stage => stage.warnings)
    const allSuggestions = stageResults.flatMap(stage => stage.suggestions)
    
    const isValid = allErrors.filter(e => e.severity === 'critical').length === 0
    
    const compliance: ComplianceStatus = {
      battleTechRules: !allErrors.some(e => e.type.includes('rule') || e.type.includes('required')),
      techLevel: !allErrors.some(e => e.type.includes('tech_level')),
      mountingRules: !allErrors.some(e => e.type.includes('location') || e.type.includes('mounting')),
      weightLimits: !allErrors.some(e => e.type.includes('weight'))
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      compliance,
      suggestions: [...new Set(allSuggestions)] // Remove duplicates
    }
  }

  private createSummary(stageResults: ValidationStageResult[]): ValidationSummary {
    const allErrors = stageResults.flatMap(stage => stage.errors)
    const allWarnings = stageResults.flatMap(stage => stage.warnings)
    
    const criticalIssues = allErrors.filter(e => e.severity === 'critical').length
    const majorIssues = allErrors.filter(e => e.severity === 'major').length
    const minorIssues = allErrors.filter(e => e.severity === 'minor').length
    
    // Calculate compliance score (0-100)
    const totalIssues = criticalIssues + majorIssues + minorIssues
    const complianceScore = totalIssues === 0 ? 100 : 
      Math.max(0, 100 - (criticalIssues * 30 + majorIssues * 15 + minorIssues * 5))

    return {
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      criticalIssues,
      majorIssues,
      minorIssues,
      complianceScore
    }
  }

  private formatValidationReport(result: PipelineResult): string {
    let report = `# Equipment Validation Report\n\n`
    
    // Overall status
    report += `## Overall Status: ${result.overall.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`
    
    // Summary
    report += `## Summary\n`
    report += `- **Compliance Score**: ${result.summary.complianceScore}/100\n`
    report += `- **Processing Time**: ${result.processingTime.toFixed(2)}ms\n`
    report += `- **Total Errors**: ${result.summary.totalErrors}\n`
    report += `- **Total Warnings**: ${result.summary.totalWarnings}\n\n`
    
    // Stage results
    report += `## Validation Stages\n`
    for (const stage of result.stages) {
      const status = stage.passed ? '✅' : '❌'
      report += `### ${status} ${stage.stageName}\n`
      report += `- **Status**: ${stage.passed ? 'Passed' : 'Failed'}\n`
      report += `- **Processing Time**: ${stage.processingTime.toFixed(2)}ms\n`
      report += `- **Errors**: ${stage.errors.length}\n`
      report += `- **Warnings**: ${stage.warnings.length}\n\n`
    }
    
    // Errors
    if (result.overall.errors.length > 0) {
      report += `## Errors\n`
      for (const error of result.overall.errors) {
        const severity = error.severity === 'critical' ? '🔴' : error.severity === 'major' ? '🟡' : '🟢'
        report += `### ${severity} ${error.type}\n`
        report += `- **Message**: ${error.message}\n`
        report += `- **Equipment**: ${error.equipmentId}\n`
        if (error.location) report += `- **Location**: ${error.location}\n`
        report += `- **Fix**: ${error.suggestedFix}\n\n`
      }
    }
    
    // Warnings
    if (result.overall.warnings.length > 0) {
      report += `## Warnings\n`
      for (const warning of result.overall.warnings) {
        report += `### ⚠️ ${warning.type}\n`
        report += `- **Message**: ${warning.message}\n`
        report += `- **Equipment**: ${warning.equipmentId}\n`
        report += `- **Impact**: ${warning.impact}\n`
        report += `- **Recommendation**: ${warning.recommendation}\n\n`
      }
    }
    
    // Suggestions
    if (result.overall.suggestions.length > 0) {
      report += `## Suggestions\n`
      for (const suggestion of result.overall.suggestions) {
        report += `- ${suggestion}\n`
      }
      report += `\n`
    }
    
    return report
  }
}