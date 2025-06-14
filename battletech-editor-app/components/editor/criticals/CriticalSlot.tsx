import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { DragItemType } from '../dnd/types';
import { CriticalSlot as CriticalSlotType, Mounted } from '../../../types/criticals';
import styles from './CriticalSlot.module.css';

interface CriticalSlotProps {
  slot: CriticalSlotType;
  location: string;
  index: number;
  onDrop: (equipment: Mounted, location: string, index: number) => void;
  onDoubleClick: () => void;
}

const CriticalSlot: React.FC<CriticalSlotProps> = ({
  slot,
  location,
  index,
  onDrop,
  onDoubleClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: DragItemType.EQUIPMENT,
    drop: (item: { equipment: Mounted }) => onDrop(item.equipment, location, index),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  drop(ref);

  const getSlotClass = () => {
    let className = styles.slot;
    if (isOver) {
      className += ` ${styles.isOver}`;
    } else {
      switch (slot.type) {
        case 'EMPTY':
          className += ` ${styles.empty}`;
          break;
        case 'SYSTEM':
          className += ` ${styles.system}`;
          break;
        case 'EQUIPMENT':
          className += ` ${styles.equipment}`;
          break;
      }
    }
    return className;
  };

  const renderContent = () => {
    if (slot.type === 'EQUIPMENT' && slot.mount) {
      return slot.mount.name;
    }
    if (slot.type === 'SYSTEM') {
      return slot.system;
    }
    return '-Empty-';
  };

  return (
    <div
      ref={ref}
      className={getSlotClass()}
      onDoubleClick={onDoubleClick}
    >
      {renderContent()}
    </div>
  );
};

export default CriticalSlot;
