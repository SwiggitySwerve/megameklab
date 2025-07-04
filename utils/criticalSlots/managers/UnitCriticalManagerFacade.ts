/**
 * Unit Critical Manager Facade
 * Coordinates all managers and provides a unified interface
 * Uses Command pattern for complex operations
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

// Command interface for complex operations
interface UnitCommand {
  execute(): boolean
  undo?(): boolean
  description: string
}

// Configuration update command
class ConfigurationUpdateCommand implements UnitCommand {
  description = 'Update unit configuration'
  
  constructor(
    private facade: UnitCriticalManagerFacade,
    private newConfiguration: UnitConfiguration,
    private oldConfiguration: UnitConfiguration
  ) {}

  execute(): boolean {
    try {
      this.facade.configuration = this.newConfiguration
      this.facade.handleConfigurationChange(this.oldConfiguration, this.newConfiguration)
      this.facade.eventManager.notifyStateChange()
      return true
    } catch (error) {
      console.error('[ConfigurationUpdateCommand] Failed to execute:', error)
      return false
    }
  }

  undo(): boolean {
    try {
      this.facade.configuration = this.oldConfiguration
      this.facade.handleConfigurationChange(this.newConfiguration, this.oldConfiguration)
      this.facade.eventManager.notifyStateChange()
      return true
    } catch (error) {
      console.error('[ConfigurationUpdateCommand] Failed to undo:', error)
      return false
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

export class UnitCriticalManagerFacade {
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
      this as any, // Type compatibility
      this.sections
    )
    
    this.equipmentAllocationManager = new EquipmentAllocationManager(
      this as any, // Type compatibility
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
    this.stateManager = new UnitStateManager(this.sections, this.unallocatedEquipment, this as any)
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
   * Update configuration using Command pattern
   */
  updateConfiguration(newConfiguration: UnitConfiguration): boolean {
    const command = new ConfigurationUpdateCommand(
      this,
      newConfiguration,
      this.configuration
    )
    
    const success = command.execute()
    if (success) {
      this.commandHistory.push(command)
    }
    
    return success
  }

  /**
   * Handle configuration changes
   */
  handleConfigurationChange(oldConfig: UnitConfiguration, newConfig: UnitConfiguration): void {
    // Use ConfigurationManager to handle configuration updates
    const result = this.configurationManager.updateConfiguration(newConfig)
    
    if (result.success) {
      // Handle system component changes
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