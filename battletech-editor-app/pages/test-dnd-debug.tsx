import React from 'react';
import { useRouter } from 'next/router';
import UnitEditor from '../components/editor/UnitEditor';
import { EditableUnit } from '../types/editor';

// Create a test Atlas unit with unallocated heat sinks
const createTestUnit = (): EditableUnit => {
  const unit: EditableUnit = {
    id: 'test-atlas',
    model: 'AS7-D',
    chassis: 'Atlas',
    tonnage: 100,
    tech_base: 'Inner Sphere',
    data: {
      engine: {
        rating: 300,
        manufacturer: 'Vlar',
        techbase: 'Inner Sphere',
        engineType: 'Fusion Engine'
      },
      myomer: 'Standard',
      gyro: 'Standard Gyro',
      cockpit: 'Standard Cockpit',
      heat_sinks: {
        number: 20,
        type: 'Single Heat Sink',
        count: 20
      },
      armor: {
        type: 'Standard',
        total: 304
      },
      weaponry: {
        weapons: []
      },
      weapons_and_equipment: [
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' },
        { item_type: 'equipment', item_name: 'Heat Sink', location: '', tech_base: 'Inner Sphere' }
      ],
      criticals: [
        { location: 'Head', slots: ['Life Support', 'Sensors', 'Cockpit', 'Sensors', 'Life Support', '-Empty-'] },
        { location: 'Left Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Right Arm', slots: ['Shoulder', 'Upper Arm Actuator', 'Lower Arm Actuator', 'Hand Actuator', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Left Torso', slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Center Torso', slots: ['Engine', 'Engine', 'Engine', 'Gyro', 'Gyro', 'Gyro', 'Gyro', 'Engine', 'Engine', 'Engine', '-Empty-', '-Empty-'] },
        { location: 'Right Torso', slots: ['-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-', '-Empty-'] },
        { location: 'Left Leg', slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] },
        { location: 'Right Leg', slots: ['Hip', 'Upper Leg Actuator', 'Lower Leg Actuator', 'Foot Actuator', '-Empty-', '-Empty-'] }
      ]
    }
  };
  
  return unit;
};

const TestDndDebug: React.FC = () => {
  const router = useRouter();
  const [unit, setUnit] = React.useState<EditableUnit>(createTestUnit());
  const [messages, setMessages] = React.useState<string[]>([]);

  // Capture console logs
  React.useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setMessages(prev => [...prev, message].slice(-50)); // Keep last 50 messages
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const handleUnitChange = (updates: Partial<EditableUnit>) => {
    console.log('[TEST PAGE] Unit change:', updates);
    setUnit(prevUnit => ({ ...prevUnit, ...updates }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <UnitEditor
          unit={unit}
          onUnitChange={handleUnitChange}
          readOnly={false}
          isDefaultTab={false}
          currentTab={4} // Criticals tab
        />
      </div>
      
      <div style={{ 
        width: '400px', 
        backgroundColor: '#1a1a1a', 
        borderLeft: '1px solid #333',
        padding: '10px',
        overflow: 'auto'
      }}>
        <h3 style={{ color: '#fff', marginTop: 0 }}>Debug Console</h3>
        <button 
          onClick={() => setMessages([])}
          style={{ marginBottom: '10px' }}
        >
          Clear
        </button>
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '12px', 
          color: '#0f0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              borderBottom: '1px solid #333', 
              padding: '5px 0',
              color: msg.includes('DROP ZONE') ? '#60a5fa' : 
                     msg.includes('CRITICALS TAB') ? '#f59e0b' :
                     msg.includes('Drag begin') ? '#10b981' :
                     msg.includes('error') ? '#ef4444' : '#6b7280'
            }}>
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestDndDebug;
