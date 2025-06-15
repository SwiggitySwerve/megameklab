import React, { useState } from 'react';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { MechCriticalsAllocationGrid } from '../components/editor/criticals/MechCriticalsAllocationGrid';
import { calculateCompleteInternalStructure, handleSystemChange } from '../utils/criticalSlotCalculations';
import { DraggedEquipment } from '../components/editor/dnd/types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function TestCriticalSlots() {
  const [unit, setUnit] = useState<EditableUnit>({
    systemComponents: {
      engine: { type: 'Standard', rating: 300 },
      gyro: { type: 'Standard' },
      cockpit: { type: 'Standard' },
      structure: { type: 'Standard' },
      armor: { type: 'Standard' },
      heatSinks: { type: 'Single', total: 10, engineIntegrated: 10, externalRequired: 0 }
    },
    criticalSlots: {
      [MECH_LOCATIONS.CENTER_TORSO]: ['SRM 6', 'SRM 6', null, null, null],
      [MECH_LOCATIONS.LEFT_TORSO]: ['Medium Laser', null, null, null, null],
      [MECH_LOCATIONS.RIGHT_TORSO]: ['AC/10', 'AC/10', 'AC/10', 'AC/10', 'AC/10', 'AC/10', 'AC/10'],
      [MECH_LOCATIONS.LEFT_ARM]: [],
      [MECH_LOCATIONS.RIGHT_ARM]: [],
      [MECH_LOCATIONS.LEFT_LEG]: [],
      [MECH_LOCATIONS.RIGHT_LEG]: [],
      [MECH_LOCATIONS.HEAD]: []
    },
    tech_base: 'Inner Sphere'
  } as any);
  
  const [removedHistory, setRemovedHistory] = useState<string[]>([]);
  
  const handleEngineChange = (newType: string) => {
    console.log('=== Changing Engine Type ===');
    console.log('From:', unit.systemComponents?.engine?.type);
    console.log('To:', newType);
    
    const { updatedUnit, removedEquipment } = handleSystemChange(unit, 'engine', newType);
    
    if (removedEquipment.length > 0) {
      const equipmentNames = removedEquipment.map(e => `${e.equipment} from ${e.location}`).join(', ');
      setRemovedHistory([...removedHistory, `Engine change to ${newType}: removed ${equipmentNames}`]);
    }
    
    setUnit(updatedUnit);
  };
  
  const handleGyroChange = (newType: string) => {
    console.log('=== Changing Gyro Type ===');
    console.log('From:', unit.systemComponents?.gyro?.type);
    console.log('To:', newType);
    
    const { updatedUnit, removedEquipment } = handleSystemChange(unit, 'gyro', newType);
    
    if (removedEquipment.length > 0) {
      const equipmentNames = removedEquipment.map(e => `${e.equipment} from ${e.location}`).join(', ');
      setRemovedHistory([...removedHistory, `Gyro change to ${newType}: removed ${equipmentNames}`]);
    }
    
    setUnit(updatedUnit);
  };
  
  const handleEquipmentPlace = (equipment: DraggedEquipment, location: string, slotIndex: number) => {
    console.log('Place equipment:', equipment.name, 'at', location, slotIndex);
    // Implementation would update unit.criticalSlots
  };
  
  // Calculate internal structure for display
  const internalStructure = calculateCompleteInternalStructure(unit);
  
  // Debug: Check what's in the internal structure
  console.log('Internal Structure for Center Torso:', internalStructure[MECH_LOCATIONS.CENTER_TORSO]);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '20px' }}>
        <h1>Critical Slots Test System</h1>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          {/* Engine Selection */}
          <div style={{ flex: 1 }}>
            <h3>Engine Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {['Standard', 'XL', 'Light', 'XXL'].map(type => (
                <button
                  key={type}
                  onClick={() => handleEngineChange(type)}
                  style={{
                    padding: '8px 16px',
                    background: unit.systemComponents?.engine?.type === type ? '#0066cc' : '#e0e0e0',
                    color: unit.systemComponents?.engine?.type === type ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {type} Engine
                  {type === 'XL' && ' (3 CT + 3 LT + 3 RT)'}
                  {type === 'Light' && ' (3 CT + 3 LT + 3 RT)'}
                  {type === 'XXL' && ' (3 CT + 6 LT + 6 RT)'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Gyro Selection */}
          <div style={{ flex: 1 }}>
            <h3>Gyro Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {['Standard', 'XL', 'Compact', 'Heavy-Duty'].map(type => (
                <button
                  key={type}
                  onClick={() => handleGyroChange(type)}
                  style={{
                    padding: '8px 16px',
                    background: unit.systemComponents?.gyro?.type === type ? '#0066cc' : '#e0e0e0',
                    color: unit.systemComponents?.gyro?.type === type ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {type} Gyro
                  {type === 'Standard' && ' (4 slots)'}
                  {type === 'XL' && ' (6 slots)'}
                  {type === 'Compact' && ' (2 slots)'}
                  {type === 'Heavy-Duty' && ' (4 slots)'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Internal Structure Info */}
          <div style={{ flex: 1 }}>
            <h3>Internal Structure Summary</h3>
            <div style={{ 
              background: '#f0f0f0', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {Object.entries(internalStructure).map(([location, slots]) => (
                slots.length > 0 && (
                  <div key={location} style={{ marginBottom: '5px' }}>
                    <strong>{location}:</strong> {slots.length} slots
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {slots.join(', ')}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
        
        {/* Equipment Removal History */}
        {removedHistory.length > 0 && (
          <div style={{ 
            marginBottom: '20px',
            padding: '10px',
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Equipment Removal History:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {removedHistory.map((item, index) => (
                <li key={index} style={{ fontSize: '14px' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Critical Slots Grid */}
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '4px', 
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <MechCriticalsAllocationGrid
            unit={unit}
            onEquipmentPlace={handleEquipmentPlace}
            onEquipmentRemove={(location, slotIndex) => {
              console.log('Remove equipment from', location, slotIndex);
            }}
          />
        </div>
        
        {/* Debug Info */}
        <details style={{ marginTop: '20px' }}>
          <summary style={{ cursor: 'pointer', padding: '10px', background: '#f0f0f0' }}>
            Debug Information
          </summary>
          <pre style={{ 
            padding: '10px', 
            background: '#f9f9f9', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify({
              systemComponents: unit.systemComponents,
              criticalSlots: unit.criticalSlots,
              internalStructureCounts: Object.entries(internalStructure).reduce((acc, [loc, slots]) => ({
                ...acc,
                [loc]: slots.length
              }), {})
            }, null, 2)}
          </pre>
        </details>
      </div>
    </DndProvider>
  );
}
