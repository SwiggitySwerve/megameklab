import React from 'react';
import CriticalSlotDropZone from '../components/editor/criticals/CriticalSlotDropZone';
import { CriticalSlotObject } from '../types/criticalSlots';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function TestSlotRendering() {
  // Create test slots exactly as the grid would create them
  const testSlots: any[] = [
    // Slot 0 - Engine (internal structure)
    {
      slotIndex: 0,
      location: 'Center Torso',
      equipment: {
        equipmentId: 'system-Center Torso-0',
        equipmentData: {
          id: 'system-Center Torso-0',
          name: 'Engine',
          type: 'System' as any,
          category: 'System' as any,
          requiredSlots: 1,
          weight: 0,
          isFixed: true,
          isRemovable: false,
          techBase: 'Both' as any
        },
        allocatedSlots: 1,
        startSlotIndex: 0,
        endSlotIndex: 0
      },
      isLocked: true,
      isEmpty: false,
      isPartOfMultiSlot: false,
      slotType: 'normal'
    },
    // Slot 7 - Empty (after gyro)
    {
      slotIndex: 7,
      location: 'Center Torso',
      equipment: null,
      isLocked: false,
      isEmpty: true,
      isPartOfMultiSlot: false,
      slotType: 'normal'
    },
    // Slot 8 - SRM 6 (equipment)
    {
      slotIndex: 8,
      location: 'Center Torso',
      equipment: {
        equipmentId: 'eq-Center Torso-8',
        equipmentData: {
          id: 'eq-Center Torso-8',
          name: 'SRM 6',
          type: 'EQUIPMENT' as any,
          category: 'Equipment' as any,
          requiredSlots: 1,
          weight: 0,
          isFixed: false,
          isRemovable: true,
          techBase: 'Inner Sphere' as any
        },
        allocatedSlots: 1,
        startSlotIndex: 8,
        endSlotIndex: 8
      },
      isLocked: false,
      isEmpty: false,
      isPartOfMultiSlot: false,
      slotType: 'normal'
    }
  ];
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '20px' }}>
        <h1>Critical Slot Rendering Test</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <p>This test shows three different slot types to verify rendering:</p>
          <ul>
            <li>Slot 1: Engine (system component - should show "Engine")</li>
            <li>Slot 8: Empty slot (should show "8")</li>
            <li>Slot 9: SRM 6 (equipment - should show "SRM 6")</li>
          </ul>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '20px',
          padding: '20px',
          background: '#f0f0f0',
          borderRadius: '4px'
        }}>
          {testSlots.map((slot, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <h3>Slot {slot.slotIndex + 1}</h3>
              <div style={{ 
                border: '1px solid #ccc', 
                padding: '10px',
                borderRadius: '4px',
                background: 'white'
              }}>
                <CriticalSlotDropZone
                  location={slot.location}
                  slotIndex={slot.slotIndex}
                  slot={slot}
                  onDrop={() => console.log('Drop')}
                  canAccept={() => false}
                  disabled={slot.isLocked}
                />
              </div>
              <div style={{ 
                marginTop: '10px', 
                fontSize: '12px',
                textAlign: 'left',
                background: '#f9f9f9',
                padding: '10px',
                borderRadius: '4px'
              }}>
                <strong>Debug Info:</strong>
                <pre style={{ margin: '5px 0' }}>
                  {JSON.stringify({
                    hasEquipment: !!slot.equipment,
                    equipmentName: slot.equipment?.equipmentData?.name,
                    isLocked: slot.isLocked,
                    isEmpty: slot.isEmpty
                  }, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#e3f2fd', 
          borderRadius: '4px' 
        }}>
          <h4>What to check:</h4>
          <ol>
            <li>Open browser console to see debug logs</li>
            <li>Slot 1 should display "Engine" (not "1")</li>
            <li>Slot 8 should display "8" (empty slot)</li>
            <li>Slot 9 should display "SRM 6"</li>
          </ol>
        </div>
      </div>
    </DndProvider>
  );
}
