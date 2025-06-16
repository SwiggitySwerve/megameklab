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

// Extended equipment interface for special components
export interface SpecialEquipmentObject extends EquipmentObject {
  componentType?: 'structure' | 'armor'
}

export interface UnitConfiguration {
  // Core mech properties
  tonnage: number                    // 20-100 tons in 5-ton increments
  unitType: 'BattleMech' | 'IndustrialMech'
  techBase: 'Inner Sphere' | 'Clan'  // Determines available tech options
  
  // Movement and engine
  walkMP: number                     // 1-20+ movement points
  engineRating: number               // Auto-calculated from tonnage × walkMP, max 400
  runMP: number                      // Auto-calculated (walkMP × 1.5, rounded down)
  engineType: EngineType
  
  // System components
  gyroType: GyroType
  structureType: StructureType
  armorType: ArmorType
  
  // Heat management
  heatSinkType: HeatSinkType
  totalHeatSinks: number             // User configurable, minimum 10
  internalHeatSinks: number          // Auto-calculated from engine rating
  externalHeatSinks: number          // Auto-calculated (total - internal)
  
  // Legacy compatibility
  mass: number                       // Alias for tonnage
}

// Import additional types
export type StructureType = 'Standard' | 'Endo Steel' | 'Endo Steel (Clan)' | 'Composite' | 'Reinforced' | 'Industrial'
export type ArmorType = 'Standard' | 'Ferro-Fibrous' | 'Ferro-Fibrous (Clan)' | 'Light Ferro-Fibrous' | 'Heavy Ferro-Fibrous' | 'Stealth' | 'Reactive' | 'Reflective' | 'Hardened'
export type HeatSinkType = 'Single' | 'Double' | 'Double (Clan)' | 'Compact' | 'Laser'

/**
 * Legacy configuration interface for backwards compatibility
 */
export interface LegacyUnitConfiguration {
  engineType: EngineType
  gyroType: GyroType
  mass: number
  unitType: 'BattleMech' | 'IndustrialMech'
}

/**
 * Utility functions for unit configuration
 */
export class UnitConfigurationBuilder {
  /**
   * Create a complete UnitConfiguration from legacy or partial configuration
   */
  static buildConfiguration(input: Partial<UnitConfiguration> | LegacyUnitConfiguration): UnitConfiguration {
    // Handle legacy configuration
    if ('mass' in input && !('tonnage' in input)) {
      return this.fromLegacyConfiguration(input as LegacyUnitConfiguration)
    }
    
    // Handle partial configuration
    const defaults = this.getDefaultConfiguration()
    const config = { ...defaults, ...input } as UnitConfiguration
    
    // Calculate dependent values
    return this.calculateDependentValues(config)
  }
  
  /**
   * Convert legacy configuration to new format
   */
  private static fromLegacyConfiguration(legacy: LegacyUnitConfiguration): UnitConfiguration {
    const tonnage = legacy.mass
    const walkMP = 4 // Default reasonable walk speed
    
    return this.calculateDependentValues({
      tonnage,
      unitType: legacy.unitType,
      techBase: 'Inner Sphere',
      walkMP,
      engineRating: tonnage * walkMP,
      runMP: Math.floor(walkMP * 1.5),
      engineType: legacy.engineType,
      gyroType: legacy.gyroType,
      structureType: 'Standard',
      armorType: 'Standard',
      heatSinkType: 'Single',
      totalHeatSinks: 10,
      internalHeatSinks: 0,
      externalHeatSinks: 0,
      mass: tonnage // Legacy compatibility
    })
  }
  
  /**
   * Get default configuration
   */
  private static getDefaultConfiguration(): UnitConfiguration {
    return {
      tonnage: 50,
      unitType: 'BattleMech',
      techBase: 'Inner Sphere',
      walkMP: 4,
      engineRating: 200,
      runMP: 6,
      engineType: 'Standard',
      gyroType: 'Standard',
      structureType: 'Standard',
      armorType: 'Standard',
      heatSinkType: 'Single',
      totalHeatSinks: 10,
      internalHeatSinks: 0,
      externalHeatSinks: 0,
      mass: 50
    }
  }
  
