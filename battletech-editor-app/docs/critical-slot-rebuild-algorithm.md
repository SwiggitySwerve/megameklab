# Critical Slot Rebuild Algorithm

## Overview

When system components change (engine type, gyro type, etc.), the critical slot system must completely rebuild the slot allocation for each location. This ensures equipment is properly removed when internal structure expands.

## The Algorithm

### 1. Calculate New Internal Structure
Based on the new system configuration, determine which slots are occupied by internal structure:
- Engine slots (CT + side torsos for XL/Light/XXL)
- Gyro slots (varies by type)
- Cockpit components
- Actuators
- Structure type slots (Endo-Steel, etc.)
- Armor type slots (Ferro-Fibrous, etc.)

### 2. Build New Critical Slot Model
For each location:
1. Start with total slot count (12 for torsos/arms, 6 for head/legs)
2. Place internal structure in the appropriate slots
3. Remaining slots are available for equipment

### 3. Migrate Equipment
For each location:
1. Get current equipment from old model
2. For each piece of equipment:
   - Check if it can fit in the new model (not overlapping with internal structure)
   - If yes: place it in the new model at the same relative position if possible
   - If no: add to removed equipment list

### 4. Handle Removed Equipment
All equipment that couldn't fit in the new model:
- Add to `unallocatedEquipment` list
- Track location it was removed from for user feedback

## Example: Standard → XL Gyro

### Before (Standard Gyro):
```
Center Torso (12 slots):
1-3:   Engine (internal)
4-7:   Gyro (internal)
8:     SRM 6
9:     SRM 6
10-12: Empty
```

### After (XL Gyro):
```
Center Torso (12 slots):
1-3:   Engine (internal)
4-9:   XL Gyro (internal) ← Expanded from 4 to 6 slots
10-12: Empty

Removed Equipment:
- SRM 6 (was in slot 8)
- SRM 6 (was in slot 9)
```

## Implementation Requirements

1. **Don't modify existing slots** - build completely new model
2. **Check each equipment piece individually** against new structure
3. **Preserve equipment order** where possible
4. **Track all removals** for user notification
5. **Update unallocated list** with removed equipment

## Critical Implementation Detail

The current `criticalSlots` array in the unit object contains ONLY equipment slots, not internal structure. For example:
- If a location has 12 total slots and 7 are internal structure, `criticalSlots[location]` has length 5
- Index 0 in the array corresponds to slot 8 in the UI (after 7 internal slots)

This means:
1. When reading current equipment, indices are relative to available slots
2. When checking conflicts, must map UI slot numbers to array indices
3. SRM 6 in "slot 8" is at `criticalSlots[location][0]` if there are 7 internal slots

## Pseudocode

```javascript
function rebuildCriticalSlots(unit, newInternalStructure) {
  const newCriticalSlots = {};
  const removedEquipment = [];
  
  for (each location) {
    // Get slot counts
    const totalSlots = SLOT_COUNTS[location];
    const internalSlotCount = newInternalStructure[location].length;
    const availableSlots = totalSlots - internalSlotCount;
    
    // Create new equipment array
    const newEquipment = new Array(availableSlots).fill(null);
    
    // Get current equipment
    const currentEquipment = unit.criticalSlots[location] || [];
    
    // Try to place each equipment item
    currentEquipment.forEach((item, index) => {
      if (item) {
        // Check if this equipment's original position is now internal structure
        const absoluteSlotIndex = index + oldInternalSlotCount;
        
        if (absoluteSlotIndex >= internalSlotCount) {
          // Equipment doesn't conflict with new internal structure
          const newIndex = absoluteSlotIndex - internalSlotCount;
          if (newIndex < availableSlots) {
            newEquipment[newIndex] = item;
          } else {
            removedEquipment.push({ location, equipment: item });
          }
        } else {
          // Equipment conflicts with new internal structure
          removedEquipment.push({ location, equipment: item });
        }
      }
    });
    
    newCriticalSlots[location] = newEquipment;
  }
  
  return { newCriticalSlots, removedEquipment };
}
```

## User Experience

When system components change:
1. Calculate what equipment will be removed
2. Show confirmation dialog: "Changing to XL Gyro will remove: SRM 6 (x2) from Center Torso"
3. If confirmed:
   - Apply changes
   - Move removed equipment to unallocated list
   - Update UI
4. If cancelled:
   - Revert system component change
   - Keep existing configuration
