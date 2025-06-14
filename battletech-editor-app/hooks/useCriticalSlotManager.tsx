/**
 * React Hook for Critical Slot Manager
 * Provides integration between CriticalSlotManager and the UI components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUnitData } from './useUnitData';
import { CriticalSlotManager } from '../utils/criticalSlotManager';
import {
  EnhancedCriticalSlot,
  EnhancedCriticalAllocationMap,
  UnhittableComponent,
  CriticalSlotTransaction
} from '../types/enhancedCriticals';

// Helper to convert between legacy and enhanced formats
const convertLegacyToEnhanced = (
  legacyCriticals: any,
  criticalAllocations?: any
): EnhancedCriticalAllocationMap => {
  const enhanced: EnhancedCriticalAllocationMap = {};
  
  if (criticalAllocations) {
    // Use enhanced format if available
    Object.entries(criticalAllocations).forEach(([location, slots]) => {
      enhanced[location] = (slots as any[]).map((slot, index) => ({
        index,
        content: slot.content === '-Empty-' ? null : slot.content,
        contentType: slot.contentType || (slot.content ? 'equipment' : 'empty'),
        equipmentId: slot.equipmentId,
        isFixed: slot.isFixed || false,
        isManuallyPlaced: slot.isManuallyPlaced || false,
        unhittableType: slot.unhittableType,
        parentComponent: slot.parentComponent,
        lastModified: slot.lastModified,
        transactionId: slot.transactionId,
        multiSlotGroup: slot.multiSlotGroup
      }));
    });
  } else if (legacyCriticals) {
    // Convert from legacy format
    legacyCriticals.forEach((loc: any) => {
      enhanced[loc.location] = loc.slots.map((content: string, index: number) => ({
        index,
        content: content === '-Empty-' ? null : content,
        contentType: content === '-Empty-' ? 'empty' : 'equipment',
        equipmentId: undefined,
        isFixed: false,
        isManuallyPlaced: false
      }));
    });
  }
  
  return enhanced;
};

export interface UseCriticalSlotManagerReturn {
  // Manager instance
  manager: CriticalSlotManager;
  
  // Read operations
  getSlot: (location: string, index: number) => EnhancedCriticalSlot | null;
  getLocationSlots: (location: string) => EnhancedCriticalSlot[];
  isSlotEmpty: (location: string, index: number) => boolean;
  canAcceptEquipment: (location: string, startIndex: number, equipment: { name: string; slots: number }) => boolean;
  findEquipment: (equipmentId: string) => { location: string; startIndex: number; slots: EnhancedCriticalSlot[] } | null;
  
  // Write operations (wrapped to update state)
  addEquipment: (location: string, startIndex: number, equipment: {
    id: string;
    name: string;
    slots: number;
    isSystem?: boolean;
    isFixed?: boolean;
  }) => boolean;
  removeEquipment: (location: string, slotIndex: number) => {
    equipment: { id: string; name: string; slots: number };
    affectedSlots: number[];
  } | null;
  moveEquipment: (fromLocation: string, fromIndex: number, toLocation: string, toIndex: number) => boolean;
  clearLocation: (location: string) => { id: string; name: string; slots: number }[];
  
  // Unhittables management
  generateUnhittables: (type: 'structure' | 'armor', componentType: string, techBase: 'Inner Sphere' | 'Clan') => UnhittableComponent[];
  addUnhittable: (location: string, slotIndex: number, unhittable: UnhittableComponent) => boolean;
  getUnallocatedUnhittables: () => {
    structure: UnhittableComponent[];
    armor: UnhittableComponent[];
    special: UnhittableComponent[];
  };
  validateUnhittablesAllocation: () => {
    valid: boolean;
    missing: {
      structure: number;
      armor: number;
      special: Array<{ name: string; missing: number }>;
    };
  };
  
  // Transaction management
  getRecentTransactions: (limit?: number) => CriticalSlotTransaction[];
  undoLastTransaction: () => boolean;
  redoTransaction: () => boolean;
  
  // Drag state management
  startDrag: (equipment: {
    id: string;
    name: string;
    slots: number;
    weight?: number;
  }, sourceLocation?: string, sourceSlotIndex?: number) => void;
  endDrag: (success: boolean) => void;
  isDragging: () => boolean;
  getDraggedItem: () => any;
  getValidDropTargets: () => any[];
  
  // UI helpers
  getCriticalSlotsDisplay: () => Record<string, (string | null)[]>;
  getSlotStatistics: () => {
    total: number;
    used: number;
    available: number;
    byLocation: Record<string, { total: number; used: number; available: number }>;
  };
}

export function useCriticalSlotManager(): UseCriticalSlotManagerReturn {
  const { state, updateCriticalSlots, updateEquipmentLocation } = useUnitData();
  
  // Initialize manager with current state
  const [manager] = useState(() => {
    const enhanced = convertLegacyToEnhanced(
      state.unit.data?.criticals,
      state.unit.criticalAllocations
    );
    return new CriticalSlotManager(enhanced);
  });
  
  // Sync manager with state changes
  useEffect(() => {
    const enhanced = convertLegacyToEnhanced(
      state.unit.data?.criticals,
      state.unit.criticalAllocations
    );
    manager.importState({ allocations: enhanced });
  }, [state.unit.criticalAllocations, state.unit.data?.criticals, manager]);
  
  // Helper to sync manager state back to unit data
  const syncToUnitData = useCallback((location: string) => {
    const slots = manager.getLocationSlots(location);
    const legacySlots = slots.map(s => s.content || '-Empty-');
    updateCriticalSlots(location, legacySlots);
  }, [manager, updateCriticalSlots]);
  
  // Wrapped write operations that update state
  const addEquipment = useCallback((
    location: string,
    startIndex: number,
    equipment: any
  ) => {
    const success = manager.addEquipment(location, startIndex, equipment);
    if (success) {
      syncToUnitData(location);
      
      // Also update equipment location if it's from unallocated
      if (!equipment.isFromCriticalSlot) {
        const equipmentIndex = state.unit.data?.weapons_and_equipment?.findIndex(
          (eq: any) => eq.item_name === equipment.name && (!eq.location || eq.location === '')
        );
        if (equipmentIndex !== undefined && equipmentIndex >= 0) {
          updateEquipmentLocation(equipmentIndex, location);
        }
      }
    }
    return success;
  }, [manager, syncToUnitData, state.unit.data?.weapons_and_equipment, updateEquipmentLocation]);
  
  const removeEquipment = useCallback((location: string, slotIndex: number) => {
    const result = manager.removeEquipment(location, slotIndex);
    if (result) {
      syncToUnitData(location);
      
      // Also update equipment location to unallocated
      const equipmentIndex = state.unit.data?.weapons_and_equipment?.findIndex(
        (eq: any) => eq.item_name === result.equipment.name && eq.location === location
      );
      if (equipmentIndex !== undefined && equipmentIndex >= 0) {
        updateEquipmentLocation(equipmentIndex, '');
      }
    }
    return result;
  }, [manager, syncToUnitData, state.unit.data?.weapons_and_equipment, updateEquipmentLocation]);
  
  const moveEquipment = useCallback((
    fromLocation: string,
    fromIndex: number,
    toLocation: string,
    toIndex: number
  ) => {
    const success = manager.moveEquipment(fromLocation, fromIndex, toLocation, toIndex);
    if (success) {
      syncToUnitData(fromLocation);
      syncToUnitData(toLocation);
      
      // Update equipment location in data model
      const sourceSlot = manager.getSlot(toLocation, toIndex);
      if (sourceSlot && sourceSlot.content) {
        const equipmentIndex = state.unit.data?.weapons_and_equipment?.findIndex(
          (eq: any) => eq.item_name === sourceSlot.content && eq.location === fromLocation
        );
        if (equipmentIndex !== undefined && equipmentIndex >= 0) {
          updateEquipmentLocation(equipmentIndex, toLocation);
        }
      }
    }
    return success;
  }, [manager, syncToUnitData, state.unit.data?.weapons_and_equipment, updateEquipmentLocation]);
  
  const clearLocation = useCallback((location: string) => {
    const removed = manager.clearLocation(location);
    syncToUnitData(location);
    
    // Update all removed equipment to unallocated
    removed.forEach(equipment => {
      const equipmentIndex = state.unit.data?.weapons_and_equipment?.findIndex(
        (eq: any) => eq.item_name === equipment.name && eq.location === location
      );
      if (equipmentIndex !== undefined && equipmentIndex >= 0) {
        updateEquipmentLocation(equipmentIndex, '');
      }
    });
    
    return removed;
  }, [manager, syncToUnitData, state.unit.data?.weapons_and_equipment, updateEquipmentLocation]);
  
  const addUnhittable = useCallback((
    location: string,
    slotIndex: number,
    unhittable: UnhittableComponent
  ) => {
    const success = manager.addUnhittable(location, slotIndex, unhittable);
    if (success) {
      syncToUnitData(location);
    }
    return success;
  }, [manager, syncToUnitData]);
  
  const undoLastTransaction = useCallback(() => {
    const success = manager.undoLastTransaction();
    if (success) {
      // Sync all locations (inefficient but ensures consistency)
      const state = manager.exportState();
      Object.keys(state.allocations).forEach(location => {
        syncToUnitData(location);
      });
    }
    return success;
  }, [manager, syncToUnitData]);
  
  const redoTransaction = useCallback(() => {
    const success = manager.redoTransaction();
    if (success) {
      // Sync all locations
      const state = manager.exportState();
      Object.keys(state.allocations).forEach(location => {
        syncToUnitData(location);
      });
    }
    return success;
  }, [manager, syncToUnitData]);
  
  // UI helper to get display format
  const getCriticalSlotsDisplay = useCallback(() => {
    const display: Record<string, (string | null)[]> = {};
    const state = manager.exportState();
    
    Object.entries(state.allocations).forEach(([location, slots]) => {
      display[location] = slots.map(slot => slot.content);
    });
    
    return display;
  }, [manager]);
  
  // Calculate slot statistics
  const getSlotStatistics = useCallback(() => {
    const state = manager.exportState();
    let totalSlots = 0;
    let usedSlots = 0;
    const byLocation: Record<string, { total: number; used: number; available: number }> = {};
    
    Object.entries(state.allocations).forEach(([location, slots]) => {
      const locationTotal = slots.length;
      const locationUsed = slots.filter(s => s.content !== null).length;
      const locationAvailable = locationTotal - locationUsed;
      
      totalSlots += locationTotal;
      usedSlots += locationUsed;
      
      byLocation[location] = {
        total: locationTotal,
        used: locationUsed,
        available: locationAvailable
      };
    });
    
    return {
      total: totalSlots,
      used: usedSlots,
      available: totalSlots - usedSlots,
      byLocation
    };
  }, [manager]);
  
  // Return all methods
  return {
    manager,
    
    // Read operations (direct passthrough)
    getSlot: manager.getSlot.bind(manager),
    getLocationSlots: manager.getLocationSlots.bind(manager),
    isSlotEmpty: manager.isSlotEmpty.bind(manager),
    canAcceptEquipment: manager.canAcceptEquipment.bind(manager),
    findEquipment: manager.findEquipment.bind(manager),
    
    // Write operations (wrapped)
    addEquipment,
    removeEquipment,
    moveEquipment,
    clearLocation,
    
    // Unhittables management
    generateUnhittables: manager.generateUnhittables.bind(manager),
    addUnhittable,
    getUnallocatedUnhittables: manager.getUnallocatedUnhittables.bind(manager),
    validateUnhittablesAllocation: manager.validateUnhittablesAllocation.bind(manager),
    
    // Transaction management
    getRecentTransactions: manager.getRecentTransactions.bind(manager),
    undoLastTransaction,
    redoTransaction,
    
    // Drag state management
    startDrag: manager.startDrag.bind(manager),
    endDrag: manager.endDrag.bind(manager),
    isDragging: manager.isDragging.bind(manager),
    getDraggedItem: manager.getDraggedItem.bind(manager),
    getValidDropTargets: manager.getValidDropTargets.bind(manager),
    
    // UI helpers
    getCriticalSlotsDisplay,
    getSlotStatistics
  };
}
