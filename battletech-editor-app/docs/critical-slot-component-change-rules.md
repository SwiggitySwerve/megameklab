# Critical Slot System Component Change Rules

## Core Principle
**System component changes (engine/gyro) must NEVER add equipment automatically. They should only displace equipment that directly conflicts with new system component slots.**

## Fundamental Rules

### Rule 1: No Automatic Equipment Placement
- When changing engine type or gyro type, NO equipment should be automatically placed in any slots
- All unallocated equipment must remain unallocated
- The system must not make assumptions about where equipment should go

### Rule 2: Minimal Displacement
- Only equipment that directly conflicts with new system component slots should be displaced
- Equipment in non-conflicting slots must remain in place
- Multi-slot equipment should only be displaced if ANY of its slots conflict

### Rule 3: Displacement to Unallocated
- Displaced equipment must be moved to the unallocated list (location = '')
- Equipment must NOT be deleted or removed from the unit
- The equipment's other properties should remain unchanged

### Rule 4: Preserve User Placement
- Equipment manually placed by the user in non-conflicting slots must remain
- The system respects user decisions about equipment placement
- Only system requirements can override user placement

## Engine Type Change Behavior

### Engine Slot Requirements
- **Standard**: 6 slots in Center Torso (0-2, 7-9)
- **XL**: 6 slots in CT + 3 slots each in LT/RT (0-2)
- **Light**: 6 slots in CT + 2 slots each in LT/RT (0-1)
- **XXL**: 6 slots in CT + 3 slots each in LT/RT (0-2)
- **Compact**: 6 slots in Center Torso (0-2, 7-9)
- **ICE**: 6 slots in Center Torso (0-2, 7-9)
- **Fuel Cell**: 6 slots in Center Torso (0-2, 7-9)

### Change Scenarios

#### XL → Standard
- **Expected**: Remove engine slots from side torsos
- **Equipment behavior**: Equipment in side torsos stays unless in slots 0-2
- **Displaced items**: Only items in LT/RT slots 0-2 move to unallocated

#### Standard → XL
- **Expected**: Add engine slots to side torsos
- **Equipment behavior**: Equipment in slots 0-2 of LT/RT gets displaced
- **Displaced items**: Items in conflicting slots move to unallocated

## Gyro Type Change Behavior

### Gyro Slot Requirements (Center Torso)
- **Standard**: 4 slots (3-6)
- **XL**: 6 slots (3-8)
- **Compact**: 2 slots (3-4)
- **Heavy-Duty**: 4 slots (3-6)

### Change Scenarios

#### Standard → XL
- **Expected**: Expand gyro from 4 to 6 slots
- **Equipment behavior**: Equipment in CT slots 7-8 gets displaced
- **Displaced items**: Only items in newly claimed slots move to unallocated

#### XL → Compact
- **Expected**: Reduce gyro from 6 to 2 slots
- **Equipment behavior**: Slots 5-8 become available
- **Displaced items**: None (gyro is shrinking)

## Testing Process

### Test Setup State
```javascript
{
  unit: {
    systemComponents: {
      engine: { type: 'XL', rating: 300 },
      gyro: { type: 'Standard' }
    },
    equipment: [
      { name: 'Medium Laser', location: 'LA', slot: 4 },
      { name: 'Medium Laser', location: 'RA', slot: 4 },
      { name: 'LRM 20', location: 'LT', slot: 3 }, // Not in engine slots
      { name: 'AC/10', location: 'RT', slot: 4 },  // Not in engine slots
      { name: 'Heat Sink', location: 'LT', slot: 0 }, // In engine slot
      { name: 'Heat Sink', location: 'CT', slot: 7 }, // Would conflict with XL gyro
    ],
    unallocated: [
      { name: 'Heat Sink', location: '' },
      { name: 'Heat Sink', location: '' },
      // ... more heat sinks
    ]
  }
}
```

### Test 1: Engine Change (XL → Standard)
**Action**: Change engine type to Standard
**Expected State Changes**:
- `Heat Sink` in LT slot 0: Moved to unallocated (location = '')
- `LRM 20` in LT slot 3: Remains in place
- `AC/10` in RT slot 4: Remains in place
- `Medium Laser` in arms: Remain in place
- All unallocated equipment: Remains unallocated

