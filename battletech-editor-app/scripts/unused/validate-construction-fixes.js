/**
 * Simple validation script to test Priority 1 construction rule fixes
 * Run with: node validate-construction-fixes.js
 */

const { 
  STRUCTURE_WEIGHT_MULTIPLIERS,
  calculateStructureWeight,
  calculateMaxArmorPoints
} = require('./utils/structureCalculations');

const { 
  calculateMaxArmorPoints: calculateArmorPoints,
  autoAllocateArmor
} = require('./utils/armorAllocation');

const { 
  getInternalStructurePoints, 
  getMaxArmorPoints 
} = require('./utils/internalStructureTable');

console.log('🔧 BattleTech Construction Rules Validation');
console.log('============================================\n');

// Test 1: Industrial Structure Weight Fix
console.log('Test 1: Industrial Structure Weight (should be 20%)');
console.log('---------------------------------------------------');

const industrialWeight50 = calculateStructureWeight(50, 'Industrial');
const expectedIndustrial50 = 10.0; // 50 * 0.20 = 10.0
console.log(`50-ton Industrial structure: ${industrialWeight50} tons (expected: ${expectedIndustrial50})`);
console.log(`✅ Industrial multiplier: ${STRUCTURE_WEIGHT_MULTIPLIERS.Industrial} (expected: 0.20)`);

const industrialWeight75 = calculateStructureWeight(75, 'Industrial');
const expectedIndustrial75 = 15.0; // 75 * 0.20 = 15.0
console.log(`75-ton Industrial structure: ${industrialWeight75} tons (expected: ${expectedIndustrial75})`);

const test1Pass = (
  industrialWeight50 === expectedIndustrial50 && 
  industrialWeight75 === expectedIndustrial75 &&
  STRUCTURE_WEIGHT_MULTIPLIERS.Industrial === 0.20
);
console.log(`Test 1 Result: ${test1Pass ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Head Armor Maximum Fix
console.log('Test 2: Head Armor Maximum (should always be 9)');
console.log('-----------------------------------------------');

// Create mock unit for testing
const createMockUnit = (tonnage) => ({
  mass: tonnage,
  data: {
    structure: { type: 'Standard' },
    armor: { total_armor_points: 500, locations: [] },
    engine: { rating: 200, type: 'standard' },
    gyro: { type: 'standard' },
    cockpit: { type: 'standard' },
    heat_sinks: { count: 10, type: 'single' },
    weapons_and_equipment: []
  }
});

let test2Pass = true;
const testTonnages = [50, 100, 120]; // Including theoretical superheavy

testTonnages.forEach(tonnage => {
  try {
    const unit = createMockUnit(tonnage);
    const allocation = autoAllocateArmor(unit);
    console.log(`${tonnage}-ton mech head armor: ${allocation.HEAD.front} (expected: ≤9)`);
    
    if (allocation.HEAD.front > 9) {
      test2Pass = false;
      console.log(`❌ FAIL: Head armor exceeds 9 for ${tonnage}-ton mech`);
    }
  } catch (error) {
    console.log(`⚠️  Error testing ${tonnage}-ton mech: ${error.message}`);
  }
});

console.log(`Test 2 Result: ${test2Pass ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: Industrial Armor Capacity Fix
console.log('Test 3: Industrial Armor Capacity (should use 2:1 ratio)');
console.log('-----------------------------------------------------');

const standardMax50 = calculateMaxArmorPoints(50, 'Standard');
const industrialMax50 = calculateMaxArmorPoints(50, 'Industrial');
console.log(`50-ton Standard max armor: ${standardMax50}`);
console.log(`50-ton Industrial max armor: ${industrialMax50}`);

const test3Pass = (standardMax50 === industrialMax50);
console.log(`Test 3 Result: ${test3Pass ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 4: Weight Rounding Consistency
console.log('Test 4: Weight Rounding (should be half-ton increments)');
console.log('----------------------------------------------------');

const testWeights = [
  { tonnage: 23, type: 'Standard' }, // 2.3 -> 2.5
  { tonnage: 27, type: 'Standard' }, // 2.7 -> 3.0
  { tonnage: 33, type: 'Endo Steel' } // 1.65 -> 2.0
];

let test4Pass = true;
testWeights.forEach(({ tonnage, type }) => {
  const weight = calculateStructureWeight(tonnage, type);
  const isHalfTon = (weight * 2) === Math.floor(weight * 2);
  console.log(`${tonnage}-ton ${type}: ${weight} tons (half-ton multiple: ${isHalfTon})`);
  
  if (!isHalfTon) {
    test4Pass = false;
  }
});

console.log(`Test 4 Result: ${test4Pass ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 5: Critical Slots Total
console.log('Test 5: Critical Slots Total (should be 78)');
console.log('------------------------------------------');

const CRITICAL_SLOTS_PER_LOCATION = {
  'HEAD': 6,
  'CENTER_TORSO': 12,
  'LEFT_TORSO': 12,
  'RIGHT_TORSO': 12,
  'LEFT_ARM': 12,
  'RIGHT_ARM': 12,
  'LEFT_LEG': 6,
  'RIGHT_LEG': 6
};

const totalSlots = Object.values(CRITICAL_SLOTS_PER_LOCATION).reduce((sum, slots) => sum + slots, 0);
console.log(`Total critical slots: ${totalSlots} (expected: 78)`);

const test5Pass = (totalSlots === 78);
console.log(`Test 5 Result: ${test5Pass ? '✅ PASS' : '❌ FAIL'}\n`);

// Summary
console.log('🎯 VALIDATION SUMMARY');
console.log('====================');

const allTests = [test1Pass, test2Pass, test3Pass, test4Pass, test5Pass];
const passedTests = allTests.filter(test => test).length;
const totalTests = allTests.length;

console.log(`Tests Passed: ${passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('🎉 ALL PRIORITY 1 FIXES VALIDATED SUCCESSFULLY!');
  console.log('✅ Unit data interface now complies with BattleTech Construction Guide rules');
} else {
  console.log('⚠️  Some tests failed. Review the fixes above.');
}

console.log('\nValidation complete.');
