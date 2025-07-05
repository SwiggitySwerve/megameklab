/**
 * Special Component Validator
 * Validates special components like Endo Steel, Ferro-Fibrous, Double Heat Sinks, etc.
 * Part of the Chain of Responsibility validation pattern
 */

import { BaseSlotValidator, ValidationRequest } from './SlotOverflowValidator'
import { 
  SpecialComponentSlots,
  EndoSteelSlots,
  FerroFibrousSlots,
  DoubleHeatSinkSlots,
  ArtemisSlots,
  TargetingComputerSlots,
  CriticalSlotViolation
} from '../types/CriticalSlotValidationTypes'

export class SpecialComponentValidator extends BaseSlotValidator {
  // Special component slot requirements
  private static readonly SPECIAL_COMPONENT_REQUIREMENTS = {
    'endoSteel': 14, // 14 slots spread across multiple locations
    'endoSteelClan': 7, // Clan Endo Steel takes only 7 slots
    'ferroFibrous': 14, // 14 slots spread across multiple locations
    'ferroFibrousClan': 7, // Clan Ferro-Fibrous takes only 7 slots
    'lightFerroFibrous': 7, // Light Ferro-Fibrous takes 7 slots
    'heavyFerroFibrous': 21, // Heavy Ferro-Fibrous takes 21 slots
    'doubleHeatSink': 3, // 3 slots each for external double heat sinks
    'artemis': 1, // 1 slot per Artemis system
    'targetingComputer': (tonnage: number) => Math.ceil(tonnage / 10) // 1 slot per 10 tons
  }

  protected validate(request: ValidationRequest): void {
    const { config, equipment, context, result } = request

    if (!context.validateSpecialComponents) {
      return // Skip special component validation if disabled
    }

    // Validate special component requirements
    result.specialComponentSlots = this.validateSpecialComponentSlots(
      config, 
      equipment, 
      result.violations, 
      result.recommendations
    )

    // Update overall validity based on special component compliance
    const hasSpecialViolations = result.violations.some(
      v => v.type === 'special_component_violation' && v.severity === 'critical'
    )
    if (hasSpecialViolations) {
      result.isValid = false
    }
  }

  /**
   * Validate all special component slot requirements
   */
  private validateSpecialComponentSlots(
    config: any, 
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): SpecialComponentSlots {
    return {
      endoSteel: this.validateEndoSteelSlots(config, violations, recommendations),
      ferroFibrous: this.validateFerroFibrousSlots(config, violations, recommendations),
      doubleHeatSinks: this.validateDoubleHeatSinkSlots(config, equipment, violations, recommendations),
      artemis: this.validateArtemisSlots(equipment, violations, recommendations),
      targetingComputer: this.validateTargetingComputerSlots(config, equipment, violations, recommendations)
    }
  }

  /**
   * Validate Endo Steel structure slot requirements
   */
  private validateEndoSteelSlots(
    config: any, 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): EndoSteelSlots {
    const structureType = this.extractComponentType(config.structureType)
    const isEndoSteel = structureType.includes('Endo Steel')
    
    if (!isEndoSteel) {
      return { required: 0, allocated: 0, locations: [], isCompliant: true }
    }
    
    // Determine required slots based on tech base
    let required: number
    if (structureType.includes('Clan')) {
      required = SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.endoSteelClan
    } else {
      required = SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.endoSteel
    }
    
    // For now, assume allocated equals required (would check actual slot allocation in real implementation)
    const allocated = required
    const locations = this.getEndoSteelLocations(config)
    const isCompliant = allocated >= required
    
    if (!isCompliant) {
      violations.push({
        location: 'multiple',
        type: 'special_component_violation',
        component: 'Endo Steel',
        message: `Endo Steel structure requires ${required} slots but only ${allocated} allocated`,
        severity: 'critical',
        suggestedFix: `Allocate ${required - allocated} more slots for Endo Steel across multiple locations`
      })
    } else {
      recommendations.push(
        `Endo Steel slots distributed across: ${locations.join(', ')}`
      )
    }
    
    return { required, allocated, locations, isCompliant }
  }

  /**
   * Validate Ferro-Fibrous armor slot requirements
   */
  private validateFerroFibrousSlots(
    config: any, 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): FerroFibrousSlots {
    const armorType = this.extractComponentType(config.armorType)
    const isFerroFibrous = armorType.includes('Ferro-Fibrous') || armorType.includes('Ferro Fibrous')
    
    if (!isFerroFibrous) {
      return { required: 0, allocated: 0, locations: [], isCompliant: true }
    }
    
    // Determine required slots based on armor type
    let required: number
    if (armorType.includes('Clan')) {
      required = SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.ferroFibrousClan
    } else if (armorType.includes('Light')) {
      required = SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.lightFerroFibrous
    } else if (armorType.includes('Heavy')) {
      required = SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.heavyFerroFibrous
    } else {
      required = SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.ferroFibrous
    }
    
    const allocated = required // Simplified for now
    const locations = this.getFerroFibrousLocations(config)
    const isCompliant = allocated >= required
    
    if (!isCompliant) {
      violations.push({
        location: 'multiple',
        type: 'special_component_violation',
        component: 'Ferro-Fibrous',
        message: `Ferro-Fibrous armor requires ${required} slots but only ${allocated} allocated`,
        severity: 'critical',
        suggestedFix: `Allocate ${required - allocated} more slots for Ferro-Fibrous across multiple locations`
      })
    } else {
      recommendations.push(
        `Ferro-Fibrous slots distributed across: ${locations.join(', ')}`
      )
    }
    
    return { required, allocated, locations, isCompliant }
  }

