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
import { isFixedComponent, isConditionallyRemovable, isSpecialComponent } from '../../../types/systemComponents';
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
  const { state, updateCriticalSlots, updateEquipmentLocation, updateActuator } = useUnitData();
  const criticalAllocations = useCriticalAllocations();
  const equipment = useEquipment();
  const systemComponents = useSystemComponents();
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    location: string;
    slotIndex: number;
    itemName: string;
  } | null>(null);
  
  // Convert critical allocations to display format
  const criticalSlots = useMemo(() => {
    const slots: Record<string, string[]> = {};
    
    if (criticalAllocations) {
      Object.entries(criticalAllocations).forEach(([location, locationSlots]) => {
        slots[location] = locationSlots.map(slot => {
          if (!slot || !slot.content || slot.content === null || slot.content === undefined || slot.content === '') {
            return '-Empty-';
          }
          return normalizeEquipmentName(slot.content);
        });
      });
    }
    
    // Ensure all locations are initialized with proper empty strings
    mechLocations.forEach(loc => {
      if (!slots[loc.name]) {
        slots[loc.name] = Array(loc.slots).fill('-Empty-');
      } else {
        // Ensure any undefined/null slots are replaced with '-Empty-'
        slots[loc.name] = slots[loc.name].map(slot => 
          (!slot || slot === null || slot === undefined || slot === '') ? '-Empty-' : slot
        );
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
        
        // Special handling for structure and armor components
        let weight = stats?.weight || (typeof eq.tons === 'number' ? eq.tons : 0) || 1;
        let space = stats?.crits || (typeof eq.crits === 'number' ? eq.crits : 1) || 1;
        
        // Special components have 0 weight (calculated elsewhere) and 1 slot each
        if (isSpecialComponent(eq.item_name)) {
          weight = 0;
          space = 1;
        }
        
        unallocated.push({
          id: `${eq.item_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
          name: eq.item_name,
          type: eq.item_type === 'weapon' ? 'Weapon' : 'Equipment',
          tech_base: eq.tech_base || state.unit.tech_base,
          weight: weight,
          space: space,
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
    
    // Check if fixed component
    if (isFixedComponent(equipmentName)) {
      return; // Cannot remove fixed components
    }
    
    // Check if conditionally removable (actuators)
    if (isConditionallyRemovable(equipmentName)) {
      // Handle through context menu
      return;
    }
    
    // Special components and heat sinks are always single-slot items
    const isSingleSlot = isSpecialComponent(equipmentName) || equipmentName.includes('Heat Sink');
    
    let startIndex = slotIndex;
    let endIndex = slotIndex;
    
    // Only group non-special components
    if (!isSingleSlot) {
      // Find all slots with this equipment
      while (startIndex > 0 && criticalSlots[location][startIndex - 1] === equipmentName) {
        startIndex--;
      }
      
      while (endIndex < criticalSlots[location].length - 1 && criticalSlots[location][endIndex + 1] === equipmentName) {
        endIndex++;
      }
    }
    
    // Clear slots
    const newSlots = [...criticalSlots[location]];
    for (let i = startIndex; i <= endIndex; i++) {
      newSlots[i] = '-Empty-';
    }
    
    updateCriticalSlots(location, newSlots);
    
    // For single-slot items, only clear this specific instance
    if (isSingleSlot) {
      // Find the first matching equipment at this location that hasn't been cleared yet
      const equipmentIndex = equipment.findIndex(eq => 
        eq.item_name === equipmentName && eq.location === location
      );
      
      if (equipmentIndex !== -1) {
        updateEquipmentLocation(equipmentIndex, '');
      }
    } else {
      // For multi-slot items, clear the equipment location
      const equipmentIndex = equipment.findIndex(eq => 
        eq.item_name === equipmentName && eq.location === location
      );
      
      if (equipmentIndex !== -1) {
        updateEquipmentLocation(equipmentIndex, '');
      }
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
    
    // Clear non-fixed equipment
    for (let i = 0; i < newSlots.length; i++) {
      const item = newSlots[i];
      if (item !== '-Empty-' && !isFixedComponent(item)) {
        // Can remove Hand Actuator or any non-system equipment
        if (!clearedEquipment.includes(item)) {
          clearedEquipment.push(item);
        }
        newSlots[i] = '-Empty-';
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
  
  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, location: string, slotIndex: number, itemName: string) => {
    e.preventDefault();
    
    if (isConditionallyRemovable(itemName)) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        location,
        slotIndex,
        itemName
      });
    }
  };
  
  // Handle actuator action
  const handleActuatorAction = (action: 'add' | 'remove') => {
    if (!contextMenu) return;
    
    const { location, itemName } = contextMenu;
    
    if (itemName === 'Lower Arm Actuator' || itemName === 'Hand Actuator') {
      updateActuator(location, itemName as any, action);
    }
    
    setContextMenu(null);
  };
  
  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);
  
  // Get slot style class
  const getSlotStyleClass = (itemName: string) => {
    if (itemName === '-Empty-') return '';
    
    if (isFixedComponent(itemName)) {
      return styles.fixedComponent;
    }
    
    if (isConditionallyRemovable(itemName)) {
      return styles.removableComponent;
    }
    
    if (isSpecialComponent(itemName)) {
      return styles.specialComponent;
    }
    
    if (itemName.includes('Heat Sink')) {
      return styles.heatSinkComponent;
    }
    
    return styles.equipmentComponent;
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
            // Multi-slot grouping logic - but NOT for special components or empty slots
            let isStartOfGroup = false;
            let isEndOfGroup = false;
            let isMiddleOfGroup = false;
            
            // Empty slots, special components, and heat sinks should never be grouped
            const isEmpty = slot === '-Empty-' || slot === '' || !slot;
            const isSpecial = isSpecialComponent(slot);
            
            if (!isEmpty && !isSpecial && !slot.includes('Heat Sink')) {
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
              <div
                key={`${location.name}-${index}`}
                onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, location.name, index, slot)}
                className={getSlotStyleClass(slot)}
              >
                <CriticalSlotDropZone
                  location={location.name}
                  slotIndex={index}
                  currentItem={slot}
                  onDrop={handleDrop}
                  onRemove={readOnly ? undefined : handleRemove}
                  canAccept={(item) => canAcceptEquipment(item, location.name, index)}
                  disabled={readOnly || (isFixedComponent(slot) || isConditionallyRemovable(slot))}
                  isSystemComponent={isFixedComponent(slot) || isConditionallyRemovable(slot)}
                  onSystemClick={() => {}}
                  isStartOfGroup={isStartOfGroup}
                  isMiddleOfGroup={isMiddleOfGroup}
                  isEndOfGroup={isEndOfGroup}
                  isHoveredMultiSlot={false}
                  onHoverChange={() => {}}
                />
              </div>
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
        
        {/* Context Menu */}
        {contextMenu && (
          <div
            className={styles.contextMenu}
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 1000
            }}
          >
            <div className={styles.contextMenuContent}>
              <h4>{contextMenu.itemName}</h4>
              {contextMenu.itemName === 'Hand Actuator' && (
                <>
                  <button onClick={() => handleActuatorAction('remove')}>
                    Remove Hand Actuator
                  </button>
                </>
              )}
              {contextMenu.itemName === 'Lower Arm Actuator' && (
                <>
                  <button onClick={() => handleActuatorAction('remove')}>
                    Remove Lower Arm Actuator
                  </button>
                  <p className={styles.warning}>
                    This will also remove the Hand Actuator
                  </p>
                </>
              )}
              {contextMenu.itemName === '-Empty-' && 
               (contextMenu.location === 'Left Arm' || contextMenu.location === 'Right Arm') && (
                <>
                  <button onClick={() => {
                    updateActuator(contextMenu.location, 'Lower Arm Actuator', 'add');
                    setContextMenu(null);
                  }}>
                    Add Lower Arm Actuator
                  </button>
                  <button onClick={() => {
                    updateActuator(contextMenu.location, 'Hand Actuator', 'add');
                    setContextMenu(null);
                  }}>
                    Add Hand Actuator
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}
