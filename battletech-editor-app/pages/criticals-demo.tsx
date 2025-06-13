import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Layout from '../components/common/Layout';
import { InteractiveMechArmorDiagram } from '../components/editor/armor/InteractiveMechArmorDiagram';
import { MechCriticalsAllocationGrid } from '../components/editor/criticals/MechCriticalsAllocationGrid';
import { DraggableEquipmentItem } from '../components/editor/equipment/DraggableEquipmentItem';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { DraggedEquipment } from '../components/editor/dnd/types';
import styles from '../styles/demo.module.css';

const mockUnit = {
  id: 'demo-atlas',
  tonnage: 100,
  chassis: 'Atlas',
  model: 'AS7-D',
  armorType: 'Standard',
  armorTonnage: 19,
  armorAllocation: {
    [MECH_LOCATIONS.HEAD]: { front: 9, rear: 0, maxArmor: 9, type: 'Standard' as any },
    [MECH_LOCATIONS.CENTER_TORSO]: { front: 47, rear: 12, maxArmor: 63, type: 'Standard' as any },
    [MECH_LOCATIONS.LEFT_TORSO]: { front: 32, rear: 10, maxArmor: 42, type: 'Standard' as any },
    [MECH_LOCATIONS.RIGHT_TORSO]: { front: 32, rear: 10, maxArmor: 42, type: 'Standard' as any },
    [MECH_LOCATIONS.LEFT_ARM]: { front: 34, rear: 0, maxArmor: 34, type: 'Standard' as any },
    [MECH_LOCATIONS.RIGHT_ARM]: { front: 34, rear: 0, maxArmor: 34, type: 'Standard' as any },
    [MECH_LOCATIONS.LEFT_LEG]: { front: 41, rear: 0, maxArmor: 41, type: 'Standard' as any },
    [MECH_LOCATIONS.RIGHT_LEG]: { front: 41, rear: 0, maxArmor: 41, type: 'Standard' as any },
  },
  criticalSlots: {
    [MECH_LOCATIONS.HEAD]: [],
    [MECH_LOCATIONS.CENTER_TORSO]: [],
    [MECH_LOCATIONS.LEFT_TORSO]: ['LRM 20', 'LRM 20', 'LRM 20', 'LRM 20', 'LRM 20'],
    [MECH_LOCATIONS.RIGHT_TORSO]: ['AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20', 'AC/20'],
    [MECH_LOCATIONS.LEFT_ARM]: [],
    [MECH_LOCATIONS.RIGHT_ARM]: [],
    [MECH_LOCATIONS.LEFT_LEG]: [],
    [MECH_LOCATIONS.RIGHT_LEG]: [],
  } as any,
  equipment: [],
};

const availableEquipment = [
  { id: 'heat-sink', name: 'Heat Sink', weight: 1.0, criticalSlots: 1, damage: 0, heat: 0, type: 'Heat Management' },
  { id: 'dhs', name: 'Double Heat Sink', weight: 1.0, criticalSlots: 3, damage: 0, heat: 0, type: 'Heat Management' },
  { id: 'medium-laser', name: 'Medium Laser', weight: 1.0, criticalSlots: 1, damage: 5, heat: 3, type: 'Energy' },
  { id: 'large-laser', name: 'Large Laser', weight: 5.0, criticalSlots: 2, damage: 8, heat: 8, type: 'Energy' },
  { id: 'ppc', name: 'PPC', weight: 7.0, criticalSlots: 3, damage: 10, heat: 10, type: 'Energy' },
  { id: 'ac5', name: 'AC/5', weight: 8.0, criticalSlots: 4, damage: 5, heat: 1, type: 'Ballistic' },
  { id: 'ac10', name: 'AC/10', weight: 12.0, criticalSlots: 7, damage: 10, heat: 3, type: 'Ballistic' },
  { id: 'lrm10', name: 'LRM 10', weight: 5.0, criticalSlots: 2, damage: 10, heat: 4, type: 'Missile' },
  { id: 'lrm15', name: 'LRM 15', weight: 7.0, criticalSlots: 3, damage: 15, heat: 5, type: 'Missile' },
  { id: 'srm6', name: 'SRM 6', weight: 3.0, criticalSlots: 2, damage: 12, heat: 4, type: 'Missile' },
];

