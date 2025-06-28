/**
 * Armor Auto-Allocation Validation Script
 * Tests the enhanced remainder distribution algorithm
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager';

// Test configurations for various unit types and armor amounts
const testConfigurations = [
  // Light Mechs
  { name: "Light Mech (20t)", tonnage: 20, armorTonnage: 3.5 },
  { name: "Light Mech (25t)", tonnage: 25, armorTonnage: 4 },
  { name: "Light Mech (30t)", tonnage: 30, armorTonnage: 5 },
  { name: "Light Mech (35t)", tonnage: 35, armorTonnage: 6 },
  
  // Medium Mechs
  { name: "Medium Mech (40t)", tonnage: 40, armorTonnage: 6.5 },
  { name: "Medium Mech (45t)", tonnage: 45, armorTonnage: 7.5 },
  { name: "Medium Mech (50t)", tonnage: 50, armorTonnage: 8.5 },
  { name: "Medium Mech (55t)", tonnage: 55, armorTonnage: 9.5 },
  
  // Heavy Mechs
  { name: "Heavy Mech (60t)", tonnage: 60, armorTonnage: 10 },
  { name: "Heavy Mech (65t)", tonnage: 65, armorTonnage: 11 },
  { name: "Heavy Mech (70t)", tonnage: 70, armorTonnage: 12 },
  { name: "Heavy Mech (75t)", tonnage: 75, armorTonnage: 13 },
  
  // Assault Mechs
  { name: "Assault Mech (80t)", tonnage: 80, armorTonnage: 14 },
  { name: "Assault Mech (85t)", tonnage: 85, armorTonnage: 15 },
  { name: "Assault Mech (90t)", tonnage: 90, armorTonnage: 16 },
  { name: "Assault Mech (95t)", tonnage: 95, armorTonnage: 17 },
  { name: "Assault Mech (100t)", tonnage: 100, armorTonnage: 18 },
  
  // Edge cases with fractional armor amounts
  { name: "Edge Case 1", tonnage: 50, armorTonnage: 5.5 },
  { name: "Edge Case 2", tonnage: 75, armorTonnage: 12.5 },
  { name: "Edge Case 3", tonnage: 100, armorTonnage: 19.5 }
];

interface ArmorAllocation {
  [key: string]: { front: number; rear: number };
}

/**
 * Enhanced auto-allocation algorithm (extracted from UI component)
 */
function autoAllocateArmor(unit: UnitCriticalManager): ArmorAllocation {
  const config = unit.getConfiguration();
  const availableArmorPoints = unit.getAvailableArmorPoints();
  
  console.log(`\n🔄 Auto-allocating ${availableArmorPoints} armor points...`);
  
  const locations = ['HD', 'CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
  const newAllocation: ArmorAllocation = { ...config.armorAllocation };
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
  const getRemainingLocationIS = (location: string): number => {
    const maxLocationArmor = unit.getMaxArmorPointsForLocation(location);
    if (location === 'HD') return 0;
    return Math.floor(maxLocationArmor / 2);
  };
  
  const remainingLocations = ['CT', 'LT', 'RT', 'LA', 'RA', 'LL', 'RL'];
  const internalStructure: { [key: string]: number } = {};
  let totalRemainingIS = 0;
  
  remainingLocations.forEach(location => {
    const is = getRemainingLocationIS(location);
    internalStructure[location] = is;
    totalRemainingIS += is;
  });
  
  // Step 3: Distribute remaining points by internal structure ratios
  const distributedPoints: { [key: string]: number } = {};
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

interface ValidationResults {
  totalAllocated: number;
  availablePoints: number;
  unallocatedPoints: number;
  locationDetails: { [key: string]: any };
  violations: string[];
}

/**
 * Validate armor allocation results
 */
function validateAllocation(unit: UnitCriticalManager, allocation: ArmorAllocation): ValidationResults {
  const availablePoints = unit.getAvailableArmorPoints();
  let totalAllocated = 0;
  let validationResults: ValidationResults = {
    totalAllocated: 0,
    availablePoints,
    unallocatedPoints: 0,
    locationDetails: {},
    violations: []
  };
  
  // Count total allocated points
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
      valid: isValid
    };
    
    if (!isValid) {
      validationResults.violations.push(
        `${location}: ${locationTotal} > ${maxLocationArmor} (exceeds maximum)`
      );
    }
    
    // Validate rear armor limits for torsos
    if (['CT', 'LT', 'RT'].includes(location)) {
      const maxRear = Math.floor(maxLocationArmor * 0.5);
      if (armor.rear > maxRear) {
        validationResults.violations.push(
          `${location}: rear ${armor.rear} > ${maxRear} (exceeds 50% rule)`
        );
      }
    }
  });
  
  validationResults.totalAllocated = totalAllocated;
  validationResults.unallocatedPoints = availablePoints - totalAllocated;
  
  return validationResults;
}

