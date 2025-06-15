# Critical Slot System - Final Fix

## The Core Issue

The critical slot system has multiple interconnected issues:

1. **Data Model Mismatch**: The grid uses strings ("Engine", "Gyro", etc.) while CriticalSlotDropZone expects objects
2. **Index Calculation**: Equipment indices need to account for changing internal structure sizes
3. **Display Logic**: Internal structure slots must be shown before equipment slots

## Solution Architecture

### 1. Unified Data Model

Instead of mixing strings and objects, we need a consistent approach:
- Internal structure: Array of slot descriptors
- Equipment: Array of equipment objects
- Display: Merge both into a unified slot array

### 2. Correct Index Mapping

```
Standard Gyro (7 internal slots):
- Slots 1-3: Engine
- Slots 4-7: Gyro  
- Slots 8-12: Equipment (indices 0-4)

XL Gyro (9 internal slots):
- Slots 1-3: Engine
- Slots 4-9: XL Gyro
- Slots 10-12: Equipment (indices 0-2)
```

### 3. Rebuild Algorithm

When internal structure expands:
1. Calculate old and new internal structure sizes
2. For each equipment item:
   - Calculate its absolute UI position
   - If position < new internal size: remove it
   - Otherwise: place at new relative position

## Implementation Steps

1. Fix the display logic to properly show internal structure
2. Ensure rebuild logic correctly identifies conflicts
3. Update the grid to handle the unified data model

## Key Functions

- `calculateCompleteInternalStructure()`: Returns internal structure for all locations
- `rebuildCriticalSlots()`: Rebuilds equipment arrays when structure changes
- `getLocationSlots()`: Merges internal structure and equipment for display

## Testing

1. Start with Standard Gyro + SRM 6 in slots 8-9
2. Change to XL Gyro
3. Verify:
   - Engine shows in slots 1-3
   - XL Gyro shows in slots 4-9
   - SRM 6 is removed
   - Removed equipment goes to unallocated list
