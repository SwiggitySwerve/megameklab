import React from 'react';
import { FullUnit } from '../../../types';
import { CriticalSlotLocation } from '../../../types';
import { Mounted } from '../../../types/criticals';
import CriticalsGrid from './CriticalsGrid';
import styles from './MechCriticalsDiagram.module.css';

interface MechCriticalsDiagramProps {
  unit: FullUnit;
  onDrop: (equipment: Mounted, location: string, index: number) => void;
  onDoubleClick: (location: string, index: number) => void;
}

const MechCriticalsDiagram: React.FC<MechCriticalsDiagramProps> = ({ unit, onDrop, onDoubleClick }) => {
  const locations = unit.data.criticals || [];

  const getLocation = (name: string): CriticalSlotLocation | undefined => {
    return locations.find(loc => loc.location === name);
  }

  const parseSlots = (locationName: string) => {
    const location = getLocation(locationName);
    if (!location) {
      return [];
    }
    return location.slots.map(slot => {
      if (slot.toLowerCase().includes('roll again')) {
        return { type: 'SYSTEM' as const, system: slot };
      }
      if (slot.startsWith('-Empty-')) {
        return { type: 'EMPTY' as const };
      }
      // This is a simplification. A more robust solution would look up the equipment
      // details from the unit's equipment list.
      return { type: 'EQUIPMENT' as const, mount: { name: slot, type: 'Unknown', location: 0, criticals: 1 } };
    });
  };

  return (
    <div className={styles.diagram}>
      <div className={styles.head}>
        <CriticalsGrid location="Head" slots={parseSlots('Head')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
      <div className={styles['left-torso']}>
        <CriticalsGrid location="Left Torso" slots={parseSlots('Left Torso')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
      <div className={styles['center-torso']}>
        <CriticalsGrid location="Center Torso" slots={parseSlots('Center Torso')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
      <div className={styles['right-torso']}>
        <CriticalsGrid location="Right Torso" slots={parseSlots('Right Torso')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
      <div className={styles['left-arm']}>
        <CriticalsGrid location="Left Arm" slots={parseSlots('Left Arm')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
      <div className={styles['right-arm']}>
        <CriticalsGrid location="Right Arm" slots={parseSlots('Right Arm')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
      <div className={styles['left-leg']}>
        <CriticalsGrid location="Left Leg" slots={parseSlots('Left Leg')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
      <div className={styles['right-leg']}>
        <CriticalsGrid location="Right Leg" slots={parseSlots('Right Leg')} onDrop={onDrop} onDoubleClick={onDoubleClick} />
      </div>
    </div>
  );
};

export default MechCriticalsDiagram;
