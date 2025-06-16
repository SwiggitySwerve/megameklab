/**
 * Test Equipment Displacement Fix
 * Tests that equipment is properly displaced to unallocated pool when engine changes to XL
 */

const { UnitCriticalManager } = require('./utils/criticalSlots/UnitCriticalManager');

function createTestUnit() {
  const config = {
    engineType: 'Standard',
    gyroType: 'Standard',
    mass: 50,
    unitType: 'BattleMech'
  };
  
  return new UnitCriticalManager(config);
}

function addTestEquipment(unit) {
  const testEquipment = [
    {
      id: 'test_weapon_1',
      name: 'AC/10',
      type: 'weapon',
      requiredSlots: 7,
      weight: 12,
      techBase: 'Inner Sphere',
      isGrouped: false
    },
    {
      id: 'test_weapon_2',
      name: 'Medium Laser',
      type: 'weapon',
      requiredSlots: 1,
      weight: 1,
      techBase: 'Inner Sphere',
      isGrouped: false
    },
    {
      id: 'test_equipment_1',
      name: 'Heat Sink',
      type: 'heat_sink',
      requiredSlots: 1,
      weight: 1,
      techBase: 'Inner Sphere',
      isGrouped: false
    }
  ];

  // Add equipment to different locations
  const leftTorso = unit.getSection('Left Torso');
  const rightTorso = unit.getSection('Right Torso');
  const centerTorso = unit.getSection('Center Torso');

  // Place AC/10 in Left Torso (slots 1-7, indices 0-6)
  leftTorso.allocateEquipment(testEquipment[0], 0);
  
  // Place Medium Laser in Right Torso (slot 1, index 0)
  rightTorso.allocateEquipment(testEquipment[1], 0);
  
  // Place Heat Sink in Center Torso (slot 10, index 9) - this will conflict with XL engine
  centerTorso.allocateEquipment(testEquipment[2], 9);

  return testEquipment;
}

function printUnitState(unit, label) {
  console.log(`\n=== ${label} ===`);
  console.log(`Engine: ${unit.getEngineType()}, Gyro: ${unit.getGyroType()}`);
  
  const summary = unit.getSummary();
  console.log(`Allocated Equipment: ${summary.totalEquipment}`);
  console.log(`Unallocated Equipment: ${summary.unallocatedEquipment}`);
  
  const equipmentByLocation = unit.getEquipmentByLocation();
  
  console.log('\nEquipment by Location:');
  equipmentByLocation.forEach((equipment, location) => {
    console.log(`  ${location}:`);
    equipment.forEach(eq => {
      console.log(`    - ${eq.equipmentData.name} (slots ${eq.occupiedSlots.map(s => s + 1).join(', ')})`);
    });
  });
}

function testEquipmentDisplacement() {
  console.log('Testing Equipment Displacement Fix');
  console.log('==================================');
  
  // Step 1: Create unit with Standard engine
  const unit = createTestUnit();
  console.log('✓ Created unit with Standard engine');
  
  // Step 2: Add test equipment
  const equipment = addTestEquipment(unit);
  console.log('✓ Added test equipment');
  
  printUnitState(unit, 'BEFORE Engine Change');
  
  // Step 3: Change engine to XL (this should displace equipment, not remove it)
  console.log('\n🔄 Changing engine from Standard to XL...');
  
  const newConfig = {
    ...unit.getConfiguration(),
    engineType: 'XL'
  };
  
  unit.updateConfiguration(newConfig);
  
  printUnitState(unit, 'AFTER Engine Change to XL');
  
  // Step 4: Verify fix worked
  const afterSummary = unit.getSummary();
  const unallocatedEquipment = unit.getUnallocatedEquipment();
  
  console.log('\n=== VERIFICATION ===');
  console.log(`Total equipment before: 3`);
  console.log(`Total equipment after (allocated + unallocated): ${afterSummary.totalEquipment + afterSummary.unallocatedEquipment}`);
  
  if (afterSummary.totalEquipment + afterSummary.unallocatedEquipment === 3) {
    console.log('✅ SUCCESS: All equipment preserved (displaced to unallocated pool)');
  } else {
    console.log('❌ FAILURE: Equipment was lost during engine change');
  }
  
  if (unallocatedEquipment.length > 0) {
    console.log('\nDisplaced equipment details:');
    unallocatedEquipment.forEach(eq => {
      console.log(`  - ${eq.equipmentData.name} (${eq.equipmentData.requiredSlots} slots)`);
    });
  }
  
  // Test changing back to Standard
  console.log('\n🔄 Changing engine back to Standard...');
  const standardConfig = {
    ...unit.getConfiguration(),
    engineType: 'Standard'
  };
  
  unit.updateConfiguration(standardConfig);
  printUnitState(unit, 'AFTER Engine Change back to Standard');
  
  return afterSummary.totalEquipment + afterSummary.unallocatedEquipment === 3;
}

// Run the test
if (require.main === module) {
  try {
    const success = testEquipmentDisplacement();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

module.exports = { testEquipmentDisplacement };
