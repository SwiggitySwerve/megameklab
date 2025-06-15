import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { EditableUnit, MECH_LOCATIONS } from '../../../types/editor';
import CriticalSlotDropZone from './CriticalSlotDropZone';
import { DraggedEquipment } from '../dnd/types';
import { calculateCompleteInternalStructure } from '../../../utils/criticalSlotCalculations';
import styles from './MechCriticalsAllocationGrid.module.css';

export interface MechCriticalsAllocationGridProps {
  unit: EditableUnit;
  onEquipmentPlace: (equipment: DraggedEquipment, location: string, slotIndex: number) => void;
  onEquipmentRemove?: (location: string, slotIndex: number) => void;
  selectedLocation?: string;
  onLocationSelect?: (location: string) => void;
  readOnly?: boolean;
  showLocationHeaders?: boolean;
  compactView?: boolean;
}

// Critical slot counts for each location
const CRITICAL_SLOT_COUNTS = {
  [MECH_LOCATIONS.HEAD]: 6,
  [MECH_LOCATIONS.LEFT_TORSO]: 12,
  [MECH_LOCATIONS.CENTER_TORSO]: 12,
  [MECH_LOCATIONS.RIGHT_TORSO]: 12,
  [MECH_LOCATIONS.LEFT_ARM]: 12,
  [MECH_LOCATIONS.RIGHT_ARM]: 12,
  [MECH_LOCATIONS.LEFT_LEG]: 6,
  [MECH_LOCATIONS.RIGHT_LEG]: 6,
};

