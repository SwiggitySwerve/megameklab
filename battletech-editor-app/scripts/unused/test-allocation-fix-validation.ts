/**
 * ALLOCATION FIX VALIDATION TEST
 * 
 * This test validates that the comprehensive equipment allocation fixes are working correctly
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager'

// Test configuration that should trigger special components
const testConfig: UnitConfiguration = {
  tonnage: 50,
  unitType: 'BattleMech',
  techBase: 'Inner Sphere',
  walkMP: 4,
  engineRating: 200,
  runMP: 6,
  engineType: 'Standard',
  gyroType: 'Standard',
  structureType: 'Endo Steel', // Should create 14 pieces
  armorType: 'Ferro-Fibrous',  // Should create 14 pieces
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
  jumpMP: 3, // Should create 3 jump jets
  jumpJetType: 'Standard Jump Jet',
  jumpJetCounts: {},
  hasPartialWing: false,
  mass: 50
}

/**
 * Test 1: Equipment Duplication Fix
 */
function testEquipmentDuplicationFix(): boolean {
  console.log('🧪 TEST 1: Equipment Duplication Fix')
  console.log('===================================')
  
  try {
    const unit = new UnitCriticalManager(testConfig)
    const unallocated = unit.getUnallocatedEquipment()
    
    console.log(`Total unallocated equipment: ${unallocated.length}`)
    
    // Count by equipment type
    const counts = unallocated.reduce((acc, eq) => {
      const name = eq.equipmentData.name
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('Equipment counts:')
    Object.entries(counts).forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`)
    })
    
    // Expected counts
    const expectedCounts = {
      'Endo Steel': 14,
      'Ferro-Fibrous': 14,
      'Standard Jump Jet': 3
    }
    
    let success = true
    Object.entries(expectedCounts).forEach(([name, expected]) => {
      const actual = counts[name] || 0
      if (actual !== expected) {
        console.error(`❌ ERROR: ${name} count mismatch. Expected: ${expected}, Actual: ${actual}`)
        success = false
      } else {
        console.log(`✅ PASS: ${name} count correct (${actual})`)
      }
    })
    
    // Total should be ~31 items (14+14+3), not 300+
    const totalItems = unallocated.length
    if (totalItems > 50) {
      console.error(`❌ ERROR: Total item count too high: ${totalItems} (suggests duplication bug still exists)`)
      success = false
    } else {
      console.log(`✅ PASS: Total item count reasonable: ${totalItems}`)
    }
    
    console.log(`Test 1 Result: ${success ? '✅ PASS' : '❌ FAIL'}`)
    return success
    
  } catch (error) {
    console.error('❌ Test 1 ERROR:', error)
    return false
  }
}

/**
 * Test 2: Equipment Allocation and Removal
 */
function testEquipmentAllocationAndRemoval(): boolean {
  console.log('\n🧪 TEST 2: Equipment Allocation and Removal')
  console.log('==========================================')
  
  try {
    const unit = new UnitCriticalManager(testConfig)
    const initialCount = unit.getUnallocatedEquipment().length
    console.log(`Initial unallocated count: ${initialCount}`)
    
    // Find an Endo Steel piece to allocate
    const endoSteel = unit.getUnallocatedEquipment().find(eq => 
      eq.equipmentData.name === 'Endo Steel'
    )
    
    if (!endoSteel) {
      console.error('❌ ERROR: No Endo Steel found in unallocated equipment')
      return false
    }
    
    console.log(`Found Endo Steel piece: ${endoSteel.equipmentGroupId}`)
    
    // Attempt allocation
    const allocationSuccess = unit.allocateEquipmentFromPool(
      endoSteel.equipmentGroupId, 
      'Left Arm', 
      4
    )
    
    if (!allocationSuccess) {
      console.error('❌ ERROR: Equipment allocation failed')
      return false
    }
    
    console.log('✅ Equipment allocation succeeded')
    
    // Check that count decreased
    const afterAllocationCount = unit.getUnallocatedEquipment().length
    console.log(`After allocation count: ${afterAllocationCount}`)
    
    if (afterAllocationCount !== initialCount - 1) {
      console.error(`❌ ERROR: Unallocated count should have decreased by 1. Expected: ${initialCount - 1}, Actual: ${afterAllocationCount}`)
      return false
    }
    
    console.log('✅ PASS: Equipment properly removed from unallocated pool')
    
    // Verify equipment is in target location
    const leftArm = unit.getSection('Left Arm')
    if (!leftArm) {
      console.error('❌ ERROR: Left Arm section not found')
      return false
    }
    
    const allocatedEquipment = leftArm.getAllEquipment()
    const foundAllocated = allocatedEquipment.find(eq => 
      eq.equipmentGroupId === endoSteel.equipmentGroupId
    )
    
    if (!foundAllocated) {
      console.error('❌ ERROR: Equipment not found in target location')
      return false
    }
    
    console.log('✅ PASS: Equipment found in target location')
    console.log(`Allocated to slots: ${foundAllocated.occupiedSlots.join(', ')}`)
    
    console.log('Test 2 Result: ✅ PASS')
    return true
    
  } catch (error) {
    console.error('❌ Test 2 ERROR:', error)
    return false
  }
}

/**
 * Test 3: Observer Pattern State Changes
 */
function testObserverPatternStateChanges(): Promise<boolean> {
  console.log('\n🧪 TEST 3: Observer Pattern State Changes')
  console.log('========================================')
  
  return new Promise((resolve) => {
    try {
      const unit = new UnitCriticalManager(testConfig)
      
      let stateChangeCount = 0
      
      // Subscribe to state changes
      const unsubscribe = unit.subscribe(() => {
        stateChangeCount++
        console.log(`State change ${stateChangeCount} detected`)
      })
      
      console.log('Subscribed to state changes')
      
      // Find equipment to allocate
      const equipment = unit.getUnallocatedEquipment().find(eq => 
        eq.equipmentData.name === 'Ferro-Fibrous'
      )
      
      if (!equipment) {
        console.error('❌ ERROR: No Ferro-Fibrous found')
        resolve(false)
        return
      }
      
      console.log('Allocating equipment to trigger state change...')
      
      // Allocate equipment - this should trigger state change
      const success = unit.allocateEquipmentFromPool(
        equipment.equipmentGroupId,
        'Right Arm',
        4
      )
      
      if (!success) {
        console.error('❌ ERROR: Allocation failed')
        resolve(false)
        return
      }
      
      // Wait a moment for state change notification
      setTimeout(() => {
        unsubscribe()
        
        if (stateChangeCount === 0) {
          console.error('❌ ERROR: No state changes detected')
          resolve(false)
        } else {
          console.log(`✅ PASS: ${stateChangeCount} state change(s) detected`)
          resolve(true)
        }
      }, 100)
      
    } catch (error) {
      console.error('❌ Test 3 ERROR:', error)
      resolve(false)
    }
  })
}

/**
 * Test 4: Configuration Change Special Component Management
 */
function testConfigurationChangeManagement(): boolean {
  console.log('\n🧪 TEST 4: Configuration Change Special Component Management')
  console.log('===========================================================')
  
  try {
    const unit = new UnitCriticalManager(testConfig)
    const initialCount = unit.getUnallocatedEquipment().length
    console.log(`Initial count with Endo Steel + Ferro-Fibrous: ${initialCount}`)
    
    // Change to Standard structure (should remove Endo Steel)
    const newConfig = {
      ...testConfig,
      structureType: 'Standard' as const
    }
    
    unit.updateConfiguration(newConfig)
    
    const afterStructureChange = unit.getUnallocatedEquipment().length
    console.log(`After changing to Standard structure: ${afterStructureChange}`)
    
    // Should have removed 14 Endo Steel pieces
    const expectedAfterStructure = initialCount - 14
    if (afterStructureChange !== expectedAfterStructure) {
      console.error(`❌ ERROR: Expected ${expectedAfterStructure} items after structure change, got ${afterStructureChange}`)
      return false
    }
    
    console.log('✅ PASS: Endo Steel components properly removed')
    
    // Change armor type (should remove Ferro-Fibrous)
    const newConfig2 = {
      ...newConfig,
      armorType: 'Standard' as const
    }
    
    unit.updateConfiguration(newConfig2)
    
    const afterArmorChange = unit.getUnallocatedEquipment().length
    console.log(`After changing to Standard armor: ${afterArmorChange}`)
    
    // Should have removed 14 Ferro-Fibrous pieces
    const expectedAfterArmor = afterStructureChange - 14
    if (afterArmorChange !== expectedAfterArmor) {
      console.error(`❌ ERROR: Expected ${expectedAfterArmor} items after armor change, got ${afterArmorChange}`)
      return false
    }
    
    console.log('✅ PASS: Ferro-Fibrous components properly removed')
    
    // Verify no special structure/armor components remain
    const remaining = unit.getUnallocatedEquipment()
    const specialComponents = remaining.filter(eq => {
      const specialEq = eq.equipmentData as any
      return specialEq.componentType === 'structure' || specialEq.componentType === 'armor'
    })
    
    if (specialComponents.length > 0) {
      console.error(`❌ ERROR: ${specialComponents.length} special components still remain`)
      return false
    }
    
    console.log('✅ PASS: All special structure/armor components removed')
    console.log('Test 4 Result: ✅ PASS')
    return true
    
  } catch (error) {
    console.error('❌ Test 4 ERROR:', error)
    return false
  }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  console.log('🚀 RUNNING ALLOCATION FIX VALIDATION TESTS')
  console.log('===========================================')
  
  const results: boolean[] = []
  
  // Run tests
  results.push(testEquipmentDuplicationFix())
  results.push(testEquipmentAllocationAndRemoval())
  results.push(await testObserverPatternStateChanges())
  results.push(testConfigurationChangeManagement())
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY')
  console.log('=======================')
  
  const passCount = results.filter(r => r).length
  const totalCount = results.length
  
  results.forEach((result, index) => {
    const testName = [
      'Equipment Duplication Fix',
      'Equipment Allocation and Removal', 
      'Observer Pattern State Changes',
      'Configuration Change Management'
    ][index]
    
    console.log(`Test ${index + 1} (${testName}): ${result ? '✅ PASS' : '❌ FAIL'}`)
  })
  
  console.log(`\nOverall Result: ${passCount}/${totalCount} tests passed`)
  
  if (passCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED! Equipment allocation fixes are working correctly.')
  } else {
    console.log('❌ Some tests failed. Please check the implementation.')
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).testAllocationFixes = runAllTests
  (window as any).testEquipmentDuplication = testEquipmentDuplicationFix
  (window as any).testEquipmentAllocation = testEquipmentAllocationAndRemoval
}

export { 
  runAllTests, 
  testEquipmentDuplicationFix, 
  testEquipmentAllocationAndRemoval,
  testObserverPatternStateChanges,
  testConfigurationChangeManagement
}
