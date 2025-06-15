import React, { useState } from 'react';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { calculateCompleteInternalStructure, handleSystemChange } from '../utils/criticalSlotCalculations';

export default function TestIntegratedCriticalSlots() {
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
  
  const changeGyroType = (newType: string) => {
    console.log('Changing gyro type to:', newType);
    
    // THIS IS THE KEY - Actually call handleSystemChange
    const { updatedUnit, removedEquipment } = handleSystemChange(unit, 'gyro', newType);
    
    console.log('Removed equipment:', removedEquipment);
    
    // Update the unit state
    setUnit(updatedUnit);
  };
  
  // Calculate display slots
  const internalStructure = calculateCompleteInternalStructure(unit);
  const ctStructure = internalStructure[MECH_LOCATIONS.CENTER_TORSO] || [];
  const ctEquipment = (unit.criticalSlots as any)?.[MECH_LOCATIONS.CENTER_TORSO] || [];
  
  // Build complete slot display
  const displaySlots = [];
  
  // First add all internal structure
  ctStructure.forEach((item, i) => {
    displaySlots.push({
      index: i,
      content: item,
      type: 'internal'
    });
  });
  
  // Then add equipment
  ctEquipment.forEach((item: any, i: number) => {
    displaySlots.push({
      index: ctStructure.length + i,
      content: item || '- Empty -',
      type: 'equipment'
    });
  });
  
  // Pad to 12 slots if needed
  while (displaySlots.length < 12) {
    displaySlots.push({
      index: displaySlots.length,
      content: '- Empty -',
      type: 'empty'
    });
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Integrated Critical Slot System Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Configuration:</h3>
        <p><strong>Gyro Type:</strong> {unit.systemComponents?.gyro?.type}</p>
        <p><strong>Internal Structure Slots:</strong> {ctStructure.length}</p>
        <p><strong>Equipment Slots Available:</strong> {12 - ctStructure.length}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Gyro Type Selection:</h3>
        <button 
          onClick={() => changeGyroType('Standard')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: unit.systemComponents?.gyro?.type === 'Standard' ? '#0066cc' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Standard Gyro (4 slots)
        </button>
        <button 
          onClick={() => changeGyroType('XL')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: unit.systemComponents?.gyro?.type === 'XL' ? '#0066cc' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          XL Gyro (6 slots)
        </button>
        <button 
          onClick={() => changeGyroType('Compact')}
          style={{
            padding: '10px 20px',
            background: unit.systemComponents?.gyro?.type === 'Compact' ? '#0066cc' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Compact Gyro (2 slots)
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Center Torso Critical Slots:</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '60px 200px',
          gap: '5px',
          background: '#f0f0f0',
          padding: '15px',
          borderRadius: '5px',
          maxWidth: '400px'
        }}>
          {displaySlots.slice(0, 12).map((slot) => (
            <React.Fragment key={slot.index}>
              <div style={{ 
                fontWeight: 'bold',
                color: '#666'
              }}>
                {slot.index + 1}:
              </div>
              <div style={{ 
                color: slot.type === 'internal' ? '#0066cc' : 
                       slot.type === 'equipment' ? '#ff6600' : '#999',
                fontWeight: slot.type === 'internal' ? 'bold' : 'normal',
                background: slot.type === 'internal' ? '#e3f2fd' : 
                           slot.type === 'equipment' && slot.content !== '- Empty -' ? '#fff3e0' : 'transparent',
                padding: '2px 5px',
                borderRadius: '3px'
              }}>
                {slot.content}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#f9f9f9', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4>How it works:</h4>
        <ul>
          <li>Standard Gyro uses slots 4-7 (4 slots)</li>
          <li>XL Gyro uses slots 4-9 (6 slots)</li>
          <li>Compact Gyro uses slots 4-5 (2 slots)</li>
          <li>When switching to a larger gyro, equipment in conflicting slots is removed</li>
          <li>When switching to a smaller gyro, more slots become available for equipment</li>
        </ul>
        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
          Try placing equipment with Standard gyro, then switch to XL to see it get removed!
        </p>
      </div>
    </div>
  );
}
