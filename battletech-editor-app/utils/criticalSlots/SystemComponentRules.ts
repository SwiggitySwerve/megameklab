/**
 * System Component Rules - Engine and Gyro slot allocation rules
 * Handles the complex logic for placing system components in critical slots
 */

export type EngineType = 'Standard' | 'XL' | 'Light' | 'XXL' | 'Compact'
export type GyroType = 'Standard' | 'XL' | 'Compact' | 'Heavy-Duty'

export interface SystemAllocation {
  centerTorso: number[]
  leftTorso: number[]
  rightTorso: number[]
}

export interface SystemComponentChange {
  engineType: EngineType
  gyroType: GyroType
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class SystemComponentRules {
  /**
   * Get gyro slot allocation based on gyro type
   */
  static getGyroAllocation(gyroType: GyroType): SystemAllocation {
    const allocation: SystemAllocation = {
      centerTorso: [],
      leftTorso: [],
      rightTorso: []
    }

    switch (gyroType) {
      case 'Standard':
        allocation.centerTorso = [3, 4, 5, 6] // Slots 4-7
        break
      case 'XL':
        allocation.centerTorso = [3, 4, 5, 6, 7, 8] // Slots 4-9
        break
      case 'Compact':
        allocation.centerTorso = [3, 4] // Slots 4-5
        break
      case 'Heavy-Duty':
        allocation.centerTorso = [3, 4, 5, 6] // Slots 4-7
        break
    }

    return allocation
  }

  /**
   * Get engine slot allocation based on engine type and gyro configuration
   */
  static getEngineAllocation(engineType: EngineType, gyroType: GyroType): SystemAllocation {
    const allocation: SystemAllocation = {
      centerTorso: [0, 1, 2], // ALL engines ALWAYS take CT slots 1-3
      leftTorso: [],
      rightTorso: []
    }

    // XL engines add additional slots
    if (engineType === 'XL') {
      allocation.leftTorso = [0, 1, 2]  // LT slots 1-3
      allocation.rightTorso = [0, 1, 2] // RT slots 1-3
      
      // Additional CT slots after gyro
      const gyroAllocation = this.getGyroAllocation(gyroType)
      const gyroEndSlot = Math.max(...gyroAllocation.centerTorso)
      
      // XL engine takes 3 slots after gyro ends
      allocation.centerTorso.push(gyroEndSlot + 1, gyroEndSlot + 2, gyroEndSlot + 3)
    }
    
    // Light engines add reduced side torso slots
    if (engineType === 'Light') {
      allocation.leftTorso = [0, 1]   // LT slots 1-2
      allocation.rightTorso = [0, 1]  // RT slots 1-2
    }

    return allocation
  }

  /**
   * Get complete system component allocation for both engine and gyro
   */
  static getCompleteSystemAllocation(engineType: EngineType, gyroType: GyroType): {
    engine: SystemAllocation
    gyro: SystemAllocation
    combined: SystemAllocation
  } {
    const engineAllocation = this.getEngineAllocation(engineType, gyroType)
    const gyroAllocation = this.getGyroAllocation(gyroType)

    // Combine allocations for conflict detection
    const combined: SystemAllocation = {
      centerTorso: [...engineAllocation.centerTorso, ...gyroAllocation.centerTorso],
      leftTorso: [...engineAllocation.leftTorso],
      rightTorso: [...engineAllocation.rightTorso]
    }

    return {
      engine: engineAllocation,
      gyro: gyroAllocation,
      combined
    }
  }

  /**
   * Validate system component compatibility
   */
  static validateSystemComponents(engineType: EngineType, gyroType: GyroType): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      const allocation = this.getCompleteSystemAllocation(engineType, gyroType)
      
      // Check for slot overflow in center torso
      const maxCenterTorsoSlot = Math.max(...allocation.combined.centerTorso)
      if (maxCenterTorsoSlot >= 12) {
        result.isValid = false
        result.errors.push(
          `${engineType} engine with ${gyroType} gyro requires slot ${maxCenterTorsoSlot + 1}, but Center Torso only has 12 slots`
        )
      }

      // Check for incompatible combinations
      if (engineType === 'XXL' && gyroType === 'XL') {
        result.warnings.push('XXL Engine with XL Gyro combination may be unstable')
      }

      // Check for slot overlaps (shouldn't happen with correct logic)
      const centerTorsoSlots = allocation.combined.centerTorso
      const uniqueSlots = new Set(centerTorsoSlots)
      if (uniqueSlots.size !== centerTorsoSlots.length) {
        result.isValid = false
        result.errors.push('System component slot overlap detected')
      }

    } catch (error: any) {
      result.isValid = false
      result.errors.push(`System validation error: ${error?.message || 'Unknown error'}`)
    }

