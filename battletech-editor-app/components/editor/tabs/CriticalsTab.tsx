import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { EditorComponentProps, EditableUnit, MECH_LOCATIONS } from '../../../types/editor';
import DraggableEquipmentItem from '../equipment/DraggableEquipmentItem';
import CriticalSlotDropZone from '../criticals/CriticalSlotDropZone';
import { DraggedEquipment } from '../dnd/types';
import { FullEquipment } from '../../../types';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';
import styles from './CriticalsTab.module.css';

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

// Helper to check if a slot value should be considered empty
const isEmptySlot = (value: any): boolean => {
  if (!value) return true;
  if (typeof value !== 'string') return true;
  
  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue === '' ||
         normalizedValue === '-empty-' ||
         normalizedValue === '- empty -' ||
         normalizedValue === 'empty' ||
         normalizedValue === '-' ||
         normalizedValue === '- -' ||
         normalizedValue === '—' ||
         normalizedValue === '–' ||
         normalizedValue === 'null' ||
         normalizedValue === 'undefined';
};

// Helper to normalize equipment names (e.g., all engine types become "Engine")
const normalizeEquipmentName = (itemName: string): string => {
  if (!itemName) return itemName;
  
  const lowerName = itemName.toLowerCase();
  
  // Normalize all engine types to just "Engine"
  if (lowerName.includes('engine') && 
      !lowerName.includes('heat sink') && 
      !lowerName.includes('sink')) {
    return 'Engine';
  }
  
  // Keep other equipment names as-is (including specific gyro types)
  return itemName;
};

const CriticalsTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {

  // Initialize critical slots from unit data
  const [criticalSlots, setCriticalSlots] = useState<Record<string, string[]>>(() => {
    const slots: Record<string, string[]> = {};
    
    // Initialize from unit data if available
    if (unit.data?.criticals) {
      unit.data.criticals.forEach(loc => {
        // Ensure all slots are properly initialized
        const locationSlots = loc.slots || [];
        const mechLocation = mechLocations.find(ml => ml.name === loc.location);
        const totalSlots = mechLocation?.slots || 12;
        
        // Create array with proper initialization
        slots[loc.location] = Array(totalSlots).fill('-Empty-');
        
        // Fill in the actual equipment
        locationSlots.forEach((item, index) => {
          // Only set non-empty values, everything else stays as '-Empty-'
          if (!isEmptySlot(item)) {
            slots[loc.location][index] = normalizeEquipmentName(item);
          }
        });
      });
    } else {
      // Default initialization
      mechLocations.forEach(loc => {
        slots[loc.name] = Array(loc.slots).fill('-Empty-');
      });
    }
    
    // Ensure all mech locations are initialized
    mechLocations.forEach(loc => {
      if (!slots[loc.name]) {
        slots[loc.name] = Array(loc.slots).fill('-Empty-');
      }
    });
    
    return slots;
  });

  // Track used equipment IDs
  const [usedEquipment, setUsedEquipment] = useState<Set<string>>(new Set());

  // Get unallocated equipment from unit
  const getUnallocatedEquipment = (): FullEquipment[] => {
    const allEquipment = unit.data?.weapons_and_equipment || [];
    const unallocated: FullEquipment[] = [];
    
    // First filter for equipment that has no location or empty location
    const unallocatedEquipment = allEquipment.filter(eq => !eq.location || eq.location === '');
    
    // Count how many times each equipment appears in critical slots
    const placedCounts: Record<string, number> = {};
    Object.values(criticalSlots).forEach(slots => {
      slots.forEach(slot => {
        if (slot && slot !== '-Empty-' && !isEmptySlot(slot)) {
          // For multi-slot equipment, only count once per contiguous block
          const prev = slots[slots.indexOf(slot) - 1];
          if (prev !== slot) {
            // Normalize the slot name for comparison
            const normalizedSlot = normalizeEquipmentName(slot);
            placedCounts[normalizedSlot] = (placedCounts[normalizedSlot] || 0) + 1;
          }
        }
      });
    });
    
    // Count equipment in unallocated equipment only
    const equipmentCounts: Record<string, { count: number; equipment: any }> = {};
    unallocatedEquipment.forEach(eq => {
      const normalizedName = normalizeEquipmentName(eq.item_name);
      if (!equipmentCounts[normalizedName]) {
        equipmentCounts[normalizedName] = { count: 0, equipment: eq };
      }
      equipmentCounts[normalizedName].count += 1;
    });
    
    // Find equipment that has more instances than placed
    Object.entries(equipmentCounts).forEach(([normalizedName, { count: totalCount, equipment }]) => {
      const placedCount = placedCounts[normalizedName] || 0;
      const unplacedCount = totalCount - placedCount;
      
      for (let i = 0; i < unplacedCount; i++) {
        // Get equipment stats based on name
        const stats = getEquipmentStats(equipment.item_name);
        
        unallocated.push({
          id: `${equipment.item_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
          name: equipment.item_name,
          type: equipment.item_type === 'weapon' ? 'Weapon' : 'Equipment',
          tech_base: equipment.tech_base || unit.tech_base,
          weight: stats.weight,
          space: stats.space,
          damage: stats.damage,
          heat: stats.heat,
        });
      }
    });
    
    return unallocated;
  };
  
  // Helper function to get equipment stats
  const getEquipmentStats = (itemName: string): { weight: number; space: number; damage?: string; heat?: number } => {
    // Find equipment in the database
    const equipment = EQUIPMENT_DATABASE.find(e => e.name === itemName);
    
    if (equipment) {
      return {
        weight: equipment.weight,
        space: equipment.crits, // 'crits' is the critical slots required
        damage: typeof equipment.damage === 'number' ? equipment.damage.toString() : equipment.damage,
        heat: equipment.heat > 0 ? equipment.heat : undefined,
      };
    }
    
    // Default fallback
    return { weight: 1, space: 1 };
  };

  const unallocatedEquipment = getUnallocatedEquipment();

  const handleDrop = (item: DraggedEquipment, location: string, slotIndex: number) => {
    if (readOnly) return;
    
    // Check if equipment can fit
    const remainingSlots = criticalSlots[location].length - slotIndex;
    if (item.criticalSlots > remainingSlots) {
      alert(`Not enough slots! ${item.name} requires ${item.criticalSlots} slots, but only ${remainingSlots} available.`);
      return;
    }

    // Update critical slots
    const newSlots = { ...criticalSlots };
    newSlots[location] = [...newSlots[location]];
    
    // If this is from a critical slot, clear the source location first
    if ('isFromCriticalSlot' in item && item.isFromCriticalSlot && 'sourceLocation' in item && 'sourceSlotIndex' in item) {
      const sourceLocation = (item as any).sourceLocation;
      const sourceSlotIndex = (item as any).sourceSlotIndex;
      
      // Clear source slots
      for (let i = 0; i < item.criticalSlots; i++) {
        if (newSlots[sourceLocation] && newSlots[sourceLocation][sourceSlotIndex + i]) {
          newSlots[sourceLocation][sourceSlotIndex + i] = '-Empty-';
        }
      }
    }
    
    // Fill target slots with equipment name
    for (let i = 0; i < item.criticalSlots; i++) {
      newSlots[location][slotIndex + i] = item.name;
    }
    
    setCriticalSlots(newSlots);

    // Mark equipment as used
    setUsedEquipment(prev => new Set(Array.from(prev).concat(item.equipmentId)));
    
    // Update unit data with new critical slots
    const newCriticals = mechLocations.map(loc => ({
      location: loc.name,
      slots: newSlots[loc.name] || Array(loc.slots).fill('-Empty-'),
    }));

    // Update the equipment location in weapons_and_equipment
    const updatedWeaponsAndEquipment = (unit.data?.weapons_and_equipment || []).map(eq => {
      if ('isFromCriticalSlot' in item && item.isFromCriticalSlot) {
        // Moving from one critical slot to another
        const sourceLocation = (item as any).sourceLocation;
        if (eq.item_name === item.name && eq.location === sourceLocation) {
          // Update the location of the moved item
          return {
            ...eq,
            location: location
          };
        }
      } else {
        // Placing from unallocated equipment
        if ((!eq.location || eq.location === '') && eq.item_name === item.name) {
          // Only update the first unallocated instance
          return {
            ...eq,
            location: location
          };
        }
      }
      return eq;
    });

    const updates: Partial<EditableUnit> = {
      data: {
        ...unit.data,
        criticals: newCriticals,
        weapons_and_equipment: updatedWeaponsAndEquipment,
      },
    };

    onUnitChange(updates);
  };

  // List of system components that cannot be removed (except Hand Actuator)
  const isSystemComponent = (itemName: string): boolean => {
    const systemComponents = [
      'Fusion Engine',
      'XL Engine',
      'XXL Engine',
      'Light Engine',
      'Compact Engine',
      'Engine',
      'Gyro',
      'Standard Gyro',
      'XL Gyro',
      'Compact Gyro',
      'Heavy-Duty Gyro',
      'Cockpit',
      'Small Cockpit',
      'Command Console',
      'Life Support',
      'Sensors',
      'Shoulder',
      'Upper Arm Actuator',
      'Lower Arm Actuator',
      // 'Hand Actuator', // Hand Actuator CAN be removed
      'Hip',
      'Upper Leg Actuator',
      'Lower Leg Actuator',
      'Foot Actuator'
    ];
    
    return systemComponents.some(component => 
      itemName.toLowerCase().includes(component.toLowerCase())
    );
  };

  const handleRemove = (location: string, slotIndex: number) => {
    if (readOnly) return;
    
    const equipmentName = criticalSlots[location][slotIndex];
    if (equipmentName === '-Empty-') return;

    // Check if this is a system component that cannot be removed
    if (isSystemComponent(equipmentName)) {
      // Allow removal only if it's a Hand Actuator
      if (!equipmentName.toLowerCase().includes('hand actuator')) {
        // Don't remove - visual feedback will be handled by the component
        return;
      }
    }

    // Find all consecutive slots with the same equipment
    let startIndex = slotIndex;
    let endIndex = slotIndex;
    
    // Find start
    while (startIndex > 0 && criticalSlots[location][startIndex - 1] === equipmentName) {
      startIndex--;
    }
    
    // Find end
    while (endIndex < criticalSlots[location].length - 1 && criticalSlots[location][endIndex + 1] === equipmentName) {
      endIndex++;
    }

    // Clear all slots occupied by this equipment
    const newSlots = { ...criticalSlots };
    newSlots[location] = [...newSlots[location]];
    
    // Clear all slots
    for (let i = startIndex; i <= endIndex; i++) {
      newSlots[location][i] = '-Empty-';
    }
    
    setCriticalSlots(newSlots);

    // Remove from used equipment
    const equipmentId = equipmentName.toLowerCase().replace(/\s+/g, '-');
    setUsedEquipment(prev => {
      const newUsed = new Set(prev);
      newUsed.delete(equipmentId);
      return newUsed;
    });
    
    // Update unit data with new critical slots
    const newCriticals = mechLocations.map(loc => ({
      location: loc.name,
      slots: newSlots[loc.name] || Array(loc.slots).fill('-Empty-'),
    }));

    // Clear the location from the equipment in weapons_and_equipment
    const updatedWeaponsAndEquipment = (unit.data?.weapons_and_equipment || []).map(eq => {
      // Find equipment that was in this location
      if (eq.location === location && eq.item_name === equipmentName) {
        // Clear the location for one instance
        return {
          ...eq,
          location: ''
        };
      }
      return eq;
    });

    const updates: Partial<EditableUnit> = {
      data: {
        ...unit.data,
        criticals: newCriticals,
        weapons_and_equipment: updatedWeaponsAndEquipment,
      },
    };

    onUnitChange(updates);
  };

  const canAcceptEquipment = (item: DraggedEquipment, location: string, slotIndex: number): boolean => {
    // Check if slot is empty
    if (!isEmptySlot(criticalSlots[location][slotIndex])) {
      return false;
    }

    // Check if equipment can fit
    const remainingSlots = criticalSlots[location].length - slotIndex;
    
    // Check all required slots are empty
    for (let i = 0; i < item.criticalSlots && i < remainingSlots; i++) {
      if (!isEmptySlot(criticalSlots[location][slotIndex + i])) {
        return false;
      }
    }
    
    return item.criticalSlots <= remainingSlots;
  };

  const clearLocation = (location: string) => {
    if (readOnly) return;
    
    // Track equipment that was cleared
    const clearedEquipment: string[] = [];
    
    // Clear only non-system components
    const newSlots = [...criticalSlots[location]];
    for (let i = 0; i < newSlots.length; i++) {
      const item = newSlots[i];
      if (item !== '-Empty-' && !isSystemComponent(item)) {
        // Track cleared equipment
        if (!clearedEquipment.includes(item)) {
          clearedEquipment.push(item);
        }
        // Clear non-system equipment
        newSlots[i] = '-Empty-';
      } else if (item !== '-Empty-' && item.toLowerCase().includes('hand actuator')) {
        // Track cleared equipment
        if (!clearedEquipment.includes(item)) {
          clearedEquipment.push(item);
        }
        // Hand actuator can be cleared
        newSlots[i] = '-Empty-';
      }
    }
    
    setCriticalSlots(prev => ({
      ...prev,
      [location]: newSlots,
    }));
    
    // Update used equipment
    setUsedEquipment(new Set());
    
    // Clear locations from weapons_and_equipment for cleared items
    const updatedWeaponsAndEquipment = (unit.data?.weapons_and_equipment || []).map(eq => {
      // Clear location if this equipment was in the cleared location
      if (eq.location === location && clearedEquipment.includes(eq.item_name)) {
        return {
          ...eq,
          location: ''
        };
      }
      return eq;
    });
    
    // Update unit data with new critical slots
    const newCriticals = mechLocations.map(loc => ({
      location: loc.name,
      slots: criticalSlots[loc.name] || Array(loc.slots).fill('-Empty-'),
    }));
    
    // Apply the cleared slots for this location
    const criticalIndex = newCriticals.findIndex(c => c.location === location);
    if (criticalIndex !== -1) {
      newCriticals[criticalIndex].slots = newSlots;
    }

    const updates: Partial<EditableUnit> = {
      data: {
        ...unit.data,
        criticals: newCriticals,
        weapons_and_equipment: updatedWeaponsAndEquipment,
      },
    };

    onUnitChange(updates);
  };

  // Update unit data when critical slots change
  const updateUnitCriticals = () => {
    const newCriticals = mechLocations.map(loc => ({
      location: loc.name,
      slots: criticalSlots[loc.name] || Array(loc.slots).fill('-Empty-'),
    }));

    const updates: Partial<EditableUnit> = {
      data: {
        ...unit.data,
        criticals: newCriticals,
      },
    };

    onUnitChange(updates);
  };

  // Sync with unit data changes
  useEffect(() => {
    if (unit.data?.criticals) {
      const newSlots: Record<string, string[]> = {};
      
      unit.data.criticals.forEach(loc => {
        // Ensure all slots are properly initialized
        const locationSlots = loc.slots || [];
        const mechLocation = mechLocations.find(ml => ml.name === loc.location);
        const totalSlots = mechLocation?.slots || 12;
        
        // Create array with proper initialization
        newSlots[loc.location] = Array(totalSlots).fill('-Empty-');
        
        // Fill in the actual equipment
        locationSlots.forEach((item, index) => {
          // Only set non-empty values, everything else stays as '-Empty-'
          if (!isEmptySlot(item)) {
            newSlots[loc.location][index] = normalizeEquipmentName(item);
          }
        });
      });
      
      // Ensure all mech locations are initialized
      mechLocations.forEach(loc => {
        if (!newSlots[loc.name]) {
          newSlots[loc.name] = Array(loc.slots).fill('-Empty-');
        }
      });
      
      setCriticalSlots(newSlots);
    }
  }, [unit.data?.criticals, unit.id]); // Add unit.id to ensure re-init when switching units

  // Helper function to render a location section
  const renderLocationSection = (location: typeof mechLocations[0], locationClass: string) => {
    const slots = criticalSlots[location.name] || [];
    const isSystem = (slot: string, index: number) => 
      !isEmptySlot(slot) && isSystemComponent(slot) && !slot.toLowerCase().includes('hand actuator');
    
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
            // Determine if this is part of a multi-slot group
            let isStartOfGroup = false;
            let isEndOfGroup = false;
            let isMiddleOfGroup = false;
            
            if (!isEmptySlot(slot)) {
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
                isSystemComponent={isSystem(slot, index)}
                onSystemClick={() => {}}
                isStartOfGroup={isStartOfGroup}
                isMiddleOfGroup={isMiddleOfGroup}
                isEndOfGroup={isEndOfGroup}
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
                    isCompact={true}
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
          
          {/* Critical Slots Panel - Horizontal Layout */}
          <div className={styles.criticalSlotsPanel}>
            <div className={styles.mechLayout}>
              {/* Head Row */}
              <div className={styles.layoutRow}>
                {renderLocationSection(mechLocations[0], 'head')}
              </div>
              
              {/* Arms Row */}
              <div className={`${styles.layoutRow} ${styles.armRow}`}>
                {renderLocationSection(mechLocations[1], 'arm')}
                <div style={{ width: '180px' }}></div> {/* Spacer */}
                {renderLocationSection(mechLocations[2], 'arm')}
              </div>
              
              {/* Torso Row */}
              <div className={`${styles.layoutRow} ${styles.torsoRow}`}>
                {renderLocationSection(mechLocations[3], 'torso')}
                {renderLocationSection(mechLocations[4], 'centerTorso')}
                {renderLocationSection(mechLocations[5], 'torso')}
              </div>
              
              {/* Legs Row */}
              <div className={styles.layoutRow}>
                {renderLocationSection(mechLocations[6], 'leg')}
                <div style={{ width: '180px' }}></div> {/* Spacer */}
                {renderLocationSection(mechLocations[7], 'leg')}
              </div>
            </div>
          </div>
        </div>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className={styles.validationErrors}>
            <h4>Validation Issues:</h4>
            <ul>
              {validationErrors.map(error => (
                <li key={error.id} className={error.category === 'error' ? styles.error : styles.warning}>
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default CriticalsTab;
