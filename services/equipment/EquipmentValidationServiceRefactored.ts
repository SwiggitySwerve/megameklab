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
  PlacementError,
  PlacementWarning,
  RuleComplianceResult,
  TechLevelValidation,
  MountingValidation,
  EquipmentPlacement 
} from './validation/EquipmentValidationTypes'

// Type guard for legacy allocation format with slots array
interface LegacyEquipmentPlacement extends EquipmentPlacement {
  slots?: number[];
}

function hasLegacySlotsArray(allocation: EquipmentPlacement): allocation is LegacyEquipmentPlacement {
  return 'slots' in allocation && Array.isArray((allocation as LegacyEquipmentPlacement).slots);
}

function extractSlots(allocation: EquipmentPlacement): number[] {
  if (hasLegacySlotsArray(allocation)) {
    return allocation.slots || [];
  }
  
  const startSlot = allocation.startSlot || 1;
  const endSlot = allocation.endSlot || startSlot;
  const slots: number[] = [];
  for (let slot = startSlot; slot <= endSlot; slot++) {
    slots.push(slot);
  }
  return slots;
}

/**
 * Refactored Equipment Validation Service
 * Uses the new pipeline pattern to coordinate all validation operations
 */
export class EquipmentValidationService {
  private static facade: EquipmentValidationFacade = new EquipmentValidationFacade()

  /**
   * Synchronous validation implementation for backward compatibility
   */
  private static performSynchronousValidation(
    config: any,
    allocations: EquipmentPlacement[]
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: string[] = []

    // Basic validation logic
    let isValid = true

    // Check for required equipment
    const hasEngine = allocations.some(a => a.equipment?.equipmentData?.type === 'engine')
    const hasGyro = allocations.some(a => a.equipment?.equipmentData?.type === 'gyro')
    const hasCockpit = allocations.some(a => a.equipment?.equipmentData?.type === 'cockpit')

    if (!hasEngine) {
      errors.push({
        type: 'required_equipment',
        message: 'Engine is required for all BattleMechs',
        severity: 'critical',
        equipmentId: 'engine',
        suggestedFix: 'Add a fusion engine to the center torso'
      })
      isValid = false
    }

    if (!hasGyro) {
      errors.push({
        type: 'required_equipment',
        message: 'Gyro is required for all BattleMechs',
        severity: 'critical',
        equipmentId: 'gyro',
        suggestedFix: 'Add a standard gyro to the center torso'
      })
      isValid = false
    }

    if (!hasCockpit) {
      errors.push({
        type: 'required_equipment',
        message: 'Cockpit is required for all BattleMechs',
        severity: 'critical',
        equipmentId: 'cockpit',
        suggestedFix: 'Add a standard cockpit to the head'
      })
      isValid = false
    }

    // Check for tech base conflicts
    const innerSphereEquipment = allocations.filter(a => 
      a.equipment?.equipmentData?.techBase === 'Inner Sphere'
    )
    const clanEquipment = allocations.filter(a => 
      a.equipment?.equipmentData?.techBase === 'Clan'
    )

    if (config.techBase === 'Inner Sphere' && clanEquipment.length > 0) {
      clanEquipment.forEach(eq => {
        errors.push({
          type: 'tech_base_conflict',
          message: `${eq.equipment.equipmentData.name} is Clan technology but unit is Inner Sphere`,
          severity: 'major',
          equipmentId: eq.equipmentId,
          suggestedFix: 'Replace with Inner Sphere equivalent or change unit tech base'
        })
      })
      isValid = false
    }

    // Check weight limits (basic check)
    const totalWeight = allocations.reduce((sum, a) => 
      sum + (a.equipment?.equipmentData?.tonnage || 0), 0
    )
    
    if (totalWeight > config.tonnage) {
      errors.push({
        type: 'weight_violation',
        message: `Total equipment weight (${totalWeight}) exceeds unit tonnage (${config.tonnage})`,
        severity: 'critical',
        equipmentId: 'overall',
        suggestedFix: 'Remove equipment or reduce armor to meet weight limits'
      })
      isValid = false
    }

    // Check slot conflicts
    const slotMap = new Map<string, number[]>()
    for (const allocation of allocations) {
      const location = allocation.location
      
      // Handle both old format (slots array) and new format (startSlot/endSlot)
      const slotsToCheck = extractSlots(allocation)
      
      if (!slotMap.has(location)) {
        slotMap.set(location, [])
      }
      
      const locationSlots = slotMap.get(location)!
      for (const slot of slotsToCheck) {
        if (locationSlots.includes(slot)) {
          errors.push({
            type: 'slot_conflict',
            message: `Slot ${slot} in ${location} is already occupied`,
            severity: 'major',
            equipmentId: allocation.equipmentId,
            location: location,
            suggestedFix: 'Move equipment to different slots or location'
          })
          isValid = false
        } else {
          locationSlots.push(slot)
        }
      }
    }

    const compliance: ComplianceStatus = {
      battleTechRules: hasEngine && hasGyro && hasCockpit,
      techLevel: clanEquipment.length === 0 || config.techBase !== 'Inner Sphere',
      mountingRules: errors.filter(e => e.type.includes('location')).length === 0,
      weightLimits: totalWeight <= config.tonnage
    }

    return {
      isValid,
      errors,
      warnings,
      compliance,
      suggestions
    }
  }

