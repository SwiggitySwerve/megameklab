/**
 * Configuration Validation Command
 * Validates basic mech configuration elements using Command pattern
 * Handles weight, heat, movement, armor, structure, engine, gyro, and cockpit validation
 */

import { BaseValidationCommand } from '../BaseValidationCommand'
import { 
  ValidationContext,
  ValidationError,
  ValidationWarning,
  ConfigurationValidation,
  WeightValidation,
  WeightViolation,
  HeatValidation,
  HeatViolation,
  MovementValidation,
  MovementViolation,
  ArmorValidation,
  ArmorViolation,
  StructureValidation,
  EngineValidation,
  GyroValidation,
  CockpitValidation,
  CompatibilityValidation
} from '../ValidationOrchestrationTypes'

export class ConfigurationValidationCommand extends BaseValidationCommand {
  constructor() {
    super('ConfigurationValidation', 80) // High priority as base configuration
  }

  protected async executeValidation(context: ValidationContext): Promise<{
    isValid: boolean
    data: ConfigurationValidation
    errors: ValidationError[]
    warnings: ValidationWarning[]
    recommendations: string[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const recommendations: string[] = []

    // Validate all configuration aspects
    const weight = await this.validateWeight(context.config, context.equipment, errors, warnings, recommendations)
    const heat = await this.validateHeat(context.config, context.equipment, errors, warnings, recommendations)
    const movement = await this.validateMovement(context.config, errors, warnings, recommendations)
    const armor = await this.validateArmor(context.config, errors, warnings, recommendations)
    const structure = await this.validateStructure(context.config, errors, warnings, recommendations)
    const engine = await this.validateEngine(context.config, errors, warnings, recommendations)
    const gyro = await this.validateGyro(context.config, errors, warnings, recommendations)
    const cockpit = await this.validateCockpit(context.config, errors, warnings, recommendations)
    const compatibility = await this.validateCompatibility(context.config, errors, warnings, recommendations)

    const configurationData: ConfigurationValidation = {
      isValid: weight.isValid && heat.isValid && movement.isValid && armor.isValid && 
               structure.isValid && engine.isValid && gyro.isValid && cockpit.isValid && 
               compatibility.isValid,
      weight,
      heat,
      movement,
      armor,
      structure,
      engine,
      gyro,
      cockpit,
      compatibility
    }

    return {
      isValid: configurationData.isValid,
      data: configurationData,
      errors,
      warnings,
      recommendations
    }
  }

  /**
   * Validate weight limits and distribution
   */
  private async validateWeight(
    config: any, 
    equipment: any[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    recommendations: string[]
  ): Promise<WeightValidation> {
    const tonnage = config.tonnage || 100
    
    // Calculate component weights
    const structureWeight = this.calculateStructureWeight(config)
    const armorWeight = this.calculateArmorWeight(config)
    const engineWeight = this.calculateEngineWeight(config)
    const equipmentWeight = equipment.reduce((sum, eq) => sum + (eq.equipmentData?.tonnage || 0), 0)
    const ammunitionWeight = equipment
      .filter(eq => eq.equipmentData?.type === 'ammunition')
      .reduce((sum, eq) => sum + (eq.equipmentData?.tonnage || 0), 0)
    const systemsWeight = this.calculateSystemsWeight(config)

    const totalWeight = structureWeight + armorWeight + engineWeight + equipmentWeight + systemsWeight
    const overweight = Math.max(0, totalWeight - tonnage)
    const underweight = Math.max(0, tonnage - totalWeight)

    const distribution = {
      structure: structureWeight,
      armor: armorWeight,
      engine: engineWeight,
      equipment: equipmentWeight,
      ammunition: ammunitionWeight,
      systems: systemsWeight
    }

    const weightViolations: WeightViolation[] = []
    
    if (overweight > 0) {
      errors.push(this.createError(
        'weight_exceeded',
        `Configuration exceeds tonnage limit by ${overweight.toFixed(1)} tons`,
        'critical',
        `Remove ${overweight.toFixed(1)} tons of equipment or increase chassis tonnage`
      ))
      weightViolations.push({
        type: 'overweight' as const,
        component: 'overall',
        actual: totalWeight,
        expected: tonnage,
        severity: 'critical' as const,
        message: `Total weight ${totalWeight.toFixed(1)} exceeds limit of ${tonnage} tons`
      })
    }

    if (underweight > 5) {
      warnings.push(this.createWarning(
        'underweight',
        `Configuration is ${underweight.toFixed(1)} tons underweight`,
        'medium',
        'Consider adding more equipment to utilize available tonnage'
      ))
      recommendations.push(`${underweight.toFixed(1)} tons of weight capacity unused`)
    }

    // Check for negative component weights
    Object.entries(distribution).forEach(([component, weight]) => {
      if (weight < 0) {
        errors.push(this.createError(
          'negative_weight',
          `${component} has negative weight: ${weight}`,
          'critical',
          `Check ${component} configuration`
        ))
      }
    })

    return {
      isValid: weightViolations.filter(v => v.severity === 'critical').length === 0,
      totalWeight,
      maxWeight: tonnage,
      overweight,
      underweight,
      distribution,
      violations: weightViolations,
      recommendations: recommendations.filter(r => r.includes('weight') || r.includes('tons'))
    }
  }

  /**
   * Validate heat management
   */
  private async validateHeat(
    config: any, 
    equipment: any[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    recommendations: string[]
  ): Promise<HeatValidation> {
    const engineRating = config.engineRating || 0
    const heatSinkType = config.heatSinkType || 'Standard'
    
    // Calculate heat generation from equipment
    const heatGeneration = equipment.reduce((sum, eq) => sum + (eq.equipmentData?.heat || 0), 0)
    
    // Calculate heat sinks
    const engineHeatSinks = Math.floor(engineRating / 25)
    const externalHeatSinks = equipment.filter(eq => 
      eq.equipmentData?.type === 'heat_sink' && !eq.engineMounted
    ).length
    
    const totalHeatSinks = engineHeatSinks + externalHeatSinks
    const heatDissipation = heatSinkType.includes('Double') ? totalHeatSinks * 2 : totalHeatSinks
    const minimumHeatSinks = Math.max(10, Math.ceil(engineRating / 25))
    
    const heatDeficit = Math.max(0, heatGeneration - heatDissipation)
    const heatViolations: HeatViolation[] = []

    if (totalHeatSinks < minimumHeatSinks) {
      const shortage = minimumHeatSinks - totalHeatSinks
      errors.push(this.createError(
        'insufficient_heat_sinks',
        `Only ${totalHeatSinks} heat sinks, minimum required is ${minimumHeatSinks}`,
        'critical',
        `Add ${shortage} more heat sinks`
      ))
      heatViolations.push({
        type: 'insufficient_heat_sinks' as const,
        message: `Heat sink shortage: ${shortage}`,
        severity: 'critical' as const,
        suggestedFix: `Add ${shortage} heat sinks`
      })
    }

    if (heatDeficit > 0) {
      warnings.push(this.createWarning(
        'heat_imbalance',
        `Heat generation (${heatGeneration}) exceeds dissipation (${heatDissipation})`,
        'high',
        'Add more heat sinks or reduce heat-generating equipment'
      ))
      recommendations.push(`Consider adding ${Math.ceil(heatDeficit / (heatSinkType.includes('Double') ? 2 : 1))} more heat sinks`)
    }

    return {
      isValid: heatViolations.filter(v => v.severity === 'critical').length === 0,
      heatGeneration,
      heatDissipation,
      heatDeficit,
      minimumHeatSinks,
      actualHeatSinks: totalHeatSinks,
      engineHeatSinks,
      externalHeatSinks,
      violations: heatViolations,
      recommendations: recommendations.filter(r => r.includes('heat'))
    }
  }

  /**
   * Validate movement calculations
   */
  private async validateMovement(
    config: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    recommendations: string[]
  ): Promise<MovementValidation> {
    const engineRating = config.engineRating || 0
    const tonnage = config.tonnage || 100
    const engineType = config.engineType || 'Standard'
    
    const walkMP = Math.floor(engineRating / tonnage)
    const runMP = Math.floor(walkMP * 1.5)
    const jumpMP = 0 // Will be calculated from equipment in LoadoutValidation
    
    const movementViolations: MovementViolation[] = []

    // Validate engine rating
    if (engineRating <= 0) {
      errors.push(this.createError(
        'invalid_engine_rating',
        'Engine rating must be greater than 0',
        'critical',
        'Set valid engine rating'
      ))
      movementViolations.push({
        type: 'invalid_engine_rating' as const,
        message: 'Engine rating is invalid or missing',
        severity: 'critical' as const,
        suggestedFix: 'Configure engine rating'
      })
    }

    if (engineRating % 5 !== 0 || engineRating > 400) {
      errors.push(this.createError(
        'invalid_engine_rating',
        `Invalid engine rating: ${engineRating}`,
        'major',
        'Use valid engine rating (multiples of 5, max 400)'
      ))
    }

    // Movement recommendations
    if (walkMP < 3) {
      warnings.push(this.createWarning(
        'low_mobility',
        `Low walking speed: ${walkMP} MP`,
        'medium',
        'Consider increasing engine rating for better mobility'
      ))
      recommendations.push('Low mobility may limit tactical options')
    }

    if (walkMP > 6) {
      warnings.push(this.createWarning(
        'high_mobility_cost',
        `High walking speed: ${walkMP} MP uses significant tonnage`,
        'low',
        'Consider if high mobility is necessary'
      ))
    }

    return {
      isValid: movementViolations.filter(v => v.severity === 'critical').length === 0,
      walkMP,
      runMP,
      jumpMP,
      engineRating,
      tonnage,
      engineType,
      violations: movementViolations,
      recommendations: recommendations.filter(r => r.includes('mobility') || r.includes('speed'))
    }
  }

  /**
   * Validate armor configuration
   */
  private async validateArmor(
    config: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    recommendations: string[]
  ): Promise<ArmorValidation> {
    const armorType = config.armorType || 'Standard'
    const armorDistribution = config.armorDistribution || {}
    const tonnage = config.tonnage || 100
    
    const maxArmor = tonnage * 2 // Maximum armor points for tonnage
    const totalArmor = Object.values(armorDistribution).reduce((sum: number, armor: any) => sum + (armor || 0), 0)
    const armorWeight = this.calculateArmorWeight(config)
    
    const locationLimits: { [location: string]: any } = {}
    const armorViolations: ArmorViolation[] = []

    // Validate total armor doesn't exceed maximum
    if (totalArmor > maxArmor) {
      errors.push(this.createError(
        'armor_exceeds_maximum',
        `Total armor ${totalArmor} exceeds maximum of ${maxArmor}`,
        'critical',
        `Reduce armor by ${totalArmor - maxArmor} points`
      ))
      armorViolations.push({
        type: 'exceeds_maximum' as const,
        message: `Armor exceeds maximum allowed`,
        severity: 'critical' as const,
        suggestedFix: 'Reduce armor allocation'
      })
    }

    // Armor efficiency recommendations
    const armorEfficiency = totalArmor / maxArmor
    if (armorEfficiency < 0.8) {
      recommendations.push(`Armor utilization is ${(armorEfficiency * 100).toFixed(1)}% - consider adding more armor`)
    }

    if (armorType === 'Standard' && tonnage >= 55) {
      recommendations.push('Consider Ferro-Fibrous armor for weight savings on heavier mechs')
    }

    return {
      isValid: armorViolations.filter(v => v.severity === 'critical').length === 0,
      totalArmor,
      maxArmor,
      armorType,
      armorWeight,
      locationLimits,
      violations: armorViolations,
      recommendations: recommendations.filter(r => r.includes('armor'))
    }
  }

  // Additional validation methods would go here (structure, engine, gyro, cockpit, compatibility)
  // Simplified for brevity - each would follow similar pattern

  private async validateStructure(config: any, errors: ValidationError[], warnings: ValidationWarning[], recommendations: string[]): Promise<StructureValidation> {
    const structureType = config.structureType || 'Standard'
    const structureWeight = this.calculateStructureWeight(config)
    const internalStructure = Math.floor((config.tonnage || 100) / 10)

    return {
      isValid: true,
      structureType,
      structureWeight,
      internalStructure,
      violations: [],
      recommendations: structureType === 'Standard' ? ['Consider Endo Steel for weight savings'] : []
    }
  }

  private async validateEngine(config: any, errors: ValidationError[], warnings: ValidationWarning[], recommendations: string[]): Promise<EngineValidation> {
    const engineType = config.engineType || 'Standard'
    const engineRating = config.engineRating || 0
    const engineWeight = this.calculateEngineWeight(config)
    const walkMP = Math.floor(engineRating / (config.tonnage || 100))

    return {
      isValid: engineRating > 0,
      engineType,
      engineRating,
      engineWeight,
      walkMP,
      maxRating: 400,
      minRating: 10,
      violations: [],
      recommendations: []
    }
  }

  private async validateGyro(config: any, errors: ValidationError[], warnings: ValidationWarning[], recommendations: string[]): Promise<GyroValidation> {
    const gyroType = config.gyroType || 'Standard'
    const gyroWeight = this.calculateGyroWeight(config)

    return {
      isValid: true,
      gyroType,
      gyroWeight,
      engineCompatible: true,
      violations: [],
      recommendations: []
    }
  }

  private async validateCockpit(config: any, errors: ValidationError[], warnings: ValidationWarning[], recommendations: string[]): Promise<CockpitValidation> {
    const cockpitType = config.cockpitType || 'Standard'
    const cockpitWeight = this.calculateCockpitWeight(config)

    return {
      isValid: true,
      cockpitType,
      cockpitWeight,
      violations: [],
      recommendations: []
    }
  }

  private async validateCompatibility(config: any, errors: ValidationError[], warnings: ValidationWarning[], recommendations: string[]): Promise<CompatibilityValidation> {
    return {
      isValid: true,
      componentCompatibility: [],
      systemIntegration: [],
      violations: [],
      recommendations: []
    }
  }

  // Helper methods for weight calculations
  private calculateStructureWeight(config: any): number {
    const tonnage = config.tonnage || 100
    const structureType = config.structureType || 'Standard'
    let weight = tonnage * 0.1
    if (structureType.includes('Endo Steel')) weight *= 0.5
    return weight
  }

  private calculateArmorWeight(config: any): number {
    const armorDistribution = config.armorDistribution || {}
    const armorPoints = Object.values(armorDistribution).reduce((sum: number, armor: any) => sum + (armor || 0), 0)
    const armorType = config.armorType || 'Standard'
    let weight = armorPoints / 16
    if (armorType.includes('Ferro-Fibrous')) weight *= 0.89
    return weight
  }

  private calculateEngineWeight(config: any): number {
    const engineRating = config.engineRating || 0
    const engineType = config.engineType || 'Standard'
    
    // Simplified engine weight calculation
    let baseWeight = Math.ceil(engineRating / 25) * 0.5
    if (engineType.includes('XL')) baseWeight *= 0.5
    if (engineType.includes('Light')) baseWeight *= 0.75
    
    return baseWeight
  }

  private calculateSystemsWeight(config: any): number {
    return this.calculateGyroWeight(config) + this.calculateCockpitWeight(config)
  }

  private calculateGyroWeight(config: any): number {
    const tonnage = config.tonnage || 100
    const gyroType = config.gyroType || 'Standard'
    let weight = Math.ceil(tonnage / 100)
    if (gyroType.includes('Compact')) weight *= 0.5
    return weight
  }

  private calculateCockpitWeight(config: any): number {
    return 3 // Standard cockpit weight
  }
}