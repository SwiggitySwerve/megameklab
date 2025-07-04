/**
 * Placement Validator
 * Validates basic equipment placement rules including location restrictions,
 * weight limits, and slot conflicts
 */

import { BaseEquipmentValidator } from './BaseEquipmentValidator'
import { 
  ValidationContext,
  ValidationError,
  ValidationWarning,
  EquipmentPlacement 
} from './EquipmentValidationTypes'

export class PlacementValidator extends BaseEquipmentValidator {
  // Location-specific restrictions
  private static readonly LOCATION_RESTRICTIONS = {
    'head': {
      maxTonnage: 1,
      maxCriticals: 6,
      forbiddenTypes: ['engine', 'gyro', 'ammunition'],
      specialRules: ['cockpit_required']
    },
    'centerTorso': {
      maxTonnage: 100,
      maxCriticals: 12,
      requiredTypes: ['engine', 'gyro'],
      specialRules: ['engine_placement', 'gyro_placement']
    },
    'leftTorso': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: [],
      specialRules: ['side_torso_rules']
    },
    'rightTorso': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: [],
      specialRules: ['side_torso_rules']
    },
    'leftArm': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['actuator_restrictions']
    },
    'rightArm': {
      maxTonnage: 100,
      maxCriticals: 12,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['actuator_restrictions']
    },
    'leftLeg': {
      maxTonnage: 100,
      maxCriticals: 6,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['leg_restrictions']
    },
    'rightLeg': {
      maxTonnage: 100,
      maxCriticals: 6,
      forbiddenTypes: ['engine', 'gyro'],
      specialRules: ['leg_restrictions']
    }
  }

  constructor() {
    super('PlacementValidator')
  }

  protected async executeValidation(context: ValidationContext): Promise<{
    errors: ValidationError[]
    warnings: ValidationWarning[]
    suggestions: string[]
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: string[] = []

    // Validate each equipment placement
    for (const allocation of context.allocations) {
      const equipmentPlacement = allocation as EquipmentPlacement
      
      // Basic location validation
      const locationErrors = this.validateLocation(equipmentPlacement)
      errors.push(...locationErrors)

      // Weight limit validation
      const weightErrors = this.validateWeightLimits(equipmentPlacement, context)
      errors.push(...weightErrors)

      // Slot conflict validation
      const slotErrors = this.validateSlotConflicts(equipmentPlacement, context.allocations)
      errors.push(...slotErrors)

      // Generate placement warnings
      const placementWarnings = this.generatePlacementWarnings(equipmentPlacement, context)
      warnings.push(...placementWarnings)
    }

    // Generate optimization suggestions
    suggestions.push(...this.generatePlacementSuggestions(context))

    return { errors, warnings, suggestions }
  }

  /**
   * Validate equipment location restrictions
   */
  private validateLocation(placement: EquipmentPlacement): ValidationError[] {
    const errors: ValidationError[] = []
    const equipment = placement.equipment
    const location = placement.location
    const locationRules = PlacementValidator.LOCATION_RESTRICTIONS[location as keyof typeof PlacementValidator.LOCATION_RESTRICTIONS]

    if (!locationRules) {
      errors.push(this.createError(
        placement.equipmentId,
        'location_invalid',
        `Invalid location: ${location}`,
        'critical',
        'Use valid mech location (head, centerTorso, leftTorso, rightTorso, leftArm, rightArm, leftLeg, rightLeg)',
        location
      ))
      return errors
    }

    // Check forbidden types
    const equipmentType = equipment.equipmentData?.type || 'equipment'
    const forbiddenTypes = 'forbiddenTypes' in locationRules ? locationRules.forbiddenTypes : []
    
    if (forbiddenTypes.includes(equipmentType)) {
      errors.push(this.createError(
        placement.equipmentId,
        'rule_violation',
        `${equipmentType} cannot be placed in ${location}`,
        'critical',
        'Move to appropriate location for this equipment type',
        location
      ))
    }

    // Check if equipment has specific location requirements
    const allowedLocations = this.getEquipmentAllowedLocations(equipment)
    if (allowedLocations.length > 0 && !allowedLocations.includes(location)) {
      errors.push(this.createError(
        placement.equipmentId,
        'location_invalid',
        `${equipment.equipmentData?.name || 'Equipment'} cannot be mounted in ${location}`,
        'critical',
        `Mount in: ${allowedLocations.join(', ')}`,
        location
      ))
    }

    return errors
  }

  /**
   * Validate weight limits for location
   */
  private validateWeightLimits(placement: EquipmentPlacement, context: ValidationContext): ValidationError[] {
    const errors: ValidationError[] = []
    const equipment = placement.equipment
    const location = placement.location
    const locationRules = PlacementValidator.LOCATION_RESTRICTIONS[location as keyof typeof PlacementValidator.LOCATION_RESTRICTIONS]

    if (!locationRules) return errors

    const tonnage = equipment.equipmentData?.tonnage || 0
    
    // Check individual equipment weight
    if (tonnage > locationRules.maxTonnage) {
      errors.push(this.createError(
        placement.equipmentId,
        'weight_exceeded',
        `Equipment too heavy for ${location} (${tonnage} > ${locationRules.maxTonnage} tons)`,
        'critical',
        'Move to location with higher weight capacity',
        location
      ))
    }

    // Check total location weight
    const locationTotalWeight = this.calculateLocationWeight(location, context.allocations)
    if (locationTotalWeight > locationRules.maxTonnage) {
      const excess = locationTotalWeight - locationRules.maxTonnage
      errors.push(this.createError(
        placement.equipmentId,
        'weight_exceeded',
        `Total weight in ${location} exceeds limit (${locationTotalWeight} > ${locationRules.maxTonnage} tons, excess: ${excess})`,
        'critical',
        `Redistribute ${excess} tons to other locations`,
        location
      ))
    }

    return errors
  }

  /**
   * Validate slot conflicts between equipment
   */
  private validateSlotConflicts(placement: EquipmentPlacement, allAllocations: any[]): ValidationError[] {
    const errors: ValidationError[] = []
    
    if (!placement.startSlot || !placement.endSlot) {
      // If no specific slots defined, skip slot conflict check
      return errors
    }

    const location = placement.location
    const startSlot = placement.startSlot
    const endSlot = placement.endSlot

    // Check for overlapping slots in the same location
    for (const other of allAllocations) {
      if (other.equipmentId === placement.equipmentId || other.location !== location) {
        continue
      }

      if (other.startSlot && other.endSlot) {
        const otherStart = other.startSlot
        const otherEnd = other.endSlot

        // Check for overlap
        if ((startSlot <= otherEnd && endSlot >= otherStart)) {
          errors.push(this.createError(
            placement.equipmentId,
            'slot_conflict',
            `Slot conflict in ${location}: slots ${startSlot}-${endSlot} overlap with ${other.equipment?.equipmentData?.name || 'equipment'} slots ${otherStart}-${otherEnd}`,
            'critical',
            'Move to different slots or location',
            location
          ))
        }
      }
    }

    return errors
  }

  /**
   * Generate placement warnings for suboptimal placement
   */
  private generatePlacementWarnings(placement: EquipmentPlacement, context: ValidationContext): ValidationWarning[] {
    const warnings: ValidationWarning[] = []
    const equipment = placement.equipment
    const location = placement.location

    // Check for ammunition in exposed locations
    if (equipment.equipmentData?.type === 'ammunition' && ['leftTorso', 'rightTorso'].includes(location)) {
      const hasCase = this.hasLocationCASE(location, context.allocations)
      if (!hasCase) {
        warnings.push(this.createWarning(
          placement.equipmentId,
          'vulnerability',
          `Ammunition in ${location} without CASE protection - explosion risk`,
          'high',
          'Add CASE protection or move ammunition to center torso'
        ))
      }
    }

    // Check for heat-generating equipment concentration
    if (equipment.equipmentData?.heat > 0) {
      const locationHeat = this.calculateLocationHeat(location, context.allocations)
      if (locationHeat > 15) {
        warnings.push(this.createWarning(
          placement.equipmentId,
          'heat_concern',
          `High heat concentration in ${location} (${locationHeat} heat)`,
          'medium',
          'Distribute heat-generating equipment across multiple locations'
        ))
      }
    }

    // Check for weapon grouping
    if (equipment.equipmentData?.type === 'weapon') {
      const locationWeapons = context.allocations.filter(a => 
        a.location === location && a.equipment?.equipmentData?.type === 'weapon'
      ).length
      
      if (locationWeapons > 3) {
        warnings.push(this.createWarning(
          placement.equipmentId,
          'suboptimal_placement',
          `Many weapons in ${location} - risk of location destruction`,
          'medium',
          'Consider distributing weapons across multiple locations'
        ))
      }
    }

    return warnings
  }

  /**
   * Generate placement optimization suggestions
   */
  private generatePlacementSuggestions(context: ValidationContext): string[] {
    const suggestions: string[] = []

    // Analyze weight distribution
    const weightByLocation = this.analyzeWeightDistribution(context.allocations)
    const imbalancedLocations = Object.entries(weightByLocation)
      .filter(([_, weight]) => weight > 80) // Over 80% capacity
      .map(([location, _]) => location)

    if (imbalancedLocations.length > 0) {
      suggestions.push(`Consider redistributing equipment from heavily loaded locations: ${imbalancedLocations.join(', ')}`)
    }

    // Analyze critical slot usage
    const slotUsage = this.analyzeCriticalSlotUsage(context.allocations)
    const overloadedLocations = Object.entries(slotUsage)
      .filter(([_, usage]) => usage > 90) // Over 90% capacity
      .map(([location, _]) => location)

    if (overloadedLocations.length > 0) {
      suggestions.push(`Consider relocating equipment from slot-constrained locations: ${overloadedLocations.join(', ')}`)
    }

    // Suggest equipment grouping optimizations
    suggestions.push(...this.suggestEquipmentGrouping(context.allocations))

    return suggestions
  }

  // ===== HELPER METHODS =====

  private getEquipmentAllowedLocations(equipment: any): string[] {
    const constraints = equipment.constraints || equipment.equipmentData?.constraints
    return constraints?.allowedLocations || []
  }

  private calculateLocationWeight(location: string, allocations: any[]): number {
    return allocations
      .filter(a => a.location === location)
      .reduce((sum, a) => sum + (a.equipment?.equipmentData?.tonnage || 0), 0)
  }

  private hasLocationCASE(location: string, allocations: any[]): boolean {
    return allocations.some(a => 
      a.location === location && 
      (a.equipment?.equipmentData?.name?.includes('CASE') || a.equipment?.name?.includes('CASE'))
    )
  }

  private calculateLocationHeat(location: string, allocations: any[]): number {
    return allocations
      .filter(a => a.location === location)
      .reduce((sum, a) => sum + (a.equipment?.equipmentData?.heat || 0), 0)
  }

  private analyzeWeightDistribution(allocations: any[]): { [location: string]: number } {
    const distribution: { [location: string]: number } = {}
    const locationLimits = PlacementValidator.LOCATION_RESTRICTIONS

    for (const [location, rules] of Object.entries(locationLimits)) {
      const weight = this.calculateLocationWeight(location, allocations)
      distribution[location] = (weight / rules.maxTonnage) * 100
    }

    return distribution
  }

  private analyzeCriticalSlotUsage(allocations: any[]): { [location: string]: number } {
    const usage: { [location: string]: number } = {}
    const locationLimits = PlacementValidator.LOCATION_RESTRICTIONS

    for (const [location, rules] of Object.entries(locationLimits)) {
      const slots = allocations
        .filter(a => a.location === location)
        .reduce((sum, a) => sum + (a.equipment?.equipmentData?.criticals || 1), 0)
      
      usage[location] = (slots / rules.maxCriticals) * 100
    }

    return usage
  }

  private suggestEquipmentGrouping(allocations: any[]): string[] {
    const suggestions: string[] = []

    // Check for weapon/ammunition pairing
    const weapons = allocations.filter(a => a.equipment?.equipmentData?.type === 'weapon')
    const ammunition = allocations.filter(a => a.equipment?.equipmentData?.type === 'ammunition')

    for (const weapon of weapons) {
      const compatibleAmmo = ammunition.find(ammo => 
        this.isAmmoCompatible(weapon.equipment, ammo.equipment) &&
        weapon.location !== ammo.location
      )

      if (compatibleAmmo) {
        suggestions.push(`Consider placing ${weapon.equipment?.equipmentData?.name} and compatible ammunition in the same location for efficiency`)
      }
    }

    return suggestions
  }

  private isAmmoCompatible(weapon: any, ammo: any): boolean {
    const weaponName = weapon.equipmentData?.name || weapon.name || ''
    const ammoName = ammo.equipmentData?.name || ammo.name || ''
    
    // Simplified compatibility check - would be more sophisticated in real implementation
    return weaponName.includes('LRM') && ammoName.includes('LRM') ||
           weaponName.includes('SRM') && ammoName.includes('SRM') ||
           weaponName.includes('AC') && ammoName.includes('AC')
  }
}