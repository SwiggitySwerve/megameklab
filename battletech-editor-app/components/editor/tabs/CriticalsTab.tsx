import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { EditorComponentProps, EditableUnit, MECH_LOCATIONS } from '../../../types/editor';
import DraggableEquipmentItem from '../equipment/DraggableEquipmentItem';
import CriticalSlotDropZone from '../criticals/CriticalSlotDropZone';
import { DraggedEquipment } from '../dnd/types';
import { FullEquipment } from '../../../types';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';
import { CriticalSlot as NewCriticalSlot } from '../../../types/systemComponents';
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
  // Track hover state for multi-slot highlighting
  const [hoveredSlots, setHoveredSlots] = useState<{location: string, startIndex: number, count: number} | null>(null);

  // Initialize critical slots from unit data - support both new and legacy formats
  const [criticalSlots, setCriticalSlots] = useState<Record<string, string[]>>(() => {
    const slots: Record<string, string[]> = {};
    
    // Prefer new criticalAllocations if available
    if (unit.criticalAllocations) {
      Object.entries(unit.criticalAllocations).forEach(([location, locationSlots]) => {
        slots[location] = locationSlots.map(slot => {
          if (!slot || !slot.content) return '-Empty-';
          // Normalize equipment names for display
          return normalizeEquipmentName(slot.content);
        });
      });
    } else if (unit.data?.criticals) {
      // Fall back to legacy format
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
  
  // Get the actual critical slot data for advanced features
  const getCriticalSlotData = (location: string, index: number): NewCriticalSlot | null => {
    if (unit.criticalAllocations && unit.criticalAllocations[location]) {
      return unit.criticalAllocations[location][index] || null;
    }
    return null;
  };

  // Track used equipment IDs
  const [usedEquipment, setUsedEquipment] = useState<Set<string>>(new Set());

  // Get unallocated equipment from unit
  const getUnallocatedEquipment = (): FullEquipment[] => {
    const allEquipment = unit.data?.weapons_and_equipment || [];
    const unallocated: FullEquipment[] = [];
    
    // First filter for equipment that has no location or empty location
    const unallocatedEquipment = allEquipment.filter(eq => !eq.location || eq.location === '');
    console.log('All equipment:', allEquipment);
    console.log('Unallocated equipment:', unallocatedEquipment);
    
    // Simply show all unallocated equipment
    unallocatedEquipment.forEach((equipment, index) => {
      const stats = getEquipmentStats(equipment.item_name);
      
      unallocated.push({
        id: `${equipment.item_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
        name: equipment.item_name,
        type: equipment.item_type === 'weapon' ? 'Weapon' : 'Equipment',
        tech_base: equipment.tech_base || unit.tech_base,
        weight: stats.weight,
        space: stats.space,
        damage: stats.damage,
        heat: stats.heat,
      });
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
    const newSlots: Record<string, string[]> = {};
    
    // Prefer new criticalAllocations if available
    if (unit.criticalAllocations) {
      Object.entries(unit.criticalAllocations).forEach(([location, locationSlots]) => {
        newSlots[location] = locationSlots.map(slot => {
          if (!slot || !slot.content) return '-Empty-';
          // Normalize equipment names for display
          return normalizeEquipmentName(slot.content);
        });
      });
    } else if (unit.data?.criticals) {
      // Fall back to legacy format
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
    }
    
    // Ensure all mech locations are initialized
    mechLocations.forEach(loc => {
      if (!newSlots[loc.name]) {
        newSlots[loc.name] = Array(loc.slots).fill('-Empty-');
      }
    });
    
    setCriticalSlots(newSlots);
  }, [unit.criticalAllocations, unit.data?.criticals, unit.id]); // Add unit.id to ensure re-init when switching units

  // Track current hover timeout to prevent flickering
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle hover events for multi-slot highlighting
  const handleSlotHover = (location: string, slotIndex: number, isHovering: boolean, item: DraggedEquipment | null) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (isHovering && item) {
      setHoveredSlots({
        location,
        startIndex: slotIndex,
        count: item.criticalSlots || 1
      });
    } else if (!isHovering) {
      // Add a small delay before clearing to prevent flickering when moving between slots
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredSlots(null);
      }, 100);
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to render a location section
  const renderLocationSection = (location: typeof mechLocations[0], locationClass: string) => {
    const slots = criticalSlots[location.name] || [];
    const isSystem = (slot: string, index: number) => {
      // Check new critical slot data if available
      const slotData = getCriticalSlotData(location.name, index);
      if (slotData) {
        return slotData.isFixed && slotData.contentType === 'system';
      }
      // Fall back to legacy check
      return !isEmptySlot(slot) && isSystemComponent(slot) && !slot.toLowerCase().includes('hand actuator');
    };
    
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
            
            // Check if this slot is part of the hovered multi-slot range
            const isHoveredMultiSlot = !!(hoveredSlots && 
              hoveredSlots.location === location.name && 
              index >= hoveredSlots.startIndex && 
              index < (hoveredSlots.startIndex + hoveredSlots.count));
            
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
                isHoveredMultiSlot={isHoveredMultiSlot}
                onHoverChange={(isHovering, item) => handleSlotHover(location.name, index, isHovering, item)}
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
          {hoveredSlots && (
            <div style={{fontSize: '10px', color: '#60a5fa'}}>
              Hovering: {hoveredSlots.location} slots {hoveredSlots.startIndex} to {hoveredSlots.startIndex + hoveredSlots.count - 1}
            </div>
          )}
        </div>
        
        <div className={styles.mainGrid}>
          {/* Critical Slots Panel - 5 Column Layout */}
          <div className={styles.criticalSlotsPanel}>
            <div className={styles.mechGrid}>
              {/* Use a single grid with positioned elements */}
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
        
        {/* Fixed Equipment Panel on Right */}
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
