/**
 * Test script for the new grouped equipment display functionality
 */

import { EquipmentAllocation, EquipmentObject } from './utils/criticalSlots/CriticalSlot'

// Mock equipment data for testing
const mockEquipmentData: EquipmentObject[] = [
  {
    id: 'endo-steel-1',
    name: 'Endo Steel',
    type: 'equipment',
    techBase: 'Inner Sphere',
    requiredSlots: 1,
    weight: 0
  },
  {
    id: 'ferro-fibrous-1', 
    name: 'Ferro-Fibrous',
    type: 'equipment',
    techBase: 'Inner Sphere',
    requiredSlots: 1,
    weight: 0
  },
  {
    id: 'medium-laser-1',
    name: 'Medium Laser',
    type: 'weapon',
    techBase: 'Inner Sphere',
    requiredSlots: 1,
    weight: 1,
    heat: 3
  },
  {
    id: 'jump-jet-1',
    name: 'Jump Jet',
    type: 'equipment',
    techBase: 'Inner Sphere',
    requiredSlots: 1,
    weight: 0.5
  }
]

// Create mock unallocated equipment (simulating 14 Endo Steel pieces + other equipment)
function createMockUnallocatedEquipment(): EquipmentAllocation[] {
  const equipment: EquipmentAllocation[] = []
  
  // Add 14 Endo Steel pieces
  for (let i = 0; i < 14; i++) {
    equipment.push({
      equipmentData: mockEquipmentData[0],
      equipmentGroupId: `endo-steel-${i}`,
      location: 'unallocated',
      occupiedSlots: [],
      startSlotIndex: 0,
      endSlotIndex: 0
    })
  }
  
  // Add 14 Ferro-Fibrous pieces  
  for (let i = 0; i < 14; i++) {
    equipment.push({
      equipmentData: mockEquipmentData[1],
      equipmentGroupId: `ferro-fibrous-${i}`,
      location: 'unallocated',
      occupiedSlots: [],
      startSlotIndex: 0,
      endSlotIndex: 0
    })
  }
  
  // Add 1 Medium Laser
  equipment.push({
    equipmentData: mockEquipmentData[2],
    equipmentGroupId: 'medium-laser-1',
    location: 'unallocated',
    occupiedSlots: [],
    startSlotIndex: 0,
    endSlotIndex: 0
  })
  
  // Add 3 Jump Jets
  for (let i = 0; i < 3; i++) {
    equipment.push({
      equipmentData: mockEquipmentData[3],
      equipmentGroupId: `jump-jet-${i}`,
      location: 'unallocated',
      occupiedSlots: [],
      startSlotIndex: 0,
      endSlotIndex: 0
    })
  }
  
  return equipment
}

// Test the categorization logic
function testEquipmentCategorization() {
  console.log('=== Testing Equipment Categorization ===')
  
  const mockEquipment = createMockUnallocatedEquipment()
  console.log('Total mock equipment items:', mockEquipment.length)
  
  // Test categorization
  const categoryCounts = mockEquipment.reduce((acc, item) => {
    const name = item.equipmentData.name
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('Equipment counts by name:', categoryCounts)
  
  // Expected results:
  // - Endo Steel: 14 items → Should appear as "Structure Components" category with "Endo Steel (14)" group
  // - Ferro-Fibrous: 14 items → Should appear as "Armor Components" category with "Ferro-Fibrous (14)" group  
  // - Medium Laser: 1 item → Should appear as "Weapons - Energy" category with "Medium Laser (1)" group
  // - Jump Jet: 3 items → Should appear as "Movement Systems" category with "Jump Jet (3)" group
  
  console.log('Expected categorization:')
  console.log('🔧 Structure Components (14)')
  console.log('  📦 Endo Steel (14)')
  console.log('🛡️ Armor Components (14)')  
  console.log('  📦 Ferro-Fibrous (14)')
  console.log('⚡ Weapons - Energy (1)')
  console.log('  📦 Medium Laser (1)')
  console.log('🦵 Movement Systems (3)')
  console.log('  📦 Jump Jet (3)')
  
  console.log('=== Categorization Test Complete ===')
}

// Test grouping logic
function testEquipmentGrouping() {
  console.log('=== Testing Equipment Grouping Logic ===')
  
  const mockEquipment = createMockUnallocatedEquipment()
  
  // Group by equipment name first
  const grouped = mockEquipment.reduce((acc, item) => {
    const name = item.equipmentData.name
    if (!acc[name]) {
      acc[name] = {
        items: [],
        count: 0,
        category: getCategoryForEquipment(name)
      }
    }
    acc[name].items.push(item)
    acc[name].count++
    return acc
  }, {} as Record<string, any>)
  
  console.log('Grouped equipment:', Object.keys(grouped).map(name => ({
    name,
    count: grouped[name].count,
    category: grouped[name].category
  })))
  
  console.log('=== Grouping Test Complete ===')
}

function getCategoryForEquipment(equipmentName: string): string {
  const categories = {
    'Structure Components': ['Endo Steel', 'Composite Structure'],
    'Armor Components': ['Ferro-Fibrous', 'Light Ferro-Fibrous'],
    'Weapons - Energy': ['Laser', 'PPC'],
    'Movement Systems': ['Jump Jet']
  }
  
  for (const [categoryName, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => equipmentName.includes(keyword))) {
      return categoryName
    }
  }
  return 'Other Equipment'
}

// Main test function
function runTests() {
  console.log('🧪 Testing Grouped Equipment Display Functionality')
  console.log('================================================')
  
  testEquipmentCategorization()
  console.log('')
  testEquipmentGrouping()
  
  console.log('✅ All tests completed!')
  console.log('')
  console.log('To test the UI:')
  console.log('1. Navigate to /customizer-v2')
  console.log('2. Go to Structure tab and change to "Endo Steel"')
  console.log('3. Go to Armor tab and change to "Ferro-Fibrous"') 
  console.log('4. Go to Criticals tab to see the grouped display')
  console.log('5. Look for organized sections with counts like:')
  console.log('   🔧 Structure Components (14)')
  console.log('   📦 Endo Steel (14)')
  console.log('   🛡️ Armor Components (14)')
  console.log('   📦 Ferro-Fibrous (14)')
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
}

export { runTests, testEquipmentCategorization, testEquipmentGrouping }
