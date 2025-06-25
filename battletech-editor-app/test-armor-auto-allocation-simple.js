/**
 * Armor Auto-Allocation Validation Script (Simple Version)
 * Tests the enhanced remainder distribution algorithm using a mock data model
 */

// Mock UnitCriticalManager for testing
class MockUnitCriticalManager {
  constructor(config) {
    this.config = config;
  }
  
  getConfiguration() {
    return this.config;
  }
  
  getAvailableArmorPoints() {
    // Standard armor: 16 points per ton
    return Math.floor(this.config.armorTonnage * 16);
  }
  
  getMaxArmorPointsForLocation(location) {
    // Calculate max armor based on internal structure
    const is = this.getInternalStructureForLocation(location);
    return location === 'HD' ? 9 : is * 2; // Head max is always 9
  }
  
  getInternalStructureForLocation(location) {
    const tonnage = this.config.tonnage;
    
    // BattleTech internal structure table
    const structureTable = {
      20: { HD: 3, CT: 6, LT: 4, RT: 4, LA: 3, RA: 3, LL: 4, RL: 4 },
      25: { HD: 3, CT: 8, LT: 6, RT: 6, LA: 4, RA: 4, LL: 6, RL: 6 },
      30: { HD: 3, CT: 10, LT: 7, RT: 7, LA: 5, RA: 5, LL: 7, RL: 7 },
      35: { HD: 3, CT: 11, LT: 8, RT: 8, LA: 6, RA: 6, LL: 8, RL: 8 },
      40: { HD: 3, CT: 12, LT: 10, RT: 10, LA: 6, RA: 6, LL: 10, RL: 10 },
      45: { HD: 3, CT: 14, LT: 11, RT: 11, LA: 7, RA: 7, LL: 11, RL: 11 },
      50: { HD: 3, CT: 16, LT: 12, RT: 12, LA: 8, RA: 8, LL: 12, RL: 12 },
      55: { HD: 3, CT: 18, LT: 13, RT: 13, LA: 9, RA: 9, LL: 13, RL: 13 },
      60: { HD: 3, CT: 20, LT: 14, RT: 14, LA: 10, RA: 10, LL: 14, RL: 14 },
      65: { HD: 3, CT: 21, LT: 15, RT: 15, LA: 10, RA: 10, LL: 15, RL: 15 },
      70: { HD: 3, CT: 22, LT: 15, RT: 15, LA: 11, RA: 11, LL: 15, RL: 15 },
      75: { HD: 3, CT: 23, LT: 16, RT: 16, LA: 12, RA: 12, LL: 16, RL: 16 },
      80: { HD: 3, CT: 25, LT: 17, RT: 17, LA: 13, RA: 13, LL: 17, RL: 17 },
      85: { HD: 3, CT: 27, LT: 18, RT: 18, LA: 14, RA: 14, LL: 18, RL: 18 },
      90: { HD: 3, CT: 29, LT: 19, RT: 19, LA: 15, RA: 15, LL: 19, RL: 19 },
      95: { HD: 3, CT: 30, LT: 20, RT: 20, LA: 16, RA: 16, LL: 20, RL: 20 },
      100: { HD: 3, CT: 31, LT: 21, RT: 21, LA: 17, RA: 17, LL: 21, RL: 21 }
    };
    
    return structureTable[tonnage]?.[location] || 0;
  }
}

