import React from 'react';
import { CriticalSlot as CriticalSlotType, Mounted } from '../../../types/criticals';
import CriticalSlot from './CriticalSlot';
import styles from './CriticalsGrid.module.css';

interface CriticalsGridProps {
  slots: CriticalSlotType[];
  location: string;
  onDrop: (equipment: Mounted, location: string, index: number) => void;
  onDoubleClick: (location: string, index: number) => void;
}

const CriticalsGrid: React.FC<CriticalsGridProps> = ({
  slots,
  location,
  onDrop,
  onDoubleClick,
}) => {
  return (
    <div className={styles.grid}>
      <div className={styles.location}>{location}</div>
      {slots.map((slot, index) => (
        <CriticalSlot
          key={index}
          slot={slot}
          location={location}
          index={index}
          onDrop={onDrop}
          onDoubleClick={() => onDoubleClick(location, index)}
        />
      ))}
    </div>
  );
};

export default CriticalsGrid;
