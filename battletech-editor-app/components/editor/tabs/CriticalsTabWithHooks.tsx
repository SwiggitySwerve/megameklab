/**
 * Criticals Tab Component with Hooks
 * Uses the unified data model for state management
 */

import React, { useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  useUnitData,
  useCriticalAllocations,
  useEquipment,
  useSystemComponents
} from '../../../hooks/useUnitData';
import { MECH_LOCATIONS } from '../../../types/editor';
import DraggableEquipmentItem from '../equipment/DraggableEquipmentItem';
import CriticalSlotDropZone from '../criticals/CriticalSlotDropZone';
import { DraggedEquipment } from '../dnd/types';
import { FullEquipment } from '../../../types';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';
import styles from './CriticalsTab.module.css';

interface CriticalsTabWithHooksProps {
  readOnly?: boolean;
}

// Mech locations with slot counts
const mechLocations = [
  { name: MECH_LOCATIONS.HEAD, slots: 6 },
  { name: MECH_LOCATIONS.LEFT_ARM, slots: 12 },
  { name: MECH_LOCATIONS.RIGHT_ARM, slots: 12 },
  { name: MECH_LOCATIONS.LEFT_TORSO, slots: 12 },
  { name: MECH_LOCATIONS.CENTER_TORSO, slots: 12 },
  { name: MECH_LOCATIONS.RIGHT_TORSO, slots: 12 },
  { name: MECH_LOCATIONS.LEFT_LEG, slots: 6 },
  { name: MECH_LOCATIONS.RIGHT_LEG, slots: 6 },
];

// Helper to normalize equipment names
const normalizeEquipmentName = (itemName: string): string => {
  if (!itemName) return itemName;
  
  const lowerName = itemName.toLowerCase();
  
  // Normalize all engine types to just "Engine"
  if (lowerName.includes('engine') && 
      !lowerName.includes('heat sink') && 
      !lowerName.includes('sink')) {
    return 'Engine';
  }
  
  return itemName;
};

