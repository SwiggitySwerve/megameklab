/**
 * Unit Critical Manager - Unit-level equipment tracking and management
 * Aggregates all critical sections and manages equipment allocation across the entire unit
 */

import { CriticalSection, LocationSlotConfiguration, FixedSystemComponent } from './CriticalSection'
import { EquipmentObject, EquipmentAllocation } from './CriticalSlot'
import { EngineType, GyroType, SystemComponentRules } from './SystemComponentRules'
import { ARMOR_SLOT_REQUIREMENTS, getArmorSlots } from '../armorCalculations'
import { JumpJetType } from '../jumpJetCalculations'
import { CriticalSlotCalculator, CriticalSlotBreakdown } from './CriticalSlotCalculator'

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

// ===== ENHANCED STATE SERIALIZATION INTERFACES =====

/**
 * Complete unit state for persistence - includes everything needed to restore unit exactly
 */
export interface CompleteUnitState {
  version: string                                // Version for future compatibility
  configuration: UnitConfiguration               // Basic unit configuration
  criticalSlotAllocations: SerializedSlotAllocations  // Equipment in specific slots
  unallocatedEquipment: SerializedEquipment[]    // Equipment not yet placed
  timestamp: number                              // When state was saved
}

/**
 * Serialized equipment data for persistence
 */
export interface SerializedEquipment {
  equipmentData: EquipmentObject
  equipmentGroupId: string
  location: string                               // Empty string if unallocated
  startSlotIndex: number                         // -1 if unallocated
  endSlotIndex: number                           // -1 if unallocated
  occupiedSlots: number[]                        // Empty array if unallocated
}

/**
 * Critical slot allocations organized by location
 */
export interface SerializedSlotAllocations {
  [location: string]: {
    [slotIndex: number]: SerializedEquipment
  }
}

/**
 * Validation result for state deserialization
 */
export interface StateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  canRecover: boolean                            // Can we recover from errors automatically?
}

export interface ArmorAllocation {
  HD: { front: number; rear: number };
  CT: { front: number; rear: number };
  LT: { front: number; rear: number };
  RT: { front: number; rear: number };
  LA: { front: number; rear: number };
  RA: { front: number; rear: number };
  LL: { front: number; rear: number };
  RL: { front: number; rear: number };
}

export interface UnitConfiguration {
  // Primary identification
  chassis: string                    // "Annihilator", "Atlas", etc.
  model: string                      // "ANH-1E", "AS7-D", etc.
  
  // Core mech properties
  tonnage: number                    // 20-100 tons in 5-ton increments
  unitType: 'BattleMech' | 'IndustrialMech'
  techBase: 'Inner Sphere' | 'Clan'  // Determines available tech options
  
  // Movement and engine
  walkMP: number                     // 1-20+ movement points
  engineRating: number               // Auto-calculated from tonnage × walkMP, max 400
  runMP: number                      // Auto-calculated (walkMP × 1.5, rounded down)
  engineType: EngineType
  
  // Jump jets
  jumpMP: number                     // Jump movement points
  jumpJetType: JumpJetType           // Type of jump jets
  jumpJetCounts: Partial<Record<JumpJetType, number>>  // Count of each jump jet type
  hasPartialWing: boolean            // Whether unit has partial wing
  
  // System components
  gyroType: GyroType
  structureType: StructureType
  armorType: ArmorType
  
  // Armor allocation - Single Source of Truth approach
  armorAllocation: ArmorAllocation   // User input - what's actually allocated to locations
  armorTonnage: number              // User input - tonnage invested in armor
  // NOTE: All other armor values (available, allocated, remaining) are computed on-demand
  
  // Heat management
  heatSinkType: HeatSinkType
  totalHeatSinks: number             // User configurable, minimum 10
  internalHeatSinks: number          // Auto-calculated from engine rating
  externalHeatSinks: number          // Auto-calculated (total - internal)
  
