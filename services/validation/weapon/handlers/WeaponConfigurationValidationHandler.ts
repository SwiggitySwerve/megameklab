/**
 * Weapon Configuration Validation Handler
 * Validates basic weapon data integrity and configuration using Chain of Responsibility pattern
 * Handles weapon data validation, property checks, and basic configuration rules
 */

import { BaseWeaponValidationHandler } from '../BaseWeaponValidationHandler'
import {
  WeaponValidationContext,
  ValidationError,
  VALIDATION_PRIORITIES,
  WEAPON_CATEGORIES
} from '../WeaponValidationTypes'

/**
 * Configuration Validation Handler
 * First handler in chain - validates basic weapon data integrity
 */
export class WeaponConfigurationValidationHandler extends BaseWeaponValidationHandler {
  constructor() {
    super('WeaponConfiguration', VALIDATION_PRIORITIES.CONFIGURATION)
  }

  /**
   * Always applicable - basic configuration should always be checked
   */
  isApplicable(context: WeaponValidationContext): boolean {
    return true
  }

  /**
   * Validate weapon configuration and basic data integrity
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

    // Check if unit has any weapons
    if (weapons.length === 0) {
      warnings.push(this.createWarning(
        'no-weapons-equipped',
        'Unit has no weapons equipped - consider combat effectiveness',
        'weapons_and_equipment',
        'Add weapons to improve combat capability'
      ))
      
      recommendations.push('Consider adding weapons for combat effectiveness')
      
      return {
        errors,
        warnings,
        data: { weaponCount: 0, hasWeapons: false },
        recommendations
      }
    }

    // Validate each weapon's configuration
    context.equipment.forEach((item, index) => {
      if (!item) return

      const isWeapon = this.isWeapon(item)
      
      if (isWeapon) {
        // Validate weapon name
        this.validateWeaponName(item, index, errors)
        
        // Validate weapon properties
        this.validateWeaponProperties(item, index, errors, warnings)
        
        // Validate weapon category consistency
        this.validateWeaponCategory(item, index, warnings)
        
        // Check for weapon-specific issues
        this.validateWeaponSpecificRules(item, index, errors, warnings, recommendations)
      }
    })

    // Validate overall weapon configuration
    this.validateOverallConfiguration(weapons, context, warnings, recommendations)

    const configurationData = {
      weaponCount: weapons.length,
      hasWeapons: weapons.length > 0,
      totalHeat: this.calculateTotalHeat(weapons),
      totalWeight: this.calculateTotalWeight(weapons),
      categories: this.analyzeWeaponCategories(weapons),
      validationCoverage: {
        nameValidation: true,
        propertyValidation: true,
        categoryValidation: true,
        specificRules: true
      }
    }

    return {
      errors,
      warnings,
      data: configurationData,
      recommendations
    }
  }

  /**
   * Validate weapon name is present and valid
   */
  private validateWeaponName(weapon: any, index: number, errors: ValidationError[]): void {
    if (!weapon.item_name || weapon.item_name.trim() === '') {
      errors.push(this.createError(
        `weapon-missing-name-${index}`,
        `Weapon at index ${index} has no name specified`,
        `weapons_and_equipment[${index}].item_name`,
        'critical',
        'Specify a valid weapon name'
      ))
    }
  }

