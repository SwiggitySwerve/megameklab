/**
 * Refactored Unit Critical Manager - Focused on coordination and delegation
 * Uses specialized services for different concerns and Command pattern for complex operations
 */

import { CriticalSection, LocationSlotConfiguration, FixedSystemComponent } from './CriticalSection'
import { EquipmentObject, EquipmentAllocation } from './CriticalSlot'
import { EngineType, GyroType, SystemComponentRules } from './SystemComponentRules'
import { ARMOR_SLOT_REQUIREMENTS, getArmorSlots } from '../armorCalculations'
import { JumpJetType } from '../jumpJetCalculations'
import { CriticalSlotCalculator } from './CriticalSlotCalculator'
import { CriticalSlotBreakdown } from '../editor/UnitCalculationService'
import { 
  ComponentConfiguration, 
  TechBase, 
  ComponentCategory, 
  createComponentConfiguration,
  migrateStringToComponentConfiguration,
  getComponentTypeNames
} from '../../types/componentConfiguration'

// Import types and builder from extracted files
import {
  UnitValidationResult,
  SpecialEquipmentObject,
  CompleteUnitState,
  SerializedEquipment,
  SerializedSlotAllocations,
  StateValidationResult,
  ArmorAllocation,
  UnitConfiguration,
  StructureType,
  ArmorType,
  HeatSinkType,
  LegacyUnitConfiguration
} from './UnitCriticalManagerTypes'

import { UnitConfigurationBuilder } from './UnitConfigurationBuilder'
import { SpecialComponentsManager } from './SpecialComponentsManager'
import { SystemComponentsManager } from './SystemComponentsManager'
import { EquipmentAllocationManager } from './EquipmentAllocationManager'
import { WeightBalanceManager } from './WeightBalanceManager'
import { HeatManagementManager } from './HeatManagementManager'
import { ValidationManager } from './ValidationManager'
import { UnitSerializationManager } from './UnitSerializationManager'
import { UnitCalculationManager } from './UnitCalculationManager'
import { UnitStateManager } from './UnitStateManager'
import { ConfigurationManager } from './ConfigurationManager'
import { ComponentTypeManager } from './ComponentTypeManager'
import { CriticalSlotCalculationManager } from './CriticalSlotCalculationManager'
import { EquipmentQueryManager } from './EquipmentQueryManager'
import { EventManager } from './EventManager'

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
    availableSlotIndices: [3],
    systemReservedSlots: []
  },
  {
    location: 'Center Torso',
    totalSlots: 12,
    fixedSlots: new Map(),
    availableSlotIndices: [],
    systemReservedSlots: []
  },
  {
    location: 'Left Torso',
    totalSlots: 12,
    fixedSlots: new Map(),
    availableSlotIndices: [],
    systemReservedSlots: []
  },
  {
    location: 'Right Torso',
    totalSlots: 12,
    fixedSlots: new Map(),
    availableSlotIndices: [],
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
    availableSlotIndices: [4, 5, 6, 7, 8, 9, 10, 11],
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
    availableSlotIndices: [4, 5, 6, 7, 8, 9, 10, 11],
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
    availableSlotIndices: [4, 5],
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
    availableSlotIndices: [4, 5],
    systemReservedSlots: []
  }
]

export const TOTAL_CRITICAL_SLOTS = 78

/**
 * Command Pattern Implementation for Unit Operations
 */
interface UnitCommand {
  execute(): boolean
  undo?(): boolean
  description: string
}

class ConfigurationUpdateCommand implements UnitCommand {
  description = 'Update unit configuration'
  
  constructor(
    private manager: UnitCriticalManagerRefactored,
    private newConfiguration: UnitConfiguration,
    private oldConfiguration: UnitConfiguration
  ) {}

  execute(): boolean {
    return this.manager.executeConfigurationUpdate(this.newConfiguration, this.oldConfiguration)
  }

  undo(): boolean {
    return this.manager.executeConfigurationUpdate(this.oldConfiguration, this.newConfiguration)
  }
}

class EquipmentAllocationCommand implements UnitCommand {
  description = 'Allocate equipment from pool'
  
