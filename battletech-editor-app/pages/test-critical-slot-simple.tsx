import React, { useState } from 'react';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { calculateCompleteInternalStructure, handleSystemChange } from '../utils/criticalSlotCalculations';

export default function TestCriticalSlotSimple() {
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
      [MECH_LOCATIONS.CENTER_TORSO]: ['SRM 6', 'SRM 6', null, null, null]
    },
    tech_base: 'Inner Sphere'
  } as any);
  
  const changeGyro = () => {
    console.log('=== BEFORE CHANGE ===');
    console.log('Gyro Type:', unit.systemComponents?.gyro?.type);
    console.log('Critical Slots:', unit.criticalSlots);
    
    const { updatedUnit, removedEquipment } = handleSystemChange(unit, 'gyro', 'XL');
    
    console.log('=== AFTER CHANGE ===');
    console.log('Gyro Type:', updatedUnit.systemComponents?.gyro?.type);
    console.log('Critical Slots:', updatedUnit.criticalSlots);
    console.log('Removed Equipment:', removedEquipment);
    
    setUnit(updatedUnit);
  };
  
  const internalStructure = calculateCompleteInternalStructure(unit);
  const ctStructure = internalStructure[MECH_LOCATIONS.CENTER_TORSO] || [];
  const ctEquipment = (unit.criticalSlots as any)?.[MECH_LOCATIONS.CENTER_TORSO] || [];
  
  // Build display slots
  const displaySlots = [];
  for (let i = 0; i < 12; i++) {
    if (i < ctStructure.length) {
      displaySlots.push(ctStructure[i]);
    } else {
      const equipIndex = i - ctStructure.length;
      displaySlots.push(ctEquipment[equipIndex] || '- Empty -');
    }
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Simple Critical Slot Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Center Torso Slots:</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '60px 200px',
          gap: '5px',
          background: '#f0f0f0',
          padding: '10px',
          borderRadius: '5px'
        }}>
          {displaySlots.map((slot, index) => (
            <React.Fragment key={index}>
              <div style={{ fontWeight: 'bold' }}>Slot {index + 1}:</div>
              <div style={{ 
                color: index < ctStructure.length ? '#0066cc' : '#000',
                fontWeight: index < ctStructure.length ? 'bold' : 'normal'
              }}>
                {slot}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Gyro Type:</strong> {unit.systemComponents?.gyro?.type}</p>
        <p><strong>Internal Structure Slots:</strong> {ctStructure.length}</p>
        <p><strong>Equipment Array Length:</strong> {ctEquipment.length}</p>
      </div>
      
      <button 
        onClick={changeGyro}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Change to XL Gyro
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Expected behavior:</p>
        <ul>
          <li>Standard Gyro: 4 slots (slots 4-7)</li>
          <li>XL Gyro: 6 slots (slots 4-9)</li>
          <li>SRM 6 in slots 8-9 should be removed when changing to XL</li>
        </ul>
      </div>
    </div>
  );
}
