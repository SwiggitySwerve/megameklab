/**
 * Debug script to trace Endo Steel allocation issues
 * Specifically designed to understand why special components aren't being removed
 */

import { UnitCriticalManager, UnitConfiguration } from './utils/criticalSlots/UnitCriticalManager.js'

console.log('=== ENDO STEEL ALLOCATION DEBUG ===')

// Create a unit with Endo Steel structure
const config: UnitConfiguration = {
  tonnage: 50,
  unitType: 'BattleMech',
  techBase: 'Inner Sphere',
  walkMP: 4,
  engineRating: 200,
  runMP: 6,
  engineType: 'Standard',
  gyroType: 'Standard',
  structureType: 'Endo Steel', // This should create 14 Endo Steel components
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

console.log('Creating unit with Endo Steel structure...')
const unit = new UnitCriticalManager(config)

// Check initial state
const initialUnallocated = unit.getUnallocatedEquipment()
console.log(`Initial unallocated equipment count: ${initialUnallocated.length}`)

const endoSteelComponents = initialUnallocated.filter(eq => eq.equipmentData.name === 'Endo Steel')
console.log(`Endo Steel components found: ${endoSteelComponents.length}`)

if (endoSteelComponents.length > 0) {
  console.log('Endo Steel component details:')
  endoSteelComponents.forEach((comp, index) => {
    console.log(`  [${index}] ID: ${comp.equipmentData.id}, GroupID: ${comp.equipmentGroupId}`)
  })
  
  // Try to allocate the first Endo Steel component
  const firstEndoSteel = endoSteelComponents[0]
  console.log(`\nAttempting to allocate first Endo Steel component: ${firstEndoSteel.equipmentGroupId}`)
  
  // Check what sections are available
  const sections = unit.getAllSections()
  console.log('Available sections:', sections.map(s => s.getLocation()))
  
  // Try to allocate to Center Torso slot 10 (should be available)
  const success = unit.allocateEquipmentFromPool(firstEndoSteel.equipmentGroupId, 'Center Torso', 10)
  console.log(`Allocation result: ${success}`)
  
  // Check state after allocation
  const afterUnallocated = unit.getUnallocatedEquipment()
  const afterEndoSteel = afterUnallocated.filter(eq => eq.equipmentData.name === 'Endo Steel')
  
  console.log(`\nAfter allocation:`)
  console.log(`  Total unallocated: ${afterUnallocated.length}`)
  console.log(`  Endo Steel remaining: ${afterEndoSteel.length}`)
  
  // Check if it's actually in the critical slot
  const centerTorso = unit.getSection('Center Torso')
  if (centerTorso) {
    const slot10 = centerTorso.getAllSlots()[10]
    console.log(`  Slot 10 content: ${slot10?.content ? slot10.content.equipmentGroupId : 'empty'}`)
    
    // Check all allocated equipment in center torso
    const ctEquipment = centerTorso.getAllEquipment()
    const ctEndoSteel = ctEquipment.filter(eq => eq.equipmentData.name === 'Endo Steel')
    console.log(`  Endo Steel in Center Torso: ${ctEndoSteel.length}`)
    
    if (ctEndoSteel.length > 0) {
      console.log(`  Allocated Endo Steel GroupID: ${ctEndoSteel[0].equipmentGroupId}`)
      console.log(`  Original GroupID: ${firstEndoSteel.equipmentGroupId}`)
      console.log(`  GroupIDs match: ${ctEndoSteel[0].equipmentGroupId === firstEndoSteel.equipmentGroupId}`)
    }
  }
  
  // Check if there are any duplicates by GroupID
  const allEquipmentGroups = unit.getAllEquipmentGroups()
  const duplicateGroupIds = new Map<string, number>()
  
  allEquipmentGroups.forEach(group => {
    const count = duplicateGroupIds.get(group.groupId) || 0
    duplicateGroupIds.set(group.groupId, count + 1)
  })
  
  console.log('\nChecking for duplicate GroupIDs:')
  duplicateGroupIds.forEach((count, groupId) => {
    if (count > 1) {
      console.log(`  DUPLICATE: ${groupId} appears ${count} times`)
    }
  })
  
} else {
  console.log('ERROR: No Endo Steel components found!')
}

console.log('=== END DEBUG ===')
