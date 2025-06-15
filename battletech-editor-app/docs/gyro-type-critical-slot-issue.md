# Gyro Type Critical Slot Issue

## Problem Description

When changing the gyro type to XL Gyro (or other non-standard gyros), the critical slot system fails to:
1. Update the internal structure layout in the center torso
2. Clear equipment that conflicts with the expanded gyro slots
3. Properly display engine criticals

## Current Implementation Issues

### 1. Hardcoded Internal Structure
The `MechCriticalsAllocationGrid` component has hardcoded internal structure:

```javascript
const INTERNAL_STRUCTURE_SLOTS = {
  [MECH_LOCATIONS.CENTER_TORSO]: ['Engine', 'Engine', 'Engine', 'Gyro', 'Gyro', 'Gyro', 'Gyro'],
  // ... other locations
};
```

This assumes:
- Slots 1-3: Engine
- Slots 4-7: Gyro (Standard = 4 slots)
- Slots 8-12: Available for equipment

### 2. Gyro Slot Requirements
Different gyro types require different numbers of slots:
- **Standard Gyro**: 4 slots
- **XL Gyro**: 6 slots (50% more)
- **Compact Gyro**: 2 slots
- **Heavy-Duty Gyro**: 4 slots

### 3. What Should Happen
When changing to XL Gyro:
- Slots 1-3: Engine (unchanged)
- Slots 4-9: Gyro (6 slots for XL)
- Slots 10-12: Available for equipment
- Any equipment in slots 8-9 should be removed/relocated

## Required Solution

### 1. Dynamic Internal Structure Calculation
Create a function to calculate internal structure based on current equipment:

```javascript
const calculateInternalStructure = (unit: EditableUnit, location: string) => {
  if (location === MECH_LOCATIONS.CENTER_TORSO) {
    const gyroType = unit.gyroType || 'Standard';
    const gyroSlots = getGyroSlotCount(gyroType);
    
    const structure = [];
    // Engine always takes first 3 slots in CT
    structure.push('Engine', 'Engine', 'Engine');
    
    // Gyro takes next X slots based on type
    for (let i = 0; i < gyroSlots; i++) {
      structure.push('Gyro');
    }
    
    return structure;
  }
  
  // Return default structure for other locations
  return INTERNAL_STRUCTURE_SLOTS[location] || [];
};

const getGyroSlotCount = (gyroType: string): number => {
  switch (gyroType) {
    case 'XL': return 6;
    case 'Compact': return 2;
    case 'Heavy-Duty': return 4;
    case 'Standard':
    default: return 4;
  }
};
```

### 2. Update MechCriticalsAllocationGrid
Replace the static `INTERNAL_STRUCTURE_SLOTS` usage with dynamic calculation:

```javascript
const getLocationSlots = (location: string): string[] => {
  const slotCount = CRITICAL_SLOT_COUNTS[location] || 12;
  const currentSlots = unit.criticalSlots?.[location] || [];
  const internalSlots = calculateInternalStructure(unit, location); // Dynamic!
  
  // Rest of the logic...
};
```

### 3. Handle Gyro Type Changes
When gyro type changes:
1. Recalculate internal structure
2. Check for conflicts with existing equipment
3. Remove/relocate conflicting equipment
4. Update the UI to reflect new layout

### 4. Integration Points
The gyro type change handler should:
```javascript
const handleGyroTypeChange = (newGyroType: string) => {
  // Update unit gyro type
  updateUnit({ gyroType: newGyroType });
  
  // Clear conflicting equipment in center torso
  const newInternalSlots = calculateInternalStructure(
    { ...unit, gyroType: newGyroType }, 
    MECH_LOCATIONS.CENTER_TORSO
  );
  
  // Remove equipment that conflicts with new internal structure
  clearConflictingEquipment(MECH_LOCATIONS.CENTER_TORSO, newInternalSlots.length);
};
```

## Implementation Priority

1. **Immediate Fix**: Update `MechCriticalsAllocationGrid` to use dynamic internal structure
2. **Gyro Handler**: Ensure gyro type changes trigger proper slot recalculation
3. **Conflict Resolution**: Add logic to clear/relocate equipment when internal structure expands
4. **UI Feedback**: Show warnings when equipment will be removed due to gyro changes

## Testing Scenarios

1. Start with Standard Gyro and equipment in slots 8-9
2. Change to XL Gyro
3. Verify:
   - Engine shows in slots 1-3
   - Gyro shows in slots 4-9
   - Equipment from slots 8-9 is removed
   - UI updates correctly

## Current Workaround

Until this is fixed, users must manually:
1. Remove equipment from center torso before changing gyro type
2. Re-add equipment after gyro change
3. Be aware that some slots may not be available with larger gyros
