/**
 * Unit State Persistence Service - Handles complete unit state serialization and deserialization
 * Manages save/load operations with validation, error recovery, and version compatibility
 * Following SOLID principles - Single Responsibility for state persistence operations
 */

import { EquipmentAllocation } from '../criticalSlots/CriticalSlot';
import { CriticalSection } from '../criticalSlots/CriticalSection';
import { UnitConfiguration } from '../criticalSlots/UnitCriticalManager';

// State persistence interfaces
export interface CompleteUnitState {
  version: string;
  configuration: UnitConfiguration;
  criticalSlotAllocations: SerializedSlotAllocations;
  unallocatedEquipment: SerializedEquipment[];
  timestamp: number;
}

export interface SerializedEquipment {
  equipmentData: any;
  equipmentGroupId: string;
  location: string;
  startSlotIndex: number;
  endSlotIndex: number;
  occupiedSlots: number[];
}

export interface SerializedSlotAllocations {
  [location: string]: {
    [slotIndex: number]: SerializedEquipment;
  };
}

export interface StateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canRecover: boolean;
}

export interface StateSnapshot {
  state: CompleteUnitState;
  label: string;
  timestamp: number;
}

export interface StatePersistenceOptions {
  validateBeforeSave: boolean;
  createBackup: boolean;
  compressionLevel: 'none' | 'minimal' | 'aggressive';
  includeMetadata: boolean;
}

/**
 * Unit State Persistence Service
 * Handles all state serialization, deserialization, validation, and recovery operations
 */
export class UnitStatePersistenceService {
  
  private snapshots: StateSnapshot[] = [];
  private maxSnapshots: number = 10;
  private readonly CURRENT_VERSION = '1.2.0';
  
  constructor(options?: { maxSnapshots?: number }) {
    this.maxSnapshots = options?.maxSnapshots || 10;
    console.log('[UnitStatePersistenceService] Initialized with max snapshots:', this.maxSnapshots);
  }
  
