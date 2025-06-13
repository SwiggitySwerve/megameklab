import React from 'react';
import { useDrop } from 'react-dnd';
import { FullEquipment } from '../../../types/index';
import { MechLocation } from '../../../types/editor';
import { DraggedEquipment } from '../dnd/types';
import styles from './EnhancedCriticalSlotDropZone.module.css';

interface EnhancedCriticalSlotDropZoneProps {
  location: MechLocation;
  slotIndex: number;
  equipment?: FullEquipment;
  systemType?: string;
  isFixed: boolean;
  isEmpty: boolean;
  isSelected?: boolean;
  onEquipmentDrop: (equipmentId: string, location: MechLocation, slotIndex: number) => void;
  onEquipmentRemove?: (location: MechLocation, slotIndex: number) => void;
  onSlotClick?: (location: MechLocation, slotIndex: number) => void;
  getEquipmentById?: (id: string) => FullEquipment | undefined;
  showTooltip?: boolean;
  isValidDropTarget?: boolean;
  slotsSpanned?: number; // For multi-slot equipment
  isMultiSlotStart?: boolean;
  isMultiSlotContinuation?: boolean;
}

export const EnhancedCriticalSlotDropZone: React.FC<EnhancedCriticalSlotDropZoneProps> = ({
  location,
  slotIndex,
  equipment,
  systemType,
  isFixed,
  isEmpty,
  isSelected = false,
  onEquipmentDrop,
  onEquipmentRemove,
  onSlotClick,
  getEquipmentById,
  showTooltip = true,
  isValidDropTarget = true,
  slotsSpanned = 1,
  isMultiSlotStart = false,
  isMultiSlotContinuation = false,
}) => {
  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: 'equipment',
    drop: (item: DraggedEquipment) => {
      if (canDrop && item.equipmentId) {
        onEquipmentDrop(item.equipmentId, location, slotIndex);
      }
    },
    canDrop: (item: DraggedEquipment) => {
      if (!isValidDropTarget || isFixed || !isEmpty) return false;
      
      // Check if equipment can fit using the criticalSlots from drag item
      const slotsNeeded = item.criticalSlots || 1;
      
      // This would need to be validated by parent component
      // For now, allow single slot drops
      return slotsNeeded <= 1 || isMultiSlotStart;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem() as DraggedEquipment,
    }),
  });

  const getCriticalSlots = (equipment: FullEquipment): number => {
    if (equipment.space) return Number(equipment.space);
    if (equipment.data?.slots) return Number(equipment.data.slots);
    if (equipment.data?.critical_slots) return Number(equipment.data.critical_slots);
    return 1;
  };

  const handleClick = () => {
    if (onSlotClick) {
      onSlotClick(location, slotIndex);
    }
  };

  const handleDoubleClick = () => {
    if (!isFixed && !isEmpty && onEquipmentRemove) {
      onEquipmentRemove(location, slotIndex);
    }
  };

  const getSlotContent = () => {
    if (isFixed && systemType) {
      return getSystemDisplayName(systemType);
    }
    if (equipment) {
      return equipment.name;
    }
    if (isEmpty) {
      return '- Empty -';
    }
    return '- Unknown -';
  };

  const getSystemDisplayName = (type: string): string => {
    const systemNames: Record<string, string> = {
      'engine': 'Fusion Engine',
      'gyro': 'Gyro',
      'cockpit': 'Cockpit',
      'lifesupport': 'Life Support',
      'sensors': 'Sensors',
      'actuator': 'Actuator',
    };
    return systemNames[type] || type;
  };

  const getSlotClassName = () => {
    const classes = [styles.criticalSlot];
    
    if (isFixed) classes.push(styles.fixedSlot);
    if (isEmpty) classes.push(styles.emptySlot);
    if (equipment && !isFixed) classes.push(styles.equipmentSlot);
    if (isSelected) classes.push(styles.selectedSlot);
    if (isOver && canDrop) classes.push(styles.dropHighlight);
    if (isOver && !canDrop) classes.push(styles.invalidDrop);
    if (isMultiSlotStart) classes.push(styles.multiSlotStart);
    if (isMultiSlotContinuation) classes.push(styles.multiSlotContinuation);
    
    return classes.join(' ');
  };

  const getTooltipContent = () => {
    if (equipment) {
      return `${equipment.name}\nType: ${equipment.type}\nWeight: ${equipment.weight || 'Unknown'}\nSlots: ${getCriticalSlots(equipment)}`;
    }
    if (systemType) {
      return `${getSystemDisplayName(systemType)}\nSystem Component (Fixed)`;
    }
    return `Empty Critical Slot\nLocation: ${location}\nSlot: ${slotIndex + 1}`;
  };

  return (
    <div
      ref={drop as any}
      className={getSlotClassName()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={showTooltip ? getTooltipContent() : undefined}
      data-location={location}
      data-slot={slotIndex}
    >
      <div className={styles.slotContent}>
        <span className={styles.slotIndex}>{slotIndex + 1}</span>
        <span className={styles.slotText}>{getSlotContent()}</span>
        {slotsSpanned > 1 && (
          <span className={styles.slotSpan}>({slotsSpanned})</span>
        )}
      </div>
      
      {equipment && !isFixed && (
        <div className={styles.equipmentInfo}>
          <span className={styles.equipmentType}>{equipment.type}</span>
          {equipment.weight && (
            <span className={styles.equipmentWeight}>{equipment.weight}t</span>
          )}
        </div>
      )}
      
      {isOver && canDrop && (
        <div className={styles.dropIndicator}>
          Drop Here
        </div>
      )}
      
      {isOver && !canDrop && (
        <div className={styles.invalidDropIndicator}>
          Cannot Place
        </div>
      )}
    </div>
  );
};

export default EnhancedCriticalSlotDropZone;
