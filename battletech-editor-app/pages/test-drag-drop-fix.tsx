import React, { useState } from 'react';
import { EditableUnit } from '../types/editor';
import CriticalsTab from '../components/editor/tabs/CriticalsTab';
import styles from '../styles/demo.module.css';

// Test unit with some equipment to drag around
const createTestUnit = (): EditableUnit => ({
  id: 'test-atlas',
  name: 'Atlas AS7-D',
  type: 'Mech',
  weight: 100,
  tech_base: 'Inner Sphere',
  data: {
    tonnage: 100,
    tech_level: 'Standard',
    era: '3025',
    structure_type: 'Standard',
    engine_type: 'Fusion Engine',
    gyro_type: 'Standard Gyro',
    cockpit_type: 'Standard Cockpit',
    armor_type: 'Standard Armor',
    heat_sinks_type: 'Single Heat Sink',
    heat_sinks_count: 20,
    walk_mp: 3,
    jump_mp: 0,
    armor_points: {
      'Head': 9,
      'Center Torso': 47,
      'Center Torso (Rear)': 14,
      'Right Torso': 32,
      'Right Torso (Rear)': 10,
      'Left Torso': 32,
      'Left Torso (Rear)': 10,
      'Right Arm': 34,
      'Left Arm': 34,
      'Right Leg': 41,
      'Left Leg': 41,
    },
    weapons_and_equipment: [
      // Unallocated equipment for testing
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'Inner Sphere' },
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'Inner Sphere' },
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'Inner Sphere' },
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'Inner Sphere' },
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'Inner Sphere' },
      { item_name: 'Medium Laser', location: '', item_type: 'weapon', tech_base: 'Inner Sphere' },
      { item_name: 'Medium Laser', location: '', item_type: 'weapon', tech_base: 'Inner Sphere' },
      { item_name: 'AC/20', location: '', item_type: 'weapon', tech_base: 'Inner Sphere' },
      { item_name: 'AC/20 Ammo', location: '', item_type: 'ammo', tech_base: 'Inner Sphere' },
      { item_name: 'LRM 20', location: '', item_type: 'weapon', tech_base: 'Inner Sphere' },
      { item_name: 'LRM 20 Ammo', location: '', item_type: 'ammo', tech_base: 'Inner Sphere' },
      { item_name: 'SRM 6', location: '', item_type: 'weapon', tech_base: 'Inner Sphere' },
      { item_name: 'SRM 6 Ammo', location: '', item_type: 'ammo', tech_base: 'Inner Sphere' },
    ],
    criticals: [
      {
        location: 'Head',
        slots: ['Life Support', 'Sensors', 'Cockpit', 'Sensors', 'Life Support', '-Empty-'],
      },
      {
        location: 'Center Torso',
        slots: ['Engine', 'Engine', 'Engine', 'Engine', 'Engine', 'Engine', 'Gyro', 'Gyro', 'Gyro', 'Gyro', '-Empty-', '-Empty-'],
      },
      {
        location: 'Right Torso',
        slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'],
      },
      {
        location: 'Left Torso',
        slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'],
      },
      {
        location: 'Right Arm',
        slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'],
      },
      {
        location: 'Left Arm',
        slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'],
      },
      {
        location: 'Right Leg',
        slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'],
      },
      {
        location: 'Left Leg',
        slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'],
      },
    ],
  },
});

export default function TestDragDropFix() {
  const [unit, setUnit] = useState<EditableUnit>(createTestUnit());
  const [dragHistory, setDragHistory] = useState<string[]>([]);

  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    console.log('[TEST PAGE] Unit updates:', updates);
    
    // Track drag operations
    if (updates.data?.criticals) {
      const timestamp = new Date().toLocaleTimeString();
      setDragHistory(prev => [...prev, `${timestamp}: Critical slots updated`]);
    }
    
    setUnit(prevUnit => ({
      ...prevUnit,
      ...updates,
      data: {
        ...prevUnit.data,
        ...updates.data,
      },
    }));
  };

  const resetUnit = () => {
    setUnit(createTestUnit());
    setDragHistory([]);
  };

  return (
    <div className={styles.demoContainer}>
      <div className={styles.demoHeader}>
        <h1>Drag and Drop Fix Test</h1>
        <p>This page tests the drag and drop functionality after the fix.</p>
        <div style={{ marginBottom: '1rem' }}>
          <h3>Test Instructions:</h3>
          <ol>
            <li>Drag a Heat Sink from the right panel to an empty slot (e.g., Left Torso slot 1)</li>
            <li>Drag the Heat Sink back to a different location</li>
            <li>Try to drag another Heat Sink to the Left Torso slot 1 - it should work now!</li>
            <li>Test dragging equipment over occupied slots - they should show red rejection state</li>
            <li>Test multi-slot equipment (AC/20 takes 10 slots) - hover should highlight multiple slots</li>
          </ol>
        </div>
        <button onClick={resetUnit} className={styles.resetButton}>
          Reset Unit
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h3>Current State:</h3>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <p>✅ Hover state only applies to valid drop targets</p>
            <p>✅ Hover state is cleared after successful drops</p>
            <p>✅ Previously hovered slots can accept new equipment</p>
            <p>✅ Multi-slot highlighting works correctly</p>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Drag History:</h3>
          <div style={{ 
            maxHeight: '100px', 
            overflowY: 'auto', 
            border: '1px solid #ccc', 
            padding: '0.5rem',
            fontSize: '0.8rem'
          }}>
            {dragHistory.length === 0 ? (
              <p style={{ color: '#999' }}>No drag operations yet...</p>
            ) : (
              dragHistory.map((entry, index) => (
                <div key={index}>{entry}</div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={styles.editorWrapper}>
        <CriticalsTab
          unit={unit}
          onUnitChange={handleUnitChange}
          validationErrors={[]}
          readOnly={false}
        />
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Debug Info:</h3>
        <details>
          <summary>Current Critical Slots (click to expand)</summary>
          <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
            {JSON.stringify(unit.data?.criticals, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
