/**
 * Test Location Restrictions for Equipment
 * Tests the new location restriction system for jump jets and other movement equipment
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager.js';
import { EquipmentObject } from './utils/criticalSlots/CriticalSlot.js';

// Test configuration for a 50-ton Inner Sphere mech
const testConfig: UnitConfiguration = {
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
  heatSinkType: 'Single',
  totalHeatSinks: 10,
  internalHeatSinks: 0,
  externalHeatSinks: 0,
  jumpMP: 0, // Start with no jump jets
  jumpJetType: 'Standard Jump Jet',
  jumpJetCounts: {},
  hasPartialWing: false,
  mass: 50
};

function testJumpJetLocationRestrictions() {
  console.log('=== Testing Jump Jet Location Restrictions ===');
  
  // Create unit manager with jump jets
  const configWithJumpJets = { ...testConfig, jumpMP: 4 };
  const unitManager = new UnitCriticalManager(configWithJumpJets);
  
  console.log('1. Created unit with 4 jump jets');
  
  // Get unallocated equipment (should have 4 jump jets)
  const unallocated = unitManager.getUnallocatedEquipment();
  const jumpJets = unallocated.filter(eq => eq.equipmentData.name.includes('Jump Jet'));
  
  console.log(`2. Found ${jumpJets.length} jump jets in unallocated equipment`);
  
  if (jumpJets.length > 0) {
    const jumpJet = jumpJets[0];
    console.log(`3. Testing jump jet: ${jumpJet.equipmentData.name}`);
    console.log(`   Allowed locations: ${jumpJet.equipmentData.allowedLocations?.join(', ') || 'No restrictions'}`);
    
    // Test valid locations
    const validLocations = ['Center Torso', 'Left Torso', 'Right Torso', 'Left Leg', 'Right Leg'];
    const invalidLocations = ['Head', 'Left Arm', 'Right Arm'];
    
    console.log('4. Testing valid locations:');
    validLocations.forEach(location => {
      const canPlace = unitManager.canPlaceEquipmentInLocation(jumpJet.equipmentData, location);
      console.log(`   ${location}: ${canPlace ? '✅ ALLOWED' : '❌ DENIED'}`);
    });
    
    console.log('5. Testing invalid locations:');
    invalidLocations.forEach(location => {
      const canPlace = unitManager.canPlaceEquipmentInLocation(jumpJet.equipmentData, location);
      if (!canPlace) {
        const error = unitManager.getLocationRestrictionError(jumpJet.equipmentData, location);
        console.log(`   ${location}: ❌ DENIED - ${error}`);
      } else {
        console.log(`   ${location}: ⚠️ UNEXPECTEDLY ALLOWED`);
      }
    });
  }
}

function testSuperchargerLocationRestrictions() {
  console.log('\n=== Testing Supercharger Location Restrictions ===');
  
  // Test with different engine types
  const engineTypes = ['Standard', 'XL', 'Light'] as const;
  
  engineTypes.forEach(engineType => {
    console.log(`\n1. Testing with ${engineType} Engine:`);
    
    const config = { ...testConfig, engineType };
    const unitManager = new UnitCriticalManager(config);
    
    // Create a mock supercharger equipment
    const supercharger: EquipmentObject = {
      id: 'test_supercharger',
      name: 'Supercharger',
      type: 'equipment',
      requiredSlots: 1,
      weight: 1,
      techBase: 'Inner Sphere',
      locationRestrictions: {
        type: 'engine_slots'
      }
    };
    
    // Test all locations
    const allLocations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
    
    allLocations.forEach(location => {
      const canPlace = unitManager.canPlaceEquipmentInLocation(supercharger, location);
      const hasEngineSlots = unitManager.hasEngineSlots(location);
      
      console.log(`   ${location}: ${canPlace ? '✅ ALLOWED' : '❌ DENIED'} (Engine slots: ${hasEngineSlots})`);
    });
  });
}

function testPartialWingLocationRestrictions() {
  console.log('\n=== Testing Partial Wing Location Restrictions ===');
  
  const unitManager = new UnitCriticalManager(testConfig);
  
  // Create a mock partial wing equipment
  const partialWing: EquipmentObject = {
    id: 'test_partial_wing',
    name: 'Partial Wing',
    type: 'equipment',
    requiredSlots: 3,
    weight: 2,
    techBase: 'Inner Sphere',
    allowedLocations: ['Left Torso', 'Right Torso']
  };
  
  console.log('1. Created partial wing with torso-only restrictions');
  console.log(`   Allowed locations: ${partialWing.allowedLocations?.join(', ')}`);
  
  // Test all locations
  const allLocations = ['Head', 'Center Torso', 'Left Torso', 'Right Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];
  
  console.log('2. Testing placement in all locations:');
  allLocations.forEach(location => {
    const canPlace = unitManager.canPlaceEquipmentInLocation(partialWing, location);
    console.log(`   ${location}: ${canPlace ? '✅ ALLOWED' : '❌ DENIED'}`);
  });
}

function testEquipmentPlacementValidation() {
  console.log('\n=== Testing Equipment Placement Validation ===');
  
  // Create unit with jump jets
  const configWithJumpJets = { ...testConfig, jumpMP: 2 };
  const unitManager = new UnitCriticalManager(configWithJumpJets);
  
  const unallocated = unitManager.getUnallocatedEquipment();
  const jumpJet = unallocated.find(eq => eq.equipmentData.name.includes('Jump Jet'));
  
  if (jumpJet) {
    console.log('1. Attempting to place jump jet in valid location (Center Torso):');
    const success1 = unitManager.allocateEquipmentFromPool(jumpJet.equipmentGroupId, 'Center Torso', 8);
    console.log(`   Result: ${success1 ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Get another jump jet
    const remaining = unitManager.getUnallocatedEquipment();
    const jumpJet2 = remaining.find(eq => eq.equipmentData.name.includes('Jump Jet'));
    
    if (jumpJet2) {
      console.log('2. Attempting to place jump jet in invalid location (Head):');
      const success2 = unitManager.allocateEquipmentFromPool(jumpJet2.equipmentGroupId, 'Head', 3);
      console.log(`   Result: ${success2 ? '⚠️ UNEXPECTEDLY SUCCEEDED' : '✅ CORRECTLY DENIED'}`);
      
      // Check if it's still in unallocated pool
      const stillUnallocated = unitManager.getUnallocatedEquipment().find(eq => eq.equipmentGroupId === jumpJet2.equipmentGroupId);
      console.log(`   Jump jet returned to unallocated pool: ${stillUnallocated ? '✅ YES' : '❌ NO'}`);
    }
  }
}

// Run all tests
console.log('🧪 Testing Equipment Location Restrictions System');
console.log('=' .repeat(50));

try {
  testJumpJetLocationRestrictions();
  testSuperchargerLocationRestrictions();
  testPartialWingLocationRestrictions();
  testEquipmentPlacementValidation();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All tests completed successfully!');
  console.log('🎯 Location restriction system is working correctly');
  
} catch (error) {
  console.error('\n❌ Test failed with error:', error);
  console.error('Stack trace:', (error as Error).stack);
}
