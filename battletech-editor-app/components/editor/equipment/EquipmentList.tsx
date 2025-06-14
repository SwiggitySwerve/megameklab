import React from 'react';
import { Mounted } from '../../../types/criticals';
import { FullEquipment } from '../../../types';
import DraggableEquipmentItem from './DraggableEquipmentItem';
import styles from './EquipmentList.module.css';

interface EquipmentListProps {
  equipment: Mounted[];
}

const EquipmentList: React.FC<EquipmentListProps> = ({ equipment }) => {
  // Convert Mounted to FullEquipment format for compatibility
  const convertToFullEquipment = (mounted: Mounted, index: number): FullEquipment => {
    return {
      id: `${mounted.name}-${index}`, // Generate ID from name and index
      name: mounted.name,
      type: mounted.type,
      weight: mounted.weight || 0,
      space: mounted.criticals || 0,
      damage: mounted.damage,
      heat: mounted.heat,
      tech_base: mounted.techBase || 'IS',
      rules_level: mounted.rulesLevel,
      year: mounted.year,
      bv: mounted.bv,
      cost: mounted.cost,
      data: {
        slots: mounted.criticals || 0,
        ...mounted
      }
    } as FullEquipment;
  };

  return (
    <div className={styles.list}>
      <h3 className={styles.title}>Equipment</h3>
      {equipment.map((item, index) => (
        <DraggableEquipmentItem 
          key={index} 
          equipment={convertToFullEquipment(item, index)} 
        />
      ))}
    </div>
  );
};

export default EquipmentList;
