/**
 * Enhanced Criticals Tab Component
 * Combines working system change logic with full drag & drop UI
 * Uses display adapter pattern for clean data model separation
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  useUnitData,
  useEquipment,
  useSystemComponents
} from '../../../hooks/useUnitData';
import { MECH_LOCATIONS } from '../../../types/editor';
import { calculateCompleteInternalStructure, handleSystemChange } from '../../../utils/criticalSlotCalculations';
import CriticalSlotDropZone from '../criticals/CriticalSlotDropZone';
import DraggableEquipmentItem from '../equipment/DraggableEquipmentItem';
import { FullEquipment } from '../../../types';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';
import { isFixedComponent, isConditionallyRemovable } from '../../../types/systemComponents';
import { 
  CriticalSlotObject, 
  EquipmentObject, 
  SlotType, 
  EquipmentType, 
  EquipmentCategory 
} from '../../../types/criticalSlots';
import styles from './CriticalsTab.module.css';

interface CriticalsTabProps {
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

// Helper to determine equipment type
const getEquipmentType = (itemName: string, itemType?: string): EquipmentType => {
  const lowerName = itemName.toLowerCase();
  
  // System components
  if (lowerName.includes('engine')) return EquipmentType.ENGINE;
  if (lowerName.includes('gyro')) return EquipmentType.GYRO;
  if (lowerName.includes('cockpit')) return EquipmentType.COCKPIT;
  if (lowerName.includes('life support')) return EquipmentType.LIFE_SUPPORT;
  if (lowerName.includes('sensors')) return EquipmentType.SENSORS;
  if (lowerName.includes('actuator')) return EquipmentType.ACTUATOR;
  
  // Structure & Armor
  if (lowerName.includes('endo steel') || lowerName.includes('endo-steel')) return EquipmentType.ENDO_STEEL;
  if (lowerName.includes('ferro-fibrous') || lowerName.includes('ferro fibrous')) return EquipmentType.FERRO_FIBROUS;
  
  // Heat Management
  if (lowerName.includes('heat sink')) return EquipmentType.HEAT_SINK;
  
  // Weapons
  if (itemType === 'weapon') {
    if (lowerName.includes('laser') || lowerName.includes('ppc')) return EquipmentType.ENERGY;
    if (lowerName.includes('missile') || lowerName.includes('lrm') || lowerName.includes('srm')) return EquipmentType.MISSILE;
    if (lowerName.includes('ac/') || lowerName.includes('autocannon') || lowerName.includes('gauss')) return EquipmentType.BALLISTIC;
    return EquipmentType.PHYSICAL;
  }
  
  // Ammo
  if (itemType === 'ammo' || lowerName.includes('ammo')) return EquipmentType.AMMO;
  
  // Default to equipment
  return EquipmentType.EQUIPMENT;
};

// Helper to determine equipment category
const getEquipmentCategory = (equipmentType: EquipmentType): EquipmentCategory => {
  switch (equipmentType) {
    case EquipmentType.ENGINE:
    case EquipmentType.GYRO:
    case EquipmentType.COCKPIT:
    case EquipmentType.LIFE_SUPPORT:
    case EquipmentType.SENSORS:
    case EquipmentType.ACTUATOR:
      return EquipmentCategory.SYSTEM;
    
    case EquipmentType.BALLISTIC:
    case EquipmentType.ENERGY:
    case EquipmentType.MISSILE:
    case EquipmentType.PHYSICAL:
      return EquipmentCategory.WEAPON;
    
    case EquipmentType.AMMO:
      return EquipmentCategory.AMMO;
    
    case EquipmentType.ENDO_STEEL:
    case EquipmentType.FERRO_FIBROUS:
      return EquipmentCategory.SPECIAL;
    
    default:
      return EquipmentCategory.EQUIPMENT;
  }
};

export default function CriticalsTab({ readOnly = false }: CriticalsTabProps) {
  const { state, setUnit, updateCriticalSlots, updateEquipmentLocation } = useUnitData();
  const equipment = useEquipment();
  const systemComponents = useSystemComponents();
  
  // Track previous system component values
  const prevEngineType = useRef(systemComponents?.engine?.type);
  const prevGyroType = useRef(systemComponents?.gyro?.type);
  
  // State for tracking multi-slot hover
  const [hoveredSlot, setHoveredSlot] = useState<{ location: string; index: number } | null>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<EquipmentObject | null>(null);
  
  // Get unit from state
  const unit = state.unit;
  
  // Calculate internal structure
  const internalStructure = useMemo(() => calculateCompleteInternalStructure(unit), [unit]);
  
  // Watch for system component changes - just update refs, don't modify unit
  useEffect(() => {
    if (!systemComponents) return;
    
    const engineChanged = prevEngineType.current !== systemComponents.engine?.type;
    const gyroChanged = prevGyroType.current !== systemComponents?.gyro?.type;
    
    if (engineChanged || gyroChanged) {
      console.log('System component changed:', {
        engine: systemComponents.engine?.type,
        prevEngine: prevEngineType.current,
        gyro: systemComponents?.gyro?.type,
        prevGyro: prevGyroType.current
      });
      
      // Just update refs - the reducer has already handled the critical slot updates
      prevEngineType.current = systemComponents.engine?.type;
      prevGyroType.current = systemComponents?.gyro?.type;
    }
  }, [systemComponents?.engine?.type, systemComponents?.gyro?.type]);
  
  // Convert string array to CriticalSlotObject for display
  const convertToSlotObject = (
    name: string | null, 
    location: string, 
    slotIndex: number,
    isInternal: boolean
  ): CriticalSlotObject => {
    if (!name || name === '- Empty -') {
      return {
        slotIndex,
        location,
        equipment: null,
        isPartOfMultiSlot: false,
        slotType: SlotType.NORMAL
      };
    }
    
    const equipmentType = getEquipmentType(name);
    const category = getEquipmentCategory(equipmentType);
    const stats = EQUIPMENT_DATABASE.find(e => e.name === name);
    
    const equipmentData: EquipmentObject = {
      id: `${name}-${location}-${slotIndex}`,
      name,
      type: equipmentType,
      category,
      requiredSlots: stats?.crits || 1,
      weight: stats?.weight || 0,
      isFixed: isInternal || isFixedComponent(name),
      isRemovable: !isInternal && (!isFixedComponent(name) || isConditionallyRemovable(name)),
      techBase: (unit.tech_base || 'Inner Sphere') as 'Inner Sphere' | 'Clan' | 'Both'
    };
    
    return {
      slotIndex,
      location,
      equipment: {
        equipmentId: equipmentData.id,
        equipmentData,
        allocatedSlots: equipmentData.requiredSlots,
        startSlotIndex: slotIndex,
        endSlotIndex: slotIndex
      },
      isPartOfMultiSlot: false,
      slotType: SlotType.NORMAL
    };
  };
  
  // Get merged slots for display
  const getMergedSlots = (location: string): CriticalSlotObject[] => {
    const internal = internalStructure[location] || [];
    const equipment = (unit.criticalSlots as any)?.[location] || [];
    const totalSlots = mechLocations.find(l => l.name === location)?.slots || 12;
    const slots: CriticalSlotObject[] = [];
    
    // Debug log to see what's in critical slots
    if (location === MECH_LOCATIONS.CENTER_TORSO) {
      console.log('Center Torso equipment array:', equipment);
      console.log('Center Torso internal structure:', internal);
    }
    
    // Add internal structure
    internal.forEach((name, idx) => {
      slots.push(convertToSlotObject(name, location, idx, true));
    });
    
    // Add equipment
    equipment.forEach((name: string | null, idx: number) => {
      const displayIdx = internal.length + idx;
      if (displayIdx < totalSlots) {
        slots.push(convertToSlotObject(name, location, displayIdx, false));
      }
    });
    
    // Fill remaining empty slots
    for (let i = slots.length; i < totalSlots; i++) {
      slots.push(convertToSlotObject(null, location, i, false));
    }
    
    // Mark multi-slot equipment
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.equipment && !slot.isPartOfMultiSlot) {
        const requiredSlots = slot.equipment.equipmentData.requiredSlots;
        if (requiredSlots > 1) {
          const groupId = `${slot.equipment.equipmentData.name}-${location}-${i}`;
          let consecutiveCount = 1;
          
          // Check consecutive slots with same equipment
          for (let j = i + 1; j < slots.length && j < i + requiredSlots; j++) {
            if (slots[j].equipment?.equipmentData.name === slot.equipment.equipmentData.name) {
              consecutiveCount++;
            } else {
              break;
            }
          }
          
          // Mark all slots as part of multi-slot
          if (consecutiveCount > 1) {
            for (let j = 0; j < consecutiveCount; j++) {
              slots[i + j].isPartOfMultiSlot = true;
              slots[i + j].multiSlotGroupId = groupId;
              slots[i + j].multiSlotIndex = j;
              if (slots[i + j].equipment) {
                slots[i + j].equipment!.startSlotIndex = i;
                slots[i + j].equipment!.endSlotIndex = i + consecutiveCount - 1;
              }
            }
            i += consecutiveCount - 1; // Skip processed slots
          }
        }
      }
    }
    
    return slots;
  };
  
  // Handle equipment drop
  const handleDrop = (equipmentObj: EquipmentObject, location: string, slotIndex: number) => {
    if (readOnly) return;
    
    // Calculate actual equipment array index
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
    const mechLocation = mechLocations.find(l => l.name === location);
    const maxEquipmentSlots = (mechLocation?.slots || 12) - internalSlotsCount;
    while (newCriticalSlots[location].length < maxEquipmentSlots) {
      newCriticalSlots[location].push(null);
    }
    
    // Check if we have space for multi-slot equipment
    if (equipmentArrayIndex + equipmentObj.requiredSlots > maxEquipmentSlots) {
      alert(`Not enough slots! ${equipmentObj.name} requires ${equipmentObj.requiredSlots} slots.`);
      return;
    }
    
    // Check all slots are empty
    for (let i = 0; i < equipmentObj.requiredSlots; i++) {
      if (newCriticalSlots[location][equipmentArrayIndex + i]) {
        alert(`Cannot place equipment - slot ${slotIndex + i + 1} is occupied.`);
        return;
      }
    }
    
    // Place equipment
    for (let i = 0; i < equipmentObj.requiredSlots; i++) {
      newCriticalSlots[location][equipmentArrayIndex + i] = equipmentObj.name;
    }
    
    const updatedUnit = {
      ...unit,
      criticalSlots: newCriticalSlots
    };
    
    setUnit(updatedUnit);
    
    // Update equipment location in database
    const equipmentIndex = equipment.findIndex((eq: any) => eq.item_name === equipmentObj.name);
    if (equipmentIndex !== -1) {
      updateEquipmentLocation(equipmentIndex, location);
    }
  };
  
  // Handle equipment removal
  const handleRemove = (location: string, slotIndex: number) => {
    if (readOnly) return;
    
    // Calculate actual equipment array index
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
    
    // Clear equipment location in database
    const equipmentIndex = equipment.findIndex(eq => eq.item_name === equipmentName && eq.location === location);
    if (equipmentIndex !== -1) {
      updateEquipmentLocation(equipmentIndex, '');
    }
  };
  
  // Handle equipment move
  const handleMove = (fromLocation: string, fromIndex: number, toLocation: string, toIndex: number) => {
    if (readOnly) return;
    
    // Get the slots for both locations
    const fromSlots = getMergedSlots(fromLocation);
    const toSlots = getMergedSlots(toLocation);
    
    // Get the equipment being moved
    const fromSlot = fromSlots[fromIndex];
    if (!fromSlot.equipment) return;
    
    const equipment = fromSlot.equipment.equipmentData;
    
    // Remove from source
    handleRemove(fromLocation, fromIndex);
    
    // Add to target
    handleDrop(equipment, toLocation, toIndex);
  };
  
  // Clear location
  const clearLocation = (location: string) => {
    if (readOnly) return;
    
    const newCriticalSlots: any = { ...unit.criticalSlots };
    if (newCriticalSlots[location]) {
      // Clear all equipment (not internal structure)
      for (let i = 0; i < newCriticalSlots[location].length; i++) {
        const equipmentName = newCriticalSlots[location][i];
        if (equipmentName && !isFixedComponent(equipmentName)) {
          newCriticalSlots[location][i] = null;
          
          // Clear equipment location in database
          const equipmentIndex = equipment.findIndex(eq => eq.item_name === equipmentName && eq.location === location);
          if (equipmentIndex !== -1) {
            updateEquipmentLocation(equipmentIndex, '');
          }
        }
      }
    }
    
    const updatedUnit = {
      ...unit,
      criticalSlots: newCriticalSlots
    };
    
    setUnit(updatedUnit);
  };
  
  // Check if can accept equipment
  const canAccept = (equipment: EquipmentObject) => {
    // Basic validation - in real app would check more constraints
    return true;
  };
  
  // Handle hover change
  const handleHoverChange = (isHovering: boolean, equipment: EquipmentObject | null) => {
    if (isHovering && equipment) {
      setHoveredEquipment(equipment);
    } else {
      setHoveredEquipment(null);
      setHoveredSlot(null);
    }
  };
  
  // Calculate which slots should be highlighted for multi-slot preview
  const getMultiSlotPreview = (location: string, hoverIndex: number): number[] => {
    if (!hoveredEquipment) return [];
    
    const requiredSlots = hoveredEquipment.requiredSlots;
    const locationSlots = getMergedSlots(location);
    const previewSlots: number[] = [];
    
    // Check if we can place at this position
    let canPlace = true;
    if (hoverIndex + requiredSlots > locationSlots.length) {
      canPlace = false;
    } else {
      for (let i = 0; i < requiredSlots; i++) {
        const slot = locationSlots[hoverIndex + i];
        if (slot.equipment !== null) {
          canPlace = false;
          break;
        }
      }
    }
    
    if (canPlace) {
      for (let i = 0; i < requiredSlots; i++) {
        previewSlots.push(hoverIndex + i);
      }
    }
    
    return previewSlots;
  };
  
  // Get unallocated equipment
  const unallocatedEquipment = useMemo(() => {
    const unallocated: FullEquipment[] = [];
    
    // Debug: Log what equipment we have
    console.log('All equipment:', equipment);
    console.log('Critical slots:', unit.criticalSlots);
    
    // Collect all equipment names that are actually in critical slots
    const allocatedInSlots = new Set<string>();
    Object.values(unit.criticalSlots || {}).forEach((slots: any) => {
      if (Array.isArray(slots)) {
        slots.forEach((slot: string | null) => {
          if (slot && slot !== '- Empty -') {
            allocatedInSlots.add(slot);
          }
        });
      }
    });
    
    console.log('Equipment allocated in slots:', Array.from(allocatedInSlots));
    
    // Find equipment that's not in critical slots (regardless of location field)
    equipment.forEach((eq, index) => {
      // Check if this equipment is actually placed in any critical slot
      const isInCriticalSlots = allocatedInSlots.has(eq.item_name);
      
      if (!isInCriticalSlots) {
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
    
    console.log('Unallocated equipment:', unallocated);
    
    return unallocated;
  }, [equipment, unit.criticalSlots, unit.tech_base]);
  
  // Calculate slot statistics
  const slotStatistics = useMemo(() => {
    let totalSlots = 0;
    let usedSlots = 0;
    
    mechLocations.forEach(location => {
      const slots = getMergedSlots(location.name);
      totalSlots += slots.length;
      slots.forEach(slot => {
        if (slot.equipment !== null) {
          usedSlots++;
        }
      });
    });
    
    return {
      total: totalSlots,
      used: usedSlots,
      available: totalSlots - usedSlots
    };
  }, [unit.criticalSlots, internalStructure]);
  
  // Render location section
  const renderLocationSection = (location: typeof mechLocations[0], locationClass: string) => {
    const slots = getMergedSlots(location.name);
    
    return (
      <div key={location.name} className={`${styles.locationSection} ${styles[locationClass]}`}>
        <div className={styles.locationHeader}>
          <h4 className={styles.locationName}>{location.name}</h4>
          {!readOnly && (
            <button
              className={styles.clearButton}
              onClick={() => clearLocation(location.name)}
              title="Clear non-fixed equipment from this location"
            >
              Clear
            </button>
          )}
        </div>
        <div className={styles.slotsList}>
          {slots.map((slot, index) => {
            const multiSlotPreview = hoveredSlot?.location === location.name && 
                                   hoveredSlot?.index === index ? 
                                   getMultiSlotPreview(location.name, index) : [];
            const isPartOfPreview = multiSlotPreview.includes(index);
            
            return (
              <CriticalSlotDropZone
                key={`${location.name}-${index}`}
                location={location.name}
                slotIndex={index}
                slot={slot}
                onDrop={handleDrop}
                onRemove={handleRemove}
                onMove={handleMove}
                canAccept={canAccept}
                disabled={readOnly || (slot.equipment?.equipmentData.isFixed && !slot.equipment?.equipmentData.isRemovable) || false}
                isHoveredMultiSlot={isPartOfPreview}
                onHoverChange={(isHovering, equipment) => {
                  if (isHovering) {
                    setHoveredSlot({ location: location.name, index });
                  }
                  handleHoverChange(isHovering, equipment);
                }}
                criticalSlots={slots}
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
          <div className={styles.stats}>
            <span>Total Slots: {slotStatistics.total}</span>
            <span>Used: {slotStatistics.used}</span>
            <span>Available: {slotStatistics.available}</span>
          </div>
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
                
                {/* Arms */}
                <div className={styles.leftArmPosition}>
                  {renderLocationSection(mechLocations[1], 'arm')}
                </div>
                <div className={styles.rightArmPosition}>
                  {renderLocationSection(mechLocations[2], 'arm')}
                </div>
                
                {/* Torsos */}
                <div className={styles.leftTorsoPosition}>
                  {renderLocationSection(mechLocations[3], 'torso')}
                </div>
                <div className={styles.centerTorsoPosition}>
                  {renderLocationSection(mechLocations[4], 'centerTorso')}
                </div>
                <div className={styles.rightTorsoPosition}>
                  {renderLocationSection(mechLocations[5], 'torso')}
                </div>
                
                {/* Legs */}
                <div className={styles.leftLegPosition}>
                  {renderLocationSection(mechLocations[6], 'leg')}
                </div>
                <div className={styles.rightLegPosition}>
                  {renderLocationSection(mechLocations[7], 'leg')}
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
      </div>
    </DndProvider>
  );
}
