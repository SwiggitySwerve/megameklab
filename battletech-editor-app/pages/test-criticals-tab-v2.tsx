import React from 'react';
import { UnitDataProvider } from '../hooks/useUnitData';
import CriticalsTabFixed from '../components/editor/tabs/CriticalsTabFixed';
import { EditableUnit } from '../types/editor';
import styles from '../styles/demo.module.css';

// Test unit with some equipment
const testUnit: EditableUnit = {
  chassis: 'Test Mech',
  model: 'TST-1A',
  era: '3025',
  id: 'test-unit-1',
  mass: 75,
  tech_base: 'Inner Sphere',
  data: {
    chassis: 'Test Mech',
    model: 'TST-1A',
    criticals: [
      { location: 'Head', slots: ['Life Support', 'Sensors', 'Cockpit', '-Empty-', 'Sensors', 'Life Support'] as any },
      { location: 'Left Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] as any },
      { location: 'Right Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] as any },
      { location: 'Left Torso', slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] as any },
      { location: 'Center Torso', slots: ['Engine', 'Engine', 'Engine', 'Gyro', 'Gyro', 'Gyro', 'Gyro', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] as any },
      { location: 'Right Torso', slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] as any },
      { location: 'Left Leg', slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] as any },
      { location: 'Right Leg', slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] as any },
    ],
    weapons_and_equipment: [
      { item_name: 'Medium Laser', location: '', item_type: 'weapon', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'Medium Laser', location: '', item_type: 'weapon', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'AC/20', location: '', item_type: 'weapon', tech_base: 'IS', crits: 10, tons: 14 },
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'Double Heat Sink', location: '', item_type: 'equipment', tech_base: 'IS', crits: 3, tons: 1 },
      { item_name: 'Jump Jet', location: '', item_type: 'equipment', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'Jump Jet', location: '', item_type: 'equipment', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'Jump Jet', location: '', item_type: 'equipment', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'AC/20 Ammo', location: '', item_type: 'ammo', tech_base: 'IS', crits: 1, tons: 1 },
      { item_name: 'AC/20 Ammo', location: '', item_type: 'ammo', tech_base: 'IS', crits: 1, tons: 1 },
    ]
  },
  systemComponents: {
    engine: { type: 'Standard', rating: 300 },
    gyro: { type: 'Standard' },
    cockpit: { type: 'Standard' },
    structure: { type: 'Standard' },
    armor: { type: 'Standard' },
    heatSinks: { type: 'Single', total: 12, engineIntegrated: 10, externalRequired: 2 }
  },
  criticalAllocations: {
    'Head': [
      { index: 0, name: 'Life Support', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 1, name: 'Sensors', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 2, name: 'Cockpit', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 3, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 4, name: 'Sensors', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 5, name: 'Life Support', type: 'system', isFixed: true, isManuallyPlaced: false },
    ],
    'Left Arm': [
      { index: 0, name: 'Shoulder', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 1, name: 'Upper Arm Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 2, name: 'Lower Arm Actuator', type: 'system', isFixed: false, isConditionallyRemovable: true, isManuallyPlaced: false },
      { index: 3, name: 'Hand Actuator', type: 'system', isFixed: false, isConditionallyRemovable: true, isManuallyPlaced: false },
      { index: 4, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 5, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 6, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 7, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 8, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 9, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 10, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 11, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
    ],
    'Right Arm': [
      { index: 0, name: 'Shoulder', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 1, name: 'Upper Arm Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 2, name: 'Lower Arm Actuator', type: 'system', isFixed: false, isConditionallyRemovable: true, isManuallyPlaced: false },
      { index: 3, name: 'Hand Actuator', type: 'system', isFixed: false, isConditionallyRemovable: true, isManuallyPlaced: false },
      { index: 4, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 5, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 6, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 7, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 8, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 9, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 10, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 11, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
    ],
    'Left Torso': [
      { index: 0, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 1, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 2, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 3, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 4, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 5, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 6, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 7, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 8, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 9, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 10, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 11, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
    ],
    'Center Torso': [
      { index: 0, name: 'Engine', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 1, name: 'Engine', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 2, name: 'Engine', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 3, name: 'Gyro', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 4, name: 'Gyro', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 5, name: 'Gyro', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 6, name: 'Gyro', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 7, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 8, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 9, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 10, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 11, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
    ],
    'Right Torso': [
      { index: 0, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 1, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 2, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 3, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 4, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 5, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 6, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 7, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 8, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 9, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 10, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 11, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
    ],
    'Left Leg': [
      { index: 0, name: 'Hip', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 1, name: 'Upper Leg Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 2, name: 'Lower Leg Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 3, name: 'Foot Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 4, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 5, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
    ],
    'Right Leg': [
      { index: 0, name: 'Hip', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 1, name: 'Upper Leg Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 2, name: 'Lower Leg Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 3, name: 'Foot Actuator', type: 'system', isFixed: true, isManuallyPlaced: false },
      { index: 4, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
      { index: 5, name: '-Empty-', type: 'empty', isFixed: false, isManuallyPlaced: false },
    ],
  },
  editorMetadata: {
    isDirty: false,
    lastModified: new Date(),
    version: '1.0'
  },
  validationState: {
    isValid: true,
    errors: [],
    warnings: []
  },
  armorAllocation: {
    'Head': { front: 9, rear: 0, maxArmor: 9, type: 'Standard' as any },
    'Left Arm': { front: 20, rear: 0, maxArmor: 32, type: 'Standard' as any },
    'Right Arm': { front: 20, rear: 0, maxArmor: 32, type: 'Standard' as any },
    'Left Torso': { front: 20, rear: 10, maxArmor: 40, type: 'Standard' as any },
    'Center Torso': { front: 25, rear: 16, maxArmor: 56, type: 'Standard' as any },
    'Right Torso': { front: 20, rear: 10, maxArmor: 40, type: 'Standard' as any },
    'Left Leg': { front: 20, rear: 0, maxArmor: 32, type: 'Standard' as any },
    'Right Leg': { front: 20, rear: 0, maxArmor: 32, type: 'Standard' as any }
  },
  equipmentPlacements: [],
  criticalSlots: [],
  fluffData: {
    overview: '',
    capabilities: '',
    deployment: '',
    history: '',
    manufacturer: '',
    primaryFactory: ''
  },
  selectedQuirks: []
};

const TestCriticalsTabV2: React.FC = () => {
  const handleUnitChange = (unit: EditableUnit) => {
    console.log('Unit changed:', unit);
  };

  return (
    <div className={styles.container}>
      <h1>Test Criticals Tab V2 - Fixed State Management</h1>
      
      <UnitDataProvider initialUnit={testUnit} onUnitChange={handleUnitChange}>
        <CriticalsTabFixed readOnly={false} />
      </UnitDataProvider>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem' }}>
        <h3>Fixed Issues</h3>
        <ul>
          <li>✅ State persistence - equipment no longer disappears</li>
          <li>✅ Proper initialization - only happens once</li>
          <li>✅ Independent state management from parent updates</li>
          <li>✅ Correct tracking of equipment instances</li>
        </ul>
      </div>
    </div>
  );
};

export default TestCriticalsTabV2;
