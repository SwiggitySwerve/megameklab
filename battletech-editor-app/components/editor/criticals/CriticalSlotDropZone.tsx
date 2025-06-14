/**
 * Critical Slot Drop Zone
 * Object-based critical slot component - NO STRINGS
 */

import React, { useRef, useEffect } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { CriticalSlotObject, EquipmentObject, EquipmentType, EquipmentCategory } from '../../../types/criticalSlots';
import { DraggedEquipmentV2 } from '../dnd/typesV2';
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
    item: (): DraggedEquipmentV2 | null => {
      if (!hasEquipment || !equipment || isSystemComponent) return null;
      
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
        sourceSlotIndex: slotIndex
      };
    },
    canDrag: () => hasEquipment && !isSystemComponent && !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [hasEquipment, equipment, isSystemComponent, disabled, location, slotIndex]);
  
  // Drop target setup
  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: 'equipment',
    canDrop: (item: DraggedEquipmentV2) => {
      // Always return false if disabled
      if (disabled) return false;
      
      // Check if this is the source slot of the current drag
      if (item.isFromCriticalSlot && 
          item.sourceLocation === location && 
          item.sourceSlotIndex === slotIndex) {
        return true; // Allow dropping back to the same slot
      }
      
      // Check if slot is empty
      if (hasEquipment) return false;
      
      // Convert DraggedEquipment to EquipmentObject if needed
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
      
      return canAccept(equipmentObj);
    },
    hover: (item: DraggedEquipmentV2, monitor) => {
      if (!onHoverChange || !monitor.isOver({ shallow: true })) return;
      
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
    drop: (item: DraggedEquipmentV2) => {
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
      draggedItem: monitor.getItem() as DraggedEquipmentV2 | null,
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
    if (!disabled && hasEquipment && !isSystemComponent && onRemove) {
      onRemove(location, slotIndex);
    }
  };

  // Clear hover when leaving
  useEffect(() => {
    if (!isOver && onHoverChange) {
      onHoverChange(false, null);
    }
  }, [isOver, onHoverChange]);

  // Determine slot styling
  const getSlotClassName = () => {
    const classes = [styles.slot];
    
    if (hasEquipment) {
      classes.push(styles.occupied);
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
