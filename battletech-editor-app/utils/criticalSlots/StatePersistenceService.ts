/**
 * State Persistence Service
 * Handles automatic save triggers and enhanced state management
 * Adapted from old architecture to work with new typed system
 */

import { 
  UnitConfiguration, 
  CompleteUnitState,
  SerializedSlotAllocations,
  SerializedEquipment,
  StateValidationResult
} from './UnitCriticalManagerTypes';
import { UnitCriticalManager } from './UnitCriticalManager';
import { ComponentMemoryState } from '../../types/componentDatabase';
import { MultiTabDebouncedSaveManager } from '../DebouncedSaveManager';

export interface EnhancedTabData {
  completeState: CompleteUnitState;
  modified: string; // ISO date string
  version: string;
}

export interface SaveTriggerOptions {
  immediate?: boolean;
  force?: boolean;
  includeMemory?: boolean;
}

export interface StatePersistenceResult {
  success: boolean;
  timestamp: number;
  errors: string[];
  warnings: string[];
}

/**
 * Enhanced state persistence service with automatic triggers
 */
export class StatePersistenceService {
  private saveManager: MultiTabDebouncedSaveManager;
  private readonly saveDelay: number;
  private readonly completeStatePrefix: string;
  private readonly memoryStatePrefix: string;

  constructor(saveDelay: number = 1000) {
    this.saveManager = new MultiTabDebouncedSaveManager(saveDelay);
    this.saveDelay = saveDelay;
    this.completeStatePrefix = 'complete_state_';
    this.memoryStatePrefix = 'memory_state_';
  }

  /**
   * Schedule automatic save for a unit
   */
  scheduleSave(
    tabId: string, 
    unitManager: UnitCriticalManager,
    options: SaveTriggerOptions = {}
  ): void {
    const saveHandler = (completeState: CompleteUnitState) => {
      this.saveCompleteState(tabId, completeState, options);
    };

    const getStateCallback = () => {
      return unitManager.serializeCompleteState();
    };

    if (options.immediate) {
      this.saveManager.saveTabImmediately(tabId, saveHandler, getStateCallback);
    } else {
      this.saveManager.scheduleSaveForTab(tabId, saveHandler, getStateCallback);
    }
  }

  /**
   * Save complete unit state with enhanced metadata
   */
  private saveCompleteState(
    tabId: string, 
    completeState: CompleteUnitState,
    options: SaveTriggerOptions
  ): void {
    try {
      const enhancedData: EnhancedTabData = {
        completeState,
        modified: new Date().toISOString(),
        version: '2.0'
      };

      const storageKey = `${this.completeStatePrefix}${tabId}`;
      localStorage.setItem(storageKey, JSON.stringify(enhancedData));

      console.log(`[StatePersistence] Saved complete state for tab: ${tabId}`);

      // Note: Memory state saving would need to be handled separately
      // since we don't have access to the unitManager here
      // This could be done by passing the memory state as a parameter
      // or by calling a separate method

    } catch (error) {
      console.error(`[StatePersistence] Failed to save complete state for tab ${tabId}:`, error);
    }
  }

  /**
   * Save memory state separately
   */
  private saveMemoryState(tabId: string, memoryState: ComponentMemoryState): void {
    try {
      const storageKey = `${this.memoryStatePrefix}${tabId}`;
      localStorage.setItem(storageKey, JSON.stringify(memoryState));
      console.log(`[StatePersistence] Saved memory state for tab: ${tabId}`);
    } catch (error) {
      console.error(`[StatePersistence] Failed to save memory state for tab ${tabId}:`, error);
    }
  }

