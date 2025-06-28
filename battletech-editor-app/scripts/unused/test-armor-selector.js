/**
 * Test Script: Armor Tonnage Selector Functionality
 * Tests the maximum armor calculation and input handling fixes
 */

const { UnitCriticalManager, UnitConfigurationBuilder } = require('./utils/criticalSlots/UnitCriticalManager');

function testArmorCalculations() {
  console.log('🔧 Testing Armor Tonnage Selector Fixes...\n');

  // Test 1: Basic 50-ton mech with standard armor
  console.log('Test 1: 50-ton Mech with Standard Armor');
  const config50ton = {
    tonnage: 50,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    walkMP: 4,
    engineType: 'Standard',
    gyroType: 'Standard',
    structureType: 'Standard',
    armorType: 'Standard',
    heatSinkType: 'Single',
    totalHeatSinks: 10,
    jumpMP: 0,
    jumpJetType: 'Standard Jump Jet',
    jumpJetCounts: {},
    hasPartialWing: false,
    armorAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 10 },
      LT: { front: 15, rear: 5 },
      RT: { front: 15, rear: 5 },
      LA: { front: 12, rear: 0 },
      RA: { front: 12, rear: 0 },
      LL: { front: 18, rear: 0 },
      RL: { front: 18, rear: 0 }
    },
    totalArmorPoints: 134,
    armorTonnage: 8.5,
    maxArmorPoints: 176,
    enhancementType: null,
    mass: 50
  };

  try {
    const unit50 = new UnitCriticalManager(config50ton);
    
    // Test maximum armor calculations
    const maxArmorTonnage = unit50.getMaxArmorTonnage();
    const maxArmorPoints = unit50.getMaxArmorPoints();
    const remainingTonnage = unit50.getRemainingTonnageForArmor();
    const physicalMaxTonnage = unit50.getPhysicalMaxArmorTonnage();
    
    console.log(`  Max Armor Tonnage: ${maxArmorTonnage.toFixed(1)} tons`);
    console.log(`  Max Armor Points: ${maxArmorPoints} points`);
    console.log(`  Remaining Tonnage for Armor: ${remainingTonnage.toFixed(1)} tons`);
    console.log(`  Physical Max Tonnage: ${physicalMaxTonnage.toFixed(1)} tons`);
    
    // Test that we can increase armor
    const testConfig = {
      ...config50ton,
      armorTonnage: Math.min(maxArmorTonnage, 12.0),
      totalArmorPoints: Math.floor(Math.min(maxArmorTonnage, 12.0) * 16),
      maxArmorPoints: Math.floor(Math.min(maxArmorTonnage, 12.0) * 16)
    };
    
    unit50.updateConfiguration(testConfig);
    const newConfig = unit50.getConfiguration();
    
    console.log(`  Test Update: Set armor to ${testConfig.armorTonnage} tons`);
    console.log(`  Result: Armor is now ${newConfig.armorTonnage} tons`);
    console.log(`  ✅ Armor increase ${newConfig.armorTonnage >= config50ton.armorTonnage ? 'PASSED' : 'FAILED'}\n`);
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
  }

  // Test 2: 75-ton mech with Ferro-Fibrous
  console.log('Test 2: 75-ton Mech with Ferro-Fibrous Armor');
  const config75ton = {
    tonnage: 75,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    walkMP: 3,
    engineType: 'Standard',
    gyroType: 'Standard',
    structureType: 'Standard',
    armorType: 'Ferro-Fibrous',
    heatSinkType: 'Single',
    totalHeatSinks: 10,
    jumpMP: 0,
    jumpJetType: 'Standard Jump Jet',
    jumpJetCounts: {},
    hasPartialWing: false,
    armorAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 25, rear: 12 },
      LT: { front: 20, rear: 8 },
      RT: { front: 20, rear: 8 },
      LA: { front: 18, rear: 0 },
      RA: { front: 18, rear: 0 },
      LL: { front: 24, rear: 0 },
      RL: { front: 24, rear: 0 }
    },
    totalArmorPoints: 186,
    armorTonnage: 10.5,
    maxArmorPoints: 231,
    enhancementType: null,
    mass: 75
  };

  try {
    const unit75 = new UnitCriticalManager(config75ton);
    
    const maxArmorTonnage = unit75.getMaxArmorTonnage();
    const armorEfficiency = unit75.getArmorEfficiency();
    const maxArmorPoints = unit75.getMaxArmorPoints();
    
    console.log(`  Max Armor Tonnage: ${maxArmorTonnage.toFixed(1)} tons`);
    console.log(`  Armor Efficiency: ${armorEfficiency.toFixed(2)} points/ton`);
    console.log(`  Max Armor Points: ${maxArmorPoints} points`);
    
    // Test decreasing armor
    const testConfigDecrease = {
      ...config75ton,
      armorTonnage: 8.0,
      totalArmorPoints: Math.floor(8.0 * armorEfficiency),
      maxArmorPoints: Math.floor(8.0 * armorEfficiency)
    };
    
    unit75.updateConfiguration(testConfigDecrease);
    const newConfig = unit75.getConfiguration();
    
    console.log(`  Test Update: Reduced armor to ${testConfigDecrease.armorTonnage} tons`);
    console.log(`  Result: Armor is now ${newConfig.armorTonnage} tons`);
    console.log(`  ✅ Armor decrease ${newConfig.armorTonnage <= config75ton.armorTonnage ? 'PASSED' : 'FAILED'}\n`);
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
  }

  // Test 3: Maximum armor edge case
  console.log('Test 3: Maximum Armor Edge Case');
  const configMaxArmor = {
    tonnage: 100,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    walkMP: 3,
    engineType: 'Standard',
    gyroType: 'Standard',
    structureType: 'Standard',
    armorType: 'Standard',
    heatSinkType: 'Single',
    totalHeatSinks: 10,
    jumpMP: 0,
    jumpJetType: 'Standard Jump Jet',
    jumpJetCounts: {},
    hasPartialWing: false,
    armorAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 31, rear: 15 },
      LT: { front: 25, rear: 12 },
      RT: { front: 25, rear: 12 },
      LA: { front: 20, rear: 0 },
      RA: { front: 20, rear: 0 },
      LL: { front: 31, rear: 0 },
      RL: { front: 31, rear: 0 }
    },
    totalArmorPoints: 231,
    armorTonnage: 14.5,
    maxArmorPoints: 307,
    enhancementType: null,
    mass: 100
  };

  try {
    const unitMax = new UnitCriticalManager(configMaxArmor);
    
    const maxArmorTonnage = unitMax.getMaxArmorTonnage();
    const remainingTonnage = unitMax.getRemainingTonnageForArmor();
    const physicalMaxTonnage = unitMax.getPhysicalMaxArmorTonnage();
    
    console.log(`  Max Armor Tonnage: ${maxArmorTonnage.toFixed(1)} tons`);
    console.log(`  Remaining Tonnage for Armor: ${remainingTonnage.toFixed(1)} tons`);
    console.log(`  Physical Max Tonnage: ${physicalMaxTonnage.toFixed(1)} tons`);
    console.log(`  Current Armor: ${configMaxArmor.armorTonnage} tons`);
    
    // Test setting to maximum
    const testConfigMax = {
      ...configMaxArmor,
      armorTonnage: maxArmorTonnage,
      totalArmorPoints: Math.floor(maxArmorTonnage * 16),
      maxArmorPoints: Math.floor(maxArmorTonnage * 16)
    };
    
    unitMax.updateConfiguration(testConfigMax);
    const newConfig = unitMax.getConfiguration();
    
    console.log(`  Test Update: Set armor to maximum ${maxArmorTonnage} tons`);
    console.log(`  Result: Armor is now ${newConfig.armorTonnage} tons`);
    console.log(`  ✅ Maximum armor ${Math.abs(newConfig.armorTonnage - maxArmorTonnage) < 0.1 ? 'PASSED' : 'FAILED'}\n`);
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
  }

  // Test 4: Head armor enforcement
  console.log('Test 4: Head Armor Limit Enforcement');
  const configHeadTest = {
    ...config50ton,
    armorAllocation: {
      ...config50ton.armorAllocation,
      HD: { front: 15, rear: 0 } // Try to exceed 9-point limit
    }
  };

  try {
    const unitHead = new UnitCriticalManager(configHeadTest);
    const newConfig = unitHead.getConfiguration();
    
    console.log(`  Attempted Head Armor: 15 points`);
    console.log(`  Actual Head Armor: ${newConfig.armorAllocation.HD.front} points`);
    console.log(`  ✅ Head armor limit ${newConfig.armorAllocation.HD.front <= 9 ? 'ENFORCED' : 'FAILED'}\n`);
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
  }

  console.log('🎯 Armor Tonnage Selector Test Complete!');
}

// Run the tests
if (require.main === module) {
  testArmorCalculations();
}

module.exports = { testArmorCalculations };
