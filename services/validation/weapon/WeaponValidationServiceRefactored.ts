/**
 * Weapon Validation Service - Refactored
 * Weapon and equipment-specific validation logic using Chain of Responsibility pattern
 * Maintains backward compatibility with original interface while using modern architecture
 */

import { WeaponValidationChain } from './WeaponValidationChain'
import {
  WeaponValidationContext,
  WeaponValidationResult,
  AmmoBalanceStatus,
  TechCompatibilityStatus,
  WeaponLoadoutAnalysis,
  WeaponOptimization,
  OptimizationSuggestion
} from './WeaponValidationTypes'

// Backward compatibility interfaces (from original service)
export interface WeaponValidationContextLegacy {
  strictMode: boolean
  checkTechCompatibility: boolean
  validateAmmoBalance: boolean
  enforceEraRestrictions: boolean
}

export interface WeaponValidationResultLegacy {
  errors: Array<{
    id: string
    category: string
    message: string
    field?: string
  }>
  warnings: Array<{
    id: string
    category: string
    message: string
    field?: string
  }>
  weaponCount: number
  totalHeatGeneration: number
  totalWeight: number
  ammoBalance: AmmoBalanceStatus
  techCompatibility: TechCompatibilityStatus
  isValid: boolean
}

/**
 * Refactored Weapon Validation Service
 * Maintains original static interface while using new Chain of Responsibility architecture
 */
export class WeaponValidationService {
  private static validationChain: WeaponValidationChain = new WeaponValidationChain()

  // Original static constants for backward compatibility
  static readonly WEAPON_CATEGORIES = [
    'Energy Weapons', 'Ballistic Weapons', 'Missile Weapons', 
    'Artillery Weapons', 'Special Weapons'
  ]

  static readonly AMMO_WEAPONS = [
    'AC/2', 'AC/5', 'AC/10', 'AC/20', 'Ultra AC/2', 'Ultra AC/5', 'Ultra AC/10', 'Ultra AC/20',
    'LB 2-X AC', 'LB 5-X AC', 'LB 10-X AC', 'LB 20-X AC',
    'LRM-5', 'LRM-10', 'LRM-15', 'LRM-20', 'SRM-2', 'SRM-4', 'SRM-6',
    'Streak SRM-2', 'Streak SRM-4', 'Streak SRM-6',
    'Gauss Rifle', 'Light Gauss Rifle', 'Heavy Gauss Rifle',
    'Machine Gun', 'Light Machine Gun', 'Heavy Machine Gun'
  ]

  /**
   * Main validation method - maintains original interface
   */
  static async validateWeapons(
    unit: any,
    context: Partial<WeaponValidationContextLegacy> = {}
  ): Promise<WeaponValidationResultLegacy> {
    const equipment = unit.data?.weapons_and_equipment || []

    // Handle empty equipment case
    if (!equipment || equipment.length === 0) {
      return this.createEmptyValidationResult()
    }

    // Convert legacy context to new context format
    const modernContext: Partial<WeaponValidationContext> = {
      strictMode: context.strictMode || false,
      checkTechCompatibility: context.checkTechCompatibility ?? true,
      validateAmmoBalance: context.validateAmmoBalance ?? true,
      enforceEraRestrictions: context.enforceEraRestrictions || false
    }

    try {
      // Use new validation chain
      const result = await this.validationChain.validateWeapons(unit, equipment, modernContext)
      
      // Convert modern result back to legacy format
      return this.convertToLegacyResult(result)
    } catch (error) {
      // Fallback error handling
      return this.createErrorResult(error)
    }
  }

  /**
   * Validate weapon configuration - legacy method
   */
  static validateWeaponConfiguration(
    weapons: any[],
    unit: any,
    context: WeaponValidationContextLegacy
  ): { errors: any[], warnings: any[] } {
    // This is a synchronous legacy method, so we'll provide basic validation
    const errors: any[] = []
    const warnings: any[] = []

    weapons.forEach((weapon, index) => {
      if (!weapon?.item_name) {
        errors.push({
          id: `weapon-missing-name-${index}`,
          category: 'error',
          message: `Weapon at index ${index} has no name specified`,
          field: `weapons_and_equipment[${index}].item_name`,
        })
      }

      if (weapon.tonnage !== undefined && weapon.tonnage < 0) {
        errors.push({
          id: `weapon-negative-tonnage-${index}`,
          category: 'error',
          message: `${weapon.item_name || 'Weapon'}: Weapon tonnage cannot be negative`,
          field: `weapons_and_equipment[${index}].tonnage`,
        })
      }

      if (weapon.heat !== undefined && weapon.heat > 20) {
        warnings.push({
          id: `weapon-high-heat-${index}`,
          category: 'warning',
          message: `${weapon.item_name}: Generates ${weapon.heat} heat - consider heat management`,
          field: `weapons_and_equipment[${index}].heat`,
        })
      }
    })

    return { errors, warnings }
  }