  /**
   * Validate Double Heat Sink slot requirements
   */
  private validateDoubleHeatSinkSlots(
    config: any, 
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): DoubleHeatSinkSlots {
    const heatSinkType = this.extractComponentType(config.heatSinkType)
    const isDoubleHeatSinks = heatSinkType.includes('Double')
    
    if (!isDoubleHeatSinks) {
      return { engineSlots: 0, externalSlots: 0, totalRequired: 0, isCompliant: true }
    }
    
    // Count engine-mounted heat sinks (free slots)
    const engineHeatSinks = this.getEngineHeatSinks(config)
    
    // Count external double heat sinks from equipment
    const externalDoubleHeatSinks = equipment.filter(item => 
      item.name?.includes('Double Heat Sink') && !item.engineMounted
    ).length
    
    const externalSlots = externalDoubleHeatSinks * SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.doubleHeatSink
    const totalRequired = externalSlots // Engine slots are free
    
    const isCompliant = true // Simplified - would check actual slot allocation
    
    if (externalDoubleHeatSinks > 0) {
      recommendations.push(
        `${externalDoubleHeatSinks} external Double Heat Sinks require ${externalSlots} critical slots`
      )
    }
    
    return { 
      engineSlots: engineHeatSinks, 
      externalSlots, 
      totalRequired, 
      isCompliant 
    }
  }

  /**
   * Validate Artemis fire control system slot requirements
   */
  private validateArtemisSlots(
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): ArtemisSlots {
    const artemisEquipment = equipment.filter(item => 
      item.name?.includes('Artemis') || item.equipmentData?.name?.includes('Artemis')
    )
    
    const artemisWeapons = equipment.filter(item => 
      item.name?.includes('LRM') || item.name?.includes('SRM') || 
      item.equipmentData?.name?.includes('LRM') || item.equipmentData?.name?.includes('SRM')
    ).filter(weapon => weapon.artemisCapable || weapon.equipmentData?.artemisCapable)
    
    const required = artemisWeapons.length
    const allocated = artemisEquipment.length
    const weaponPairings = this.createArtemisPairings(artemisWeapons, artemisEquipment)
    
    const isCompliant = allocated >= required
    
    if (!isCompliant && required > 0) {
      violations.push({
        location: 'multiple',
        type: 'special_component_violation',
        component: 'Artemis',
        message: `${required} Artemis-capable weapons require Artemis systems but only ${allocated} allocated`,
        severity: 'major',
        suggestedFix: `Add ${required - allocated} more Artemis fire control systems`
      })
    }
    
    if (required > 0) {
      recommendations.push(
        `${required} Artemis-capable weapons detected - ensure proper Artemis system pairing`
      )
    }
    
    return { required, allocated, weaponPairings, isCompliant }
  }

  /**
   * Validate Targeting Computer slot requirements
   */
  private validateTargetingComputerSlots(
    config: any, 
    equipment: any[], 
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): TargetingComputerSlots {
    const targetingComputers = equipment.filter(item => 
      item.name?.includes('Targeting Computer') || 
      item.equipmentData?.name?.includes('Targeting Computer')
    )
    
    if (targetingComputers.length === 0) {
      return { required: 0, allocated: 0, location: '', isCompliant: true }
    }
    
    const tonnage = config.tonnage || 50
    const required = SpecialComponentValidator.SPECIAL_COMPONENT_REQUIREMENTS.targetingComputer(tonnage)
    const allocated = targetingComputers.reduce((sum, tc) => sum + (tc.equipmentData?.criticals || 1), 0)
    const location = targetingComputers[0]?.location || 'centerTorso'
    
    const isCompliant = allocated >= required
    
    if (!isCompliant) {
      violations.push({
        location,
        type: 'special_component_violation',
        component: 'Targeting Computer',
        message: `Targeting Computer requires ${required} slots but only ${allocated} allocated`,
        severity: 'major',
        suggestedFix: `Allocate ${required - allocated} more slots for Targeting Computer`
      })
    }
    
    return { required, allocated, location, isCompliant }
  }

  // ===== HELPER METHODS =====

  private extractComponentType(component: any): string {
    if (typeof component === 'string') {
      return component
    }
    return component?.type || 'Standard'
  }

  private getEndoSteelLocations(config: any): string[] {
    // Typical Endo Steel distribution across multiple locations
    return ['leftTorso', 'rightTorso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']
  }

  private getFerroFibrousLocations(config: any): string[] {
    // Typical Ferro-Fibrous distribution across multiple locations
    return ['leftTorso', 'rightTorso', 'leftLeg', 'rightLeg', 'leftArm', 'rightArm']
  }

  private getEngineHeatSinks(config: any): number {
    const engineRating = config.engineRating || 0
    // Official BattleTech rule: free heat sinks = engine rating / 25 (rounded down), NO MINIMUM
    return Math.floor(engineRating / 25)
  }

  private createArtemisPairings(weapons: any[], artemisSystems: any[]) {
    return weapons.map((weapon, index) => ({
      weapon: weapon.name || weapon.equipmentData?.name || 'Unknown Weapon',
      artemisSystem: artemisSystems[index]?.name || 'Missing',
      location: weapon.location || 'unassigned',
      isValid: index < artemisSystems.length
    }))
  }
}