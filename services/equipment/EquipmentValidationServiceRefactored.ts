/**
 * EquipmentValidationService - Refactored version using Pipeline pattern
 * 
 * This refactored version maintains backward compatibility while using the new
 * pipeline-based architecture with facades and specialized validators.
 * 
 * @see TECHNICAL_ARCHITECTURE.md for service architecture patterns
 */

import { EquipmentValidationFacade } from './validation/EquipmentValidationFacade'
import { 
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ComplianceStatus,
  PlacementValidation,
  RuleComplianceResult,
  TechLevelValidation,
  MountingValidation,
  EquipmentPlacement 
} from './validation/EquipmentValidationTypes'

/**
 * Refactored Equipment Validation Service
 * Uses the new pipeline pattern to coordinate all validation operations
 */
export class EquipmentValidationService {
  private static facade: EquipmentValidationFacade = new EquipmentValidationFacade()

  /**
   * Main validation method - maintains backward compatibility with original interface
   */
  static async validateEquipmentPlacement(
    config: any,
    allocations: EquipmentPlacement[]
  ): Promise<ValidationResult> {
    const result = await this.facade.validateEquipment(config, allocations)
    return result.overall
  }

  /**
   * Validate using strict BattleTech rules
   */
  static async validateStrict(
    config: any, 
    allocations: EquipmentPlacement[]
  ): Promise<ValidationResult> {
    const result = await this.facade.validateEquipment(config, allocations, 'Strict BattleTech')
    return result.overall
  }

  /**
   * Validate using standard rules
   */
  static async validateStandard(
    config: any, 
    allocations: EquipmentPlacement[]
  ): Promise<ValidationResult> {
    const result = await this.facade.validateEquipment(config, allocations, 'Standard BattleTech')
    return result.overall
  }

  /**
   * Quick validation for fast iteration
   */
  static async quickValidate(
    config: any, 
    allocations: EquipmentPlacement[]
  ): Promise<boolean> {
    return await this.facade.quickValidate(config, allocations)
  }

  /**
   * Validate a single equipment placement - backward compatible interface
   */
  static async validateSinglePlacement(
    allocation: EquipmentPlacement,
    config: any,
    allAllocations: EquipmentPlacement[]
  ): Promise<PlacementValidation> {
    // Create a minimal context for single placement validation
    const result = await this.facade.validateEquipment(config, [allocation], 'Quick Validation')
    
    const errors = result.overall.errors.map(e => ({
      type: e.type as any,
      message: e.message,
      severity: e.severity,
      suggestedFix: e.suggestedFix
    }))

    const warnings = result.overall.warnings.map(w => ({
      type: w.type as any,
      message: w.message,
      recommendation: w.recommendation,
      impact: w.impact
    }))

    return {
      isValid: result.overall.isValid,
      errors,
      warnings,
      restrictions: [],
      suggestions: result.overall.suggestions
    }
  }

  /**
   * Check BattleTech construction rules compliance
   */
  static async checkBattleTechRules(
    config: any,
    allocations: EquipmentPlacement[]
  ): Promise<RuleComplianceResult> {
    const result = await this.facade.validateEquipment(config, allocations, 'Strict BattleTech')
    
    const violations = result.overall.errors
      .filter(e => e.type.includes('rule') || e.type.includes('required'))
      .map(e => ({
        rule: e.type,
        description: e.message,
        affectedEquipment: [e.equipmentId],
        severity: e.severity,
        resolution: e.suggestedFix
      }))

    const techLevelIssues = result.overall.errors
      .filter(e => e.type.includes('tech_level'))
      .map(e => ({
        equipment: e.equipmentId,
        requiredTechLevel: 'Unknown', // Would be determined from equipment data
        currentTechLevel: config.techLevel || 'Inner Sphere',
        era: config.era || '3025',
        canBeResolved: true,
        suggestion: e.suggestedFix
      }))

    const mountingIssues = result.overall.errors
      .filter(e => e.type.includes('location') || e.type.includes('mounting'))
      .map(e => ({
        equipment: e.equipmentId,
        location: e.location || 'unknown',
        issue: e.message,
        restriction: e.type,
        alternatives: []
      }))

    const suggestions = result.overall.suggestions.map(s => ({
      type: 'rule_compliance' as const,
      equipment: 'general',
      suggestion: s,
      impact: 'Improves overall compliance'
    }))

    return {
      compliant: result.overall.isValid,
      violations,
      techLevelIssues,
      mountingIssues,
      suggestions
    }
  }

  /**
   * Validate tech level compatibility
   */
  static async validateTechLevel(
    equipment: any[], 
    config: any
  ): Promise<TechLevelValidation> {
    // Convert equipment array to allocations format
    const allocations: EquipmentPlacement[] = equipment.map((eq, index) => ({
      equipmentId: `equipment_${index}`,
      equipment: eq,
      location: eq.location || 'centerTorso'
    }))

    const result = await this.facade.validateEquipment(config, allocations)
    
    const techIssues = result.overall.errors
      .filter(e => e.type.includes('tech_level'))
      .map(e => ({
        equipment: e.equipmentId,
        requiredTechLevel: 'Unknown',
        currentTechLevel: config.techLevel || 'Inner Sphere',
        era: config.era || '3025',
        canBeResolved: true,
        suggestion: e.suggestedFix
      }))

    // Count equipment by tech base
    const innerSphere = equipment.filter(eq => 
      !eq.equipmentData?.techLevel?.includes('Clan')
    ).length
    
    const clan = equipment.filter(eq => 
      eq.equipmentData?.techLevel?.includes('Clan')
    ).length

    const summary = {
      innerSphere,
      clan,
      mixed: innerSphere > 0 && clan > 0,
      era: config.era || '3025',
      techLevel: config.techLevel || 'Inner Sphere'
    }

    return {
      isValid: techIssues.length === 0,
      issues: techIssues,
      summary,
      recommendations: result.overall.suggestions.filter(s => 
        s.includes('tech') || s.includes('Tech')
      )
    }
  }