  /**
   * Serialize complete unit state for persistence
   */
  serializeUnitState(
    configuration: UnitConfiguration,
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[],
    options?: StatePersistenceOptions
  ): CompleteUnitState {
    console.log('[UnitStatePersistenceService] Serializing complete unit state');
    
    const defaultOptions: StatePersistenceOptions = {
      validateBeforeSave: true,
      createBackup: false,
      compressionLevel: 'minimal',
      includeMetadata: true
    };
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      // Serialize critical slot allocations
      const criticalSlotAllocations = this.serializeCriticalSlots(sections);
      
      // Serialize unallocated equipment
      const serializedUnallocated = this.serializeUnallocatedEquipment(unallocatedEquipment);
      
      // Create complete state
      const state: CompleteUnitState = {
        version: this.CURRENT_VERSION,
        configuration: this.cloneConfiguration(configuration),
        criticalSlotAllocations,
        unallocatedEquipment: serializedUnallocated,
        timestamp: Date.now()
      };
      
      // Validate before saving if requested
      if (finalOptions.validateBeforeSave) {
        const validation = this.validateState(state, sections);
        if (!validation.isValid && !validation.canRecover) {
          throw new Error(`State validation failed: ${validation.errors.join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          console.warn('[UnitStatePersistenceService] State warnings:', validation.warnings);
        }
      }
      
      console.log('[UnitStatePersistenceService] State serialization complete:', {
        version: state.version,
        allocatedSections: Object.keys(criticalSlotAllocations).length,
        unallocatedCount: serializedUnallocated.length,
        configurationValid: !!state.configuration
      });
      
      return state;
      
    } catch (error) {
      console.error('[UnitStatePersistenceService] Serialization error:', error);
      throw new Error(`Failed to serialize unit state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Deserialize and validate unit state
   */
  deserializeUnitState(
    state: CompleteUnitState,
    sections: Map<string, CriticalSection>
  ): {
    success: boolean;
    restoredEquipment: number;
    failedEquipment: number;
    warnings: string[];
    errors: string[];
  } {
    console.log('[UnitStatePersistenceService] Deserializing unit state');
    
    const result = {
      success: false,
      restoredEquipment: 0,
      failedEquipment: 0,
      warnings: [] as string[],
      errors: [] as string[]
    };
    
    try {
      // Validate state structure
      const validation = this.validateState(state, sections);
      if (!validation.isValid && !validation.canRecover) {
        result.errors.push(...validation.errors);
        return result;
      }
      
      result.warnings.push(...validation.warnings);
      
      // Perform version migration if needed
      const migratedState = this.migrateState(state);
      
      // Restore allocated equipment
      const allocatedResult = this.restoreAllocatedEquipment(migratedState.criticalSlotAllocations, sections);
      result.restoredEquipment += allocatedResult.restored;
      result.failedEquipment += allocatedResult.failed;
      result.warnings.push(...allocatedResult.warnings);
      
      // Note: Unallocated equipment restoration is handled by the caller
      // since it requires access to the unallocated equipment array
      
      result.success = true;
      console.log('[UnitStatePersistenceService] Deserialization complete:', result);
      
      return result;
      
    } catch (error) {
      console.error('[UnitStatePersistenceService] Deserialization error:', error);
      result.errors.push(`Deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
  
  /**
   * Validate state structure and content
   */
  validateState(state: CompleteUnitState, sections: Map<string, CriticalSection>): StateValidationResult {
    const result: StateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      canRecover: true
    };
    
    // Check version compatibility
    if (!state.version) {
      result.warnings.push('Missing state version, assuming current version');
    } else if (!this.isVersionCompatible(state.version)) {
      result.warnings.push(`State version ${state.version} may require migration`);
    }
    
    // Validate configuration
    if (!state.configuration) {
      result.errors.push('Missing unit configuration');
      result.isValid = false;
      result.canRecover = false;
      return result;
    }
    
    // Validate required configuration fields
    const requiredFields = ['tonnage', 'engineType', 'gyroType', 'structureType', 'armorType'];
    for (const field of requiredFields) {
      if (!(field in state.configuration)) {
        result.errors.push(`Missing required configuration field: ${field}`);
        result.isValid = false;
      }
    }
    
    // Validate unallocated equipment
    if (state.unallocatedEquipment) {
      state.unallocatedEquipment.forEach((equipment, index) => {
        if (!equipment.equipmentData || !equipment.equipmentGroupId) {
          result.errors.push(`Invalid unallocated equipment at index ${index}`);
          result.isValid = false;
        }
        
        // Check for duplicate group IDs
        const duplicates = state.unallocatedEquipment.filter(eq => eq.equipmentGroupId === equipment.equipmentGroupId);
        if (duplicates.length > 1) {
          result.warnings.push(`Duplicate equipment group ID: ${equipment.equipmentGroupId}`);
        }
      });
    }
    
    // Validate critical slot allocations
    if (state.criticalSlotAllocations) {
      Object.entries(state.criticalSlotAllocations).forEach(([location, slots]) => {
        if (!sections.has(location)) {
          result.warnings.push(`Unknown location in saved state: ${location}`);
          return;
        }
        
        const section = sections.get(location)!;
        Object.entries(slots).forEach(([slotStr, equipment]) => {
          const slotIndex = parseInt(slotStr);
          
          // Validate slot index
          if (slotIndex >= section.getTotalSlots()) {
            result.warnings.push(`Invalid slot index ${slotIndex} in ${location}`);
          }
          
          // Validate equipment data
          if (!equipment.equipmentData || !equipment.equipmentGroupId) {
            result.errors.push(`Invalid equipment in ${location} slot ${slotIndex}`);
            result.isValid = false;
          }
          
          // Check for equipment placement conflicts
          if (equipment.occupiedSlots && equipment.occupiedSlots.length > 0) {
            const hasInvalidSlots = equipment.occupiedSlots.some(slot => slot >= section.getTotalSlots());
            if (hasInvalidSlots) {
              result.warnings.push(`Equipment ${equipment.equipmentData?.name || 'unknown'} has invalid slot references`);
            }
          }
        });
      });
    }
    
    // Check for orphaned equipment (referenced but missing data)
    this.validateEquipmentReferences(state, result);
    
    return result;
  }
  
  /**
   * Create a state snapshot for undo/redo functionality
   */
  createSnapshot(
    configuration: UnitConfiguration,
    sections: Map<string, CriticalSection>,
    unallocatedEquipment: EquipmentAllocation[],
    label: string = 'Auto Snapshot'
  ): boolean {
    try {
      const state = this.serializeUnitState(configuration, sections, unallocatedEquipment, {
        validateBeforeSave: true,
        createBackup: false,
        compressionLevel: 'minimal',
        includeMetadata: false
      });
      
      const snapshot: StateSnapshot = {
        state,
        label,
        timestamp: Date.now()
      };
      
      // Add to snapshots and maintain max limit
      this.snapshots.push(snapshot);
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots.shift(); // Remove oldest snapshot
      }
      
      console.log(`[UnitStatePersistenceService] Created snapshot: ${label} (${this.snapshots.length}/${this.maxSnapshots})`);
      return true;
      
    } catch (error) {
      console.error('[UnitStatePersistenceService] Failed to create snapshot:', error);
      return false;
    }
  }
  
  /**
   * Get available snapshots
   */
  getSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }
  
  /**
   * Restore from snapshot
   */
  restoreFromSnapshot(index: number): CompleteUnitState | null {
    if (index < 0 || index >= this.snapshots.length) {
      console.error('[UnitStatePersistenceService] Invalid snapshot index:', index);
      return null;
    }
    
    const snapshot = this.snapshots[index];
    console.log(`[UnitStatePersistenceService] Restoring from snapshot: ${snapshot.label}`);
    
    return this.cloneState(snapshot.state);
  }
  
  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots = [];
    console.log('[UnitStatePersistenceService] All snapshots cleared');
  }
  
  /**
   * Export state to JSON string
   */
  exportToJson(state: CompleteUnitState, pretty: boolean = false): string {
    try {
      return JSON.stringify(state, null, pretty ? 2 : 0);
    } catch (error) {
      console.error('[UnitStatePersistenceService] JSON export error:', error);
      throw new Error('Failed to export state to JSON');
    }
  }
  
  /**
   * Import state from JSON string
   */
  importFromJson(jsonString: string): CompleteUnitState {
    try {
      const state = JSON.parse(jsonString) as CompleteUnitState;
      
      // Basic validation
      if (!state || typeof state !== 'object') {
        throw new Error('Invalid JSON structure');
      }
      
      if (!state.configuration || !state.criticalSlotAllocations) {
        throw new Error('Missing required state properties');
      }
      
      return state;
      
    } catch (error) {
      console.error('[UnitStatePersistenceService] JSON import error:', error);
      throw new Error(`Failed to import state from JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }
  
  /**
   * Compare two states for differences
   */
  compareStates(state1: CompleteUnitState, state2: CompleteUnitState): {
    identical: boolean;
    configurationChanged: boolean;
    equipmentChanged: boolean;
    differences: string[];
  } {
    const differences: string[] = [];
    
    // Compare configurations
    const configEqual = this.deepEqual(state1.configuration, state2.configuration);
    if (!configEqual) {
      differences.push('Unit configuration differs');
    }
    
    // Compare equipment allocations
    const allocationsEqual = this.deepEqual(state1.criticalSlotAllocations, state2.criticalSlotAllocations);
    if (!allocationsEqual) {
      differences.push('Critical slot allocations differ');
    }
    
    // Compare unallocated equipment
    const unallocatedEqual = this.deepEqual(state1.unallocatedEquipment, state2.unallocatedEquipment);
    if (!unallocatedEqual) {
      differences.push('Unallocated equipment differs');
    }
    
    // Compare versions
    if (state1.version !== state2.version) {
      differences.push(`Version differs: ${state1.version} vs ${state2.version}`);
    }
    
    return {
      identical: differences.length === 0,
      configurationChanged: !configEqual,
      equipmentChanged: !allocationsEqual || !unallocatedEqual,
      differences
    };
  }
  
  // Private helper methods
  
  private serializeCriticalSlots(sections: Map<string, CriticalSection>): SerializedSlotAllocations {
    const allocations: SerializedSlotAllocations = {};
    
    sections.forEach((section, location) => {
      const equipment = section.getAllEquipment();
      if (equipment.length > 0) {
        allocations[location] = {};
        
        equipment.forEach(allocation => {
          allocation.occupiedSlots.forEach(slotIndex => {
            allocations[location][slotIndex] = this.serializeEquipment(allocation);
          });
        });
      }
    });
    
    return allocations;
  }
  
  private serializeUnallocatedEquipment(unallocatedEquipment: EquipmentAllocation[]): SerializedEquipment[] {
    return unallocatedEquipment.map(allocation => this.serializeEquipment(allocation));
  }
  
  private serializeEquipment(allocation: EquipmentAllocation): SerializedEquipment {
    return {
      equipmentData: this.cloneEquipmentData(allocation.equipmentData),
      equipmentGroupId: allocation.equipmentGroupId,
      location: allocation.location || '',
      startSlotIndex: allocation.startSlotIndex ?? -1,
      endSlotIndex: allocation.endSlotIndex ?? -1,
      occupiedSlots: [...(allocation.occupiedSlots || [])]
    };
  }
  
  private restoreAllocatedEquipment(
    allocations: SerializedSlotAllocations,
    sections: Map<string, CriticalSection>
  ): { restored: number; failed: number; warnings: string[] } {
    const result = { restored: 0, failed: 0, warnings: [] as string[] };
    const processedGroups = new Set<string>();
    
    Object.entries(allocations).forEach(([location, slots]) => {
      const section = sections.get(location);
      if (!section) {
        result.warnings.push(`Section not found: ${location}`);
        return;
      }
      
      Object.entries(slots).forEach(([slotStr, serializedEquipment]) => {
        // Skip if we've already processed this equipment group
        if (processedGroups.has(serializedEquipment.equipmentGroupId)) {
          return;
        }
        
        try {
          const success = section.allocateEquipment(
            serializedEquipment.equipmentData,
            serializedEquipment.startSlotIndex,
            serializedEquipment.equipmentGroupId
          );
          
          if (success) {
            processedGroups.add(serializedEquipment.equipmentGroupId);
            result.restored++;
          } else {
            result.failed++;
            result.warnings.push(`Failed to restore ${serializedEquipment.equipmentData?.name || 'unknown'} to ${location}`);
          }
        } catch (error) {
          result.failed++;
          result.warnings.push(`Error restoring equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    });
    
    return result;
  }
  
  private cloneConfiguration(config: UnitConfiguration): UnitConfiguration {
    return JSON.parse(JSON.stringify(config));
  }
  
  private cloneEquipmentData(equipmentData: any): any {
    return JSON.parse(JSON.stringify(equipmentData));
  }
  
  private cloneState(state: CompleteUnitState): CompleteUnitState {
    return JSON.parse(JSON.stringify(state));
  }
  
  private isVersionCompatible(version: string): boolean {
    const supportedVersions = ['1.0.0', '1.1.0', '1.2.0'];
    return supportedVersions.includes(version);
  }
  
  private migrateState(state: CompleteUnitState): CompleteUnitState {
    if (state.version === this.CURRENT_VERSION) {
      return state;
    }
    
    console.log(`[UnitStatePersistenceService] Migrating state from ${state.version} to ${this.CURRENT_VERSION}`);
    
    // Create a copy for migration
    const migratedState = this.cloneState(state);
    
    // Apply version-specific migrations
    if (state.version === '1.0.0') {
      migratedState.version = '1.1.0';
      // Add any 1.0.0 -> 1.1.0 specific migrations here
    }
    
    if (migratedState.version === '1.1.0') {
      migratedState.version = '1.2.0';
      // Add any 1.1.0 -> 1.2.0 specific migrations here
    }
    
    return migratedState;
  }
  
  private validateEquipmentReferences(state: CompleteUnitState, result: StateValidationResult): void {
    // Collect all equipment group IDs
    const allocatedIds = new Set<string>();
    Object.values(state.criticalSlotAllocations).forEach(slots => {
      Object.values(slots).forEach(equipment => {
        allocatedIds.add(equipment.equipmentGroupId);
      });
    });
    
    const unallocatedIds = new Set(state.unallocatedEquipment.map(eq => eq.equipmentGroupId));
    
    // Check for conflicts
    const conflicts = Array.from(allocatedIds).filter(id => unallocatedIds.has(id));
    if (conflicts.length > 0) {
      result.warnings.push(`Equipment exists in both allocated and unallocated: ${conflicts.join(', ')}`);
    }
  }
  
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
}

// Singleton instance for global use
let globalStatePersistenceService: UnitStatePersistenceService | null = null;

/**
 * Get or create global state persistence service
 */
export function getUnitStatePersistenceService(): UnitStatePersistenceService {
  if (!globalStatePersistenceService) {
    globalStatePersistenceService = new UnitStatePersistenceService();
  }
  return globalStatePersistenceService;
}

/**
 * Initialize global state persistence service with specific options
 */
export function initializeUnitStatePersistenceService(options: { maxSnapshots?: number }): UnitStatePersistenceService {
  globalStatePersistenceService = new UnitStatePersistenceService(options);
  return globalStatePersistenceService;
}

/**
 * Reset global state persistence service (for testing)
 */
export function resetUnitStatePersistenceService(): void {
  globalStatePersistenceService = null;
}
