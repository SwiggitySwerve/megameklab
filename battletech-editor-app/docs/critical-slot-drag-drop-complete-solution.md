# Critical Slot Drag & Drop Complete Solution

## Problem Summary

The critical slot drag and drop system has several interconnected issues:

1. **Hover feedback not working** - Users can't see where they can drop equipment
2. **canDrop validation too restrictive** - Prevents visual feedback from showing
3. **Equipment items not draggable** - DraggableEquipmentItem might not be working properly
4. **Type conversion issues** - Converting between DraggedEquipment and EquipmentObject interfaces

## Root Causes

### 1. Simplified canDrop Logic
The canDrop function was simplified to only check if a slot is empty, but this doesn't account for:
- Location restrictions (canAccept function)
- Multi-slot equipment validation
- Equipment type compatibility

### 2. Missing Equipment Data
DraggableEquipmentItem expects FullEquipment type but might be receiving incomplete data:
- Missing tech_base property
- Missing space property for critical slots
- Type mismatches

### 3. CSS Class Priority
The hover styles might be overridden by other styles:
- `.validDrop` and `.invalidDrop` need higher specificity
- Border and background styles might conflict

## Complete Solution Implementation

### 1. Enhanced CriticalSlotDropZone

```typescript
// CriticalSlotDropZone.tsx modifications
const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
  accept: 'equipment',
  canDrop: (item: DraggedEquipment) => {
    if (disabled) return false;
    
    // Allow dropping back to same slot
    if (item.isFromCriticalSlot && 
        item.sourceLocation === location && 
        item.sourceSlotIndex === slotIndex) {
      return true;
    }
    
    // Basic checks for visual feedback
    if (hasEquipment) return false;
    
    // Check multi-slot availability
    if (item.criticalSlots > 1) {
      if (slotIndex + item.criticalSlots > criticalSlots.length) {
        return false;
      }
      for (let i = 0; i < item.criticalSlots; i++) {
        if (criticalSlots[slotIndex + i]?.equipment !== null) {
          return false;
        }
      }
    }
    
    return true; // Let drop handler do complex validation
  },
  // ... rest of the configuration
});
```

### 2. Fixed Hover State Management

```typescript
// Add state to track hover
const [isHovered, setIsHovered] = useState(false);

// Update hover handler
hover: (item: DraggedEquipment, monitor) => {
  const hovering = monitor.isOver({ shallow: true });
  
  if (hovering !== isHovered) {
    setIsHovered(hovering);
    
    if (onHoverChange) {
      if (hovering) {
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
      } else {
        onHoverChange(false, null);
      }
    }
  }
},
```

### 3. Enhanced CSS for Better Feedback

```css
/* CriticalSlotDropZone.module.css additions */

/* Always show hover state when dragging over */
.slot:hover.empty {
  border-color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
}

/* Valid drop target - high priority */
.slot.validDrop {
  background: #16a34a !important;
  border-color: #22c55e !important;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.5) !important;
  transform: scale(1.02);
  z-index: 10;
}

/* Invalid drop target - high priority */
.slot.invalidDrop {
  background: #dc2626 !important;
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5) !important;
  cursor: not-allowed;
  z-index: 10;
}

/* Restricted drop (empty but can't accept) */
.slot.restrictedDrop {
  background: #eab308 !important;
  border-color: #facc15 !important;
  box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.5) !important;
  cursor: help;
  z-index: 10;
}
```

### 4. Update Class Name Logic

```typescript
const getSlotClassName = () => {
  const classes = [styles.slot];
  const colorClasses = getEquipmentColors();
  
  // Base classes
  if (hasEquipment) {
    classes.push(styles.occupied);
    classes.push(colorClasses.bg, colorClasses.border, colorClasses.text);
  } else {
    classes.push(styles.empty);
    classes.push(colorClasses.bg, colorClasses.border, colorClasses.text);
  }
  
  // Drag/drop state classes - MUST come after base classes
  if (isOver) {
    if (canDrop) {
      classes.push(styles.validDrop);
    } else if (!hasEquipment && !disabled) {
      // Empty but restricted
      classes.push(styles.restrictedDrop);
    } else {
      classes.push(styles.invalidDrop);
    }
  } else if (isHovered && !hasEquipment) {
    // Show subtle hover when not dragging
    classes.push(styles.hoverable);
  }
  
  // Other state classes
  if (isHoveredMultiSlot || isPartOfDropPreview) {
    classes.push(styles.hovered);
  }
  
  if (disabled) {
    classes.push(styles.disabled);
  }
  
  return classes.join(' ');
};
```

### 5. Fix Equipment Data Structure

Ensure DraggableEquipmentItem receives proper data:

```typescript
// In the parent component providing equipment
const equipment: FullEquipment = {
  id: 'heat-sink-1',
  name: 'Heat Sink',
  type: 'Heat Management',
  tech_base: 'Inner Sphere', // Required
  weight: 1.0,
  space: 1, // Required for critical slots
  data: {
    slots: 1
  }
  // ... other properties
};
```

## Testing Strategy

1. **Test basic hover feedback**
   - Drag equipment over empty slots
   - Should see green highlight on valid drops
   - Should see red highlight on invalid drops

2. **Test multi-slot equipment**
   - Drag equipment requiring multiple slots
   - Should highlight all required slots
   - Should prevent drop if not enough consecutive slots

3. **Test location restrictions**
   - Try dropping equipment in restricted locations
   - Should show yellow/warning highlight
   - Drop should fail with console message

4. **Test move operations**
   - Drag equipment from one slot to another
   - Should work smoothly with proper feedback

## Implementation Checklist

- [x] Simplify canDrop logic
- [x] Add debug logging
- [ ] Fix hover state management
- [ ] Update CSS with higher specificity
- [ ] Add restrictedDrop visual state
- [ ] Ensure equipment data structure is complete
- [ ] Test all drag and drop scenarios
- [ ] Remove debug logging after verification

## Next Steps

1. Implement the complete solution above
2. Test thoroughly with different equipment types
3. Add user-friendly error messages (toasts/modals)
4. Consider adding tooltips explaining why drops are invalid
5. Optimize performance for large equipment lists
