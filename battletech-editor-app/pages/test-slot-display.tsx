import React from 'react';
import CriticalSlotDropZone from '../components/editor/criticals/CriticalSlotDropZone';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function TestSlotDisplay() {
  // Create test slots to see how they display
  const testSlots = [
    {
      slotIndex: 0,
      location: 'Center Torso',
      equipment: {
        equipmentId: 'engine-1',
        equipmentData: {
          id: 'engine-1',
          name: 'Engine',
          type: 'ENGINE',
          category: 'System',
          requiredSlots: 1,
          weight: 0,
          isFixed: true,
          isRemovable: false,
          techBase: 'Both'
        },
        allocatedSlots: 1,
        startSlotIndex: 0,
        endSlotIndex: 0
      },
      slotType: 'normal',
      isLocked: true,
      isEmpty: false,
      isPartOfMultiSlot: false
    },
    {
      slotIndex: 1,
      location: 'Center Torso',
      equipment: null,
      slotType: 'normal',
      isLocked: false,
      isEmpty: true,
      isPartOfMultiSlot: false
    }
  ];
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '20px' }}>
        <h1>Critical Slot Display Test</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Test Slots:</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {testSlots.map((slot, index) => (
              <div key={index} style={{ 
                border: '1px solid #ccc', 
                padding: '10px',
                borderRadius: '4px',
                minWidth: '150px'
              }}>
                <h4>Slot {index + 1}</h4>
                <CriticalSlotDropZone
                  location={slot.location}
                  slotIndex={slot.slotIndex}
                  slot={slot as any}
                  onDrop={() => console.log('Drop')}
                  canAccept={() => false}
                  disabled={slot.isLocked}
                />
                <pre style={{ fontSize: '10px', marginTop: '10px' }}>
                  {JSON.stringify({
                    hasEquipment: !!slot.equipment,
                    equipmentName: slot.equipment?.equipmentData?.name,
                    isLocked: slot.isLocked
                  }, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ marginTop: '30px', padding: '15px', background: '#f0f0f0', borderRadius: '4px' }}>
          <h4>Expected Display:</h4>
          <ul>
            <li>Slot 1: Should show "Engine" (has equipment object)</li>
            <li>Slot 2: Should show "2" (empty slot)</li>
          </ul>
        </div>
      </div>
    </DndProvider>
  );
}
