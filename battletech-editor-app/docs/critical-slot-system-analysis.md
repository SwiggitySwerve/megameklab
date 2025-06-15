# Critical Slot System Analysis

## Current Issues

### 1. Hover Feedback Not Working
The hover system has several issues:

1. **canDrop is too restrictive**: The `canDrop` function checks many conditions that prevent valid drops from showing as valid
2. **Type conversion issues**: Converting between `DraggedEquipment` and `EquipmentObject` may cause validation failures
3. **Multi-slot validation**: The logic for checking consecutive empty slots is complex and may fail

### 2. Specific Problems in CriticalSlotDropZone.tsx

```typescript
canDrop: (item: DraggedEquipment) => {
  // Always return false if disabled
  if (disabled) return false;
  
  // Check if this is the source slot of the current drag
  if (item.isFromCriticalSlot && 
      item.sourceLocation === location && 
      item.sourceSlotIndex === slotIndex) {
    return true; // Allow dropping back to the same slot
  }
  
  // Check if slot is empty
  if (hasEquipment) return false;
  
  // Check if we have enough consecutive empty slots for multi-slot equipment
  const requiredSlots = item.criticalSlots;
  if (requiredSlots > 1) {
    // Complex validation logic here...
  }
  
  // Convert DraggedEquipment to EquipmentObject if needed
  const equipmentObj: EquipmentObject = {
    // Type conversion here...
  };
  
  return canAccept(equipmentObj);
}
```

### Issues:
1. The `canAccept` function is called at the end, but we don't know what it's checking
2. Type conversions between interfaces may fail
3. Multi-slot validation is complex and error-prone

### 3. CSS Hover States
The CSS has proper styles defined:
- `.validDrop` - Green background for valid drops
- `.invalidDrop` - Red background for invalid drops  
- `.hovered` - Blue background for multi-slot preview

But these aren't being applied correctly because `canDrop` is returning false.

## Root Cause
The main issue is that the drag and drop system is trying to be too "smart" about validation, which prevents the UI from giving proper feedback to users about where they can drop items.

## Solution

### 1. Simplify canDrop Logic
Make `canDrop` only check basic conditions:
- Is the slot disabled?
- Is the slot already occupied?
- Do we have enough consecutive slots?

Move complex validation to the `drop` handler where we can show error messages.

### 2. Separate Visual Feedback from Drop Validation
- Show visual feedback (green/red borders) based on simple checks
- Do full validation only when actually dropping
- Use the `hover` handler to show multi-slot previews

### 3. Fix Type Conversions
Ensure consistent type usage between `DraggedEquipment` and `EquipmentObject` to prevent validation failures.

## Recommended Changes

### 1. Simplify canDrop
```typescript
canDrop: (item: DraggedEquipment) => {
  if (disabled) return false;
  
  // Allow dropping back to same slot
  if (item.isFromCriticalSlot && 
      item.sourceLocation === location && 
      item.sourceSlotIndex === slotIndex) {
    return true;
  }
  
  // Check if slot is empty
  if (hasEquipment) return false;
  
  // Basic multi-slot check
  if (item.criticalSlots > 1) {
    if (slotIndex + item.criticalSlots > criticalSlots.length) {
      return false;
    }
    // Check consecutive empty slots
    for (let i = 0; i < item.criticalSlots; i++) {
      if (criticalSlots[slotIndex + i]?.equipment !== null) {
        return false;
      }
    }
  }
  
  return true; // Let drop handler do complex validation
}
```

### 2. Enhanced Hover Handler
```typescript
hover: (item: DraggedEquipment, monitor) => {
  if (!monitor.isOver({ shallow: true })) return;
  
  // Always show hover feedback
  if (onHoverChange) {
    const equipmentObj: EquipmentObject = {
      // ... conversion
    };
    onHoverChange(true, equipmentObj);
  }
}
```

### 3. Move Complex Validation to Drop
Do location restrictions, tech base checks, etc. in the `drop` handler where we can show proper error messages.

## Implementation Priority

1. **Fix canDrop logic** - Simplify to only check basic slot availability
2. **Ensure hover feedback works** - Make sure CSS classes are applied correctly
3. **Add error messages** - Show why a drop failed in the drop handler
4. **Test multi-slot equipment** - Ensure preview highlighting works

## Testing Scenarios

1. Drag single-slot equipment over empty slots - should show green
2. Drag single-slot equipment over occupied slots - should show red
3. Drag multi-slot equipment - should highlight all required slots
4. Drag equipment from one slot to another - should work smoothly
5. Try to drop invalid equipment - should show error message

## Expected Behavior

1. **Empty slots**: Show green border when hovering with compatible equipment
2. **Occupied slots**: Show red border when hovering (unless moving same item)
3. **Multi-slot preview**: Highlight all slots that would be occupied
4. **Invalid drops**: Still show visual feedback, but prevent drop and show error