export default function CriticalsTabWithHooks({ readOnly = false }: CriticalsTabWithHooksProps) {
  const { state, updateCriticalSlots, updateEquipmentLocation } = useUnitData();
  const criticalAllocations = useCriticalAllocations();
  const equipment = useEquipment();
  const systemComponents = useSystemComponents();
  
  // Convert critical allocations to display format
  const criticalSlots = useMemo(() => {
    const slots: Record<string, string[]> = {};
    
    if (criticalAllocations) {
      Object.entries(criticalAllocations).forEach(([location, locationSlots]) => {
        slots[location] = locationSlots.map(slot => {
          if (!slot || !slot.content) return '-Empty-';
          return normalizeEquipmentName(slot.content);
        });
      });
    }
    
    // Ensure all locations are initialized
    mechLocations.forEach(loc => {
      if (!slots[loc.name]) {
        slots[loc.name] = Array(loc.slots).fill('-Empty-');
      }
    });
    
    return slots;
  }, [criticalAllocations]);
  
  // Get unallocated equipment
  const unallocatedEquipment = useMemo(() => {
    const unallocated: FullEquipment[] = [];
    
    equipment
      .filter(eq => !eq.location || eq.location === '')
      .forEach((eq, index) => {
        const stats = EQUIPMENT_DATABASE.find(e => e.name === eq.item_name);
        
        unallocated.push({
          id: `${eq.item_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
          name: eq.item_name,
          type: eq.item_type === 'weapon' ? 'Weapon' : 'Equipment',
          tech_base: eq.tech_base || state.unit.tech_base,
          weight: stats?.weight || 1,
          space: stats?.crits || 1,
          damage: stats && 'damage' in stats ? 
            (typeof stats.damage === 'number' ? stats.damage.toString() : stats.damage) : 
            undefined,
          heat: stats && 'heat' in stats && stats.heat > 0 ? stats.heat : undefined,
        });
      });
    
    return unallocated;
  }, [equipment, state.unit.tech_base]);
  
  // Handle equipment drop
  const handleDrop = (item: DraggedEquipment, location: string, slotIndex: number) => {
    if (readOnly) return;
    
    // Check if equipment can fit
    const remainingSlots = criticalSlots[location].length - slotIndex;
    if (item.criticalSlots > remainingSlots) {
      alert(`Not enough slots! ${item.name} requires ${item.criticalSlots} slots, but only ${remainingSlots} available.`);
      return;
    }
    
    // Update critical slots
    const newSlots = [...criticalSlots[location]];
    
    // If moving from another location, clear source
    if ('isFromCriticalSlot' in item && item.isFromCriticalSlot) {
      const sourceLocation = (item as any).sourceLocation;
      const sourceSlotIndex = (item as any).sourceSlotIndex;
      
      // Clear source slots
      const sourceSlots = [...criticalSlots[sourceLocation]];
      for (let i = 0; i < item.criticalSlots; i++) {
        sourceSlots[sourceSlotIndex + i] = '-Empty-';
      }
      updateCriticalSlots(sourceLocation, sourceSlots);
    }
    
    // Fill target slots
    for (let i = 0; i < item.criticalSlots; i++) {
      newSlots[slotIndex + i] = item.name;
    }
    
    updateCriticalSlots(location, newSlots);
    
    // Update equipment location
    const equipmentIndex = equipment.findIndex(eq => 
      eq.item_name === item.name && (!eq.location || eq.location === '')
    );
    
    if (equipmentIndex !== -1) {
      updateEquipmentLocation(equipmentIndex, location);
    }
  };
  
  // Handle equipment removal
  const handleRemove = (location: string, slotIndex: number) => {
    if (readOnly) return;
    
    const equipmentName = criticalSlots[location][slotIndex];
    if (equipmentName === '-Empty-') return;
    
    // Check if system component
    const systemComponents = ['Engine', 'Gyro', 'Life Support', 'Sensors', 'Cockpit'];
    if (systemComponents.some(comp => equipmentName.includes(comp))) {
      return; // Cannot remove system components
    }
    
    // Find all slots with this equipment
    let startIndex = slotIndex;
    let endIndex = slotIndex;
    
    while (startIndex > 0 && criticalSlots[location][startIndex - 1] === equipmentName) {
      startIndex--;
    }
    
    while (endIndex < criticalSlots[location].length - 1 && criticalSlots[location][endIndex + 1] === equipmentName) {
      endIndex++;
    }
    
    // Clear slots
    const newSlots = [...criticalSlots[location]];
    for (let i = startIndex; i <= endIndex; i++) {
      newSlots[i] = '-Empty-';
    }
    
    updateCriticalSlots(location, newSlots);
    
    // Clear equipment location
    const equipmentIndex = equipment.findIndex(eq => 
      eq.item_name === equipmentName && eq.location === location
    );
    
    if (equipmentIndex !== -1) {
      updateEquipmentLocation(equipmentIndex, '');
    }
  };
  
  // Check if can accept equipment
  const canAcceptEquipment = (item: DraggedEquipment, location: string, slotIndex: number): boolean => {
    if (criticalSlots[location][slotIndex] !== '-Empty-') return false;
    
    const remainingSlots = criticalSlots[location].length - slotIndex;
    
    // Check all required slots are empty
    for (let i = 0; i < item.criticalSlots && i < remainingSlots; i++) {
      if (criticalSlots[location][slotIndex + i] !== '-Empty-') {
        return false;
      }
    }
    
    return item.criticalSlots <= remainingSlots;
  };
  
  // Clear location
  const clearLocation = (location: string) => {
    if (readOnly) return;
    
    const newSlots = [...criticalSlots[location]];
    const clearedEquipment: string[] = [];
    
    // Clear non-system equipment
    for (let i = 0; i < newSlots.length; i++) {
      const item = newSlots[i];
      if (item !== '-Empty-') {
        const systemComponents = ['Engine', 'Gyro', 'Life Support', 'Sensors', 'Cockpit', 
                                'Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 
                                'Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator'];
        
        if (!systemComponents.some(comp => item.includes(comp)) || item.includes('Hand Actuator')) {
          if (!clearedEquipment.includes(item)) {
            clearedEquipment.push(item);
          }
          newSlots[i] = '-Empty-';
        }
      }
    }
    
    updateCriticalSlots(location, newSlots);
    
    // Clear equipment locations
    equipment.forEach((eq, index) => {
      if (eq.location === location && clearedEquipment.includes(eq.item_name)) {
        updateEquipmentLocation(index, '');
      }
    });
  };
  
  // Render location section
  const renderLocationSection = (location: typeof mechLocations[0], locationClass: string) => {
    const slots = criticalSlots[location.name] || [];
    
    return (
      <div key={location.name} className={`${styles.locationSection} ${styles[locationClass]}`}>
        <div className={styles.locationHeader}>
          <h4 className={styles.locationName}>{location.name}</h4>
          {!readOnly && (
            <button
              className={styles.clearButton}
              onClick={() => clearLocation(location.name)}
            >
              Clear
            </button>
          )}
        </div>
        <div className={styles.slotsList}>
          {slots.map((slot, index) => {
            // Multi-slot grouping logic
            let isStartOfGroup = false;
            let isEndOfGroup = false;
            let isMiddleOfGroup = false;
            
            if (slot !== '-Empty-') {
              const prevSlot = index > 0 ? slots[index - 1] : null;
              const nextSlot = index < slots.length - 1 ? slots[index + 1] : null;
              
              const hasSameEquipmentBefore = prevSlot === slot;
              const hasSameEquipmentAfter = nextSlot === slot;
              
              if (hasSameEquipmentBefore || hasSameEquipmentAfter) {
                isStartOfGroup = !hasSameEquipmentBefore && hasSameEquipmentAfter;
                isEndOfGroup = hasSameEquipmentBefore && !hasSameEquipmentAfter;
                isMiddleOfGroup = hasSameEquipmentBefore && hasSameEquipmentAfter;
              }
            }
            
            return (
              <CriticalSlotDropZone
                key={`${location.name}-${index}`}
                location={location.name}
                slotIndex={index}
                currentItem={slot}
                onDrop={handleDrop}
                onRemove={readOnly ? undefined : handleRemove}
                canAccept={(item) => canAcceptEquipment(item, location.name, index)}
                disabled={readOnly}
                isSystemComponent={false} // Simplified for now
                onSystemClick={() => {}}
                isStartOfGroup={isStartOfGroup}
                isMiddleOfGroup={isMiddleOfGroup}
                isEndOfGroup={isEndOfGroup}
                isHoveredMultiSlot={false}
                onHoverChange={() => {}}
              />
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Critical Slot Allocation</h2>
          <p className={styles.subtitle}>
            Drag equipment from the equipment panel to allocate to critical slots
          </p>
        </div>
        
        <div className={styles.mainGrid}>
          {/* Critical Slots Panel */}
          <div className={styles.criticalSlotsPanel}>
            <div className={styles.mechGrid}>
              <div className={styles.mechLayout}>
                {/* Head */}
                <div className={styles.headPosition}>
                  {renderLocationSection(mechLocations[0], 'head')}
                </div>
                
                {/* Left Arm */}
                <div className={styles.leftArmPosition}>
                  {renderLocationSection(mechLocations[1], 'arm')}
                </div>
                
                {/* Left Torso */}
                <div className={styles.leftTorsoPosition}>
                  {renderLocationSection(mechLocations[3], 'torso')}
                </div>
                
                {/* Center Torso */}
                <div className={styles.centerTorsoPosition}>
                  {renderLocationSection(mechLocations[4], 'centerTorso')}
                </div>
                
                {/* Right Torso */}
                <div className={styles.rightTorsoPosition}>
                  {renderLocationSection(mechLocations[5], 'torso')}
                </div>
                
                {/* Right Arm */}
                <div className={styles.rightArmPosition}>
                  {renderLocationSection(mechLocations[2], 'arm')}
                </div>
                
                {/* Left Leg */}
                <div className={styles.leftLegPosition}>
                  {renderLocationSection(mechLocations[6], 'leg')}
                </div>
                
                {/* Right Leg */}
                <div className={styles.rightLegPosition}>
                  {renderLocationSection(mechLocations[7], 'leg')}
                </div>
              </div>
            </div>
          </div>
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
    </DndProvider>
  );
}
