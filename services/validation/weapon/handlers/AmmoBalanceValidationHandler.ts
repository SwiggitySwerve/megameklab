/**
 * Ammunition Balance Validation Handler
 * Validates ammunition balance and weapon-ammo compatibility using Chain of Responsibility pattern
 * Handles ammunition requirements, compatibility, and balance optimization
 */

import { BaseWeaponValidationHandler } from '../BaseWeaponValidationHandler'
import {
  WeaponValidationContext,
  ValidationError,
  AmmoBalanceStatus,
  VALIDATION_PRIORITIES,
  AMMO_WEAPONS,
  requiresAmmo
} from '../WeaponValidationTypes'

/**
 * Ammunition Balance Validation Handler
 * Validates ammunition balance and weapon-ammo compatibility
 */
export class AmmoBalanceValidationHandler extends BaseWeaponValidationHandler {
  constructor() {
    super('AmmoBalance', VALIDATION_PRIORITIES.AMMO_BALANCE)
  }

  /**
   * Applicable when ammunition balance validation is enabled
   */
  isApplicable(context: WeaponValidationContext): boolean {
    return context.validateAmmoBalance
  }

  /**
   * Validate ammunition balance for ballistic and missile weapons
   */
  protected async validateWeapons(context: WeaponValidationContext): Promise<{
    errors: ValidationError[]
    warnings: ValidationError[]
    data?: any
    recommendations?: string[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const recommendations: string[] = []

    const weapons = this.extractWeapons(context.equipment)
    const ammunition = this.extractAmmunition(context.equipment)

    // Analyze weapon-ammo compatibility
    const ammoAnalysis = this.analyzeAmmoBalance(weapons, ammunition)
    
    // Generate validation results based on analysis
    this.validateWeaponAmmoRequirements(weapons, ammunition, ammoAnalysis, errors, warnings, recommendations)
    this.validateAmmoQuantities(weapons, ammunition, ammoAnalysis, warnings, recommendations)
    this.validateOrphanedAmmo(weapons, ammunition, warnings, recommendations)

    const ammoBalanceData: AmmoBalanceStatus = {
      weaponsWithAmmo: ammoAnalysis.weaponsWithAmmo.size,
      weaponsNeedingAmmo: ammoAnalysis.weaponsNeedingAmmo.size,
      excessAmmo: ammoAnalysis.excessAmmo,
      missingAmmo: ammoAnalysis.missingAmmo,
      recommendations: recommendations.slice(), // Copy recommendations for data
      balanceScore: this.calculateBalanceScore(ammoAnalysis)
    }

    return {
      errors,
      warnings,
      data: {
        ammoBalance: ammoBalanceData,
        analysis: ammoAnalysis,
        compatibilityMatrix: this.buildCompatibilityMatrix(weapons, ammunition)
      },
      recommendations
    }
  }

  /**
   * Analyze ammunition balance between weapons and ammunition
   */
  private analyzeAmmoBalance(weapons: any[], ammunition: any[]): AmmoAnalysisResult {
    const weaponsWithAmmo = new Set<string>()
    const weaponsNeedingAmmo = new Set<string>()
    const excessAmmo: string[] = []
    const missingAmmo: string[] = []
    const ammoCompatibility = new Map<string, string[]>()
    const weaponAmmoMap = new Map<string, any[]>()

    // Find weapons that require ammunition
    const ammoWeapons = weapons.filter(weapon => this.requiresAmmunition(weapon))

    // Build weapon-ammo compatibility map
    ammoWeapons.forEach(weapon => {
      const weaponType = this.extractWeaponType(weapon.item_name)
      const compatibleAmmo = ammunition.filter(ammo => 
        this.isAmmoCompatible(ammo, weaponType)
      )
      
      weaponAmmoMap.set(weapon.item_name, compatibleAmmo)
      ammoCompatibility.set(weapon.item_name, compatibleAmmo.map(ammo => ammo.item_name))

      if (compatibleAmmo.length === 0) {
        weaponsNeedingAmmo.add(weapon.item_name)
        missingAmmo.push(this.simplifyWeaponType(weaponType))
      } else {
        weaponsWithAmmo.add(weapon.item_name)
      }
    })

    // Find orphaned ammunition
    ammunition.forEach(ammo => {
      const ammoType = this.extractAmmoType(ammo.item_name)
      
      if (ammoWeapons.length === 0) {
        // No ammo weapons at all
        excessAmmo.push(ammo.item_name)
      } else {
        // Check if this ammo has compatible weapons
        const hasCompatibleWeapons = ammoWeapons.some(weapon => 
          this.isAmmoCompatible(ammo, this.extractWeaponType(weapon.item_name))
        )
        
        if (!hasCompatibleWeapons) {
          excessAmmo.push(ammo.item_name)
        }
      }
    })

    return {
      weaponsWithAmmo,
      weaponsNeedingAmmo,
      excessAmmo,
      missingAmmo,
      ammoCompatibility,
      weaponAmmoMap,
      totalAmmoWeapons: ammoWeapons.length
    }
  }

  /**
   * Validate weapon ammunition requirements
   */
  private validateWeaponAmmoRequirements(
    weapons: any[],
    ammunition: any[],
    analysis: AmmoAnalysisResult,
    errors: ValidationError[],
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    // Check for weapons missing ammunition
    analysis.weaponsNeedingAmmo.forEach(weaponName => {
      const weaponType = this.extractWeaponType(weaponName)
      const simplifiedType = this.simplifyWeaponType(weaponType)
      
      warnings.push(this.createWarning(
        `missing-ammo-${simplifiedType.replace(/[\/\s]/g, '-')}`,
        `${weaponName}: No ammunition found - weapon will be ineffective`,
        'weapons_and_equipment',
        `Add ${simplifiedType} ammunition`
      ))

      recommendations.push(`Add ammunition for ${weaponName}`)
    })

    // Provide general recommendations for ammunition management
    if (analysis.weaponsNeedingAmmo.size > 0) {
      recommendations.push('Ensure all ballistic and missile weapons have adequate ammunition')
    }

    if (analysis.totalAmmoWeapons > 0 && analysis.weaponsWithAmmo.size === 0) {
      errors.push(this.createError(
        'no-ammo-for-weapons',
        'Unit has ammo-dependent weapons but no ammunition - weapons will be non-functional',
        'weapons_and_equipment',
        'critical',
        'Add appropriate ammunition for installed weapons'
      ))
    }
  }

  /**
   * Validate ammunition quantities for sustained combat
   */
  private validateAmmoQuantities(
    weapons: any[],
    ammunition: any[],
    analysis: AmmoAnalysisResult,
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    analysis.weaponAmmoMap.forEach((ammoList, weaponName) => {
      if (ammoList.length === 0) return

      const weapon = weapons.find(w => w.item_name === weaponName)
      if (!weapon) return

      const weaponType = this.extractWeaponType(weapon.item_name)
      const totalAmmoTons = ammoList.reduce((sum, ammo) => sum + (ammo.tonnage || 1), 0)
      const recommendedTons = this.calculateRecommendedAmmo(weapon)

      // Check for insufficient ammunition
      if (totalAmmoTons < recommendedTons) {
        warnings.push(this.createWarning(
          `insufficient-ammo-${weaponType.replace(/[\/\s]/g, '-')}`,
          `${weaponName}: Low ammunition (${totalAmmoTons}t) - consider ${recommendedTons}t for sustained combat`,
          'weapons_and_equipment',
          `Increase ammunition to ${recommendedTons}t`
        ))

        recommendations.push(`Increase ammunition for ${weaponName} to ${recommendedTons}t for sustained combat`)
      }

      // Check for excessive ammunition
      if (totalAmmoTons > recommendedTons * 3) {
        warnings.push(this.createWarning(
          `excess-ammo-${weaponType.replace(/[\/\s]/g, '-')}`,
          `${weaponName}: Excessive ammunition (${totalAmmoTons}t) - consider reducing for weight savings`,
          'weapons_and_equipment',
          `Reduce ammunition to ${recommendedTons * 2}t`
        ))

        recommendations.push(`Consider reducing ammunition for ${weaponName} to save weight`)
      }

      // Special recommendations based on weapon type
      this.addWeaponSpecificAmmoRecommendations(weapon, totalAmmoTons, recommendations)
    })
  }

  /**
   * Validate orphaned ammunition
   */
  private validateOrphanedAmmo(
    weapons: any[],
    ammunition: any[],
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    ammunition.forEach(ammo => {
      const ammoType = this.extractAmmoType(ammo.item_name)
      
      // Check if this ammo has any compatible weapons
      const compatibleWeapons = weapons.filter(weapon => 
        this.requiresAmmunition(weapon) && 
        this.isAmmoCompatible(ammo, this.extractWeaponType(weapon.item_name))
      )

      if (compatibleWeapons.length === 0) {
        warnings.push(this.createWarning(
          `orphaned-ammo-${ammoType.replace(/[\/\s]/g, '-')}`,
          `${ammo.item_name}: No compatible weapons found - consider removing`,
          'weapons_and_equipment',
          'Remove unused ammunition or add compatible weapons'
        ))

        recommendations.push(`Remove ${ammo.item_name} or add compatible weapons`)
      }
    })
  }

  /**
   * Add weapon-specific ammunition recommendations
   */
  private addWeaponSpecificAmmoRecommendations(
    weapon: any,
    ammoTons: number,
    recommendations: string[]
  ): void {
    const weaponName = weapon.item_name

    // AC-specific recommendations
    if (weaponName.includes('AC/')) {
      if (ammoTons >= 2) {
        recommendations.push(`${weaponName}: Consider CASE protection for ammunition explosion safety`)
      }
    }

    // LRM-specific recommendations
    if (weaponName.includes('LRM')) {
      recommendations.push(`${weaponName}: Consider Artemis IV for improved accuracy`)
      if (ammoTons >= 2) {
        recommendations.push(`${weaponName}: Consider CASE protection for missile ammunition`)
      }
    }

    // Gauss-specific recommendations
    if (weaponName.includes('Gauss')) {
      recommendations.push(`${weaponName}: Gauss ammunition is explosive - CASE protection highly recommended`)
      if (ammoTons < 2) {
        recommendations.push(`${weaponName}: Gauss rifles typically need 2+ tons of ammunition`)
      }
    }

    // Ultra AC recommendations
    if (weaponName.includes('Ultra AC')) {
      recommendations.push(`${weaponName}: Ultra ACs consume ammunition faster - plan accordingly`)
    }
  }

  /**
   * Check if weapon requires ammunition
   */
  private requiresAmmunition(weapon: any): boolean {
    const weaponName = weapon.item_name || ''
    
    return AMMO_WEAPONS.some(ammoWeapon => 
      weaponName.includes(ammoWeapon) ||
      weaponName.includes(ammoWeapon.split(' ')[0])
    ) || weaponName.includes('AC/') || 
        weaponName.includes('LRM') || 
        weaponName.includes('SRM') || 
        weaponName.includes('Gauss') || 
        weaponName.includes('Machine Gun')
  }

  /**
   * Calculate recommended ammunition tonnage for weapon
   */
  private calculateRecommendedAmmo(weapon: any): number {
    const weaponName = weapon.item_name || ''

    // Base recommendations by weapon type
    if (weaponName.includes('AC/20')) return 2
    if (weaponName.includes('AC/10')) return 2
    if (weaponName.includes('AC/5')) return 1
    if (weaponName.includes('AC/2')) return 1
    if (weaponName.includes('LRM-20')) return 2
    if (weaponName.includes('LRM-15')) return 2
    if (weaponName.includes('LRM-10')) return 1
    if (weaponName.includes('LRM-5')) return 1
    if (weaponName.includes('SRM')) return 1
    if (weaponName.includes('Gauss')) return 2
    if (weaponName.includes('Machine Gun')) return 0.5

    // Default recommendation
    return 1
  }

  /**
   * Simplify weapon type for error messages
   */
  private simplifyWeaponType(weaponType: string): string {
    if (weaponType.includes('AC/')) return 'AC'
    if (weaponType.includes('LRM')) return 'LRM'
    if (weaponType.includes('SRM')) return 'SRM'
    if (weaponType.includes('Gauss')) return 'Gauss'
    if (weaponType.includes('Machine Gun')) return 'Machine Gun'
    return weaponType
  }

  /**
   * Calculate ammunition balance score (0-100)
   */
  private calculateBalanceScore(analysis: AmmoAnalysisResult): number {
    if (analysis.totalAmmoWeapons === 0) return 100 // No ammo weapons = perfect balance

    const weaponsWithAmmoRatio = analysis.weaponsWithAmmo.size / analysis.totalAmmoWeapons
    const penaltyForExcess = Math.min(analysis.excessAmmo.length * 10, 30)
    const penaltyForMissing = analysis.weaponsNeedingAmmo.size * 25

    const baseScore = weaponsWithAmmoRatio * 100
    const finalScore = Math.max(0, baseScore - penaltyForExcess - penaltyForMissing)

    return Math.round(finalScore)
  }

  /**
   * Build compatibility matrix for analysis
   */
  private buildCompatibilityMatrix(weapons: any[], ammunition: any[]): CompatibilityMatrix {
    const matrix: CompatibilityMatrix = {
      weapons: [],
      ammunition: [],
      compatibility: []
    }

    const ammoWeapons = weapons.filter(weapon => this.requiresAmmunition(weapon))

    matrix.weapons = ammoWeapons.map(weapon => ({
      name: weapon.item_name,
      type: this.extractWeaponType(weapon.item_name),
      requiresAmmo: true
    }))

    matrix.ammunition = ammunition.map(ammo => ({
      name: ammo.item_name,
      type: this.extractAmmoType(ammo.item_name),
      tonnage: ammo.tonnage || 1
    }))

    // Build compatibility relationships
    matrix.compatibility = []
    ammoWeapons.forEach(weapon => {
      const weaponType = this.extractWeaponType(weapon.item_name)
      ammunition.forEach(ammo => {
        if (this.isAmmoCompatible(ammo, weaponType)) {
          matrix.compatibility.push({
            weaponName: weapon.item_name,
            ammoName: ammo.item_name,
            compatible: true
          })
        }
      })
    })

    return matrix
  }
}

// Helper interfaces for internal analysis
interface AmmoAnalysisResult {
  weaponsWithAmmo: Set<string>
  weaponsNeedingAmmo: Set<string>
  excessAmmo: string[]
  missingAmmo: string[]
  ammoCompatibility: Map<string, string[]>
  weaponAmmoMap: Map<string, any[]>
  totalAmmoWeapons: number
}

interface CompatibilityMatrix {
  weapons: Array<{
    name: string
    type: string
    requiresAmmo: boolean
  }>
  ammunition: Array<{
    name: string
    type: string
    tonnage: number
  }>
  compatibility: Array<{
    weaponName: string
    ammoName: string
    compatible: boolean
  }>
}