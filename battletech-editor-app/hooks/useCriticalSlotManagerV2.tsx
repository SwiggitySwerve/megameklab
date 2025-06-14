/**
 * React Hook for Critical Slot Manager V2
 * Provides object-based critical slot management in React components
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { CriticalSlotManagerV2 } from '../utils/criticalSlotManagerV2';
import {
  CriticalSlotObject,
  CriticalAllocationMap,
  EquipmentObject,
  EquipmentRegistry,
  CriticalDragState,
  SlotValidationResult,
  EquipmentType,
  EquipmentCategory
} from '../types/criticalSlots';
import { SystemComponents } from '../types/systemComponents';
import { EditableUnit } from '../types/editor';
import { v4 as uuidv4 } from 'uuid';

interface UseCriticalSlotManagerReturn {
  // State
  allocations: CriticalAllocationMap;
  registry: EquipmentRegistry;
  dragState: CriticalDragState;
  validation: SlotValidationResult;
  
  // Slot operations
  allocateEquipment: (location: string, startIndex: number, equipment: EquipmentObject) => boolean;
  removeEquipment: (location: string, slotIndex: number) => boolean;
  moveEquipment: (fromLocation: string, fromIndex: number, toLocation: string, toIndex: number) => boolean;
  clearLocation: (location: string) => void;
  
  // Query methods
  getSlotContent: (location: string, slotIndex: number) => CriticalSlotObject | null;
  isSlotEmpty: (location: string, slotIndex: number) => boolean;
  canAllocateEquipment: (location: string, startIndex: number, equipment: EquipmentObject) => boolean;
  getFreeSlotsInLocation: (location: string) => number[];
  getEquipmentInLocation: (location: string) => EquipmentObject[];
  
  // Drag and drop
  startDrag: (equipment: EquipmentObject, sourceLocation?: string, sourceIndex?: number) => void;
  endDrag: () => void;
  setHoverSlot: (location: string | null, index: number | null) => void;
  
  // Utility
  convertWeaponToEquipmentObject: (weapon: any) => EquipmentObject;
  exportToUnitData: () => any;
  validate: () => SlotValidationResult;
}

export function useCriticalSlotManagerV2(
  unit: EditableUnit,
  systemComponents: SystemComponents
): UseCriticalSlotManagerReturn {
  // Initialize manager
  const [manager] = useState(() => {
    return CriticalSlotManagerV2.fromLegacyFormat(unit, systemComponents);
  });

  // State
  const [allocations, setAllocations] = useState<CriticalAllocationMap>(manager.getAllocations());
  const [registry, setRegistry] = useState<EquipmentRegistry>(manager.getRegistry());
  const [validation, setValidation] = useState<SlotValidationResult>(manager.validate());
  const [dragState, setDragState] = useState<CriticalDragState>({
    isDragging: false,
    draggedEquipment: null,
    canDrop: false,
    dropPreview: null
  });

  // Update state when manager changes
  const updateState = useCallback(() => {
    setAllocations({ ...manager.getAllocations() });
    setRegistry({ ...manager.getRegistry() });
    setValidation(manager.validate());
  }, [manager]);

  // Slot operations
  const allocateEquipment = useCallback((
    location: string,
    startIndex: number,
    equipment: EquipmentObject
  ): boolean => {
    const success = manager.allocateEquipment(location, startIndex, equipment);
    if (success) {
      updateState();
    }
    return success;
  }, [manager, updateState]);

  const removeEquipment = useCallback((
    location: string,
    slotIndex: number
  ): boolean => {
    const success = manager.removeEquipment(location, slotIndex);
    if (success) {
      updateState();
    }
    return success;
  }, [manager, updateState]);

  const moveEquipment = useCallback((
    fromLocation: string,
    fromIndex: number,
    toLocation: string,
    toIndex: number
  ): boolean => {
    const success = manager.moveEquipment(fromLocation, fromIndex, toLocation, toIndex);
    if (success) {
      updateState();
    }
    return success;
  }, [manager, updateState]);

  const clearLocation = useCallback((location: string): void => {
    manager.clearLocation(location);
    updateState();
  }, [manager, updateState]);

  // Query methods
  const getSlotContent = useCallback((
    location: string,
    slotIndex: number
  ): CriticalSlotObject | null => {
    return manager.getSlotContent(location, slotIndex);
  }, [manager]);

  const isSlotEmpty = useCallback((
    location: string,
    slotIndex: number
  ): boolean => {
    return manager.isSlotEmpty(location, slotIndex);
  }, [manager]);

  const canAllocateEquipment = useCallback((
    location: string,
    startIndex: number,
    equipment: EquipmentObject
  ): boolean => {
    return manager.canAllocateEquipment(location, startIndex, equipment);
  }, [manager]);

  const getFreeSlotsInLocation = useCallback((location: string): number[] => {
    const slots = allocations[location] || [];
    return slots
      .map((slot, index) => slot.equipment === null ? index : -1)
      .filter(index => index !== -1);
  }, [allocations]);

  const getEquipmentInLocation = useCallback((location: string): EquipmentObject[] => {
    const slots = allocations[location] || [];
    const equipmentMap = new Map<string, EquipmentObject>();
    
    slots.forEach(slot => {
      if (slot.equipment) {
        const equipment = slot.equipment.equipmentData;
        if (!equipmentMap.has(equipment.id)) {
          equipmentMap.set(equipment.id, equipment);
        }
      }
    });
    
    return Array.from(equipmentMap.values());
  }, [allocations]);

  // Drag and drop
  const startDrag = useCallback((
    equipment: EquipmentObject,
    sourceLocation?: string,
    sourceIndex?: number
  ): void => {
    setDragState({
      isDragging: true,
      draggedEquipment: equipment,
      sourceLocation,
      sourceSlotIndex: sourceIndex,
      canDrop: false,
      dropPreview: null
    });
  }, []);

  const endDrag = useCallback((): void => {
    setDragState({
      isDragging: false,
      draggedEquipment: null,
      canDrop: false,
      dropPreview: null
    });
  }, []);

  const setHoverSlot = useCallback((
    location: string | null,
    index: number | null
  ): void => {
    if (!dragState.isDragging || !dragState.draggedEquipment) return;

    if (location && index !== null) {
      const canDrop = manager.canAllocateEquipment(
        location,
        index,
        dragState.draggedEquipment
      );

      const dropPreview = canDrop ? {
        location,
        slots: Array.from(
          { length: dragState.draggedEquipment.requiredSlots },
          (_, i) => index + i
        )
      } : null;

      setDragState(prev => ({
        ...prev,
        hoveredLocation: location,
        hoveredSlotIndex: index,
        canDrop,
        dropPreview
      }));
    } else {
      setDragState(prev => ({
        ...prev,
        hoveredLocation: undefined,
        hoveredSlotIndex: undefined,
        canDrop: false,
        dropPreview: null
      }));
    }
  }, [dragState.isDragging, dragState.draggedEquipment, manager]);

  // Utility function to convert weapon/equipment data to EquipmentObject
  const convertWeaponToEquipmentObject = useCallback((weapon: any): EquipmentObject => {
    // Determine equipment type
    let type: EquipmentType = EquipmentType.EQUIPMENT;
    let category: EquipmentCategory = EquipmentCategory.EQUIPMENT;
    
    if (weapon.item_type === 'weapon') {
      category = EquipmentCategory.WEAPON;
      // Determine weapon type based on name
      const name = weapon.item_name.toLowerCase();
      if (name.includes('laser') || name.includes('ppc') || name.includes('pulse')) {
        type = EquipmentType.ENERGY;
      } else if (name.includes('missile') || name.includes('lrm') || name.includes('srm') || name.includes('mml')) {
        type = EquipmentType.MISSILE;
      } else if (name.includes('gauss') || name.includes('autocannon') || name.includes('ac/') || name.includes('machine gun')) {
        type = EquipmentType.BALLISTIC;
      } else {
        type = EquipmentType.PHYSICAL;
      }
    } else if (weapon.item_type === 'ammunition') {
      type = EquipmentType.AMMO;
      category = EquipmentCategory.AMMO;
    } else if (weapon.item_name.includes('Heat Sink')) {
      type = EquipmentType.HEAT_SINK;
      category = EquipmentCategory.SYSTEM;
    }

    return {
      id: weapon.id || uuidv4(),
      name: weapon.item_name,
      type,
      category,
      requiredSlots: typeof weapon.crits === 'string' ? parseInt(weapon.crits) : (weapon.crits || 1),
      weight: typeof weapon.tons === 'string' ? parseFloat(weapon.tons) : (weapon.tons || 0),
      isFixed: false,
      isRemovable: true,
      techBase: weapon.tech_base || 'Inner Sphere',
      damage: weapon.damage,
      heat: weapon.heat,
      minRange: weapon.min_range,
      shortRange: weapon.short_range,
      mediumRange: weapon.medium_range,
      longRange: weapon.long_range,
      ammoType: weapon.ammo_type,
      shotsPerTon: weapon.shots_per_ton
    };
  }, []);

  // Export to unit data format
  const exportToUnitData = useCallback(() => {
    return manager.exportToUnitData();
  }, [manager]);

  // Validate
  const validate = useCallback((): SlotValidationResult => {
    return manager.validate();
  }, [manager]);

  // Re-initialize when unit or system components change
  useEffect(() => {
    const newManager = CriticalSlotManagerV2.fromLegacyFormat(unit, systemComponents);
    setAllocations(newManager.getAllocations());
    setRegistry(newManager.getRegistry());
    setValidation(newManager.validate());
  }, [unit.id]); // Only re-init on unit change, not every render

  return {
    // State
    allocations,
    registry,
    dragState,
    validation,
    
    // Slot operations
    allocateEquipment,
    removeEquipment,
    moveEquipment,
    clearLocation,
    
    // Query methods
    getSlotContent,
    isSlotEmpty,
    canAllocateEquipment,
    getFreeSlotsInLocation,
    getEquipmentInLocation,
    
    // Drag and drop
    startDrag,
    endDrag,
    setHoverSlot,
    
    // Utility
    convertWeaponToEquipmentObject,
    exportToUnitData,
    validate
  };
}

// Context for sharing critical slot manager across components
import React, { createContext, useContext } from 'react';

const CriticalSlotManagerContext = createContext<UseCriticalSlotManagerReturn | null>(null);

export const CriticalSlotManagerProvider: React.FC<{
  children: React.ReactNode;
  unit: EditableUnit;
  systemComponents: SystemComponents;
}> = ({ children, unit, systemComponents }) => {
  const manager = useCriticalSlotManagerV2(unit, systemComponents);
  
  return (
    <CriticalSlotManagerContext.Provider value={manager}>
      {children}
    </CriticalSlotManagerContext.Provider>
  );
};

export const useCriticalSlotContext = (): UseCriticalSlotManagerReturn => {
  const context = useContext(CriticalSlotManagerContext);
  if (!context) {
    throw new Error('useCriticalSlotContext must be used within CriticalSlotManagerProvider');
  }
  return context;
};
