/**
 * Fixed Criticals Tab Component 
 * Uses the working handleSystemChange logic from test implementation
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  useUnitData,
  useEquipment,
  useSystemComponents
} from '../../../hooks/useUnitData';
import { MECH_LOCATIONS, EditableUnit } from '../../../types/editor';
import { calculateCompleteInternalStructure, handleSystemChange } from '../../../utils/criticalSlotCalculations';
import { MechCriticalsAllocationGrid } from '../criticals/MechCriticalsAllocationGrid';
import DraggableEquipmentItem from '../equipment/DraggableEquipmentItem';
import { FullEquipment } from '../../../types';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';
import { DraggedEquipment } from '../dnd/types';
import styles from './CriticalsTab.module.css';

interface CriticalsTabFixedProps {
  readOnly?: boolean;
}

export default function CriticalsTabFixed({ readOnly = false }: CriticalsTabFixedProps) {
  const { state, setUnit, updateCriticalSlots } = useUnitData();
  const equipment = useEquipment();
  const systemComponents = useSystemComponents();
  
  // Track previous system component values
  const prevEngineType = useRef(systemComponents?.engine?.type);
  const prevGyroType = useRef(systemComponents?.gyro?.type);
  
  // Get unit from state
  const unit = state.unit;
  
  // Watch for system component changes and rebuild slots
  useEffect(() => {
    if (!systemComponents) return;
    
    const engineChanged = prevEngineType.current !== systemComponents.engine?.type;
    const gyroChanged = prevGyroType.current !== systemComponents.gyro?.type;
    
    if (engineChanged || gyroChanged) {
      console.log('System component changed, rebuilding slots');
      
      // Determine which component changed
      let changeType: 'engine' | 'gyro' | undefined;
      let newValue: string | undefined;
      
      if (engineChanged) {
        changeType = 'engine';
        newValue = systemComponents.engine?.type;
        prevEngineType.current = newValue as any;
      } else if (gyroChanged) {
        changeType = 'gyro';
        newValue = systemComponents.gyro?.type;
        prevGyroType.current = newValue as any;
      }
      
      if (changeType && newValue) {
        // Use handleSystemChange to rebuild slots
        const { updatedUnit, removedEquipment } = handleSystemChange(unit, changeType, newValue as any);
        
        if (removedEquipment.length > 0) {
          const equipmentNames = removedEquipment.map(e => e.equipment).join(', ');
          console.log(`Removed equipment due to ${changeType} change: ${equipmentNames}`);
        }
        
        // Update the entire unit to get the rebuilt critical slots
        setUnit(updatedUnit);
      }
    }
  }, [systemComponents?.engine?.type, systemComponents?.gyro?.type, unit, setUnit]);
  
  // Handle equipment placement
  const handleEquipmentPlace = (equipment: DraggedEquipment, location: string, slotIndex: number) => {
    if (readOnly) return;
    
    // Calculate actual slot index (after internal structure)
    const internalStructure = calculateCompleteInternalStructure(unit);
    const internalSlotsCount = internalStructure[location]?.length || 0;
    const equipmentArrayIndex = slotIndex - internalSlotsCount;
    
    if (equipmentArrayIndex < 0) {
      console.error('Cannot place equipment in internal structure slot');
      return;
    }
    
    // Update critical slots
    const newCriticalSlots: any = { ...unit.criticalSlots };
    if (!newCriticalSlots[location]) {
      newCriticalSlots[location] = [];
    }
    
    // Ensure array is large enough
    while (newCriticalSlots[location].length <= equipmentArrayIndex) {
      newCriticalSlots[location].push(null);
    }
    
    // Place equipment (handling multi-slot items)
    for (let i = 0; i < equipment.criticalSlots; i++) {
      if (equipmentArrayIndex + i < newCriticalSlots[location].length) {
        newCriticalSlots[location][equipmentArrayIndex + i] = equipment.name;
      }
    }
    
    const updatedUnit = {
      ...unit,
      criticalSlots: newCriticalSlots
    };
    
    setUnit(updatedUnit);
  };
  
  // Handle equipment removal
  const handleEquipmentRemove = (location: string, slotIndex: number) => {
    if (readOnly) return;
    
    // Calculate actual slot index (after internal structure)
    const internalStructure = calculateCompleteInternalStructure(unit);
    const internalSlotsCount = internalStructure[location]?.length || 0;
    const equipmentArrayIndex = slotIndex - internalSlotsCount;
    
    if (equipmentArrayIndex < 0) {
      console.error('Cannot remove internal structure');
      return;
    }
    
    // Get the equipment name at this slot
    const equipmentName = (unit.criticalSlots as any)[location]?.[equipmentArrayIndex];
    if (!equipmentName) return;
    
    // Remove all slots for this equipment
    const newCriticalSlots: any = { ...unit.criticalSlots };
    if (newCriticalSlots[location]) {
      // Find all slots with this equipment and clear them
      for (let i = 0; i < newCriticalSlots[location].length; i++) {
        if (newCriticalSlots[location][i] === equipmentName) {
          newCriticalSlots[location][i] = null;
        }
      }
    }
    
    const updatedUnit = {
      ...unit,
      criticalSlots: newCriticalSlots
    };
    
    setUnit(updatedUnit);
  };
  
  // Get unallocated equipment
  const unallocatedEquipment = useMemo(() => {
    const unallocated: FullEquipment[] = [];
    const allocatedNames = new Set<string>();
    
    // Collect all allocated equipment names
    Object.values(unit.criticalSlots || {}).forEach((slots: any) => {
      if (Array.isArray(slots)) {
        slots.forEach((slot: string | null) => {
          if (slot) allocatedNames.add(slot);
        });
      }
    });
    
    // Find equipment that's not allocated
    equipment.forEach((eq, index) => {
      if (!allocatedNames.has(eq.item_name)) {
        const stats = EQUIPMENT_DATABASE.find(e => e.name === eq.item_name);
        
        unallocated.push({
          id: `unallocated-${index}`,
          name: eq.item_name,
          type: eq.item_type === 'weapon' ? 'Weapon' : 'Equipment',
          tech_base: eq.tech_base || unit.tech_base,
          weight: typeof stats?.weight === 'number' ? stats.weight : 
                 typeof eq.tons === 'number' ? eq.tons : 1,
          space: typeof stats?.crits === 'number' ? stats.crits : 
                typeof eq.crits === 'number' ? eq.crits : 1,
          damage: stats?.damage,
          heat: stats?.heat
        });
      }
    });
    
    return unallocated;
  }, [equipment, unit.criticalSlots, unit.tech_base]);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Critical Slot Allocation</h2>
          <div className={styles.stats}>
            <span>Current Configuration: {systemComponents?.engine?.type} Engine, {systemComponents?.gyro?.type} Gyro</span>
          </div>
        </div>
        
        <div className={styles.mainGrid}>
          {/* Critical Slots Grid */}
          <div className={styles.criticalSlotsPanel}>
            <MechCriticalsAllocationGrid
              unit={unit}
              onEquipmentPlace={handleEquipmentPlace}
              onEquipmentRemove={handleEquipmentRemove}
              readOnly={readOnly}
            />
          </div>
          
          {/* Equipment Panel */}
          <div className={styles.equipmentPanel}>
            <h3 className={styles.panelTitle}>Unallocated Equipment</h3>
            <div className={styles.equipmentList}>
              {unallocatedEquipment.length > 0 ? (
                unallocatedEquipment.map(equipment => (
                  <DraggableEquipmentItem
                    key={equipment.id}
                    equipment={equipment}
                    showDetails={true}
                    isCompact={false}
                  />
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>No unallocated equipment</p>
                  <p className={styles.hint}>
                    Add equipment in the Equipment tab
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