export const MechCriticalsAllocationGrid: React.FC<MechCriticalsAllocationGridProps> = ({
  unit,
  onEquipmentPlace,
  onEquipmentRemove,
  selectedLocation,
  onLocationSelect,
  readOnly = false,
  showLocationHeaders = true,
  compactView = false,
}) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  
  // Calculate internal structure dynamically based on unit configuration
  const internalStructure = calculateCompleteInternalStructure(unit);

  const getLocationSlots = (location: string): string[] => {
    const slotCount = (CRITICAL_SLOT_COUNTS as any)[location] || 12;
    const currentSlots = (unit.criticalSlots as any)?.[location] || [];
    const internalSlots = internalStructure[location] || [];
    
    
    // Merge internal structure with current equipment
    const slots = Array(slotCount).fill('- Empty -');
    
    // Fill internal structure slots first
    internalSlots.forEach((item: string, index: number) => {
      if (index < slotCount) {
        slots[index] = item;
      }
    });
    
    // Then fill with current equipment
    // Only add equipment if there are slots available after internal structure
    if (internalSlots.length < slotCount) {
      currentSlots.forEach((item: any, index: number) => {
        const slotIndex = index + internalSlots.length;
        if (slotIndex < slotCount && item && item !== '- Empty -') {
          slots[slotIndex] = item;
        }
      });
    }
    
    
    return slots;
  };

  const handleEquipmentDrop = (item: DraggedEquipment, location: string, slotIndex: number) => {
    if (!readOnly) {
      onEquipmentPlace(item, location, slotIndex);
    }
  };

  const canAcceptEquipment = (item: DraggedEquipment, location: string, slotIndex: number): boolean => {
    if (readOnly) return false;
    
    const slots = getLocationSlots(location);
    const internalSlots = internalStructure[location] || [];
    
    // Can't place in internal structure slots
    if (slotIndex < internalSlots.length) return false;
    
    // Check if slot is empty
    if (slots[slotIndex] !== '- Empty -') return false;
    
    // Check if equipment fits
    const remainingSlots = slots.length - slotIndex;
    return item.criticalSlots <= remainingSlots;
  };

  const handleLocationHeaderClick = (location: string) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const renderLocationColumn = (location: string) => {
    const slots = getLocationSlots(location);
    const internalSlots = internalStructure[location] || [];
    const isSelected = selectedLocation === location;
    const isHovered = hoveredLocation === location;

    return (
      <div 
        key={location} 
        className={`${styles.locationColumn} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''}`}
        onMouseEnter={() => setHoveredLocation(location)}
        onMouseLeave={() => setHoveredLocation(null)}
      >
        {showLocationHeaders && (
          <div 
            className={styles.locationHeader}
            onClick={() => handleLocationHeaderClick(location)}
          >
            <span className={styles.locationName}>{location}</span>
            <span className={styles.slotCount}>({slots.length} slots)</span>
          </div>
        )}
        
        <div className={styles.slotsContainer}>
          {slots.map((slot, index) => {
            const isInternalStructure = index < internalSlots.length;
            const isOmniPodSlot = (unit as any).omnipod?.includes(`${location}-${index}`) || false;
            
            // Debug logging for Center Torso Engine slots
            if (location === MECH_LOCATIONS.CENTER_TORSO && index < 3) {
              console.log(`Creating slot object for ${location} slot ${index}:`, {
                slot,
                isInternalStructure,
                internalSlotsLength: internalSlots.length
              });
            }
            
            // Convert string slot to CriticalSlotObject format
            const slotObject: any = {
              slotIndex: index,
              location: location,
              equipment: null,
              isLocked: isInternalStructure,
              isEmpty: slot === '- Empty -',
              displayName: slot,
              isPartOfMultiSlot: false,
              slotType: 'normal'
            };
            
            // If it's a system component, create a proper equipment object
            if (isInternalStructure && slot !== '- Empty -') {
              slotObject.equipment = {
                equipmentId: `system-${location}-${index}`,
                equipmentData: {
                  id: `system-${location}-${index}`,
                  name: slot,
                  type: 'System' as any,
                  category: 'System' as any,
                  requiredSlots: 1,
                  weight: 0,
                  isFixed: true,
                  isRemovable: false,
                  techBase: 'Both' as any
                },
                allocatedSlots: 1,
                startSlotIndex: index,
                endSlotIndex: index
              };
              
              if (location === MECH_LOCATIONS.CENTER_TORSO && index < 3) {
                console.log(`Created equipment object for slot ${index}:`, slotObject.equipment);
              }
            } else if (!isInternalStructure && slot !== '- Empty -' && slot) {
              // Regular equipment
              slotObject.equipment = {
                equipmentId: `eq-${location}-${index}`,
                equipmentData: {
                  id: `eq-${location}-${index}`,
                  name: slot,
                  type: 'EQUIPMENT' as any,
                  category: 'Equipment' as any,
                  requiredSlots: 1,
                  weight: 0,
                  isFixed: false,
                  isRemovable: true,
                  techBase: 'Inner Sphere' as any
                },
                allocatedSlots: 1,
                startSlotIndex: index,
                endSlotIndex: index
              };
            }
            
            return (
              <CriticalSlotDropZone
                key={`${location}-${index}`}
                location={location}
                slotIndex={index}
                slot={slotObject}
                onDrop={(equipment: any, loc: string, idx: number) => {
                  // Convert EquipmentObject to DraggedEquipment format
                  const draggedItem: DraggedEquipment = {
                    type: 'equipment' as any,
                    equipmentId: equipment.id,
                    name: equipment.name,
                    weight: equipment.weight || 0,
                    criticalSlots: equipment.requiredSlots || 1,
                    category: equipment.category,
                    techBase: equipment.techBase
                  };
                  handleEquipmentDrop(draggedItem, loc, idx);
                }}
                canAccept={(equipment: any) => {
                  // Convert EquipmentObject to DraggedEquipment format
                  const draggedItem: DraggedEquipment = {
                    type: 'equipment' as any,
                    equipmentId: equipment.id,
                    name: equipment.name,
                    weight: equipment.weight || 0,
                    criticalSlots: equipment.requiredSlots || 1,
                    category: equipment.category,
                    techBase: equipment.techBase
                  };
                  return canAcceptEquipment(draggedItem, location, slotObject.slotIndex);
                }}
                disabled={readOnly || isInternalStructure}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const locationOrder = [
    MECH_LOCATIONS.HEAD,
    MECH_LOCATIONS.LEFT_TORSO,
    MECH_LOCATIONS.CENTER_TORSO,
    MECH_LOCATIONS.RIGHT_TORSO,
    MECH_LOCATIONS.LEFT_ARM,
    MECH_LOCATIONS.RIGHT_ARM,
    MECH_LOCATIONS.LEFT_LEG,
    MECH_LOCATIONS.RIGHT_LEG,
  ];

  return (
    <div className={`${styles.container} ${compactView ? styles.compact : ''}`}>
      <div className={styles.gridHeader}>
        <h3>Critical Slots Allocation</h3>
        <div className={styles.actions}>
          {!readOnly && (
            <>
              <button className={styles.actionButton} title="Auto-allocate equipment">
                Auto-Allocate
              </button>
              <button className={styles.actionButton} title="Clear all allocations">
                Clear All
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className={styles.grid}>
        {locationOrder.map(location => renderLocationColumn(location))}
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#e3f2fd' }}></div>
          <span>Internal Structure</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#fff3e0' }}></div>
          <span>Equipment</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#f3e5f5' }}></div>
          <span>OmniPod Slot</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#fafafa' }}></div>
          <span>Empty Slot</span>
        </div>
      </div>
    </div>
  );
};

export default MechCriticalsAllocationGrid;
