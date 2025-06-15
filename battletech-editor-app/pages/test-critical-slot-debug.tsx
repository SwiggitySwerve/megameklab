import React, { useEffect, useState } from 'react';
import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { calculateCompleteInternalStructure } from '../utils/criticalSlotCalculations';

export default function TestCriticalSlotDebug() {
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  useEffect(() => {
    // Create a test unit with XL gyro
    const testUnit: EditableUnit = {
      systemComponents: {
        engine: { type: 'Standard', rating: 300 },
        gyro: { type: 'XL' },
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
    
    const internalStructure = calculateCompleteInternalStructure(testUnit);
    const ctStructure = internalStructure[MECH_LOCATIONS.CENTER_TORSO];
    
    let output = '=== Debug Info ===\n\n';
    output += 'Center Torso Internal Structure:\n';
    output += JSON.stringify(ctStructure, null, 2) + '\n\n';
    output += 'Length: ' + ctStructure.length + ' slots\n\n';
    
    output += 'Expected:\n';
    output += '- Slots 1-3: Engine\n';
    output += '- Slots 4-9: XL Gyro (6 slots)\n';
    output += '- Total: 9 internal structure slots\n\n';
    
    output += 'Critical Slots Array (equipment only):\n';
    output += JSON.stringify((testUnit.criticalSlots as any)[MECH_LOCATIONS.CENTER_TORSO], null, 2) + '\n\n';
    
    output += 'UI Slot Mapping:\n';
    output += '- Internal Structure: UI slots 1-9\n';
    output += '- Equipment Index 0 (SRM 6): Should map to UI slot 10\n';
    output += '- Equipment Index 1 (SRM 6): Should map to UI slot 11\n';
    
    setDebugInfo(output);
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Critical Slot Debug Info</h1>
      <pre style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap'
      }}>
        {debugInfo}
      </pre>
    </div>
  );
}
