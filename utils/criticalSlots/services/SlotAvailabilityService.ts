/**
 * Slot Availability Service
 * Calculates available critical slots in each location considering fixed components and system reservations
 */

export interface AvailableSlots {
  total: number
  byLocation: {
    Head: number
    'Center Torso': number
    'Left Torso': number
    'Right Torso': number
    'Left Arm': number
    'Right Arm': number
    'Left Leg': number
    'Right Leg': number
  }
  systemReserved: {
    [location: string]: number
  }
  fixedComponents: {
    [location: string]: string[]
  }
  availableForEquipment: {
    [location: string]: number
  }
}

export interface LocationCapacity {
  location: string
  totalSlots: number
  fixedSlots: number
  systemSlots: number
  availableSlots: number
  reservedFor: string[]
  restrictions: string[]
}

/**
 * Standard BattleMech slot configuration
 */
const STANDARD_SLOT_CONFIGURATION = {
  'Head': {
    total: 6,
    fixed: ['Life Support', 'Sensors', 'Cockpit', 'Sensors', 'Life Support'], // Slots 1, 2, 3, 5, 6
    availableSlots: [3] // Only slot 4 (index 3) available for equipment
  },
  'Center Torso': {
    total: 12,
    fixed: [], // No fixed components
    availableSlots: [] // All slots available (subject to engine/gyro)
  },
  'Left Torso': {
    total: 12,
    fixed: [], // No fixed components
    availableSlots: [] // All slots available (subject to engine)
  },
  'Right Torso': {
    total: 12,
    fixed: [], // No fixed components
    availableSlots: [] // All slots available (subject to engine)
  },
  'Left Arm': {
    total: 12,
    fixed: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator'], // Slots 1-4
    availableSlots: [4, 5, 6, 7, 8, 9, 10, 11] // Slots 5-12 available
  },
  'Right Arm': {
    total: 12,
    fixed: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator'], // Slots 1-4
    availableSlots: [4, 5, 6, 7, 8, 9, 10, 11] // Slots 5-12 available
  },
  'Left Leg': {
    total: 6,
    fixed: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator'], // Slots 1-4
    availableSlots: [4, 5] // Only slots 5-6 available
  },
  'Right Leg': {
    total: 6,
    fixed: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator'], // Slots 1-4
    availableSlots: [4, 5] // Only slots 5-6 available
  }
}

export class SlotAvailabilityService {
  /**
   * Calculate available slots for all locations
   */
  calculateAvailableSlots(config: any): AvailableSlots {
    const byLocation = this.calculateLocationAvailability(config)
    const systemReserved = this.calculateSystemReservedSlots(config)
    const fixedComponents = this.getFixedComponents()
    const availableForEquipment = this.calculateEquipmentAvailableSlots(byLocation, systemReserved)
    
    const total = Object.values(byLocation).reduce((sum, slots) => sum + slots, 0)
    
    return {
      total,
      byLocation,
      systemReserved,
      fixedComponents,
      availableForEquipment
    }
  }

  /**
   * Get detailed capacity information for each location
   */
  getLocationCapacities(config: any): LocationCapacity[] {
    const locations = Object.keys(STANDARD_SLOT_CONFIGURATION)
    
    return locations.map(location => {
      const slotConfig = STANDARD_SLOT_CONFIGURATION[location as keyof typeof STANDARD_SLOT_CONFIGURATION]
      const systemSlots = this.getSystemSlotsForLocation(location, config)
      const availableSlots = slotConfig.total - slotConfig.fixed.length - systemSlots
      
      return {
        location,
        totalSlots: slotConfig.total,
        fixedSlots: slotConfig.fixed.length,
        systemSlots,
        availableSlots: Math.max(0, availableSlots),
        reservedFor: this.getReservedForLocation(location, config),
        restrictions: this.getLocationRestrictions(location)
      }
    })
  }

  /**
   * Find locations with available slots for equipment
   */
  findAvailableLocations(requiredSlots: number, config: any): string[] {
    const availableSlots = this.calculateAvailableSlots(config)
    
    return Object.entries(availableSlots.availableForEquipment)
      .filter(([_, slots]) => slots >= requiredSlots)
      .map(([location, _]) => location)
      .sort((a, b) => availableSlots.availableForEquipment[b] - availableSlots.availableForEquipment[a])
  }

  /**
   * Get the most available location
   */
  getMostAvailableLocation(config: any): string {
    const availableSlots = this.calculateAvailableSlots(config)
    
    return Object.entries(availableSlots.availableForEquipment)
      .reduce((best, [location, slots]) => 
        slots > availableSlots.availableForEquipment[best] ? location : best,
        'Center Torso'
      )
  }

  /**
   * Check if a location can accommodate equipment
   */
  canAccommodateEquipment(location: string, requiredSlots: number, config: any): boolean {
    const availableSlots = this.calculateAvailableSlots(config)
    return availableSlots.availableForEquipment[location] >= requiredSlots
  }

