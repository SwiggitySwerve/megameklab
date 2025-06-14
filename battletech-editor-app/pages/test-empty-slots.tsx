import React from 'react';
import { EditableUnit } from '../types/editor';

const TestEmptySlots: React.FC = () => {
  const testUnit: EditableUnit = {
    id: 'test-unit',
    chassis: 'Test',
    model: 'Empty',
    tonnage: 100,
    tech_base: 'Inner Sphere',
    data: {
      criticals: [
        { 
          location: 'Left Torso', 
          slots: [
            'LRM 20', 
            'LRM 20', 
            'LRM 20', 
            'LRM 20', 
            'LRM 20',
            '- Empty -',  // Initially empty slot
            '-Empty-',    // Another format
            null,         // Null value
            undefined,    // Undefined value
            '',           // Empty string
            ' ',          // Space
            '-'           // Dash
          ] 
        },
      ],
      weapons_and_equipment: [
        { item_name: 'LRM 20', item_type: 'weapon', location: 'Left Torso', tech_base: 'IS' },
        { item_name: 'Heat Sink', item_type: 'equipment', location: '', tech_base: 'IS' }
      ]
    }
  } as any;

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

  const slots = testUnit.data?.criticals?.[0]?.slots || [];

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Empty Slot Test</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Index</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Raw Value</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Type</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>isEmptySlot Result</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Converted to null?</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Passed as</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, index) => {
            const isEmpty = isEmptySlot(slot);
            const convertedValue = isEmpty ? null : slot;
            const passedValue = convertedValue === null ? undefined : convertedValue;
            
            return (
              <tr key={index}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{index}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {slot === null ? 'null' : 
                   slot === undefined ? 'undefined' : 
                   slot === '' ? '(empty string)' :
                   slot === ' ' ? '(space)' :
                   `"${slot}"`}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{typeof slot}</td>
                <td style={{ 
                  border: '1px solid #ccc', 
                  padding: '8px',
                  backgroundColor: isEmpty ? '#90EE90' : '#FFB6C1'
                }}>
                  {isEmpty ? 'TRUE' : 'FALSE'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {convertedValue === null ? 'null' : `"${convertedValue}"`}
                </td>
                <td style={{ 
                  border: '1px solid #ccc', 
                  padding: '8px',
                  backgroundColor: passedValue === undefined ? '#ADD8E6' : '#FFA07A'
                }}>
                  {passedValue === undefined ? 'undefined' : `"${passedValue}"`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Summary:</h2>
        <ul>
          <li>Initially empty slots get converted to <code>null</code> in state</li>
          <li>When passed to CriticalSlotDropZone, <code>null</code> becomes <code>undefined</code></li>
          <li>Slots cleared by removing equipment become <code>null</code> in state</li>
          <li>Both should result in <code>undefined</code> being passed to the drop zone</li>
        </ul>
        
        <h3>The Issue:</h3>
        <p>
          If initially empty slots cannot accept drops but cleared slots can, the issue must be elsewhere.
          Perhaps the problem is in how the drop zones are being initialized or in the canAccept function.
        </p>
      </div>
    </div>
  );
};

export default TestEmptySlots;
