# Critical Slots Object Enforcement Documentation

## Overview
Critical slots are now enforced to be strongly typed objects throughout the application. String-based critical slots are no longer allowed.

## Type Definition

### CriticalSlotItem (in types/index.ts)
```typescript
export interface CriticalSlotItem {
  index: number;
  name: string; // Equipment name or system component name
  type: 'empty' | 'system' | 'equipment' | 'heat-sink' | 'endo-steel' | 'ferro-fibrous';
  isFixed: boolean;
  isConditionallyRemovable?: boolean; // Can be removed via context menu
  isManuallyPlaced?: boolean;  // User placed vs auto-allocated
  equipmentId?: string; // Reference to equipment item
  linkedSlots?: number[]; // For multi-slot items
}
```

### CriticalSlot (in types/systemComponents.ts)
```typescript
export interface CriticalSlot {
  index: number;
  name: string;               // Equipment name or system component name (NOT NULL - use "-Empty-" for empty)
  type: SlotContentType;      // Renamed from contentType for consistency
  isFixed: boolean;           // Cannot be manually removed
  isConditionallyRemovable?: boolean; // Can be removed via context menu
  isManuallyPlaced: boolean;  // User placed vs auto-allocated
  linkedSlots?: number[];     // For multi-slot items
  equipmentId?: string;       // Reference to equipment item
  contextMenuOptions?: ContextMenuOption[]; // Right-click options
}
```

## Key Changes Made

### 1. Type System Enforcement
- `CriticalSlotLocation.slots` is now typed as `CriticalSlotItem[]` (never `string[]`)
- All critical slots must be objects with required properties
- Empty slots use `name: "-Empty-"` and `type: "empty"`

### 2. Property Name Changes
- `content` → `name` (the equipment or component name)
- `contentType` → `type` (the slot type enumeration)

### 3. Migration Support
The `componentValidation.ts` file includes migration logic to convert:
- String arrays like `["Life Support", "Sensors", "-Empty-"]`
- Old object format with `content` property
- To the new standardized object format

### 4. Empty Slot Representation
Empty slots are represented as:
```typescript
{
  index: 0,
  name: "-Empty-",
  type: "empty",
  isFixed: false,
  isManuallyPlaced: false
}
```

## Enforcement Points

### 1. Type Definitions
- `UnitData.criticals?: CriticalSlotLocation[]` enforces object-based slots
- `EditableUnit.criticalAllocations?: CriticalAllocationMap` uses `CriticalSlot[]`

### 2. Component Rules (componentRules.ts)
- `initializeCriticalSlots()` creates properly typed objects
- All slot manipulation functions use the object format

### 3. Migration (componentValidation.ts)
- `migrateUnitToSystemComponents()` converts legacy formats
- Handles both string arrays and old object formats
- Ensures all slots conform to the new type

### 4. UI Components
- All components consuming critical slots expect objects
- Drag-and-drop operations work with typed objects
- Hover states and interactions use object properties

## Benefits

1. **Type Safety**: TypeScript compiler enforces object structure
2. **Consistency**: Single source of truth for slot data
3. **Extensibility**: Easy to add new properties without breaking existing code
4. **Better Tooling**: IDEs can provide better autocomplete and error detection
5. **Runtime Safety**: Prevents string/object type confusion

## Migration Path

For existing data:
1. String arrays are automatically converted during unit loading
2. Old object formats are mapped to new properties
3. Empty indicators (`"-Empty-"`, `"- Empty -"`, `""`, `null`) are normalized
4. All conversions preserve existing data while conforming to new types

## Example Usage

### Creating a new empty location:
```typescript
const slots: CriticalSlotItem[] = Array(12).fill(null).map((_, index) => ({
  index,
  name: "-Empty-",
  type: "empty",
  isFixed: false,
  isManuallyPlaced: false
}));
```

### Creating a system component slot:
```typescript
const engineSlot: CriticalSlotItem = {
  index: 0,
  name: "Engine",
  type: "system",
  isFixed: true,
  isManuallyPlaced: false
};
```

### Creating an equipment slot:
```typescript
const weaponSlot: CriticalSlotItem = {
  index: 4,
  name: "Medium Laser",
  type: "equipment",
  isFixed: false,
  isManuallyPlaced: true,
  equipmentId: "ml-001"
};
```

## Validation

The type system ensures:
- All slots have required properties (`index`, `name`, `type`, `isFixed`)
- `type` must be one of the allowed values
- `name` is always a string (use "-Empty-" for empty slots)
- No string arrays can be assigned to slot properties

This enforcement happens at compile time, preventing runtime errors and ensuring data consistency throughout the application.
