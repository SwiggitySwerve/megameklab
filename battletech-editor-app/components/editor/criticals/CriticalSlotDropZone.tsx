import React, { useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { DragItemType, DraggedEquipment } from '../dnd/types';
import styles from './CriticalSlotDropZone.module.css';

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
}) => {
  const acceptTypes = [
    DragItemType.EQUIPMENT,
    DragItemType.WEAPON,
    DragItemType.AMMO,
    DragItemType.SYSTEM,
  ];

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

  const isEmpty = isEmptySlot(currentItem);
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

  // Use ref to attach drop
  const dropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef.current);
    }
  }, [drop]);

  return (
    <div 
      ref={dropRef}
      className={getSlotClassName()}
      data-location={location}
      data-slot={slotIndex}
      onClick={handleClick}
      style={{ cursor: !isEmpty && onRemove && !disabled ? 'pointer' : 'default' }}
      title={!isEmpty && onRemove && !disabled ? 'Click to remove equipment' : undefined}
    >
      <span className={styles.slotNumber}>{slotIndex + 1}</span>
      <span className={styles.slotContent}>{getDisplayText()}</span>
      {isOmniPodSlot && <span className={styles.omniPodIndicator}>○</span>}
    </div>
  );
};

export default CriticalSlotDropZone;
