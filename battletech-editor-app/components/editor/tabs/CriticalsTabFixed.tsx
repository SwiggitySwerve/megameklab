/**
 * Fixed Criticals Tab Component 
 * Uses local state management to prevent equipment disappearing
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { FullEquipment } from '../../../types';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';
import { isFixedComponent, isConditionallyRemovable, isSpecialComponent } from '../../../types/systemComponents';
import { 
  CriticalSlotObject, 
  EquipmentObject, 
  SlotType, 
  EquipmentType, 
  EquipmentCategory,
  CriticalAllocationMap 
} from '../../../types/criticalSlots';
import styles from './CriticalsTab.module.css';

interface CriticalsTabFixedProps {
  readOnly?: boolean;
}

// Equipment tracking interface
interface EquipmentAllocation {
  equipmentIndex: number;
  equipmentName: string;
  location: string;
  slotIndices: number[];
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

export default function CriticalsTabFixed({ readOnly = false }: CriticalsTabFixedProps) {
  const { state, updateCriticalSlots, updateEquipmentLocation } = useUnitData();
  const criticalAllocationsFromParent = useCriticalAllocations();
  const equipment = useEquipment();
  
  // State for tracking multi-slot hover
  const [hoveredSlot, setHoveredSlot] = useState<{ location: string; index: number } | null>(null);
  const [hoveredEquipment, setHoveredEquipment] = useState<EquipmentObject | null>(null);
  
  // Track equipment allocations
  const [equipmentAllocations, setEquipmentAllocations] = useState<EquipmentAllocation[]>([]);
  
  // Use a ref to track if we've initialized
  const hasInitialized = useRef(false);
  
  // Batch update flag to prevent circular updates
  const isBatchUpdating = useRef(false);
  
  // Convert critical allocations to object-based format
  const [criticalSlots, setCriticalSlots] = useState<CriticalAllocationMap>(() => {
    const slots: CriticalAllocationMap = {};
    
    mechLocations.forEach(loc => {
      slots[loc.name] = Array(loc.slots).fill(null).map((_, index) => ({
        slotIndex: index,
        location: loc.name,
        equipment: null,
        isPartOfMultiSlot: false,
        slotType: SlotType.NORMAL
      }));
    });
    
    return slots;
  });
  
  // Initialize slots from critical allocations (ONLY ONCE)
  useEffect(() => {
    if (!hasInitialized.current && criticalAllocationsFromParent) {
      const newSlots: CriticalAllocationMap = {};
      const allocations: EquipmentAllocation[] = [];
      
      Object.entries(criticalAllocationsFromParent).forEach(([location, locationSlots]) => {
        const mechLocation = mechLocations.find(loc => loc.name === location);
        if (!mechLocation) return;
        
        newSlots[location] = Array(mechLocation.slots).fill(null).map((_, index) => {
          const slot = locationSlots[index];
          
          // Handle different slot formats
          if (!slot || !slot.name || slot.name === '-Empty-' || slot.type === 'empty') {
            return {
              slotIndex: index,
              location,
              equipment: null,
              isPartOfMultiSlot: false,
              slotType: SlotType.NORMAL
            };
          }
          
          const normalizedName = normalizeEquipmentName(slot.name);
          const equipmentType = getEquipmentType(normalizedName, 'equipment');
          const category = getEquipmentCategory(equipmentType);
          
          // Find actual equipment data
          const equipmentItem = equipment.find(eq => eq.item_name === normalizedName && eq.location === location);
          const stats = EQUIPMENT_DATABASE.find(e => e.name === normalizedName);
          
          // Create equipment object
          const equipmentData: EquipmentObject = {
            id: `${normalizedName}-${location}-${index}`,
            name: normalizedName,
            type: equipmentType,
            category,
            requiredSlots: stats?.crits || 1,
            weight: typeof stats?.weight === 'number' ? stats.weight : 
                   typeof equipmentItem?.tons === 'number' ? equipmentItem.tons : 0,
            isFixed: slot.isFixed || (isFixedComponent(normalizedName) && !isConditionallyRemovable(normalizedName)),
            isRemovable: !slot.isFixed || isConditionallyRemovable(normalizedName),
            techBase: (equipmentItem?.tech_base || state.unit.tech_base || 'Inner Sphere') as 'Inner Sphere' | 'Clan' | 'Both'
          };
          
          return {
            slotIndex: index,
            location,
            equipment: {
              equipmentId: equipmentData.id,
              equipmentData,
              allocatedSlots: equipmentData.requiredSlots,
              startSlotIndex: index,
              endSlotIndex: index
            },
            isPartOfMultiSlot: false,
            slotType: SlotType.NORMAL
          };
        });
      });
      
      // Initialize empty locations
      mechLocations.forEach(loc => {
        if (!newSlots[loc.name]) {
          newSlots[loc.name] = Array(loc.slots).fill(null).map((_, index) => ({
            slotIndex: index,
            location: loc.name,
            equipment: null,
            isPartOfMultiSlot: false,
            slotType: SlotType.NORMAL
          }));
        }
      });
      
      // Post-process to identify multi-slot equipment and track allocations
      Object.values(newSlots).forEach(locationSlots => {
        locationSlots.forEach((slot, index) => {
          if (slot.equipment && slot.equipment.equipmentData.requiredSlots > 1) {
            const equipmentName = slot.equipment.equipmentData.name;
            const groupId = `${equipmentName}-${slot.location}-${index}`;
            
            // Find equipment index
            const eqIndex = equipment.findIndex(eq => 
              eq.item_name === equipmentName && eq.location === slot.location
            );
            
            if (eqIndex !== -1) {
              const slotIndices: number[] = [];
              
              // Mark consecutive slots as multi-slot
              for (let i = 0; i < slot.equipment.equipmentData.requiredSlots && index + i < locationSlots.length; i++) {
                const targetSlot = locationSlots[index + i];
                if (targetSlot.equipment?.equipmentData.name === equipmentName) {
                  targetSlot.isPartOfMultiSlot = true;
                  targetSlot.multiSlotGroupId = groupId;
                  targetSlot.multiSlotIndex = i;
                  targetSlot.equipment.startSlotIndex = index;
                  targetSlot.equipment.endSlotIndex = index + slot.equipment.equipmentData.requiredSlots - 1;
                  slotIndices.push(index + i);
                }
              }
              
              // Track allocation
              allocations.push({
                equipmentIndex: eqIndex,
                equipmentName,
                location: slot.location,
                slotIndices
              });
            }
          }
        });
      });
      
      setCriticalSlots(newSlots);
      setEquipmentAllocations(allocations);
      hasInitialized.current = true;
    }
  }, []); // Empty dependencies - only run once
  
  // Get unallocated equipment
  const unallocatedEquipment = useMemo(() => {
    const unallocated: FullEquipment[] = [];
    const allocatedIndices = new Set(equipmentAllocations.map(a => a.equipmentIndex));
    
    equipment.forEach((eq, index) => {
      // Skip if equipment is allocated (tracked in our allocations)
      if (allocatedIndices.has(index)) return;
      
      const stats = EQUIPMENT_DATABASE.find(e => e.name === eq.item_name);
      
      let weight = stats?.weight || (typeof eq.tons === 'number' ? eq.tons : 0) || 1;
      let space = stats?.crits || (typeof eq.crits === 'number' ? eq.crits : 1) || 1;
      
      if (isSpecialComponent(eq.item_name) && !eq.item_name.includes('Heat Sink')) {
        weight = 0;
        space = 1;
      }
      
      unallocated.push({
        id: `unallocated-${index}`,
        name: eq.item_name,
        type: eq.item_type === 'weapon' ? 'Weapon' : 'Equipment',
        tech_base: eq.tech_base || state.unit.tech_base,
        weight: weight,
        space: space,
        damage: stats && 'damage' in stats ? 
          (typeof stats.damage === 'number' ? stats.damage.toString() : stats.damage) : 
          undefined,
        heat: stats && 'heat' in stats && stats.heat > 0 ? stats.heat : undefined
      });
    });
    
    return unallocated;
  }, [equipment, equipmentAllocations, state.unit.tech_base]);
  
  // Batch update to parent
  const batchUpdateToParent = () => {
    if (isBatchUpdating.current || readOnly) return;
    
    isBatchUpdating.current = true;
    
    // Update all locations
    mechLocations.forEach(location => {
      const slots = criticalSlots[location.name] || [];
      const slotsForUpdate = slots.map(slot => 
        slot.equipment ? slot.equipment.equipmentData.name : '-Empty-'
      );
      updateCriticalSlots(location.name, slotsForUpdate);
    });
    
    // Update equipment locations
    equipment.forEach((_, index) => {
      const allocation = equipmentAllocations.find(a => a.equipmentIndex === index);
      if (allocation) {
        updateEquipmentLocation(index, allocation.location);
      } else {
        updateEquipmentLocation(index, '');
      }
    });
    
    setTimeout(() => {
      isBatchUpdating.current = false;
    }, 100);
  };
  
  // Handle equipment drop
  const handleDrop = (equipment: EquipmentObject, location: string, slotIndex: number) => {
    if (readOnly) return;
    
    const requiredSlots = equipment.requiredSlots;
    const locationSlots = criticalSlots[location];
    
    // Check if we have enough consecutive empty slots
    if (slotIndex + requiredSlots > locationSlots.length) {
      alert(`Not enough slots! ${equipment.name} requires ${requiredSlots} slots.`);
      return;
    }
    
    // Check all slots are empty
    for (let i = 0; i < requiredSlots; i++) {
      if (locationSlots[slotIndex + i].equipment !== null) {
        alert(`Cannot place equipment - slot ${slotIndex + i + 1} is occupied.`);
        return;
      }
    }
    
    // Find the equipment index
    const equipmentIndex = parseInt(equipment.id.split('-').pop() || '-1');
    if (equipmentIndex === -1) return;
    
    // Place the equipment
    const newSlots = { ...criticalSlots };
    const groupId = `${equipment.id}-${Date.now()}`;
    const slotIndices: number[] = [];
    
    for (let i = 0; i < requiredSlots; i++) {
      const idx = slotIndex + i;
      slotIndices.push(idx);
      newSlots[location][idx] = {
        ...newSlots[location][idx],
        equipment: {
          equipmentId: equipment.id,
          equipmentData: equipment,
          allocatedSlots: requiredSlots,
          startSlotIndex: slotIndex,
          endSlotIndex: slotIndex + requiredSlots - 1
        },
        isPartOfMultiSlot: requiredSlots > 1,
        multiSlotGroupId: groupId,
        multiSlotIndex: i
      };
    }
    
    setCriticalSlots(newSlots);
    
    // Update allocations
    setEquipmentAllocations(prev => [...prev, {
      equipmentIndex,
      equipmentName: equipment.name,
      location,
      slotIndices
    }]);
    
    // Batch update to parent
    batchUpdateToParent();
  };
  
  // Handle equipment removal
  const handleRemove = (location: string, slotIndex: number) => {
    if (readOnly) return;
    
    const slot = criticalSlots[location][slotIndex];
    if (!slot.equipment) return;
    
    const equipment = slot.equipment.equipmentData;
    
    // Check if fixed component
    if (equipment.isFixed && !equipment.isRemovable) {
      return; // Cannot remove fixed components
    }
    
    // Find the allocation
    const allocationIndex = equipmentAllocations.findIndex(a => 
      a.location === location && a.slotIndices.includes(slotIndex)
    );
    
    if (allocationIndex === -1) return;
    
    // Remove all slots for multi-slot equipment
    const newSlots = { ...criticalSlots };
    
    if (slot.isPartOfMultiSlot && slot.multiSlotGroupId) {
      // Clear all slots with the same group ID
      newSlots[location].forEach((s, idx) => {
        if (s.multiSlotGroupId === slot.multiSlotGroupId) {
          newSlots[location][idx] = {
            ...s,
            equipment: null,
            isPartOfMultiSlot: false,
            multiSlotGroupId: undefined,
            multiSlotIndex: undefined
          };
        }
      });
    } else {
      // Single slot equipment
      newSlots[location][slotIndex] = {
        ...slot,
        equipment: null
      };
    }
    
    setCriticalSlots(newSlots);
    
    // Update allocations
    setEquipmentAllocations(prev => prev.filter((_, idx) => idx !== allocationIndex));
    
    // Batch update to parent
    batchUpdateToParent();
  };
  
  // Handle equipment move
  const handleMove = (fromLocation: string, fromIndex: number, toLocation: string, toIndex: number) => {
    if (readOnly) return;
    
    // Get the equipment from the source slot
    const sourceSlot = criticalSlots[fromLocation][fromIndex];
    if (!sourceSlot.equipment) return;
    
    const equipment = sourceSlot.equipment.equipmentData;
    const requiredSlots = equipment.requiredSlots;
    
    // Check if we can place at the target
    const targetSlots = criticalSlots[toLocation];
    if (toIndex + requiredSlots > targetSlots.length) {
      alert(`Not enough slots at target location.`);
      return;
    }
    
    // Check target slots are empty (excluding source slots if same location)
    for (let i = 0; i < requiredSlots; i++) {
      const checkIndex = toIndex + i;
      if (targetSlots[checkIndex].equipment !== null) {
        // Allow if this is the source slot we're moving from
        if (fromLocation === toLocation && 
            checkIndex >= fromIndex && 
            checkIndex < fromIndex + requiredSlots) {
          continue;
        }
        alert(`Cannot move equipment - target slot ${checkIndex + 1} is occupied.`);
        return;
      }
    }
    
    // Find the allocation
    const allocationIndex = equipmentAllocations.findIndex(a => 
      a.location === fromLocation && a.slotIndices.includes(fromIndex)
    );
    
    if (allocationIndex === -1) return;
    
    const allocation = equipmentAllocations[allocationIndex];
    
    // Create new slots state
    const newSlots = { ...criticalSlots };
    
    // Clear source slots
    if (sourceSlot.isPartOfMultiSlot && sourceSlot.multiSlotGroupId) {
      // Clear all slots for multi-slot equipment
      newSlots[fromLocation].forEach((s, idx) => {
        if (s.multiSlotGroupId === sourceSlot.multiSlotGroupId) {
          newSlots[fromLocation][idx] = {
            ...s,
            equipment: null,
            isPartOfMultiSlot: false,
            multiSlotGroupId: undefined,
            multiSlotIndex: undefined
          };
        }
      });
    } else {
      // Clear single slot
      newSlots[fromLocation][fromIndex] = {
        ...newSlots[fromLocation][fromIndex],
        equipment: null
      };
    }
    
    // Place at target
    const groupId = `${equipment.id}-${Date.now()}`;
    const newSlotIndices: number[] = [];
    
    for (let i = 0; i < requiredSlots; i++) {
      const idx = toIndex + i;
      newSlotIndices.push(idx);
      newSlots[toLocation][idx] = {
        ...newSlots[toLocation][idx],
        equipment: {
          equipmentId: equipment.id,
          equipmentData: equipment,
          allocatedSlots: requiredSlots,
          startSlotIndex: toIndex,
          endSlotIndex: toIndex + requiredSlots - 1
        },
        isPartOfMultiSlot: requiredSlots > 1,
        multiSlotGroupId: groupId,
        multiSlotIndex: i
      };
    }
    
    setCriticalSlots(newSlots);
    
    // Update allocation
    setEquipmentAllocations(prev => prev.map((a, idx) => 
      idx === allocationIndex ? { ...a, location: toLocation, slotIndices: newSlotIndices } : a
    ));
    
    // Batch update to parent
    batchUpdateToParent();
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
    const locationSlots = criticalSlots[location];
    const previewSlots: number[] = [];
    
    // Check if we can place at this position
    let canPlace = true;
    if (hoverIndex + requiredSlots > locationSlots.length) {
      canPlace = false;
    } else {
      for (let i = 0; i < requiredSlots; i++) {
        if (locationSlots[hoverIndex + i].equipment !== null) {
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
  
  // Clear location
  const clearLocation = (location: string) => {
    if (readOnly) return;
    
    const newSlots = { ...criticalSlots };
    const clearedAllocations: number[] = [];
    
    // Track allocations to clear
    equipmentAllocations.forEach((allocation, idx) => {
      if (allocation.location === location) {
        const firstSlot = newSlots[location][allocation.slotIndices[0]];
        if (firstSlot?.equipment && !firstSlot.equipment.equipmentData.isFixed) {
          clearedAllocations.push(idx);
        }
      }
    });
    
    // Clear slots
    newSlots[location].forEach((slot, index) => {
      if (slot.equipment && !slot.equipment.equipmentData.isFixed) {
        newSlots[location][index] = {
          ...slot,
          equipment: null,
          isPartOfMultiSlot: false,
          multiSlotGroupId: undefined,
          multiSlotIndex: undefined
        };
      }
    });
    
    setCriticalSlots(newSlots);
    
    // Update allocations
    setEquipmentAllocations(prev => 
      prev.filter((_, idx) => !clearedAllocations.includes(idx))
    );
    
    // Batch update to parent
    batchUpdateToParent();
  };
  
  // Calculate total and available slots
  const slotStatistics = useMemo(() => {
    let totalSlots = 0;
    let usedSlots = 0;
    
    Object.values(criticalSlots).forEach(locationSlots => {
      totalSlots += locationSlots.length;
      locationSlots.forEach(slot => {
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
  }, [criticalSlots]);
  
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
                disabled={readOnly}
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