  /**
   * Validate mounting restrictions for equipment
   */
  static async validateMountingRestrictions(
    equipment: any,
    location: string,
    config: any
  ): Promise<MountingValidation> {
    const allocation: EquipmentPlacement = {
      equipmentId: 'test_equipment',
      equipment,
      location
    }

    const result = await this.facade.validateEquipment(config, [allocation], 'Quick Validation')
    
    const canMount = !result.overall.errors.some(e => 
      e.type.includes('location') || e.type.includes('mounting')
    )

    const restrictions = result.overall.errors
      .filter(e => e.type.includes('location') || e.type.includes('mounting'))
      .map(e => ({
        type: e.type.includes('location') ? 'location' as const : 'special' as const,
        description: e.message,
        severity: 'blocking' as const
      }))

    const requirements = [] // Would be determined from equipment requirements
    const alternatives = [] // Would be calculated based on equipment constraints
    const warnings = result.overall.warnings.map(w => w.message)

    return {
      canMount,
      restrictions,
      requirements,
      alternatives,
      warnings
    }
  }

  /**
   * Generate comprehensive validation report
   */
  static async generateValidationReport(
    config: any,
    allocations: EquipmentPlacement[]
  ): Promise<string> {
    return await this.facade.generateValidationReport(config, allocations)
  }

  /**
   * Get validation summary for display purposes
   */
  static async getValidationSummary(
    config: any,
    allocations: EquipmentPlacement[]
  ): Promise<{
    overallValid: boolean
    criticalViolations: number
    majorViolations: number
    minorViolations: number
    totalWarnings: number
    complianceScore: number
    suggestions: string[]
  }> {
    const summary = await this.facade.getValidationSummary(config, allocations)
    
    return {
      overallValid: summary.isValid,
      criticalViolations: summary.criticalErrors,
      majorViolations: summary.majorErrors,
      minorViolations: summary.minorErrors,
      totalWarnings: summary.warnings,
      complianceScore: summary.complianceScore,
      suggestions: summary.suggestions
    }
  }

  /**
   * Compare validation results across different strategies
   */
  static async compareValidationStrategies(
    config: any,
    allocations: EquipmentPlacement[]
  ): Promise<{ [strategyName: string]: ValidationResult }> {
    const results = await this.facade.compareStrategies(config, allocations)
    
    // Convert to expected format
    const formattedResults: { [strategyName: string]: ValidationResult } = {}
    for (const [strategy, result] of Object.entries(results)) {
      formattedResults[strategy] = result.overall
    }
    
    return formattedResults
  }

  /**
   * Get available validation strategies
   */
  static getAvailableStrategies(): string[] {
    return this.facade.getAvailableStrategies()
  }

  /**
   * Set the default validation strategy
   */
  static setDefaultValidationStrategy(strategyName: string): void {
    this.facade.setDefaultStrategy(strategyName)
  }

  /**
   * Validate equipment with specific options
   */
  static async validateWithOptions(
    config: any,
    allocations: EquipmentPlacement[],
    options: {
      strategy?: string
      strictMode?: boolean
      generateReport?: boolean
      includeWarnings?: boolean
    } = {}
  ): Promise<ValidationResult & { report?: string }> {
    const strategyName = options.strategy || 'Standard BattleTech'
    const result = await this.facade.validateEquipment(config, allocations, strategyName)
    
    let validationResult: ValidationResult & { report?: string } = result.overall

    if (options.generateReport) {
      validationResult.report = await this.facade.generateValidationReport(config, allocations, strategyName)
    }

    if (!options.includeWarnings) {
      validationResult.warnings = []
    }

    return validationResult
  }

  /**
   * Batch validate multiple configurations
   */
  static async batchValidate(
    configurations: Array<{ config: any; allocations: EquipmentPlacement[] }>,
    strategy?: string
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    for (const { config, allocations } of configurations) {
      const result = await this.facade.validateEquipment(config, allocations, strategy)
      results.push(result.overall)
    }
    
    return results
  }

  /**
   * Get detailed pipeline information for debugging
   */
  static async getValidationPipelineInfo(
    config: any,
    allocations: EquipmentPlacement[],
    strategy?: string
  ): Promise<{
    overall: ValidationResult
    stages: Array<{
      name: string
      passed: boolean
      processingTime: number
      errors: number
      warnings: number
    }>
    totalProcessingTime: number
  }> {
    const result = await this.facade.validateEquipment(config, allocations, strategy)
    
    const stages = result.stages.map(stage => ({
      name: stage.stageName,
      passed: stage.passed,
      processingTime: stage.processingTime,
      errors: stage.errors.length,
      warnings: stage.warnings.length
    }))

    return {
      overall: result.overall,
      stages,
      totalProcessingTime: result.processingTime
    }
  }

  /**
   * Reset facade instance (for testing purposes)
   */
  static resetFacade(): void {
    this.facade = new EquipmentValidationFacade()
  }
}