/**
 * Comprehensive Equipment Allocation Test Suite
 * Tests equipment allocation behavior both inside and outside the UI
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager'

interface AllocationTestResult {
  testName: string
  passed: boolean
  details: {
    before: {
      unallocatedCount: number
      allocatedCount: number
      selectedEquipment?: string
    }
    after: {
      unallocatedCount: number
      allocatedCount: number
      selectedEquipment?: string
    }
    expected: {
      unallocatedCount: number
      allocatedCount: number
      selectedEquipment?: string
    }
  }
  errors: string[]
  warnings: string[]
}

interface ComprehensiveTestSuite {
  results: AllocationTestResult[]
  summary: {
    totalTests: number
    passed: number
    failed: number
    successRate: number
  }
}

class EquipmentAllocationTester {
  private unit: UnitCriticalManager
  private testResults: AllocationTestResult[] = []

  constructor() {
    // Create a unit with Endo Steel structure to get 14 pieces
    const config: UnitConfiguration = {
      tonnage: 50,
      unitType: 'BattleMech',
      techBase: 'Inner Sphere',
      walkMP: 4,
      engineRating: 200,
      runMP: 6,
      engineType: 'Standard',
      gyroType: 'Standard',
      structureType: 'Endo Steel', // This should create 14 pieces
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
      mass: 50
    }

    this.unit = new UnitCriticalManager(config)
    console.log('[EquipmentAllocationTester] Initialized unit with Endo Steel structure')
  }

  /**
   * Test basic equipment counting
   */
  testEquipmentCounting(): AllocationTestResult {
    const testName = 'Equipment Counting'
    console.log(`[Test] ${testName} - Starting`)

    const unallocatedEquipment = this.unit.getUnallocatedEquipment()
    const endoSteelPieces = unallocatedEquipment.filter(eq => 
      eq.equipmentData.name === 'Endo Steel'
    )

    const result: AllocationTestResult = {
      testName,
      passed: endoSteelPieces.length === 14,
      details: {
        before: {
          unallocatedCount: endoSteelPieces.length,
          allocatedCount: 0
        },
        after: {
          unallocatedCount: endoSteelPieces.length,
          allocatedCount: 0
        },
        expected: {
          unallocatedCount: 14,
          allocatedCount: 0
        }
      },
      errors: [],
      warnings: []
    }

    if (!result.passed) {
      result.errors.push(`Expected 14 Endo Steel pieces, found ${endoSteelPieces.length}`)
    }

    console.log(`[Test] ${testName} - ${result.passed ? 'PASSED' : 'FAILED'}`)
    this.testResults.push(result)
    return result
  }

  /**
   * Test single equipment allocation
   */
  testSingleAllocation(): AllocationTestResult {
    const testName = 'Single Equipment Allocation'
    console.log(`[Test] ${testName} - Starting`)

    // Get initial state
    const unallocatedBefore = this.unit.getUnallocatedEquipment()
    const endoSteelBefore = unallocatedBefore.filter(eq => eq.equipmentData.name === 'Endo Steel')
    
    if (endoSteelBefore.length === 0) {
      return {
        testName,
        passed: false,
        details: {
          before: { unallocatedCount: 0, allocatedCount: 0 },
          after: { unallocatedCount: 0, allocatedCount: 0 },
          expected: { unallocatedCount: 13, allocatedCount: 1 }
        },
        errors: ['No Endo Steel pieces available for allocation'],
        warnings: []
      }
    }

    // Attempt allocation
    const targetEquipment = endoSteelBefore[0]
    const allocationSuccess = this.unit.allocateEquipmentFromPool(
      targetEquipment.equipmentGroupId,
      'Left Arm',
      4
    )

    // Get final state
    const unallocatedAfter = this.unit.getUnallocatedEquipment()
    const endoSteelAfter = unallocatedAfter.filter(eq => eq.equipmentData.name === 'Endo Steel')

    // Check if equipment appears in critical slots
    const leftArmSection = this.unit.getSection('Left Arm')
    const allocatedEquipment = leftArmSection?.getAllEquipment().filter(eq => 
      eq.equipmentData.name === 'Endo Steel'
    ) || []

    const result: AllocationTestResult = {
      testName,
      passed: allocationSuccess && endoSteelAfter.length === endoSteelBefore.length - 1 && allocatedEquipment.length > 0,
      details: {
        before: {
          unallocatedCount: endoSteelBefore.length,
          allocatedCount: 0
        },
        after: {
          unallocatedCount: endoSteelAfter.length,
          allocatedCount: allocatedEquipment.length
        },
        expected: {
          unallocatedCount: endoSteelBefore.length - 1,
          allocatedCount: 1
        }
      },
      errors: [],
      warnings: []
    }

    if (!allocationSuccess) {
      result.errors.push('Allocation method returned false')
    }

    if (endoSteelAfter.length !== endoSteelBefore.length - 1) {
      result.errors.push(`Unallocated count should be ${endoSteelBefore.length - 1}, but is ${endoSteelAfter.length}`)
    }

    if (allocatedEquipment.length === 0) {
      result.errors.push('Equipment did not appear in target location')
    }

    console.log(`[Test] ${testName} - ${result.passed ? 'PASSED' : 'FAILED'}`)
    this.testResults.push(result)
    return result
  }

  /**
   * Test multiple consecutive allocations
   */
  testMultipleAllocations(): AllocationTestResult {
    const testName = 'Multiple Consecutive Allocations'
    console.log(`[Test] ${testName} - Starting`)

    const initialUnallocated = this.unit.getUnallocatedEquipment()
    const initialEndoSteel = initialUnallocated.filter(eq => eq.equipmentData.name === 'Endo Steel')
    
    const allocationsToMake = Math.min(3, initialEndoSteel.length)
    let successfulAllocations = 0
    
    const locations = ['Right Arm', 'Left Torso', 'Right Torso']
    const slots = [4, 0, 0]

    for (let i = 0; i < allocationsToMake; i++) {
      const currentUnallocated = this.unit.getUnallocatedEquipment()
      const currentEndoSteel = currentUnallocated.filter(eq => eq.equipmentData.name === 'Endo Steel')
      
      if (currentEndoSteel.length > 0) {
        const success = this.unit.allocateEquipmentFromPool(
          currentEndoSteel[0].equipmentGroupId,
          locations[i],
          slots[i]
        )
        
        if (success) {
          successfulAllocations++
        }
      }
    }

    const finalUnallocated = this.unit.getUnallocatedEquipment()
    const finalEndoSteel = finalUnallocated.filter(eq => eq.equipmentData.name === 'Endo Steel')

    const result: AllocationTestResult = {
      testName,
      passed: successfulAllocations === allocationsToMake && 
              finalEndoSteel.length === initialEndoSteel.length - allocationsToMake,
      details: {
        before: {
          unallocatedCount: initialEndoSteel.length,
          allocatedCount: 0
        },
        after: {
          unallocatedCount: finalEndoSteel.length,
          allocatedCount: successfulAllocations
        },
        expected: {
          unallocatedCount: initialEndoSteel.length - allocationsToMake,
          allocatedCount: allocationsToMake
        }
      },
      errors: [],
      warnings: []
    }

    if (successfulAllocations !== allocationsToMake) {
      result.errors.push(`Expected ${allocationsToMake} successful allocations, got ${successfulAllocations}`)
    }

    if (finalEndoSteel.length !== initialEndoSteel.length - allocationsToMake) {
      result.errors.push(`Expected ${initialEndoSteel.length - allocationsToMake} remaining pieces, got ${finalEndoSteel.length}`)
    }

    console.log(`[Test] ${testName} - ${result.passed ? 'PASSED' : 'FAILED'}`)
    this.testResults.push(result)
    return result
  }

  /**
   * Test allocation failure scenarios
   */
  testAllocationFailures(): AllocationTestResult {
    const testName = 'Allocation Failure Scenarios'
    console.log(`[Test] ${testName} - Starting`)

    const initialUnallocated = this.unit.getUnallocatedEquipment()
    const initialEndoSteel = initialUnallocated.filter(eq => eq.equipmentData.name === 'Endo Steel')

    if (initialEndoSteel.length === 0) {
      return {
        testName,
        passed: false,
        details: {
          before: { unallocatedCount: 0, allocatedCount: 0 },
          after: { unallocatedCount: 0, allocatedCount: 0 },
          expected: { unallocatedCount: initialEndoSteel.length, allocatedCount: 0 }
        },
        errors: ['No Endo Steel pieces available for failure testing'],
        warnings: []
      }
    }

    // Test 1: Invalid equipment group ID
    const invalidIdResult = this.unit.allocateEquipmentFromPool('invalid-id', 'Left Arm', 5)
    
    // Test 2: Invalid location
    const invalidLocationResult = this.unit.allocateEquipmentFromPool(
      initialEndoSteel[0].equipmentGroupId, 
      'Invalid Location', 
      0
    )

    // Test 3: Invalid slot index
    const invalidSlotResult = this.unit.allocateEquipmentFromPool(
      initialEndoSteel[0].equipmentGroupId, 
      'Left Arm', 
      999
    )

    const finalUnallocated = this.unit.getUnallocatedEquipment()
    const finalEndoSteel = finalUnallocated.filter(eq => eq.equipmentData.name === 'Endo Steel')

    const result: AllocationTestResult = {
      testName,
      passed: !invalidIdResult && !invalidLocationResult && !invalidSlotResult && 
              finalEndoSteel.length === initialEndoSteel.length,
      details: {
        before: {
          unallocatedCount: initialEndoSteel.length,
          allocatedCount: 0
        },
        after: {
          unallocatedCount: finalEndoSteel.length,
          allocatedCount: 0
        },
        expected: {
          unallocatedCount: initialEndoSteel.length,
          allocatedCount: 0
        }
      },
      errors: [],
      warnings: []
    }

    if (invalidIdResult) {
      result.errors.push('Allocation with invalid equipment ID should fail')
    }

    if (invalidLocationResult) {
      result.errors.push('Allocation with invalid location should fail')
    }

    if (invalidSlotResult) {
      result.errors.push('Allocation with invalid slot should fail')
    }

    if (finalEndoSteel.length !== initialEndoSteel.length) {
      result.errors.push('Failed allocations should not change unallocated count')
    }

    console.log(`[Test] ${testName} - ${result.passed ? 'PASSED' : 'FAILED'}`)
    this.testResults.push(result)
    return result
  }

  /**
   * Test state serialization consistency
   */
  testStateSerialization(): AllocationTestResult {
    const testName = 'State Serialization Consistency'
    console.log(`[Test] ${testName} - Starting`)

    // Serialize current state
    const serializedState = this.unit.serializeCompleteState()
    
    // Create new unit and restore state
    const newUnit = new UnitCriticalManager({
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
      mass: 50
    })

    const deserializationSuccess = newUnit.deserializeCompleteState(serializedState)

    // Compare states
    const originalUnallocated = this.unit.getUnallocatedEquipment()
    const restoredUnallocated = newUnit.getUnallocatedEquipment()

    const result: AllocationTestResult = {
      testName,
      passed: deserializationSuccess && 
              originalUnallocated.length === restoredUnallocated.length,
      details: {
        before: {
          unallocatedCount: originalUnallocated.length,
          allocatedCount: 0
        },
        after: {
          unallocatedCount: restoredUnallocated.length,
          allocatedCount: 0
        },
        expected: {
          unallocatedCount: originalUnallocated.length,
          allocatedCount: 0
        }
      },
      errors: [],
      warnings: []
    }

    if (!deserializationSuccess) {
      result.errors.push('State deserialization failed')
    }

    if (originalUnallocated.length !== restoredUnallocated.length) {
      result.errors.push(`Unallocated count mismatch: original ${originalUnallocated.length}, restored ${restoredUnallocated.length}`)
    }

    console.log(`[Test] ${testName} - ${result.passed ? 'PASSED' : 'FAILED'}`)
    this.testResults.push(result)
    return result
  }

  /**
   * Run all tests and return comprehensive results
   */
  runAllTests(): ComprehensiveTestSuite {
    console.log('[EquipmentAllocationTester] Starting comprehensive test suite')
    
    this.testResults = []

    // Run all tests
    this.testEquipmentCounting()
    this.testSingleAllocation()
    this.testMultipleAllocations()
    this.testAllocationFailures()
    this.testStateSerialization()

    // Calculate summary
    const totalTests = this.testResults.length
    const passed = this.testResults.filter(r => r.passed).length
    const failed = totalTests - passed
    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0

    const summary = {
      totalTests,
      passed,
      failed,
      successRate
    }

    console.log('[EquipmentAllocationTester] Test suite complete:', summary)

    return {
      results: this.testResults,
      summary
    }
  }

  /**
   * Get current unit state for inspection
   */
  getUnitState() {
    const unallocatedEquipment = this.unit.getUnallocatedEquipment()
    const endoSteelPieces = unallocatedEquipment.filter(eq => eq.equipmentData.name === 'Endo Steel')
    
    return {
      totalUnallocated: unallocatedEquipment.length,
      endoSteelPieces: endoSteelPieces.length,
      unit: this.unit,
      sections: this.unit.getAllSections().map(section => ({
        location: section.getLocation(),
        equipmentCount: section.getAllEquipment().length,
        equipment: section.getAllEquipment()
      }))
    }
  }
}

// Export for use in both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EquipmentAllocationTester }
} else if (typeof window !== 'undefined') {
  (window as any).EquipmentAllocationTester = EquipmentAllocationTester
}

// Type exports for TypeScript
export { EquipmentAllocationTester }
export type { AllocationTestResult, ComprehensiveTestSuite }

// Auto-run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new EquipmentAllocationTester()
  const results = tester.runAllTests()
  
  console.log('\n=== TEST RESULTS ===')
  console.log(`Total Tests: ${results.summary.totalTests}`)
  console.log(`Passed: ${results.summary.passed}`)
  console.log(`Failed: ${results.summary.failed}`)
  console.log(`Success Rate: ${results.summary.successRate.toFixed(1)}%`)
  
  if (results.summary.failed > 0) {
    console.log('\n=== FAILED TESTS ===')
    results.results.filter(r => !r.passed).forEach(result => {
      console.log(`${result.testName}:`)
      result.errors.forEach(error => console.log(`  - ${error}`))
    })
  }
}
