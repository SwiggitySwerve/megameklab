import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../dnd/types';
import { Mounted } from '../../../types/criticals';
import styles from './DraggableEquipmentItem.module.css';

interface DraggableEquipmentItemProps {
  equipment: Mounted;
}

const DraggableEquipmentItem: React.FC<DraggableEquipmentItemProps> = ({ equipment }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EQUIPMENT,
    item: { equipment },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(ref);

  return (
    <div
      ref={ref}
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
    >
      {equipment.name}
    </div>
  );
};

export default DraggableEquipmentItem;