  /**
   * Validate tech compatibility - legacy method
   */
  static validateTechCompatibility(
    equipment: any[],
    unit: any,
    context: WeaponValidationContextLegacy
  ): {
    errors: any[]
    warnings: any[]
    techCompatibility: TechCompatibilityStatus
  } {
    const errors: any[] = []
    const warnings: any[] = []
    const incompatibleItems: string[] = []
    const suggestions: string[] = []

    const unitTechBase = unit.tech_base
    let innerSphereCount = 0
    let clanCount = 0
    let mixedTechDetected = false

    if (!unitTechBase) {
      errors.push({
        id: 'missing-unit-tech-base',
        category: 'error',
        message: 'Unit tech base must be specified for compatibility validation',
        field: 'tech_base',
      })
    } else {
      equipment.forEach((item, index) => {
        if (item?.tech_base) {
          const itemTechBase = this.normalizeItemTechBase(item.tech_base)
          const normalizedUnitTechBase = this.normalizeUnitTechBase(unitTechBase)
          
          if (itemTechBase === 'Inner Sphere') innerSphereCount++
          else if (itemTechBase === 'Clan') clanCount++

          if (normalizedUnitTechBase === 'Inner Sphere' && itemTechBase === 'Clan') {
            incompatibleItems.push(item.item_name)
            
            if (context.strictMode) {
              errors.push({
                id: `equipment-tech-mismatch-${index}`,
                category: 'error',
                message: `${item.item_name}: Clan equipment incompatible with Inner Sphere tech base`,
                field: `weapons_and_equipment[${index}].tech_base`,
              })
            } else {
              warnings.push({
                id: `equipment-tech-mismatch-${index}`,
                category: 'warning',
                message: `${item.item_name}: Mixed tech detected - Clan equipment on IS chassis`,
                field: `weapons_and_equipment[${index}].tech_base`,
              })
            }
          }
        }
      })

      if (innerSphereCount > 0 && clanCount > 0) {
        mixedTechDetected = true
        suggestions.push('Consider using consistent tech base for easier maintenance')
      }
    }

    const isCompatible = context.strictMode ? errors.length === 0 : incompatibleItems.length === 0

    const techCompatibility: TechCompatibilityStatus = {
      isCompatible,
      mixedTechDetected,
      incompatibleItems,
      suggestions,
      compatibilityScore: isCompatible ? 100 : Math.max(0, 100 - incompatibleItems.length * 20),
      innerSphereCount,
      clanCount
    }

    return { errors, warnings, techCompatibility }
  }

