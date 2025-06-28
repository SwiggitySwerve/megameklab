/**
 * Critical Slots Fix Verification Test
 * Tests that special components (Endo Steel, Ferro-Fibrous) are properly created
 * during unit initialization and configuration changes.
 */

const { UnitCriticalManager } = require('./utils/criticalSlots/UnitCriticalManager');

// Helper function to create test configurations
function createTestConfig(overrides = {}) {
  return {
    tonnage: 50,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    walkMP: 4,
    engineRating: 200,
    runMP: 6,
    engineType: 'Standard',
    gyroType: 'Standard',
    structureType: 'Standard',
    armorType: 'Standard',
    armorAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 6 },
      LT: { front: 16, rear: 5 },
      RT: { front: 16, rear: 5 },
      LA: { front: 16, rear: 0 },
      RA: { front: 16, rear: 0 },
      LL: { front: 20, rear: 0 },
      RL: { front: 20, rear: 0 }
    },
    armorTonnage: 8.0,
    heatSinkType: 'Single',
    totalHeatSinks: 10,
    internalHeatSinks: 8,
    externalHeatSinks: 2,
    enhancementType: null,
    jumpMP: 0,
    jumpJetType: 'Standard Jump Jet',
    jumpJetCounts: {},
    hasPartialWing: false,
    mass: 50,
    ...overrides
  };
}

// Test functions
function testStandardComponents() {
  console.log('\n=== Test 1: Standard Components (Should create 0 special components) ===');
  
  const config = createTestConfig();
  const unit = new UnitCriticalManager(config);
  const unallocated = unit.getUnallocatedEquipment();
  
  console.log(`Structure Type: ${config.structureType}`);
  console.log(`Armor Type: ${config.armorType}`);
  console.log(`Unallocated Equipment Count: ${unallocated.length}`);
  
  if (unallocated.length === 0) {
    console.log('✅ PASS: No special components created for Standard structure/armor');
    return true;
  } else {
    console.log('❌ FAIL: Unexpected special components created');
    unallocated.forEach(eq => console.log(`  - ${eq.equipmentData.name}`));
    return false;
  }
}

function testEndoSteelComponents() {
  console.log('\n=== Test 2: Endo Steel Structure (Should create 14 components) ===');
  
  const config = createTestConfig({ structureType: 'Endo Steel' });
  const unit = new UnitCriticalManager(config);
  const unallocated = unit.getUnallocatedEquipment();
  
  console.log(`Structure Type: ${config.structureType}`);
  console.log(`Armor Type: ${config.armorType}`);
  console.log(`Unallocated Equipment Count: ${unallocated.length}`);
  
  // Count Endo Steel components
  const endoSteelComponents = unallocated.filter(eq => 
    eq.equipmentData.name === 'Endo Steel' && 
    eq.equipmentData.componentType === 'structure'
  );
  
  console.log(`Endo Steel Components: ${endoSteelComponents.length}`);
  
  if (endoSteelComponents.length === 14) {
    console.log('✅ PASS: Correct number of Endo Steel components created');
    return true;
  } else {
    console.log(`❌ FAIL: Expected 14 Endo Steel components, got ${endoSteelComponents.length}`);
    return false;
  }
}

function testFerroFibrousComponents() {
  console.log('\n=== Test 3: Ferro-Fibrous Armor (Should create 14 components) ===');
  
  const config = createTestConfig({ armorType: 'Ferro-Fibrous' });
  const unit = new UnitCriticalManager(config);
  const unallocated = unit.getUnallocatedEquipment();
  
  console.log(`Structure Type: ${config.structureType}`);
  console.log(`Armor Type: ${config.armorType}`);
  console.log(`Unallocated Equipment Count: ${unallocated.length}`);
  
  // Count Ferro-Fibrous components
  const ferroFibrousComponents = unallocated.filter(eq => 
    eq.equipmentData.name === 'Ferro-Fibrous' && 
    eq.equipmentData.componentType === 'armor'
  );
  
  console.log(`Ferro-Fibrous Components: ${ferroFibrousComponents.length}`);
  
  if (ferroFibrousComponents.length === 14) {
    console.log('✅ PASS: Correct number of Ferro-Fibrous components created');
    return true;
  } else {
    console.log(`❌ FAIL: Expected 14 Ferro-Fibrous components, got ${ferroFibrousComponents.length}`);
    return false;
  }
}