// Test configurations
const testConfigurations = [
  // Standard allocation tests
  { name: "Light Mech (20t)", tonnage: 20, armorTonnage: 3.5 },
  { name: "Light Mech (35t)", tonnage: 35, armorTonnage: 6 },
  { name: "Medium Mech (50t)", tonnage: 50, armorTonnage: 8.5 },
  { name: "Heavy Mech (75t)", tonnage: 75, armorTonnage: 13 },
  { name: "Assault Mech (100t)", tonnage: 100, armorTonnage: 18 },
  { name: "Edge Case (50t/5.5t)", tonnage: 50, armorTonnage: 5.5 },
  
  // Maximum armor tonnage tests (these often have small remainder)
  { name: "Maximum Armor (50t)", tonnage: 50, armorTonnage: 11.0, description: "Maximum armor tonnage test" },
  { name: "Maximum Armor (75t)", tonnage: 75, armorTonnage: 16.5, description: "Maximum armor tonnage test" },
  { name: "Maximum Armor (100t)", tonnage: 100, armorTonnage: 22.0, description: "Maximum armor tonnage test" },
  { name: "Near-Maximum (50t)", tonnage: 50, armorTonnage: 10.5, description: "Near-maximum armor test" },
  
  // Over-allocation validation tests
  { name: "Over-Allocation Light (20t/10t)", tonnage: 20, armorTonnage: 10, expectCapped: true },
  { name: "Over-Allocation Medium (50t/20t)", tonnage: 50, armorTonnage: 20, expectCapped: true },
  { name: "Over-Allocation Heavy (75t/25t)", tonnage: 75, armorTonnage: 25, expectCapped: true },
  { name: "Over-Allocation Assault (100t/30t)", tonnage: 100, armorTonnage: 30, expectCapped: true },
  { name: "Extreme Over-Allocation (20t/50t)", tonnage: 20, armorTonnage: 50, expectCapped: true },
  
  // Tonnage reduction scenarios (simulating user reducing armor tonnage)
  { name: "Tonnage Reduction (100t/5t)", tonnage: 100, armorTonnage: 5, description: "Simulates reducing 15t→5t" },
  { name: "Tonnage Reduction (75t/3t)", tonnage: 75, armorTonnage: 3, description: "Simulates reducing 13t→3t" },
  { name: "Tonnage Reduction (50t/2t)", tonnage: 50, armorTonnage: 2, description: "Simulates reducing 8.5t→2t" }
];

/**
 * Enhanced auto-allocation algorithm (extracted from UI component)
 */
function autoAllocateArmor(unit) {
  const config = unit.getConfiguration();
  const availableArmorPoints = unit.getAvailableArmorPoints();
  
  console.log(`\n🔄 Auto-allocating ${availableArmorPoints} armor points...`);
  
  const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
  const newAllocation = {};
  let remainingPoints = availableArmorPoints;
  
  // Clear current allocation
  locations.forEach(loc => {
    newAllocation[loc] = { front: 0, rear: 0 };
  });
  
  // Step 1: Maximize head armor first
  const headMaxArmor = unit.getMaxArmorPointsForLocation('HD');
  const headArmor = Math.min(headMaxArmor, remainingPoints);
  newAllocation['HD'] = { front: headArmor, rear: 0 };
  remainingPoints -= headArmor;
  
  console.log(`  Head: ${headArmor} points allocated`);
  
  // Step 2: Get internal structure for remaining locations
  const getRemainingLocationIS = (location) => {
    const maxLocationArmor = unit.getMaxArmorPointsForLocation(location);
    if (location === 'HD') return 0;
    return Math.floor(maxLocationArmor / 2);
  };
  
  const remainingLocations = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
  const internalStructure = {};
  let totalRemainingIS = 0;
  
  remainingLocations.forEach(location => {
    const is = getRemainingLocationIS(location);
    internalStructure[location] = is;
    totalRemainingIS += is;
  });
  
  // Step 3: Distribute remaining points by internal structure ratios
  const distributedPoints = {};
  let usedPoints = 0;
  
  console.log(`  Ratio-based distribution (${remainingPoints} points):`);
  
  remainingLocations.forEach(location => {
    if (totalRemainingIS === 0) return;
    
    const isRatio = internalStructure[location] / totalRemainingIS;
    const targetArmor = Math.floor(remainingPoints * isRatio);
    const maxLocationArmor = unit.getMaxArmorPointsForLocation(location);
    const actualArmor = Math.min(targetArmor, maxLocationArmor);
    
    distributedPoints[location] = actualArmor;
    usedPoints += actualArmor;
    
    // Apply 75% front / 25% rear split for torsos
    if (['CT', 'LT', 'RT'].includes(location)) {
      const frontArmor = Math.ceil(actualArmor * 0.75);
      const rearArmor = actualArmor - frontArmor;
      
      const maxRearArmor = Math.floor(maxLocationArmor * 0.5);
      const finalRearArmor = Math.min(rearArmor, maxRearArmor);
      const finalFrontArmor = actualArmor - finalRearArmor;
      
      newAllocation[location] = {
        front: finalFrontArmor,
        rear: finalRearArmor
      };
      
      console.log(`    ${location}: ${actualArmor} (${finalFrontArmor}F/${finalRearArmor}R)`);
    } else {
      newAllocation[location] = {
        front: actualArmor,
        rear: 0
      };
      
      console.log(`    ${location}: ${actualArmor}`);
    }
  });
  
  // Step 4: Distribute remainder points
  const remainder = remainingPoints - usedPoints;
  
  if (remainder > 0) {
    console.log(`  Remainder distribution (${remainder} points):`);
    
    const locationPriority = remainingLocations
      .map(location => {
        const maxArmor = unit.getMaxArmorPointsForLocation(location);
        const currentArmor = distributedPoints[location];
        const availableCapacity = maxArmor - currentArmor;
        
        return {
          location,
          availableCapacity,
          currentArmor,
          maxArmor,
          priority: ['CT', 'LT', 'RT'].includes(location) ? 3 : 
                   ['LL', 'RL'].includes(location) ? 2 : 1
        };
      })
      .filter(item => item.availableCapacity > 0)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.availableCapacity - a.availableCapacity;
      });
    
    let remainderToDistribute = remainder;
    let priorityIndex = 0;
    
    while (remainderToDistribute > 0 && locationPriority.length > 0) {
      const targetLocation = locationPriority[priorityIndex];
      
      if (targetLocation.availableCapacity > 0) {
        const location = targetLocation.location;
        const currentAllocation = newAllocation[location];
        
        currentAllocation.front += 1;
        targetLocation.availableCapacity -= 1;
        remainderToDistribute -= 1;
        
        console.log(`    +1 point to ${location} front armor`);
      }
      
      if (targetLocation.availableCapacity <= 0) {
        locationPriority.splice(priorityIndex, 1);
        if (priorityIndex >= locationPriority.length) {
          priorityIndex = 0;
        }
      } else {
        priorityIndex = (priorityIndex + 1) % locationPriority.length;
      }
    }
    
    if (remainderToDistribute > 0) {
      console.warn(`  ⚠️ Could not distribute ${remainderToDistribute} remainder points`);
    }
  } else {
    console.log(`  No remainder points to distribute`);
  }
  
  return newAllocation;
}