  /**
   * Validate weapon properties (tonnage, heat, criticals, etc.)
   */
  private validateWeaponProperties(
    weapon: any,
    index: number,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const weaponName = weapon.item_name || 'Weapon'

    // Validate tonnage
    if (weapon.tonnage !== undefined) {
      if (weapon.tonnage < 0) {
        errors.push(this.createError(
          `weapon-negative-tonnage-${index}`,
          `${weaponName}: Weapon tonnage cannot be negative (${weapon.tonnage})`,
          `weapons_and_equipment[${index}].tonnage`,
          'critical',
          'Set tonnage to a positive value'
        ))
      } else if (weapon.tonnage === 0) {
        warnings.push(this.createWarning(
          `weapon-zero-tonnage-${index}`,
          `${weaponName}: Zero tonnage weapon - verify this is correct`,
          `weapons_and_equipment[${index}].tonnage`,
          'Confirm zero tonnage is intentional'
        ))
      } else if (weapon.tonnage > 50) {
        warnings.push(this.createWarning(
          `weapon-excessive-tonnage-${index}`,
          `${weaponName}: Very heavy weapon (${weapon.tonnage}t) - consider weight impact`,
          `weapons_and_equipment[${index}].tonnage`,
          'Verify weapon tonnage is reasonable for unit'
        ))
      }
    }

    // Validate heat generation
    if (weapon.heat !== undefined) {
      if (weapon.heat < 0) {
        errors.push(this.createError(
          `weapon-negative-heat-${index}`,
          `${weaponName}: Heat generation cannot be negative (${weapon.heat})`,
          `weapons_and_equipment[${index}].heat`,
          'critical',
          'Set heat generation to zero or positive value'
        ))
      } else if (weapon.heat > 30) {
        warnings.push(this.createWarning(
          `weapon-extreme-heat-${index}`,
          `${weaponName}: Extremely high heat generation (${weapon.heat}) - consider heat management`,
          `weapons_and_equipment[${index}].heat`,
          'Add heat sinks or reduce heat-generating weapons'
        ))
      } else if (weapon.heat > 15) {
        warnings.push(this.createWarning(
          `weapon-high-heat-${index}`,
          `${weaponName}: High heat generation (${weapon.heat}) - monitor heat buildup`,
          `weapons_and_equipment[${index}].heat`,
          'Consider additional cooling or heat management'
        ))
      }
    }

    // Validate critical slots
    if (weapon.criticals !== undefined) {
      if (weapon.criticals <= 0) {
        errors.push(this.createError(
          `weapon-invalid-criticals-${index}`,
          `${weaponName}: Critical slots must be positive (${weapon.criticals})`,
          `weapons_and_equipment[${index}].criticals`,
          'major',
          'Set critical slots to a positive integer'
        ))
      } else if (weapon.criticals > 10) {
        warnings.push(this.createWarning(
          `weapon-excessive-criticals-${index}`,
          `${weaponName}: Uses many critical slots (${weapon.criticals}) - verify space availability`,
          `weapons_and_equipment[${index}].criticals`,
          'Check critical slot availability in target location'
        ))
      }
    }

    // Validate damage
    if (weapon.damage !== undefined && weapon.damage < 0) {
      errors.push(this.createError(
        `weapon-negative-damage-${index}`,
        `${weaponName}: Damage cannot be negative (${weapon.damage})`,
        `weapons_and_equipment[${index}].damage`,
        'major',
        'Set damage to zero or positive value'
      ))
    }

    // Validate range
    if (weapon.range !== undefined && weapon.range < 0) {
      errors.push(this.createError(
        `weapon-negative-range-${index}`,
        `${weaponName}: Range cannot be negative (${weapon.range})`,
        `weapons_and_equipment[${index}].range`,
        'major',
        'Set range to zero or positive value'
      ))
    }
  }

  /**
   * Validate weapon category consistency
   */
  private validateWeaponCategory(
    weapon: any,
    index: number,
    warnings: ValidationError[]
  ): void {
    const weaponName = weapon.item_name || 'Weapon'

    // Check if weapon has a valid category
    if (weapon.category) {
      const hasValidCategory = WEAPON_CATEGORIES.some(validCategory =>
        weapon.category.includes(validCategory)
      )

      if (!hasValidCategory) {
        warnings.push(this.createWarning(
          `weapon-unknown-category-${index}`,
          `${weaponName}: Unknown weapon category '${weapon.category}'`,
          `weapons_and_equipment[${index}].category`,
          'Verify weapon category is correct'
        ))
      }
    } else {
      // No category specified - try to infer from name
      const inferredCategory = this.inferWeaponCategory(weaponName)
      if (inferredCategory) {
        warnings.push(this.createWarning(
          `weapon-missing-category-${index}`,
          `${weaponName}: No category specified - appears to be ${inferredCategory}`,
          `weapons_and_equipment[${index}].category`,
          `Set category to '${inferredCategory}'`
        ))
      }
    }
  }

  /**
   * Validate weapon-specific rules based on weapon type
   */
  private validateWeaponSpecificRules(
    weapon: any,
    index: number,
    errors: ValidationError[],
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    const weaponName = weapon.item_name || ''

    // AC (Autocannon) specific validation
    if (weaponName.includes('AC/')) {
      this.validateAutocannon(weapon, index, errors, warnings, recommendations)
    }

    // Laser specific validation
    if (weaponName.includes('Laser') || weaponName.includes('PPC')) {
      this.validateEnergyWeapon(weapon, index, warnings, recommendations)
    }

    // Missile specific validation
    if (weaponName.includes('LRM') || weaponName.includes('SRM')) {
      this.validateMissileWeapon(weapon, index, warnings, recommendations)
    }

    // Gauss specific validation
    if (weaponName.includes('Gauss')) {
      this.validateGaussWeapon(weapon, index, warnings, recommendations)
    }
  }

  /**
   * Validate autocannon specific rules
   */
  private validateAutocannon(
    weapon: any,
    index: number,
    errors: ValidationError[],
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    const weaponName = weapon.item_name

    // ACs require ammunition
    if (!weapon.ammo_type) {
      warnings.push(this.createWarning(
        `ac-no-ammo-type-${index}`,
        `${weaponName}: Autocannon should specify ammunition type`,
        `weapons_and_equipment[${index}].ammo_type`,
        'Specify compatible ammunition type'
      ))
    }

    // Check for reasonable heat values for ACs
    if (weapon.heat !== undefined && weapon.heat > 7) {
      warnings.push(this.createWarning(
        `ac-high-heat-${index}`,
        `${weaponName}: High heat for autocannon (${weapon.heat}) - verify specifications`,
        `weapons_and_equipment[${index}].heat`,
        'Standard ACs typically generate 1-7 heat'
      ))
    }

    recommendations.push(`${weaponName}: Ensure sufficient ammunition supply`)
  }

