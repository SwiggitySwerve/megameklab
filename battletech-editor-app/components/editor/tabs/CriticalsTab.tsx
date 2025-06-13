import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { EditorComponentProps } from '../../../types/editor';
import { useCriticals } from '../hooks/useCriticals';
import MechCriticalsDiagram from '../criticals/MechCriticalsDiagram';
import EquipmentList from '../equipment/EquipmentList';
import { Mounted } from '../../../types/criticals';
import styles from './CriticalsTab.module.css';

const CriticalsTab: React.FC<EditorComponentProps> = ({
  unit,
  onUnitChange,
  validationErrors = [],
  readOnly = false,
}) => {
  const { addEquipment, removeEquipment } = useCriticals(unit);
  const equipment: Mounted[] = unit.data.weapons_and_equipment?.map(e => ({
    name: e.item_name,
    type: e.item_type,
    location: 0,
    criticals: 1,
  })) || [];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <div className={styles.equipmentColumn}>
          <EquipmentList equipment={equipment} />
        </div>
        <div className={styles.diagramColumn}>
          <MechCriticalsDiagram unit={unit} onDrop={addEquipment} onDoubleClick={removeEquipment} />
        </div>
      </div>
    </DndProvider>
  );
};

export default CriticalsTab;
