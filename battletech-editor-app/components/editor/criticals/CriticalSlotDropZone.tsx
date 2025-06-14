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
  isHoveredMultiSlot?: boolean;
  onHoverChange?: (isHovering: boolean, item: DraggedEquipment | null) => void;
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
  isHoveredMultiSlot = false,
  onHoverChange,
}) => {
  // Force visual update when hover state changes
  const slotRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (slotRef.current) {
      if (isHoveredMultiSlot) {
        slotRef.current.style.backgroundColor = '#2563eb';
        slotRef.current.style.borderColor = '#60a5fa';
        slotRef.current.style.boxShadow = 'inset 0 0 0 2px rgba(96, 165, 250, 0.5)';
      } else {
        // Remove inline styles when not hovered
        slotRef.current.style.backgroundColor = '';
        slotRef.current.style.borderColor = '';
        slotRef.current.style.boxShadow = '';
      }
    }
  }, [isHoveredMultiSlot, location, slotIndex]);
  const acceptTypes = [
    DragItemType.EQUIPMENT,
    DragItemType.WEAPON,
    DragItemType.AMMO,
    DragItemType.SYSTEM,
  ];

  // Ensure consistent empty detection
  const isEmpty = isEmptySlot(currentItem);

  // Get equipment stats for draggable items
  const getEquipmentStats = (itemName: string, loc: string, slotIdx: number) => {
    if (!itemName || isEmptySlot(itemName)) return null;
    
    // First try to find in equipment database
    const equipment = EQUIPMENT_DATABASE.find(e => e.name === itemName);
    if (equipment) {
      return {
        criticalSlots: equipment.crits,
        weight: equipment.weight,
      };
    }
    
    // If not found, count how many consecutive slots have this equipment
    // This is important for equipment that might not be in the database
    // or when the name doesn't match exactly
    let critSlots = 1;
    
    // We need to access parent component's slot data to count properly
    // For now, use a reasonable default based on equipment type
    if (itemName.includes('Double Heat Sink')) {
      critSlots = itemName.includes('Clan') ? 2 : 3;
    } else if (itemName.includes('Heat Sink')) {
      critSlots = 1;
    }
    
    return { criticalSlots: critSlots, weight: 1 };
  };

  // Ensure we have valid content before enabling drag
  const hasValidContent = !isEmptySlot(currentItem) && !disabled && !isSystemComponent;
  
  // Drag functionality for filled slots - only create if we have content
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragItemType.EQUIPMENT,
    item: () => {
      // Only create drag item if slot has valid content
      if (!hasValidContent || isEmptySlot(currentItem) || !currentItem) return null;
      
      const stats = getEquipmentStats(currentItem, location, slotIndex);
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
    canDrag: () => hasValidContent,
    end: (item, monitor) => {
      // If the item was dropped successfully, remove it from source
      if (monitor.didDrop() && onRemove && item) {
        // Only remove if it was dropped in a different location or slot
        const dropResult = monitor.getDropResult() as any;
        if (dropResult && (dropResult.location !== location || dropResult.slotIndex !== slotIndex)) {
          onRemove(location, slotIndex);
        }
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [currentItem, hasValidContent, disabled, isSystemComponent, location, slotIndex, onRemove]);

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: acceptTypes,
    canDrop: (item: DraggedEquipment) => {
      // Only log for Left Torso to reduce spam
      if (location === 'Left Torso' && slotIndex < 6) {
        console.log(`[DROP ZONE ${location}:${slotIndex}] canDrop check:`, {
          item: item?.name,
          disabled,
          currentItem,
          currentItemType: typeof currentItem,
          currentItemValue: currentItem === null ? 'null' : currentItem === undefined ? 'undefined' : `"${currentItem}"`,
          isEmpty: isEmptySlot(currentItem),
          canAcceptResult: canAccept ? canAccept(item) : 'no canAccept function'
        });
      }
      
      if (disabled) return false;
      // Check if slot is empty using the same helper function
      const slotIsEmpty = isEmptySlot(currentItem);
      if (!slotIsEmpty) {
        return false;
      }
      if (canAccept) {
        const result = canAccept(item);
        return result;
      }
      return true;
    },
    drop: (item: DraggedEquipment) => {
      console.log(`[DROP ZONE ${location}:${slotIndex}] DROP!`, item);
      onDrop(item, location, slotIndex);
      // Return drop result so drag end handler can check where item was dropped
      return { location, slotIndex };
    },
    hover: (item: DraggedEquipment, monitor) => {
      // Remove hover logging to reduce noise
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem() as DraggedEquipment | null,
    }),
  });

  // Handle hover state changes
  useEffect(() => {
    if (onHoverChange) {
      if (isOver && draggedItem) {
        console.log(`[DROP ZONE ${location}:${slotIndex}] Hover state change - isOver: true, item:`, draggedItem.name);
        // Always call onHoverChange when hovering with an item, regardless of canDrop
        // This ensures multi-slot highlighting works even when hovering over occupied slots
        onHoverChange(true, draggedItem);
      } else if (!isOver) {
        // Clear hover when not over
        onHoverChange(false, null);
      }
    }
    // Note: onHoverChange is intentionally not in the dependency array to prevent infinite loops
    // when the parent component passes an inline function. The effect should only run when
    // isOver or draggedItem changes.
  }, [isOver, draggedItem, location, slotIndex]);

  const isHighlighted = isOver && canDrop;
  const isDragRejected = isOver && !canDrop;

  // Get display text
  const getDisplayText = () => {
    if (isEmpty || !currentItem || currentItem === '') {
      return ''; // Return empty string for empty slots
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
    if (isHoveredMultiSlot) classNames.push(styles.hoveredMultiSlot);
    
    // Add draggable class for non-empty, non-system slots
    if (hasValidContent) {
      classNames.push(styles.draggable);
    }
    
    return classNames.join(' ');
  };

  // Handle double-click to remove equipment
  const handleDoubleClick = () => {
    // Re-evaluate empty state at click time
    const isCurrentlyEmpty = isEmptySlot(currentItem);
    
    // Only remove if there's equipment and it's not internal structure
    if (!isCurrentlyEmpty && !disabled) {
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
      // Only attach drag if the slot has valid content
      if (hasValidContent) {
        drag(combinedRef.current);
      } else {
        // Important: detach drag if the slot is empty or disabled
        drag(null);
      }
      // Also set the slot ref
      slotRef.current = combinedRef.current;
    }
  }, [drop, drag, hasValidContent]);

  return (
    <div 
      ref={combinedRef}
      className={getSlotClassName()}
      data-location={location}
      data-slot={slotIndex}
      onDoubleClick={handleDoubleClick}
      style={{ 
        cursor: (hasValidContent && onRemove) ? 'move' : 'default'
      }}
      title={(hasValidContent && onRemove) ? 'Drag to move or double-click to remove' : undefined}
    >
      <span className={styles.slotNumber}>{slotIndex + 1}</span>
      <span className={styles.slotContent}>{getDisplayText()}</span>
      {isOmniPodSlot && <span className={styles.omniPodIndicator}>○</span>}
    </div>
  );
};

export default CriticalSlotDropZone;
