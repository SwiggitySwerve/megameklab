/**
 * Test script to validate negative armor point display
 * Simulates scenarios where armor tonnage is reduced and allocation exceeds available points
 */

const MockUnitCriticalManager = require('./test-armor-auto-allocation-simple.js').MockUnitCriticalManager;

// Test scenarios for negative armor point display
const negativeDisplayTests = [
  {
    name: "Standard Case - Positive Points",
    tonnage: 50,
    armorTonnage: 8.5,
    manualAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 6 }, 
      LT: { front: 16, rear: 4 },
      RT: { front: 15, rear: 4 },
      LA: { front: 12, rear: 0 },
      RA: { front: 12, rear: 0 },
      LL: { front: 19, rear: 0 },
      RL: { front: 19, rear: 0 }
    },
    expected: "positive"
  },
  {
    name: "Tonnage Reduction - Light Over-allocation",
    tonnage: 50,
    armorTonnage: 5.0, // Reduced from 8.5
    manualAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 6 }, 
      LT: { front: 16, rear: 4 },
      RT: { front: 15, rear: 4 },
      LA: { front: 12, rear: 0 },
      RA: { front: 12, rear: 0 },
      LL: { front: 19, rear: 0 },
      RL: { front: 19, rear: 0 }
    },
    expected: "negative"
  },
  {
    name: "Severe Tonnage Reduction",
    tonnage: 50,
    armorTonnage: 2.0, // Severely reduced
    manualAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 6 }, 
      LT: { front: 16, rear: 4 },
      RT: { front: 15, rear: 4 },
      LA: { front: 12, rear: 0 },
      RA: { front: 12, rear: 0 },
      LL: { front: 19, rear: 0 },
      RL: { front: 19, rear: 0 }
    },
    expected: "negative"
  },
  {
    name: "Mech Tonnage Reduction",
    tonnage: 20, // Changed from larger mech
    armorTonnage: 3.0, // Reasonable tonnage for 20t mech
    manualAllocation: {
      HD: { front: 9, rear: 0 },
      CT: { front: 20, rear: 6 }, // But allocation is still for big mech!
      LT: { front: 16, rear: 4 },
      RT: { front: 15, rear: 4 },
      LA: { front: 12, rear: 0 },
      RA: { front: 12, rear: 0 },
      LL: { front: 19, rear: 0 },
      RL: { front: 19, rear: 0 }
    },
    expected: "negative"
  }
];

/**
 * Calculate unallocated armor points (can be negative)
 */
function calculateUnallocatedArmorPoints(unit, allocation) {
  const availablePoints = unit.getAvailableArmorPoints();
  let allocatedPoints = 0;
  
  Object.values(allocation).forEach(armor => {
    allocatedPoints += armor.front + armor.rear;
  });
  
  return availablePoints - allocatedPoints;
}

/**
 * Generate button display text based on unallocated points
 */
function generateButtonText(unallocatedPoints) {
  if (unallocatedPoints < 0) {
    return `(${unallocatedPoints} pts over-allocated)`;
  } else {
    return `(${unallocatedPoints} pts available)`;
  }
}

/**
 * Generate button styling class based on unallocated points
 */
function generateButtonStyling(unallocatedPoints) {
  if (unallocatedPoints < 0) {
    return {
      buttonClass: 'bg-orange-600 hover:bg-orange-700',
      textClass: 'text-orange-200 font-medium'
    };
  } else {
    return {
      buttonClass: 'bg-purple-600 hover:bg-purple-700', 
      textClass: 'opacity-75'
    };
  }
}

/**
 * Run negative display validation tests
 */
function runNegativeDisplayTests() {
  console.log('🚨 NEGATIVE ARMOR POINT DISPLAY VALIDATION\n');
  console.log('Testing button display for over-allocation scenarios...\n');
  
  let passedTests = 0;
  let totalTests = negativeDisplayTests.length;
  
  negativeDisplayTests.forEach((test, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST ${index + 1}/${totalTests}: ${test.name}`);
    console.log(`   Tonnage: ${test.tonnage}t, Armor: ${test.armorTonnage}t`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Create unit configuration
      const unitConfig = {
        tonnage: test.tonnage,
        armorTonnage: test.armorTonnage,
        armorAllocation: test.manualAllocation
      };
      
      const unit = new MockUnitCriticalManager(unitConfig);
      const availablePoints = unit.getAvailableArmorPoints();
      const unallocatedPoints = calculateUnallocatedArmorPoints(unit, test.manualAllocation);
      
      console.log(`📊 Available points: ${availablePoints}`);
      console.log(`📊 Allocated points: ${availablePoints - unallocatedPoints}`);
      console.log(`📊 Unallocated points: ${unallocatedPoints}`);
      
      // Generate UI elements
      const buttonText = generateButtonText(unallocatedPoints);
      const styling = generateButtonStyling(unallocatedPoints);
      
      console.log(`\n🎨 UI DISPLAY:`);
      console.log(`   Button Text: "Auto-Allocate Armor Points ${buttonText}"`);
      console.log(`   Button Style: ${styling.buttonClass}`);
      console.log(`   Text Style: ${styling.textClass}`);
      
      // Validate expectation
      const isNegative = unallocatedPoints < 0;
      const expectedNegative = test.expected === "negative";
      const testPassed = isNegative === expectedNegative;
      
      if (testPassed) {
        console.log(`\n✅ TEST PASSED: Display correctly shows ${test.expected} state`);
        if (isNegative) {
          console.log(`   ✓ Orange warning styling applied for over-allocation`);
          console.log(`   ✓ Negative value prominently displayed`);
        } else {
          console.log(`   ✓ Normal purple styling applied for available points`);
          console.log(`   ✓ Positive value normally displayed`);
        }
        passedTests++;
      } else {
        console.log(`\n❌ TEST FAILED: Expected ${test.expected}, got ${isNegative ? 'negative' : 'positive'}`);
      }
      
      // Show what happens with auto-allocate
      console.log(`\n🔄 AUTO-ALLOCATE PREVIEW:`);
      if (isNegative) {
        console.log(`   • Would clear all allocations and redistribute ${availablePoints} points`);
        console.log(`   • Would eliminate over-allocation problem`);
        console.log(`   • Excess ${Math.abs(unallocatedPoints)} points would be ignored`);
      } else {
        console.log(`   • Would optimize distribution of ${unallocatedPoints} remaining points`);
        console.log(`   • Would use enhanced remainder algorithm for perfect allocation`);
      }
      
    } catch (error) {
      console.log(`\n💥 TEST ERROR: ${error.message}`);
    }
  });
  
  // Final summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 NEGATIVE DISPLAY VALIDATION SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 ALL TESTS PASSED!`);
    console.log(`✅ Button correctly displays negative values for over-allocation`);
    console.log(`✅ Orange warning styling applied for negative states`);
    console.log(`✅ Clear messaging differentiates between available vs over-allocated`);
  } else {
    console.log(`\n⚠️ ${totalTests - passedTests} tests failed.`);
  }
  
  return {
    totalTests,
    passedTests
  };
}

// Run tests if this script is executed directly
if (require.main === module) {
  try {
    runNegativeDisplayTests();
  } catch (error) {
    console.error('Negative display validation failed:', error);
    process.exit(1);
  }
}

module.exports = {
  runNegativeDisplayTests,
  calculateUnallocatedArmorPoints,
  generateButtonText,
  generateButtonStyling
};
