/**
 * Diagnostic script to investigate equipment duplication issue
 * User reports 138 Endo Steel pieces instead of expected 14
 */

import { EquipmentAllocation } from './utils/criticalSlots/CriticalSlot'

interface DuplicationReport {
  totalItems: number
  uniqueGroupIds: number
  duplicateCount: number
  nameCounts: Record<string, number>
  groupIdCounts: Record<string, number>
  duplicateAnalysis: {
    groupId: string
    count: number
    items: EquipmentAllocation[]
  }[]
}

export function diagnoseDuplication(unallocatedEquipment: EquipmentAllocation[]): DuplicationReport {
  console.log('🔍 DIAGNOSING EQUIPMENT DUPLICATION')
  console.log('=====================================')
  
  // Basic counts
  const totalItems = unallocatedEquipment.length
  const groupIds = unallocatedEquipment.map(eq => eq.equipmentGroupId)
  const uniqueGroupIds = new Set(groupIds).size
  const duplicateCount = totalItems - uniqueGroupIds
  
  console.log(`Total items: ${totalItems}`)
  console.log(`Unique group IDs: ${uniqueGroupIds}`)
  console.log(`Duplicate count: ${duplicateCount}`)
  
  // Count by equipment name
  const nameCounts = unallocatedEquipment.reduce((acc, eq) => {
    const name = eq.equipmentData.name
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\nEquipment counts by name:')
  Object.entries(nameCounts).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`)
    if (name === 'Endo Steel' && count !== 14) {
      console.error(`  ❌ ISSUE: Endo Steel should be 14, but found ${count}`)
    }
  })
  
  // Count by group ID to find duplicates
  const groupIdCounts = groupIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const duplicatedGroupIds = Object.entries(groupIdCounts)
    .filter(([id, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
  
  if (duplicatedGroupIds.length > 0) {
    console.log('\n🚨 DUPLICATE GROUP IDs FOUND:')
    duplicatedGroupIds.forEach(([groupId, count]) => {
      console.log(`  ${groupId}: appears ${count} times`)
    })
  }
  
  // Detailed analysis of duplicates
  const duplicateAnalysis = duplicatedGroupIds.map(([groupId, count]) => {
    const items = unallocatedEquipment.filter(eq => eq.equipmentGroupId === groupId)
    return { groupId, count, items }
  })
  
  // Check for potential patterns in duplication
  console.log('\n🔍 LOOKING FOR DUPLICATION PATTERNS:')
  
  // Check if equipment is being duplicated by location
  const byLocation = unallocatedEquipment.reduce((acc, eq) => {
    const location = eq.location || 'unknown'
    if (!acc[location]) acc[location] = []
    acc[location].push(eq)
    return acc
  }, {} as Record<string, EquipmentAllocation[]>)
  
  console.log('Equipment by location:')
  Object.entries(byLocation).forEach(([location, items]) => {
    console.log(`  ${location}: ${items.length} items`)
  })
  
  // Check if same equipment has different variations
  const endoSteelItems = unallocatedEquipment.filter(eq => eq.equipmentData.name === 'Endo Steel')
  if (endoSteelItems.length > 0) {
    console.log('\n📊 ENDO STEEL ANALYSIS:')
    console.log(`Total Endo Steel items: ${endoSteelItems.length}`)
    
    // Group by unique properties to see if there are variations
    const endoSteelVariations = endoSteelItems.reduce((acc, item) => {
      const key = JSON.stringify({
        id: item.equipmentData.id,
        name: item.equipmentData.name,
        weight: item.equipmentData.weight,
        slots: item.equipmentData.requiredSlots
      })
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {} as Record<string, EquipmentAllocation[]>)
    
    console.log(`Endo Steel variations: ${Object.keys(endoSteelVariations).length}`)
    Object.entries(endoSteelVariations).forEach(([variation, items], index) => {
      console.log(`  Variation ${index + 1}: ${items.length} items`)
      console.log(`    Properties: ${variation}`)
      console.log(`    Group IDs: ${items.slice(0, 5).map(i => i.equipmentGroupId).join(', ')}${items.length > 5 ? '...' : ''}`)
    })
  }
  
  return {
    totalItems,
    uniqueGroupIds,
    duplicateCount,
    nameCounts,
    groupIdCounts,
    duplicateAnalysis
  }
}

export function suggestFixes(report: DuplicationReport): string[] {
  const suggestions: string[] = []
  
  if (report.duplicateCount > 0) {
    suggestions.push('🔧 Remove duplicate group IDs by deduplicating the unallocated equipment array')
  }
  
  const endoSteelCount = report.nameCounts['Endo Steel']
  if (endoSteelCount && endoSteelCount !== 14) {
    if (endoSteelCount > 14) {
      const multiplier = endoSteelCount / 14
      suggestions.push(`🔧 Endo Steel appears to be multiplied by ${multiplier.toFixed(1)}x - check equipment generation logic`)
      
      if (multiplier % 1 === 0) {
        suggestions.push(`🔧 This suggests equipment is being generated ${Math.round(multiplier)} times`)
      }
    }
    suggestions.push('🔧 Verify Endo Steel generation creates exactly 14 pieces')
  }
  
  if (report.duplicateAnalysis.length > 0) {
    suggestions.push('🔧 Investigate why equipment items have duplicate group IDs')
    suggestions.push('🔧 Check if equipment is being added multiple times during state updates')
  }
  
  return suggestions
}

// Console helper for manual diagnosis
if (typeof window !== 'undefined') {
  (window as any).diagnoseEquipmentDuplication = {
    run: (unallocatedEquipment: EquipmentAllocation[]) => {
      const report = diagnoseDuplication(unallocatedEquipment)
      const suggestions = suggestFixes(report)
      
      console.log('\n💡 SUGGESTED FIXES:')
      suggestions.forEach(suggestion => console.log(suggestion))
      
      return { report, suggestions }
    },
    
    // Quick analysis of current state
    quick: () => {
      console.log('🔍 Quick equipment duplication check')
      console.log('Open browser console and run this from the Customizer V2 page')
      console.log('Usage: window.diagnoseEquipmentDuplication.run(unallocatedEquipmentArray)')
    }
  }
}

export default diagnoseDuplication
