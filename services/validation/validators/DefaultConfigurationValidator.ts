/**
 * Default Configuration Validator
 * Implements IConfigurationValidator with standard BattleTech rules
 * Follows Single Responsibility Principle - only validates configuration aspects
 */

import { 
  IConfigurationValidator,
  ConfigurationValidation,
  WeightValidation,
  HeatValidation,
  MovementValidation,
  ArmorValidation,
  StructureValidation,
  ValidationViolation
} from '../interfaces/IValidationOrchestrator'
import { UnitConfiguration } from '../../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'

export class DefaultConfigurationValidator implements IConfigurationValidator {
  
  async validateConfiguration(config: UnitConfiguration): Promise<ConfigurationValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Validate each configuration aspect
    const weight = await this.validateWeight(config)
    const heat = await this.validateHeat(config)
    const movement = await this.validateMovement(config)
    const armor = await this.validateArmor(config)
    const structure = await this.validateStructure(config)

    // Aggregate violations and recommendations
    violations.push(...weight.violations, ...heat.violations, ...movement.violations, ...armor.violations, ...structure.violations)
    recommendations.push(...weight.recommendations, ...heat.recommendations, ...movement.recommendations, ...armor.recommendations, ...structure.recommendations)

    const isValid = violations.filter(v => v.severity === 'critical').length === 0

