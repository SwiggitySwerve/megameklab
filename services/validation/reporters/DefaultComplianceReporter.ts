/**
 * Default Compliance Reporter
 * Implements IComplianceReporter with standard BattleTech compliance reporting
 */

import { 
  IComplianceReporter,
  ComplianceReport,
  ComplianceSummary
} from '../interfaces/IValidationOrchestrator'
import { UnitConfiguration } from '../../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'

export class DefaultComplianceReporter implements IComplianceReporter {
  
  async generateComplianceReport(config: UnitConfiguration, equipment: any[]): Promise<ComplianceReport> {
    // Calculate compliance scores for different aspects
    const configurationCompliance = this.calculateConfigurationCompliance(config)
    const equipmentCompliance = this.calculateEquipmentCompliance(equipment, config)
    const techLevelCompliance = this.calculateTechLevelCompliance(config, equipment)
    
    // Calculate overall compliance
    const overallCompliance = Math.round(
      (configurationCompliance + equipmentCompliance + techLevelCompliance) / 3
    )

    // Generate compliance summary
    const summary = this.generateComplianceSummary(config, equipment)

    return {
      overallCompliance,
      configurationCompliance,
      equipmentCompliance,
      techLevelCompliance,
      summary
    }
  }

  private calculateConfigurationCompliance(config: UnitConfiguration): number {
    let score = 100
    
    // Check basic configuration requirements
    if (config.tonnage < 20 || config.tonnage > 100) score -= 20
    if (config.walkMP < 1) score -= 30
    if (config.engineRating < 10) score -= 30
    if (config.totalHeatSinks < 10) score -= 10
    
    // Check armor allocation
    const totalArmor = Object.values(config.armorAllocation).reduce((sum, loc) => 
      sum + loc.front + loc.rear, 0
    )
    if (totalArmor === 0) score -= 40
    if (totalArmor < config.tonnage) score -= 10 // Minimal armor penalty
    
    return Math.max(0, Math.min(100, score))
  }

  private calculateEquipmentCompliance(equipment: any[], config: UnitConfiguration): number {
    let score = 100
    
    // Check for basic equipment requirements
    const weapons = equipment.filter(eq => 
      eq.equipmentData?.type === 'weapon' || eq.type === 'weapon'
    )
    
    if (weapons.length === 0) score -= 20 // No weapons penalty
    
    // Check critical slot usage
    const slotsUsed = equipment.reduce((sum, eq) => 
      sum + (eq.equipmentData?.criticalSlots || eq.criticalSlots || 1), 0
    )
    const maxSlots = this.calculateMaxSlots(config)
    
    if (slotsUsed > maxSlots) score -= 50 // Overslot penalty
    
    // Check weight balance
    const equipmentWeight = equipment.reduce((sum, eq) => 
      sum + (eq.equipmentData?.weight || eq.weight || 0), 0
    )
    
    if (equipmentWeight > config.tonnage * 0.8) score -= 10 // Heavy equipment penalty
    
    return Math.max(0, Math.min(100, score))
  }

  private calculateTechLevelCompliance(config: UnitConfiguration, equipment: any[]): number {
    let score = 100
    
    // Check tech base consistency
    const configTechBase = config.techBase
    let inconsistentTech = false
    
    equipment.forEach(eq => {
      const equipmentTechBase = eq.equipmentData?.techBase || eq.techBase
      if (equipmentTechBase && equipmentTechBase !== configTechBase) {
        inconsistentTech = true
      }
    })
    
    if (inconsistentTech) score -= 20
    
    // Check availability ratings
    const avgAvailability = this.calculateAverageAvailability(config, equipment)
    if (avgAvailability > 3) score -= 10 // High availability penalty
    
    return Math.max(0, Math.min(100, score))
  }

  private generateComplianceSummary(config: UnitConfiguration, equipment: any[]): ComplianceSummary {
    // Count violations by severity
    const violations = this.identifyViolations(config, equipment)
    
    return {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      majorViolations: violations.filter(v => v.severity === 'major').length,
      minorViolations: violations.filter(v => v.severity === 'minor').length,
      totalRecommendations: this.generateRecommendations(config, equipment).length
    }
  }

  private identifyViolations(config: UnitConfiguration, equipment: any[]): Array<{severity: string}> {
    const violations: Array<{severity: string}> = []
    
    // Configuration violations
    if (config.walkMP < 1) violations.push({severity: 'critical'})
    if (config.totalHeatSinks < 10) violations.push({severity: 'major'})
    
    // Equipment violations
    const slotsUsed = equipment.reduce((sum, eq) => 
      sum + (eq.equipmentData?.criticalSlots || eq.criticalSlots || 1), 0
    )
    const maxSlots = this.calculateMaxSlots(config)
    
    if (slotsUsed > maxSlots) violations.push({severity: 'critical'})
    
    // Armor violations
    const totalArmor = Object.values(config.armorAllocation).reduce((sum, loc) => 
      sum + loc.front + loc.rear, 0
    )
    if (totalArmor === 0) violations.push({severity: 'critical'})
    
    return violations
  }

  private generateRecommendations(config: UnitConfiguration, equipment: any[]): string[] {
    const recommendations: string[] = []
    
    // Configuration recommendations
    if (config.walkMP < 3) recommendations.push('Consider increasing mobility')
    if (config.jumpMP === 0) recommendations.push('Consider adding jump jets for tactical flexibility')
    
    // Equipment recommendations
    const weapons = equipment.filter(eq => 
      eq.equipmentData?.type === 'weapon' || eq.type === 'weapon'
    )
    
    if (weapons.length < 2) recommendations.push('Consider adding more weapons for combat effectiveness')
    
    // Armor recommendations
    const totalArmor = Object.values(config.armorAllocation).reduce((sum, loc) => 
      sum + loc.front + loc.rear, 0
    )
    const maxArmor = config.tonnage * 2
    
    if (totalArmor < maxArmor * 0.7) recommendations.push('Consider increasing armor protection')
    
    return recommendations
  }

  private calculateMaxSlots(config: UnitConfiguration): number {
    // Basic slot calculation based on tonnage
    if (config.tonnage <= 35) return 40      // Light
    if (config.tonnage <= 55) return 50      // Medium
    if (config.tonnage <= 75) return 60      // Heavy
    return 70                                // Assault
  }

  private calculateAverageAvailability(config: UnitConfiguration, equipment: any[]): number {
    let totalAvailability = 0
    let itemCount = 0
    
    // Configuration components
    totalAvailability += this.getComponentAvailability(config.structureType)
    totalAvailability += this.getComponentAvailability(config.armorType)
    totalAvailability += this.getComponentAvailability(config.heatSinkType)
    itemCount += 3
    
    // Equipment
    equipment.forEach(eq => {
      const availability = eq.equipmentData?.availability || eq.availability || 1
      totalAvailability += availability
      itemCount++
    })
    
    return itemCount > 0 ? totalAvailability / itemCount : 1
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