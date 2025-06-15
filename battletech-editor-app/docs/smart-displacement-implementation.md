# Smart Equipment Displacement Implementation

## Overview
This document describes the implementation of smart equipment displacement when changing engine and gyro types in the MegaMekLab editor.

## Problem Statement
When changing engine or gyro types, equipment that was placed in critical slots would either:
1. Get removed completely instead of being moved to unallocated
2. Get unnecessarily displaced even when not conflicting with new system components
3. Cause UI instability and infinite render loops

## Solution Implemented

### 1. Smart Slot Update Algorithm
The `smartUpdateSlots` function in `utils/smartSlotUpdate.ts` implements intelligent displacement:

```typescript
// Only displace equipment that directly conflicts with new system component slots
// Preserve equipment in slots that are not affected by the change
```

Key features:
- Compares old and new slot requirements
- Only clears slots that are no longer needed
- Only displaces equipment in slots that conflict with new components
- Updates the equipment's location to '' (unallocated) instead of removing it

### 2. Reducer Updates
Modified `useUnitData.tsx` reducer to sync both data structures:

```typescript
// Convert criticalAllocations to simplified criticalSlots format
let criticalSlots: any = {};
if (criticalAllocations) {
  Object.entries(criticalAllocations).forEach(([location, slots]) => {
    const internalSlotsCount = slots.filter((slot: any) => 
      slot.type === 'system' && slot.isFixed
    ).length;
    
    // Extract only equipment (non-system) slots
    const equipmentSlots = slots
      .slice(internalSlotsCount)
      .map((slot: any) => slot.name === '-Empty-' ? null : slot.name);
    
    criticalSlots[location] = equipmentSlots;
  });
}
```

### 3. UI Stability Fixes
Fixed infinite loops by:
- Removing direct state updates from component effects
- Using setTimeout for parent notifications to prevent synchronous updates
- Optimizing effect dependencies

## Testing Results

### Engine Type Changes (XL → Standard)
- ✅ Engine slots removed from side torsos
- ✅ Equipment in non-conflicting slots remains in place
- ✅ No unnecessary displacement of equipment
- ✅ UI remains stable without resets

### Gyro Type Changes
- ✅ Gyro slot count adjusts properly
- ✅ Equipment displacement only occurs when necessary
- ✅ Displaced equipment moves to unallocated (not deleted)

### Equipment Behavior
- LRM 20 in Left Torso: Stays in place when no conflict
- AC/10 in Right Torso: Stays in place when no conflict
- Medium Lasers in Arms: Always preserved (no engine/gyro slots in arms)
- Heat Sinks: Properly shown in unallocated panel

## Implementation Files

1. **utils/smartSlotUpdate.ts** - Core displacement logic
2. **utils/componentSync.ts** - System component synchronization
3. **hooks/useUnitData.tsx** - State management and data sync
4. **components/editor/UnitEditorWithHooks.tsx** - UI dropdowns
5. **components/editor/tabs/CriticalsTab.tsx** - Fixed infinite loops

## Future Improvements

1. Add visual indicators when equipment will be displaced
2. Implement undo/redo for component changes
3. Add confirmation dialogs for changes that will displace equipment
4. Optimize the critical slot rendering for better performance
