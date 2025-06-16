# Equipment Displacement Fix Summary

## Problem Description
When the engine type changed to XL, equipment was being completely removed from the unit instead of being properly displaced to the unallocated pool. This was causing equipment to be lost permanently rather than being available for re-allocation.

## Root Cause Analysis
The issue was in three key areas:

1. **UnitCriticalManager.updateConfiguration()** - Was calling `clearSystemReservations()` without properly handling the displaced equipment
2. **CriticalSection.clearSystemReservations()** - Was clearing slots but returning an empty array instead of the actual displaced equipment
3. **State consistency issue** - Configuration was being updated at the wrong time, causing React to see stale engine/gyro values in the UI

## Solution Implementation

### 1. Fixed UnitCriticalManager.updateConfiguration()
- Added proper detection of engine/gyro changes
- Implemented `handleSystemComponentChange()` method that:
  - Clears old system reservations and collects displaced equipment
  - Uses displacement impact analysis to identify conflicting equipment
  - Removes conflicting equipment from sections
  - Allocates new system components
  - Adds all displaced equipment to the unallocated pool

### 2. Fixed CriticalSection.clearSystemReservations()
- Modified to find and collect conflicting equipment before clearing slots
- Actually removes and returns displaced equipment instead of empty array
- Ensures equipment is properly extracted for displacement handling

### 3. Fixed State Consistency Issue
- Moved configuration update to end of `updateConfiguration()` method
- Created `allocateSystemComponentsWithConfig()` to use specific config values during system component changes
- Ensures React components always see consistent engine/gyro values in the UI

## Code Changes

### UnitCriticalManager.ts
```typescript
// Fixed configuration update flow
updateConfiguration(newConfiguration: UnitConfiguration): void {
  const oldConfig = this.configuration
  const validatedConfig = UnitConfigurationBuilder.buildConfiguration(newConfiguration)
  
  // Handle special component changes
  this.handleSpecialComponentConfigurationChange(oldConfig, validatedConfig)
  
  // Handle engine/gyro changes properly with equipment displacement
  if (oldConfig.engineType !== validatedConfig.engineType || 
      oldConfig.gyroType !== validatedConfig.gyroType) {
    this.handleSystemComponentChange(oldConfig, validatedConfig)
  }
  
  // Always update configuration at the end to ensure consistency
  this.configuration = validatedConfig
}

// Added proper system component change handling
private handleSystemComponentChange(oldConfig: UnitConfiguration, newConfig: UnitConfiguration): void {
  const allDisplacedEquipment: EquipmentAllocation[] = []
  
  // Clear old system reservations and collect displaced equipment
  this.sections.forEach(section => {
    const engineDisplaced = section.clearSystemReservations('engine')
    const gyroDisplaced = section.clearSystemReservations('gyro')
    allDisplacedEquipment.push(...engineDisplaced, ...gyroDisplaced)
  })
  
  // Find equipment that conflicts with new system slots
  const displacementImpact = SystemComponentRules.getDisplacementImpact(
    oldConfig.engineType, oldConfig.gyroType,
    newConfig.engineType, newConfig.gyroType
  )
  
  // Remove conflicting equipment and add to displaced pool
  displacementImpact.affectedLocations.forEach(location => {
    const section = this.sections.get(location)
    if (section) {
      const conflictSlots = displacementImpact.conflictSlots[location] || []
      const conflictingEquipment = section.findConflictingEquipment(conflictSlots)
      
      conflictingEquipment.forEach(equipment => {
        const removed = section.removeEquipmentGroup(equipment.equipmentGroupId)
        if (removed) {
          allDisplacedEquipment.push(removed)
        }
      })
    }
  })
  
  // Allocate new system components using specific config values
  this.allocateSystemComponentsWithConfig(newConfig)
  
  // Add all displaced equipment to unallocated pool
  if (allDisplacedEquipment.length > 0) {
    this.addUnallocatedEquipment(allDisplacedEquipment)
  }
}

// Uses specific configuration for system component allocation
private allocateSystemComponentsWithConfig(config: UnitConfiguration): void {
  const systemAllocation = SystemComponentRules.getCompleteSystemAllocation(
    config.engineType,
    config.gyroType
  )

  // Allocate engine slots
  this.allocateEngineSlots(systemAllocation.engine)
  
  // Allocate gyro slots
  this.allocateGyroSlots(systemAllocation.gyro)
}
```

### CriticalSection.ts
```typescript
// Fixed to properly return displaced equipment
clearSystemReservations(componentType: string): EquipmentAllocation[] {
  const reservedSlots = this.systemSlotReservations.get(componentType)
  if (!reservedSlots) return []
  
  // Find and collect any equipment that will be displaced by clearing these slots
  const displacedEquipment = this.findConflictingEquipment(reservedSlots)
  
  // Remove the conflicting equipment
  const actuallyDisplaced: EquipmentAllocation[] = []
  displacedEquipment.forEach(equipment => {
    const removed = this.removeEquipmentGroup(equipment.equipmentGroupId)
    if (removed) {
      actuallyDisplaced.push(removed)
    }
  })
  
  // Clear the reserved slots
  reservedSlots.forEach(slotIndex => {
    const slot = this.getSlot(slotIndex)
    slot.clearSlot()
  })
  
  // Remove the reservation tracking
  this.systemSlotReservations.delete(componentType)
  
  return actuallyDisplaced
}
```

## Test Results
Created comprehensive test suite that verifies:
- ✅ Equipment is displaced to unallocated pool when engine changes to XL
- ✅ Equipment remains preserved when changing back to Standard engine
- ✅ Specific equipment displacement scenarios work correctly
- ✅ All equipment is preserved (total allocated + unallocated = original count)

## Impact
- **Fixed**: Equipment is no longer lost when engine type changes
- **Preserved**: Equipment is properly moved to unallocated pool for re-allocation
- **Maintained**: Existing functionality remains intact
- **Improved**: Better user experience with equipment management during system changes
- **Fixed**: UI now correctly shows current engine/gyro selection instead of previous values

## Files Modified
- `utils/criticalSlots/UnitCriticalManager.ts` - Added proper displacement handling
- `utils/criticalSlots/CriticalSection.ts` - Fixed system reservation clearing
- `__tests__/utils/equipment-displacement-fix.test.ts` - Added comprehensive test coverage

The fix ensures that changing system components (like engine types) properly displaces conflicting equipment to the unallocated pool rather than removing it entirely, maintaining equipment integrity throughout configuration changes.
