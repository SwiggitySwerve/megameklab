/**
 * Default Tech Level Validator
 * Implements ITechLevelValidator with standard BattleTech tech level rules
 */

import { 
  ITechLevelValidator,
  TechLevelValidation,
  ValidationViolation
} from '../interfaces/IValidationOrchestrator'
import { UnitConfiguration } from '../../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'

export class DefaultTechLevelValidator implements ITechLevelValidator {
  
  async validateTechLevel(config: UnitConfiguration, equipment: any[]): Promise<TechLevelValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Determine tech level
    const techLevel = this.determineTechLevel(config, equipment)
    const era = this.determineEra(techLevel)
    const mixedTech = this.checkMixedTech(config, equipment)
    const availabilityRating = this.calculateAvailabilityRating(config, equipment)

    // Validate tech level consistency
    if (mixedTech && config.techBase !== 'Inner Sphere' && config.techBase !== 'Clan') {
      violations.push({
        type: 'tech_level_mixed',
        severity: 'major',
        message: 'Mixed technology detected - consider reviewing tech base compatibility',
        component: 'tech_level'
      })
    }

    // Check availability rating
    if (availabilityRating > 4) {
      violations.push({
        type: 'tech_level_availability',
        severity: 'minor',
        message: 'High availability rating - unit may be difficult to field',
        component: 'tech_level'
      })
      recommendations.push('Consider using more common technology')
    }

    const isValid = violations.filter(v => v.severity === 'critical').length === 0

    return {
      isValid,
      violations,
      recommendations,
      techLevel,
      era,
      mixedTech,
      availabilityRating
    }
  }

  private determineTechLevel(config: UnitConfiguration, equipment: any[]): number {
    // Simplified tech level determination
    let maxTechLevel = 1 // Standard tech

    // Check configuration components
    if (this.isAdvancedTech(config.structureType)) maxTechLevel = Math.max(maxTechLevel, 2)
    if (this.isAdvancedTech(config.armorType)) maxTechLevel = Math.max(maxTechLevel, 2)
    if (this.isAdvancedTech(config.heatSinkType)) maxTechLevel = Math.max(maxTechLevel, 2)

    // Check equipment
    equipment.forEach(eq => {
      const equipmentTechLevel = eq.equipmentData?.techLevel || eq.techLevel || 1
      maxTechLevel = Math.max(maxTechLevel, equipmentTechLevel)
    })

    return maxTechLevel
  }

  private determineEra(techLevel: number): string {
    if (techLevel <= 1) return 'Succession Wars'
    if (techLevel <= 2) return 'Clan Invasion'
    if (techLevel <= 3) return 'FedCom Civil War'
    return 'Dark Age'
  }

  private checkMixedTech(config: UnitConfiguration, equipment: any[]): boolean {
    const techBases = new Set<string>()
    techBases.add(config.techBase)

    // Check equipment tech bases
    equipment.forEach(eq => {
      const equipmentTechBase = eq.equipmentData?.techBase || eq.techBase
      if (equipmentTechBase) {
        techBases.add(equipmentTechBase)
      }
    })

    return techBases.size > 1
  }

  private calculateAvailabilityRating(config: UnitConfiguration, equipment: any[]): number {
    // Simplified availability rating calculation
    let totalRating = 0
    let itemCount = 0

    // Check configuration components
    totalRating += this.getComponentAvailability(config.structureType)
    totalRating += this.getComponentAvailability(config.armorType)
    totalRating += this.getComponentAvailability(config.heatSinkType)
    itemCount += 3

    // Check equipment
    equipment.forEach(eq => {
      const availability = eq.equipmentData?.availability || eq.availability || 1
      totalRating += availability
      itemCount++
    })

    return itemCount > 0 ? Math.round(totalRating / itemCount) : 1
  }

  private isAdvancedTech(component: any): boolean {
    const componentType = typeof component === 'string' ? component : component.type
    return componentType.includes('Ferro') || 
           componentType.includes('Endo') || 
           componentType.includes('Double') ||
           componentType.includes('Clan')
  }

  private getComponentAvailability(component: any): number {
    const componentType = typeof component === 'string' ? component : component.type
    
    // Simplified availability ratings
    if (componentType.includes('Standard')) return 1
    if (componentType.includes('Ferro') || componentType.includes('Endo')) return 2
    if (componentType.includes('Double')) return 2
    if (componentType.includes('Clan')) return 3
    
    return 1
  }
}