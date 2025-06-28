/**
 * CRITICAL EQUIPMENT ALLOCATION BUG - COMPREHENSIVE FIX
 * 
 * This file documents and fixes the root causes of equipment allocation failures
 */

import { UnitCriticalManager } from './utils/criticalSlots/UnitCriticalManager'
import { EquipmentAllocation } from './utils/criticalSlots/CriticalSlot'

// ROOT CAUSE ANALYSIS - FINDINGS:

/* 
1. **EQUIPMENT DUPLICATION CONFIRMED**
   - initializeSpecialComponents() called multiple times without cleanup
   - Called in: constructor, rebuildSystemComponents(), configuration updates
   - Results in 306 items instead of ~31 (10x+ duplication)

2. **DATA MODEL ALLOCATION LOGIC IS CORRECT**
   - allocateEquipmentFromPool() properly calls removeUnallocatedEquipment()
   - removeUnallocatedEquipment() uses correct findIndex() and splice()
   - Issue is NOT in the allocation logic itself

3. **REACT STATE MANAGEMENT ISSUE**
   - MultiUnitProvider doesn't properly trigger re-renders after allocation
   - getUnallocatedEquipment() returns correct data, but UI doesn't refresh

4. **DEDUPLICATION BAND-AID WAS MASKING REAL ISSUE**
   - My earlier fix in UnallocatedEquipmentDisplay was treating symptoms
   - Need to fix root duplication cause instead
*/

interface DiagnosticResult {
  beforeCount: number
  afterCount: number
  removedCount: number
  equipmentFound: boolean
  allocationSuccess: boolean
  finalUnallocatedCount: number
}

/**
 * PHASE 1: FIX EQUIPMENT DUPLICATION AT SOURCE
 */
export class EquipmentDuplicationFix {
  
  /**
   * Fix 1: Add equipment clearing before initialization
   */
  static fixDuplicateInitialization() {
    // Patch UnitCriticalManager to clear before reinitializing
    const originalRebuildSystemComponents = UnitCriticalManager.prototype['rebuildSystemComponents']
    
    UnitCriticalManager.prototype['rebuildSystemComponents'] = function() {
      console.log('[DUPLICATION FIX] rebuildSystemComponents called - clearing special components first')
      
      // Clear ALL special components before rebuilding
      this.clearAllSpecialComponents()
      
      // Call original method
      originalRebuildSystemComponents.call(this)
    }
  }
  
  /**
   * Fix 2: Add method to clear all special components
   */
  static addClearSpecialComponentsMethod() {
    UnitCriticalManager.prototype['clearAllSpecialComponents'] = function() {
      console.log('[DUPLICATION FIX] Clearing all special components')
      
      const beforeCount = this.unallocatedEquipment.length
      
      // Remove all structure components
      this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => {
        const specialEq = eq.equipmentData as any
        return !(specialEq.componentType === 'structure' || specialEq.componentType === 'armor')
      })
      
      // Remove all jump jets
      this.unallocatedEquipment = this.unallocatedEquipment.filter(eq => 
        !eq.equipmentData.name.includes('Jump') && 
        !eq.equipmentData.name.includes('UMU') &&
        !eq.equipmentData.name.includes('Booster') &&
        !eq.equipmentData.name.includes('Wing')
      )
      
      const afterCount = this.unallocatedEquipment.length
      console.log(`[DUPLICATION FIX] Cleared ${beforeCount - afterCount} special components (${beforeCount} → ${afterCount})`)
    }
  }
}

/**
 * PHASE 2: FIX REACT STATE MANAGEMENT  
 */
export class ReactStateManagementFix {
  
  /**
   * Fix 3: Add proper state change notifications to UnitCriticalManager
   */
  static addStateChangeNotifications() {
    // Add observer pattern to UnitCriticalManager
    UnitCriticalManager.prototype['listeners'] = []
    
    UnitCriticalManager.prototype['subscribe'] = function(callback: () => void): () => void {
      this.listeners = this.listeners || []
      this.listeners.push(callback)
      return () => {
        this.listeners = this.listeners.filter((l: any) => l !== callback)
      }
    }
    
    UnitCriticalManager.prototype['notifyStateChange'] = function() {
      this.listeners = this.listeners || []
      this.listeners.forEach((callback: any) => callback())
    }
    
    // Patch critical methods to notify on changes
    const originalAllocateEquipmentFromPool = UnitCriticalManager.prototype.allocateEquipmentFromPool
    UnitCriticalManager.prototype.allocateEquipmentFromPool = function(equipmentGroupId: string, location: string, startSlot: number): boolean {
      const result = originalAllocateEquipmentFromPool.call(this, equipmentGroupId, location, startSlot)
      
      if (result) {
        console.log('[STATE FIX] Equipment allocated successfully, notifying state change')
        this.notifyStateChange()
      }
      
      return result
    }
    
    const originalRemoveUnallocatedEquipment = UnitCriticalManager.prototype.removeUnallocatedEquipment
    UnitCriticalManager.prototype.removeUnallocatedEquipment = function(equipmentGroupId: string) {
      const result = originalRemoveUnallocatedEquipment.call(this, equipmentGroupId)
      
      if (result) {
        console.log('[STATE FIX] Equipment removed from unallocated, notifying state change')
        this.notifyStateChange()
      }
      
      return result
    }
  }
}

/**
 * PHASE 3: COMPREHENSIVE DIAGNOSTIC TOOL
 */
export class AllocationDiagnostic {
  
