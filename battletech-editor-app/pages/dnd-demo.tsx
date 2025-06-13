import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Layout from '../components/common/Layout';
import { DraggableEquipmentItem } from '../components/editor/equipment/DraggableEquipmentItem';
import { CriticalSlotDropZone } from '../components/editor/criticals/CriticalSlotDropZone';
import { DraggedEquipment } from '../components/editor/dnd/types';
import { FullEquipment } from '../types';
import styles from '../styles/dnd-demo.module.css';

// Sample equipment data
const sampleEquipment: FullEquipment[] = [
  {
    id: 'lrm-10',
    name: 'LRM 10',
    type: 'Missile Weapon',
    tech_base: 'Inner Sphere',
    weight: 5,
    space: 2,
    heat: 4,
    damage: '10',
  },
  {
    id: 'medium-laser',
    name: 'Medium Laser',
    type: 'Energy Weapon',
    tech_base: 'Inner Sphere',
    weight: 1,
    space: 1,
    heat: 3,
    damage: '5',
  },
  {
    id: 'ac-10',
    name: 'AC/10',
    type: 'Ballistic Weapon',
    tech_base: 'Inner Sphere',
    weight: 12,
    space: 7,
    heat: 3,
    damage: '10',
  },
  {
    id: 'heat-sink',
    name: 'Heat Sink',
    type: 'Equipment',
    tech_base: 'Inner Sphere',
    weight: 1,
    space: 1,
  },
  {
    id: 'ac-10-ammo',
    name: 'AC/10 Ammo',
    type: 'Ammo',
    tech_base: 'Inner Sphere',
    weight: 1,
    space: 1,
  },
];

// Mech locations with slot counts
const mechLocations = [
  { name: 'Head', slots: 6 },
  { name: 'Left Torso', slots: 12 },
  { name: 'Center Torso', slots: 12 },
  { name: 'Right Torso', slots: 12 },
  { name: 'Left Arm', slots: 12 },
  { name: 'Right Arm', slots: 12 },
  { name: 'Left Leg', slots: 6 },
  { name: 'Right Leg', slots: 6 },
];

const DndDemo: React.FC = () => {
  // Track critical slots
  const [criticalSlots, setCriticalSlots] = useState<Record<string, string[]>>(() => {
    const slots: Record<string, string[]> = {};
    mechLocations.forEach(loc => {
      slots[loc.name] = Array(loc.slots).fill('-Empty-');
    });
    return slots;
  });

  // Track used equipment
  const [usedEquipment, setUsedEquipment] = useState<Set<string>>(new Set());

  const handleDrop = (item: DraggedEquipment, location: string, slotIndex: number) => {
    // Check if equipment can fit
    const remainingSlots = criticalSlots[location].length - slotIndex;
    if (item.criticalSlots > remainingSlots) {
      alert(`Not enough slots! ${item.name} requires ${item.criticalSlots} slots, but only ${remainingSlots} available.`);
      return;
    }

    // Update critical slots
    setCriticalSlots(prev => {
      const newSlots = { ...prev };
      newSlots[location] = [...newSlots[location]];
      
      // Fill slots with equipment name
      for (let i = 0; i < item.criticalSlots; i++) {
        newSlots[location][slotIndex + i] = item.name;
      }
      
      return newSlots;
    });

    // Mark equipment as used
    setUsedEquipment(prev => new Set(Array.from(prev).concat(item.equipmentId)));
  };

  const canAcceptEquipment = (item: DraggedEquipment, location: string, slotIndex: number): boolean => {
    // Check if slot is empty
    if (criticalSlots[location][slotIndex] !== '-Empty-') {
      return false;
    }

    // Check if equipment can fit
    const remainingSlots = criticalSlots[location].length - slotIndex;
    return item.criticalSlots <= remainingSlots;
  };

  const clearLocation = (location: string) => {
    setCriticalSlots(prev => ({
      ...prev,
      [location]: Array(prev[location].length).fill('-Empty-'),
    }));
    
    // Update used equipment
    setUsedEquipment(prev => {
      const newUsed = new Set(prev);
      sampleEquipment.forEach(eq => {
        const isInLocation = criticalSlots[location].some(slot => slot === eq.name);
        if (isInLocation) {
          newUsed.delete(eq.id);
        }
      });
      return newUsed;
    });
  };

  return (
    <Layout>
      <DndProvider backend={HTML5Backend}>
        <div className={styles.container}>
          <h1>Drag and Drop Equipment Demo</h1>
          <p>Drag equipment from the left panel and drop them into critical slots on the right.</p>
          
          <div className={styles.mainGrid}>
            {/* Equipment Panel */}
            <div className={styles.equipmentPanel}>
              <h2>Available Equipment</h2>
              <div className={styles.equipmentList}>
                {sampleEquipment.map(equipment => (
                  <DraggableEquipmentItem
                    key={equipment.id}
                    equipment={equipment}
                    showDetails={true}
                  />
                ))}
              </div>
            </div>
            
            {/* Critical Slots Panel */}
            <div className={styles.criticalSlotsPanel}>
              <h2>Critical Slots</h2>
              <div className={styles.locationsGrid}>
                {mechLocations.map(location => (
                  <div key={location.name} className={styles.locationSection}>
                    <div className={styles.locationHeader}>
                      <h3>{location.name}</h3>
                      <button
                        className={styles.clearButton}
                        onClick={() => clearLocation(location.name)}
                      >
                        Clear
                      </button>
                    </div>
                    <div className={styles.slotsList}>
                      {criticalSlots[location.name].map((slot, index) => (
                        <CriticalSlotDropZone
                          key={`${location.name}-${index}`}
                          location={location.name}
                          slotIndex={index}
                          currentItem={slot}
                          onDrop={handleDrop}
                          canAccept={(item) => canAcceptEquipment(item, location.name, index)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.notes}>
            <h2>Features Demonstrated</h2>
            <ul>
              <li>Drag equipment items from the left panel</li>
              <li>Drop them into empty critical slots</li>
              <li>Multi-slot equipment (like AC/10 with 7 slots) automatically fills consecutive slots</li>
              <li>Visual feedback shows valid/invalid drop zones</li>
              <li>Cannot drop on occupied slots</li>
              <li>Clear button resets all slots in a location</li>
            </ul>
          </div>
        </div>
      </DndProvider>
    </Layout>
  );
};

export default DndDemo;
