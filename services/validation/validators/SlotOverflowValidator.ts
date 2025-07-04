/**
 * Slot Overflow Validator
 * Validates that equipment doesn't exceed critical slot capacity in any location
 * Part of the Chain of Responsibility validation pattern
 */

import { 
  CriticalSlotValidation, 
  CriticalSlotViolation, 
  SlotUtilization,
  CriticalSlotValidationContext 
} from '../types/CriticalSlotValidationTypes'

export interface ValidationRequest {
  config: any
  equipment: any[]
  context: CriticalSlotValidationContext
  result: CriticalSlotValidation
}

export abstract class BaseSlotValidator {
  protected nextValidator: BaseSlotValidator | null = null

  setNext(validator: BaseSlotValidator): BaseSlotValidator {
    this.nextValidator = validator
    return validator
  }

  handle(request: ValidationRequest): void {
    this.validate(request)
    
    if (this.nextValidator) {
      this.nextValidator.handle(request)
    }
  }

  protected abstract validate(request: ValidationRequest): void
}

export class SlotOverflowValidator extends BaseSlotValidator {
  // Standard slot counts by location for bipedal mechs
  private static readonly LOCATION_SLOT_COUNTS = {
    'head': 6,
    'centerTorso': 12,
    'leftTorso': 12,
    'rightTorso': 12,
    'leftArm': 12,
    'rightArm': 12,
    'leftLeg': 6,
    'rightLeg': 6
  }

  protected validate(request: ValidationRequest): void {
    const { config, equipment, result } = request
    
    // Calculate slot utilization if not already done
    if (!result.locationUtilization) {
      result.locationUtilization = this.calculateLocationUtilization(config, equipment)
    }

    // Validate slot overflow in each location
    this.validateSlotOverflow(result.locationUtilization, result.violations, result.recommendations)
    
    // Update overall validity
    const hasOverflow = result.violations.some(v => v.type === 'overflow' && v.severity === 'critical')
    if (hasOverflow) {
      result.isValid = false
    }
  }

  /**
   * Calculate slot utilization for each location
   */
  private calculateLocationUtilization(config: any, equipment: any[]): { [location: string]: SlotUtilization } {
    const utilization: { [location: string]: SlotUtilization } = {}
    
    // Initialize all locations
    Object.entries(SlotOverflowValidator.LOCATION_SLOT_COUNTS).forEach(([location, available]) => {
      utilization[location] = {
        used: 0,
        available,
        utilization: 0,
        overflow: false,
        components: []
      }
    })
    
    // Add system components (engine, gyro, cockpit)
    this.addSystemComponentSlots(config, utilization)
    
    // Add equipment slots
    equipment.forEach(item => {
      const location = item.location || this.getDefaultLocation(item)
      const slots = item.equipmentData?.criticals || this.getComponentSlots(item)
      
      if (utilization[location]) {
        utilization[location].used += slots
        utilization[location].components.push({
          id: item.id || `${item.name}_${Math.random()}`,
          name: item.equipmentData?.name || item.name || 'Unknown',
          type: item.equipmentData?.type || 'equipment',
          slots,
          location,
          canRelocate: this.canRelocateComponent(item)
        })
      }
    })
    
    // Calculate utilization percentages and overflow
    Object.keys(utilization).forEach(location => {
      const util = utilization[location]
      util.utilization = util.available > 0 ? (util.used / util.available) * 100 : 0
      util.overflow = util.used > util.available
    })
    
    return utilization
  }

  /**
   * Add system component slots (engine, gyro, cockpit)
   */
  private addSystemComponentSlots(config: any, utilization: { [location: string]: SlotUtilization }): void {
    const engineRating = config.engineRating || 0
    const engineType = config.engineType || 'Standard'
    const gyroType = this.extractComponentType(config.gyroType)
    
    // Engine slots (center torso)
    const engineSlots = this.getEngineSlots(engineRating, engineType)
    if (utilization.centerTorso && engineSlots > 0) {
      utilization.centerTorso.used += engineSlots
      utilization.centerTorso.components.push({
        id: 'engine',
        name: `${engineType} Engine ${engineRating}`,
        type: 'engine',
        slots: engineSlots,
        location: 'centerTorso',
        canRelocate: false
      })
    }
    
    // Gyro slots (center torso)
    const gyroSlots = this.getGyroSlots(engineRating, gyroType)
    if (utilization.centerTorso && gyroSlots > 0) {
      utilization.centerTorso.used += gyroSlots
      utilization.centerTorso.components.push({
        id: 'gyro',
        name: `${gyroType} Gyro`,
        type: 'gyro',
        slots: gyroSlots,
        location: 'centerTorso',
        canRelocate: false
      })
    }
    
    // Cockpit slots (head)
    const cockpitSlots = 1
    if (utilization.head) {
      utilization.head.used += cockpitSlots
      utilization.head.components.push({
        id: 'cockpit',
        name: 'Cockpit',
        type: 'cockpit',
        slots: cockpitSlots,
        location: 'head',
        canRelocate: false
      })
    }
  }

