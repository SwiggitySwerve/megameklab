import React, { useState, useEffect } from 'react';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { calculateCompleteInternalStructure, rebuildCriticalSlots } from '../utils/criticalSlotCalculations';

export default function TestRebuildLogic() {
  const [log, setLog] = useState<string[]>([]);
  
  useEffect(() => {
    const logs: string[] = [];
    
    // Create test unit with Standard gyro
    const testUnit: EditableUnit = {
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
    } as any;
    
    logs.push('=== Initial State ===');
    logs.push(`Gyro Type: ${testUnit.systemComponents?.gyro?.type}`);
    logs.push(`Equipment Array: ${JSON.stringify(testUnit.criticalSlots[MECH_LOCATIONS.CENTER_TORSO])}`);
    
    // Calculate internal structure for Standard gyro
    const oldStructure = calculateCompleteInternalStructure(testUnit);
    logs.push(`\nOld Internal Structure (length ${oldStructure[MECH_LOCATIONS.CENTER_TORSO].length}):`);
    oldStructure[MECH_LOCATIONS.CENTER_TORSO].forEach((item, i) => {
      logs.push(`  Slot ${i + 1}: ${item}`);
    });
    
    // Change to XL Gyro
    const xlUnit = { ...testUnit };
    xlUnit.systemComponents = {
      ...xlUnit.systemComponents!,
      gyro: { type: 'XL' }
    };
    
    // Calculate new internal structure
    const newStructure = calculateCompleteInternalStructure(xlUnit);
    logs.push(`\nNew Internal Structure (length ${newStructure[MECH_LOCATIONS.CENTER_TORSO].length}):`);
    newStructure[MECH_LOCATIONS.CENTER_TORSO].forEach((item, i) => {
      logs.push(`  Slot ${i + 1}: ${item}`);
    });
    
    // Test rebuild logic
    const { newCriticalSlots, removedEquipment } = rebuildCriticalSlots(testUnit, newStructure);
    
    logs.push(`\n=== Rebuild Results ===`);
    logs.push(`New Equipment Array: ${JSON.stringify(newCriticalSlots[MECH_LOCATIONS.CENTER_TORSO])}`);
    logs.push(`Removed Equipment: ${JSON.stringify(removedEquipment)}`);
    
    // Show slot mapping
    logs.push(`\n=== Slot Mapping ===`);
    logs.push(`With Standard Gyro (7 internal slots):`);
    logs.push(`  Equipment index 0 (SRM 6) -> UI slot 8`);
    logs.push(`  Equipment index 1 (SRM 6) -> UI slot 9`);
    logs.push(`\nWith XL Gyro (9 internal slots):`);
    logs.push(`  UI slots 8-9 are now internal structure`);
    logs.push(`  SRM 6s should be removed`);
    
    setLog(logs);
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Rebuild Logic Test</h1>
      <pre style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        fontSize: '12px'
      }}>
        {log.join('\n')}
      </pre>
    </div>
  );
}