  /**
   * Main validation method - maintains backward compatibility with original interface
   */
  static validateEquipmentPlacement(
    config: any,
    allocations: EquipmentPlacement[]
  ): ValidationResult {
    // Synchronous implementation for backward compatibility
    return this.performSynchronousValidation(config, allocations)
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
  static validateSinglePlacement(
    allocation: EquipmentPlacement,
    config: any,
    allAllocations: EquipmentPlacement[]
  ): PlacementValidation {
    const errors: PlacementError[] = []
    const warnings: PlacementWarning[] = []
    const suggestions: string[] = []
    
    // Basic single placement validation
    let isValid = true

    // Check if equipment is in allowed location
    const equipment = allocation.equipment?.equipmentData
    if (equipment?.type === 'engine' && allocation.location !== 'centerTorso') {
      errors.push({
        type: 'location_invalid',
        message: 'Engine must be placed in center torso',
        severity: 'critical',
        suggestedFix: 'Move engine to center torso'
      })
      isValid = false
    }

    if (equipment?.type === 'gyro' && allocation.location !== 'centerTorso') {
      errors.push({
        type: 'location_invalid',
        message: 'Gyro must be placed in center torso',
        severity: 'critical',
        suggestedFix: 'Move gyro to center torso'
      })
      isValid = false
    }

    if (equipment?.type === 'cockpit' && allocation.location !== 'head') {
      errors.push({
        type: 'location_invalid',
        message: 'Cockpit must be placed in head',
        severity: 'critical',
        suggestedFix: 'Move cockpit to head'
      })
      isValid = false
    }

    // Check for ammunition in head
    if (equipment?.type === 'ammunition' && allocation.location === 'head') {
      errors.push({
        type: 'rule_violation',
        message: 'Ammunition should not be placed in head due to vulnerability',
        severity: 'major',
        suggestedFix: 'Move ammunition to torso or legs'
      })
      isValid = false
    }

    // Check tech base compatibility
    if (equipment?.techBase === 'Clan' && config.techBase === 'Inner Sphere') {
      errors.push({
        type: 'tech_level',
        message: 'Clan equipment cannot be used on Inner Sphere units',
        severity: 'major',
        suggestedFix: 'Replace with Inner Sphere equivalent'
      })
      isValid = false
    }

    // Add warning for vulnerable placements
    if (equipment?.type === 'weapon' && allocation.location === 'head') {
      warnings.push({
        type: 'vulnerability',
        message: 'Weapon placement in head is vulnerable to critical hits',
        recommendation: 'Consider placing weapons in arms or torso',
        impact: 'medium'
      })
    }

    return {
      isValid,
      errors,
      warnings,
      restrictions: [],
      suggestions
    }
  }

  /**
   * Check BattleTech construction rules compliance
   */
  static checkBattleTechRules(
    config: any,
    allocations: EquipmentPlacement[]
  ): RuleComplianceResult {
    const validationResult = this.performSynchronousValidation(config, allocations)
    
    const violations = validationResult.errors
      .filter(e => e.type.includes('rule') || e.type.includes('required'))
      .map(e => ({
        rule: e.type,
        description: e.message,
        affectedEquipment: [e.equipmentId],
        severity: e.severity,
        resolution: e.suggestedFix
      }))

    const techLevelIssues = validationResult.errors
      .filter(e => e.type.includes('tech_level'))
      .map(e => ({
        equipment: e.equipmentId,
        requiredTechLevel: 'Unknown',
        currentTechLevel: config.techLevel || 'Inner Sphere',
        era: config.era || '3025',
        canBeResolved: true,
        suggestion: e.suggestedFix
      }))

    const mountingIssues = validationResult.errors
      .filter(e => e.type.includes('location') || e.type.includes('mounting'))
      .map(e => ({
        equipment: e.equipmentId,
        location: e.location || 'unknown',
        issue: e.message,
        restriction: e.type,
        alternatives: []
      }))

    const suggestions = validationResult.suggestions.map(s => ({
      type: 'rule_compliance' as const,
      equipment: 'general',
      suggestion: s,
      impact: 'Improves overall compliance'
    }))

    return {
      compliant: validationResult.isValid,
      violations,
      techLevelIssues,
      mountingIssues,
      suggestions
    }
  }

  /**
   * Validate tech level compatibility
   */
  static validateTechLevel(
    equipment: any[], 
    config: any
  ): TechLevelValidation {
    // Convert equipment array to allocations format
    const allocations: EquipmentPlacement[] = equipment.map((eq, index) => ({
      equipmentId: `equipment_${index}`,
      equipment: eq,
      location: eq.location || 'centerTorso'
    }))

    const result = this.performSynchronousValidation(config, allocations)
    
    const techIssues = result.errors
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
      !eq.equipmentData?.techBase?.includes('Clan')
    ).length
    
    const clan = equipment.filter(eq => 
      eq.equipmentData?.techBase?.includes('Clan')
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
      recommendations: result.suggestions.filter(s => 
        s.includes('tech') || s.includes('Tech')
      )
    }
  }

