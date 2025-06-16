/**
 * Unit State Manager - Central state management without React dependencies
 * Manages unit state and orchestrates system component changes
 */

import { UnitCriticalManager, UnitConfiguration } from './UnitCriticalManager'
import { MechConstructor, ConstructionResult, ConstructionOptions } from './MechConstructor'
import { EngineType, GyroType } from './SystemComponentRules'
import { EquipmentObject } from './CriticalSlot'

export interface StateChangeEvent {
  type: 'unit_updated' | 'system_change' | 'equipment_change' | 'validation_change'
  timestamp: Date
  data?: any
}

export class UnitStateManager {
  private currentUnit: UnitCriticalManager
  private subscribers: Set<() => void> = new Set()
  private changeHistory: StateChangeEvent[] = []

  constructor(initialConfiguration?: UnitConfiguration) {
    // Create default unit if no configuration provided
    const defaultConfig: UnitConfiguration = initialConfiguration || {
      engineType: 'Standard',
      gyroType: 'Standard',
      mass: 50,
      unitType: 'BattleMech'
    }

    this.currentUnit = new UnitCriticalManager(defaultConfig)
    this.logChange({
      type: 'unit_updated',
      timestamp: new Date(),
      data: { action: 'initialized', config: defaultConfig }
    })
  }

  /**
   * Get current unit
   */
  getCurrentUnit(): UnitCriticalManager {
    return this.currentUnit
  }

