/**
 * Diagnostic Script: Component Duplication Issue
 * This script will test the actual data model behavior to identify where 100+ components are being created
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager.js'

function createTestUnit(): UnitCriticalManager {
  const config: UnitConfiguration = {
    tonnage: 50,
    unitType: 'BattleMech',
    techBase: 'Inner Sphere',
    walkMP: 4,
    engineRating: 200,
    runMP: 6,
    engineType: 'Standard',
    gyroType: 'Standard',
    structureType: 'Endo Steel', // Start with Endo Steel
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

  return new UnitCriticalManager(config)
}

function countSpecialComponents(unit: UnitCriticalManager, componentType: 'structure' | 'armor'): { [key: string]: number } {
  const unallocated = unit.getUnallocatedEquipment()
  const counts: { [key: string]: number } = {}
  
  unallocated.forEach(eq => {
    const specialEq = eq.equipmentData as any
    if (specialEq.componentType === componentType) {
      const name = specialEq.name
      counts[name] = (counts[name] || 0) + 1
    }
  })
  
  return counts
}

function testComponentDuplication() {
  console.log('=== COMPONENT DUPLICATION DIAGNOSTIC ===')
  
  // Test 1: Initial unit creation
  console.log('\n--- Test 1: Initial Unit Creation ---')
  const unit = createTestUnit()
  const initialCounts = countSpecialComponents(unit, 'structure')
  console.log('Initial structure components:', initialCounts)
  console.log('Total unallocated equipment:', unit.getUnallocatedEquipment().length)
  
  // Test 2: Configuration change from Endo Steel to Standard
  console.log('\n--- Test 2: Endo Steel → Standard ---')
  const newConfig1 = { ...unit.getConfiguration(), structureType: 'Standard' as const }
  unit.updateConfiguration(newConfig1)
  const afterStandard = countSpecialComponents(unit, 'structure')
  console.log('After Standard structure:', afterStandard)
  console.log('Total unallocated equipment:', unit.getUnallocatedEquipment().length)
  
  // Test 3: Configuration change from Standard to Ferro-Fibrous armor
  console.log('\n--- Test 3: Standard → Ferro-Fibrous Armor ---')
  const newConfig2 = { ...unit.getConfiguration(), armorType: 'Ferro-Fibrous' as const }
  unit.updateConfiguration(newConfig2)
  const afterFerro = countSpecialComponents(unit, 'armor')
  console.log('After Ferro-Fibrous armor:', afterFerro)
  console.log('Total unallocated equipment:', unit.getUnallocatedEquipment().length)
  
  // Test 4: Configuration change back to Endo Steel
  console.log('\n--- Test 4: Back to Endo Steel Structure ---')
  const newConfig3 = { ...unit.getConfiguration(), structureType: 'Endo Steel' as const }
  unit.updateConfiguration(newConfig3)
  const backToEndo = countSpecialComponents(unit, 'structure')
  console.log('Back to Endo Steel:', backToEndo)
  console.log('Total unallocated equipment:', unit.getUnallocatedEquipment().length)
  
  // Test 5: Multiple rapid changes (simulate UI interactions)
  console.log('\n--- Test 5: Rapid Configuration Changes ---')
  for (let i = 0; i < 5; i++) {
    const configA = { ...unit.getConfiguration(), structureType: 'Standard' as const }
    unit.updateConfiguration(configA)
    const configB = { ...unit.getConfiguration(), structureType: 'Endo Steel' as const }
    unit.updateConfiguration(configB)
  }
  const afterRapid = countSpecialComponents(unit, 'structure')
  console.log('After rapid changes:', afterRapid)
  console.log('Total unallocated equipment:', unit.getUnallocatedEquipment().length)
  
  // Test 6: Check all unallocated equipment details
  console.log('\n--- Test 6: Detailed Equipment Analysis ---')
  const allUnallocated = unit.getUnallocatedEquipment()
  const byName: { [key: string]: number } = {}
  allUnallocated.forEach(eq => {
    const name = eq.equipmentData.name
    byName[name] = (byName[name] || 0) + 1
  })
  console.log('All unallocated equipment by name:', byName)
  
  // Test 7: Check if specialComponentsInitialized flag is working
  console.log('\n--- Test 7: Internal State Check ---')
  console.log('Unit internal state:', {
    specialComponentsInitialized: (unit as any).specialComponentsInitialized,
    unallocatedCount: unit.getUnallocatedEquipment().length
  })
  
  console.log('\n=== DIAGNOSTIC COMPLETE ===')
}

// Run the test
testComponentDuplication()
