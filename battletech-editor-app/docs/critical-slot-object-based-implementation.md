# Critical Slot Object-Based Implementation

## Overview

This document describes the complete rework of the critical slot system to use a purely object-based approach with NO STRING STORAGE for equipment or empty slots.

## Core Principles

1. **No Strings** - Equipment is never stored as strings, only as object references
2. **Empty Slots are Null** - Empty slots have `equipment: null`, never "-Empty-" or any other string
3. **Object References** - All equipment data comes from equipment objects with full metadata
4. **Index Tracking** - Every slot knows its index and location
5. **Multi-slot Support** - Proper tracking of equipment that spans multiple slots

## Implementation Components

### 1. Type Definitions (`types/criticalSlots.ts`)

```typescript
// Core slot object - NEVER a string
interface CriticalSlotObject {
  slotIndex: number;
  location: string;
  equipment: EquipmentReference | null;  // null = empty, NEVER a string
  isPartOfMultiSlot: boolean;
  multiSlotGroupId?: string;
  multiSlotIndex?: number;
  slotType: SlotType;
}

// Equipment is always an object reference
interface EquipmentReference {
  equipmentId: string;
  equipmentData: EquipmentObject;
  allocatedSlots: number;
  startSlotIndex: number;
  endSlotIndex: number;
}

// Full equipment object with all metadata
interface EquipmentObject {
  id: string;
  name: string;
  type: EquipmentType;
  category: EquipmentCategory;
  requiredSlots: number;
  weight: number;
  isFixed: boolean;
  isRemovable: boolean;
  techBase: 'Inner Sphere' | 'Clan' | 'Both';
  // ... additional properties
}
```

### 2. Critical Slot Manager (`utils/criticalSlotManagerV2.ts`)

The manager provides object-based operations:

- **Initialize Empty Slots**: Creates slot objects with `equipment: null`
- **Allocate Equipment**: Assigns equipment objects to slots
- **Remove Equipment**: Sets slots back to `equipment: null`
- **Move Equipment**: Transfers equipment objects between locations
- **Validate Allocations**: Ensures consistency of object references

Key features:
- No string manipulation
- Equipment registry tracks all allocated objects
- Multi-slot groups managed with unique IDs
- Legacy format conversion from string-based systems

### 3. React Hook (`hooks/useCriticalSlotManagerV2.tsx`)

Provides React integration:

```typescript
const {
  allocations,      // Object-based slot map
  registry,         // Equipment registry
  allocateEquipment,
  removeEquipment,
  moveEquipment,
  getSlotContent,   // Returns CriticalSlotObject
  isSlotEmpty,      // Checks equipment === null
} = useCriticalSlotManagerV2(unit, systemComponents);
```

### 4. UI Component (`components/editor/criticals/CriticalSlotDropZoneV2.tsx`)

The component:
- Displays slot number for empty slots (no "- Empty -" text)
- Shows equipment name from the equipment object
- Handles drag & drop with object references
- Multi-slot visual representation

## Key Differences from String-Based System

### Old System (String-Based)
```typescript
// BAD - Strings everywhere
slots: string[] = [
  "Engine",
  "-Empty-",
  "Medium Laser",
  "-Empty-"
]

// Checking empty slots
if (slot === "-Empty-" || slot === "- Empty -") { ... }
```

### New System (Object-Based)
```typescript
// GOOD - Objects only
slots: CriticalSlotObject[] = [
  {
    slotIndex: 0,
    location: "Center Torso",
    equipment: {
      equipmentId: "engine-123",
      equipmentData: { name: "Engine", ... }
    },
    ...
  },
  {
    slotIndex: 1,
    location: "Center Torso",
    equipment: null,  // Empty slot
    ...
  }
]

// Checking empty slots
if (slot.equipment === null) { ... }
```

## Migration Strategy

### Converting Legacy Data

The system automatically converts legacy string-based data:

1. String equipment names are matched to equipment objects
2. Empty strings ("-Empty-", etc.) become `null`
3. System components are converted to fixed equipment objects
4. Multi-slot items are properly grouped

### Export Format

When exporting, the system can generate legacy format if needed:
```typescript
exportToUnitData(): {
  location: string;
  slots: string[];  // For compatibility only
}[]
```

## UI Integration

### Empty Slot Display
- Shows just the slot number (1, 2, 3, etc.)
- Clean, minimal appearance
- No "- Empty -" text cluttering the interface

### Equipment Display
- Equipment name from object data
- Weight and other metadata available on hover
- Multi-slot items show continuation markers

### Drag & Drop
- Works with equipment objects, not strings
- Validates based on object properties
- Maintains object references during operations

## Benefits

1. **Type Safety** - No more string comparisons or typos
2. **Rich Data** - Full equipment metadata always available
3. **Performance** - No string parsing or manipulation
4. **Consistency** - Single source of truth for equipment data
5. **Maintainability** - Clear object model, easy to extend

## Usage Example

```typescript
// Initialize system
const slotManager = useCriticalSlotManagerV2(unit, systemComponents);

// Check if slot is empty
const slot = slotManager.getSlotContent('Left Arm', 4);
if (slot.equipment === null) {
  console.log("Slot is empty");
}

// Allocate equipment
const laserEquipment: EquipmentObject = {
  id: 'laser-001',
  name: 'Medium Laser',
  type: EquipmentType.ENERGY,
  category: EquipmentCategory.WEAPON,
  requiredSlots: 1,
  weight: 1,
  isFixed: false,
  isRemovable: true,
  techBase: 'Inner Sphere'
};

slotManager.allocateEquipment('Left Arm', 4, laserEquipment);

// Remove equipment
slotManager.removeEquipment('Left Arm', 4);
// Slot is now { equipment: null } - NOT "-Empty-"
```

## Testing Checklist

- [ ] Empty slots display as just numbers, no "- Empty -" text
- [ ] Equipment names come from object data
- [ ] Drag & drop works with object references
- [ ] Multi-slot items display correctly
- [ ] No string comparisons in the codebase
- [ ] Legacy data converts properly
- [ ] Export format maintains compatibility

## Future Enhancements

1. **Equipment Templates** - Pre-defined equipment configurations
2. **Smart Allocation** - AI-assisted equipment placement
3. **Validation Rules** - Complex equipment restrictions
4. **Undo/Redo** - Full history tracking with object snapshots
5. **Performance Optimization** - Virtual scrolling for large slot lists
