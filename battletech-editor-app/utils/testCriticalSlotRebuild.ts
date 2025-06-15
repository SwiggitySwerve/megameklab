import { EditableUnit, MECH_LOCATIONS } from '../types/editor';
import { calculateCompleteInternalStructure, rebuildCriticalSlots, handleSystemChange } from './criticalSlotCalculations';

// Test scenario: Standard Gyro -> XL Gyro with SRM 6 in slot 8
export function testGyroChangeScenario() {
  console.log('=== Testing Standard Gyro -> XL Gyro Transition ===\n');
  
  // Create a test unit with standard gyro
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
      [MECH_LOCATIONS.CENTER_TORSO]: ['SRM 6', 'SRM 6', null, null, null] // Equipment in slots 8-9 (indices 0-1)
    },
    tech_base: 'Inner Sphere'
  } as any;
  
  // Calculate initial internal structure
  const initialStructure = calculateCompleteInternalStructure(testUnit);
  console.log('Initial Center Torso Structure:', initialStructure[MECH_LOCATIONS.CENTER_TORSO]);
  console.log('Initial Center Torso Equipment:', testUnit.criticalSlots[MECH_LOCATIONS.CENTER_TORSO]);
  console.log('Initial structure takes', initialStructure[MECH_LOCATIONS.CENTER_TORSO].length, 'slots');
  
  // Simulate changing to XL Gyro
  console.log('\n--- Changing to XL Gyro ---\n');
  
  const { updatedUnit, removedEquipment } = handleSystemChange(testUnit, 'gyro', 'XL');
  
  // Calculate new internal structure
  const newStructure = calculateCompleteInternalStructure(updatedUnit);
  console.log('New Center Torso Structure:', newStructure[MECH_LOCATIONS.CENTER_TORSO]);
  console.log('New Center Torso Equipment:', updatedUnit.criticalSlots[MECH_LOCATIONS.CENTER_TORSO]);
  console.log('New structure takes', newStructure[MECH_LOCATIONS.CENTER_TORSO].length, 'slots');
  
  console.log('\nRemoved Equipment:', removedEquipment);
  
  // Verify results
  console.log('\n=== Verification ===');
  console.log('Gyro type changed:', testUnit.systemComponents?.gyro?.type, '->', updatedUnit.systemComponents?.gyro?.type);
  console.log('Equipment removed:', removedEquipment.length > 0 ? 'YES' : 'NO');
  console.log('SRM 6 removed from CT:', removedEquipment.some(item => 
    item.location === MECH_LOCATIONS.CENTER_TORSO && item.equipment === 'SRM 6'
  ) ? 'YES' : 'NO');
}

// Run the test
if (typeof window !== 'undefined') {
  (window as any).testGyroChange = testGyroChangeScenario;
  console.log('Test function available as: window.testGyroChange()');
}