  /**
   * Calculate dependent values (engine rating, run speed, heat sinks)
   */
  private static calculateDependentValues(config: UnitConfiguration): UnitConfiguration {
    // Calculate engine rating from tonnage and walk MP
    const calculatedEngineRating = config.tonnage * config.walkMP
    const engineRating = Math.min(calculatedEngineRating, 400) // Cap at 400
    
    // Adjust walk MP if engine rating was capped
    const actualWalkMP = Math.floor(engineRating / config.tonnage)
    const runMP = Math.floor(actualWalkMP * 1.5)
    
    // Calculate heat sinks
    const internalHeatSinks = this.calculateInternalHeatSinks(engineRating, config.engineType)
    const minHeatSinks = Math.max(10, config.totalHeatSinks)
    const externalHeatSinks = Math.max(0, minHeatSinks - internalHeatSinks)
    
    return {
      ...config,
      walkMP: actualWalkMP,
      engineRating,
      runMP,
      totalHeatSinks: minHeatSinks,
      internalHeatSinks,
      externalHeatSinks,
      mass: config.tonnage // Keep legacy compatibility
    }
  }
  
  /**
   * Calculate internal heat sinks from engine rating
   */
  private static calculateInternalHeatSinks(engineRating: number, engineType: EngineType): number {
    // Non-fusion engines don't provide heat sinks
    if (engineType === 'ICE' || engineType === 'Fuel Cell') {
      return 0
    }
    
    // Fusion engines include 10 heat sinks for ratings 250+
    if (engineRating >= 250) {
      return 10
    }
    
    // Smaller engines get fewer integrated heat sinks
    return Math.floor(engineRating / 25)
  }
  
  /**
   * Validate engine rating constraints
   */
  static validateEngineRating(tonnage: number, walkMP: number): { isValid: boolean, maxWalkMP: number, errors: string[] } {
    const requiredRating = tonnage * walkMP
    const errors: string[] = []
    let isValid = true
    
    if (requiredRating > 400) {
      errors.push(`Engine rating ${requiredRating} exceeds maximum of 400`)
      isValid = false
    }
    
    if (walkMP < 1) {
      errors.push('Walk MP must be at least 1')
      isValid = false
    }
    
    const maxWalkMP = Math.floor(400 / tonnage)
    
    return { isValid, maxWalkMP, errors }
  }
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

