/**
 * Enhanced Critical Slot Component
 * Displays a single critical slot with support for the enhanced data model
 */

import React, { useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { EnhancedCriticalSlot as EnhancedCriticalSlotType } from '../../../types/enhancedCriticals';
import styles from './CriticalSlot.module.css';

interface EnhancedCriticalSlotProps {
  slot: EnhancedCriticalSlotType | null;
  location: string;
  index: number;
  onDoubleClick?: (location: string, index: number) => void;
  isDropTarget?: boolean;
  isValidDropTarget?: boolean;
  isDragging?: boolean;
}

const ITEM_TYPE = 'equipment';

export const EnhancedCriticalSlot: React.FC<EnhancedCriticalSlotProps> = ({
  slot,
  location,
  index,
  onDoubleClick,
  isDropTarget,
  isValidDropTarget,
  isDragging
}) => {
  // Determine display content
  const displayContent = useMemo(() => {
    if (!slot || slot.content === null) {
      return '- Empty -';
    }
    
    // For unhittables, show the display name if available
    if (slot.contentType === 'unhittable' && slot.parentComponent) {
      const parts = slot.content.split(' ');
      const baseName = parts.slice(0, -1).join(' ') || slot.content;
      return baseName; // The displayName from UnhittableComponent includes count
    }
    
    return slot.content;
  }, [slot]);
  
  // Determine slot style based on content type
  const slotClassName = useMemo(() => {
    const classes = [styles.slot];
    
    if (!slot || slot.content === null) {
      classes.push(styles.empty);
    } else {
      switch (slot.contentType) {
        case 'system':
          classes.push(styles.system);
          break;
        case 'unhittable':
          classes.push(styles.unhittable);
          if (slot.unhittableType === 'structure') {
            classes.push(styles.structureUnhittable);
          } else if (slot.unhittableType === 'armor') {
            classes.push(styles.armorUnhittable);
          } else if (slot.unhittableType === 'special') {
            classes.push(styles.specialUnhittable);
          }
          break;
        case 'equipment':
        default:
          classes.push(styles.equipment);
          break;
      }
    }
    
    if (slot?.isFixed) {
      classes.push(styles.fixed);
    }
    
    if (isDropTarget) {
      classes.push(styles.dropTarget);
    }
    
    if (isValidDropTarget) {
      classes.push(styles.validDropTarget);
    }
    
    if (isDragging) {
      classes.push(styles.dragging);
    }
    
    // Multi-slot styling
    if (slot?.multiSlotGroup) {
      classes.push(styles.multiSlot);
      // Determine if this is the first, middle, or last slot
      // This would require additional props or context
    }
    
    return classes.join(' ');
  }, [slot, isDropTarget, isValidDropTarget, isDragging]);
  
  // Setup drag functionality
  const [{ isDraggingItem }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: () => {
      if (!slot || !slot.content || slot.isFixed) return null;
      
      return {
        id: slot.equipmentId,
        name: slot.content,
        slots: 1, // This would need to be calculated for multi-slot items
        sourceLocation: location,
        sourceSlotIndex: index,
        contentType: slot.contentType,
        unhittableType: slot.unhittableType,
        multiSlotGroup: slot.multiSlotGroup
      };
    },
    canDrag: () => {
      return slot !== null && slot.content !== null && !slot.isFixed;
    },
    collect: (monitor) => ({
      isDraggingItem: monitor.isDragging()
    })
  }), [slot, location, index]);
  
  // Handle double-click to remove
  const handleDoubleClick = () => {
    if (onDoubleClick && slot && slot.content && !slot.isFixed) {
      onDoubleClick(location, index);
    }
  };
  
  // Tooltip content
  const tooltipContent = useMemo(() => {
    if (!slot || !slot.content) return undefined;
    
    const parts = [`${location} - Slot ${index + 1}`];
    
    if (slot.contentType === 'unhittable') {
      parts.push(`Type: ${slot.unhittableType} (unhittable)`);
      if (slot.parentComponent) {
        parts.push(`System: ${slot.parentComponent}`);
      }
    } else {
      parts.push(`Type: ${slot.contentType}`);
    }
    
    if (slot.isFixed) {
      parts.push('Fixed - Cannot be removed');
    }
    
    if (slot.lastModified) {
      parts.push(`Last modified: ${new Date(slot.lastModified).toLocaleString()}`);
    }
    
    return parts.join('\n');
  }, [slot, location, index]);
  
  return (
    <div
      ref={(node) => {
        if (node) drag(node);
      }}
      className={slotClassName}
      onDoubleClick={handleDoubleClick}
      title={tooltipContent}
      style={{
        opacity: isDraggingItem ? 0.5 : 1,
        cursor: slot?.content && !slot.isFixed ? 'move' : 'default'
      }}
    >
      <span className={styles.slotNumber}>{index + 1}.</span>
      <span className={styles.slotContent}>{displayContent}</span>
      {slot?.isFixed && <span className={styles.fixedIcon}>🔒</span>}
      {slot?.contentType === 'unhittable' && (
        <span className={styles.unhittableIcon}>◆</span>
      )}
    </div>
  );
};
