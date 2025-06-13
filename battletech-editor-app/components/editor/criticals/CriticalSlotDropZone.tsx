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
  canAccept?: (item: DraggedEquipment) => boolean;
  isOmniPodSlot?: boolean;
  disabled?: boolean;
}

export const CriticalSlotDropZone: React.FC<CriticalSlotDropZoneProps> = ({
  location,
  slotIndex,
  currentItem,
  isValid = true,
  onDrop,
  canAccept,
  isOmniPodSlot = false,
  disabled = false,
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
      if (currentItem && currentItem !== '-Empty-') return false;
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

  const isEmpty = !currentItem || currentItem === '-Empty-';
  const isHighlighted = isOver && canDrop;
  const isDragRejected = isOver && !canDrop;

  // Get display text
  const getDisplayText = () => {
    if (isEmpty) {
      return slotIndex === 0 ? `${location} - Empty -` : '- Empty -';
    }
    return currentItem;
  };

  // Determine slot styling
  const getSlotClassName = () => {
    let classNames = [styles.slot];
    
    if (isEmpty) classNames.push(styles.empty);
    if (!isValid) classNames.push(styles.invalid);
    if (isHighlighted) classNames.push(styles.highlighted);
    if (isDragRejected) classNames.push(styles.rejected);
    if (isOmniPodSlot) classNames.push(styles.omniPod);
    if (disabled) classNames.push(styles.disabled);
    
    return classNames.join(' ');
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
    >
      <span className={styles.slotNumber}>{slotIndex + 1}</span>
      <span className={styles.slotContent}>{getDisplayText()}</span>
      {isOmniPodSlot && <span className={styles.omniPodIndicator}>○</span>}
    </div>
  );
};

export default CriticalSlotDropZone;
