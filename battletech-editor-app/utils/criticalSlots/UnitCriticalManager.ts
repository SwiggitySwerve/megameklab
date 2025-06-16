/**
 * Unit Critical Manager - Unit-level equipment tracking and management
 * Aggregates all critical sections and manages equipment allocation across the entire unit
 */

import { CriticalSection, LocationSlotConfiguration, FixedSystemComponent } from './CriticalSection'
import { EquipmentObject, EquipmentAllocation } from './CriticalSlot'
import { EngineType, GyroType, SystemComponentRules } from './SystemComponentRules'

export interface UnitValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sectionResults: Array<{
    location: string
    result: any
  }>
}

export interface UnitConfiguration {
  engineType: EngineType
  gyroType: GyroType
  mass: number
  unitType: 'BattleMech' | 'IndustrialMech'
}

// Standard mech location configurations
const MECH_LOCATION_CONFIGS: LocationSlotConfiguration[] = [
  {
    location: 'Head',
    totalSlots: 6,
    fixedSlots: new Map([
      [0, { name: 'Life Support', slotIndex: 0, isRemovable: false, componentType: 'life_support' }],
      [1, { name: 'Sensors', slotIndex: 1, isRemovable: false, componentType: 'sensors' }],
      [2, { name: 'Standard Cockpit', slotIndex: 2, isRemovable: false, componentType: 'cockpit' }],
      [4, { name: 'Sensors', slotIndex: 4, isRemovable: false, componentType: 'sensors' }],
      [5, { name: 'Life Support', slotIndex: 5, isRemovable: false, componentType: 'life_support' }]
    ]),
    availableSlotIndices: [3], // Only slot 4 (index 3) available
    systemReservedSlots: []
  },
  {
    location: 'Center Torso',
    totalSlots: 12,
    fixedSlots: new Map(),
    availableSlotIndices: [], // Will be calculated based on engine/gyro
    systemReservedSlots: []
  },
  {
    location: 'Left Torso',
    totalSlots: 12,
    fixedSlots: new Map(),
    availableSlotIndices: [], // Will be calculated based on engine
    systemReservedSlots: []
  },
  {
    location: 'Right Torso',
    totalSlots: 12,
    fixedSlots: new Map(),
    availableSlotIndices: [], // Will be calculated based on engine
    systemReservedSlots: []
  },
  {
    location: 'Left Arm',
    totalSlots: 12,
    fixedSlots: new Map([
      [0, { name: 'Shoulder', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
      [1, { name: 'Upper Arm Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
      [2, { name: 'Lower Arm Actuator', slotIndex: 2, isRemovable: true, componentType: 'actuator' }],
      [3, { name: 'Hand Actuator', slotIndex: 3, isRemovable: true, componentType: 'actuator' }]
    ]),
    availableSlotIndices: [4, 5, 6, 7, 8, 9, 10, 11], // Slots 5-12 available
    systemReservedSlots: []
  },
  {
    location: 'Right Arm',
    totalSlots: 12,
    fixedSlots: new Map([
      [0, { name: 'Shoulder', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
      [1, { name: 'Upper Arm Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
      [2, { name: 'Lower Arm Actuator', slotIndex: 2, isRemovable: true, componentType: 'actuator' }],
      [3, { name: 'Hand Actuator', slotIndex: 3, isRemovable: true, componentType: 'actuator' }]
    ]),
    availableSlotIndices: [4, 5, 6, 7, 8, 9, 10, 11], // Slots 5-12 available
    systemReservedSlots: []
  },
  {
    location: 'Left Leg',
    totalSlots: 6,
    fixedSlots: new Map([
      [0, { name: 'Hip', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
      [1, { name: 'Upper Leg Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
      [2, { name: 'Lower Leg Actuator', slotIndex: 2, isRemovable: false, componentType: 'actuator' }],
      [3, { name: 'Foot Actuator', slotIndex: 3, isRemovable: false, componentType: 'actuator' }]
    ]),
    availableSlotIndices: [4, 5], // Only slots 5-6 available
    systemReservedSlots: []
  },
  {
    location: 'Right Leg',
    totalSlots: 6,
    fixedSlots: new Map([
      [0, { name: 'Hip', slotIndex: 0, isRemovable: false, componentType: 'actuator' }],
      [1, { name: 'Upper Leg Actuator', slotIndex: 1, isRemovable: false, componentType: 'actuator' }],
      [2, { name: 'Lower Leg Actuator', slotIndex: 2, isRemovable: false, componentType: 'actuator' }],
      [3, { name: 'Foot Actuator', slotIndex: 3, isRemovable: false, componentType: 'actuator' }]
    ]),
    availableSlotIndices: [4, 5], // Only slots 5-6 available
    systemReservedSlots: []
  }
]

export class UnitCriticalManager {
  private sections: Map<string, CriticalSection>
  private unallocatedEquipment: EquipmentAllocation[]
  private configuration: UnitConfiguration

  constructor(configuration: UnitConfiguration) {
    this.configuration = configuration
    this.sections = new Map()
    this.unallocatedEquipment = []
    
    this.initializeSections()
    this.allocateSystemComponents()
  }

  /**
   * Initialize all critical sections for the unit
   */
  private initializeSections(): void {
    MECH_LOCATION_CONFIGS.forEach(config => {
      const section = new CriticalSection(config.location, config)
      this.sections.set(config.location, section)
    })
  }

  /**
   * Allocate system components (engine, gyro) to appropriate slots
   */
  private allocateSystemComponents(): void {
    const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(
      this.configuration.engineType,
      this.configuration.gyroType
    )

    // Allocate engine slots
    this.allocateEngineSlots(systemAllocation.engine)
    
    // Allocate gyro slots
    this.allocateGyroSlots(systemAllocation.gyro)
  }

  /**
   * Allocate engine slots across torso sections
   */
  private allocateEngineSlots(engineAllocation: any): void {
    // Center Torso engine slots
    if (engineAllocation.centerTorso.length > 0) {
      const centerTorso = this.sections.get('Center Torso')
      if (centerTorso) {
        centerTorso.reserveSystemSlots('engine', engineAllocation.centerTorso)
      }
    }

    // Left Torso engine slots
    if (engineAllocation.leftTorso.length > 0) {
      const leftTorso = this.sections.get('Left Torso')
      if (leftTorso) {
        leftTorso.reserveSystemSlots('engine', engineAllocation.leftTorso)
      }
    }

    // Right Torso engine slots
    if (engineAllocation.rightTorso.length > 0) {
      const rightTorso = this.sections.get('Right Torso')
      if (rightTorso) {
        rightTorso.reserveSystemSlots('engine', engineAllocation.rightTorso)
      }
    }
  }

  /**
   * Allocate gyro slots in center torso
   */
  private allocateGyroSlots(gyroAllocation: any): void {
    if (gyroAllocation.centerTorso.length > 0) {
      const centerTorso = this.sections.get('Center Torso')
      if (centerTorso) {
        centerTorso.reserveSystemSlots('gyro', gyroAllocation.centerTorso)
      }
    }
  }

  /**
   * Get specific section by location name
   */
  getSection(location: string): CriticalSection | null {
    return this.sections.get(location) || null
  }

  /**
   * Get all sections
   */
  getAllSections(): CriticalSection[] {
    return Array.from(this.sections.values())
  }

  /**
   * Get all equipment across entire unit, organized by equipment ID
   */
  getAllEquipment(): Map<string, EquipmentAllocation[]> {
    const allEquipment = new Map<string, EquipmentAllocation[]>()
    
    // Collect from all sections
    this.sections.forEach(section => {
      section.getAllEquipment().forEach(allocation => {
        const equipmentId = allocation.equipmentData.id
        if (!allEquipment.has(equipmentId)) {
          allEquipment.set(equipmentId, [])
        }
        allEquipment.get(equipmentId)!.push(allocation)
      })
    })
    
    // Add unallocated equipment
    this.unallocatedEquipment.forEach(allocation => {
      const equipmentId = allocation.equipmentData.id
      if (!allEquipment.has(equipmentId)) {
        allEquipment.set(equipmentId, [])
      }
      allEquipment.get(equipmentId)!.push(allocation)
    })
    
    return allEquipment
  }

  /**
   * Get all equipment groups (each allocated instance)
   */
  getAllEquipmentGroups(): Array<{ groupId: string, equipmentReference: EquipmentAllocation }> {
    const groups: Array<{ groupId: string, equipmentReference: EquipmentAllocation }> = []
    
    // Collect from all sections
    this.sections.forEach(section => {
      section.getAllEquipment().forEach(allocation => {
        groups.push({
          groupId: allocation.equipmentGroupId,
          equipmentReference: allocation
        })
      })
    })
    
    // Add unallocated equipment
    this.unallocatedEquipment.forEach(allocation => {
      groups.push({
        groupId: allocation.equipmentGroupId,
        equipmentReference: allocation
      })
    })
    
    return groups
  }

  /**
   * Find equipment group by ID across all sections
   */
  findEquipmentGroup(equipmentGroupId: string): { section: CriticalSection | null, allocation: EquipmentAllocation } | null {
    // Search allocated equipment
    for (const section of Array.from(this.sections.values())) {
      const allocation = section.getAllEquipment().find((eq: EquipmentAllocation) => eq.equipmentGroupId === equipmentGroupId)
      if (allocation) {
        return { section, allocation }
      }
    }
    
    // Search unallocated equipment
    const unallocated = this.unallocatedEquipment.find((eq: EquipmentAllocation) => eq.equipmentGroupId === equipmentGroupId)
    if (unallocated) {
      return { section: null, allocation: unallocated }
    }
    
    return null
  }

  /**
   * Get equipment by location
   */
  getEquipmentByLocation(): Map<string, EquipmentAllocation[]> {
    const equipmentByLocation = new Map<string, EquipmentAllocation[]>()
    
    this.sections.forEach((section, location) => {
      const equipment = section.getAllEquipment()
      if (equipment.length > 0) {
        equipmentByLocation.set(location, equipment)
      }
    })
    
    // Add unallocated as special location
    if (this.unallocatedEquipment.length > 0) {
      equipmentByLocation.set('Unallocated', [...this.unallocatedEquipment])
    }
    
    return equipmentByLocation
  }

  /**
   * Get unallocated equipment
   */
  getUnallocatedEquipment(): EquipmentAllocation[] {
    return [...this.unallocatedEquipment]
  }

  /**
   * Add equipment to unallocated pool
   */
  addUnallocatedEquipment(equipment: EquipmentAllocation[]): void {
    equipment.forEach(eq => {
      // Clear location info since it's unallocated
      eq.location = ''
      eq.occupiedSlots = []
      eq.startSlotIndex = -1
      eq.endSlotIndex = -1
    })
    
    this.unallocatedEquipment.push(...equipment)
  }

  /**
   * Remove equipment from unallocated pool
   */
  removeUnallocatedEquipment(equipmentGroupId: string): EquipmentAllocation | null {
    const index = this.unallocatedEquipment.findIndex(eq => eq.equipmentGroupId === equipmentGroupId)
    if (index >= 0) {
      return this.unallocatedEquipment.splice(index, 1)[0]
    }
    return null
  }

  /**
   * Move equipment to unallocated pool
   */
  displaceEquipment(equipmentGroupId: string): boolean {
    const found = this.findEquipmentGroup(equipmentGroupId)
    if (!found || !found.section) return false
    
    const removedEquipment = found.section.removeEquipmentGroup(equipmentGroupId)
    if (removedEquipment) {
      this.addUnallocatedEquipment([removedEquipment])
      return true
    }
    return false
  }

  /**
   * Attempt to allocate equipment from unallocated pool
   */
  allocateEquipmentFromPool(equipmentGroupId: string, location: string, startSlot: number): boolean {
    const equipment = this.removeUnallocatedEquipment(equipmentGroupId)
    if (!equipment) return false
    
    const section = this.getSection(location)
    if (!section) {
      // Restore to unallocated if section not found
      this.addUnallocatedEquipment([equipment])
      return false
    }
    
    const success = section.allocateEquipment(equipment.equipmentData, startSlot, equipmentGroupId)
    if (!success) {
      // Restore to unallocated if allocation failed
      this.addUnallocatedEquipment([equipment])
    }
    
    return success
  }

  /**
   * Get current unit configuration
   */
  getConfiguration(): UnitConfiguration {
    return { ...this.configuration }
  }

  /**
   * Get engine type
   */
  getEngineType(): EngineType {
    return this.configuration.engineType
  }

  /**
   * Get gyro type
   */
  getGyroType(): GyroType {
    return this.configuration.gyroType
  }

  /**
   * Get total allocated equipment count
   */
  getAllocatedEquipmentCount(): number {
    let count = 0
    this.sections.forEach(section => {
      count += section.getAllEquipment().length
    })
    return count
  }

  /**
   * Get total unallocated equipment count
   */
  getUnallocatedEquipmentCount(): number {
    return this.unallocatedEquipment.length
  }

  /**
   * Validate entire unit
   */
  validate(): UnitValidationResult {
    const result: UnitValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      sectionResults: []
    }
    
    // Validate system components
    const systemValidation = SystemComponentRules.validateSystemComponents(
      this.configuration.engineType,
      this.configuration.gyroType
    )
    
    if (!systemValidation.isValid) {
      result.isValid = false
      result.errors.push(...systemValidation.errors)
    }
    result.warnings.push(...systemValidation.warnings)
    
    // Validate each section
    this.sections.forEach((section, location) => {
      const sectionResult = section.validate()
      result.sectionResults.push({
        location,
        result: sectionResult
      })
      
      if (!sectionResult.isValid) {
        result.isValid = false
        result.errors.push(...sectionResult.errors.map(err => `${location}: ${err}`))
      }
      
      result.warnings.push(...sectionResult.warnings.map(warn => `${location}: ${warn}`))
    })
    
    return result
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalSections: number
    totalSlots: number
    occupiedSlots: number
    availableSlots: number
    totalEquipment: number
    unallocatedEquipment: number
    systemSlots: number
  } {
    let totalSlots = 0
    let occupiedSlots = 0
    let systemSlots = 0
    
    this.sections.forEach(section => {
      totalSlots += section.getTotalSlots()
      section.getAllSlots().forEach(slot => {
        if (!slot.isEmpty()) {
          occupiedSlots++
          if (slot.isSystemSlot()) {
            systemSlots++
          }
        }
      })
    })
    
    return {
      totalSections: this.sections.size,
      totalSlots,
      occupiedSlots,
      availableSlots: totalSlots - occupiedSlots,
      totalEquipment: this.getAllocatedEquipmentCount(),
      unallocatedEquipment: this.getUnallocatedEquipmentCount(),
      systemSlots
    }
  }
}
