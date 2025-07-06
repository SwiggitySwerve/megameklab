/**
 * Unit Critical Manager Facade
 * Coordinates all managers and provides a unified interface
 * Uses Command pattern for complex operations
 * ENHANCED: Added memory-first component resolution and tech progression integration
 */

import { CriticalSection } from '../CriticalSection'
import { EquipmentAllocation } from '../CriticalSlot'
import { UnitConfiguration, CompleteUnitState, UnitValidationResult } from '../UnitCriticalManagerTypes'
import { UnitConfigurationBuilder } from '../UnitConfigurationBuilder'
import { SpecialComponentsManager } from '../SpecialComponentsManager'
import { SystemComponentsManager } from '../SystemComponentsManager'
import { EquipmentAllocationManager } from '../EquipmentAllocationManager'
import { WeightBalanceManager } from '../WeightBalanceManager'
import { HeatManagementManager } from '../HeatManagementManager'
import { ValidationManager } from '../ValidationManager'
import { UnitSerializationManager } from '../UnitSerializationManager'
import { UnitCalculationManager } from '../UnitCalculationManager'
import { UnitStateManager } from '../UnitStateManager'
import { ConfigurationManager } from '../ConfigurationManager'
import { EquipmentQueryManager } from '../EquipmentQueryManager'
import { EventManager } from '../EventManager'

// NEW: Memory-first component resolution types
import { ComponentMemoryState, TechBaseMemory } from '../../types/componentDatabase'
import { TechProgression } from '../../utils/techProgression'
import { validateAndResolveComponentWithMemory, updateMemoryState } from '../../utils/memoryPersistence'
import { resolveComponentForTechBase } from '../../utils/componentResolution'

// Command interface for complex operations
interface UnitCommand {
  execute(): boolean
  undo?(): boolean
  description: string
}

// NEW: Memory-aware configuration update command
class MemoryAwareConfigurationUpdateCommand implements UnitCommand {
  description = 'Update configuration with memory-first component resolution'
  
  constructor(
    private facade: UnitCriticalManagerFacade,
    private newConfiguration: UnitConfiguration,
    private oldConfiguration: UnitConfiguration,
    private memoryState: ComponentMemoryState
  ) {}

  execute(): boolean {
    // NEW: Memory-first component resolution for tech progression changes
    if (this.hasTechProgressionChanges()) {
      const resolvedConfig = this.resolveComponentsWithMemory()
      return this.facade.handleConfigurationChange(this.oldConfiguration, resolvedConfig)
    }
    
    // Standard configuration update
    return this.facade.handleConfigurationChange(this.oldConfiguration, this.newConfiguration)
  }

  private hasTechProgressionChanges(): boolean {
    const oldProg = this.oldConfiguration.techProgression
    const newProg = this.newConfiguration.techProgression
    
    if (!oldProg || !newProg) return false
    
    return Object.keys(oldProg).some(key => 
      oldProg[key as keyof TechProgression] !== newProg[key as keyof TechProgression]
    )
  }

  private resolveComponentsWithMemory(): UnitConfiguration {
    const resolvedConfig = { ...this.newConfiguration }
    const oldProg = this.oldConfiguration.techProgression
    const newProg = this.newConfiguration.techProgression
    
    if (!oldProg || !newProg) return resolvedConfig

    // Resolve each subsystem with memory
    Object.keys(newProg).forEach(subsystem => {
      const oldTechBase = oldProg[subsystem as keyof TechProgression]
      const newTechBase = newProg[subsystem as keyof TechProgression]
      
      if (oldTechBase !== newTechBase) {
        const currentComponent = this.getCurrentComponentForSubsystem(subsystem)
        const resolution = validateAndResolveComponentWithMemory(
          currentComponent,
          subsystem,
          oldTechBase,
          newTechBase,
          this.memoryState
        )
        
        // Update the component in configuration
        this.updateComponentInConfig(resolvedConfig, subsystem, resolution.resolvedComponent)
        
        // Update memory state
        updateMemoryState(this.memoryState, subsystem, newTechBase, resolution.resolvedComponent)
      }
    })
    
    return resolvedConfig
  }

  private getCurrentComponentForSubsystem(subsystem: string): string {
    // Map subsystem to configuration property
    const configMap: Record<string, keyof UnitConfiguration> = {
      engine: 'engineType',
      gyro: 'gyroType',
      structure: 'structureType',
      armor: 'armorType',
      heatsink: 'heatSinkType',
      myomer: 'enhancementType',
      targeting: 'targetingType',
      movement: 'jumpJetType'
    }
    
    const configKey = configMap[subsystem]
    return configKey ? String(this.oldConfiguration[configKey] || 'Standard') : 'Standard'
  }

