/**
 * Enhanced Equipment Panel Component
 * Shows unallocated equipment including unhittables with proper categorization
 */

import React, { useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { UnhittableComponent } from '../../../types/enhancedCriticals';
import styles from './EquipmentList.module.css';

interface EquipmentItem {
  id: string;
  name: string;
  slots: number;
  location?: string;
  weight?: number;
  damage?: number;
  heat?: number;
}

interface EnhancedEquipmentPanelProps {
  equipment: EquipmentItem[];
  unhittables: {
    structure: UnhittableComponent[];
    armor: UnhittableComponent[];
    special: UnhittableComponent[];
  };
  structureType?: string;
  armorType?: string;
  structureAllocated?: number;
  structureTotal?: number;
  armorAllocated?: number;
  armorTotal?: number;
  onDragStart?: (item: any) => void;
}

const ITEM_TYPE = 'equipment';

// Draggable equipment item component
const DraggableEquipmentItem: React.FC<{
  item: EquipmentItem | UnhittableComponent;
  isUnhittable?: boolean;
  onDragStart?: (item: any) => void;
}> = ({ item, isUnhittable = false, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: () => {
      const dragItem = {
        ...item,
        isFromInventory: true,
        isUnhittable
      };
      onDragStart?.(dragItem);
      return dragItem;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [item, isUnhittable, onDragStart]);
  
  const displayName = isUnhittable && 'displayName' in item ? item.displayName : item.name;
  
  return (
    <div
      ref={(node) => {
        if (node) drag(node);
      }}
      className={`${styles.equipmentItem} ${isDragging ? styles.dragging : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      title={`${displayName} (${item.slots} slot${item.slots > 1 ? 's' : ''})`}
    >
      <span className={styles.equipmentName}>{displayName}</span>
      <span className={styles.equipmentSlots}>({item.slots})</span>
    </div>
  );
};

export const EnhancedEquipmentPanel: React.FC<EnhancedEquipmentPanelProps> = ({
  equipment,
  unhittables,
  structureType,
  armorType,
  structureAllocated = 0,
  structureTotal = 0,
  armorAllocated = 0,
  armorTotal = 0,
  onDragStart
}) => {
  // Filter unallocated regular equipment
  const unallocatedEquipment = useMemo(() => {
    return equipment.filter(eq => !eq.location || eq.location === '');
  }, [equipment]);
  
  // Group equipment by category
  const groupedEquipment = useMemo(() => {
    const groups: Record<string, EquipmentItem[]> = {
      weapons: [],
      ammunition: [],
      equipment: [],
      other: []
    };
    
    unallocatedEquipment.forEach(item => {
      if (item.damage !== undefined && item.damage > 0) {
        groups.weapons.push(item);
      } else if (item.name.includes('Ammo') || item.name.includes('ammo')) {
        groups.ammunition.push(item);
      } else {
        groups.equipment.push(item);
      }
    });
    
    return groups;
  }, [unallocatedEquipment]);
  
  // Calculate allocation percentages
  const structurePercentage = structureTotal > 0 
    ? Math.round((structureAllocated / structureTotal) * 100) 
    : 0;
  const armorPercentage = armorTotal > 0 
    ? Math.round((armorAllocated / armorTotal) * 100) 
    : 0;
  
  return (
    <div className={styles.equipmentPanel}>
      <h3 className={styles.panelTitle}>Unallocated Equipment</h3>
      
      {/* Regular Equipment Sections */}
      {groupedEquipment.weapons.length > 0 && (
        <div className={styles.equipmentSection}>
          <h4 className={styles.sectionTitle}>Weapons</h4>
          <div className={styles.equipmentList}>
            {groupedEquipment.weapons.map((item, index) => (
              <DraggableEquipmentItem
                key={`weapon-${item.id}-${index}`}
                item={item}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </div>
      )}
      
      {groupedEquipment.ammunition.length > 0 && (
        <div className={styles.equipmentSection}>
          <h4 className={styles.sectionTitle}>Ammunition</h4>
          <div className={styles.equipmentList}>
            {groupedEquipment.ammunition.map((item, index) => (
              <DraggableEquipmentItem
                key={`ammo-${item.id}-${index}`}
                item={item}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </div>
      )}
      
      {groupedEquipment.equipment.length > 0 && (
        <div className={styles.equipmentSection}>
          <h4 className={styles.sectionTitle}>Equipment</h4>
          <div className={styles.equipmentList}>
            {groupedEquipment.equipment.map((item, index) => (
              <DraggableEquipmentItem
                key={`equipment-${item.id}-${index}`}
                item={item}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Unhittables - Structure */}
      {unhittables.structure.length > 0 && (
        <div className={`${styles.equipmentSection} ${styles.unhittableSection}`}>
          <h4 className={styles.sectionTitle}>
            {structureType} Structure Components
            <span className={styles.unhittableLabel}>(Unhittable)</span>
          </h4>
          <div className={styles.allocationStatus}>
            <div className={styles.allocationText}>
              {structureAllocated} / {structureTotal} allocated ({structurePercentage}%)
            </div>
            <div className={styles.allocationBar}>
              <div 
                className={styles.allocationProgress}
                style={{ 
                  width: `${structurePercentage}%`,
                  backgroundColor: structurePercentage === 100 ? '#4CAF50' : '#2196F3'
                }}
              />
            </div>
          </div>
          <div className={styles.equipmentList}>
            {unhittables.structure.map((item) => (
              <DraggableEquipmentItem
                key={item.id}
                item={item}
                isUnhittable
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Unhittables - Armor */}
      {unhittables.armor.length > 0 && (
        <div className={`${styles.equipmentSection} ${styles.unhittableSection}`}>
          <h4 className={styles.sectionTitle}>
            {armorType} Armor Components
            <span className={styles.unhittableLabel}>(Unhittable)</span>
          </h4>
          <div className={styles.allocationStatus}>
            <div className={styles.allocationText}>
              {armorAllocated} / {armorTotal} allocated ({armorPercentage}%)
            </div>
            <div className={styles.allocationBar}>
              <div 
                className={styles.allocationProgress}
                style={{ 
                  width: `${armorPercentage}%`,
                  backgroundColor: armorPercentage === 100 ? '#4CAF50' : '#FF9800'
                }}
              />
            </div>
          </div>
          <div className={styles.equipmentList}>
            {unhittables.armor.map((item) => (
              <DraggableEquipmentItem
                key={item.id}
                item={item}
                isUnhittable
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Unhittables - Special Systems */}
      {unhittables.special.length > 0 && (
        <div className={`${styles.equipmentSection} ${styles.unhittableSection}`}>
          <h4 className={styles.sectionTitle}>
            Special System Components
            <span className={styles.unhittableLabel}>(Unhittable)</span>
          </h4>
          <div className={styles.equipmentList}>
            {unhittables.special.map((item) => (
              <DraggableEquipmentItem
                key={item.id}
                item={item}
                isUnhittable
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {unallocatedEquipment.length === 0 && 
       unhittables.structure.length === 0 && 
       unhittables.armor.length === 0 && 
       unhittables.special.length === 0 && (
        <div className={styles.emptyState}>
          All equipment has been allocated
        </div>
      )}
    </div>
  );
};
