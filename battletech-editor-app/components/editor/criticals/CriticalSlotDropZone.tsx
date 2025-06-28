/**
 * Critical Slot Drop Zone
 * Object-based critical slot component - NO STRINGS
 */

import React, { useRef, useEffect } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { CriticalSlotObject, EquipmentObject, EquipmentType, EquipmentCategory } from '../../../types/criticalSlots';
import { DraggedEquipment } from '../dnd/types';
import { getEquipmentColorClasses } from '../../../utils/equipmentColors';
import styles from './CriticalSlotDropZone.module.css';

interface CriticalSlotDropZoneProps {
  location: string;
  slotIndex: number;
  slot: CriticalSlotObject;
  onDrop: (equipment: EquipmentObject, location: string, slotIndex: number) => void;
  onRemove?: (location: string, slotIndex: number) => void;
  onMove?: (fromLocation: string, fromIndex: number, toLocation: string, toIndex: number) => void;
  canAccept: (equipment: EquipmentObject) => boolean;
  disabled?: boolean;
  isHoveredMultiSlot?: boolean;
  onHoverChange?: (isHovering: boolean, equipment: EquipmentObject | null) => void;
  isPartOfDropPreview?: boolean;
  criticalSlots?: CriticalSlotObject[]; // Add this to check consecutive slots
}

