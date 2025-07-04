/**
 * Rule Compliance Validator
 * Validates BattleTech construction rules including required equipment,
 * engine ratings, heat sink requirements, and jump jet limits
 */

import { BaseEquipmentValidator } from './BaseEquipmentValidator'
import { 
  ValidationContext,
  ValidationError,
  ValidationWarning 
} from './EquipmentValidationTypes'

export class RuleComplianceValidator extends BaseEquipmentValidator {
  // BattleTech construction rules
  private static readonly CONSTRUCTION_RULES = {
    maxHeadTonnage: 1,
    maxEngineRating: 400,
    minHeatSinks: 10,
    maxJumpMP: 8,
    maxAmmoExplosions: 3,
    requiredEquipment: ['engine', 'gyro', 'cockpit'],
    techLevelRestrictions: {
      'Inner Sphere': ['Inner Sphere', 'Star League'],
      'Clan': ['Clan', 'Star League'],
      'Mixed': ['Inner Sphere', 'Clan', 'Star League']
    }
  }

  // Heat sink requirements by engine rating
  private static readonly HEAT_SINK_REQUIREMENTS = {
    getMinimumHeatSinks: (engineRating: number): number => {
      return Math.max(10, Math.ceil(engineRating / 25))
    },
    getFreeEngineSinks: (engineRating: number): number => {
      return Math.min(10, Math.floor(engineRating / 25))
    }
  }

  constructor() {
    super('RuleComplianceValidator')
  }