### Test 2: Gyro Change (Standard → XL)
**Action**: Change gyro type to XL
**Expected State Changes**:
- `Heat Sink` in CT slot 7: Moved to unallocated (location = '')
- All other equipment: Remains in place
- All unallocated equipment: Remains unallocated

### Test 3: Combined Changes
**Action**: Change from XL/Standard to Standard/Compact
**Expected State Changes**:
- Side torso engine slots cleared
- Center torso gyro reduced to 2 slots
- Only equipment in freed slots is displaced
- No automatic placement occurs

## Validation Checklist

### Pre-Change State Capture
- [ ] Record all equipment locations
- [ ] Count unallocated equipment
- [ ] Note system component types

### Post-Change Validation
- [ ] Verify system slots are correctly placed
- [ ] Check equipment count matches (none added/deleted)
- [ ] Confirm displaced equipment is in unallocated
- [ ] Verify non-conflicting equipment unchanged
- [ ] Ensure no automatic placement occurred

### State Comparison
```javascript
function validateChange(before, after) {
  // Total equipment count must be equal
  assert(before.equipment.length === after.equipment.length);
  
  // Unallocated count can only increase (from displaced items)
  assert(after.unallocated.length >= before.unallocated.length);
  
  // No equipment should appear in slots that were empty before
  after.criticalSlots.forEach((location, slots) => {
    slots.forEach((item, index) => {
      if (item && !isSystemComponent(item)) {
        assert(before.criticalSlots[location][index] !== null);
      }
    });
  });
}
```

## Error Conditions to Prevent

1. **Auto-allocation**: System must not place heat sinks or other equipment
2. **Equipment deletion**: Displaced equipment must not disappear
3. **Cascade displacement**: Changing one component shouldn't trigger others
4. **Invalid placement**: System components must respect slot boundaries
5. **State corruption**: UI must remain stable without resets

## Implementation Requirements

1. **Smart displacement algorithm**: Only move what conflicts
2. **Preserve user intent**: Keep manually placed equipment when possible
3. **Clear feedback**: Show what will be displaced before confirming
4. **Atomic operations**: All changes happen together or not at all
5. **Consistent state**: Data structures must remain synchronized

## UI Behavior Expectations

### Dropdown Changes
1. User selects new engine/gyro type from dropdown
2. System calculates which slots will be affected
3. Equipment in conflicting slots is displaced to unallocated
4. UI updates to show new component layout
5. Displaced equipment appears in unallocated panel

### Drag and Drop After Change
1. All displaced equipment should be draggable from unallocated
2. Empty slots should show proper hover states
3. Invalid drop zones should reject equipment
4. Multi-slot equipment should respect boundaries

### Visual Feedback
1. System components should be clearly marked as non-draggable
2. Displaced equipment should appear immediately in unallocated
3. No loading states or screen resets should occur
4. Changes should feel instant and responsive

## Common Bug Patterns to Avoid

### Pattern 1: Equipment Duplication
- **Bug**: Equipment appears in both slots and unallocated
- **Cause**: State not properly synchronized
- **Prevention**: Single source of truth for equipment location

### Pattern 2: Ghost Equipment
- **Bug**: Equipment disappears completely
- **Cause**: Improper displacement logic
- **Prevention**: Always set location to '' for unallocated

### Pattern 3: Auto-fill Behavior
- **Bug**: Heat sinks automatically fill empty slots
- **Cause**: Legacy auto-allocation code
- **Prevention**: Remove all auto-placement logic

### Pattern 4: Cascade Effects
- **Bug**: Changing engine triggers gyro changes
- **Cause**: Interdependent state updates
- **Prevention**: Isolate component change handlers

## Test Coverage Requirements

1. **Unit Tests**: Each displacement scenario
2. **Integration Tests**: Combined component changes
3. **UI Tests**: Drag/drop after displacement
4. **State Tests**: Data structure synchronization
5. **Edge Cases**: Boundary conditions and conflicts

This document serves as the definitive guide for how the critical slot system should behave when system components change. Any deviation from these rules should be considered a bug.