  private updateComponentInConfig(config: UnitConfiguration, subsystem: string, component: string): void {
    const configMap: Record<string, keyof UnitConfiguration> = {
      engine: 'engineType',
      gyro: 'gyroType',
      structure: 'structureType',
      armor: 'armorType',
      heatsink: 'heatSinkType',
      myomer: 'enhancementType',
      targeting: 'targetingType',
      movement: 'jumpJetType'
    }
    
    const configKey = configMap[subsystem]
    if (configKey) {
      (config as any)[configKey] = component
    }
  }
}

// Equipment allocation command
class EquipmentAllocationCommand implements UnitCommand {
  description = 'Allocate equipment from pool'
  
  constructor(
    private facade: UnitCriticalManagerFacade,
    private equipmentGroupId: string,
    private location: string,
    private startSlot: number
  ) {}

  execute(): boolean {
    return this.facade.equipmentAllocationManager.allocateEquipmentFromPool(
      this.equipmentGroupId,
      this.location,
      this.startSlot
    )
  }
}

// Interface that makes facade compatible with manager expectations
interface IUnitManagerCompatible {
  unallocatedEquipment: EquipmentAllocation[]
  configuration: UnitConfiguration
  getConfiguration(): UnitConfiguration
  addUnallocatedEquipment(equipment: EquipmentAllocation[]): void
  removeUnallocatedEquipment(equipmentGroupId: string): EquipmentAllocation | null
  displaceEquipment(equipmentGroupId: string): boolean
  getSection(location: string): CriticalSection | null
}

export class UnitCriticalManagerFacade implements IUnitManagerCompatible {
  public sections: Map<string, CriticalSection>
  public unallocatedEquipment: EquipmentAllocation[]
  public configuration: UnitConfiguration
  public listeners: (() => void)[] = []

  // Managers
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

  private commandHistory: UnitCommand[] = []
  private specialComponentsInitialized: boolean = false
  
  // NEW: Memory state for component resolution
  private memoryState: ComponentMemoryState | null = null

  constructor(configuration: UnitConfiguration) {
    this.configuration = UnitConfigurationBuilder.buildConfiguration(configuration)
    this.sections = new Map()
    this.unallocatedEquipment = []
    
    this.initializeManagers()
    this.initializeSections()
    this.initializeSpecialComponents()
  }

  /**
   * Initialize all managers
   */
  private initializeManagers(): void {
    this.eventManager = new EventManager()
    
    this.specialComponentsManager = new SpecialComponentsManager(
      this.sections,
      this.unallocatedEquipment,
      this.configuration
    )
    
    this.systemComponentsManager = new SystemComponentsManager(
      this, // Type-safe: facade now implements IUnitManagerCompatible
      this.sections
    )
    
    this.equipmentAllocationManager = new EquipmentAllocationManager(
      this, // Type-safe: facade now implements IUnitManagerCompatible
      this.sections,
      this.configuration
    )
    
    this.weightBalanceManager = new WeightBalanceManager(
      this.configuration,
      this.unallocatedEquipment
    )
    
    this.heatManagementManager = new HeatManagementManager(
      this.configuration,
      this.unallocatedEquipment
    )
    
    this.validationManager = new ValidationManager(
      this.sections,
      this.unallocatedEquipment,
      this.configuration
    )
    
    this.serializationManager = new UnitSerializationManager()
    this.calculationManager = new UnitCalculationManager()
    this.stateManager = new UnitStateManager(this.sections, this.unallocatedEquipment, this)
    this.configurationManager = new ConfigurationManager(this.configuration)
    this.equipmentQueryManager = new EquipmentQueryManager(this.sections, this.unallocatedEquipment, this.configuration)
  }

  /**
   * Initialize critical sections
   */
  private initializeSections(): void {
    // Standard mech location configurations would be initialized here
    // Implementation details omitted for brevity
  }

  /**
   * Initialize special components
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
   * NEW: Set memory state for component resolution
   */
  setMemoryState(memoryState: ComponentMemoryState): void {
    this.memoryState = memoryState
  }

  /**
   * NEW: Get memory state
   */
  getMemoryState(): ComponentMemoryState | null {
    return this.memoryState
  }

  /**
   * Update configuration using Command pattern with memory-first resolution
   */
  updateConfiguration(newConfiguration: UnitConfiguration): boolean {
    const command = new MemoryAwareConfigurationUpdateCommand(
      this,
      newConfiguration,
      this.configuration,
      this.memoryState || this.createDefaultMemoryState()
    )
    
    const success = command.execute()
    if (success) {
      this.commandHistory.push(command)
    }
    
    return success
  }