  constructor(
    private manager: UnitCriticalManagerRefactored,
    private equipmentGroupId: string,
    private location: string,
    private startSlot: number
  ) {}

  execute(): boolean {
    return this.manager.equipmentAllocationManager.allocateEquipmentFromPool(
      this.equipmentGroupId,
      this.location,
      this.startSlot
    )
  }
}

/**
 * Refactored Unit Critical Manager
 * Focused on coordination and delegation to specialized services
 */
export class UnitCriticalManagerRefactored {
  private sections: Map<string, CriticalSection>
  public unallocatedEquipment: EquipmentAllocation[]
  public configuration: UnitConfiguration
  private listeners: (() => void)[] = []
  private specialComponentsInitialized: boolean = false
  private commandHistory: UnitCommand[] = []

  // Specialized Services - Dependency Injection
  public specialComponentsManager: SpecialComponentsManager
  public systemComponentsManager: SystemComponentsManager
  public equipmentAllocationManager: EquipmentAllocationManager
  public weightBalanceManager: WeightBalanceManager
  public heatManagementManager: HeatManagementManager
  public validationManager: ValidationManager
  public serializationManager: UnitSerializationManager
  public calculationManager: UnitCalculationManager
  public stateManager: UnitStateManager
  public configurationManager: ConfigurationManager
  public equipmentQueryManager: EquipmentQueryManager
  public eventManager: EventManager

  constructor(configuration: UnitConfiguration | LegacyUnitConfiguration) {
    // Convert legacy configuration to new format if needed
    this.configuration = UnitConfigurationBuilder.buildConfiguration(configuration)
    this.sections = new Map()
    this.unallocatedEquipment = []
    
    this.initializeSections()
    this.initializeServices()
    this.initializeSpecialComponents()
  }

  /**
   * Initialize critical sections
   */
  private initializeSections(): void {
    MECH_LOCATION_CONFIGS.forEach(config => {
      const section = new CriticalSection(config.location, config)
      this.sections.set(config.location, section)
    })
  }

  /**
   * Initialize all specialized services
   */
  private initializeServices(): void {
    // Event management
    this.eventManager = new EventManager()
    
    // Core managers
    this.specialComponentsManager = new SpecialComponentsManager(
      this.sections,
      this.unallocatedEquipment,
      this.configuration
    )
    
    this.systemComponentsManager = new SystemComponentsManager(
      this,
      this.sections
    )
    
    this.equipmentAllocationManager = new EquipmentAllocationManager(
      this,
      this.sections,
      this.configuration
    )
    
    // Calculation services
    this.weightBalanceManager = new WeightBalanceManager(
      this.configuration,
      this.unallocatedEquipment
    )
    
    this.heatManagementManager = new HeatManagementManager(
      this.configuration,
      this.unallocatedEquipment
    )
    
    this.calculationManager = new UnitCalculationManager()
    
    // State and configuration services
    this.stateManager = new UnitStateManager(this.sections, this.unallocatedEquipment, this)
    this.configurationManager = new ConfigurationManager(this.configuration)
    
    // Query and validation services
    this.equipmentQueryManager = new EquipmentQueryManager(this.sections, this.unallocatedEquipment, this.configuration)
    this.validationManager = new ValidationManager(
      this.sections,
      this.unallocatedEquipment,
      this.configuration
    )
    
    // Serialization service
    this.serializationManager = new UnitSerializationManager()
    
    // Allocate system components after services are initialized
    this.systemComponentsManager.allocateSystemComponents()
  }

  /**
   * Initialize special components once
   */
  private initializeSpecialComponents(): void {
    if (this.specialComponentsInitialized) {
      return
    }

    this.specialComponentsManager.initializeSpecialComponents()
    this.systemComponentsManager.initializeEquipmentComponents()
    this.specialComponentsInitialized = true
  }

  /**
   * Update configuration using Command pattern
   */
  updateConfiguration(newConfiguration: UnitConfiguration): void {
    const command = new ConfigurationUpdateCommand(
      this,
      newConfiguration,
      this.configuration
    )
    
    const success = command.execute()
    if (success) {
      this.commandHistory.push(command)
    }
  }