  /**
   * Validate slot overflow in locations
   */
  private validateSlotOverflow(
    locationUtilization: { [location: string]: SlotUtilization },
    violations: CriticalSlotViolation[],
    recommendations: string[]
  ): void {
    Object.entries(locationUtilization).forEach(([location, util]) => {
      if (util.overflow) {
        const excess = util.used - util.available
        violations.push({
          location,
          type: 'overflow',
          message: `Location ${location} has ${util.used} slots used but only ${util.available} available (${excess} excess)`,
          severity: 'critical',
          suggestedFix: `Move ${excess} slot(s) of equipment to other locations`
        })
        
        recommendations.push(`Relocate equipment from ${location} to reduce slot usage by ${excess}`)
      } else if (util.utilization > 90) {
        recommendations.push(`Location ${location} is ${util.utilization.toFixed(1)}% full - consider redistributing equipment`)
      } else if (util.utilization > 80) {
        recommendations.push(`Location ${location} is approaching capacity at ${util.utilization.toFixed(1)}%`)
      }
    })
  }

  /**
   * Get engine slot requirements
   */
  private getEngineSlots(engineRating: number, engineType: string): number {
    if (engineRating <= 0) return 0
    
    switch (engineType) {
      case 'XL':
      case 'XL (Clan)':
        return 6 // XL engines take 6 slots in center torso (plus side torsos)
      case 'Light':
      case 'Light (Clan)':
        return 2 // Light engines take fewer slots
      case 'Compact':
        return 6 // Compact engines take more slots in center torso
      default:
        return 0 // Standard engines take 0 critical slots
    }
  }

  /**
   * Get gyro slot requirements
   */
  private getGyroSlots(engineRating: number, gyroType: string): number {
    switch (gyroType) {
      case 'Compact':
        return 2 // Compact gyro
      case 'Heavy Duty':
        return 4 // Same as standard
      case 'XL':
        return 6 // XL gyro
      default:
        return 4 // Standard gyro
    }
  }

  /**
   * Get default location for unplaced equipment
   */
  private getDefaultLocation(item: any): string {
    const type = item.equipmentData?.type || item.type || 'equipment'
    
    switch (type) {
      case 'weapon':
        return 'rightArm' // Default weapon placement
      case 'ammunition':
        return 'leftTorso' // Default ammo placement
      case 'jumpjet':
        return 'centerTorso' // Jump jets go in torso/legs
      case 'heatsink':
        return 'leftTorso' // Heat sinks in torso
      default:
        return 'centerTorso' // Default to center torso
    }
  }

  /**
   * Get component slot requirements
   */
  private getComponentSlots(item: any): number {
    if (item.equipmentData?.criticals) {
      return item.equipmentData.criticals
    }
    
    // Default slot requirements by type
    const type = item.equipmentData?.type || item.type || 'equipment'
    switch (type) {
      case 'weapon':
        return item.tonnage ? Math.ceil(item.tonnage) : 1
      case 'ammunition':
        return 1
      case 'jumpjet':
        return 1
      case 'heatsink':
        return item.name?.includes('Double') ? 3 : 1
      default:
        return 1
    }
  }

  /**
   * Check if component can be relocated
   */
  private canRelocateComponent(item: any): boolean {
    const type = item.equipmentData?.type || item.type || 'equipment'
    
    // System components cannot be relocated
    if (['engine', 'gyro', 'cockpit'].includes(type)) {
      return false
    }
    
    // Most equipment can be relocated
    return true
  }

  /**
   * Extract component type from configuration
   */
  private extractComponentType(component: any): string {
    if (typeof component === 'string') {
      return component
    }
    return component?.type || 'Standard'
  }
}