  // Enhancement systems
  enhancementType?: 'MASC' | 'Triple Strength Myomer' | null  // Movement enhancement systems
  
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
      // Default chassis/model for legacy units
      chassis: 'Unknown',
      model: 'Legacy',
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
      // Default armor allocation (minimal)
      armorAllocation: {
        HD: { front: 9, rear: 0 },
        CT: { front: 15, rear: 5 },
        LT: { front: 12, rear: 4 },
        RT: { front: 12, rear: 4 },
        LA: { front: 10, rear: 0 },
        RA: { front: 10, rear: 0 },
        LL: { front: 15, rear: 0 },
        RL: { front: 15, rear: 0 }
      },
      armorTonnage: 0, // Will be calculated
      heatSinkType: 'Single',
      totalHeatSinks: 10,
      internalHeatSinks: 0,
      externalHeatSinks: 0,
      // Jump jet defaults
      jumpMP: 0,
      jumpJetType: 'Standard Jump Jet',
      jumpJetCounts: {},
      hasPartialWing: false,
      mass: tonnage // Legacy compatibility
    })
  }
  
  /**
   * Get default configuration
   */
  private static getDefaultConfiguration(): UnitConfiguration {
    return {
      // Default chassis/model for new units
      chassis: 'Custom',
      model: 'New Design',
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
      // Default armor allocation (reasonable distribution)
      armorAllocation: {
        HD: { front: 9, rear: 0 },
        CT: { front: 30, rear: 10 },
        LT: { front: 24, rear: 8 },
        RT: { front: 24, rear: 8 },
        LA: { front: 20, rear: 0 },
        RA: { front: 20, rear: 0 },
        LL: { front: 30, rear: 0 },
        RL: { front: 30, rear: 0 }
      },
      armorTonnage: 0, // User input
      heatSinkType: 'Single',
      totalHeatSinks: 10,
      internalHeatSinks: 0,
      externalHeatSinks: 0,
      // Enhancement systems
      enhancementType: null,
      // Jump jet defaults
      jumpMP: 0,
      jumpJetType: 'Standard Jump Jet',
      jumpJetCounts: {},
      hasPartialWing: false,
      mass: 50
    }
  }
  
  /**
   * Calculate dependent values (engine rating, run speed, heat sinks, armor)
   */
  private static calculateDependentValues(config: UnitConfiguration): UnitConfiguration {
    // Calculate engine rating from tonnage and walk MP
    const calculatedEngineRating = config.tonnage * config.walkMP
    const engineRating = Math.min(calculatedEngineRating, 400) // Cap at 400
    
    // Adjust walk MP if engine rating was capped
    const actualWalkMP = Math.floor(engineRating / config.tonnage)
    
    // Calculate standard run MP
    const runMP = Math.floor(actualWalkMP * 1.5)
    
    // Note: Enhancement effects (MASC, TSM) are handled at display level
    // to show bracketed notation for conditional/activated bonuses
    
    // Calculate heat sinks
    const internalHeatSinks = this.calculateInternalHeatSinks(engineRating, config.engineType)
    const minHeatSinks = Math.max(10, config.totalHeatSinks)
    
    // CRITICAL FIX: Respect user-provided externalHeatSinks when explicitly set
    let externalHeatSinks: number
    if (config.externalHeatSinks !== undefined && config.externalHeatSinks >= 0) {
      // User explicitly set external heat sinks - respect their value
      externalHeatSinks = config.externalHeatSinks
    } else {
      // Calculate external heat sinks from total - internal
      externalHeatSinks = Math.max(0, minHeatSinks - internalHeatSinks)
    }
    
    // Calculate armor values
    const armorValues = this.calculateArmorValues(config)
    
    return {
      ...config,
      walkMP: actualWalkMP,
      engineRating,
      runMP,
      totalHeatSinks: minHeatSinks,
      internalHeatSinks,
      externalHeatSinks,
      armorTonnage: armorValues.armorTonnage,
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
   * Calculate armor values from configuration
   */
  private static calculateArmorValues(config: UnitConfiguration): {
    totalArmorPoints: number;
    armorTonnage: number;
    maxArmorPoints: number;
  } {
    // Import armor calculations
    const { ARMOR_POINTS_PER_TON, calculateArmorWeight } = require('../armorCalculations')
    
    // Calculate total armor points from allocation
    const totalArmorPoints = Object.values(config.armorAllocation).reduce((total, location) => {
      return total + location.front + location.rear
    }, 0)
    
    // Use the armor tonnage from config if provided, otherwise calculate from points
    const pointsPerTon = ARMOR_POINTS_PER_TON[config.armorType] || 16
    const armorTonnage = config.armorTonnage !== undefined 
      ? config.armorTonnage  // Use provided armor tonnage
      : Math.ceil((totalArmorPoints / pointsPerTon) * 2) / 2  // Calculate from points and round
    
    // Calculate maximum possible armor points (tonnage * 2 * points per ton for max armor)
    const maxArmorTonnage = config.tonnage * 0.5 // 50% of unit tonnage max
    const maxArmorPoints = Math.floor(maxArmorTonnage * pointsPerTon)
    
    return {
      totalArmorPoints,
      armorTonnage,
      maxArmorPoints
    }
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

// Critical slot constants
export const TOTAL_CRITICAL_SLOTS = 78; // Standard BattleMech total

export class UnitCriticalManager {
  private sections: Map<string, CriticalSection>
  private unallocatedEquipment: EquipmentAllocation[]
  private configuration: UnitConfiguration
  private listeners: (() => void)[] = []
  private specialComponentsInitialized: boolean = false // Track if special components created
  private static globalComponentCounter: number = 0 // CRITICAL FIX: Global counter for absolutely unique IDs

  constructor(configuration: UnitConfiguration | LegacyUnitConfiguration) {
    // Convert legacy configuration to new format if needed
    this.configuration = UnitConfigurationBuilder.buildConfiguration(configuration)
    this.sections = new Map()
    this.unallocatedEquipment = []
    
    this.initializeSections()
    this.allocateSystemComponents()
    
    // CRITICAL FIX: Create special components for initial configuration
    this.initializeSpecialComponents()
  }

  /**
   * Get critical slot requirements for armor type
   */
  private getArmorCriticalSlots(armorType: ArmorType): number {
    try {
      return getArmorSlots(armorType as any, this.configuration.techBase as any) || 0
    } catch (error) {
      // Fallback for armor types not in the armor calculations
      const armorSlotMap: Record<ArmorType, number> = {
        'Standard': 0,
        'Ferro-Fibrous': 14,
        'Ferro-Fibrous (Clan)': 7,
        'Light Ferro-Fibrous': 7,
        'Heavy Ferro-Fibrous': 21,
        'Stealth': 12,
        'Reactive': 14,
        'Reflective': 10,
        'Hardened': 0  // Key fix - Hardened armor takes 0 slots
      }
      return armorSlotMap[armorType] || 0
    }
  }

  /**
   * Get critical slot requirements for structure type
   */
  private getStructureCriticalSlots(structureType: StructureType): number {
    const structureSlotMap: Record<StructureType, number> = {
      'Standard': 0,
      'Endo Steel': 14,
      'Endo Steel (Clan)': 7,
      'Composite': 0,
      'Reinforced': 0,
      'Industrial': 0
    }
    return structureSlotMap[structureType] || 0
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
   * Initialize special components ONCE during unit factory creation
   * FACTORY PATTERN: Components are created exactly once based on initial configuration
   */
  private initializeSpecialComponents(): void {
    if (this.specialComponentsInitialized) {
      return
    }

    // Create structure components if needed
    const structureSlots = this.getStructureCriticalSlots(this.configuration.structureType)
    if (structureSlots > 0) {
      this.addSpecialComponents(this.configuration.structureType, 'structure', structureSlots)
    }
    
    // Create armor components if needed
    const armorSlots = this.getArmorCriticalSlots(this.configuration.armorType)
    if (armorSlots > 0) {
      this.addSpecialComponents(this.configuration.armorType, 'armor', armorSlots)
    }
    
    // Create jump jet components if needed
    if (this.configuration.jumpMP > 0) {
      this.addJumpJetEquipment(
        this.configuration.jumpJetType, 
        this.configuration.jumpMP, 
        this.configuration.tonnage, 
        this.configuration.techBase
      )
    }
    
    // Create external heat sink components if needed
    if (this.configuration.externalHeatSinks > 0) {
      this.addHeatSinkEquipment(
        this.configuration.heatSinkType,
        this.configuration.externalHeatSinks,
        this.configuration.techBase
      )
    }
    
    this.specialComponentsInitialized = true
  }

  /**
   * Update unit configuration and handle special component changes
   */
  updateConfiguration(newConfiguration: UnitConfiguration): void {
    const oldConfig = this.configuration
    let validatedConfig = UnitConfigurationBuilder.buildConfiguration(newConfiguration)
    
    // Enforce BattleTech construction rules
    validatedConfig = this.enforceConstructionRules(validatedConfig)
    
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
   * Enforce BattleTech construction rules on configuration
   */
  private enforceConstructionRules(config: UnitConfiguration): UnitConfiguration {
    const enforcedConfig = { ...config }
    
    // Enforce head armor maximum (9 points)
    if (enforcedConfig.armorAllocation.HD.front > 9) {
      enforcedConfig.armorAllocation = {
        ...enforcedConfig.armorAllocation,
        HD: { front: 9, rear: 0 }
      }
    }
    
    // Enforce no rear armor on head, arms, legs
    const noRearLocations = ['HD', 'LA', 'RA', 'LL', 'RL']
    noRearLocations.forEach(location => {
      if (enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation].rear > 0) {
        enforcedConfig.armorAllocation = {
          ...enforcedConfig.armorAllocation,
          [location]: {
            ...enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation],
            rear: 0
          }
        }
      }
    })
    
    // Enforce maximum armor points per location
    Object.keys(enforcedConfig.armorAllocation).forEach(location => {
      const maxArmor = this.getMaxArmorPointsForLocation(location)
      const currentArmor = enforcedConfig.armorAllocation[location as keyof typeof enforcedConfig.armorAllocation]
      const totalArmor = currentArmor.front + currentArmor.rear
      
      if (totalArmor > maxArmor) {
        // Reduce proportionally
        const ratio = maxArmor / totalArmor
        enforcedConfig.armorAllocation = {
          ...enforcedConfig.armorAllocation,
          [location]: {
            front: Math.floor(currentArmor.front * ratio),
            rear: Math.floor(currentArmor.rear * ratio)
          }
        }
      }
    })
    
    return enforcedConfig
  }

  /**
   * Handle system component changes with proper equipment displacement
   * CRITICAL FIX: Don't rebuild special components here - they're handled separately
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
    
    // CRITICAL FIX: Only allocate system components (engine/gyro), not special components
    // Special components are handled separately by updateSpecialComponents()
    this.allocateSystemComponentsOnly(newConfig)
    
    // Add all displaced equipment to unallocated pool
    if (allDisplacedEquipment.length > 0) {
      this.addUnallocatedEquipment(allDisplacedEquipment)
    }
  }

  /**
   * Allocate ONLY system components (engine/gyro) without touching special components
   */
  private allocateSystemComponentsOnly(config: UnitConfiguration): void {
    const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(
      config.engineType,
      config.gyroType
    )

    // Allocate engine slots
    this.allocateEngineSlots(systemAllocation.engine)
    
    // Allocate gyro slots
    this.allocateGyroSlots(systemAllocation.gyro)
    
    // DO NOT call initializeSpecialComponents() here - special components
    // are handled separately by updateSpecialComponents()
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
   * Handle special component changes (Endo Steel, Ferro-Fibrous, Jump Jets, Heat Sinks)
   * ULTIMATE FIX: Always clear ALL special components and recreate from scratch
   */
  private handleSpecialComponentConfigurationChange(
    oldConfig: UnitConfiguration, 
    newConfig: UnitConfiguration
  ): void {
    console.log('[UnitCriticalManager] ULTIMATE FIX: Handling special component configuration change')
    
    // ULTIMATE FIX: Clear ALL special components first to ensure clean slate
    console.log('[UnitCriticalManager] ULTIMATE FIX: Clearing ALL special components')
    this.clearAllSpecialComponents()
    
    // CRITICAL FIX: Also clear heat sinks separately since they're not considered "special components"
    console.log('[UnitCriticalManager] ULTIMATE FIX: Clearing ALL heat sink equipment')
    this.removeHeatSinkEquipment()
    
    // Now recreate exactly what's needed for the new configuration
    console.log('[UnitCriticalManager] ULTIMATE FIX: Creating components for new configuration')
    
    // Create structure components if needed
    const structureSlots = this.getStructureCriticalSlots(newConfig.structureType)
    if (structureSlots > 0) {
      console.log(`[UnitCriticalManager] ULTIMATE FIX: Creating ${structureSlots} structure components for ${newConfig.structureType}`)
      this.addSpecialComponents(newConfig.structureType, 'structure', structureSlots)
    }
    
    // Create armor components if needed
    const armorSlots = this.getArmorCriticalSlots(newConfig.armorType)
    if (armorSlots > 0) {
      console.log(`[UnitCriticalManager] ULTIMATE FIX: Creating ${armorSlots} armor components for ${newConfig.armorType}`)
      this.addSpecialComponents(newConfig.armorType, 'armor', armorSlots)
    }
    
    // Handle jump jets - clear existing and add new
    console.log('[UnitCriticalManager] ULTIMATE FIX: Updating jump jet equipment')
    this.updateJumpJetEquipment(oldConfig, newConfig)
    
    // Handle external heat sinks - add exactly what's needed
    if (newConfig.externalHeatSinks > 0) {
      console.log(`[UnitCriticalManager] ULTIMATE FIX: Creating ${newConfig.externalHeatSinks} external heat sink components`)
      this.addHeatSinkEquipment(newConfig.heatSinkType, newConfig.externalHeatSinks, newConfig.techBase)
    }
    
    console.log(`[UnitCriticalManager] ULTIMATE FIX: Special component update complete. Final unallocated count: ${this.unallocatedEquipment.length}`)
  }

  /**
   * FACTORY PATTERN: Update special components for structure or armor changes
   * CRITICAL FIX: Always clear and create exact number needed to prevent accumulation
   */
  private updateSpecialComponents(
    oldType: StructureType | ArmorType,
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): void {
    console.log(`[UnitCriticalManager] COMPONENT UPDATE: ${oldType} -> ${newType} (${componentType})`)
    
    const newSlots = componentType === 'armor'
      ? this.getArmorCriticalSlots(newType as ArmorType)
      : this.getStructureCriticalSlots(newType as StructureType)
    
    console.log(`[UnitCriticalManager] COMPONENT UPDATE: Need ${newSlots} slots for ${newType}`)
    
    // CRITICAL FIX: Always clear ALL components of this type first to prevent accumulation
    console.log(`[UnitCriticalManager] COMPONENT UPDATE: Clearing all ${componentType} components`)
    this.clearSpecialComponentsByType(componentType)
    
    // Create exactly the number of components needed for the new type
    if (newSlots > 0) {
      console.log(`[UnitCriticalManager] COMPONENT UPDATE: Creating ${newSlots} new ${newType} components`)
      this.addSpecialComponents(newType, componentType, newSlots)
    }
    
    console.log(`[UnitCriticalManager] COMPONENT UPDATE: Complete. Final unallocated count: ${this.unallocatedEquipment.length}`)
  }
  
  /**
   * Clear all special components of a specific type (structure or armor)
   */
  private clearSpecialComponentsByType(componentType: 'structure' | 'armor'): void {
    const beforeCount = this.unallocatedEquipment.length
    
    // Remove from unallocated equipment
    this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => {
      const specialEq = eq.equipmentData as SpecialEquipmentObject
      return !(specialEq.componentType === componentType)
    })
    
    // Remove from allocated slots across all sections
    let removedFromSlots = 0
    this.sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => {
        const specialEq = eq.equipmentData as SpecialEquipmentObject
        return specialEq.componentType === componentType
      })
      
      equipmentToRemove.forEach(eq => {
        const removed = section.removeEquipmentGroup(eq.equipmentGroupId)
        if (removed) {
          removedFromSlots++
        }
      })
    })
    
    const afterCount = this.unallocatedEquipment.length
    console.log(`[UnitCriticalManager] Cleared ${componentType} components:`)
    console.log(`  - From unallocated: ${beforeCount - afterCount}`)
    console.log(`  - From allocated slots: ${removedFromSlots}`)
    console.log(`  - Total cleared: ${(beforeCount - afterCount) + removedFromSlots}`)
  }

  /**
   * FACTORY PATTERN: Transfer special components between types
   * This maintains the exact component instances, just updates their properties
   */
  private transferSpecialComponents(
    oldType: StructureType | ArmorType,
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor',
    oldSlots: number,
    newSlots: number
  ): void {
    console.log(`[UnitCriticalManager] TRANSFER: Starting component transfer for ${componentType}`)
    
    // Collect all existing components of this type (allocated + unallocated)
    const existingComponents = this.collectExistingSpecialComponents(oldType, componentType)
    console.log(`[UnitCriticalManager] TRANSFER: Found ${existingComponents.length} existing components`)
    
    // Remove existing components from their current locations
    this.removeSpecialComponents(oldType, componentType)
    
    if (newSlots === 0) {
      // Configuration no longer requires special components
      console.log(`[UnitCriticalManager] TRANSFER: New type ${newType} requires no slots, components removed`)
      return
    }
    
    // Transfer/adjust components to match new requirements
    if (newSlots === oldSlots) {
      // Same number of slots: just update component properties and place in unallocated
      console.log(`[UnitCriticalManager] TRANSFER: Same slot count, updating component properties`)
      this.updateComponentProperties(existingComponents, newType, componentType)
      // Place updated components in unallocated pool for user to re-assign
      this.unallocatedEquipment.push(...existingComponents)
    } else if (newSlots < oldSlots) {
      // Fewer slots needed: keep first N components, update properties
      console.log(`[UnitCriticalManager] TRANSFER: Fewer slots needed (${newSlots}), keeping first ${newSlots} components`)
      const keptComponents = existingComponents.slice(0, newSlots)
      this.updateComponentProperties(keptComponents, newType, componentType)
      // Place kept components in unallocated pool for user to re-assign
      this.unallocatedEquipment.push(...keptComponents)
    } else {
      // More slots needed: keep all existing + create additional
      console.log(`[UnitCriticalManager] TRANSFER: More slots needed (${newSlots}), creating ${newSlots - oldSlots} additional components`)
      this.updateComponentProperties(existingComponents, newType, componentType)
      // Place existing components in unallocated pool
      this.unallocatedEquipment.push(...existingComponents)
      
      // Create additional components needed
      const additionalComponents = this.createSpecialComponentEquipment(
        newType, 
        componentType, 
        newSlots - oldSlots
      )
      
      additionalComponents.forEach(component => {
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
  }

  /**
   * Collect all existing special components (allocated + unallocated)
   */
  private collectExistingSpecialComponents(
    type: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): EquipmentAllocation[] {
    const components: EquipmentAllocation[] = []
    
    // Collect from unallocated equipment
    this.unallocatedEquipment.forEach(eq => {
      const specialEq = eq.equipmentData as SpecialEquipmentObject
      if (specialEq.name === type && specialEq.componentType === componentType) {
        components.push(eq)
      }
    })
    
    // Collect from critical slots across all sections
    this.sections.forEach(section => {
      section.getAllEquipment().forEach(eq => {
        const specialEq = eq.equipmentData as SpecialEquipmentObject
        if (specialEq.name === type && specialEq.componentType === componentType) {
          components.push(eq)
        }
      })
    })
    
    return components
  }

  /**
   * Update properties of existing components to match new type
   * CRITICAL FIX: Do NOT push components back to unallocated here - caller handles placement
   */
  private updateComponentProperties(
    components: EquipmentAllocation[],
    newType: StructureType | ArmorType,
    componentType: 'structure' | 'armor'
  ): void {
    components.forEach((allocation, index) => {
      // Update the equipment data properties
      const updatedEquipmentData: SpecialEquipmentObject = {
        ...allocation.equipmentData,
        id: `${newType.toLowerCase().replace(/\s+/g, '_')}_piece_${index + 1}`,
        name: newType,
        techBase: newType.includes('Clan') ? 'Clan' : 'Inner Sphere',
        componentType
      }
      
      // Update the allocation
      allocation.equipmentData = updatedEquipmentData
      allocation.equipmentGroupId = `${updatedEquipmentData.id}_group`
      
      // CRITICAL FIX: Do NOT push back to unallocated here!
      // The caller (transferSpecialComponents) will handle proper placement
      // This was causing 100+ component duplication because components 
      // from BOTH allocated and unallocated pools were being pushed to unallocated
    })
  }

  /**
   * Add special component pieces to unallocated equipment
   * CRITICAL FIX: Ensure absolutely unique group IDs to prevent "lot assignment" bug
   */
  private addSpecialComponents(type: StructureType | ArmorType, componentType: 'structure' | 'armor', requiredSlots: number): void {
    console.log(`[UnitCriticalManager] Adding special components: ${type} (${componentType}) - ${requiredSlots} slots`)
    const components = this.createSpecialComponentEquipment(type, componentType, requiredSlots)
    console.log(`[UnitCriticalManager] Created ${components.length} component pieces:`, components)
    
    components.forEach((component, index) => {
      // CRITICAL FIX: Generate absolutely unique group IDs using global counter
      UnitCriticalManager.globalComponentCounter++
      const uniqueGroupId = `${component.id}_group_${UnitCriticalManager.globalComponentCounter}_${Date.now()}_${index}`
      
      const allocation: EquipmentAllocation = {
        equipmentData: component,
        equipmentGroupId: uniqueGroupId,
        location: '',
        startSlotIndex: -1,
        endSlotIndex: -1,
        occupiedSlots: []
      }
      this.unallocatedEquipment.push(allocation)
      console.log(`[UnitCriticalManager] Added component to unallocated with unique ID:`, {
        name: component.name,
        groupId: uniqueGroupId,
        componentType: component.componentType
      })
    })
    
    console.log(`[UnitCriticalManager] Total unallocated equipment count: ${this.unallocatedEquipment.length}`)
    
    // CRITICAL DEBUG: Check for duplicate group IDs after adding
    const groupIds = this.unallocatedEquipment.map(eq => eq.equipmentGroupId)
    const uniqueGroupIds = new Set(groupIds)
    if (groupIds.length !== uniqueGroupIds.size) {
      console.error('[UnitCriticalManager] CRITICAL ERROR: Duplicate group IDs detected after adding special components!')
      console.error('Total:', groupIds.length, 'Unique:', uniqueGroupIds.size)
      
      // Find and log duplicates
      const duplicates = groupIds.filter((id, index, arr) => arr.indexOf(id) !== index)
      console.error('Duplicate group IDs:', Array.from(new Set(duplicates)))
    }
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
    componentType: 'structure' | 'armor',
    requiredSlots: number
  ): SpecialEquipmentObject[] {
    return Array.from({ length: requiredSlots }, (_, index) => ({
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
   * Update jump jet equipment based on configuration changes
   */
  private updateJumpJetEquipment(oldConfig: UnitConfiguration, newConfig: UnitConfiguration): void {
    // Remove existing jump jets
    this.removeJumpJetEquipment()
    
    // Add new jump jets if needed
    if (newConfig.jumpMP > 0) {
      this.addJumpJetEquipment(newConfig.jumpJetType, newConfig.jumpMP, newConfig.tonnage, newConfig.techBase)
    }
  }

  /**
   * Remove all jump jet equipment from unallocated and allocated slots
   */
  private removeJumpJetEquipment(): void {
    // Remove from unallocated equipment
    this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => 
      !eq.equipmentData.name.includes('Jump') && 
      !eq.equipmentData.name.includes('UMU') &&
      !eq.equipmentData.name.includes('Booster') &&
      !eq.equipmentData.name.includes('Wing')
    )
    
    // Remove from critical slots across all sections
    this.sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => 
        eq.equipmentData.name.includes('Jump') || 
        eq.equipmentData.name.includes('UMU') ||
        eq.equipmentData.name.includes('Booster') ||
        eq.equipmentData.name.includes('Wing')
      )
      
      equipmentToRemove.forEach(eq => {
        section.removeEquipmentGroup(eq.equipmentGroupId)
      })
    })
  }

  /**
   * Add jump jet equipment to unallocated pool
   */
  private addJumpJetEquipment(jumpJetType: JumpJetType, jumpMP: number, tonnage: number, techBase: string): void {
    // Import jump jet calculations
    const { calculateJumpJetWeight, calculateJumpJetCriticalSlots, JUMP_JET_VARIANTS } = require('../jumpJetCalculations')
    
    const variant = JUMP_JET_VARIANTS[jumpJetType]
    if (!variant) return
    
    const jumpJets: EquipmentObject[] = []
    
    // Define location restrictions for jump jets
    const jumpJetLocations = ['Center Torso', 'Left Torso', 'Right Torso', 'Left Leg', 'Right Leg']
    
    for (let i = 0; i < jumpMP; i++) {
      jumpJets.push({
        id: `${jumpJetType.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
        name: variant.name,
        type: 'equipment' as const,
        requiredSlots: calculateJumpJetCriticalSlots(jumpJetType, tonnage),
        weight: calculateJumpJetWeight(jumpJetType, tonnage),
        techBase: variant.techBase === 'Both' ? techBase : variant.techBase,
        heat: variant.heatGeneration,
        allowedLocations: jumpJetLocations
      })
    }
    
    jumpJets.forEach(jumpJet => {
      const allocation: EquipmentAllocation = {
        equipmentData: jumpJet,
        equipmentGroupId: `${jumpJet.id}_group`,
        location: '',
        startSlotIndex: -1,
        endSlotIndex: -1,
        occupiedSlots: []
      }
      this.unallocatedEquipment.push(allocation)
    })
  }

  /**
   * Remove all heat sink equipment from unallocated and allocated slots
   */
  private removeHeatSinkEquipment(): void {
    console.log('[UnitCriticalManager] Removing ALL heat sink equipment')
    
    const beforeUnallocated = this.unallocatedEquipment.length
    
    // Remove from unallocated equipment
    this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => 
      !eq.equipmentData.name.includes('Heat Sink') && 
      eq.equipmentData.type !== 'heat_sink'
    )
    
    const afterUnallocated = this.unallocatedEquipment.length
    
    // Remove from critical slots across all sections
    let removedFromSlots = 0
    this.sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => 
        eq.equipmentData.name.includes('Heat Sink') || 
        eq.equipmentData.type === 'heat_sink'
      )
      
      equipmentToRemove.forEach(eq => {
        const removed = section.removeEquipmentGroup(eq.equipmentGroupId)
        if (removed) {
          removedFromSlots++
        }
      })
    })
    
    console.log(`[UnitCriticalManager] Removed heat sink equipment:`)
    console.log(`  - From unallocated: ${beforeUnallocated - afterUnallocated}`)
    console.log(`  - From allocated slots: ${removedFromSlots}`)
    console.log(`  - Total removed: ${(beforeUnallocated - afterUnallocated) + removedFromSlots}`)
  }

  /**
   * Add heat sink equipment to unallocated pool
   */
  private addHeatSinkEquipment(heatSinkType: HeatSinkType, externalHeatSinks: number, techBase: string): void {
    console.log(`[UnitCriticalManager] Adding heat sink equipment: ${heatSinkType} - ${externalHeatSinks} external heat sinks`)
    
    // CRITICAL FIX: Don't generate any heat sinks if externalHeatSinks is 0
    if (externalHeatSinks <= 0) {
      console.log(`[UnitCriticalManager] No external heat sinks needed (${externalHeatSinks}), skipping generation`)
      return
    }
    
    // Import heat sink calculations
    const { getHeatSinkSpecification } = require('../heatSinkCalculations')
    
    // CRITICAL FIX: Map configuration heat sink types to calculation types
    let calculationHeatSinkType: string = heatSinkType
    if (heatSinkType === 'Double') {
      calculationHeatSinkType = techBase === 'Clan' ? 'Double (Clan)' : 'Double (IS)'
    }
    
    const heatSinkSpec = getHeatSinkSpecification(calculationHeatSinkType as any)
    if (!heatSinkSpec) {
      console.error(`[UnitCriticalManager] No specification found for heat sink type: ${calculationHeatSinkType} (original: ${heatSinkType})`)
      return
    }
    
    console.log(`[UnitCriticalManager] Using heat sink spec:`, {
      type: calculationHeatSinkType,
      slots: heatSinkSpec.criticalSlots,
      weight: heatSinkSpec.weight,
      dissipation: heatSinkSpec.dissipation
    })
    
    const heatSinks: EquipmentObject[] = []
    
    // Define location restrictions for heat sinks (can be placed anywhere except head)
    const heatSinkLocations = ['Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg']
    
    for (let i = 0; i < externalHeatSinks; i++) {
      heatSinks.push({
        id: `${heatSinkType.toLowerCase().replace(/\s+/g, '_')}_external_${i + 1}`,
        name: `${calculationHeatSinkType} Heat Sink`,
        type: 'heat_sink' as const,
        requiredSlots: heatSinkSpec.criticalSlots,
        weight: heatSinkSpec.weight,
        techBase: heatSinkSpec.techBase === 'Both' ? techBase : heatSinkSpec.techBase,
        heat: -heatSinkSpec.dissipation, // Negative because they dissipate heat
        allowedLocations: heatSinkLocations
      })
    }
    
    heatSinks.forEach((heatSink, index) => {
      // Generate unique group IDs for heat sinks
      UnitCriticalManager.globalComponentCounter++
      const uniqueGroupId = `${heatSink.id}_group_${UnitCriticalManager.globalComponentCounter}_${Date.now()}_${index}`
      
      const allocation: EquipmentAllocation = {
        equipmentData: heatSink,
        equipmentGroupId: uniqueGroupId,
        location: '',
        startSlotIndex: -1,
        endSlotIndex: -1,
        occupiedSlots: []
      }
      this.unallocatedEquipment.push(allocation)
      
      console.log(`[UnitCriticalManager] Added heat sink to unallocated:`, {
        name: heatSink.name,
        groupId: uniqueGroupId,
        slots: heatSink.requiredSlots,
        weight: heatSink.weight
      })
    })
    
    console.log(`[UnitCriticalManager] Total heat sinks added: ${heatSinks.length}`)
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
   * CRITICAL FIX: Ensure React detects array changes by creating new array reference
   */
  removeUnallocatedEquipment(equipmentGroupId: string): EquipmentAllocation | null {
    console.log(`[UnitCriticalManager] removeUnallocatedEquipment called with groupId: ${equipmentGroupId}`)
    console.log(`[UnitCriticalManager] Current unallocated equipment:`, this.unallocatedEquipment.map(eq => ({
      name: eq.equipmentData.name,
      groupId: eq.equipmentGroupId,
      componentType: (eq.equipmentData as any).componentType
    })))
    
    const index = this.unallocatedEquipment.findIndex(eq => eq.equipmentGroupId === equipmentGroupId)
    console.log(`[UnitCriticalManager] Found equipment at index: ${index}`)
    
    if (index >= 0) {
      const removed = this.unallocatedEquipment[index]
      
      // CRITICAL FIX: Create new array to ensure React detects the change
      this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => eq.equipmentGroupId !== equipmentGroupId)
      
      console.log(`[UnitCriticalManager] Successfully removed equipment:`, {
        name: removed.equipmentData.name,
        groupId: removed.equipmentGroupId,
        componentType: (removed.equipmentData as any).componentType
      })
      console.log(`[UnitCriticalManager] Remaining unallocated count: ${this.unallocatedEquipment.length}`)
      
      // Notify listeners about state change
      this.notifyStateChange()
      
      return removed
    }
    
    console.error(`[UnitCriticalManager] FAILED to find equipment with groupId: ${equipmentGroupId}`)
    console.error(`[UnitCriticalManager] Available group IDs:`, this.unallocatedEquipment.map(eq => eq.equipmentGroupId))
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
   * Check if equipment can be placed in specified location
   */
  canPlaceEquipmentInLocation(equipment: EquipmentObject, location: string): boolean {
    // Check static location restrictions
    if (equipment.allowedLocations) {
      return equipment.allowedLocations.includes(location)
    }
    
    // Check dynamic location restrictions
    if (equipment.locationRestrictions) {
      switch (equipment.locationRestrictions.type) {
        case 'engine_slots':
          return this.hasEngineSlots(location)
        case 'custom':
          return equipment.locationRestrictions.validator?.(this, location) ?? false
        case 'static':
          // Should use allowedLocations instead, but handle gracefully
          return true
      }
    }
    
    // Default: allow anywhere (for backwards compatibility)
    return true
  }

  /**
   * Check if a location has engine slots
   */
  hasEngineSlots(location: string): boolean {
    const section = this.getSection(location)
    if (!section) return false
    
    // Check if this location has engine slots based on current engine configuration
    const engineAllocation = SystemComponentRules.getCompleteSystemAllocation(
      this.configuration.engineType,
      this.configuration.gyroType
    )
    
    switch (location) {
      case 'Center Torso':
        return engineAllocation.engine.centerTorso.length > 0
      case 'Left Torso':
        return engineAllocation.engine.leftTorso.length > 0
      case 'Right Torso':
        return engineAllocation.engine.rightTorso.length > 0
      default:
        return false
    }
  }

  /**
   * Get validation error message for equipment location restriction
   */
  getLocationRestrictionError(equipment: EquipmentObject, location: string): string {
    if (equipment.allowedLocations) {
      return `${equipment.name} can only be placed in: ${equipment.allowedLocations.join(', ')}`
    }
    
    if (equipment.locationRestrictions?.type === 'engine_slots') {
      return `${equipment.name} can only be placed in locations with engine slots (depends on engine type)`
    }
    
    return `${equipment.name} cannot be placed in ${location}`
  }

  /**
   * Attempt to allocate equipment from unallocated pool
   */
  allocateEquipmentFromPool(equipmentGroupId: string, location: string, startSlot: number): boolean {
    console.log(`[UnitCriticalManager] allocateEquipmentFromPool called with:`, {
      equipmentGroupId,
      location,
      startSlot
    })
    
    const equipment = this.removeUnallocatedEquipment(equipmentGroupId)
    if (!equipment) {
      console.error(`[UnitCriticalManager] FAILED: Could not remove equipment ${equipmentGroupId} from unallocated pool`)
      return false
    }
    
    console.log(`[UnitCriticalManager] Successfully removed equipment from unallocated pool:`, {
      name: equipment.equipmentData.name,
      groupId: equipment.equipmentGroupId,
      componentType: (equipment.equipmentData as any).componentType
    })
    
    // Check location restrictions
    if (!this.canPlaceEquipmentInLocation(equipment.equipmentData, location)) {
      console.warn(`[UnitCriticalManager] Location restriction failed for ${equipment.equipmentData.name} in ${location}`)
      // Restore to unallocated if location is restricted
      this.addUnallocatedEquipment([equipment])
      console.warn(this.getLocationRestrictionError(equipment.equipmentData, location))
      return false
    }
    
    const section = this.getSection(location)
    if (!section) {
      console.error(`[UnitCriticalManager] FAILED: Section not found: ${location}`)
      // Restore to unallocated if section not found
      this.addUnallocatedEquipment([equipment])
      return false
    }
    
    console.log(`[UnitCriticalManager] Attempting to allocate equipment to section ${location} at slot ${startSlot}`)
    const success = section.allocateEquipment(equipment.equipmentData, startSlot, equipmentGroupId)
    
    if (!success) {
      console.error(`[UnitCriticalManager] FAILED: Section allocation failed for ${equipment.equipmentData.name}`)
      // Restore to unallocated if allocation failed
      this.addUnallocatedEquipment([equipment])
    } else {
      console.log(`[UnitCriticalManager] SUCCESS: Equipment ${equipment.equipmentData.name} allocated to ${location} slot ${startSlot}`)
    }
    
    console.log(`[UnitCriticalManager] Final unallocated equipment count: ${this.unallocatedEquipment.length}`)
    
    return success
  }

  /**
   * Get current unit configuration
   */
  getConfiguration(): UnitConfiguration {
    return { ...this.configuration }
  }

  // ===== COMPUTED PROPERTIES FOR CONSTRUCTION LIMITS =====
  // All BattleTech construction rules centralized here

  /**
   * Get maximum armor tonnage allowed for this unit
   */
  getMaxArmorTonnage(): number {
    // BattleTech rule: Maximum armor tonnage for any unit
    // Cannot exceed remaining tonnage or physical armor limits
    const remainingTonnage = this.getRemainingTonnageForArmor()
    const physicalMaxTonnage = this.getPhysicalMaxArmorTonnage()
    
    // Return the smaller of the two limits
    const maxTonnage = Math.min(remainingTonnage, physicalMaxTonnage)
    
    // Round to nearest 0.5 ton
    return Math.ceil(maxTonnage * 2) / 2
  }

  /**
   * Get the physical maximum armor tonnage based on BattleTech construction rules
   */
  getPhysicalMaxArmorTonnage(): number {
    // BattleTech rule: Maximum armor points based on internal structure
    const maxArmorPoints = this.getMaxArmorPoints()
    const armorEfficiency = this.getArmorEfficiency()
    
    // Convert max armor points to tonnage
    return maxArmorPoints / armorEfficiency
  }

  /**
   * Get maximum armor points allowed for this unit
   */
  getMaxArmorPoints(): number {
    // BattleTech rule: Head max (9) + sum of all other location max armor
    const tonnage = this.configuration.tonnage
    
    // Internal structure points by location
    const internalStructure = this.getInternalStructurePoints()
    
    // Max armor = Head max + (sum of other locations × 2)
    const headMax = 9
    const otherLocationsMax = (internalStructure.CT + internalStructure.LT + internalStructure.RT + 
                              internalStructure.LA + internalStructure.RA + internalStructure.LL + 
                              internalStructure.RL) * 2
    
    return headMax + otherLocationsMax
  }

  /**
   * Get internal structure points for each location using official BattleTech table
   */
  getInternalStructurePoints(): Record<string, number> {
    const { getInternalStructurePoints } = require('../internalStructureTable')
    const structure = getInternalStructurePoints(this.configuration.tonnage)
    
    return {
      HD: structure.HD,
      CT: structure.CT,
      LT: structure.LT,
      RT: structure.RT,
      LA: structure.LA,
      RA: structure.RA,
      LL: structure.LL,
      RL: structure.RL
    }
  }

  /**
   * Get armor efficiency for current armor type
   */
  getArmorEfficiency(): number {
    const { ARMOR_POINTS_PER_TON } = require('../armorCalculations')
    return ARMOR_POINTS_PER_TON[this.configuration.armorType] || 16
  }

  /**
   * Get maximum armor points for a specific location
   */
  getMaxArmorPointsForLocation(location: string): number {
    const internalStructure = this.getInternalStructurePoints()
    
    if (location === 'HD') {
      return 9 // Head max is always 9
    }
    
    const structurePoints = internalStructure[location] || 0
    return structurePoints * 2
  }

  /**
   * Get maximum walk MP for this tonnage
   */
  getMaxWalkMP(): number {
    return Math.floor(400 / this.configuration.tonnage)
  }

  /**
   * Get remaining tonnage available for equipment/armor
   */
  getRemainingTonnage(): number {
    const usedTonnage = this.getUsedTonnage()
    return Math.max(0, this.configuration.tonnage - usedTonnage)
  }

  /**
   * Get total tonnage used by structure, engine, gyro, cockpit, heat sinks
   */
  getUsedTonnage(): number {
    const config = this.configuration
    
    // Structure weight (10% of unit tonnage)
    const structureWeight = config.tonnage * 0.1
    
    // Engine weight
    const engineWeight = this.getEngineWeight()
    
    // Gyro weight
    const gyroWeight = this.getGyroWeight()
    
    // Cockpit weight (always 3 tons for standard)
    const cockpitWeight = 3.0
    
    // Heat sink weight (external only, internal are part of engine)
    const heatSinkWeight = config.externalHeatSinks * this.getHeatSinkTonnage()
    
    // Jump jet weight
    const jumpJetWeight = this.getJumpJetWeight()
    
    // Current armor weight
    const armorWeight = config.armorTonnage
    
    return structureWeight + engineWeight + gyroWeight + cockpitWeight + heatSinkWeight + jumpJetWeight + armorWeight
  }

  /**
   * Get engine weight based on type and rating
   */
  getEngineWeight(): number {
    const rating = this.configuration.engineRating
    const type = this.configuration.engineType
    
    let multiplier = 1.0 // Standard engine
    
    switch (type) {
      case 'XL':
        multiplier = 0.5
        break
      case 'Light':
        multiplier = 0.75
        break
      case 'XXL':
        multiplier = 0.33
        break
      case 'Compact':
        multiplier = 1.5
        break
      case 'ICE':
      case 'Fuel Cell':
        multiplier = 2.0
        break
    }
    
    return (rating * multiplier) / 25
  }

  /**
   * Get gyro weight based on type and engine rating
   */
  getGyroWeight(): number {
    const rating = this.configuration.engineRating
    const type = this.configuration.gyroType
    
    let baseWeight = Math.ceil(rating / 100)
    
    switch (type) {
      case 'XL':
        return baseWeight * 0.5
      case 'Compact':
        return baseWeight * 1.5
      case 'Heavy-Duty':
        return baseWeight * 2.0
      default: // Standard
        return baseWeight
    }
  }

  /**
   * Get heat sink tonnage per unit
   */
  getHeatSinkTonnage(): number {
    const type = this.configuration.heatSinkType
    
    switch (type) {
      case 'Double':
      case 'Double (Clan)':
        return 1.0
      case 'Compact':
        return 0.5
      case 'Laser':
        return 1.5
      default: // Single
        return 1.0
    }
  }

  /**
   * Get total jump jet weight
   */
  getJumpJetWeight(): number {
    const jumpMP = this.configuration.jumpMP || 0
    if (jumpMP === 0) return 0
    
    const tonnage = this.configuration.tonnage
    
    // Jump jet weight by tonnage class
    if (tonnage <= 55) {
      return jumpMP * 0.5
    } else if (tonnage <= 85) {
      return jumpMP * 1.0
    } else {
      return jumpMP * 2.0
    }
  }

  /**
   * Get remaining tonnage that could be used for armor
   */
  getRemainingTonnageForArmor(): number {
    // Calculate what tonnage would be without current armor allocation
    const usedWithoutArmor = this.getUsedTonnage() - this.configuration.armorTonnage
    const availableForArmor = this.configuration.tonnage - usedWithoutArmor
    
    // Return raw available tonnage (no circular dependency)
    return Math.max(0, availableForArmor)
  }

  // ===== OPTION A: SINGLE SOURCE OF TRUTH + COMPUTED PROPERTIES =====
  // Clean armor points calculation - no data conflicts

  /**
   * Get available armor points from tonnage investment
   */
  getAvailableArmorPoints(): number {
    return Math.floor(this.configuration.armorTonnage * this.getArmorEfficiency())
  }

  /**
   * Get allocated armor points from location assignments
   */
  getAllocatedArmorPoints(): number {
    return Object.values(this.configuration.armorAllocation).reduce((total, location) => {
      return total + (location.front || 0) + (location.rear || 0)
    }, 0)
  }

  /**
   * Get unallocated armor points available for auto-allocation
   * ALLOWS NEGATIVE VALUES: Shows over-allocation relative to tonnage investment
   */
  getUnallocatedArmorPoints(): number {
    const availableFromTonnage = this.getAvailableArmorPoints()
    const allocated = this.getAllocatedArmorPoints()
    
    // CRITICAL FIX: Allow negative values to show over-allocation
    // This shows the true balance between tonnage investment and allocation
    return availableFromTonnage - allocated
  }

  /**
   * Get armor points remaining for allocation (legacy compatibility)
   */
  getRemainingArmorPoints(): number {
    return this.getUnallocatedArmorPoints()
  }

  /**
   * Calculate wasted armor points using simple maximum comparison
   * CLEAN LOGIC: Pure comparison between tonnage maximum vs unit maximum
   */
  getArmorWasteAnalysis(): {
    totalWasted: number;
    wastedFromRounding: number;
    trappedPoints: number;
    locationsAtCap: number;
    wastePercentage: number;
    optimalTonnage: number;
    tonnageSavings: number;
  } {
    const unitMaximum = this.getMaxArmorPoints()           // Unit's physical armor limit
    const tonnageMaximum = this.getAvailableArmorPoints()  // Points available from tonnage investment
    const allocatedPoints = this.getAllocatedArmorPoints()
    const armorEfficiency = this.getArmorEfficiency()
    
    // CLEAN WASTE CALCULATION: Only waste when tonnage exceeds unit capacity
    const totalWasted = Math.max(0, tonnageMaximum - unitMaximum)
    
    // Count locations at maximum capacity
    let locationsAtCap = 0
    Object.entries(this.configuration.armorAllocation).forEach(([location, armor]) => {
      const maxForLocation = this.getMaxArmorPointsForLocation(location)
      const currentArmor = (armor.front || 0) + (armor.rear || 0)
      
      if (currentArmor >= maxForLocation) {
        locationsAtCap++
      }
    })
    
    // Calculate optimal tonnage (minimum needed for current allocation)
    const optimalPoints = Math.min(allocatedPoints, unitMaximum)
    const optimalTonnage = Math.ceil(optimalPoints / armorEfficiency * 2) / 2 // Round to nearest 0.5 ton
    
    // Calculate potential tonnage savings
    const tonnageSavings = Math.max(0, this.configuration.armorTonnage - optimalTonnage)
    
    // Calculate waste percentage based on tonnage investment
    const wastePercentage = tonnageMaximum > 0 ? (totalWasted / tonnageMaximum) * 100 : 0
    
    // For backwards compatibility, break down waste types (though simpler now)
    const wastedFromRounding = 0  // Not applicable in simplified model
    const trappedPoints = totalWasted  // All waste is "trapped" by unit limits
    
    return {
      totalWasted,
      wastedFromRounding,
      trappedPoints,
      locationsAtCap,
      wastePercentage,
      optimalTonnage,
      tonnageSavings
    }
  }

  /**
   * Check if armor allocation has any waste
   */
  hasArmorWaste(): boolean {
    return this.getArmorWasteAnalysis().totalWasted > 0;
  }

  /**
   * Get wasted armor points (simple version for quick checks)
   */
  getWastedArmorPoints(): number {
    return this.getArmorWasteAnalysis().totalWasted;
  }

  /**
   * Validate if current configuration exceeds any limits
   */
  isOverweight(): boolean {
    return this.getUsedTonnage() > this.configuration.tonnage
  }

  /**
   * Get weight validation status
   */
  getWeightValidation(): { isValid: boolean, overweight: number, warnings: string[] } {
    const usedTonnage = this.getUsedTonnage()
    const maxTonnage = this.configuration.tonnage
    const overweight = Math.max(0, usedTonnage - maxTonnage)
    
    const warnings: string[] = []
    
    if (overweight > 0) {
      warnings.push(`Unit is ${overweight.toFixed(1)} tons overweight`)
    }
    
    // Check if close to limit
    const remaining = maxTonnage - usedTonnage
    if (remaining > 0 && remaining < 1) {
      warnings.push(`Only ${remaining.toFixed(1)} tons remaining`)
    }
    
    return {
      isValid: overweight === 0,
      overweight,
      warnings
    }
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
   * Get slot status specifically for user equipment (excludes system components)
   * This is what the Equipment Tray should use for accurate capacity warnings
   */
  getUserEquipmentSlotStatus(): {
    totalUserSlots: number      // Slots available for user equipment
    usedUserSlots: number       // Slots occupied by user equipment
    availableUserSlots: number  // Remaining slots for user equipment
  } {
    // Calculate system component slot usage
    const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(
      this.configuration.engineType,
      this.configuration.gyroType
    )
    
    // Count engine slots across all torso sections
    const engineSlots = systemAllocation.engine.centerTorso.length +
                       systemAllocation.engine.leftTorso.length +
                       systemAllocation.engine.rightTorso.length
    
    // Count gyro slots (always in center torso)
    const gyroSlots = systemAllocation.gyro.centerTorso.length
    
    // Count fixed component slots (actuators, cockpit, life support, sensors)
    const fixedComponentSlots = this.getMandatoryComponentSlots()
    
    // Calculate total slots reserved for system components
    const systemReservedSlots = engineSlots + gyroSlots + fixedComponentSlots
    
    // Calculate available slots for user equipment
    const totalCriticalSlots = 78 // Standard BattleMech total
    const totalUserSlots = totalCriticalSlots - systemReservedSlots
    
    // Count user equipment slots (exclude system components)
    let usedUserSlots = 0
    this.sections.forEach(section => {
      section.getAllEquipment().forEach(allocation => {
        // Only count user equipment, not system components
        if (!this.isSystemComponent(allocation.equipmentData)) {
          usedUserSlots += allocation.occupiedSlots.length
        }
      })
    })
    
    // Calculate remaining slots available for user equipment
    const availableUserSlots = Math.max(0, totalUserSlots - usedUserSlots)
    
    return {
      totalUserSlots,
      usedUserSlots,
      availableUserSlots
    }
  }

  /**
   * Check if equipment is a system component (engine, gyro, actuators, etc.)
   */
  private isSystemComponent(equipment: EquipmentObject): boolean {
    const name = equipment.name.toLowerCase()
    
    // System component patterns
    const systemPatterns = [
      'engine', 'gyro', 'actuator', 'cockpit', 'life support', 'sensors',
      'shoulder', 'upper arm', 'lower arm', 'hand', 'hip', 'upper leg', 'lower leg', 'foot'
    ]
    
    return systemPatterns.some(pattern => name.includes(pattern))
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
    totalWeight: number
    heatGenerated: number
    heatDissipated: number
  } {
    let totalSlots = 0
    let occupiedSlots = 0
    let systemSlots = 0
    
    // Count mandatory fixed components that are always present
    const mandatorySlots = this.getMandatoryComponentSlots()
    
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
    
    // Add mandatory component slots to occupied count
    occupiedSlots += mandatorySlots
    systemSlots += mandatorySlots
    
    // Calculate heat values
    const heatDissipated = this.getHeatDissipation()
    const heatGenerated = this.getHeatGeneration()
    
    return {
      totalSections: this.sections.size,
      totalSlots,
      occupiedSlots,
      availableSlots: totalSlots - occupiedSlots,
      totalEquipment: this.getAllocatedEquipmentCount(),
      unallocatedEquipment: this.getUnallocatedEquipmentCount(),
      systemSlots,
      totalWeight: this.getUsedTonnage(),
      heatGenerated,
      heatDissipated
    }
  }

  /**
   * Get mandatory component critical slots that are always present
   */
  private getMandatoryComponentSlots(): number {
    // Fixed components that are always present:
    // - Cockpit: 1 slot (Head)
    // - Life Support: 2 slots (Head) 
    // - Sensors: 2 slots (Head)
    // - Actuators: 4 slots per arm (shoulder, upper, lower, hand) + 4 slots per leg (hip, upper, lower, foot)
    
    const cockpitSlots = 1
    const lifeSupportSlots = 2
    const sensorSlots = 2
    const armActuatorSlots = 4 * 2 // 4 slots per arm × 2 arms
    const legActuatorSlots = 4 * 2 // 4 slots per leg × 2 legs
    
    return cockpitSlots + lifeSupportSlots + sensorSlots + armActuatorSlots + legActuatorSlots
  }

  /**
   * Get total heat dissipation capacity
   */
  getHeatDissipation(): number {
    const config = this.configuration
    const efficiency = this.getHeatSinkEfficiency()
    return config.totalHeatSinks * efficiency
  }

  /**
   * Get current heat generation from all equipment
   */
  getHeatGeneration(): number {
    // Currently no weapons/equipment generating heat in base configuration
    // This will be calculated from allocated weapons when equipment system is implemented
    return 0
  }

  /**
   * Get heat sink efficiency based on type
   */
  private getHeatSinkEfficiency(): number {
    const type = this.configuration.heatSinkType
    
    switch (type) {
      case 'Double':
      case 'Double (Clan)':
        return 2.0
      case 'Compact':
        return 1.0 // Compact heat sinks are 1:1 but take 0.5 tons
      case 'Laser':
        return 1.0 // Laser heat sinks are 1:1 but immune to critical hits
      default: // Single
        return 1.0
    }
  }

  // ===== NEW CRITICAL SLOT BREAKDOWN SYSTEM =====

  /**
   * Get complete critical slot breakdown using new calculator
   */
  getCriticalSlotBreakdown(): CriticalSlotBreakdown {
    return CriticalSlotCalculator.getCompleteBreakdown(
      this.configuration,
      this.sections,
      this.unallocatedEquipment
    )
  }

  /**
   * Get total critical slots available on a standard BattleMech
   */
  getTotalCriticalSlots(): number {
    return this.getCriticalSlotBreakdown().totals.capacity
  }

  /**
   * Get total critical slots used (including system components and user equipment)
   */
  getTotalUsedCriticalSlots(): number {
    return this.getCriticalSlotBreakdown().totals.used
  }

  /**
   * Get remaining critical slots available for equipment
   */
  getRemainingCriticalSlots(): number {
    return this.getCriticalSlotBreakdown().totals.remaining
  }

  /**
   * Get equipment burden (total if all unallocated equipment was allocated)
   */
  getEquipmentBurden(): number {
    return this.getCriticalSlotBreakdown().totals.equipmentBurden
  }

  /**
   * Get over-capacity slots (how many slots over limit if all equipment allocated)
   */
  getOverCapacitySlots(): number {
    return this.getCriticalSlotBreakdown().totals.overCapacity
  }

  // ===== OBSERVER PATTERN FOR STATE CHANGES =====

  /**
   * Subscribe to state changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  /**
   * Notify all listeners about state changes
   */
  private notifyStateChange(): void {
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('[UnitCriticalManager] Error in state change listener:', error)
      }
    })
  }

  /**
   * RESET TO BASE: Reset unit to base configuration and rebuild everything fresh
   * This clears all equipment and reconstructs the unit from scratch
   */
  resetToBaseConfiguration(): void {
    console.log('[UnitCriticalManager] RESET TO BASE: Starting complete unit reset')
    
    const currentConfig = this.configuration
    
    // Step 1: Clear ALL equipment AND special components
    console.log('[UnitCriticalManager] RESET TO BASE: Clearing ALL equipment and components')
    this.clearAllEquipment()
    this.clearAllSpecialComponents()
    
    // Step 2: Reset special components initialization flag
    console.log('[UnitCriticalManager] RESET TO BASE: Resetting special components flag')
    this.specialComponentsInitialized = false
    
    // Step 3: Clear and rebuild ALL system reservations
    console.log('[UnitCriticalManager] RESET TO BASE: Clearing system reservations')
    this.sections.forEach(section => {
      section.clearSystemReservations('engine')
      section.clearSystemReservations('gyro')
    })
    
    // Step 4: Rebuild system components from scratch
    console.log('[UnitCriticalManager] RESET TO BASE: Rebuilding system components')
    this.allocateSystemComponents()
    
    // Step 5: Initialize special components fresh
    console.log('[UnitCriticalManager] RESET TO BASE: Initializing special components')
    this.initializeSpecialComponents()
    
    // Step 6: Notify listeners about the reset
    console.log('[UnitCriticalManager] RESET TO BASE: Notifying state change')
    this.notifyStateChange()
    
    console.log(`[UnitCriticalManager] RESET TO BASE: Complete! Final unallocated count: ${this.unallocatedEquipment.length}`)
    
    // Log what should be expected
    const structureSlots = this.getStructureCriticalSlots(currentConfig.structureType)
    const armorSlots = this.getArmorCriticalSlots(currentConfig.armorType)
    const jumpSlots = currentConfig.jumpMP
    const expectedTotal = structureSlots + armorSlots + jumpSlots
    
    console.log(`[UnitCriticalManager] RESET TO BASE: Expected components:`)
    console.log(`  - Structure (${currentConfig.structureType}): ${structureSlots}`)
    console.log(`  - Armor (${currentConfig.armorType}): ${armorSlots}`)
    console.log(`  - Jump Jets: ${jumpSlots}`)
    console.log(`  - Total Expected: ${expectedTotal}`)
    console.log(`  - Actual Unallocated: ${this.unallocatedEquipment.length}`)
    
    // CRITICAL DEBUG: Check for duplicates after reset
    const nameCounts = this.unallocatedEquipment.reduce((acc, eq) => {
      const name = eq.equipmentData.name
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(`[UnitCriticalManager] RESET TO BASE: Component counts by name:`, nameCounts)
    
    // Check for duplicate group IDs
    const groupIds = this.unallocatedEquipment.map(eq => eq.equipmentGroupId)
    const uniqueGroupIds = new Set(groupIds)
    if (groupIds.length !== uniqueGroupIds.size) {
      console.error('[UnitCriticalManager] RESET TO BASE: WARNING - Duplicate group IDs detected after reset!')
      console.error('Total:', groupIds.length, 'Unique:', uniqueGroupIds.size)
    }
  }

  // ===== ENHANCED STATE SERIALIZATION METHODS =====

  /**
   * Serialize the complete unit state for persistence
   */
  serializeCompleteState(): CompleteUnitState {
    console.log('[UnitCriticalManager] Serializing complete unit state')
    
    const criticalSlotAllocations: SerializedSlotAllocations = {}
    const timestamp = Date.now()
    
    // Serialize allocated equipment from all sections
    this.sections.forEach((section, location) => {
      const equipment = section.getAllEquipment()
      if (equipment.length > 0) {
        criticalSlotAllocations[location] = {}
        
        equipment.forEach(allocation => {
          // Store equipment in each occupied slot
          allocation.occupiedSlots.forEach(slotIndex => {
            criticalSlotAllocations[location][slotIndex] = this.serializeEquipment(allocation)
          })
        })
      }
    })
    
    // Serialize unallocated equipment
    const unallocatedEquipment = this.unallocatedEquipment.map(allocation => 
      this.serializeEquipment(allocation)
    )
    
    const state: CompleteUnitState = {
      version: '1.0.0',
      configuration: { ...this.configuration },
      criticalSlotAllocations,
      unallocatedEquipment,
      timestamp
    }
    
    console.log('[UnitCriticalManager] Serialized state:', {
      allocatedSections: Object.keys(criticalSlotAllocations).length,
      unallocatedCount: unallocatedEquipment.length,
      configVersion: state.version
    })
    
    return state
  }

  /**
   * Serialize individual equipment allocation
   */
  private serializeEquipment(allocation: EquipmentAllocation): SerializedEquipment {
    return {
      equipmentData: { ...allocation.equipmentData },
      equipmentGroupId: allocation.equipmentGroupId,
      location: allocation.location || '',
      startSlotIndex: allocation.startSlotIndex ?? -1,
      endSlotIndex: allocation.endSlotIndex ?? -1,
      occupiedSlots: [...(allocation.occupiedSlots || [])]
    }
  }

  /**
   * Deserialize and restore complete unit state
   */
  deserializeCompleteState(state: CompleteUnitState): boolean {
    console.log('[UnitCriticalManager] Deserializing complete unit state')
    
    try {
      // Validate state before applying
      const validation = this.validateSerializedState(state)
      if (!validation.isValid && !validation.canRecover) {
        console.error('[UnitCriticalManager] Cannot deserialize invalid state:', validation.errors)
        return false
      }
      
      if (validation.warnings.length > 0) {
        console.warn('[UnitCriticalManager] State deserialization warnings:', validation.warnings)
      }
      
      // Clear current state
      this.clearAllEquipment()
      
      // Update configuration first
      this.configuration = UnitConfigurationBuilder.buildConfiguration(state.configuration)
      
      // Rebuild system components with new configuration
      // CRITICAL FIX: Skip special component initialization during state restoration
      // Special components will be restored from saved unallocated equipment instead
      this.rebuildSystemComponents(true)
      
      // Restore allocated equipment
      this.restoreAllocatedEquipment(state.criticalSlotAllocations)
      
      // Restore unallocated equipment
      this.restoreUnallocatedEquipment(state.unallocatedEquipment)
      
      console.log('[UnitCriticalManager] State deserialization complete')
      return true
      
    } catch (error) {
      console.error('[UnitCriticalManager] Failed to deserialize state:', error)
      return false
    }
  }

  /**
   * Validate serialized state before deserialization
   */
  validateSerializedState(state: CompleteUnitState): StateValidationResult {
    const result: StateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      canRecover: true
    }
    
    // Check version compatibility
    if (!state.version) {
      result.warnings.push('Missing state version, assuming v1.0.0')
    } else if (state.version !== '1.0.0') {
      result.warnings.push(`State version ${state.version} may not be fully compatible`)
    }
    
    // Validate configuration
    if (!state.configuration) {
      result.errors.push('Missing unit configuration')
      result.isValid = false
      result.canRecover = false
      return result
    }
    
    // Validate required configuration fields
    const requiredFields = ['tonnage', 'engineType', 'gyroType', 'structureType', 'armorType']
    for (const field of requiredFields) {
      if (!(field in state.configuration)) {
        result.errors.push(`Missing required configuration field: ${field}`)
        result.isValid = false
      }
    }
    
    // Validate equipment data
    if (state.unallocatedEquipment) {
      state.unallocatedEquipment.forEach((equipment, index) => {
        if (!equipment.equipmentData || !equipment.equipmentGroupId) {
          result.errors.push(`Invalid unallocated equipment at index ${index}`)
          result.isValid = false
        }
      })
    }
    
    // Validate critical slot allocations
    if (state.criticalSlotAllocations) {
      Object.entries(state.criticalSlotAllocations).forEach(([location, slots]) => {
        if (!this.sections.has(location)) {
          result.warnings.push(`Unknown location in saved state: ${location}`)
          return
        }
        
        const section = this.sections.get(location)!
        Object.entries(slots).forEach(([slotStr, equipment]) => {
          const slotIndex = parseInt(slotStr)
          if (slotIndex >= section.getTotalSlots()) {
            result.warnings.push(`Invalid slot index ${slotIndex} in ${location}`)
          }
          
          if (!equipment.equipmentData || !equipment.equipmentGroupId) {
            result.errors.push(`Invalid equipment in ${location} slot ${slotIndex}`)
            result.isValid = false
          }
        })
      })
    }
    
    return result
  }

  /**
   * Clear all equipment from sections and unallocated pool - AGGRESSIVE CLEARING
   */
  private clearAllEquipment(): void {
    console.log('[UnitCriticalManager] AGGRESSIVE CLEAR: Clearing all equipment')
    
    const beforeUnallocated = this.unallocatedEquipment.length
    
    // Get complete inventory before clearing
    let totalEquipmentCount = 0
    this.sections.forEach(section => {
      totalEquipmentCount += section.getAllEquipment().length
    })
    totalEquipmentCount += this.unallocatedEquipment.length
    
    console.log(`[UnitCriticalManager] AGGRESSIVE CLEAR: Before clearing - Allocated: ${totalEquipmentCount - beforeUnallocated}, Unallocated: ${beforeUnallocated}, Total: ${totalEquipmentCount}`)
    
    // STEP 1: Force clear ALL unallocated equipment
    this.unallocatedEquipment = []
    console.log('[UnitCriticalManager] AGGRESSIVE CLEAR: Forced clear of unallocated equipment')
    
    // STEP 2: Force clear ALL equipment from sections (preserve system components)
    this.sections.forEach((section, location) => {
      const beforeSection = section.getAllEquipment().length
      
      // Get all equipment and remove each one
      const allEquipment = [...section.getAllEquipment()] // Copy array to avoid modification during iteration
      allEquipment.forEach(equipment => {
        section.removeEquipmentGroup(equipment.equipmentGroupId)
      })
      
      const afterSection = section.getAllEquipment().length
      console.log(`[UnitCriticalManager] AGGRESSIVE CLEAR: ${location} - Removed ${beforeSection - afterSection} equipment pieces`)
    })
    
    // STEP 3: Verify complete clearing
    let remainingEquipmentCount = 0
    this.sections.forEach(section => {
      remainingEquipmentCount += section.getAllEquipment().length
    })
    remainingEquipmentCount += this.unallocatedEquipment.length
    
    console.log(`[UnitCriticalManager] AGGRESSIVE CLEAR: After clearing - Total remaining equipment: ${remainingEquipmentCount}`)
    
    if (remainingEquipmentCount > 0) {
      console.error('[UnitCriticalManager] AGGRESSIVE CLEAR: WARNING - Equipment still remains after clearing!')
      this.sections.forEach((section, location) => {
        const remaining = section.getAllEquipment()
        if (remaining.length > 0) {
          console.error(`  ${location}: ${remaining.length} pieces:`, remaining.map(eq => eq.equipmentData.name))
        }
      })
    }
  }

  /**
   * Clear all special components before rebuilding
   * ULTIMATE FIX: Clear from BOTH unallocated AND allocated slots using comprehensive detection
   */
  clearAllSpecialComponents(): void {
    console.log('[ULTIMATE FIX] Clearing ALL special components using comprehensive detection')
    
    const beforeUnallocated = this.unallocatedEquipment.length
    
    // ULTIMATE FIX: Remove ALL special components using comprehensive detection
    this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => {
      return !this.isSpecialComponent(eq.equipmentData)
    })
    
    const afterUnallocated = this.unallocatedEquipment.length
    
    // ULTIMATE FIX: Remove ALL special components from ALLOCATED slots across all sections
    let removedFromSlots = 0
    this.sections.forEach(section => {
      const equipmentToRemove = section.getAllEquipment().filter(eq => {
        return this.isSpecialComponent(eq.equipmentData)
      })
      
      equipmentToRemove.forEach(eq => {
        const removed = section.removeEquipmentGroup(eq.equipmentGroupId)
        if (removed) {
          removedFromSlots++
        }
      })
    })
    
    console.log(`[ULTIMATE FIX] Cleared ALL special components:`)
    console.log(`  - From unallocated: ${beforeUnallocated - afterUnallocated} (${beforeUnallocated} → ${afterUnallocated})`)
    console.log(`  - From allocated slots: ${removedFromSlots}`)
    console.log(`  - Total cleared: ${(beforeUnallocated - afterUnallocated) + removedFromSlots}`)
  }

  /**
   * Comprehensive detection of special components
   * Detects by component type, name patterns, and IDs to catch ALL variants
   * Heat sinks are NOT special components - they are regular equipment that happens to be auto-generated
   */
  private isSpecialComponent(equipment: EquipmentObject): boolean {
    const specialEq = equipment as SpecialEquipmentObject
    const name = equipment.name.toLowerCase()
    const id = equipment.id.toLowerCase()
    
    // CRITICAL: Heat sinks are NOT special components - exclude them explicitly
    if (name.includes('heat sink') || equipment.type === 'heat_sink') {
      return false
    }
    
    // Check by componentType field (preferred method)
    if (specialEq.componentType === 'structure' || specialEq.componentType === 'armor') {
      return true
    }
    
    // Check by name patterns for structure types
    const structureTypes = [
      'endo steel', 'endosteel', 'endo_steel',
      'composite', 'reinforced', 'industrial'
    ]
    
    // Check by name patterns for armor types  
    const armorTypes = [
      'ferro-fibrous', 'ferrofibrous', 'ferro_fibrous',
      'light ferro', 'heavy ferro', 'stealth', 'reactive', 'reflective', 'hardened'
    ]
    
    // Check by name patterns for jump jets
    const jumpJetTypes = [
      'jump', 'umu', 'booster', 'wing'
    ]
    
    // Check if name matches any special component pattern
    const isStructure = structureTypes.some(type => name.includes(type))
    const isArmor = armorTypes.some(type => name.includes(type))
    const isJumpJet = jumpJetTypes.some(type => name.includes(type))
    
    // Check if ID matches special component pattern (exclude heat sink IDs)
    const hasSpecialId = !name.includes('heat sink') && (id.includes('piece') || id.includes('endo') || id.includes('ferro') || id.includes('jump'))
    
    const isSpecial = isStructure || isArmor || isJumpJet || hasSpecialId
    
    if (isSpecial) {
      console.log(`[ULTIMATE FIX] Detected special component: ${equipment.name} (ID: ${equipment.id})`)
    }
    
    return isSpecial
  }

  /**
   * Rebuild system components after configuration change
   * @param skipSpecialComponents - Skip special component initialization during state restoration
   */
  private rebuildSystemComponents(skipSpecialComponents: boolean = false): void {
    console.log('[UnitCriticalManager] Rebuilding system components, skipSpecialComponents:', skipSpecialComponents)
    
    // CRITICAL FIX: Only clear special components during complete rebuild (state restoration)
    // Normal configuration changes should use transfer logic to preserve components
    if (skipSpecialComponents) {
      console.log('[UnitCriticalManager] Complete rebuild: Clearing ALL special components before restoration')
      this.clearAllSpecialComponents()
    }
    
    // Clear existing system reservations
    this.sections.forEach(section => {
      section.clearSystemReservations('engine')
      section.clearSystemReservations('gyro')
    })
    
    // Reallocate system components with current configuration
    this.allocateSystemComponents()
    
    // Reinitialize special components ONLY if not restoring state
    // During state restoration, special components will be restored from saved unallocated equipment
    if (!skipSpecialComponents) {
      console.log('[UnitCriticalManager] Initializing special components for new/modified configuration')
      this.initializeSpecialComponents()
    } else {
      console.log('[UnitCriticalManager] Skipping special component initialization during state restoration')
    }
  }

  /**
   * Restore allocated equipment to critical slots
   */
  private restoreAllocatedEquipment(allocations: SerializedSlotAllocations): void {
    console.log('[UnitCriticalManager] Restoring allocated equipment')
    
    const processedGroups = new Set<string>()
    
    Object.entries(allocations).forEach(([location, slots]) => {
      const section = this.sections.get(location)
      if (!section) {
        console.warn(`[UnitCriticalManager] Section not found: ${location}`)
        return
      }
      
      Object.entries(slots).forEach(([slotStr, serializedEquipment]) => {
        const slotIndex = parseInt(slotStr)
        
        // Skip if we've already processed this equipment group
        if (processedGroups.has(serializedEquipment.equipmentGroupId)) {
          return
        }
        
        try {
          // Attempt to allocate the equipment
          const success = section.allocateEquipment(
            serializedEquipment.equipmentData,
            serializedEquipment.startSlotIndex,
            serializedEquipment.equipmentGroupId
          )
          
          if (success) {
            processedGroups.add(serializedEquipment.equipmentGroupId)
            console.log(`[UnitCriticalManager] Restored ${serializedEquipment.equipmentData.name} to ${location}`)
          } else {
            console.warn(`[UnitCriticalManager] Failed to restore ${serializedEquipment.equipmentData.name} to ${location}, adding to unallocated`)
            // Add to unallocated if allocation failed
            this.addToUnallocatedFromSerialized(serializedEquipment)
          }
        } catch (error) {
          console.error(`[UnitCriticalManager] Error restoring equipment ${serializedEquipment.equipmentData.name}:`, error)
          this.addToUnallocatedFromSerialized(serializedEquipment)
        }
      })
    })
  }

  /**
   * Restore unallocated equipment
   */
  private restoreUnallocatedEquipment(unallocatedEquipment: SerializedEquipment[]): void {
    console.log('[UnitCriticalManager] Restoring unallocated equipment')
    
    unallocatedEquipment.forEach(serializedEquipment => {
      this.addToUnallocatedFromSerialized(serializedEquipment)
    })
    
    console.log(`[UnitCriticalManager] Restored ${unallocatedEquipment.length} unallocated equipment pieces`)
  }

  /**
   * Add serialized equipment to unallocated pool
   */
  private addToUnallocatedFromSerialized(serializedEquipment: SerializedEquipment): void {
    const allocation: EquipmentAllocation = {
      equipmentData: serializedEquipment.equipmentData,
      equipmentGroupId: serializedEquipment.equipmentGroupId,
      location: '',
      startSlotIndex: -1,
      endSlotIndex: -1,
      occupiedSlots: []
    }
    
    this.unallocatedEquipment.push(allocation)
  }

  /**
   * Create a minimal state for backward compatibility
   */
  static createMinimalStateFromConfiguration(configuration: UnitConfiguration): CompleteUnitState {
    return {
      version: '1.0.0',
      configuration,
      criticalSlotAllocations: {},
      unallocatedEquipment: [],
      timestamp: Date.now()
    }
  }

  /**
   * Check if a state is from an older version that only has configuration
   */
  static isLegacyConfigurationOnly(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           'tonnage' in data && 
           !('version' in data) && 
           !('criticalSlotAllocations' in data)
  }

  /**
   * Convert legacy configuration-only data to complete state
   */
  static upgradeLegacyConfiguration(legacyConfig: UnitConfiguration): CompleteUnitState {
    console.log('[UnitCriticalManager] Upgrading legacy configuration to complete state')
    return this.createMinimalStateFromConfiguration(legacyConfig)
  }
}
