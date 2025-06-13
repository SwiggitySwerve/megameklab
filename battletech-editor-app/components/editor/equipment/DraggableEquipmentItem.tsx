import React, { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { FullEquipment } from '../../../types';
import { DragItemType, DraggedEquipment } from '../dnd/types';
import styles from './DraggableEquipmentItem.module.css';

export interface DraggableEquipmentItemProps {
  equipment: FullEquipment;
  quantity?: number;
  onRemove?: (equipmentId: string) => void;
  isCompact?: boolean;
  showDetails?: boolean;
  currentLocation?: string;
}

export const DraggableEquipmentItem: React.FC<DraggableEquipmentItemProps> = ({
  equipment,
  quantity = 1,
  onRemove,
  isCompact = false,
  showDetails = true,
  currentLocation,
}) => {
  const getDragItemType = (): DragItemType => {
    const type = equipment.type?.toLowerCase() || '';
    if (type.includes('weapon')) return DragItemType.WEAPON;
    if (type.includes('ammo')) return DragItemType.AMMO;
    if (type.includes('system')) return DragItemType.SYSTEM;
    return DragItemType.EQUIPMENT;
  };

  const dragItem: DraggedEquipment = {
    type: getDragItemType(),
    equipmentId: equipment.id,
    name: equipment.name,
    weight: equipment.weight || 0,
    criticalSlots: equipment.space || (typeof equipment.data?.slots === 'number' ? equipment.data.slots : Number(equipment.data?.slots) || 0),
    location: currentLocation,
  };

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: dragItem.type,
    item: dragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [equipment.id, currentLocation]);

  // Use native drag preview for better performance
  useEffect(() => {
    preview(null, { captureDraggingState: true });
  }, [preview]);

  const getEquipmentStats = () => {
    const stats = [];
    
    // Weight
    if (equipment.weight) {
      stats.push(`${equipment.weight}t`);
    }
    
    // Critical slots
    if (equipment.space) {
      stats.push(`${equipment.space} crits`);
    } else if (equipment.data?.slots) {
      stats.push(`${equipment.data.slots} crits`);
    }
    
    // Damage for weapons
    if (equipment.damage) {
      stats.push(`${equipment.damage} dmg`);
    }
    
    // Heat for weapons
    if (equipment.heat) {
      stats.push(`${equipment.heat} heat`);
    }
    
    return stats.join(' • ');
  };

  const displayName = quantity > 1 ? `${equipment.name} x${quantity}` : equipment.name;
  const totalWeight = equipment.weight ? equipment.weight * quantity : 0;
  const slots = equipment.space || (typeof equipment.data?.slots === 'number' ? equipment.data.slots : Number(equipment.data?.slots) || 0);
  const totalSlots = slots * quantity;

  // Use ref to attach drag
  const dragRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (dragRef.current) {
      drag(dragRef.current);
    }
  }, [drag]);

  return (
    <div 
      ref={dragRef}
      className={`${styles.container} ${isCompact ? styles.compact : ''} ${isDragging ? styles.dragging : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className={styles.dragHandle}>⋮⋮</div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.nameSection}>
            <span className={styles.name}>{displayName}</span>
            {equipment.tech_base && (
              <span className={styles.techBase}>{equipment.tech_base}</span>
            )}
          </div>
          {onRemove && (
            <button
              className={styles.removeButton}
              onClick={() => onRemove(equipment.id)}
              aria-label={`Remove ${equipment.name}`}
            >
              ×
            </button>
          )}
        </div>
        
        {showDetails && !isCompact && (
          <div className={styles.details}>
            <span className={styles.stats}>{getEquipmentStats()}</span>
            {quantity > 1 && (
              <span className={styles.totals}>
                Total: {totalWeight}t, {totalSlots} crits
              </span>
            )}
          </div>
        )}
        
        {currentLocation && (
          <div className={styles.location}>
            <span className={styles.locationLabel}>Location:</span>
            <span className={styles.locationName}>{currentLocation}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableEquipmentItem;