  /**
   * Validate energy weapon specific rules
   */
  private validateEnergyWeapon(
    weapon: any,
    index: number,
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    const weaponName = weapon.item_name

    // Energy weapons shouldn't have ammo
    if (weapon.ammo_type) {
      warnings.push(this.createWarning(
        `energy-has-ammo-${index}`,
        `${weaponName}: Energy weapon shouldn't require ammunition`,
        `weapons_and_equipment[${index}].ammo_type`,
        'Remove ammunition requirement for energy weapon'
      ))
    }

    // Check for reasonable heat values
    if (weapon.heat !== undefined && weapon.heat === 0) {
      warnings.push(this.createWarning(
        `energy-no-heat-${index}`,
        `${weaponName}: Energy weapon with no heat generation - verify specifications`,
        `weapons_and_equipment[${index}].heat`,
        'Most energy weapons generate some heat'
      ))
    }

    recommendations.push(`${weaponName}: Consider heat management for sustained fire`)
  }

  /**
   * Validate missile weapon specific rules
   */
  private validateMissileWeapon(
    weapon: any,
    index: number,
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    const weaponName = weapon.item_name

    // Missile weapons require ammunition
    if (!weapon.ammo_type) {
      warnings.push(this.createWarning(
        `missile-no-ammo-type-${index}`,
        `${weaponName}: Missile weapon should specify ammunition type`,
        `weapons_and_equipment[${index}].ammo_type`,
        'Specify compatible ammunition type'
      ))
    }

    recommendations.push(`${weaponName}: Ensure adequate missile ammunition supply`)
    
    // LRMs benefit from Artemis
    if (weaponName.includes('LRM')) {
      recommendations.push(`${weaponName}: Consider Artemis IV for improved accuracy`)
    }
  }

  /**
   * Validate Gauss weapon specific rules
   */
  private validateGaussWeapon(
    weapon: any,
    index: number,
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    const weaponName = weapon.item_name

    // Gauss rifles have specific heat and critical requirements
    if (weapon.heat !== undefined && weapon.heat > 1) {
      warnings.push(this.createWarning(
        `gauss-high-heat-${index}`,
        `${weaponName}: High heat for Gauss weapon (${weapon.heat}) - typically generate 1 heat`,
        `weapons_and_equipment[${index}].heat`,
        'Standard Gauss rifles generate 1 heat'
      ))
    }

    recommendations.push(`${weaponName}: Protect with CASE due to ammunition explosion risk`)
    recommendations.push(`${weaponName}: Requires substantial ammunition supply`)
  }

  /**
   * Validate overall weapon configuration
   */
  private validateOverallConfiguration(
    weapons: any[],
    context: WeaponValidationContext,
    warnings: ValidationError[],
    recommendations: string[]
  ): void {
    const totalHeat = this.calculateTotalHeat(weapons)
    const totalWeight = this.calculateTotalWeight(weapons)

    // Check heat balance
    if (totalHeat > 30) {
      warnings.push(this.createWarning(
        'excessive-heat-generation',
        `Very high total heat generation (${totalHeat}) - heat management critical`,
        'weapons_and_equipment',
        'Add heat sinks or reduce heat-generating weapons'
      ))
      recommendations.push('Consider double heat sinks for improved cooling')
    }

    // Check weapon diversity
    const categories = this.analyzeWeaponCategories(weapons)
    if (categories.size === 1) {
      recommendations.push('Consider diversifying weapon types for tactical flexibility')
    }

    // Check for excessive weapon count
    if (weapons.length > 15) {
      warnings.push(this.createWarning(
        'excessive-weapon-count',
        `High weapon count (${weapons.length}) - may indicate configuration issues`,
        'weapons_and_equipment',
        'Review weapon loadout for optimization opportunities'
      ))
    }
  }

  /**
   * Infer weapon category from name
   */
  private inferWeaponCategory(weaponName: string): string | null {
    const name = weaponName.toLowerCase()

    if (name.includes('laser') || name.includes('ppc')) {
      return 'Energy Weapons'
    }
    if (name.includes('ac/') || name.includes('gauss') || name.includes('machine gun')) {
      return 'Ballistic Weapons'
    }
    if (name.includes('lrm') || name.includes('srm') || name.includes('missile')) {
      return 'Missile Weapons'
    }

    return null
  }

  /**
   * Analyze weapon categories for diversity assessment
   */
  private analyzeWeaponCategories(weapons: any[]): Set<string> {
    const categories = new Set<string>()

    weapons.forEach(weapon => {
      if (weapon.category) {
        // Extract main category from full category string
        const mainCategory = WEAPON_CATEGORIES.find(cat => 
          weapon.category.includes(cat)
        )
        if (mainCategory) {
          categories.add(mainCategory)
        }
      } else {
        // Infer category from name
        const inferredCategory = this.inferWeaponCategory(weapon.item_name || '')
        if (inferredCategory) {
          categories.add(inferredCategory)
        }
      }
    })

    return categories
  }
}