interface TestResult {
  name: string;
  passed: boolean;
  utilization?: number;
  unallocated?: number;
  violations?: number;
  error?: string;
}

/**
 * Run comprehensive test suite
 */
function runValidationTests(): { totalTests: number; passedTests: number; results: TestResult[] } {
  console.log('🛡️  ARMOR AUTO-ALLOCATION VALIDATION SUITE\n');
  console.log('Testing enhanced remainder distribution algorithm...\n');
  
  let passedTests = 0;
  let totalTests = testConfigurations.length;
  let summaryResults: TestResult[] = [];
  
  testConfigurations.forEach((testConfig, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST ${index + 1}/${totalTests}: ${testConfig.name}`);
    console.log(`   Tonnage: ${testConfig.tonnage}t, Armor: ${testConfig.armorTonnage}t`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Create unit configuration
      const unitConfig: UnitConfiguration = {
        engineType: 'Standard',
        gyroType: 'Standard',
        tonnage: testConfig.tonnage,
        mass: testConfig.tonnage,
        unitType: 'BattleMech',
        techBase: 'Inner Sphere',
        walkMP: 4,
        runMP: 6,
        engineRating: testConfig.tonnage * 4,
        structureType: 'Standard',
        armorType: 'Standard',
        heatSinkType: 'Single',
        totalHeatSinks: 10,
        internalHeatSinks: 8,
        externalHeatSinks: 2,
        enhancementType: null,
        jumpMP: 0,
        jumpJetType: 'Standard Jump Jet',
        jumpJetCounts: {},
        hasPartialWing: false,
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
      const unit = new UnitCriticalManager(unitConfig);
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
      
      console.log(`\n📍 LOCATION BREAKDOWN:`);
      Object.entries(validation.locationDetails).forEach(([location, details]) => {
        const status = details.valid ? '✅' : '❌';
        const rearText = details.rear > 0 ? `/${details.rear}R` : '';
        console.log(`   ${status} ${location}: ${details.front}F${rearText} = ${details.allocated}/${details.max}`);
      });
      
      // Check for violations
      if (validation.violations.length > 0) {
        console.log(`\n⚠️ VIOLATIONS:`);
        validation.violations.forEach(violation => {
          console.log(`   ❌ ${violation}`);
        });
      }
      
      // Determine test result
      const testPassed = validation.violations.length === 0 && validation.unallocatedPoints === 0;
      
      if (testPassed) {
        console.log(`\n✅ TEST PASSED: Perfect allocation with no violations`);
        passedTests++;
      } else {
        console.log(`\n❌ TEST FAILED: ${validation.violations.length} violations, ${validation.unallocatedPoints} unallocated`);
      }
      
      // Store summary result
      summaryResults.push({
        name: testConfig.name,
        passed: testPassed,
        utilization: (validation.totalAllocated / validation.availablePoints) * 100,
        unallocated: validation.unallocatedPoints,
        violations: validation.violations.length
      });
      
    } catch (error: any) {
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
      console.log(`${status} ${result.name}: ${result.utilization!.toFixed(1)}% utilization, ${result.unallocated} unallocated, ${result.violations} violations`);
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
  } catch (error: any) {
    console.error('Validation script failed:', error);
    process.exit(1);
  }
}

export {
  runValidationTests,
  autoAllocateArmor,
  validateAllocation
};