  /**
   * Validate ammo balance - legacy method
   */
  static validateAmmoBalance(
    weapons: any[],
    ammunition: any[],
    context: WeaponValidationContextLegacy
  ): {
    errors: any[]
    warnings: any[]
    ammoBalance: AmmoBalanceStatus
  } {
    const errors: any[] = []
    const warnings: any[] = []
    const excessAmmo: string[] = []
    const missingAmmo: string[] = []
    const recommendations: string[] = []

    if (!context.validateAmmoBalance) {
      return {
        errors,
        warnings,
        ammoBalance: this.createEmptyAmmoBalance()
      }
    }

    // Find weapons that require ammunition
    const ammoWeapons = weapons.filter(weapon => this.requiresAmmo(weapon))
    
    let weaponsWithAmmo = 0
    let weaponsNeedingAmmo = 0

    ammoWeapons.forEach(weapon => {
      const weaponType = this.extractWeaponType(weapon.item_name)
      const relatedAmmo = ammunition.filter(ammo => this.isAmmoCompatible(ammo, weaponType))

      if (relatedAmmo.length === 0) {
        weaponsNeedingAmmo++
        const simplifiedType = this.simplifyWeaponType(weaponType)
        missingAmmo.push(simplifiedType)
        warnings.push({
          id: `missing-ammo-${simplifiedType}`,
          category: 'warning',
          message: `${weapon.item_name}: No ammunition found - weapon will be ineffective`,
          field: 'weapons_and_equipment',
        })
      } else {
        weaponsWithAmmo++
        
        const totalAmmoTons = relatedAmmo.reduce((sum, ammo) => sum + (ammo.tonnage || 1), 0)
        const recommendedTons = this.calculateRecommendedAmmo(weapon)
        
        if (totalAmmoTons < recommendedTons * 2) {
          warnings.push({
            id: `insufficient-ammo-${weaponType}`,
            category: 'warning',
            message: `${weapon.item_name}: Low ammunition (${totalAmmoTons}t) - consider ${recommendedTons * 2}t for sustained combat`,
            field: 'weapons_and_equipment',
          })
        }
        
        if (totalAmmoTons >= recommendedTons) {
          warnings.push({
            id: `excess-ammo-${weaponType}`,
            category: 'warning',
            message: `${weapon.item_name}: Excessive ammunition (${totalAmmoTons}t) - consider reducing for weight savings`,
            field: 'weapons_and_equipment',
          })
        }
      }
    })

    // Check for orphaned ammunition
    ammunition.forEach(ammo => {
      const ammoType = this.extractAmmoType(ammo.item_name)
      
      if (ammoWeapons.length === 0) {
        excessAmmo.push(ammo.item_name)
        warnings.push({
          id: `orphaned-ammo-${ammoType.replace(/[\/\s]/g, '-')}`,
          category: 'warning',
          message: `${ammo.item_name}: No compatible weapons found - consider removing`,
          field: 'weapons_and_equipment',
        })
      }
    })

    const balanceScore = ammoWeapons.length > 0 ? 
      Math.round((weaponsWithAmmo / ammoWeapons.length) * 100) : 100

    const ammoBalance: AmmoBalanceStatus = {
      weaponsWithAmmo,
      weaponsNeedingAmmo,
      excessAmmo,
      missingAmmo,
      recommendations,
      balanceScore
    }

    return { errors, warnings, ammoBalance }
  }

  /**
   * Analyze weapon loadout - provides detailed analysis
   */
  static analyzeWeaponLoadout(weapons: any[]): WeaponLoadoutAnalysis {
    const totalHeat = weapons.reduce((sum, w) => sum + (w.heat || 0), 0)
    const totalDamage = weapons.reduce((sum, w) => sum + (w.damage || 0), 0)
    const totalWeight = weapons.reduce((sum, w) => sum + (w.tonnage || 0), 0)

    // Categorize damage by range
    let shortRange = 0, mediumRange = 0, longRange = 0
    weapons.forEach(weapon => {
      const range = weapon.range || 0
      const damage = weapon.damage || 0
      if (range <= 90) shortRange += damage
      else if (range <= 270) mediumRange += damage
      else longRange += damage
    })

    const efficiency = totalWeight > 0 ? Math.round(totalDamage / totalWeight * 10) : 0
    const heatBalance = totalHeat
    const alphaStrike = totalDamage
    const sustainedDamage = Math.round(totalDamage * 0.8) // Account for heat buildup

    const averageRange = weapons.length > 0 ? 
      weapons.reduce((sum, w) => sum + (w.range || 0), 0) / weapons.length : 0

    return {
      shortRange,
      mediumRange,
      longRange,
      heatBalance,
      alphaStrike,
      sustainedDamage,
      efficiency,
      rangeProfile: {
        optimal: averageRange,
        effective: averageRange * 0.8,
        maximum: Math.max(...weapons.map(w => w.range || 0), 0),
        bracket: this.determineRangeBracket(averageRange)
      },
      heatProfile: {
        generation: totalHeat,
        dissipation: 10, // Base heat dissipation
        deficit: Math.max(0, totalHeat - 10),
        sustainabilityRatio: totalHeat > 0 ? 10 / totalHeat : 1
      }
    }
  }