  constructor(configuration: UnitConfiguration | LegacyUnitConfiguration) {
    // Convert legacy configuration to new format if needed
    this.configuration = UnitConfigurationBuilder.buildConfiguration(configuration)
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
   * Update unit configuration and handle special component changes
   */
  updateConfiguration(newConfiguration: UnitConfiguration): void {
    const oldConfig = this.configuration
    const validatedConfig = UnitConfigurationBuilder.buildConfiguration(newConfiguration)
    
    // Handle special component changes
    this.handleSpecialComponentConfigurationChange(oldConfig, validatedConfig)
    
    // Handle engine/gyro changes properly with equipment displacement
    if (oldConfig.engineType !== validatedConfig.engineType || 
        oldConfig.gyroType !== validatedConfig.gyroType) {
      this.handleSystemComponentChange(oldConfig, validatedConfig)
    }
    
    // Always update configuration at the end to ensure consistency
    this.configuration = validatedConfig
  }

  /**
   * Handle system component changes with proper equipment displacement
   */
  private handleSystemComponentChange(oldConfig: UnitConfiguration, newConfig: UnitConfiguration): void {
    const allDisplacedEquipment: EquipmentAllocation[] = []
    
    // Clear old system reservations and collect displaced equipment
    this.sections.forEach(section => {
      const engineDisplaced = section.clearSystemReservations('engine')
      const gyroDisplaced = section.clearSystemReservations('gyro')
      allDisplacedEquipment.push(...engineDisplaced, ...gyroDisplaced)
    })
    
    // Get displacement impact to identify conflicting equipment
    const displacementImpact = SystemComponentRules.getDisplacementImpact(
      oldConfig.engineType,
      oldConfig.gyroType,
      newConfig.engineType,
      newConfig.gyroType
    )
    
    // Find equipment that conflicts with new system slots
    displacementImpact.affectedLocations.forEach(location => {
      const section = this.sections.get(location)
      if (section) {
        const conflictSlots = displacementImpact.conflictSlots[location] || []
        const conflictingEquipment = section.findConflictingEquipment(conflictSlots)
        
        conflictingEquipment.forEach(equipment => {
          const removed = section.removeEquipmentGroup(equipment.equipmentGroupId)
          if (removed) {
            allDisplacedEquipment.push(removed)
          }
        })
      }
    })
    
    // Allocate new system components using the new config values
    this.allocateSystemComponentsWithConfig(newConfig)
    
    // Add all displaced equipment to unallocated pool
    if (allDisplacedEquipment.length > 0) {
      this.addUnallocatedEquipment(allDisplacedEquipment)
    }
  }

  /**
   * Allocate system components using specific configuration
   */
  private allocateSystemComponentsWithConfig(config: UnitConfiguration): void {
    const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(
      config.engineType,
      config.gyroType
    )

    // Allocate engine slots
    this.allocateEngineSlots(systemAllocation.engine)
    
    // Allocate gyro slots
    this.allocateGyroSlots(systemAllocation.gyro)
  }

  /**
   * Handle special component changes (Endo Steel, Ferro-Fibrous)
   */
  private handleSpecialComponentConfigurationChange(
    oldConfig: UnitConfiguration, 
    newConfig: UnitConfiguration
  ): void {
    // Handle structure type changes
    if (oldConfig.structureType !== newConfig.structureType) {
      this.updateSpecialComponents(
        oldConfig.structureType,
        newConfig.structureType,
        'structure'
      )
    }
    
    // Handle armor type changes
    if (oldConfig.armorType !== newConfig.armorType) {
      this.updateSpecialComponents(
        oldConfig.armorType,
        newConfig.armorType,
        'armor'
      )
    }
  }

  /**
   * Update special components for structure or armor changes
   */
  private updateSpecialComponents(
    oldType: StructureType | ArmorType,
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): void {
    // Remove old special components if they exist
    if (oldType !== 'Standard') {
      this.removeSpecialComponents(oldType, componentType)
    }
    
    // Add new special components if needed
    if (newType !== 'Standard') {
      this.addSpecialComponents(newType, componentType)
    }
  }

  /**
   * Add special component pieces to unallocated equipment
   */
  private addSpecialComponents(type: StructureType | ArmorType, componentType: 'structure' | 'armor'): void {
    const components = this.createSpecialComponentEquipment(type, componentType)
    
    components.forEach(component => {
      const allocation: EquipmentAllocation = {
        equipmentData: component,
        equipmentGroupId: `${component.id}_group`,
        location: '',
        startSlotIndex: -1,
        endSlotIndex: -1,
        occupiedSlots: []
      }
      this.unallocatedEquipment.push(allocation)
    })
  }

  /**
   * Remove special component pieces from unallocated equipment and critical slots
   */
  private removeSpecialComponents(type: StructureType | ArmorType, componentType: 'structure' | 'armor'): void {
    // Remove from unallocated equipment
    this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => {
      const specialEq = eq.equipmentData as SpecialEquipmentObject
      return !(specialEq.name === type && specialEq.componentType === componentType)
    })
    
    // Remove from critical slots across all sections
    this.sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => {
        const specialEq = eq.equipmentData as SpecialEquipmentObject
        return specialEq.name === type && specialEq.componentType === componentType
      })
      
      equipmentToRemove.forEach(eq => {
        section.removeEquipmentGroup(eq.equipmentGroupId)
      })
    })
  }

  /**
   * Create special component equipment pieces
   */
  private createSpecialComponentEquipment(
    type: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): SpecialEquipmentObject[] {
    return Array.from({ length: 14 }, (_, index) => ({
      id: `${type.toLowerCase().replace(/\s+/g, '_')}_piece_${index + 1}`,
      name: type,
      type: 'equipment' as const,
      requiredSlots: 1,
      weight: 0,
      techBase: type.includes('Clan') ? 'Clan' : 'Inner Sphere',
      componentType,
      isGrouped: false
    }))
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
