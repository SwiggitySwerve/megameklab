import React from 'react';
import { Mounted } from '../../../types/criticals';
import DraggableEquipmentItem from './DraggableEquipmentItem';
import styles from './EquipmentList.module.css';

interface EquipmentListProps {
  equipment: Mounted[];
}

const EquipmentList: React.FC<EquipmentListProps> = ({ equipment }) => {
  return (
    <div className={styles.list}>
      <h3 className={styles.title}>Equipment</h3>
      {equipment.map((item, index) => (
        <DraggableEquipmentItem key={index} equipment={item} />
      ))}
    </div>
  );
};

export default EquipmentList;