  /**
   * Suggest weapon optimizations
   */
  static suggestWeaponOptimizations(
    weapons: any[],
    unit: any
  ): WeaponOptimization {
    const suggestions: OptimizationSuggestion[] = []

    // Heat optimization
    const totalHeat = weapons.reduce((sum, w) => sum + (w.heat || 0), 0)
    if (totalHeat > 20) {
      suggestions.push({
        type: 'remove',
        weapon: 'high-heat weapons',
        suggestion: 'Consider reducing heat-generating weapons',
        benefit: 'Improved heat management and sustained fire capability',
        impact: 75,
        difficulty: 'moderate',
        priority: 'high',
        category: 'heat'
      })
    }

    // Weight optimization
    const heavyWeapons = weapons.filter(w => (w.tonnage || 0) > 10)
    if (heavyWeapons.length > 2) {
      suggestions.push({
        type: 'replace',
        weapon: 'heavy weapons',
        suggestion: 'Consider replacing some heavy weapons with lighter alternatives',
        benefit: 'Weight savings for armor or additional equipment',
        impact: 60,
        difficulty: 'hard',
        priority: 'medium',
        category: 'weight'
      })
    }

    const heatOptimization = suggestions.filter(s => s.category === 'heat')
    const rangeOptimization = suggestions.filter(s => s.category === 'range')
    const weightOptimization = suggestions.filter(s => s.category === 'weight')
    const ammoOptimization = suggestions.filter(s => s.category === 'ammo')

    const overallScore = suggestions.length === 0 ? 100 : 
      Math.max(0, 100 - suggestions.reduce((sum, s) => sum + s.impact, 0) / suggestions.length)

    return {
      heatOptimization,
      rangeOptimization,
      weightOptimization,
      ammoOptimization,
      overallScore
    }
  }

  /**
   * Get weapon validation rules - legacy method
   */
  static getWeaponValidationRules(): Array<{
    category: string
    rules: Array<{ name: string, description: string, severity: string }>
  }> {
    return [
      {
        category: 'Configuration',
        rules: [
          { name: 'Weapon Name Required', description: 'All weapons must have valid names', severity: 'error' },
          { name: 'Positive Tonnage', description: 'Weapon tonnage must be positive', severity: 'error' },
          { name: 'Valid Heat Generation', description: 'Heat generation must be non-negative', severity: 'error' }
        ]
      },
      {
        category: 'Ammunition',
        rules: [
          { name: 'Ammo Required', description: 'Ballistic and missile weapons require ammunition', severity: 'warning' },
          { name: 'Balanced Ammo', description: 'Ammunition should be balanced for sustained combat', severity: 'warning' },
          { name: 'No Orphaned Ammo', description: 'Ammunition should have compatible weapons', severity: 'warning' }
        ]
      },
      {
        category: 'Tech Compatibility',
        rules: [
          { name: 'Tech Base Match', description: 'Equipment should match unit tech base', severity: 'warning' },
          { name: 'Mixed Tech Rules', description: 'Mixed tech follows special rules', severity: 'info' }
        ]
      }
    ]
  }

  // ===== PRIVATE HELPER METHODS =====

  private static extractWeapons(equipment: any[]): any[] {
    return equipment.filter(item => this.isWeapon(item))
  }

  private static extractAmmunition(equipment: any[]): any[] {
    return equipment.filter(item => this.isAmmunition(item))
  }

  private static isWeapon(item: any): boolean {
    if (!item?.item_name) return false
    
    const hasWeaponCategory = this.WEAPON_CATEGORIES.some(category => 
      item.category?.includes(category)
    )
    const hasWeaponType = item.item_type === 'weapon' || item.type?.includes('weapon')
    const hasWeaponName = item.item_name?.match(/\b(Laser|PPC|AC\/|LRM|SRM|Gauss|Pulse)\b/i)
    const hasWeaponProperties = item.heat !== undefined || item.damage !== undefined

    return hasWeaponCategory || hasWeaponType || hasWeaponName || hasWeaponProperties
  }

  private static isAmmunition(item: any): boolean {
    if (!item?.item_name) return false
    return item.item_name?.toLowerCase().includes('ammo') ||
           item.ammo_type !== undefined ||
           item.shots !== undefined
  }

  private static requiresAmmo(weapon: any): boolean {
    const weaponName = weapon.item_name || ''
    return this.AMMO_WEAPONS.some(ammoWeapon => 
      weaponName.includes(ammoWeapon) || weaponName.includes(ammoWeapon.split(' ')[0])
    )
  }

  private static extractWeaponType(weaponName: string): string {
    if (!weaponName) return ''
    
    const patterns = [
      /AC\/(\d+)/i, /(Ultra AC)\/(\d+)/i, /(LB \d+-X AC)/i,
      /(LRM)-(\d+)/i, /(SRM)-(\d+)/i, /(Streak SRM)-(\d+)/i,
      /(Gauss Rifle)/i, /(Machine Gun)/i
    ]

    for (const pattern of patterns) {
      const match = weaponName.match(pattern)
      if (match) return match[0]
    }

    return weaponName.split(' ')[0]
  }

