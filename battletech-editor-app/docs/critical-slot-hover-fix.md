# Critical Slot Hover Fix

## The Problem
The drag and drop system isn't providing visual feedback when hovering over slots because:
1. The `canDrop` function is too restrictive
2. The `canAccept` prop function adds additional validation that prevents hover feedback
3. Visual feedback is tied to `canDrop` result instead of being shown always

## Quick Fix Solution

### Update CriticalSlotDropZone.tsx

Replace the current `canDrop` function with a simplified version that only checks basic slot availability:

```typescript
canDrop: (item: DraggedEquipment) => {
  // Don't allow drops on disabled slots
  if (disabled) return false;
  
  // Allow dropping back to the same slot (canceling the drag)
  if (item.isFromCriticalSlot && 
      item.sourceLocation === location && 
      item.sourceSlotIndex === slotIndex) {
    return true;
  }
  
  // For now, just check if the slot is empty
  // Move complex validation to the drop handler
  return !hasEquipment;
}
```

### Update the hover handler to always provide feedback:

```typescript
hover: (item: DraggedEquipment, monitor) => {
  // Only process if directly over this slot
  if (!monitor.isOver({ shallow: true })) {
    if (onHoverChange) {
      onHoverChange(false, null);
    }
    return;
  }
  
  // Always notify about hover, regardless of validity
  if (onHoverChange) {
    const equipmentObj: EquipmentObject = {
      id: item.equipmentId,
      name: item.name,
      type: item.type as any,
      category: item.category as any,
      requiredSlots: item.criticalSlots,
      weight: item.weight || 0,
      isFixed: false,
      isRemovable: true,
      techBase: (item.techBase || 'Inner Sphere') as 'Inner Sphere' | 'Clan' | 'Both'
    };
    
    onHoverChange(true, equipmentObj);
  }
}
```

### Update the drop handler to do full validation:

```typescript
drop: (item: DraggedEquipment) => {
  const equipmentObj: EquipmentObject = {
    id: item.equipmentId,
    name: item.name,
    type: item.type as any,
    category: item.category as any,
    requiredSlots: item.criticalSlots,
    weight: item.weight || 0,
    isFixed: false,
    isRemovable: true,
    techBase: (item.techBase || 'Inner Sphere') as 'Inner Sphere' | 'Clan' | 'Both',
    damage: item.damage,
    heat: item.heat
  };
  
  // Check if canAccept allows this drop
  if (!canAccept(equipmentObj)) {
    // Could show an error message here
    console.warn(`Cannot place ${item.name} in ${location}`);
    return;
  }
  
  // Check multi-slot requirements
  if (item.criticalSlots > 1) {
    // Validate we have enough consecutive empty slots
    for (let i = 0; i < item.criticalSlots; i++) {
      const checkSlot = criticalSlots[slotIndex + i];
      if (!checkSlot || checkSlot.equipment !== null) {
        console.warn(`Not enough consecutive empty slots for ${item.name}`);
        return;
      }
    }
  }
  
  // Proceed with the drop
  if (item.isFromCriticalSlot && item.sourceLocation && item.sourceSlotIndex !== undefined && onMove) {
    onMove(item.sourceLocation, item.sourceSlotIndex, location, slotIndex);
  } else {
    onDrop(equipmentObj, location, slotIndex);
  }
}
```

## Alternative: Show Visual Feedback Regardless of Validity

Another approach is to always show visual feedback but use different colors:
- Green border = valid drop location
- Yellow border = hover but restrictions apply  
- Red border = invalid drop location

Update the CSS class logic:

```typescript
const getSlotClassName = () => {
  const classes = [styles.slot];
  const colorClasses = getEquipmentColors();
  
  // ... existing logic ...
  
  if (isOver) {
    // Always show hover state
    classes.push(styles.hovering);
    
    if (canDrop) {
      classes.push(styles.validDrop);
    } else if (!hasEquipment && !disabled) {
      // Empty slot but validation failed - show warning
      classes.push(styles.restrictedDrop);
    } else {
      // Occupied or disabled
      classes.push(styles.invalidDrop);
    }
  }
  
  return classes.join(' ');
};
```

Add the new CSS class:

```css
.restrictedDrop {
  background: #eab308 !important;
  border-color: #facc15 !important;
  box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.5) !important;
  cursor: help;
}
```

## Testing the Fix

1. Start the development server
2. Navigate to the criticals tab
3. Drag equipment from the equipment list
4. Hover over empty slots - should see green borders
5. Hover over occupied slots - should see red borders
6. Try dropping - complex validation happens here

## Benefits of This Approach

1. **Better User Experience**: Users get immediate visual feedback
2. **Clearer Intent**: Visual feedback shows what's possible vs what's allowed
3. **Easier Debugging**: Can see which slots are being considered
4. **Performance**: Simple hover checks are faster than complex validation

## Next Steps

1. Implement the quick fix first
2. Test with various equipment types
3. Add tooltips explaining why certain drops are restricted
4. Consider adding preview highlighting for multi-slot equipment