    return {
      isValid,
      violations,
      recommendations,
      weight,
      heat,
      movement,
      armor,
      structure
    }
  }

  private async validateWeight(config: UnitConfiguration): Promise<WeightValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Calculate current weight (simplified - in real implementation would use proper weight calculation)
    const currentWeight = this.calculateCurrentWeight(config)
    const maxWeight = config.tonnage
    const weightEfficiency = maxWeight > 0 ? (currentWeight / maxWeight) * 100 : 0

    // Check for overweight
    if (currentWeight > maxWeight) {
      violations.push({
        type: 'weight_overweight',
        severity: 'critical',
        message: `Unit is overweight by ${(currentWeight - maxWeight).toFixed(1)} tons`,
        component: 'weight'
      })
    }

    // Check for underweight (less than 90% of max)
    if (currentWeight < maxWeight * 0.9) {
      violations.push({
        type: 'weight_underweight',
        severity: 'minor',
        message: `Unit is underweight - consider adding more equipment`,
        component: 'weight'
      })
      recommendations.push('Add more equipment or armor to utilize available tonnage')
    }

    // Check for optimal weight usage (95-100%)
    if (currentWeight >= maxWeight * 0.95 && currentWeight <= maxWeight) {
      recommendations.push('Excellent weight utilization')
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      currentWeight,
      maxWeight,
      weightEfficiency
    }
  }

  private async validateHeat(config: UnitConfiguration): Promise<HeatValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Calculate heat generation and dissipation
    const heatGeneration = this.calculateHeatGeneration(config)
    const heatDissipation = this.calculateHeatDissipation(config)
    const heatEfficiency = heatDissipation > 0 ? (heatGeneration / heatDissipation) * 100 : 0

    // Check heat balance
    if (heatGeneration > heatDissipation) {
      violations.push({
        type: 'heat_inefficient',
        severity: 'major',
        message: `Heat generation (${heatGeneration}) exceeds dissipation (${heatDissipation})`,
        component: 'heat'
      })
      recommendations.push('Add more heat sinks or reduce heat-generating equipment')
    }

    // Check for heat efficiency
    if (heatEfficiency > 80) {
      violations.push({
        type: 'heat_high_efficiency',
        severity: 'minor',
        message: 'High heat efficiency - consider heat management',
        component: 'heat'
      })
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      heatGeneration,
      heatDissipation,
      heatEfficiency
    }
  }

  private async validateMovement(config: UnitConfiguration): Promise<MovementValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    const walkSpeed = config.walkMP
    const runSpeed = config.runMP
    const jumpCapacity = config.jumpMP

    // Validate walk speed
    if (walkSpeed < 1) {
      violations.push({
        type: 'movement_no_walk',
        severity: 'critical',
        message: 'Unit must have at least 1 walk MP',
        component: 'movement'
      })
    }

    // Validate run speed calculation
    const expectedRunSpeed = Math.floor(walkSpeed * 1.5)
    if (runSpeed !== expectedRunSpeed) {
      violations.push({
        type: 'movement_invalid_run',
        severity: 'major',
        message: `Run speed should be ${expectedRunSpeed} (walk × 1.5, rounded down)`,
        component: 'movement'
      })
    }

    // Validate jump capacity
    if (jumpCapacity > walkSpeed) {
      violations.push({
        type: 'movement_excessive_jump',
        severity: 'major',
        message: 'Jump MP cannot exceed walk MP',
        component: 'movement'
      })
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      walkSpeed,
      runSpeed,
      jumpCapacity
    }
  }

  private async validateArmor(config: UnitConfiguration): Promise<ArmorValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Calculate armor totals
    const totalArmor = this.calculateTotalArmor(config)
    const maxArmor = this.calculateMaxArmor(config)
    const armorEfficiency = maxArmor > 0 ? (totalArmor / maxArmor) * 100 : 0

    // Check for no armor
    if (totalArmor === 0) {
      violations.push({
        type: 'armor_none',
        severity: 'critical',
        message: 'Unit has no armor protection',
        component: 'armor'
      })
    }

    // Check for excessive armor
    if (totalArmor > maxArmor) {
      violations.push({
        type: 'armor_excessive',
        severity: 'critical',
        message: `Armor exceeds maximum (${totalArmor} > ${maxArmor})`,
        component: 'armor'
      })
    }

    // Check for low armor
    if (totalArmor < maxArmor * 0.5) {
      violations.push({
        type: 'armor_low',
        severity: 'minor',
        message: 'Consider adding more armor for better protection',
        component: 'armor'
      })
      recommendations.push('Increase armor allocation for better survivability')
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      totalArmor,
      maxArmor,
      armorEfficiency
    }
  }

  private async validateStructure(config: UnitConfiguration): Promise<StructureValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Get structure type
    const structureType = typeof config.structureType === 'string' 
      ? config.structureType 
      : config.structureType.type

    // Calculate structure integrity
    const structureIntegrity = this.calculateStructureIntegrity(config)
    const criticalComponents = this.identifyCriticalComponents(config)

    // Validate structure type compatibility
    if (config.techBase === 'Inner Sphere' && structureType.includes('Clan')) {
      violations.push({
        type: 'structure_tech_mismatch',
        severity: 'critical',
        message: 'Clan structure type not compatible with Inner Sphere tech base',
        component: 'structure'
      })
    }

    // Check for critical components
    if (criticalComponents.length > 0) {
      recommendations.push(`Critical components: ${criticalComponents.join(', ')}`)
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      structureIntegrity,
      criticalComponents
    }
  }

  // Helper methods for calculations
  private calculateCurrentWeight(config: UnitConfiguration): number {
    // Simplified weight calculation - in real implementation would be more complex
    let weight = 0
    
    // Engine weight (simplified)
    weight += Math.ceil(config.engineRating / 25)
    
    // Gyro weight (simplified)
    weight += Math.ceil(config.engineRating / 100)
    
    // Heat sinks weight
    weight += config.externalHeatSinks || 0
    
    // Armor weight
    weight += config.armorTonnage || 0
    
    // Jump jets weight
    weight += config.jumpMP * 0.5
    
    return weight
  }

  private calculateHeatGeneration(config: UnitConfiguration): number {
    // Simplified heat generation calculation
    return Math.floor(config.engineRating / 25)
  }

  private calculateHeatDissipation(config: UnitConfiguration): number {
    // Base dissipation (10) + heat sinks
    const heatSinkType = typeof config.heatSinkType === 'string' 
      ? config.heatSinkType 
      : config.heatSinkType.type
    
    const heatSinkEfficiency = heatSinkType.includes('Double') ? 2 : 1
    return 10 + (config.totalHeatSinks * heatSinkEfficiency)
  }

  private calculateTotalArmor(config: UnitConfiguration): number {
    const armor = config.armorAllocation
    return Object.values(armor).reduce((total, location) => 
      total + location.front + location.rear, 0
    )
  }

  private calculateMaxArmor(config: UnitConfiguration): number {
    // Simplified max armor calculation - 2 × internal structure points
    return config.tonnage * 2
  }

  private calculateStructureIntegrity(config: UnitConfiguration): number {
    // Simplified structure integrity calculation
    return 100 // Assume 100% integrity for now
  }

  private identifyCriticalComponents(config: UnitConfiguration): string[] {
    const critical: string[] = []
    
    // Engine is always critical
    critical.push('Engine')
    
    // Gyro is always critical
    critical.push('Gyro')
    
    // Add other critical components based on configuration
    if (config.jumpMP > 0) {
      critical.push('Jump Jets')
    }
    
    return critical
  }
}