  private static extractAmmoType(ammoName: string): string {
    return ammoName?.replace(/\b(ammo|ammunition)\b/gi, '').replace(/^\s*\(|\)\s*$/g, '').trim() || ''
  }

  private static isAmmoCompatible(ammo: any, weaponType: string): boolean {
    if (!ammo || !weaponType) return false
    
    const ammoType = this.extractAmmoType(ammo.item_name)
    if (ammoType === weaponType) return true
    
    // Pattern matching
    if (weaponType.includes('AC/') && ammoType.includes('AC')) return true
    if (weaponType.includes('LRM') && ammoType.includes('LRM')) return true
    if (weaponType.includes('SRM') && ammoType.includes('SRM')) return true
    if (weaponType.includes('Gauss') && ammoType.includes('Gauss')) return true
    
    return false
  }

  private static calculateRecommendedAmmo(weapon: any): number {
    const weaponName = weapon.item_name || ''
    if (weaponName.includes('AC/20')) return 2
    if (weaponName.includes('AC/10')) return 2
    if (weaponName.includes('LRM-20')) return 2
    if (weaponName.includes('Gauss')) return 2
    return 1
  }

  private static simplifyWeaponType(weaponType: string): string {
    if (weaponType.includes('AC/')) return 'AC'
    if (weaponType.includes('LRM')) return 'LRM'
    if (weaponType.includes('SRM')) return 'SRM'
    if (weaponType.includes('Gauss')) return 'Gauss'
    return weaponType
  }

  private static normalizeItemTechBase(techBase: string): string {
    if (techBase?.toLowerCase().includes('clan')) return 'Clan'
    return 'Inner Sphere'
  }

  private static normalizeUnitTechBase(techBase: string): string {
    if (techBase?.toLowerCase().includes('clan')) return 'Clan'
    return 'Inner Sphere'
  }

  private static determineRangeBracket(averageRange: number): 'short' | 'medium' | 'long' | 'mixed' {
    if (averageRange <= 90) return 'short'
    if (averageRange <= 270) return 'medium'
    if (averageRange > 270) return 'long'
    return 'mixed'
  }

  // Result creation helpers
  private static createEmptyValidationResult(): WeaponValidationResultLegacy {
    return {
      errors: [],
      warnings: [{
        id: 'no-weapons-configured',
        category: 'warning',
        message: 'No weapons or equipment configured - unit may be non-combat',
        field: 'weapons_and_equipment',
      }],
      weaponCount: 0,
      totalHeatGeneration: 0,
      totalWeight: 0,
      ammoBalance: this.createEmptyAmmoBalance(),
      techCompatibility: this.createEmptyTechCompatibility(),
      isValid: true
    }
  }

  private static createErrorResult(error: any): WeaponValidationResultLegacy {
    return {
      errors: [{
        id: 'validation-error',
        category: 'error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      warnings: [],
      weaponCount: 0,
      totalHeatGeneration: 0,
      totalWeight: 0,
      ammoBalance: this.createEmptyAmmoBalance(),
      techCompatibility: this.createEmptyTechCompatibility(),
      isValid: false
    }
  }

  private static createEmptyAmmoBalance(): AmmoBalanceStatus {
    return {
      weaponsWithAmmo: 0,
      weaponsNeedingAmmo: 0,
      excessAmmo: [],
      missingAmmo: [],
      recommendations: [],
      balanceScore: 100
    }
  }

  private static createEmptyTechCompatibility(): TechCompatibilityStatus {
    return {
      isCompatible: true,
      mixedTechDetected: false,
      incompatibleItems: [],
      suggestions: [],
      compatibilityScore: 100,
      innerSphereCount: 0,
      clanCount: 0
    }
  }

  private static convertToLegacyResult(modernResult: WeaponValidationResult): WeaponValidationResultLegacy {
    return {
      errors: modernResult.errors,
      warnings: modernResult.warnings,
      weaponCount: modernResult.weaponCount,
      totalHeatGeneration: modernResult.totalHeatGeneration,
      totalWeight: modernResult.totalWeight,
      ammoBalance: modernResult.ammoBalance,
      techCompatibility: modernResult.techCompatibility,
      isValid: modernResult.isValid
    }
  }
}