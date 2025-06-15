# Dynamic Internal Structure Implementation

## Summary

The critical slot system has been updated to dynamically calculate internal structure based on the unit's configuration (engine type, gyro type, cockpit type, etc.) instead of using hardcoded values.

## Key Changes

### 1. Created `criticalSlotCalculations.ts`

This utility file provides:
- `calculateCompleteInternalStructure()` - Dynamically calculates all internal structure slots based on unit configuration
- `findEquipmentConflicts()` - Identifies equipment that conflicts with new internal structure
- `handleSystemChange()` - Handles changes to system components and clears conflicting equipment

### 2. Dynamic Slot Calculation

The system now properly handles:
- **XL Engines**: Places 3 engine slots before gyro and 3 after gyro in center torso
- **XL Gyros**: Takes 6 slots instead of 4
- **Engine/Gyro Combinations**:
  - Standard Engine + Standard Gyro: Slots 1-3 Engine, 4-7 Gyro, 8-12 available
  - XL Engine + Standard Gyro: Slots 1-3 Engine, 4-7 Gyro, 8-10 Engine, 11-12 available
  - Standard Engine + XL Gyro: Slots 1-3 Engine, 4-9 Gyro, 10-12 available
  - XL Engine + XL Gyro: Slots 1-3 Engine, 4-9 Gyro, 10-12 Engine (no equipment space)

### 3. Updated MechCriticalsAllocationGrid

- Removed hardcoded `INTERNAL_STRUCTURE_SLOTS`
- Now calls `calculateCompleteInternalStructure()` to get dynamic structure
- Properly accounts for varying internal structure sizes

## Testing the Implementation

### To verify XL gyro behavior:

1. **Start with Standard Gyro**:
   - Place equipment in center torso slots 8-9
   - Note the equipment placement

2. **Change to XL Gyro**:
   - The system should expand gyro from 4 to 6 slots
   - Equipment in slots 8-9 should be cleared (with warning)
   - Slots 4-9 should now show "XL Gyro"

3. **With XL Engine + XL Gyro**:
   - All 12 center torso slots should be occupied:
     - Slots 1-3: Engine
     - Slots 4-9: XL Gyro
     - Slots 10-12: Engine
   - No equipment can be placed in center torso

## Integration Required

For the system to work fully, the parent component needs to:

1. **Handle Gyro Type Changes**:
```javascript
const handleGyroTypeChange = async (newGyroType) => {
  const { updatedUnit, conflicts } = handleSystemChange(unit, 'gyro', newGyroType);
  
  if (conflicts.totalConflicts > 0) {
    // Show confirmation dialog about equipment removal
    if (confirmed) {
      setUnit(updatedUnit);
    }
  } else {
    setUnit(updatedUnit);
  }
};
```

2. **Update Unit State**:
- Ensure `unit.systemComponents` is properly populated with engine, gyro, cockpit types
- Call appropriate handlers when system components change

## Remaining Issues

1. **TypeScript Errors**: Type mismatches between DraggedEquipment and EquipmentObject interfaces (separate issue)
2. **Parent Component Integration**: The customizer page needs to wire up the system change handlers
3. **User Feedback**: Implement confirmation dialogs when equipment will be removed

## Benefits

- No more hardcoded internal structure
- Properly handles all engine/gyro combinations
- Automatically clears conflicting equipment
- Extensible to other system components (cockpit types, armor types, etc.)
