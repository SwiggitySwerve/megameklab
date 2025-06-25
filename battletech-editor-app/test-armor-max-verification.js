/**
 * Test script to verify armor maximum calculations for 50-ton mech
 */

const { getInternalStructurePoints, getMaxArmorPoints } = require('./utils/internalStructureTable');

console.log('=== 50-Ton BattleMech Armor Maximum Verification ===\n');

// Test internal structure points for 50-ton mech
console.log('1. Internal Structure Points:');
const structure = getInternalStructurePoints(50);
console.log(`   Head: ${structure.HD}`);
console.log(`   Center Torso: ${structure.CT}`);
console.log(`   Left/Right Torso: ${structure.LT}/${structure.RT}`);
console.log(`   Left/Right Arm: ${structure.LA}/${structure.RA}`);
console.log(`   Left/Right Leg: ${structure.LL}/${structure.RL}`);

// Calculate max armor per location
console.log('\n2. Maximum Armor Points per Location:');
console.log(`   Head: 9 (fixed maximum)`);
console.log(`   Center Torso: ${structure.CT * 2} (${structure.CT} × 2)`);
console.log(`   Left Torso: ${structure.LT * 2} (${structure.LT} × 2)`);
console.log(`   Right Torso: ${structure.RT * 2} (${structure.RT} × 2)`);
console.log(`   Left Arm: ${structure.LA * 2} (${structure.LA} × 2)`);
console.log(`   Right Arm: ${structure.RA * 2} (${structure.RA} × 2)`);
console.log(`   Left Leg: ${structure.LL * 2} (${structure.LL} × 2)`);
console.log(`   Right Leg: ${structure.RL * 2} (${structure.RL} × 2)`);

// Test max armor points calculation
const maxArmorPoints = getMaxArmorPoints(50);
console.log(`\n3. Total Maximum Armor Points: ${maxArmorPoints}`);

// Convert to tonnage for different armor types
console.log('\n4. Maximum Armor Tonnage:');
console.log(`   Standard Armor: ${(maxArmorPoints / 16).toFixed(2)} tons (${maxArmorPoints} ÷ 16 pts/ton)`);
console.log(`   Ferro-Fibrous: ${(maxArmorPoints / 17.92).toFixed(2)} tons (${maxArmorPoints} ÷ 17.92 pts/ton)`);

// Verify against official BattleTech values
console.log('\n5. Expected Values (per BattleTech Construction Rules):');
console.log('   50-ton mech should have 169 max armor points');
console.log('   169 ÷ 16 = 10.56 tons standard armor maximum');
console.log('   168 armor points costs 10.5 tons');
console.log('   160 armor points costs 10 tons');

console.log('\n6. Test Result:');
if (maxArmorPoints === 169) {
    console.log('   ✅ CORRECT: Max armor points calculation matches BattleTech rules');
} else {
    console.log(`   ❌ ERROR: Expected 169, got ${maxArmorPoints}`);
}