    return result
  }

  /**
   * Get available equipment slots after system components are placed
   */
  static getAvailableEquipmentSlots(engineType: EngineType, gyroType: GyroType): {
    [location: string]: number[]
  } {
    const allocation = this.getCompleteSystemAllocation(engineType, gyroType)
    
    // Total slots per location
    const locationSlots = {
      'Head': 6,
      'Center Torso': 12,
      'Left Torso': 12,
      'Right Torso': 12,
      'Left Arm': 12,
      'Right Arm': 12,
      'Left Leg': 6,
      'Right Leg': 6
    }

    // Fixed system slots (actuators, life support, etc.)
    const fixedSlots = {
      'Head': [0, 1, 2, 4, 5], // Life support, sensors, cockpit
      'Left Arm': [0, 1, 2, 3], // Shoulder, upper arm, lower arm, hand
      'Right Arm': [0, 1, 2, 3],
      'Left Leg': [0, 1, 2, 3], // Hip, upper leg, lower leg, foot
      'Right Leg': [0, 1, 2, 3],
      'Left Torso': [],
      'Right Torso': [],
      'Center Torso': []
    }

    const availableSlots: { [location: string]: number[] } = {}

    Object.entries(locationSlots).forEach(([location, totalSlots]) => {
      const systemSlots = allocation.combined[location as keyof SystemAllocation] || []
      const fixed = fixedSlots[location as keyof typeof fixedSlots] || []
      const occupiedSlots = new Set([...systemSlots, ...fixed])
      
      availableSlots[location] = []
      for (let i = 0; i < totalSlots; i++) {
        if (!occupiedSlots.has(i)) {
          availableSlots[location].push(i)
        }
      }
    })

    return availableSlots
  }

  /**
   * Calculate maximum equipment size that can fit in each location
   */
  static getMaxEquipmentSizes(engineType: EngineType, gyroType: GyroType): {
    [location: string]: number
  } {
    const availableSlots = this.getAvailableEquipmentSlots(engineType, gyroType)
    const maxSizes: { [location: string]: number } = {}

    Object.entries(availableSlots).forEach(([location, slots]) => {
      // Find largest contiguous block
      if (slots.length === 0) {
        maxSizes[location] = 0
        return
      }

      slots.sort((a, b) => a - b)
      let maxContiguous = 1
      let currentContiguous = 1

      for (let i = 1; i < slots.length; i++) {
        if (slots[i] === slots[i - 1] + 1) {
          currentContiguous++
        } else {
          maxContiguous = Math.max(maxContiguous, currentContiguous)
          currentContiguous = 1
        }
      }

      maxSizes[location] = Math.max(maxContiguous, currentContiguous)
    })

    return maxSizes
  }

  /**
   * Check if specific equipment can fit in location with given system configuration
   */
  static canEquipmentFit(
    equipmentSlots: number,
    location: string,
    engineType: EngineType,
    gyroType: GyroType
  ): boolean {
    const maxSizes = this.getMaxEquipmentSizes(engineType, gyroType)
    return (maxSizes[location] || 0) >= equipmentSlots
  }

  /**
   * Get displacement impact for system component change
   */
  static getDisplacementImpact(
    oldEngineType: EngineType,
    oldGyroType: GyroType,
    newEngineType: EngineType,
    newGyroType: GyroType
  ): {
    affectedLocations: string[]
    conflictSlots: { [location: string]: number[] }
    severity: 'low' | 'medium' | 'high'
  } {
    const oldAllocation = this.getCompleteSystemAllocation(oldEngineType, oldGyroType)
    const newAllocation = this.getCompleteSystemAllocation(newEngineType, newGyroType)
    
    const affectedLocations: string[] = []
    const conflictSlots: { [location: string]: number[] } = {}

    // Check each location for changes
    const locations: (keyof SystemAllocation)[] = ['centerTorso', 'leftTorso', 'rightTorso']
    locations.forEach((location: keyof SystemAllocation) => {
      const oldSlots = new Set(oldAllocation.combined[location])
      const newSlots = new Set(newAllocation.combined[location])
      
      // Find slots that changed from available to system-occupied
      const newlyOccupied = Array.from(newSlots).filter(slot => !oldSlots.has(slot))
      
      if (newlyOccupied.length > 0) {
        const locationName = location === 'centerTorso' ? 'Center Torso' :
                           location === 'leftTorso' ? 'Left Torso' : 'Right Torso'
        affectedLocations.push(locationName)
        conflictSlots[locationName] = newlyOccupied
      }
    })

    // Determine severity
    const totalConflictSlots = Object.values(conflictSlots).flat().length
    const severity = totalConflictSlots === 0 ? 'low' : 
                    totalConflictSlots <= 6 ? 'medium' : 'high'

    return {
      affectedLocations,
      conflictSlots,
      severity
    }
  }

  /**
   * Get human-readable description of system component requirements
   */
  static getSystemDescription(engineType: EngineType, gyroType: GyroType): string {
    const allocation = this.getCompleteSystemAllocation(engineType, gyroType)
    const descriptions: string[] = []

    // Engine description
    const engineSlots = allocation.engine
    if (engineSlots.centerTorso.length > 3) {
      descriptions.push(
        `${engineType} Engine: CT slots ${engineSlots.centerTorso.map(s => s + 1).join(', ')}`
      )
    } else {
      descriptions.push(`${engineType} Engine: CT slots 1-3`)
    }

    if (engineSlots.leftTorso.length > 0) {
      descriptions.push(`  + LT slots ${engineSlots.leftTorso.map(s => s + 1).join(', ')}`)
    }
    if (engineSlots.rightTorso.length > 0) {
      descriptions.push(`  + RT slots ${engineSlots.rightTorso.map(s => s + 1).join(', ')}`)
    }

    // Gyro description
    descriptions.push(
      `${gyroType} Gyro: CT slots ${allocation.gyro.centerTorso.map(s => s + 1).join(', ')}`
    )

    return descriptions.join('\n')
  }
}