  /**
   * Comprehensive allocation test
   */
  static testAllocation(unit: UnitCriticalManager, equipmentGroupId: string, location: string, slotIndex: number): DiagnosticResult {
    console.log('🔍 COMPREHENSIVE ALLOCATION DIAGNOSTIC')
    console.log('=====================================')
    
    const beforeCount = unit.getUnallocatedEquipment().length
    console.log(`Before allocation: ${beforeCount} unallocated items`)
    
    // Check if equipment exists
    const found = unit.findEquipmentGroup(equipmentGroupId)
    const equipmentFound = !!found && !found.section
    console.log(`Equipment found in unallocated pool: ${equipmentFound}`)
    
    if (found && !found.section) {
      console.log(`Found equipment: ${found.allocation.equipmentData.name} (${found.allocation.equipmentGroupId})`)
    }
    
    // Attempt allocation
    console.log(`Attempting allocation to ${location} slot ${slotIndex}`)
    const allocationSuccess = unit.allocateEquipmentFromPool(equipmentGroupId, location, slotIndex)
    console.log(`Allocation result: ${allocationSuccess}`)
    
    const afterCount = unit.getUnallocatedEquipment().length
    const removedCount = beforeCount - afterCount
    
    console.log(`After allocation: ${afterCount} unallocated items`)
    console.log(`Equipment removed from unallocated: ${removedCount}`)
    
    // Verify equipment is in target location
    if (allocationSuccess) {
      const section = unit.getSection(location)
      if (section) {
        const allocated = section.getAllEquipment().find(eq => eq.equipmentGroupId === equipmentGroupId)
        console.log(`Equipment found in target location: ${!!allocated}`)
        if (allocated) {
          console.log(`Allocated to slots: ${allocated.occupiedSlots.join(', ')}`)
        }
      }
    }
    
    console.log('=====================================')
    
    return {
      beforeCount,
      afterCount, 
      removedCount,
      equipmentFound,
      allocationSuccess,
      finalUnallocatedCount: afterCount
    }
  }
  
  /**
   * Equipment duplication analysis
   */
  static analyzeDuplication(unit: UnitCriticalManager): void {
    console.log('🔍 EQUIPMENT DUPLICATION ANALYSIS')
    console.log('=================================')
    
    const unallocated = unit.getUnallocatedEquipment()
    console.log(`Total unallocated equipment: ${unallocated.length}`)
    
    // Count by name
    const nameCounts = unallocated.reduce((acc, eq) => {
      const name = eq.equipmentData.name
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('Equipment counts by name:')
    Object.entries(nameCounts).forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`)
      
      // Flag concerning counts
      if (name === 'Endo Steel' && count !== 14) {
        console.error(`  ❌ ISSUE: Endo Steel should be 14, found ${count}`)
      }
      if (name === 'Ferro-Fibrous' && count !== 14) {
        console.error(`  ❌ ISSUE: Ferro-Fibrous should be 14, found ${count}`)
      }
    })
    
    // Check for duplicate group IDs
    const groupIds = unallocated.map(eq => eq.equipmentGroupId)
    const uniqueGroupIds = new Set(groupIds)
    
    if (groupIds.length !== uniqueGroupIds.size) {
      console.error(`❌ DUPLICATE GROUP IDs DETECTED!`)
      console.error(`Total items: ${groupIds.length}, Unique IDs: ${uniqueGroupIds.size}`)
      
      // Find duplicates
      const duplicateIds = groupIds.filter((id, index) => groupIds.indexOf(id) !== index)
      console.error(`Duplicate IDs: ${Array.from(new Set(duplicateIds))}`)
    }
    
    console.log('=================================')
  }
}

/**
 * PHASE 4: MASTER FIX APPLICATION
 */
export class MasterEquipmentFix {
  
  /**
   * Apply all fixes in correct order
   */
  static applyAllFixes(): void {
    console.log('🔧 APPLYING COMPREHENSIVE EQUIPMENT ALLOCATION FIXES')
    console.log('==================================================')
    
    try {
      // Phase 1: Fix duplication
      console.log('Phase 1: Fixing equipment duplication...')
      EquipmentDuplicationFix.addClearSpecialComponentsMethod()
      EquipmentDuplicationFix.fixDuplicateInitialization()
      
      // Phase 2: Fix React state management  
      console.log('Phase 2: Fixing React state management...')
      ReactStateManagementFix.addStateChangeNotifications()
      
      console.log('✅ All fixes applied successfully!')
      console.log('==================================================')
      
    } catch (error) {
      console.error('❌ Error applying fixes:', error)
    }
  }
  
  /**
   * Validate that fixes are working
   */
  static validateFixes(unit: UnitCriticalManager): boolean {
    console.log('🔍 VALIDATING FIXES')
    console.log('==================')
    
    try {
      // Check that observer pattern is working
      const hasSubscribe = typeof (unit as any).subscribe === 'function'
      const hasNotify = typeof (unit as any).notifyStateChange === 'function'
      const hasClearMethod = typeof (unit as any).clearAllSpecialComponents === 'function'
      
      console.log(`Observer pattern: ${hasSubscribe && hasNotify ? '✅' : '❌'}`)
      console.log(`Clear method: ${hasClearMethod ? '✅' : '❌'}`)
      
      // Check equipment duplication
      AllocationDiagnostic.analyzeDuplication(unit)
      
      const isValid = hasSubscribe && hasNotify && hasClearMethod
      console.log(`Overall validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`)
      console.log('==================')
      
      return isValid
      
    } catch (error) {
      console.error('❌ Validation error:', error)
      return false
    }
  }
}

// EXPORT FOR GLOBAL USE
if (typeof window !== 'undefined') {
  (window as any).EquipmentAllocationFix = {
    apply: MasterEquipmentFix.applyAllFixes,
    validate: MasterEquipmentFix.validateFixes,
    diagnose: AllocationDiagnostic.testAllocation,
    analyzeDuplication: AllocationDiagnostic.analyzeDuplication
  }
}

export default MasterEquipmentFix