  /**
   * Validate mounting restrictions for equipment
   */
  static validateMountingRestrictions(
    equipment: any,
    location: string,
    config: any
  ): MountingValidation {
    const allocation: EquipmentPlacement = {
      equipmentId: 'test_equipment',
      equipment,
      location
    }

    const result = this.performSynchronousValidation(config, [allocation])
    
    const canMount = !result.errors.some(e => 
      e.type.includes('location') || e.type.includes('mounting')
    )

    const restrictions = result.errors
      .filter(e => e.type.includes('location') || e.type.includes('mounting'))
      .map(e => ({
        type: e.type.includes('location') ? 'location' as const : 'special' as const,
        description: e.message,
        severity: 'blocking' as const
      }))

    const requirements = []
    const alternatives = []
    const warnings = result.warnings.map(w => w.message)

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
  static generateValidationReport(
    config: any,
    allocations: EquipmentPlacement[]
  ): string {
    const result = this.performSynchronousValidation(config, allocations)
    
    let report = '# EQUIPMENT VALIDATION REPORT\n\n'
    
    // Configuration section
    report += '## CONFIGURATION\n'
    report += `- **Chassis**: ${config.chassis || 'Unknown'}\n`
    report += `- **Model**: ${config.model || 'Unknown'}\n`
    report += `- **Tonnage**: ${config.tonnage || 'Unknown'} tons\n`
    report += `- **Tech Base**: ${config.techBase || 'Unknown'}\n\n`
    
    // Compliance status
    report += '## COMPLIANCE STATUS\n'
    if (result.isValid) {
      report += '✅ **VALID** - Configuration passes all validation checks\n\n'
    } else {
      report += '❌ **INVALID** - Configuration has validation errors\n\n'
      report += '### CRITICAL ERRORS\n'
      const criticalErrors = result.errors.filter(e => e.severity === 'critical')
      for (const error of criticalErrors) {
        report += `- **${error.type}**: ${error.message}\n`
        report += `  - *Fix*: ${error.suggestedFix}\n`
      }
      report += '\n'
    }
    
    // Summary
    report += '## SUMMARY\n'
    report += `- **Total Errors**: ${result.errors.length}\n`
    report += `- **Total Warnings**: ${result.warnings.length}\n`
    report += `- **Equipment Count**: ${allocations.length}\n\n`
    
    return report
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