/**
 * Calculate theoretical maximum armor points that can be allocated
 * based on location limits (regardless of tonnage)
 */
function calculateTheoreticalMaxArmor(unit) {
  const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
  let totalMax = 0;
  
  locations.forEach(location => {
    const maxLocationArmor = unit.getMaxArmorPointsForLocation(location);
    totalMax += maxLocationArmor;
  });
  
  return totalMax;
}

/**
 * Enhanced validation of armor allocation results
 */
function validateAllocation(unit, allocation) {
  const availablePoints = unit.getAvailableArmorPoints();
  const theoreticalMaxArmor = calculateTheoreticalMaxArmor(unit);
  let totalAllocated = 0;
  let validationResults = {
    totalAllocated: 0,
    availablePoints,
    theoreticalMaxArmor,
    unallocatedPoints: 0,
    locationDetails: {},
    violations: [],
    battleTechRuleViolations: []
  };
  
  // Count total allocated points and validate each location
  Object.entries(allocation).forEach(([location, armor]) => {
    const locationTotal = armor.front + armor.rear;
    totalAllocated += locationTotal;
    
    const maxLocationArmor = unit.getMaxArmorPointsForLocation(location);
    const isValid = locationTotal <= maxLocationArmor;
    
    validationResults.locationDetails[location] = {
      allocated: locationTotal,
      front: armor.front,
      rear: armor.rear,
      max: maxLocationArmor,
      valid: isValid,
      efficiency: maxLocationArmor > 0 ? ((locationTotal / maxLocationArmor) * 100).toFixed(1) : '0.0'
    };
    
    // Rule 1: Total section armor must not exceed maximum
    if (!isValid) {
      validationResults.violations.push(
        `${location}: ${locationTotal} > ${maxLocationArmor} (exceeds section maximum)`
      );
      validationResults.battleTechRuleViolations.push(
        `BT Rule Violation: ${location} armor (${locationTotal}) exceeds IS×2 limit (${maxLocationArmor})`
      );
    }
    
    // Rule 2: Rear armor limits for torsos (50% rule)
    if (['CT', 'LT', 'RT'].includes(location)) {
      const maxRear = Math.floor(maxLocationArmor * 0.5);
      if (armor.rear > maxRear) {
        validationResults.violations.push(
          `${location}: rear ${armor.rear} > ${maxRear} (exceeds 50% rule)`
        );
        validationResults.battleTechRuleViolations.push(
          `BT Rule Violation: ${location} rear armor (${armor.rear}) exceeds 50% limit (${maxRear})`
        );
      }
    }
    
    // Rule 3: Head armor special case (always max 9)
    if (location === 'HD' && locationTotal > 9) {
      validationResults.violations.push(
        `${location}: ${locationTotal} > 9 (head armor limit)`
      );
      validationResults.battleTechRuleViolations.push(
        `BT Rule Violation: Head armor cannot exceed 9 points`
      );
    }
    
    // Rule 4: Non-torso locations should not have rear armor
    if (!['CT', 'LT', 'RT'].includes(location) && armor.rear > 0) {
      validationResults.violations.push(
        `${location}: ${armor.rear} rear armor not allowed (only torsos have rear armor)`
      );
      validationResults.battleTechRuleViolations.push(
        `BT Rule Violation: ${location} cannot have rear armor`
      );
    }
  });
  
  validationResults.totalAllocated = totalAllocated;
  validationResults.unallocatedPoints = availablePoints - totalAllocated;
  
  // Check if available points exceed theoretical maximum
  if (availablePoints > theoreticalMaxArmor) {
    validationResults.violations.push(
      `Available points (${availablePoints}) exceed theoretical maximum (${theoreticalMaxArmor}) - location limits will cap allocation`
    );
  }
  
  return validationResults;
}