export default function CriticalsDemo() {
  const [unit, setUnit] = useState<EditableUnit>(mockUnit as unknown as EditableUnit);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleArmorChange = (location: string, front: number, rear?: number) => {
    setUnit(prevUnit => ({
      ...prevUnit,
      armorAllocation: {
        ...prevUnit.armorAllocation,
        [location]: {
          ...prevUnit.armorAllocation[location],
          front,
          rear: rear || prevUnit.armorAllocation[location]?.rear || 0,
        },
      },
    }));
  };

  const handleEquipmentPlace = (equipment: DraggedEquipment, location: string, slotIndex: number) => {
    setUnit(prevUnit => {
      const newCriticalSlots = { ...prevUnit.criticalSlots };
      const locationSlots = [...((newCriticalSlots as any)[location] || [])];
      
      // Place equipment in consecutive slots
      for (let i = 0; i < equipment.criticalSlots; i++) {
        const targetIndex = slotIndex + i;
        if (targetIndex < 12) { // Max slots per location
          locationSlots[targetIndex] = equipment.name;
        }
      }
      
      (newCriticalSlots as any)[location] = locationSlots;
      
      return {
        ...prevUnit,
        criticalSlots: newCriticalSlots,
      };
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Layout>
        <div className={styles.container}>
          <h1>Interactive Mech Editor Demo</h1>
          <p>This demo showcases the interactive armor diagram and critical slots allocation system. Drag equipment from the panel below into critical slots, and click on armor locations to modify armor values.</p>
          
          <div className={styles.demoGrid}>
            <div className={styles.diagramSection}>
              <h2>Armor Diagram</h2>
              <InteractiveMechArmorDiagram
                unit={unit}
                onArmorChange={handleArmorChange}
                selectedLocation={selectedLocation || undefined}
                onLocationSelect={setSelectedLocation}
                showControls={true}
                isCompact={false}
              />
            </div>
            
            <div className={styles.criticalSlotsSection}>
              <h2>Critical Slots Grid</h2>
              <MechCriticalsAllocationGrid
                unit={unit}
                onEquipmentPlace={handleEquipmentPlace}
                selectedLocation={selectedLocation || undefined}
                onLocationSelect={setSelectedLocation}
                showLocationHeaders={true}
                compactView={false}
              />
            </div>
          </div>
          
          <div className={styles.equipmentPanel}>
            <h2>Available Equipment</h2>
            <div className={styles.equipmentGrid}>
              {availableEquipment.map(equipment => (
                <DraggableEquipmentItem
                  key={equipment.id}
                  equipment={equipment}
                />
              ))}
            </div>
          </div>
          
          <div className={styles.notes}>
            <h2>Demo Features</h2>
            <ul>
              <li><strong>Interactive Armor Diagram:</strong> Click on any location to select it and modify armor values</li>
              <li><strong>Drag & Drop Equipment:</strong> Drag equipment from the bottom panel into critical slots</li>
              <li><strong>Critical Slots Grid:</strong> Visual representation of all mech locations with internal structure and equipment</li>
              <li><strong>Multi-slot Equipment:</strong> Equipment automatically fills consecutive slots based on its critical slot requirement</li>
              <li><strong>Location Selection:</strong> Selected location is highlighted in both armor diagram and critical slots grid</li>
              <li><strong>Visual Feedback:</strong> Armor condition indicated by colors (green = high, orange = medium, red = low)</li>
            </ul>
          </div>
        </div>
      </Layout>
    </DndProvider>
  );
}
