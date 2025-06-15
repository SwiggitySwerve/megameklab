import React, { useState } from 'react';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { MechCriticalsAllocationGrid } from '../components/editor/criticals/MechCriticalsAllocationGrid';
import { calculateCompleteInternalStructure, handleSystemChange } from '../utils/criticalSlotCalculations';
import { DraggedEquipment } from '../components/editor/dnd/types';

export default function TestCriticalGridIntegration() {
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
      [MECH_LOCATIONS.LEFT_TORSO]: [],
      [MECH_LOCATIONS.RIGHT_TORSO]: [],
      [MECH_LOCATIONS.LEFT_ARM]: [],
      [MECH_LOCATIONS.RIGHT_ARM]: [],
      [MECH_LOCATIONS.LEFT_LEG]: [],
      [MECH_LOCATIONS.RIGHT_LEG]: [],
      [MECH_LOCATIONS.HEAD]: []
    },
    tech_base: 'Inner Sphere'
  } as any);
  
  const handleGyroChange = (newType: string) => {
    console.log('=== Changing Gyro Type ===');
    console.log('From:', unit.systemComponents?.gyro?.type);
    console.log('To:', newType);
    
    // THIS IS THE KEY - Use handleSystemChange to rebuild slots
    const { updatedUnit, removedEquipment } = handleSystemChange(unit, 'gyro', newType);
    
    if (removedEquipment.length > 0) {
      const equipmentNames = removedEquipment.map(e => e.equipment).join(', ');
      if (window.confirm(`Changing to ${newType} Gyro will remove: ${equipmentNames}. Continue?`)) {
        console.log('Removed equipment:', removedEquipment);
        setUnit(updatedUnit);
      }
    } else {
      setUnit(updatedUnit);
    }
  };
  
  const handleEquipmentPlace = (equipment: DraggedEquipment, location: string, slotIndex: number) => {
    console.log('Place equipment:', equipment.name, 'at', location, slotIndex);
    // Implementation would update unit.criticalSlots
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Critical Grid Integration Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>System Configuration</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button 
            onClick={() => handleGyroChange('Standard')}
            style={{
              padding: '8px 16px',
              background: unit.systemComponents?.gyro?.type === 'Standard' ? '#0066cc' : '#ddd',
              color: unit.systemComponents?.gyro?.type === 'Standard' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Standard Gyro (4 slots)
          </button>
          <button 
            onClick={() => handleGyroChange('XL')}
            style={{
              padding: '8px 16px',
              background: unit.systemComponents?.gyro?.type === 'XL' ? '#0066cc' : '#ddd',
              color: unit.systemComponents?.gyro?.type === 'XL' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            XL Gyro (6 slots)
          </button>
          <button 
            onClick={() => handleGyroChange('Compact')}
            style={{
              padding: '8px 16px',
              background: unit.systemComponents?.gyro?.type === 'Compact' ? '#0066cc' : '#ddd',
              color: unit.systemComponents?.gyro?.type === 'Compact' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Compact Gyro (2 slots)
          </button>
        </div>
        
        <div style={{ 
          padding: '10px', 
          background: '#f0f0f0', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Current Gyro:</strong> {unit.systemComponents?.gyro?.type}
        </div>
      </div>
      
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        background: '#fffbf0',
        border: '1px solid #ffc107',
        borderRadius: '4px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>⚠️ Integration Issue</h4>
        <p style={{ margin: '0 0 10px 0' }}>
          The grid below shows the current state, but changing gyro type properly rebuilds the critical slots
          (removing conflicting equipment). Check the console for details.
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          Note: The engine slots may appear empty because CriticalSlotDropZone expects objects, not strings.
        </p>
      </div>
      
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <MechCriticalsAllocationGrid
          unit={unit}
          onEquipmentPlace={handleEquipmentPlace}
          onEquipmentRemove={(location, slotIndex) => {
            console.log('Remove equipment from', location, slotIndex);
          }}
        />
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
        <h4>Debug Info</h4>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify({
            gyroType: unit.systemComponents?.gyro?.type,
            centerTorsoEquipment: unit.criticalSlots[MECH_LOCATIONS.CENTER_TORSO],
            internalStructureLength: calculateCompleteInternalStructure(unit)[MECH_LOCATIONS.CENTER_TORSO]?.length
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