/**
 * Run comprehensive test suite
 */
function runValidationTests() {
  console.log('🛡️  ARMOR AUTO-ALLOCATION VALIDATION SUITE\n');
  console.log('Testing enhanced remainder distribution algorithm...\n');
  
  let passedTests = 0;
  let totalTests = testConfigurations.length;
  let summaryResults = [];
  
  testConfigurations.forEach((testConfig, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST ${index + 1}/${totalTests}: ${testConfig.name}`);
    console.log(`   Tonnage: ${testConfig.tonnage}t, Armor: ${testConfig.armorTonnage}t`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Create unit configuration
      const unitConfig = {
        tonnage: testConfig.tonnage,
        armorTonnage: testConfig.armorTonnage,
        armorAllocation: {
          HD: { front: 0, rear: 0 },
          CT: { front: 0, rear: 0 },
          LT: { front: 0, rear: 0 },
          RT: { front: 0, rear: 0 },
          LA: { front: 0, rear: 0 },
          RA: { front: 0, rear: 0 },
          LL: { front: 0, rear: 0 },
          RL: { front: 0, rear: 0 }
        }
      };
      
      // Create unit and test allocation
      const unit = new MockUnitCriticalManager(unitConfig);
      const availablePoints = unit.getAvailableArmorPoints();
      
      console.log(`📊 Available armor points: ${availablePoints}`);
      
      // Run auto-allocation
      const allocation = autoAllocateArmor(unit);
      
      // Validate results
      const validation = validateAllocation(unit, allocation);
      
      // Display results
      console.log(`\n📋 ALLOCATION RESULTS:`);
      console.log(`   Total Available: ${validation.availablePoints}`);
      console.log(`   Total Allocated: ${validation.totalAllocated}`);
      console.log(`   Unallocated: ${validation.unallocatedPoints}`);
      console.log(`   Utilization: ${((validation.totalAllocated / validation.availablePoints) * 100).toFixed(1)}%`);
      
      // Show theoretical maximum for over-allocation tests
      if (testConfig.expectCapped || validation.availablePoints > validation.theoreticalMaxArmor) {
        console.log(`   Theoretical Max: ${validation.theoreticalMaxArmor} (location limits)`);
        const effectiveMax = Math.min(validation.availablePoints, validation.theoreticalMaxArmor);
        console.log(`   Effective Max: ${effectiveMax} (capped by ${validation.availablePoints > validation.theoreticalMaxArmor ? 'locations' : 'tonnage'})`);
        console.log(`   Effective Utilization: ${((validation.totalAllocated / effectiveMax) * 100).toFixed(1)}%`);
      }
      
      console.log(`\n📍 LOCATION BREAKDOWN:`);
      Object.entries(validation.locationDetails).forEach(([location, details]) => {
        const status = details.valid ? '✅' : '❌';
        const rearText = details.rear > 0 ? `/${details.rear}R` : '';
        const efficiency = details.efficiency;
        console.log(`   ${status} ${location}: ${details.front}F${rearText} = ${details.allocated}/${details.max} (${efficiency}%)`);
      });
      
      // Check for violations
      if (validation.violations.length > 0) {
        console.log(`\n⚠️ VIOLATIONS:`);
        validation.violations.forEach(violation => {
          console.log(`   ❌ ${violation}`);
        });
      }
      
      // Check for BattleTech rule violations
      if (validation.battleTechRuleViolations.length > 0) {
        console.log(`\n🚫 BATTLETECH RULE VIOLATIONS:`);
        validation.battleTechRuleViolations.forEach(violation => {
          console.log(`   ⚠️ ${violation}`);
        });
      }
      
      // Determine test result based on test type
      let testPassed;
      
      if (testConfig.expectCapped) {
        // Over-allocation tests: Success if no BattleTech rule violations and effective utilization is 100%
        const effectiveMax = Math.min(validation.availablePoints, validation.theoreticalMaxArmor);
        const effectiveUtilization = (validation.totalAllocated / effectiveMax) * 100;
        const hasRuleViolations = validation.battleTechRuleViolations.length > 0;
        
        testPassed = !hasRuleViolations && Math.abs(effectiveUtilization - 100) < 0.1;
        
        if (testPassed) {
          console.log(`\n✅ OVER-ALLOCATION TEST PASSED: All locations maxed out, no BattleTech rule violations`);
          console.log(`   Expected behavior: ${validation.unallocatedPoints} points left unallocated due to location limits`);
        } else {
          console.log(`\n❌ OVER-ALLOCATION TEST FAILED: BattleTech rule violations or ineffective allocation`);
        }
      } else {
        // Standard tests: Success if no violations and full utilization
        testPassed = validation.violations.length === 0 && validation.unallocatedPoints === 0;
        
        if (testPassed) {
          console.log(`\n✅ TEST PASSED: Perfect allocation with no violations`);
        } else {
          console.log(`\n❌ TEST FAILED: ${validation.violations.length} violations, ${validation.unallocatedPoints} unallocated`);
        }
      }
      
      if (testPassed) {
        passedTests++;
      }
      
      // Store summary result
      summaryResults.push({
        name: testConfig.name,
        passed: testPassed,
        utilization: (validation.totalAllocated / validation.availablePoints) * 100,
        unallocated: validation.unallocatedPoints,
        violations: validation.violations.length
      });
      
    } catch (error) {
      console.log(`\n💥 TEST ERROR: ${error.message}`);
      summaryResults.push({
        name: testConfig.name,
        passed: false,
        error: error.message
      });
    }
  });
  
  // Final summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 VALIDATION SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  
  console.log(`\n📈 DETAILED RESULTS:`);
  summaryResults.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    if (result.error) {
      console.log(`${status} ${result.name}: ERROR - ${result.error}`);
    } else {
      console.log(`${status} ${result.name}: ${result.utilization.toFixed(1)}% utilization, ${result.unallocated} unallocated, ${result.violations} violations`);
    }
  });
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 ALL TESTS PASSED! Enhanced remainder distribution working perfectly.`);
  } else {
    console.log(`\n⚠️ ${totalTests - passedTests} tests failed. Review algorithm for edge cases.`);
  }
  
  return {
    totalTests,
    passedTests,
    results: summaryResults
  };
}

// Run the validation if this script is executed directly
if (require.main === module) {
  try {
    runValidationTests();
  } catch (error) {
    console.error('Validation script failed:', error);
    process.exit(1);
  }
}

module.exports = {
  runValidationTests,
  autoAllocateArmor,
  validateAllocation,
  MockUnitCriticalManager
};