  /**
   * Execute configuration update (called by command)
   */
  executeConfigurationUpdate(newConfiguration: UnitConfiguration, oldConfiguration: UnitConfiguration): boolean {
    try {
      const result = this.configurationManager.updateConfiguration(newConfiguration)
      
      if (result.success) {
        this.configuration = result.newConfiguration
        
        // Handle system component changes
        if (result.changes.engineChanged || result.changes.gyroChanged) {
          const allDisplacedEquipment = this.systemComponentsManager.handleSystemComponentChange(oldConfiguration, newConfiguration)
          if (allDisplacedEquipment.length > 0) {
            this.addUnallocatedEquipment(allDisplacedEquipment)
          }
        }
        
        // Handle special component changes
        if (result.changes.structureChanged || result.changes.armorChanged) {
          this.specialComponentsManager.configuration = newConfiguration
        }
        
        // Update all service configurations
        this.updateServiceConfigurations(newConfiguration)
        
        // Ensure system components are updated
        this.systemComponentsManager.initializeEquipmentComponents()
        
        this.eventManager.notifyStateChange()
        return true
      }
      
      return false
    } catch (error) {
      console.error('[UnitCriticalManagerRefactored] Configuration update failed:', error)
      return false
    }
  }

  /**
   * Update all service configurations
   */
  private updateServiceConfigurations(newConfiguration: UnitConfiguration): void {
    this.weightBalanceManager.configuration = newConfiguration
    this.heatManagementManager.configuration = newConfiguration
    this.validationManager.configuration = newConfiguration
    this.equipmentQueryManager.updateConfiguration(newConfiguration)
  }

  /**
   * Add unallocated equipment with state notification
   */
  addUnallocatedEquipment(equipment: EquipmentAllocation[]): void {
    this.unallocatedEquipment.push(...equipment)
    this.eventManager.notifyStateChange()
  }

  /**
   * Allocate equipment using Command pattern
   */
  allocateEquipmentFromPool(equipmentGroupId: string, location: string, startSlot: number): boolean {
    const command = new EquipmentAllocationCommand(
      this,
      equipmentGroupId,
      location,
      startSlot
    )
    
    const success = command.execute()
    if (success) {
      this.commandHistory.push(command)
      this.eventManager.notifyStateChange()
    }
    
    return success
  }

  // ===== DELEGATION METHODS - Clean Interface =====

  getSection(location: string): CriticalSection | null {
    return this.sections.get(location) || null
  }

  getAllSections(): CriticalSection[] {
    return Array.from(this.sections.values())
  }

  getConfiguration(): UnitConfiguration {
    return this.configuration
  }

  getUnallocatedEquipment(): EquipmentAllocation[] {
    return this.unallocatedEquipment
  }

  validate(): UnitValidationResult {
    return this.validationManager.validate()
  }

  getUsedTonnage(): number {
    return this.weightBalanceManager.getUsedTonnage()
  }

  getRemainingTonnage(): number {
    return this.weightBalanceManager.getRemainingTonnage()
  }

  getHeatDissipation(): number {
    return this.heatManagementManager.getHeatDissipation()
  }

  getHeatGeneration(): number {
    return this.heatManagementManager.getHeatGeneration()
  }

  getCriticalSlotBreakdown(): CriticalSlotBreakdown {
    return this.calculationManager.getCriticalSlotBreakdown(this.sections)
  }

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  serializeCompleteState(): CompleteUnitState {
    return this.serializationManager.serializeCompleteState(
      this.configuration,
      this.sections,
      this.unallocatedEquipment
    )
  }

  deserializeCompleteState(state: CompleteUnitState): boolean {
    return this.serializationManager.deserializeCompleteState(
      state,
      this.sections,
      this.unallocatedEquipment,
      this.configuration
    )
  }

  // ===== COMMAND PATTERN METHODS =====

  undo(): boolean {
    const lastCommand = this.commandHistory.pop()
    if (lastCommand && lastCommand.undo) {
      return lastCommand.undo()
    }
    return false
  }

  getCommandHistory(): string[] {
    return this.commandHistory.map(cmd => cmd.description)
  }

  clearCommandHistory(): void {
    this.commandHistory = []
  }
}