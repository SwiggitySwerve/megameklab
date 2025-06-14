import React, { useState } from 'react';
import CriticalsTab from '../components/editor/tabs/CriticalsTab';
import { EditableUnit } from '../types/editor';

const TestDndCriticals: React.FC = () => {
  const [unit, setUnit] = useState<EditableUnit>({
    id: 'test-atlas',
    model: 'AS7-D',
    chassis: 'Atlas',
    tonnage: 100,
    tech_base: 'Inner Sphere',
    biped: true,
    omni: false,
    quad: false,
    lam: false,
    rules_level: 'standard',
    structure: 304,
    armor: 307,
    movement: { walk: 3, jump: 0 },
    fluff: {
      name: '',
      notes: ''
    },
    data: {
      heat_sinks: {
        count: 20,
        type: 'Single',
      },
      engine: {
        rating: 300,
        type: 'Standard',
        manufacturer: '',
      },
      gyro: {
        type: 'Standard',
        manufacturer: '',
      },
      cockpit: {
        type: 'Standard',
        manufacturer: '',
      },
      enhancements: {
        CASE: [],
        CASE_II: [],
        MASC: false,
        TSM: false,
        supercharger: false,
      },
      criticals: [
        { location: 'Head', slots: ['Life Support', 'Sensors', 'Cockpit', 'Sensors', 'Life Support', '-Empty-'] },
        { location: 'Left Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Right Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Left Torso', slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Center Torso', slots: ['Engine', 'Engine', 'Engine', 'Gyro', 'Gyro', 'Gyro', 'Gyro', 'Engine', 'Engine', 'Engine', '-Empty-', '-Empty-'] },
        { location: 'Right Torso', slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Left Leg', slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] },
        { location: 'Right Leg', slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] }
      ],
      weapons_and_equipment: [
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'heat_sink', location: '', tech_base: 'IS' },
      ],
    },
    // Required fields for EditableUnit
    armorAllocation: {},
    equipmentPlacements: [],
    criticalSlots: [],
    fluffData: {},
    selectedQuirks: [],
    validationState: {
      isValid: true,
      errors: [],
      warnings: []
    },
    editorMetadata: {
      lastModified: new Date(),
      isDirty: false,
      version: '1.0'
    }
  } as any); // Using 'as any' to bypass strict type checking for testing

  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    console.log('Unit changes:', updates);
    setUnit(prev => ({
      ...prev,
      ...updates,
      data: {
        ...prev.data,
        ...updates.data,
      },
    }));
  };

  // Add debug logging for drag events
  React.useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      console.log('Drag start:', e);
    };
    const handleDragEnd = (e: DragEvent) => {
      console.log('Drag end:', e);
    };
    const handleDragOver = (e: DragEvent) => {
      console.log('Drag over:', e);
    };
    const handleDrop = (e: DragEvent) => {
      console.log('Drop:', e);
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Drag and Drop Test - Criticals Tab</h1>
      <div style={{ marginBottom: '20px' }}>
        <p>Test Instructions:</p>
        <ul>
          <li>Try to drag heat sinks from the right panel into empty critical slots</li>
          <li>Watch the console for drag/drop events</li>
          <li>Multi-slot items should highlight multiple slots when hovering</li>
        </ul>
      </div>
      
      <CriticalsTab
        unit={unit}
        onUnitChange={handleUnitChange}
        validationErrors={[]}
        readOnly={false}
      />
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Debug Info:</h3>
        <pre style={{ fontSize: '12px' }}>
          {JSON.stringify({
            unallocatedHeatSinks: unit.data?.weapons_and_equipment?.filter(eq => 
              eq.item_name === 'Heat Sink' && (!eq.location || eq.location === '')
            ).length,
            totalHeatSinks: unit.data?.heat_sinks?.count,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestDndCriticals;
