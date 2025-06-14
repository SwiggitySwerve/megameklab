import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CriticalSlotDropZone from '../components/editor/criticals/CriticalSlotDropZone';
import DraggableEquipmentItem from '../components/editor/equipment/DraggableEquipmentItem';
import { DraggedEquipment } from '../components/editor/dnd/types';
import { FullEquipment } from '../types';
import styles from '../styles/demo.module.css';

const TestDropZoneDebugPage: React.FC = () => {
  const [testSlots, setTestSlots] = useState<(string | null)[]>([
    null,
    '-Empty-',
    '- Empty -',
    '',
    'Medium Laser',
    undefined as any,
  ]);

  const testEquipment: FullEquipment = {
    id: 'test-laser-1',
    name: 'Medium Laser',
    type: 'Weapon',
    tech_base: 'Inner Sphere',
    weight: 1,
    space: 1,
    damage: '5',
    heat: 3,
  };

  const handleDrop = (item: DraggedEquipment, location: string, slotIndex: number) => {
    console.log('Drop accepted:', item, location, slotIndex);
    const newSlots = [...testSlots];
    newSlots[slotIndex] = item.name;
    setTestSlots(newSlots);
  };

  const canAccept = (item: DraggedEquipment) => {
    console.log('canAccept called with:', item);
    return true;
  };

  // Helper to check if a slot value should be considered empty
  const isEmptySlot = (value: any): boolean => {
    if (!value) return true;
    if (typeof value !== 'string') return true;
    
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === '' ||
           normalizedValue === '-empty-' ||
           normalizedValue === '- empty -' ||
           normalizedValue === 'empty' ||
           normalizedValue === '-' ||
           normalizedValue === '- -' ||
           normalizedValue === '—' ||
           normalizedValue === '–' ||
           normalizedValue === 'null' ||
           normalizedValue === 'undefined';
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <h1>Drop Zone Debug Test</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          {/* Test Slots */}
          <div>
            <h2>Test Slots</h2>
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
              {testSlots.map((slot, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Slot {index}: value="{String(slot)}", type={typeof slot}, isEmpty={isEmptySlot(slot) ? 'YES' : 'NO'}
                  </div>
                  <CriticalSlotDropZone
                    location="Test"
                    slotIndex={index}
                    currentItem={slot || undefined}
                    onDrop={handleDrop}
                    canAccept={canAccept}
                    disabled={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Equipment to Drag */}
          <div>
            <h2>Drag This Equipment</h2>
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
              <DraggableEquipmentItem
                equipment={testEquipment}
                showDetails={true}
                isCompact={false}
              />
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                Try dragging the Medium Laser to each slot. Empty slots should accept the drop (green highlight), 
                while occupied slots should reject it (red highlight).
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem' }}>
          <h3>Expected Behavior:</h3>
          <ul style={{ marginLeft: '1.5rem', color: '#e5e7eb' }}>
            <li>Slots 0-3 and 5 should show GREEN when hovering (empty slots)</li>
            <li>Slot 4 should show RED when hovering (occupied by Medium Laser)</li>
            <li>All empty slots should display only their slot number (1, 2, 3...)</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem' }}>
          <h3>Current State:</h3>
          <pre style={{ background: '#111827', padding: '1rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
            {JSON.stringify(testSlots, null, 2)}
          </pre>
        </div>
      </div>
    </DndProvider>
  );
};

export default TestDropZoneDebugPage;
