# Critical Slot System Analysis

## Overview

The critical slot system is designed to allow drag-and-drop placement of equipment into mech critical slots. The system uses object-based data structures and React DnD for drag-and-drop functionality.

## Core Components

### 1. CriticalSlotDropZone.tsx
The individual slot component that handles both dragging and dropping.

**Key Features:**
- **Drag Source**: Occupied slots can be dragged to move equipment
- **Drop Target**: Empty slots accept equipment drops
- **Multi-slot Support**: Equipment requiring multiple slots shows visual continuity
- **Color Coding**: Uses `getEquipmentColorClasses()` for visual distinction
- **Hover States**: Shows valid/invalid drop states

**Drop Validation Logic:**
```typescript
canDrop: (item: DraggedEquipmentV2) => {
  if (disabled) return false;
  
  // Allow dropping back to same slot
  if (item.isFromCriticalSlot && 
      item.sourceLocation === location && 
      item.sourceSlotIndex === slotIndex) {
    return true;
  }
  
  // Check if slot is empty
  if (hasEquipment) return false;
  
  // Check multi-slot requirements
  const requiredSlots = item.criticalSlots;
  if (requiredSlots > 1) {
    // Validate consecutive empty slots
  }
  
  return canAccept(equipmentObj);
}
```

### 2. CriticalsTabIntegrated.tsx
The main tab component that manages the overall critical slot state.

**Key Responsibilities:**
- Converts between parent data model (string-based) and object-based slots
- Manages equipment allocations and tracks multi-slot placements
- Handles system component changes (engine, gyro type changes)
- Syncs state changes back to parent data model

**Current Issues:**
- `canAccept()` always returns true - no real validation
- Complex state synchronization between object model and parent string model
- Batch update system to prevent circular updates

### 3. DraggableEquipmentItem.tsx
The draggable equipment component for unallocated items.

**Features:**
- Uses `DraggedEquipmentV2` type for drag data
- Color coding based on equipment type
- Shows equipment stats (weight, slots, damage, heat)

## State Management Flow

### 1. Initialization
1. Component reads `criticalAllocationsFromParent` (string-based)
2. Converts to object-based `CriticalSlotObject` format
3. Tracks multi-slot equipment with `multiSlotGroupId`
4. Maintains `equipmentAllocations` to track which equipment is placed where

### 2. Drop Handling
1. User drags equipment over slot
2. `canDrop` validates if placement is valid
3. `hover` handler triggers visual feedback
4. `drop` handler places equipment and updates state
5. `batchUpdateToParent()` syncs changes back

### 3. Visual States

#### Empty Slot States:
- **Normal**: Dashed border, semi-transparent
- **Hover (Valid)**: Green background (#16a34a), green border, scale effect
- **Hover (Invalid)**: Red background (#dc2626), red border, cursor not-allowed
- **Multi-slot Preview**: Blue background (#2563eb) for all affected slots

#### Occupied Slot States:
- **Normal**: Solid border, color based on equipment type
- **System Component**: Cannot be dragged, darker on hover
- **Draggable**: Shows grab cursor, lifts on hover
- **Dragging**: 50% opacity, grabbing cursor

## Identified Issues

### 1. Validation Logic Too Permissive
The `canAccept()` function always returns true:
```typescript
const canAccept = (equipment: EquipmentObject) => {
  // Basic validation - in real app would check more constraints
  return true;
};
```

This should validate:
- Location restrictions (e.g., weapons in arms/torsos only)
- Weight limits
- Tech level compatibility
- Special equipment requirements

### 2. Hover State Management
The hover state system is complex with multiple overlapping concerns:
- Individual slot hover
- Multi-slot preview
- Drag-over validation
- Color coding

The `handleHoverChange` and `getMultiSlotPreview` logic may not be properly coordinating.

### 3. Multi-slot Equipment Handling
Multi-slot equipment uses:
- `multiSlotGroupId` to link slots
- `multiSlotIndex` to track position
- `isPartOfMultiSlot` flag

But the visual feedback for multi-slot drops may not be clear enough.

## Expected Behavior

### For Empty Slots:
1. **No Hover**: Show slot number, dashed border, semi-transparent
2. **Valid Hover**: Green highlight, show equipment preview
3. **Invalid Hover**: Red highlight, not-allowed cursor
4. **Multi-slot**: Highlight all required consecutive slots

### For Occupied Slots:
1. **Fixed Equipment**: No drag handle, darker on hover
2. **Removable Equipment**: Drag handle visible, lift on hover
3. **Multi-slot**: Visual continuity with connected borders

### Drag & Drop Flow:
1. **Drag Start**: Source item becomes semi-transparent
2. **Drag Over Empty**: Show green/red based on validation
3. **Drag Over Occupied**: Always show red (invalid)
4. **Drop**: Place equipment, update allocations, sync to parent

## Recommendations

### 1. Implement Proper Validation
```typescript
const canAccept = (equipment: EquipmentObject, location: string): boolean => {
  // Check location restrictions
  if (equipment.category === EquipmentCategory.WEAPON) {
    if (location === MECH_LOCATIONS.HEAD || 
        location === MECH_LOCATIONS.LEFT_LEG ||
        location === MECH_LOCATIONS.RIGHT_LEG) {
      return false; // No weapons in head or legs
    }
  }
  
  // Check weight limits
  // Check tech compatibility
  // etc.
  
  return true;
};
```

### 2. Simplify Hover State
- Use a single source of truth for hover state
- Ensure CSS classes properly override each other
- Add clearer visual feedback for multi-slot preview

### 3. Improve Error Messages
Instead of generic alerts, show contextual error messages:
- "Weapons cannot be placed in legs"
- "Not enough consecutive slots available"
- "This location is full"

### 4. Add Visual Indicators
- Show slot requirements on equipment items
- Add location capacity indicators
- Show drop preview more clearly

## CSS Class Hierarchy

The CSS classes should be applied in this order for proper precedence:
1. Base: `.slot`
2. State: `.empty` or `.occupied`
3. Type: `.system` (for fixed components)
4. Interaction: `.validDrop`, `.invalidDrop`, `.hovered`
5. Multi-slot: `.multiSlot`, `.multiSlotStart`, etc.

Using `!important` should be avoided where possible by ensuring proper specificity.
