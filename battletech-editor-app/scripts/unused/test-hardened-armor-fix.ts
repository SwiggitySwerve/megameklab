/**
 * Test script to verify the hardened armor critical slot fix
 */

import { UnitCriticalManager } from './utils/criticalSlots/UnitCriticalManager';

// Test configuration with hardened armor
const testConfig = {
  tonnage: 50,
  unitType: 'BattleMech' as const,
  techBase: 'Inner Sphere' as const,
  walkMP: 4,
  engineRating: 200,
  runMP: 6,
  engineType: 'Standard' as const,
  gyroType: 'Standard' as const,
  structureType: 'Standard' as const,
  armorType: 'Hardened' as const,  // This should NOT create any equipment pieces
  heatSinkType: 'Single' as const,
  totalHeatSinks: 10,
  internalHeatSinks: 0,
  externalHeatSinks: 0,
  mass: 50
};

console.log('🔧 Testing Hardened Armor Critical Slot Fix...\n');

try {
  // Create unit with hardened armor
  const unit = new UnitCriticalManager(testConfig);
  
  // Get unallocated equipment (should be empty for hardened armor)
  const unallocatedEquipment = unit.getUnallocatedEquipment();
  
  console.log('📊 Test Results:');
  console.log('================');
  console.log(`Armor Type: ${testConfig.armorType}`);
  console.log(`Unallocated Equipment Count: ${unallocatedEquipment.length}`);
  
  // Check if any armor pieces were created
  const armorPieces = unallocatedEquipment.filter(eq => 
    (eq.equipmentData as any).componentType === 'armor' && 
    eq.equipmentData.name === 'Hardened'
  );
  
  console.log(`Hardened Armor Pieces Created: ${armorPieces.length}`);
  
  if (armorPieces.length === 0) {
    console.log('\n✅ SUCCESS: Hardened Armor correctly creates NO equipment pieces!');
    console.log('   Bug has been FIXED - hardened armor no longer takes critical slots.');
  } else {
    console.log('\n❌ FAILURE: Hardened Armor incorrectly created equipment pieces!');
    console.log('   Bug still exists - hardened armor is taking critical slots.');
    console.log('\nIncorrect armor pieces:');
    armorPieces.forEach((piece, index) => {
      console.log(`  ${index + 1}. ${piece.equipmentData.name} (ID: ${piece.equipmentData.id})`);
    });
  }
  
  // Test other armor types for comparison
  console.log('\n🧪 Testing Other Armor Types for Comparison:');
  console.log('=============================================');
  
  const testCases = [
    { armorType: 'Standard' as const, expectedSlots: 0 },
    { armorType: 'Ferro-Fibrous' as const, expectedSlots: 14 },
    { armorType: 'Ferro-Fibrous (Clan)' as const, expectedSlots: 7 },
    { armorType: 'Stealth' as const, expectedSlots: 12 },
    { armorType: 'Reactive' as const, expectedSlots: 14 },
    { armorType: 'Reflective' as const, expectedSlots: 10 },
  ];
  
  testCases.forEach(testCase => {
    const config = { ...testConfig, armorType: testCase.armorType };
    const testUnit = new UnitCriticalManager(config);
    const equipment = testUnit.getUnallocatedEquipment();
    const armorEquipment = equipment.filter(eq => 
      (eq.equipmentData as any).componentType === 'armor' && 
      eq.equipmentData.name === testCase.armorType
    );
    
    const status = armorEquipment.length === testCase.expectedSlots ? '✅' : '❌';
    console.log(`${status} ${testCase.armorType}: ${armorEquipment.length}/${testCase.expectedSlots} pieces`);
  });
  
  console.log('\n📋 Summary:');
  console.log('===========');
  console.log('• Hardened Armor should create 0 critical slot pieces');
  console.log('• Standard Armor should create 0 critical slot pieces');
  console.log('• Ferro-Fibrous should create 14 critical slot pieces (IS) or 7 (Clan)');
  console.log('• Other special armors should create their correct number of pieces');
  
} catch (error: any) {
  console.error('❌ Test failed with error:', error.message);
  console.error('Stack trace:', error.stack);
}
