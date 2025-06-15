# Critical Slot System Integration Requirements

## The Core Problem

The critical slot system has been designed and tested, but it's not integrated into the main UI. The `MechCriticalsAllocationGrid` component is just displaying data without:

1. Properly showing internal structure slots
2. Calling the rebuild logic when system components change

## What's Currently Happening

When you change the gyro type:
- The gyro type changes in the unit data
- The display recalculates internal structure
- BUT the equipment array is never rebuilt
- So SRM 6 stays in slots that should now be occupied by the XL Gyro

## Required Integration Points

### 1. Parent Component Must Call handleSystemChange

The parent component (likely the customizer page) needs to:

```javascript
const handleGyroTypeChange = (newType: string) => {
  const { updatedUnit, removedEquipment } = handleSystemChange(unit, 'gyro', newType);
  
  // Show confirmation if equipment will be removed
  if (removedEquipment.length > 0) {
    const equipmentNames = removedEquipment.map(e => e.equipment).join(', ');
    if (confirm(`Changing to ${newType} Gyro will remove: ${equipmentNames}. Continue?`)) {
      setUnit(updatedUnit);
    }
  } else {
    setUnit(updatedUnit);
  }
};
```

### 2. Fix the Display Logic

The `getLocationSlots` function is building the display array incorrectly. It should:

```javascript
const getLocationSlots = (location: string): any[] => {
  const slotCount = CRITICAL_SLOT_COUNTS[location] || 12;
  const internalSlots = internalStructure[location] || [];
  const equipmentArray = (unit.criticalSlots as any)?.[location] || [];
  
  const displaySlots = [];
  
  // Add internal structure first
  for (let i = 0; i < internalSlots.length; i++) {
    displaySlots.push({
      index: i,
      content: internalSlots[i],
      type: 'internal',
      isEmpty: false
    });
  }
  
  // Add equipment slots
  for (let i = 0; i < equipmentArray.length && displaySlots.length < slotCount; i++) {
    displaySlots.push({
      index: displaySlots.length,
      content: equipmentArray[i] || '- Empty -',
      type: 'equipment',
      isEmpty: !equipmentArray[i]
    });
  }
  
  // Fill remaining with empty
  while (displaySlots.length < slotCount) {
    displaySlots.push({
      index: displaySlots.length,
      content: '- Empty -',
      type: 'empty',
      isEmpty: true
    });
  }
  
  return displaySlots;
};
```

### 3. Update CriticalSlotDropZone Usage

Since CriticalSlotDropZone expects objects, not strings, the grid needs to properly convert the display data:

```javascript
{displaySlots.map((slot, index) => {
  const slotObject = {
    slotIndex: index,
    location: location,
    equipment: slot.type === 'equipment' && !slot.isEmpty ? {
      equipmentId: `eq-${index}`,
      equipmentData: {
        id: `eq-${index}`,
        name: slot.content,
        // ... other equipment properties
      }
    } : null,
    slotType: 'normal',
    isLocked: slot.type === 'internal',
    isEmpty: slot.isEmpty,
    isPartOfMultiSlot: false
  };
  
  return <CriticalSlotDropZone ... />;
})}
```

## Testing the Integration

1. Navigate to `/test-integrated-critical-slots` to see the working example
2. The example shows how changing gyro types properly rebuilds the equipment array
3. Compare this behavior with the main customizer to identify integration gaps

## Summary

The critical slot calculation and rebuild logic is working correctly. The issue is that:
1. The main UI never calls `handleSystemChange` when gyro/engine types change
2. The display logic doesn't properly show internal structure names
3. The grid tries to pass strings to a component expecting objects

The solution requires updating the parent component to properly handle system changes and fixing the display mapping in the grid.