  /**
   * NEW: Create default memory state if none exists
   */
  private createDefaultMemoryState(): ComponentMemoryState {
    return {
      techBaseMemory: {
        chassis: { 'Inner Sphere': 'Standard', 'Clan': 'Standard' },
        engine: { 'Inner Sphere': 'Standard', 'Clan': 'Standard' },
        gyro: { 'Inner Sphere': 'Standard', 'Clan': 'Standard' },
        heatsink: { 'Inner Sphere': 'Single', 'Clan': 'Double (Clan)' },
        armor: { 'Inner Sphere': 'Standard', 'Clan': 'Standard' },
        myomer: { 'Inner Sphere': 'None', 'Clan': 'None' },
        targeting: { 'Inner Sphere': 'None', 'Clan': 'None' },
        movement: { 'Inner Sphere': 'None', 'Clan': 'None' }
      },
      lastUpdated: Date.now(),
      version: '1.0.0'
    }
  }

  /**
   * Handle configuration changes with enhanced component synchronization
   */
  handleConfigurationChange(oldConfig: UnitConfiguration, newConfig: UnitConfiguration): void {
    // Use ConfigurationManager to handle configuration updates
    const result = this.configurationManager.updateConfiguration(newConfig)
    
    if (result.success) {
      // Handle system component changes with smart slot updates
      if (result.changes.engineChanged || result.changes.gyroChanged) {
        const allDisplacedEquipment = this.systemComponentsManager.handleSystemComponentChange(oldConfig, newConfig)
        if (allDisplacedEquipment.length > 0) {
          this.addUnallocatedEquipment(allDisplacedEquipment)
        }
      }
      
      // Handle special component changes
      if (result.changes.structureChanged || result.changes.armorChanged) {
        // Handle special component configuration change
        this.specialComponentsManager.configuration = newConfig
      }
      
      // Update all manager configurations
      this.updateManagerConfigurations(newConfig)
      
      // NEW: Notify state change for UI updates
      this.eventManager.notifyStateChange()
    }
  }

  /**
   * Update all manager configurations
   */
  private updateManagerConfigurations(newConfig: UnitConfiguration): void {
    this.weightBalanceManager.configuration = newConfig
    this.heatManagementManager.configuration = newConfig
    this.validationManager.configuration = newConfig
    this.equipmentQueryManager.updateConfiguration(newConfig)
    this.configurationManager.updateConfiguration(newConfig)
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

  /**
   * Add unallocated equipment
   */
  addUnallocatedEquipment(equipment: EquipmentAllocation[]): void {
    this.unallocatedEquipment.push(...equipment)
    this.eventManager.notifyStateChange()
  }

  /**
   * Remove unallocated equipment - required by IUnitManagerCompatible
   */
  removeUnallocatedEquipment(equipmentGroupId: string): EquipmentAllocation | null {
    const index = this.unallocatedEquipment.findIndex(eq => eq.equipmentGroupId === equipmentGroupId)
    if (index >= 0) {
      const removed = this.unallocatedEquipment[index]
      this.unallocatedEquipment.splice(index, 1)
      this.eventManager.notifyStateChange()
      return removed
    }
    return null
  }

  /**
   * Displace equipment - required by IUnitManagerCompatible
   */
  displaceEquipment(equipmentGroupId: string): boolean {
    for (const section of this.sections.values()) {
      const allocation = section.getAllEquipment().find(eq => eq.equipmentGroupId === equipmentGroupId)
      if (allocation) {
        const removed = section.removeEquipmentGroup(equipmentGroupId)
        if (removed) {
          this.addUnallocatedEquipment([removed])
          return true
        }
      }
    }
    return false
  }

  /**
   * Get section by location
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
   * Get configuration
   */
  getConfiguration(): UnitConfiguration {
    return this.configuration
  }

  /**
   * Get unallocated equipment
   */
  getUnallocatedEquipment(): EquipmentAllocation[] {
    return this.unallocatedEquipment
  }

  /**
   * Validate unit
   */
  validate(): UnitValidationResult {
    return this.validationManager.validate()
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Serialize complete state
   */
  serializeCompleteState(): CompleteUnitState {
    return this.serializationManager.serializeCompleteState(
      this.configuration,
      this.sections,
      this.unallocatedEquipment
    )
  }

  /**
   * Deserialize complete state
   */
  deserializeCompleteState(state: CompleteUnitState): boolean {
    return this.serializationManager.deserializeCompleteState(
      state,
      this.sections,
      this.unallocatedEquipment,
      this.configuration
    )
  }

  /**
   * Undo last command
   */
  undo(): boolean {
    const lastCommand = this.commandHistory.pop()
    if (lastCommand && lastCommand.undo) {
      return lastCommand.undo()
    }
    return false
  }

  /**
   * Get command history
   */
  getCommandHistory(): string[] {
    return this.commandHistory.map(cmd => cmd.description)
  }
}