  /**
   * Add equipment as unallocated to the unit's pool
   */
  addUnallocatedEquipment(equipment: EquipmentObject): void {
    // Import the v4 function for UUID generation
    const { v4: uuidv4 } = require('uuid')
    
    // Create an EquipmentAllocation for unallocated equipment
    const allocation: any = {
      equipmentGroupId: uuidv4(),
      equipmentData: equipment,
      location: '',
      occupiedSlots: [],
      startSlotIndex: -1,
      endSlotIndex: -1
    }
    
    this.currentUnit.addUnallocatedEquipment([allocation])
    this.notifySubscribers()
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in state subscriber callback:', error)
      }
    })
  }

  /**
   * Log state change event
   */
  private logChange(event: StateChangeEvent): void {
    this.changeHistory.push(event)
    
    // Keep only last 100 changes
    if (this.changeHistory.length > 100) {
      this.changeHistory.shift()
    }
  }

  /**
   * Update unit and notify subscribers
   */
  private updateUnit(newUnit: UnitCriticalManager, changeData?: any): void {
    this.currentUnit = newUnit
    this.logChange({
      type: 'unit_updated',
      timestamp: new Date(),
      data: changeData
    })
    this.notifySubscribers()
  }

  /**
   * Handle engine type change
   */
  handleEngineChange(newEngineType: EngineType, options?: ConstructionOptions): ConstructionResult {
    const oldEngineType = this.currentUnit.getEngineType()
    
    if (oldEngineType === newEngineType) {
      // No change needed
      return {
        newUnit: this.currentUnit,
        displacedEquipment: [],
        migratedEquipment: [],
        unallocatedEquipment: [],
        summary: { totalDisplaced: 0, totalMigrated: 0, totalUnallocated: 0 }
      }
    }

    console.log(`Engine change: ${oldEngineType} → ${newEngineType}`)

    // Use displacement-only options unless explicitly overridden
    const defaultOptions: ConstructionOptions = { attemptMigration: false, preserveLocationPreference: false }
    const result = MechConstructor.changeEngine(this.currentUnit, newEngineType, options || defaultOptions)
    
    this.updateUnit(result.newUnit, {
      action: 'engine_change',
      oldType: oldEngineType,
      newType: newEngineType,
      summary: result.summary
    })

    this.logChange({
      type: 'system_change',
      timestamp: new Date(),
      data: {
        component: 'engine',
        oldType: oldEngineType,
        newType: newEngineType,
        displacedCount: result.summary.totalDisplaced,
        migratedCount: result.summary.totalMigrated
      }
    })

    return result
  }

  /**
   * Handle gyro type change
   */
  handleGyroChange(newGyroType: GyroType, options?: ConstructionOptions): ConstructionResult {
    const oldGyroType = this.currentUnit.getGyroType()
    
    if (oldGyroType === newGyroType) {
      // No change needed
      return {
        newUnit: this.currentUnit,
        displacedEquipment: [],
        migratedEquipment: [],
        unallocatedEquipment: [],
        summary: { totalDisplaced: 0, totalMigrated: 0, totalUnallocated: 0 }
      }
    }

    console.log(`Gyro change: ${oldGyroType} → ${newGyroType}`)

    // Use displacement-only options unless explicitly overridden
    const defaultOptions: ConstructionOptions = { attemptMigration: false, preserveLocationPreference: false }
    const result = MechConstructor.changeGyro(this.currentUnit, newGyroType, options || defaultOptions)
    
    this.updateUnit(result.newUnit, {
      action: 'gyro_change',
      oldType: oldGyroType,
      newType: newGyroType,
      summary: result.summary
    })

    this.logChange({
      type: 'system_change',
      timestamp: new Date(),
      data: {
        component: 'gyro',
        oldType: oldGyroType,
        newType: newGyroType,
        displacedCount: result.summary.totalDisplaced,
        migratedCount: result.summary.totalMigrated
      }
    })

    return result
  }

  /**
   * Handle combined engine and gyro change
   */
  handleEngineAndGyroChange(
    newEngineType: EngineType,
    newGyroType: GyroType,
    options?: ConstructionOptions
  ): ConstructionResult {
    const oldEngineType = this.currentUnit.getEngineType()
    const oldGyroType = this.currentUnit.getGyroType()
    
    if (oldEngineType === newEngineType && oldGyroType === newGyroType) {
      // No change needed
      return {
        newUnit: this.currentUnit,
        displacedEquipment: [],
        migratedEquipment: [],
        unallocatedEquipment: [],
        summary: { totalDisplaced: 0, totalMigrated: 0, totalUnallocated: 0 }
      }
    }

    console.log(`Combined change: Engine ${oldEngineType} → ${newEngineType}, Gyro ${oldGyroType} → ${newGyroType}`)

    // Use displacement-only options unless explicitly overridden
    const defaultOptions: ConstructionOptions = { attemptMigration: false, preserveLocationPreference: false }
    const result = MechConstructor.changeEngineAndGyro(this.currentUnit, newEngineType, newGyroType, options || defaultOptions)
    
    this.updateUnit(result.newUnit, {
      action: 'combined_change',
      oldEngineType,
      newEngineType,
      oldGyroType,
      newGyroType,
      summary: result.summary
    })

    this.logChange({
      type: 'system_change',
      timestamp: new Date(),
      data: {
        component: 'engine_and_gyro',
        oldEngineType,
        newEngineType,
        oldGyroType,
        newGyroType,
        displacedCount: result.summary.totalDisplaced,
        migratedCount: result.summary.totalMigrated
      }
    })

    return result
  }

  /**
   * Add equipment to unit (testing/demo purposes)
   */
  addTestEquipment(equipment: EquipmentObject, location: string, startSlot?: number): boolean {
    const section = this.currentUnit.getSection(location)
    if (!section) {
      console.error(`Invalid location: ${location}`)
      return false
    }

    // Find available slot if not specified
    const targetSlot = startSlot !== undefined ? startSlot : 
      section.findContiguousAvailableSlots(equipment.requiredSlots)?.[0]

    if (targetSlot === undefined) {
      console.error(`No available slots for ${equipment.name} in ${location}`)
      return false
    }

    const success = section.allocateEquipment(equipment, targetSlot)
    
    if (success) {
      this.logChange({
        type: 'equipment_change',
        timestamp: new Date(),
        data: {
          action: 'added',
          equipment: equipment.name,
          location,
          slot: targetSlot
        }
      })
      this.notifySubscribers()
    }

    return success
  }

  /**
   * Remove equipment from unit
   */
  removeEquipment(equipmentGroupId: string): boolean {
    const success = this.currentUnit.displaceEquipment(equipmentGroupId)
    
    if (success) {
      this.logChange({
        type: 'equipment_change',
        timestamp: new Date(),
        data: {
          action: 'removed',
          equipmentGroupId
        }
      })
      this.notifySubscribers()
    }

    return success
  }

  /**
   * Get unit summary
   */
  getUnitSummary() {
    const config = this.currentUnit.getConfiguration()
    const summary = this.currentUnit.getSummary()
    const validation = this.currentUnit.validate()

    return {
      configuration: config,
      summary,
      validation,
      unallocatedEquipment: this.currentUnit.getUnallocatedEquipment(),
      equipmentByLocation: this.currentUnit.getEquipmentByLocation()
    }
  }

  /**
   * Get change history
   */
  getChangeHistory(): StateChangeEvent[] {
    return [...this.changeHistory]
  }

  /**
   * Get recent changes (last N)
   */
  getRecentChanges(count: number = 10): StateChangeEvent[] {
    return this.changeHistory.slice(-count)
  }

  /**
   * Reset unit to clean state
   */
  resetUnit(newConfiguration?: UnitConfiguration): void {
    const config = newConfiguration || {
      engineType: 'Standard' as EngineType,
      gyroType: 'Standard' as GyroType,
      mass: 50,
      unitType: 'BattleMech' as const
    }

    this.currentUnit = new UnitCriticalManager(config)
    
    this.logChange({
      type: 'unit_updated',
      timestamp: new Date(),
      data: { action: 'reset', config }
    })

    this.notifySubscribers()
  }

  /**
   * Get current engine type
   */
  getEngineType(): EngineType {
    return this.currentUnit.getEngineType()
  }

  /**
   * Get current gyro type
   */
  getGyroType(): GyroType {
    return this.currentUnit.getGyroType()
  }

  /**
   * Get current unit configuration
   */
  getConfiguration(): UnitConfiguration {
    return this.currentUnit.getConfiguration()
  }

  /**
   * Get validation status
   */
  getValidation() {
    return this.currentUnit.validate()
  }

  /**
   * Get debugging information
   */
  getDebugInfo() {
    return {
      subscriberCount: this.subscribers.size,
      changeHistoryLength: this.changeHistory.length,
      recentChanges: this.getRecentChanges(5),
      unitSummary: this.getUnitSummary(),
      configuration: this.getConfiguration()
    }
  }
}