function testCombinedComponents() {
  console.log('\n=== Test 4: Endo Steel + Ferro-Fibrous (Should create 28 components) ===');
  
  const config = createTestConfig({ 
    structureType: 'Endo Steel', 
    armorType: 'Ferro-Fibrous' 
  });
  const unit = new UnitCriticalManager(config);
  const unallocated = unit.getUnallocatedEquipment();
  
  console.log(`Structure Type: ${config.structureType}`);
  console.log(`Armor Type: ${config.armorType}`);
  console.log(`Unallocated Equipment Count: ${unallocated.length}`);
  
  // Count components by type
  const endoSteelComponents = unallocated.filter(eq => 
    eq.equipmentData.name === 'Endo Steel' && 
    eq.equipmentData.componentType === 'structure'
  );
  
  const ferroFibrousComponents = unallocated.filter(eq => 
    eq.equipmentData.name === 'Ferro-Fibrous' && 
    eq.equipmentData.componentType === 'armor'
  );
  
  console.log(`Endo Steel Components: ${endoSteelComponents.length}`);
  console.log(`Ferro-Fibrous Components: ${ferroFibrousComponents.length}`);
  console.log(`Total Special Components: ${endoSteelComponents.length + ferroFibrousComponents.length}`);
  
  if (endoSteelComponents.length === 14 && ferroFibrousComponents.length === 14) {
    console.log('✅ PASS: Correct number of combined special components created');
    return true;
  } else {
    console.log(`❌ FAIL: Expected 14 Endo Steel + 14 Ferro-Fibrous components`);
    return false;
  }
}

function testConfigurationChange() {
  console.log('\n=== Test 5: Configuration Change (Standard → Endo Steel) ===');
  
  // Start with standard configuration
  const config = createTestConfig();
  const unit = new UnitCriticalManager(config);
  
  console.log('Initial state:');
  console.log(`  Structure Type: ${config.structureType}`);
  console.log(`  Unallocated Equipment Count: ${unit.getUnallocatedEquipment().length}`);
  
  // Change to Endo Steel
  const newConfig = { ...config, structureType: 'Endo Steel' };
  unit.updateConfiguration(newConfig);
  
  const unallocated = unit.getUnallocatedEquipment();
  const endoSteelComponents = unallocated.filter(eq => 
    eq.equipmentData.name === 'Endo Steel' && 
    eq.equipmentData.componentType === 'structure'
  );
  
  console.log('After configuration change:');
  console.log(`  Structure Type: ${newConfig.structureType}`);
  console.log(`  Unallocated Equipment Count: ${unallocated.length}`);
  console.log(`  Endo Steel Components: ${endoSteelComponents.length}`);
  
  if (endoSteelComponents.length === 14) {
    console.log('✅ PASS: Special components correctly created during configuration change');
    return true;
  } else {
    console.log(`❌ FAIL: Expected 14 Endo Steel components after configuration change`);
    return false;
  }
}

function testJumpJetComponents() {
  console.log('\n=== Test 6: Jump Jet Components (Should create jump jets) ===');
  
  const config = createTestConfig({ 
    jumpMP: 4,
    jumpJetType: 'Standard Jump Jet' 
  });
  const unit = new UnitCriticalManager(config);
  const unallocated = unit.getUnallocatedEquipment();
  
  console.log(`Jump MP: ${config.jumpMP}`);
  console.log(`Jump Jet Type: ${config.jumpJetType}`);
  console.log(`Unallocated Equipment Count: ${unallocated.length}`);
  
  // Count jump jet components
  const jumpJetComponents = unallocated.filter(eq => 
    eq.equipmentData.name.includes('Jump')
  );
  
  console.log(`Jump Jet Components: ${jumpJetComponents.length}`);
  
  if (jumpJetComponents.length === 4) {
    console.log('✅ PASS: Correct number of jump jet components created');
    return true;
  } else {
    console.log(`❌ FAIL: Expected 4 jump jet components, got ${jumpJetComponents.length}`);
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🧪 Critical Slots Fix Verification Tests');
  console.log('=========================================');
  
  const results = [];
  
  try {
    results.push(testStandardComponents());
    results.push(testEndoSteelComponents());
    results.push(testFerroFibrousComponents());
    results.push(testCombinedComponents());
    results.push(testConfigurationChange());
    results.push(testJumpJetComponents());
    
    const passed = results.filter(result => result).length;
    const total = results.length;
    
    console.log('\n=== Test Results ===');
    console.log(`Tests Passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! The critical slots fix is working correctly.');
      console.log('\nKey achievements:');
      console.log('✅ Special components are created during unit initialization');
      console.log('✅ Components are created when configuration changes');
      console.log('✅ Proper component counts for Endo Steel (14 slots)');
      console.log('✅ Proper component counts for Ferro-Fibrous (14 slots)');
      console.log('✅ Combined special components work correctly');
      console.log('✅ Jump jet components are created properly');
    } else {
      console.log('❌ Some tests failed. Please review the output above.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error(error.stack);
  }
}

// Run the tests
runAllTests();