  /**
   * Calculate efficiency of slot usage
   */
  calculateSlotEfficiency(config: any, usedSlots: { [location: string]: number }): number {
    const availableSlots = this.calculateAvailableSlots(config)
    let totalUsed = 0
    let totalAvailable = 0
    
    Object.keys(availableSlots.byLocation).forEach(location => {
      const used = usedSlots[location] || 0
      const available = availableSlots.byLocation[location as keyof typeof availableSlots.byLocation]
      
      totalUsed += used
      totalAvailable += available
    })
    
    return totalAvailable > 0 ? (totalUsed / totalAvailable) * 100 : 0
  }

  private calculateLocationAvailability(config: any) {
    const availability: any = {}
    
    Object.entries(STANDARD_SLOT_CONFIGURATION).forEach(([location, slotConfig]) => {
      const systemSlots = this.getSystemSlotsForLocation(location, config)
      const availableSlots = slotConfig.total - slotConfig.fixed.length - systemSlots
      availability[location] = Math.max(0, availableSlots)
    })
    
    return availability
  }

  private calculateSystemReservedSlots(config: any) {
    return {
      'Center Torso': this.getEngineSlots(config.engineType) + this.getGyroSlots(config.gyroType),
      'Left Torso': this.getSideTorsoEngineSlots(config.engineType),
      'Right Torso': this.getSideTorsoEngineSlots(config.engineType),
      'Head': 0,
      'Left Arm': 0,
      'Right Arm': 0,
      'Left Leg': 0,
      'Right Leg': 0
    }
  }

  private getFixedComponents() {
    const fixed: any = {}
    
    Object.entries(STANDARD_SLOT_CONFIGURATION).forEach(([location, config]) => {
      fixed[location] = config.fixed
    })
    
    return fixed
  }

  private calculateEquipmentAvailableSlots(byLocation: any, systemReserved: any) {
    const available: any = {}
    
    Object.keys(byLocation).forEach(location => {
      const locationSlots = byLocation[location]
      const reservedSlots = systemReserved[location] || 0
      available[location] = Math.max(0, locationSlots - reservedSlots)
    })
    
    return available
  }

  private getSystemSlotsForLocation(location: string, config: any): number {
    switch (location) {
      case 'Center Torso':
        return this.getEngineSlots(config.engineType) + this.getGyroSlots(config.gyroType)
      case 'Left Torso':
      case 'Right Torso':
        return this.getSideTorsoEngineSlots(config.engineType)
      default:
        return 0
    }
  }

  private getEngineSlots(engineType: string): number {
    if (engineType?.includes('XL')) return 3 // XL engines take 3 slots in center torso
    if (engineType?.includes('Light')) return 2 // Light engines
    if (engineType?.includes('Compact')) return 6 // Compact engines take more slots
    return 0 // Standard engines take 0 critical slots
  }

  private getSideTorsoEngineSlots(engineType: string): number {
    if (engineType?.includes('XL')) return 3 // XL engines take 3 slots in each side torso
    if (engineType?.includes('Light')) return 1 // Light engines
    return 0 // Standard and most other engines
  }

  private getGyroSlots(gyroType: string): number {
    const gyroTypeStr = typeof gyroType === 'string' ? gyroType : gyroType?.type || 'Standard'
    
    if (gyroTypeStr.includes('XL')) return 6
    if (gyroTypeStr.includes('Compact')) return 2
    if (gyroTypeStr.includes('Heavy Duty')) return 4
    return 4 // Standard gyro
  }

  private getReservedForLocation(location: string, config: any): string[] {
    const reserved: string[] = []
    
    switch (location) {
      case 'Center Torso':
        if (this.getEngineSlots(config.engineType) > 0) {
          reserved.push('Engine')
        }
        reserved.push('Gyro')
        break
      case 'Left Torso':
      case 'Right Torso':
        if (this.getSideTorsoEngineSlots(config.engineType) > 0) {
          reserved.push('Engine')
        }
        break
      case 'Head':
        reserved.push('Life Support', 'Sensors', 'Cockpit')
        break
      case 'Left Arm':
      case 'Right Arm':
        reserved.push('Actuators')
        break
      case 'Left Leg':
      case 'Right Leg':
        reserved.push('Actuators')
        break
    }
    
    return reserved
  }

  private getLocationRestrictions(location: string): string[] {
    const restrictions: string[] = []
    
    switch (location) {
      case 'Head':
        restrictions.push('No ammunition', 'No explosive equipment', 'Limited space')
        break
      case 'Center Torso':
        restrictions.push('Engine interference possible')
        break
      case 'Left Torso':
      case 'Right Torso':
        restrictions.push('Engine interference possible', 'Vulnerable to side attacks')
        break
      case 'Left Arm':
      case 'Right Arm':
        restrictions.push('Actuator interference', 'Targeting priority')
        break
      case 'Left Leg':
      case 'Right Leg':
        restrictions.push('Mobility critical', 'Limited space')
        break
    }
    
    return restrictions
  }
}