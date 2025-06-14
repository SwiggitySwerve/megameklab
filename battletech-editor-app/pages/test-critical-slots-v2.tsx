import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CriticalSlotDropZone from '../components/editor/criticals/CriticalSlotDropZone';
import { EditableUnit } from '../types/editor';
import { SystemComponents } from '../types/systemComponents';
import { SlotType } from '../types/criticalSlots';
import { CriticalSlotManagerV2 } from '../utils/criticalSlotManagerV2';
import { useCriticalSlotManagerV2 } from '../hooks/useCriticalSlotManagerV2';
import styles from '../styles/demo.module.css';

// Test data
const testUnit: EditableUnit = ({
  id: 'test-unit-1',
  mass: 75,
  tech_base: 'Inner Sphere',
  data: {
    chassis: 'Test Chassis',
    model: 'TST-1',
    criticals: [
      { location: 'Head', slots: ['Life Support', 'Sensors', 'Cockpit', '-Empty-', 'Sensors', 'Life Support'] },
      { location: 'Left Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '- Empty -', '-Empty-', 'Medium Laser', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
      { location: 'Right Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', 'Medium Laser', 'Medium Laser', '-Empty-', '- Empty -', null, undefined, '', '-Empty-'] as any },
    ],
    weapons_and_equipment: [
      { item_name: 'Medium Laser', location: 'Left Arm', item_type: 'weapon', tech_base: 'IS' },
      { item_name: 'Medium Laser', location: 'Right Arm', item_type: 'weapon', tech_base: 'IS' },
      { item_name: 'Medium Laser', location: 'Right Arm', item_type: 'weapon', tech_base: 'IS' },
      { item_name: 'Heat Sink', location: '', item_type: 'equipment', tech_base: 'IS' },
    ]
  }
} as any);

const systemComponents: SystemComponents = {
  engine: { type: 'Standard', rating: 300 },
  gyro: { type: 'Standard' },
  cockpit: { type: 'Standard' },
  structure: { type: 'Standard' },
  armor: { type: 'Standard' },
  heatSinks: { type: 'Single', total: 10, engineIntegrated: 10, externalRequired: 0 }
};

const TestCriticalSlotsV2Page: React.FC = () => {
  const {
    allocations,
    getSlotContent,
    isSlotEmpty
  } = useCriticalSlotManagerV2(testUnit, systemComponents);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <h1>Critical Slots V2 Test - Object-Based System</h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2>Test Cases for Empty Slot Display</h2>
          <p>All empty slots should display as just the slot number, never "-Empty-" or any variation.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Old String-Based System */}
          <div>
            <h3>Old String-Based Display</h3>
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
              {testUnit.data?.criticals?.map(location => (
                <div key={location.location} style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>{location.location}</h4>
                  <div style={{ display: 'grid', gap: '0.25rem' }}>
                    {location.slots.map((slot, index) => {
                      // Convert string slot to object format
                      const slotObj = {
                        slotIndex: index,
                        location: location.location,
                        equipment: null,
                        isPartOfMultiSlot: false,
                        slotType: SlotType.NORMAL
                      };
                      return (
                        <CriticalSlotDropZone
                          key={index}
                          location={location.location}
                          slotIndex={index}
                          slot={slotObj}
                          onDrop={() => {}}
                          canAccept={() => false}
                          disabled={true}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Object-Based System */}
          <div>
            <h3>New Object-Based Display (V2)</h3>
            <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
              {Object.entries(allocations).map(([location, slots]) => (
                <div key={location} style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>{location}</h4>
                  <div style={{ display: 'grid', gap: '0.25rem' }}>
                    {slots.map((slot, index) => (
                      <CriticalSlotDropZone
                        key={index}
                        location={location}
                        slotIndex={index}
                        slot={slot}
                        onDrop={() => {}}
                        canAccept={() => false}
                        disabled={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>Data Model Comparison</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h4>Legacy String Data</h4>
              <pre style={{ background: '#111827', padding: '1rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                {JSON.stringify(testUnit.data?.criticals, null, 2)}
              </pre>
            </div>
            <div>
              <h4>Object-Based Data</h4>
              <pre style={{ background: '#111827', padding: '1rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                {JSON.stringify(
                  Object.entries(allocations).map(([location, slots]) => ({
                    location,
                    slots: slots.map(s => s.equipment ? s.equipment.equipmentData.name : null)
                  })),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#1e293b', borderRadius: '0.5rem' }}>
          <h3>Empty Slot Detection Tests</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Value</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>isEmptySlot()</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Display</th>
              </tr>
            </thead>
            <tbody>
              {['-Empty-', '- Empty -', '', null, undefined, 'Medium Laser'].map((value, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '0.5rem' }}>{String(value)}</td>
                  <td style={{ padding: '0.5rem' }}>{typeof value}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ color: isSlotEmpty('Head', 0) ? '#10b981' : '#ef4444' }}>
                      {String(value === null || value === undefined || value === '' || 
                        (typeof value === 'string' && (value.toLowerCase().includes('empty') || value === '-' || value === '- -')))}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {value === null || value === undefined || value === '' || 
                     (typeof value === 'string' && (value.toLowerCase().includes('empty') || value === '-' || value === '- -'))
                      ? '(slot number only)' : value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DndProvider>
  );
};

export default TestCriticalSlotsV2Page;