  protected async executeValidation(context: ValidationContext): Promise<{
    errors: ValidationError[]
    warnings: ValidationWarning[]
    suggestions: string[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: string[] = []

    // Check required equipment
    const requiredErrors = this.validateRequiredEquipment(context)
    errors.push(...requiredErrors)

    // Check engine rating limits
    const engineErrors = this.validateEngineRating(context)
    errors.push(...engineErrors)

    // Check heat sink requirements
    const heatSinkErrors = this.validateHeatSinkRequirements(context)
    errors.push(...heatSinkErrors)

    // Check jump jet limits
    const jumpJetErrors = this.validateJumpJetLimits(context)
    errors.push(...jumpJetErrors)

    // Check weight limits
    const weightErrors = this.validateWeightLimits(context)
    errors.push(...weightErrors)

    // Check ammunition safety rules
    const ammoWarnings = this.validateAmmunitionSafety(context)
    warnings.push(...ammoWarnings)

    // Generate compliance suggestions
    suggestions.push(...this.generateComplianceSuggestions(context, errors, warnings))

    return { errors, warnings, suggestions }
  }

  /**
   * Validate required equipment is present
   */
  private validateRequiredEquipment(context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = []
    const equipmentTypes = context.allocations.map(a => a.equipment?.equipmentData?.type || 'equipment')
    
    for (const requiredType of RuleComplianceValidator.CONSTRUCTION_RULES.requiredEquipment) {
      if (!equipmentTypes.includes(requiredType)) {
        let location = 'centerTorso'
        let description = `${requiredType} is required for all mechs`
        
        switch (requiredType) {
          case 'engine':
            location = 'centerTorso'
            description = 'Engine is required for all mechs'
            break
          case 'gyro':
            location = 'centerTorso'
            description = 'Gyro is required for all mechs'
            break
          case 'cockpit':
            location = 'head'
            description = 'Cockpit is required for all mechs'
            break
        }

        errors.push(this.createError(
          'system',
          'missing_required_equipment',
          description,
          'critical',
          `Add ${requiredType} to ${location}`,
          location
        ))
      }
    }

    return errors
  }

  /**
   * Validate engine rating limits
   */
  private validateEngineRating(context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = []
    const engineRating = context.config.engineRating || 0

    if (engineRating <= 0) {
      errors.push(this.createError(
        'engine',
        'invalid_engine_rating',
        'Engine rating must be greater than 0',
        'critical',
        'Set valid engine rating'
      ))
    } else if (engineRating > RuleComplianceValidator.CONSTRUCTION_RULES.maxEngineRating) {
      errors.push(this.createError(
        'engine',
        'engine_rating_exceeded',
        `Engine rating ${engineRating} exceeds maximum of ${RuleComplianceValidator.CONSTRUCTION_RULES.maxEngineRating}`,
        'critical',
        'Reduce engine rating or select different chassis'
      ))
    }

    // Check if engine rating is valid (multiples of 5 between 10-400)
    if (engineRating > 0 && (engineRating % 5 !== 0 || engineRating < 10)) {
      errors.push(this.createError(
        'engine',
        'invalid_engine_rating',
        `Engine rating ${engineRating} is invalid - must be multiples of 5 between 10-400`,
        'major',
        'Use valid engine rating (10, 15, 20, 25, etc.)'
      ))
    }

    return errors
  }

  /**
   * Validate heat sink requirements
   */
  private validateHeatSinkRequirements(context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = []
    const engineRating = context.config.engineRating || 0
    
    if (engineRating <= 0) return errors

    const totalHeatSinks = this.countHeatSinks(context)
    const minimumRequired = RuleComplianceValidator.HEAT_SINK_REQUIREMENTS.getMinimumHeatSinks(engineRating)
    const freeEngineSinks = RuleComplianceValidator.HEAT_SINK_REQUIREMENTS.getFreeEngineSinks(engineRating)

    if (totalHeatSinks < minimumRequired) {
      const shortage = minimumRequired - totalHeatSinks
      errors.push(this.createError(
        'heat_sinks',
        'insufficient_heat_sinks',
        `Only ${totalHeatSinks} heat sinks, minimum required is ${minimumRequired} (${shortage} short)`,
        'critical',
        `Add ${shortage} more heat sinks`
      ))
    }

    // Check external heat sink placement
    const externalSinks = totalHeatSinks - freeEngineSinks
    if (externalSinks > 0) {
      const externalSinkAllocations = context.allocations.filter(a => 
        (a.equipment?.equipmentData?.type === 'heat_sink' || 
         a.equipment?.name?.includes('Heat Sink')) && 
        !a.equipment?.engineMounted
      )

      if (externalSinkAllocations.length !== externalSinks) {
        errors.push(this.createError(
          'heat_sinks',
          'heat_sink_placement_error',
          `${externalSinks} external heat sinks required but ${externalSinkAllocations.length} allocated`,
          'major',
          'Ensure correct number of external heat sinks are placed'
        ))
      }
    }

    return errors
  }

  /**
   * Validate jump jet limits
   */
  private validateJumpJetLimits(context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = []
    const jumpJets = context.allocations.filter(a => 
      a.equipment?.equipmentData?.type === 'jump_jet' ||
      a.equipment?.name?.includes('Jump Jet')
    ).length

    if (jumpJets === 0) return errors

    const tonnage = context.config.tonnage || 100
    const maxJumpMP = Math.min(
      RuleComplianceValidator.CONSTRUCTION_RULES.maxJumpMP, 
      Math.floor(tonnage / 10)
    )

    if (jumpJets > maxJumpMP) {
      const excess = jumpJets - maxJumpMP
      errors.push(this.createError(
        'jump_jets',
        'jump_jet_limit_exceeded',
        `${jumpJets} jump jets exceed maximum of ${maxJumpMP} for ${tonnage}-ton mech`,
        'critical',
        `Remove ${excess} jump jets`
      ))
    }

    // Check jump jet placement rules
    const jumpJetLocations = context.allocations
      .filter(a => a.equipment?.equipmentData?.type === 'jump_jet')
      .map(a => a.location)

    const invalidLocations = jumpJetLocations.filter(loc => ['head'].includes(loc))
    if (invalidLocations.length > 0) {
      errors.push(this.createError(
        'jump_jets',
        'invalid_jump_jet_placement',
        `Jump jets cannot be placed in: ${invalidLocations.join(', ')}`,
        'major',
        'Move jump jets to torso or leg locations'
      ))
    }

    return errors
  }

  /**
   * Validate overall weight limits
   */
  private validateWeightLimits(context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = []
    const maxTonnage = context.config.tonnage || 100
    
    // Calculate total equipment weight
    const totalEquipmentWeight = context.allocations.reduce((sum, allocation) => {
      return sum + (allocation.equipment?.equipmentData?.tonnage || 0)
    }, 0)

    // Add structure and armor weight (simplified calculation)
    const structureWeight = this.calculateStructureWeight(context.config)
    const armorWeight = this.calculateArmorWeight(context.config)
    const totalWeight = totalEquipmentWeight + structureWeight + armorWeight

    if (totalWeight > maxTonnage) {
      const excess = totalWeight - maxTonnage
      errors.push(this.createError(
        'weight',
        'weight_limit_exceeded',
        `Total weight ${totalWeight.toFixed(1)} tons exceeds chassis limit of ${maxTonnage} tons (${excess.toFixed(1)} tons over)`,
        'critical',
        `Remove ${excess.toFixed(1)} tons of equipment or increase chassis tonnage`
      ))
    }

    return errors
  }

  /**
   * Validate ammunition safety rules
   */
  private validateAmmunitionSafety(context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = []
    
    // Check for ammunition without CASE protection
    const ammunitionAllocations = context.allocations.filter(a => 
      a.equipment?.equipmentData?.type === 'ammunition'
    )

    for (const ammoAllocation of ammunitionAllocations) {
      const location = ammoAllocation.location
      
      // Check if location has CASE
      const hasCase = context.allocations.some(a => 
        a.location === location && 
        (a.equipment?.name?.includes('CASE') || a.equipment?.equipmentData?.name?.includes('CASE'))
      )

      if (!hasCase && ['leftTorso', 'rightTorso'].includes(location)) {
        warnings.push(this.createWarning(
          ammoAllocation.equipmentId,
          'ammunition_safety',
          `Ammunition in ${location} without CASE protection poses explosion risk`,
          'high',
          'Add CASE protection or move ammunition to center torso'
        ))
      }
    }

    // Check for excessive ammunition concentration
    const ammoByLocation = this.groupAmmunitionByLocation(ammunitionAllocations)
    for (const [location, ammoCount] of Object.entries(ammoByLocation)) {
      if (ammoCount > 3) {
        warnings.push(this.createWarning(
          'ammunition',
          'ammunition_concentration',
          `High ammunition concentration in ${location} (${ammoCount} types)`,
          'medium',
          'Distribute ammunition across multiple locations to reduce explosion risk'
        ))
      }
    }

    return warnings
  }

  /**
   * Generate compliance suggestions
   */
  private generateComplianceSuggestions(
    context: ValidationContext, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): string[] {
    const suggestions: string[] = []

    // Suggest heat efficiency improvements
    const heatEfficiency = this.analyzeHeatEfficiency(context)
    if (heatEfficiency < 0.8) {
      suggestions.push('Consider adding more heat sinks or double heat sinks for better heat efficiency')
    }

    // Suggest weight optimization
    const weightUtilization = this.calculateWeightUtilization(context)
    if (weightUtilization < 0.9) {
      const unusedWeight = ((context.config.tonnage || 100) * (1 - weightUtilization)).toFixed(1)
      suggestions.push(`${unusedWeight} tons of weight capacity unused - consider adding more equipment`)
    }

    // Suggest defensive improvements
    if (errors.some(e => e.type === 'ammunition_safety')) {
      suggestions.push('Consider adding CASE protection for ammunition storage locations')
    }

    // Suggest engine efficiency
    const engineRating = context.config.engineRating || 0
    const tonnage = context.config.tonnage || 100
    const walkMP = Math.floor(engineRating / tonnage)
    
    if (walkMP < 3) {
      suggestions.push('Low movement speed - consider increasing engine rating for better tactical mobility')
    } else if (walkMP > 6) {
      suggestions.push('High movement speed uses significant tonnage - consider reducing engine rating if not needed')
    }

    return suggestions
  }

  // ===== HELPER METHODS =====

  private countHeatSinks(context: ValidationContext): number {
    const engineRating = context.config.engineRating || 0
    const freeEngineSinks = RuleComplianceValidator.HEAT_SINK_REQUIREMENTS.getFreeEngineSinks(engineRating)
    
    const externalSinks = context.allocations.filter(a => 
      (a.equipment?.equipmentData?.type === 'heat_sink' || 
       a.equipment?.name?.includes('Heat Sink')) && 
      !a.equipment?.engineMounted
    ).length

    return freeEngineSinks + externalSinks
  }

  private calculateStructureWeight(config: any): number {
    const tonnage = config.tonnage || 100
    const structureType = config.structureType || 'Standard'
    
    // Simplified structure weight calculation
    let baseWeight = tonnage * 0.1 // 10% of mech tonnage for standard structure
    
    if (structureType.includes('Endo Steel')) {
      baseWeight *= 0.5 // Endo Steel is half weight
    }
    
    return baseWeight
  }

  private calculateArmorWeight(config: any): number {
    // Simplified armor weight calculation
    const armorPoints = config.armorDistribution?.total || 0
    const armorType = config.armorType || 'Standard'
    
    let weightPerPoint = 1/16 // Standard armor: 16 points per ton
    
    if (armorType.includes('Ferro-Fibrous')) {
      weightPerPoint *= 0.8 // Ferro-Fibrous is 20% lighter
    }
    
    return armorPoints * weightPerPoint
  }

  private groupAmmunitionByLocation(ammunitionAllocations: any[]): { [location: string]: number } {
    const groups: { [location: string]: number } = {}
    
    for (const allocation of ammunitionAllocations) {
      const location = allocation.location
      groups[location] = (groups[location] || 0) + 1
    }
    
    return groups
  }

  private analyzeHeatEfficiency(context: ValidationContext): number {
    const totalHeatGeneration = context.allocations.reduce((sum, allocation) => {
      return sum + (allocation.equipment?.equipmentData?.heat || 0)
    }, 0)
    
    const totalHeatDissipation = this.countHeatSinks(context)
    
    if (totalHeatGeneration === 0) return 1.0
    return totalHeatDissipation / totalHeatGeneration
  }

  private calculateWeightUtilization(context: ValidationContext): number {
    const maxTonnage = context.config.tonnage || 100
    const usedWeight = context.allocations.reduce((sum, allocation) => {
      return sum + (allocation.equipment?.equipmentData?.tonnage || 0)
    }, 0)
    
    const structureWeight = this.calculateStructureWeight(context.config)
    const armorWeight = this.calculateArmorWeight(context.config)
    const totalUsedWeight = usedWeight + structureWeight + armorWeight
    
    return totalUsedWeight / maxTonnage
  }
}