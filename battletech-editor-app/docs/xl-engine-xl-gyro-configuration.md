# XL Engine + XL Gyro Configuration

## Critical Slot Layout Discovery

When using both an XL Engine and XL Gyro, the center torso layout is:

### Center Torso (12 slots total):
- **Slots 1-3**: Engine
- **Slots 4-9**: XL Gyro (6 slots)
- **Slots 10-12**: Engine (additional XL engine slots)

This means **ALL 12 slots** in the center torso are occupied by internal structure, leaving no room for additional equipment.

## Key Insights

1. **XL Engine Behavior**: Unlike standard engines that only occupy the first 3 slots, XL engines also require additional slots AFTER the gyro.

2. **XL Gyro Size**: XL gyros take 6 slots instead of the standard 4 slots.

3. **No Equipment Space**: With XL engine + XL gyro, the center torso has no available slots for equipment.

## Implementation

Updated the `INTERNAL_STRUCTURE_SLOTS` in `MechCriticalsAllocationGrid.tsx`:

```javascript
[MECH_LOCATIONS.CENTER_TORSO]: [
  'Engine',    // Slot 1
  'Engine',    // Slot 2
  'Engine',    // Slot 3
  'XL Gyro',   // Slot 4
  'XL Gyro',   // Slot 5
  'XL Gyro',   // Slot 6
  'XL Gyro',   // Slot 7
  'XL Gyro',   // Slot 8
  'XL Gyro',   // Slot 9
  'Engine',    // Slot 10
  'Engine',    // Slot 11
  'Engine'     // Slot 12
]
```

## Edge Case Handling

Added logic to handle locations where all slots are internal structure:
- The `getLocationSlots` function now checks if internal structure fills all slots
- Equipment placement is only attempted if there are available slots after internal structure

## Implications for Dynamic System

For a proper dynamic critical slot system, we need to:
1. Calculate engine slot requirements based on engine type (Standard vs XL vs Light vs XXL)
2. Calculate gyro slot requirements based on gyro type
3. Handle the fact that XL engines split their slots (some before gyro, some after)
4. Clear equipment when internal structure expands due to equipment changes

## Related Issues

- The drag and drop system has been fixed to properly handle partial overlaps and show hover feedback
- TypeScript errors exist due to interface mismatches between old string-based and new object-based systems
- A dynamic internal structure calculation system is still needed for proper gyro type switching
