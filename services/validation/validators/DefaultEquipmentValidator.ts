/**
 * Default Equipment Validator
 * Implements IEquipmentValidator with standard BattleTech equipment rules
 * Follows Single Responsibility Principle - only validates equipment aspects
 */

import { 
  IEquipmentValidator,
  EquipmentValidation,
  WeaponValidation,
  AmmoValidation,
  CriticalSlotValidation,
  SpecialEquipmentValidation,
  ValidationViolation,
  AmmoBalanceCheck,
  CaseProtectionCheck,
  SpecialEquipmentCheck
} from '../interfaces/IValidationOrchestrator'
import { UnitConfiguration } from '../../../battletech-editor-app/utils/criticalSlots/UnitCriticalManager'

export class DefaultEquipmentValidator implements IEquipmentValidator {
  
  async validateEquipment(equipment: any[], config: UnitConfiguration): Promise<EquipmentValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Validate each equipment aspect
    const weapons = await this.validateWeapons(equipment, config)
    const ammunition = await this.validateAmmunition(equipment, config)
    const criticalSlots = await this.validateCriticalSlots(equipment, config)
    const specialEquipment = await this.validateSpecialEquipment(equipment, config)

    // Aggregate violations and recommendations
    violations.push(...weapons.violations, ...ammunition.violations, ...criticalSlots.violations, ...specialEquipment.violations)
    recommendations.push(...weapons.recommendations, ...ammunition.recommendations, ...criticalSlots.recommendations, ...specialEquipment.recommendations)

    const isValid = violations.filter(v => v.severity === 'critical').length === 0

