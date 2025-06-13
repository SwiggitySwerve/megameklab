import React, { useEffect, useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { DragItemType, DraggedEquipment } from '../dnd/types';
import styles from './CriticalSlotDropZone.module.css';
import { EQUIPMENT_DATABASE } from '../../../utils/equipmentData';

export interface CriticalSlotDropZoneProps {
  location: string;
  slotIndex: number;
  currentItem?: string;
  isValid?: boolean;
  onDrop: (item: DraggedEquipment, location: string, slotIndex: number) => void;
  onRemove?: (location: string, slotIndex: number) => void;
  canAccept?: (item: DraggedEquipment) => boolean;
  isOmniPodSlot?: boolean;
  disabled?: boolean;
  isSystemComponent?: boolean;
  onSystemClick?: () => void;
  isStartOfGroup?: boolean;
  isEndOfGroup?: boolean;
  isMiddleOfGroup?: boolean;
}

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

export const CriticalSlotDropZone: React.FC<CriticalSlotDropZoneProps> = ({
  location,
  slotIndex,
  currentItem,
  isValid = true,
  onDrop,
  onRemove,
  canAccept,
  isOmniPodSlot = false,
  disabled = false,
  isSystemComponent = false,
  onSystemClick,
  isStartOfGroup = false,
  isEndOfGroup = false,
  isMiddleOfGroup = false,
}) => {
  const acceptTypes = [
    DragItemType.EQUIPMENT,
    DragItemType.WEAPON,
    DragItemType.AMMO,
    DragItemType.SYSTEM,
  ];

  const isEmpty = isEmptySlot(currentItem);

  // Get equipment stats for draggable items
  const getEquipmentStats = () => {
    if (isEmpty || !currentItem) return null;
    
    const equipment = EQUIPMENT_DATABASE.find(e => e.name === currentItem);
    if (equipment) {
      return {
        criticalSlots: equipment.crits,
        weight: equipment.weight,
      };
    }
    
    // Default fallback
    return { criticalSlots: 1, weight: 1 };
  };

  // Drag functionality for filled slots
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragItemType.EQUIPMENT,
    item: () => {
      if (isEmpty || disabled || isSystemComponent) return null;
      
      const stats = getEquipmentStats();
      if (!stats) return null;

      // Don't remove yet - wait for successful drop
      return {
        equipmentId: `${currentItem}-${location}-${slotIndex}`,
        name: currentItem,
        type: DragItemType.EQUIPMENT,
        criticalSlots: stats.criticalSlots,
        weight: stats.weight,
        sourceLocation: location,
        sourceSlotIndex: slotIndex,
        isFromCriticalSlot: true, // Flag to indicate this is from a critical slot
      } as DraggedEquipment;
    },
    canDrag: !isEmpty && !disabled && !isSystemComponent && !isMiddleOfGroup && !isEndOfGroup,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [currentItem, isEmpty, disabled, isSystemComponent, location, slotIndex, isMiddleOfGroup, isEndOfGroup]);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: acceptTypes,
    canDrop: (item: DraggedEquipment) => {
      if (disabled) return false;
      if (!isEmptySlot(currentItem)) return false;
      if (canAccept) return canAccept(item);
      return true;
    },
    drop: (item: DraggedEquipment) => {
      onDrop(item, location, slotIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [location, slotIndex, currentItem, canAccept, disabled]);

  const isHighlighted = isOver && canDrop;
  const isDragRejected = isOver && !canDrop;

  // Get display text
  const getDisplayText = () => {
    if (isEmpty) {
      return slotIndex === 0 ? `${location} - Empty -` : '- Empty -';
    }
    return currentItem;
  };

  // State for showing system component feedback
  const [showSystemFeedback, setShowSystemFeedback] = React.useState(false);

  // Determine slot styling
  const getSlotClassName = () => {
    let classNames = [styles.slot];
    
    if (isEmpty) classNames.push(styles.empty);
    if (!isValid) classNames.push(styles.invalid);
    if (isHighlighted) classNames.push(styles.highlighted);
    if (isDragRejected) classNames.push(styles.rejected);
    if (isOmniPodSlot) classNames.push(styles.omniPod);
    if (disabled) classNames.push(styles.disabled);
    if (showSystemFeedback) classNames.push(styles.systemProtected);
    if (isDragging) classNames.push(styles.dragging);
    
    // Multi-slot grouping classes
    if (isStartOfGroup) classNames.push(styles.groupStart);
    if (isMiddleOfGroup) classNames.push(styles.groupMiddle);
    if (isEndOfGroup) classNames.push(styles.groupEnd);
    
    // Add draggable class for non-empty, non-system slots
    if (!isEmpty && !disabled && !isSystemComponent && !isMiddleOfGroup && !isEndOfGroup) {
      classNames.push(styles.draggable);
    }
    
    return classNames.join(' ');
  };

  // Handle click to remove equipment
  const handleClick = () => {
    // Only remove if there's equipment and it's not internal structure
    if (!isEmpty && !disabled) {
      if (isSystemComponent && onSystemClick) {
        // Show visual feedback for protected system component
        setShowSystemFeedback(true);
        setTimeout(() => setShowSystemFeedback(false), 1000);
        onSystemClick();
      } else if (onRemove) {
        onRemove(location, slotIndex);
      }
    }
  };

  // Combine drag and drop refs
  const combinedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (combinedRef.current) {
      drop(combinedRef.current);
      // Only attach drag if the slot is draggable
      if (!isEmpty && !disabled && !isSystemComponent && !isMiddleOfGroup && !isEndOfGroup) {
        drag(combinedRef.current);
      }
    }
  }, [drop, drag, isEmpty, disabled, isSystemComponent, isMiddleOfGroup, isEndOfGroup]);

  return (
    <div 
      ref={combinedRef}
      className={getSlotClassName()}
      data-location={location}
      data-slot={slotIndex}
      onClick={handleClick}
      style={{ cursor: !isEmpty && onRemove && !disabled ? 'move' : 'default' }}
      title={!isEmpty && onRemove && !disabled ? 'Drag to move or click to remove' : undefined}
    >
      <span className={styles.slotNumber}>{slotIndex + 1}</span>
      <span className={styles.slotContent}>{getDisplayText()}</span>
      {isOmniPodSlot && <span className={styles.omniPodIndicator}>○</span>}
    </div>
  );
};

export default CriticalSlotDropZone;