  /**
   * Load complete unit state with validation
   */
  loadCompleteState(tabId: string): CompleteUnitState | null {
    try {
      const storageKey = `${this.completeStatePrefix}${tabId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }

      const enhancedData: EnhancedTabData = JSON.parse(stored);
      
      // Validate state structure
      const validation = this.validateCompleteState(enhancedData.completeState);
      if (!validation.isValid) {
        console.warn(`[StatePersistence] Invalid state for tab ${tabId}:`, validation.errors);
        return null;
      }

      console.log(`[StatePersistence] Loaded complete state for tab: ${tabId}`);
      return enhancedData.completeState;

    } catch (error) {
      console.error(`[StatePersistence] Failed to load complete state for tab ${tabId}:`, error);
      return null;
    }
  }

  /**
   * Load memory state separately
   */
  loadMemoryState(tabId: string): ComponentMemoryState | null {
    try {
      const storageKey = `${this.memoryStatePrefix}${tabId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }

      const memoryState: ComponentMemoryState = JSON.parse(stored);
      console.log(`[StatePersistence] Loaded memory state for tab: ${tabId}`);
      return memoryState;

    } catch (error) {
      console.error(`[StatePersistence] Failed to load memory state for tab ${tabId}:`, error);
      return null;
    }
  }

  /**
   * Validate complete unit state structure
   */
  private validateCompleteState(state: CompleteUnitState): StateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!state.version) {
      errors.push('Missing version field');
    }

    if (!state.configuration) {
      errors.push('Missing configuration field');
    }

    if (!state.criticalSlotAllocations) {
      errors.push('Missing critical slot allocations');
    }

    if (!state.unallocatedEquipment) {
      errors.push('Missing unallocated equipment');
    }

    if (!state.timestamp) {
      errors.push('Missing timestamp');
    }

    // Validate configuration structure
    if (state.configuration) {
      if (!state.configuration.chassis) {
        errors.push('Configuration missing chassis');
      }
      if (!state.configuration.model) {
        errors.push('Configuration missing model');
      }
      if (!state.configuration.tonnage) {
        errors.push('Configuration missing tonnage');
      }
    }

    // Check for potential recovery scenarios
    const canRecover = errors.length === 0 || 
                      (errors.length <= 2 && warnings.length === 0);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canRecover
    };
  }

  /**
   * Force save all pending states
   */
  forceSaveAll(): void {
    console.log('[StatePersistence] Force saving all pending states');
    this.saveManager.flushAllAndDestroy();
  }

  /**
   * Remove save manager for a tab
   */
  removeTabSaveManager(tabId: string, flush: boolean = true): void {
    this.saveManager.removeTabSaveManager(tabId, flush);
  }

  /**
   * Get pending save status for all tabs
   */
  getPendingSaveStatus(): Record<string, boolean> {
    return this.saveManager.getPendingSaveStatus();
  }

  /**
   * Clear all saved states for a tab
   */
  clearTabStates(tabId: string): void {
    try {
      const completeStateKey = `${this.completeStatePrefix}${tabId}`;
      const memoryStateKey = `${this.memoryStatePrefix}${tabId}`;
      
      localStorage.removeItem(completeStateKey);
      localStorage.removeItem(memoryStateKey);
      
      console.log(`[StatePersistence] Cleared all states for tab: ${tabId}`);
    } catch (error) {
      console.error(`[StatePersistence] Failed to clear states for tab ${tabId}:`, error);
    }
  }

  /**
   * Get storage size for monitoring
   */
  getStorageSize(tabId: string): { completeState: number; memoryState: number } {
    try {
      const completeStateKey = `${this.completeStatePrefix}${tabId}`;
      const memoryStateKey = `${this.memoryStatePrefix}${tabId}`;
      
      const completeStateSize = localStorage.getItem(completeStateKey)?.length || 0;
      const memoryStateSize = localStorage.getItem(memoryStateKey)?.length || 0;
      
      return {
        completeState: completeStateSize,
        memoryState: memoryStateSize
      };
    } catch (error) {
      console.error(`[StatePersistence] Failed to get storage size for tab ${tabId}:`, error);
      return { completeState: 0, memoryState: 0 };
    }
  }

  /**
   * Migrate old state format to new format
   */
  migrateOldState(tabId: string): boolean {
    try {
      // Check for old format state
      const oldStateKey = `unit_state_${tabId}`;
      const oldState = localStorage.getItem(oldStateKey);
      
      if (!oldState) {
        return false; // No old state to migrate
      }

      console.log(`[StatePersistence] Migrating old state format for tab: ${tabId}`);
      
      // Parse old state and convert to new format
      const oldStateData = JSON.parse(oldState);
      
      // Create new format state
      const newCompleteState: CompleteUnitState = {
        version: '2.0',
        configuration: this.migrateConfiguration(oldStateData.configuration),
        criticalSlotAllocations: this.migrateSlotAllocations(oldStateData.criticalAllocations),
        unallocatedEquipment: this.migrateEquipment(oldStateData.unallocatedEquipment),
        timestamp: Date.now()
      };

      // Save in new format
      const enhancedData: EnhancedTabData = {
        completeState: newCompleteState,
        modified: new Date().toISOString(),
        version: '2.0'
      };

      const newStateKey = `${this.completeStatePrefix}${tabId}`;
      localStorage.setItem(newStateKey, JSON.stringify(enhancedData));
      
      // Remove old state
      localStorage.removeItem(oldStateKey);
      
      console.log(`[StatePersistence] Successfully migrated state for tab: ${tabId}`);
      return true;

    } catch (error) {
      console.error(`[StatePersistence] Failed to migrate old state for tab ${tabId}:`, error);
      return false;
    }
  }

  /**
   * Migrate old configuration format
   */
  private migrateConfiguration(oldConfig: any): UnitConfiguration {
    // This would implement the actual migration logic
    // For now, return a basic configuration
    return {
      chassis: oldConfig.chassis || 'Unknown',
      model: oldConfig.model || 'Unknown',
      tonnage: oldConfig.tonnage || oldConfig.mass || 50,
      unitType: oldConfig.unitType || 'BattleMech',
      techBase: oldConfig.techBase || 'Inner Sphere',
      walkMP: oldConfig.walkMP || 4,
      engineRating: oldConfig.engineRating || 200,
      runMP: oldConfig.runMP || 6,
      engineType: oldConfig.engineType || 'Standard',
      jumpMP: oldConfig.jumpMP || 0,
      jumpJetType: { type: 'Standard Jump Jet', techBase: 'Inner Sphere' },
      jumpJetCounts: {},
      hasPartialWing: false,
      gyroType: { type: 'Standard', techBase: 'Inner Sphere' },
      structureType: { type: 'Standard', techBase: 'Inner Sphere' },
      armorType: { type: 'Standard', techBase: 'Inner Sphere' },
      armorAllocation: {
        HD: { front: 0, rear: 0 },
        CT: { front: 0, rear: 0 },
        LT: { front: 0, rear: 0 },
        RT: { front: 0, rear: 0 },
        LA: { front: 0, rear: 0 },
        RA: { front: 0, rear: 0 },
        LL: { front: 0, rear: 0 },
        RL: { front: 0, rear: 0 }
      },
      armorTonnage: 0,
      heatSinkType: { type: 'Single', techBase: 'Inner Sphere' },
      totalHeatSinks: 10,
      internalHeatSinks: 10,
      externalHeatSinks: 0,
      enhancementType: null,
      mass: oldConfig.mass || 50
    };
  }

  /**
   * Migrate old slot allocations format
   */
  private migrateSlotAllocations(oldAllocations: any): SerializedSlotAllocations {
    // This would implement the actual migration logic
    // For now, return empty allocations
    return {};
  }

  /**
   * Migrate old equipment format
   */
  private migrateEquipment(oldEquipment: any[]): SerializedEquipment[] {
    // This would implement the actual migration logic
    // For now, return empty equipment array
    return [];
  }
} 