    return {
      isValid,
      violations,
      recommendations,
      weapons,
      ammunition,
      criticalSlots,
      specialEquipment
    }
  }

  private async validateWeapons(equipment: any[], config: UnitConfiguration): Promise<WeaponValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Filter weapons from equipment
    const weapons = equipment.filter(eq => 
      eq.equipmentData?.type === 'weapon' || 
      eq.type === 'weapon' ||
      eq.equipmentData?.category === 'weapon'
    )

    const weaponCount = weapons.length
    const totalWeaponWeight = weapons.reduce((sum, weapon) => 
      sum + (weapon.equipmentData?.weight || weapon.weight || 0), 0
    )
    const heatGeneration = weapons.reduce((sum, weapon) => 
      sum + (weapon.equipmentData?.heat || weapon.heat || 0), 0
    )

    // Check for no weapons
    if (weaponCount === 0) {
      violations.push({
        type: 'weapons_none',
        severity: 'minor',
        message: 'Unit has no weapons - consider adding offensive capability',
        component: 'weapons'
      })
      recommendations.push('Add weapons for combat effectiveness')
    }

    // Check for excessive heat generation
    const heatDissipation = this.calculateHeatDissipation(config)
    if (heatGeneration > heatDissipation * 1.2) {
      violations.push({
        type: 'weapons_excessive_heat',
        severity: 'major',
        message: `Weapons generate too much heat (${heatGeneration} vs ${heatDissipation} dissipation)`,
        component: 'weapons'
      })
      recommendations.push('Reduce heat-generating weapons or add more heat sinks')
    }

    // Check for weapon balance
    if (weaponCount > 10) {
      violations.push({
        type: 'weapons_excessive_count',
        severity: 'minor',
        message: 'Large number of weapons may be inefficient',
        component: 'weapons'
      })
      recommendations.push('Consider consolidating to fewer, more effective weapons')
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      weaponCount,
      totalWeaponWeight,
      heatGeneration
    }
  }

  private async validateAmmunition(equipment: any[], config: UnitConfiguration): Promise<AmmoValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Filter ammunition from equipment
    const ammunition = equipment.filter(eq => 
      eq.equipmentData?.type === 'ammunition' || 
      eq.type === 'ammo' ||
      eq.equipmentData?.category === 'ammunition'
    )

    const weapons = equipment.filter(eq => 
      eq.equipmentData?.type === 'weapon' || 
      eq.type === 'weapon'
    )

    const totalAmmoWeight = ammunition.reduce((sum, ammo) => 
      sum + (ammo.equipmentData?.weight || ammo.weight || 0), 0
    )

    // Check ammo balance
    const ammoBalance = this.checkAmmoBalance(weapons, ammunition)
    
    // Check CASE protection
    const caseProtection = this.checkCaseProtection(ammunition, config)

    // Validate ammo for weapons
    const weaponsNeedingAmmo = weapons.filter(weapon => 
      this.weaponNeedsAmmo(weapon)
    )

    if (weaponsNeedingAmmo.length > 0 && ammunition.length === 0) {
      violations.push({
        type: 'ammo_missing',
        severity: 'major',
        message: 'Weapons require ammunition but none is loaded',
        component: 'ammunition'
      })
      recommendations.push('Add ammunition for ballistic and missile weapons')
    }

    // Check for excessive ammo
    if (totalAmmoWeight > config.tonnage * 0.2) {
      violations.push({
        type: 'ammo_excessive',
        severity: 'minor',
        message: 'Excessive ammunition weight - consider reducing',
        component: 'ammunition'
      })
      recommendations.push('Reduce ammunition to free up tonnage for other equipment')
    }

    // Check CASE protection violations
    if (!caseProtection.isCompliant && caseProtection.unprotectedLocations.length > 0) {
      violations.push({
        type: 'ammo_case_protection',
        severity: 'major',
        message: `Ammunition in ${caseProtection.unprotectedLocations.join(', ')} needs CASE protection`,
        component: 'ammunition'
      })
      recommendations.push('Add CASE protection for ammunition storage locations')
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      totalAmmoWeight,
      ammoBalance,
      caseProtection
    }
  }

  private async validateCriticalSlots(equipment: any[], config: UnitConfiguration): Promise<CriticalSlotValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Calculate slot usage
    const slotsUsed = equipment.reduce((sum, eq) => 
      sum + (eq.equipmentData?.criticalSlots || eq.criticalSlots || 1), 0
    )
    const slotsAvailable = this.calculateAvailableSlots(config)
    const slotEfficiency = slotsAvailable > 0 ? (slotsUsed / slotsAvailable) * 100 : 0

    // Check for slot overflow
    if (slotsUsed > slotsAvailable) {
      violations.push({
        type: 'slots_overflow',
        severity: 'critical',
        message: `Equipment requires ${slotsUsed} slots but only ${slotsAvailable} available`,
        component: 'critical_slots'
      })
    }

    // Check for inefficient slot usage
    if (slotEfficiency < 50) {
      violations.push({
        type: 'slots_underutilized',
        severity: 'minor',
        message: 'Critical slots are underutilized',
        component: 'critical_slots'
      })
      recommendations.push('Consider adding more equipment to utilize available slots')
    }

    // Check for optimal slot usage
    if (slotEfficiency >= 80 && slotEfficiency <= 95) {
      recommendations.push('Excellent critical slot utilization')
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      slotsUsed,
      slotsAvailable,
      slotEfficiency
    }
  }

  private async validateSpecialEquipment(equipment: any[], config: UnitConfiguration): Promise<SpecialEquipmentValidation> {
    const violations: ValidationViolation[] = []
    const recommendations: string[] = []

    // Filter special equipment
    const specialEquipment = equipment.filter(eq => 
      eq.equipmentData?.category === 'special' || 
      eq.type === 'special' ||
      eq.equipmentData?.type === 'special'
    )

    const specialEquipmentChecks: SpecialEquipmentCheck[] = []

    // Validate each special equipment
    for (const equipment of specialEquipment) {
      const check = this.validateSpecialEquipmentItem(equipment, config)
      specialEquipmentChecks.push(check)

      if (!check.isCompatible) {
        violations.push({
          type: 'special_equipment_incompatible',
          severity: 'major',
          message: `${check.equipment} is incompatible: ${check.conflicts.join(', ')}`,
          component: 'special_equipment'
        })
      }
    }

    // Check for conflicting special equipment
    const conflicts = this.checkSpecialEquipmentConflicts(specialEquipment)
    if (conflicts.length > 0) {
      violations.push({
        type: 'special_equipment_conflicts',
        severity: 'major',
        message: `Special equipment conflicts: ${conflicts.join(', ')}`,
        component: 'special_equipment'
      })
    }

    return {
      isValid: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
      recommendations,
      specialEquipment: specialEquipmentChecks
    }
  }

  // Helper methods
  private calculateHeatDissipation(config: UnitConfiguration): number {
    const heatSinkType = typeof config.heatSinkType === 'string' 
      ? config.heatSinkType 
      : config.heatSinkType.type
    
    const heatSinkEfficiency = heatSinkType.includes('Double') ? 2 : 1
    return 10 + (config.totalHeatSinks * heatSinkEfficiency)
  }

  private calculateAvailableSlots(config: UnitConfiguration): number {
    // Basic slot calculation based on tonnage
    if (config.tonnage <= 35) return 40      // Light
    if (config.tonnage <= 55) return 50      // Medium
    if (config.tonnage <= 75) return 60      // Heavy
    return 70                                // Assault
  }

  private weaponNeedsAmmo(weapon: any): boolean {
    const weaponType = weapon.equipmentData?.weaponType || weapon.weaponType || ''
    return weaponType.includes('AC') || weaponType.includes('LRM') || weaponType.includes('SRM') || weaponType.includes('Gauss')
  }

  private checkAmmoBalance(weapons: any[], ammunition: any[]): AmmoBalanceCheck[] {
    const checks: AmmoBalanceCheck[] = []
    
    // Group weapons by type
    const weaponTypes = new Map<string, number>()
    weapons.forEach(weapon => {
      const type = weapon.equipmentData?.weaponType || weapon.weaponType || 'Unknown'
      weaponTypes.set(type, (weaponTypes.get(type) || 0) + 1)
    })

    // Check ammo for each weapon type
    weaponTypes.forEach((count, weaponType) => {
      const ammoTons = ammunition
        .filter(ammo => (ammo.equipmentData?.ammoType || ammo.ammoType || '').includes(weaponType))
        .reduce((sum, ammo) => sum + (ammo.equipmentData?.weight || ammo.weight || 0), 0)
      
      const recommendedTons = count * 1 // 1 ton per weapon as baseline
      
      checks.push({
        weaponType,
        ammoTons,
        recommendedTons,
        isBalanced: ammoTons >= recommendedTons * 0.5 && ammoTons <= recommendedTons * 2
      })
    })

    return checks
  }

  private checkCaseProtection(ammunition: any[], config: UnitConfiguration): CaseProtectionCheck {
    const requiredLocations: string[] = []
    const protectedLocations: string[] = []
    const unprotectedLocations: string[] = []

    // Simplified CASE protection check
    ammunition.forEach(ammo => {
      const location = ammo.location || 'Unknown'
      if (!requiredLocations.includes(location)) {
        requiredLocations.push(location)
      }
    })

    // For now, assume no CASE protection (would need to check for CASE equipment)
    unprotectedLocations.push(...requiredLocations)

    return {
      requiredLocations,
      protectedLocations,
      unprotectedLocations,
      isCompliant: unprotectedLocations.length === 0
    }
  }

  private validateSpecialEquipmentItem(equipment: any, config: UnitConfiguration): SpecialEquipmentCheck {
    const equipmentName = equipment.equipmentData?.name || equipment.name || 'Unknown'
    const conflicts: string[] = []
    
    // Check tech base compatibility
    const equipmentTechBase = equipment.equipmentData?.techBase || equipment.techBase
    if (equipmentTechBase && equipmentTechBase !== config.techBase) {
      conflicts.push(`Tech base mismatch: ${equipmentTechBase} vs ${config.techBase}`)
    }

    // Check tonnage requirements
    const equipmentTonnage = equipment.equipmentData?.tonnage || equipment.tonnage || 0
    if (equipmentTonnage > config.tonnage * 0.1) {
      conflicts.push('Excessive tonnage requirement')
    }

    return {
      equipment: equipmentName,
      isCompatible: conflicts.length === 0,
      conflicts
    }
  }

  private checkSpecialEquipmentConflicts(specialEquipment: any[]): string[] {
    const conflicts: string[] = []
    
    // Check for mutually exclusive equipment
    const equipmentNames = specialEquipment.map(eq => 
      eq.equipmentData?.name || eq.name || 'Unknown'
    )

    // Example conflicts (would be expanded with actual rules)
    if (equipmentNames.includes('MASC') && equipmentNames.includes('Supercharger')) {
      conflicts.push('MASC and Supercharger are mutually exclusive')
    }

    return conflicts
  }
}