const CriticalSlotDropZone: React.FC<CriticalSlotDropZoneProps> = ({
  location,
  slotIndex,
  slot,
  onDrop,
  onRemove,
  onMove,
  canAccept,
  disabled = false,
  isHoveredMultiSlot = false,
  onHoverChange,
  isPartOfDropPreview = false,
  criticalSlots = [],
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Check if slot has equipment
  const hasEquipment = slot.equipment !== null;
  const equipment = slot.equipment?.equipmentData;
  const isSystemComponent = equipment?.isFixed && !equipment?.isRemovable;
  const isMultiSlot = slot.isPartOfMultiSlot;
  const multiSlotPosition = slot.multiSlotIndex;
  
  // Drag source for occupied slots
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'equipment',
    item: (): DraggedEquipment | null => {
      if (!hasEquipment || !equipment || isSystemComponent) return null;
      
      // For multi-slot equipment, find the actual start index
      let actualStartIndex = slotIndex;
      if (isMultiSlot && multiSlotPosition !== undefined && multiSlotPosition > 0) {
        // This is not the first slot of the equipment, calculate the actual start
        actualStartIndex = slotIndex - multiSlotPosition;
      }
      
      return {
        type: 'equipment' as any,
        equipmentId: equipment.id,
        name: equipment.name,
        weight: equipment.weight,
        criticalSlots: equipment.requiredSlots,
        category: equipment.category,
        techBase: equipment.techBase,
        damage: equipment.damage,
        heat: equipment.heat,
        isFromCriticalSlot: true,
        sourceLocation: location,
        sourceSlotIndex: actualStartIndex
      };
    },
    canDrag: () => hasEquipment && !isSystemComponent && !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [hasEquipment, equipment, isSystemComponent, disabled, location, slotIndex, multiSlotPosition]);
  
  // Drop target setup
  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: 'equipment',
    canDrop: (item: DraggedEquipment) => {
      // Don't allow drops on disabled slots
      if (disabled) return false;
      
      // Allow dropping back to the same slot (canceling the drag)
      if (item.isFromCriticalSlot && 
          item.sourceLocation === location && 
          item.sourceSlotIndex === slotIndex) {
        return true;
      }
      
      // For equipment being moved from critical slots, check if target overlaps with source
      if (item.isFromCriticalSlot && item.sourceLocation === location) {
        const sourceStart = item.sourceSlotIndex || 0;
        const sourceEnd = sourceStart + item.criticalSlots - 1;
        const targetEnd = slotIndex + item.criticalSlots - 1;
        
        // Check if there's enough room for the equipment
        if (targetEnd >= criticalSlots.length) {
          return false; // Not enough slots
        }
        
        // Allow if target range overlaps with source range (partial overlap)
        const overlaps = (slotIndex <= sourceEnd && targetEnd >= sourceStart);
        if (overlaps) {
          // Check if all non-overlapping slots are empty
          for (let i = 0; i < item.criticalSlots; i++) {
            const checkIndex = slotIndex + i;
            // Skip slots that are part of the source equipment
            if (checkIndex >= sourceStart && checkIndex <= sourceEnd) {
              continue;
            }
            // Check if the slot exists and is empty
            if (checkIndex >= criticalSlots.length || 
                (criticalSlots[checkIndex]?.equipment !== null)) {
              return false;
            }
          }
          return true;
        }
      }
      
      // For new equipment or non-overlapping moves
      // Check if we have enough slots
      if (slotIndex + item.criticalSlots > criticalSlots.length) {
        return false; // Not enough slots
      }
      
      // Check if target slot is empty
      if (hasEquipment) return false;
      
      // Check if all required slots are empty for multi-slot equipment
      if (item.criticalSlots > 1) {
        for (let i = 0; i < item.criticalSlots; i++) {
          const checkSlot = criticalSlots[slotIndex + i];
          if (!checkSlot || checkSlot.equipment !== null) {
            return false;
          }
        }
      }
      
      return true;
    },
    hover: (item: DraggedEquipment, monitor) => {
      const isHovering = monitor.isOver({ shallow: true });
      
      if (!onHoverChange || !isHovering) return;
      
      const equipmentObj: EquipmentObject = {
        id: item.equipmentId,
        name: item.name,
        type: item.type as any,
        category: item.category as any,
        requiredSlots: item.criticalSlots,
        weight: item.weight || 0,
        isFixed: false,
        isRemovable: true,
        techBase: (item.techBase || 'Inner Sphere') as 'Inner Sphere' | 'Clan' | 'Both'
      };
      
      // Always call hover change when hovering, regardless of canDrop
      onHoverChange(true, equipmentObj);
    },
    drop: (item: DraggedEquipment) => {
      const equipmentObj: EquipmentObject = {
        id: item.equipmentId,
        name: item.name,
        type: item.type as any,
        category: item.category as any,
        requiredSlots: item.criticalSlots,
        weight: item.weight || 0,
        isFixed: false,
        isRemovable: true,
        techBase: (item.techBase || 'Inner Sphere') as 'Inner Sphere' | 'Clan' | 'Both',
        damage: item.damage,
        heat: item.heat
      };
      
      // Validate the drop can actually happen
      // Check if canAccept allows this drop
      if (!canAccept(equipmentObj)) {
        console.warn(`Cannot place ${item.name} in ${location} - location restrictions`);
        return;
      }
      
      // Check multi-slot requirements
      if (item.criticalSlots > 1) {
        // Check if we have enough slots remaining
        if (slotIndex + item.criticalSlots > criticalSlots.length) {
          console.warn(`Not enough slots for ${item.name} - needs ${item.criticalSlots} slots`);
          return;
        }
        
        // For moves from critical slots, check for overlaps
        if (item.isFromCriticalSlot && item.sourceLocation === location) {
          const sourceStart = item.sourceSlotIndex || 0;
          const sourceEnd = sourceStart + item.criticalSlots - 1;
          
          // Check if all required slots are empty (excluding overlapping source slots)
          for (let i = 0; i < item.criticalSlots; i++) {
            const checkIndex = slotIndex + i;
            // Skip slots that are part of the source equipment
            if (checkIndex >= sourceStart && checkIndex <= sourceEnd) {
              continue;
            }
            const checkSlot = criticalSlots[checkIndex];
            if (!checkSlot || checkSlot.equipment !== null) {
              console.warn(`Not enough consecutive empty slots for ${item.name}`);
              return;
            }
          }
        } else {
          // For new equipment, all slots must be empty
          for (let i = 0; i < item.criticalSlots; i++) {
            const checkSlot = criticalSlots[slotIndex + i];
            if (!checkSlot || checkSlot.equipment !== null) {
              console.warn(`Not enough consecutive empty slots for ${item.name}`);
              return;
            }
          }
        }
      }
      
      // If it's from another critical slot, call move instead
      if ('isFromCriticalSlot' in item && item.isFromCriticalSlot && 
          'sourceLocation' in item && 'sourceSlotIndex' in item && onMove) {
        onMove(
          (item as any).sourceLocation,
          (item as any).sourceSlotIndex,
          location,
          slotIndex
        );
      } else {
        onDrop(equipmentObj, location, slotIndex);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem() as DraggedEquipment | null,
    }),
  });

  // Apply drag and drop refs
  useEffect(() => {
    if (ref.current) {
      drop(ref.current);
      // Only attach drag if slot has equipment that can be dragged
      if (hasEquipment && !isSystemComponent && !disabled) {
        drag(ref.current);
      }
    }
  }, [drop, drag, hasEquipment, isSystemComponent, disabled]);

  // Handle click to remove
  const handleClick = () => {
    if (!disabled && hasEquipment && equipment && equipment.isRemovable && onRemove) {
      onRemove(location, slotIndex);
    }
  };

  // Clear hover when leaving
  useEffect(() => {
    if (!isOver && onHoverChange) {
      onHoverChange(false, null);
    }
  }, [isOver, onHoverChange]);

  // Get equipment color classes
  const getEquipmentColors = () => {
    if (!hasEquipment || !equipment) {
      return getEquipmentColorClasses('-Empty-');
    }
    return getEquipmentColorClasses(equipment.name);
  };

  // Determine slot styling
  const getSlotClassName = () => {
    const classes = [styles.slot];
    const colorClasses = getEquipmentColors();
    
    if (hasEquipment) {
      classes.push(styles.occupied);
      // Apply color classes (colorClasses is a string, not an object)
      classes.push(colorClasses);
      
      if (isSystemComponent) {
        classes.push(styles.system);
      }
      if (isDragging) {
        classes.push(styles.dragging);
      }
      if (isMultiSlot) {
        classes.push(styles.multiSlot);
        if (multiSlotPosition === 0) {
          classes.push(styles.multiSlotStart);
        } else if (slot.multiSlotGroupId && multiSlotPosition === (slot.equipment?.allocatedSlots || 1) - 1) {
          classes.push(styles.multiSlotEnd);
        } else {
          classes.push(styles.multiSlotMiddle);
        }
      }
    } else {
      classes.push(styles.empty);
      // Apply empty slot colors (colorClasses is a string, not an object)
      classes.push(colorClasses);
    }
    
    if (isHoveredMultiSlot || isPartOfDropPreview) {
      classes.push(styles.hovered);
    }
    
    if (disabled) {
      classes.push(styles.disabled);
    }
    
    if (isOver) {
      if (canDrop) {
        classes.push(styles.validDrop);
      } else {
        classes.push(styles.invalidDrop);
      }
    }
    
    return classes.join(' ');
  };

  // Render equipment content
  const renderContent = () => {
    if (!hasEquipment || !equipment) {
      // Empty slot - just show the slot number
      return (
        <span className={styles.slotNumber}>
          {slotIndex + 1}
        </span>
      );
    }

    // For multi-slot equipment, only show name on first slot
    if (isMultiSlot && multiSlotPosition !== 0) {
      return (
        <span className={styles.continuationMarker}>
          ↕
        </span>
      );
    }

    // Show equipment name
    return (
      <>
        <span className={styles.equipmentName}>
          {equipment.name}
        </span>
        {equipment.requiredSlots > 1 && (
          <span className={styles.slotCount}>
            ({equipment.requiredSlots})
          </span>
        )}
      </>
    );
  };

  // Render remove button for removable equipment
  const renderRemoveButton = () => {
    if (!hasEquipment || isSystemComponent || disabled || !onRemove) {
      return null;
    }

    // Only show remove button on first slot of multi-slot equipment
    if (isMultiSlot && multiSlotPosition !== 0) {
      return null;
    }

    return (
      <button
        className={styles.removeButton}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        title="Remove equipment"
      >
        ×
      </button>
    );
  };

  return (
    <div
      ref={ref}
      className={getSlotClassName()}
      onClick={handleClick}
      title={equipment ? `${equipment.name} (${equipment.weight}t)` : `Slot ${slotIndex + 1}`}
    >
      {renderContent()}
      {renderRemoveButton()}
    </div>
  );
};

export default CriticalSlotDropZone;
