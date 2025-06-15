# Critical Slot UI Issues - Investigation Summary

## Test Pages Created

1. **`/test-critical-slots`** - Main test page with engine/gyro selection and grid display
2. **`/test-slot-rendering`** - Isolated test of individual slot rendering

## Issues Found

### 1. Display Problem - Engine Slots Show Empty

**Symptom**: Engine slots (1-3) show as empty instead of displaying "Engine"

**Root Cause**: The CriticalSlotDropZone component IS receiving the correct equipment data (verified with debug logging), but the slots still appear empty.

**Debug Added**:
- Added console.log in CriticalSlotDropZone.renderContent() for Center Torso slots 0-2
- Added console.log in MechCriticalsAllocationGrid when creating slot objects

### 2. System Change Integration Missing

**Symptom**: When gyro type changes, the equipment is not removed/rebuilt

**Root Cause**: The main customizer component never calls `handleSystemChange` when system components change

**What Should Happen**:
1. User changes gyro from Standard to XL
2. Parent component calls `handleSystemChange(unit, 'gyro', 'XL')`
3. System rebuilds slots, removing conflicting equipment
4. UI updates to show new configuration

**What Actually Happens**:
1. User changes gyro type
2. Only the gyro type in systemComponents updates
3. Critical slots remain unchanged
4. SRM 6 stays in place even though XL Gyro should occupy those slots

### 3. Data Model Issues

**Grid Creates**:
```javascript
{
  slotIndex: 0,
  location: 'Center Torso',
  equipment: {
    equipmentId: 'system-Center Torso-0',
    equipmentData: {
      id: 'system-Center Torso-0',
      name: 'Engine',
      type: 'System',
      category: 'System',
      requiredSlots: 1,
      weight: 0,
      isFixed: true,
      isRemovable: false,
      techBase: 'Both'
    },
    allocatedSlots: 1,
    startSlotIndex: 0,
    endSlotIndex: 0
  },
  isLocked: true,
  isEmpty: false,
  isPartOfMultiSlot: false,
  slotType: 'normal'
}
```

**CriticalSlotDropZone Expects**: A CriticalSlotObject with specific properties

**Type Mismatches**:
- DraggedEquipment vs EquipmentObject interfaces
- Additional properties like `isLocked` and `isEmpty` not in type definition

## Next Steps to Fix

### 1. Fix Display Issue
- Verify the slot object structure matches what CriticalSlotDropZone expects
- Check if the equipment name is being extracted correctly
- Ensure CSS classes are applied correctly for system components

### 2. Integrate System Changes
- Modify the parent component to call `handleSystemChange`
- Ensure state updates trigger re-renders
- Add proper change handlers for engine/gyro type changes

### 3. Unify Data Models
- Create a consistent interface for slot objects
- Ensure grid and drop zone use the same data structure
- Fix type definitions to include all necessary properties

## Testing Process

1. Open `/test-critical-slots`
2. Check browser console for debug output
3. Verify Engine slots show "Engine" (not "1", "2", "3")
4. Change gyro type and verify equipment is removed
5. Check that internal structure updates correctly

## Key Files

- `components/editor/criticals/MechCriticalsAllocationGrid.tsx` - Creates slot objects
- `components/editor/criticals/CriticalSlotDropZone.tsx` - Renders individual slots
- `utils/criticalSlotCalculations.ts` - Handles rebuilding logic
- `pages/test-critical-slots.tsx` - Main test page
