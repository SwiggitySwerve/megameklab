import React from 'react';
import CriticalSlotDropZone from '../components/editor/criticals/CriticalSlotDropZone';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function TestEngineDisplay() {
  // Create exactly what the grid creates for an Engine slot
  const engineSlot = {
    slotIndex: 0,
    location: 'Center Torso',
    equipment: {
      equipmentId: 'system-Center Torso-0',
      equipmentData: {
        id: 'system-Center Torso-0',
        name: 'Engine',
        type: 'System',
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
    isLocked: true,
    isEmpty: false,
    displayName: 'Engine',
    isPartOfMultiSlot: false,
    slotType: 'normal'
  };
  
  // Log what we're passing
  console.log('Engine slot object:', engineSlot);
  console.log('Has equipment?', engineSlot.equipment !== null);
  console.log('Equipment data:', engineSlot.equipment?.equipmentData);
  console.log('Equipment name:', engineSlot.equipment?.equipmentData?.name);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: '20px' }}>
        <h1>Engine Display Test</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <p>This test shows a single Engine slot exactly as the grid creates it.</p>
          <p>The slot should display "Engine" not "1".</p>
          <p>Check the browser console for debug output.</p>
        </div>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '400px'
        }}>
          <div>
            <h3>Single Engine Slot:</h3>
            <div style={{ 
              border: '2px solid #333', 
              padding: '10px',
              background: '#1a1a1a'
            }}>
              <CriticalSlotDropZone
                location={engineSlot.location}
                slotIndex={engineSlot.slotIndex}
                slot={engineSlot as any}
                onDrop={() => console.log('Drop')}
                canAccept={() => false}
                disabled={engineSlot.isLocked}
              />
            </div>
          </div>
          
          <div style={{ 
            background: '#f0f0f0', 
            padding: '15px',
            borderRadius: '4px',
            color: '#333'
          }}>
            <h4>Slot Data:</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify({
                hasEquipment: !!engineSlot.equipment,
                equipmentName: engineSlot.equipment?.equipmentData?.name,
                isFixed: engineSlot.equipment?.equipmentData?.isFixed,
                isLocked: engineSlot.isLocked
              }, null, 2)}
            </pre>
          </div>
          
          <div style={{ 
            background: '#ffe4e1', 
            padding: '15px',
            borderRadius: '4px',
            color: '#333'
          }}>
            <h4>Expected Result:</h4>
            <p>The slot above should display "Engine" with a gray background (system component color).</p>
            <p>If it shows "1" instead, then the display logic is failing.</p>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
