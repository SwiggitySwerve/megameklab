# MegaMekLab Assign Criticals Tab Complete Analysis

## Overview
This document provides a comprehensive analysis of the MegaMekLab Java implementation of the Assign Criticals tab and a detailed plan for implementing it in our React application.

## MegaMekLab Criticals Tab Architecture

### 1. Main Structure (BMBuildTab.java)
The Assign Criticals tab is divided into two main sections:

```
+----------------------------------------------------------+
|                  Assign Criticals Tab                     |
+----------------------------------------------------------+
| +------------------------+ | +------------------------+ |
| | Control Panel          | | | Unallocated Equipment  | |
| | [x] Auto Fill          | | |                        | |
| | [x] Auto Compact       | | | - ER PPC (5)           | |
| | [x] Auto Sort          | | | - Medium Laser (1)     | |
| | [Fill][Compact][Sort]  | | | - Heat Sink (3)        | |
| | [Reset]                | | | - Endo Steel (14)      | |
| +------------------------+ | +------------------------+ |
| | Critical Slot Diagram  | | |                        | |
| |                        | | |                        | |
| |    HD      LA     RA   | | |                        | |
| |    []      []     []   | | |                        | |
| |                        | | |                        | |
| | LT    CT    RT         | | |                        | |
| | []    []    []         | | |                        | |
| |                        | | |                        | |
| | LL    CL    RL         | | |                        | |
| | []    []    []         | | |                        | |
| +------------------------+ | +------------------------+ |
+----------------------------------------------------------+
```

### 2. Control Panel Features

#### Toggle Options
- **Auto Fill Unhittables**: Automatically places "unhittable" equipment (like Endo Steel)
- **Auto Compact**: Consolidates equipment to minimize empty slots
- **Auto Sort**: Sorts equipment by type and size

#### Action Buttons
- **Fill**: Attempts to allocate all unallocated equipment
- **Compact**: Consolidates equipment in each location
- **Sort**: Sorts equipment within locations
- **Reset**: Removes all equipment from critical slots

### 3. BMCriticalView Component

#### Layout System
```java
// Mech-style layout with anatomical positioning
Box mainPanel = Box.createHorizontalBox();
Box laAlignPanel = Box.createVerticalBox();  // Left Arm
Box leftAlignPanel = Box.createVerticalBox(); // LT + LL
Box centerAlignPanel = Box.createVerticalBox(); // HD + CT + CL
Box rightAlignPanel = Box.createVerticalBox(); // RT + RL
Box raAlignPanel = Box.createVerticalBox();  // Right Arm
```

#### Critical Slot Lists
Each location has a `BAASBMDropTargetCriticalList`:
- Displays equipment in slots
- Accepts drag & drop
- Shows system components (actuators, engines, etc.)
- Handles multi-slot equipment
- Shows rear-mounted (R) and turret-mounted (T) indicators

### 4. BMBuildView Component

The unallocated equipment panel shows:
- Equipment name with count
- Drag source for allocation
- Color coding by equipment type
- Filtering of invalid equipment

### 5. Drag & Drop System

#### Features
- Visual feedback during drag
- Location validation
- Multi-slot equipment handling
- Automatic spreading for certain equipment
- Invalid location darkening

## React Implementation Plan

### Phase 1: Core Critical Allocation

#### 1.1 Critical Slot Diagram
```typescript
interface CriticalSlotDiagramProps {
  unit: EditableUnit;
  onSlotClick?: (location: string, slotIndex: number) => void;
  onEquipmentDrop: (equipmentId: string, location: string, slotIndex: number) => void;
  highlightedSlots?: { location: string; slots: number[] }[];
  layout?: 'standard' | 'compact' | 'visual';
}
```

Features:
- Anatomical mech layout
- Drag & drop targets
- Multi-slot visualization
- System component display
- CASE indicators

#### 1.2 Location Slot List
```typescript
interface LocationSlotListProps {
  location: string;
  slots: CriticalSlot[];
  maxSlots: number;
  onDrop: (equipmentId: string, slotIndex: number) => void;
  canAccept: (equipment: FullEquipment) => boolean;
  darkened?: boolean;
  showEmpty?: boolean;
}
```

Features:
- Individual slot management
- Equipment spanning visualization
- Drag hover states
- Context menus
- Keyboard navigation

#### 1.3 Unallocated Equipment Panel
```typescript
interface UnallocatedEquipmentProps {
  equipment: UnallocatedEquipment[];
  onDragStart: (equipmentId: string) => void;
  onAllocate: (equipmentId: string, location?: string) => void;
  sortBy?: 'name' | 'size' | 'type' | 'weight';
  groupBy?: 'type' | 'category' | 'none';
}
```

### Phase 2: Auto-Allocation Features

#### 2.1 Auto-Fill Strategy
```typescript
interface AutoFillStrategy {
  fillUnhittables(unit: EditableUnit): AllocationResult[];
  fillAll(unit: EditableUnit): AllocationResult[];
  getUnhittableEquipment(unit: EditableUnit): FullEquipment[];
}

// Implementation for different equipment types
class EndoSteelFillStrategy implements AutoFillStrategy { }
class FerroFibrousFillStrategy implements AutoFillStrategy { }
class EngineHeatSinkFillStrategy implements AutoFillStrategy { }
```

#### 2.2 Compaction Algorithm
```typescript
interface CompactionStrategy {
  compact(location: string, slots: CriticalSlot[]): CriticalSlot[];
  canCompact(equipment: FullEquipment): boolean;
  preserveGroups?: boolean;
}
```

#### 2.3 Sorting Algorithm
```typescript
interface SortingStrategy {
  sort(location: string, slots: CriticalSlot[]): CriticalSlot[];
  getSortPriority(equipment: FullEquipment): number;
  groupSimilar?: boolean;
}

// Sort priorities
const SORT_PRIORITIES = {
  ENERGY_WEAPON: 1,
  BALLISTIC_WEAPON: 2,
  MISSILE_WEAPON: 3,
  AMMO: 4,
  EQUIPMENT: 5,
  HEAT_SINK: 6,
  STRUCTURE: 7
};
```

### Phase 3: Enhanced Features

#### 3.1 Visual Enhancements
- 3D mech visualization
- Equipment icons in slots
- Color coding by equipment type
- Animation for drag & drop
- Slot highlighting for valid drops

#### 3.2 Smart Allocation
```typescript
interface SmartAllocationOptions {
  balanceWeight?: boolean;
  groupWeapons?: boolean;
  protectAmmo?: boolean;
  optimizeHeat?: boolean;
  preserveSymmetry?: boolean;
}
```

#### 3.3 Validation & Warnings
```typescript
interface CriticalValidation {
  checkLocationValid(equipment: FullEquipment, location: string): boolean;
  checkSlotsAvailable(equipment: FullEquipment, location: string): boolean;
  getLocationRestrictions(equipment: FullEquipment): string[];
  getWarnings(allocation: AllocationResult): ValidationWarning[];
}
```

## Component Architecture

```
AssignCriticalsTab
├── ControlPanel
│   ├── AutoOptions
│   │   ├── AutoFillToggle
│   │   ├── AutoCompactToggle
│   │   └── AutoSortToggle
│   └── ActionButtons
│       ├── FillButton
│       ├── CompactButton
│       ├── SortButton
│       └── ResetButton
├── CriticalSlotDiagram
│   ├── LocationLayout
│   │   ├── HeadLocation
│   │   ├── TorsoLocations
│   │   ├── ArmLocations
│   │   └── LegLocations
│   └── LocationSlotList (per location)
│       ├── SlotItem
│       └── EmptySlot
└── UnallocatedPanel
    ├── EquipmentFilter
    ├── EquipmentList
    │   └── DraggableEquipment
    └── QuickActions
```

## Drag & Drop Implementation

### 1. Drag Source (Unallocated Equipment)
```typescript
interface DragData {
  equipmentId: string;
  equipment: FullEquipment;
  sourceType: 'unallocated' | 'critical';
  sourceLocation?: string;
  sourceSlot?: number;
}
```

### 2. Drop Target (Critical Slots)
```typescript
interface DropHandler {
  canDrop(dragData: DragData, location: string, slot: number): boolean;
  onDrop(dragData: DragData, location: string, slot: number): void;
  getDropEffect(dragData: DragData): 'move' | 'copy' | 'none';
  getValidSlots(dragData: DragData, location: string): number[];
}
```

### 3. Visual Feedback
- Drag preview showing equipment name
- Valid drop zones highlighted in green
- Invalid zones darkened or red
- Multi-slot preview for large equipment
- Slot occupation preview

## Key Algorithms

### 1. Equipment Spreading
For equipment that must be spread across locations (e.g., Endo Steel):
```typescript
function spreadEquipment(
  equipment: FullEquipment,
  unit: EditableUnit
): AllocationResult[] {
  const locations = getValidLocations(equipment, unit);
  const slotsNeeded = equipment.criticals;
  const allocations: AllocationResult[] = [];
  
  // Distribute evenly across valid locations
  const slotsPerLocation = Math.ceil(slotsNeeded / locations.length);
  
  for (const location of locations) {
    const slots = findEmptySlots(location, slotsPerLocation);
    allocations.push({ location, slots, equipment });
  }
  
  return allocations;
}
```

### 2. Compaction
```typescript
function compactLocation(location: string, slots: CriticalSlot[]): CriticalSlot[] {
  const equipment = slots.filter(s => s.equipment !== null);
  const compacted = new Array(slots.length).fill(null);
  
  let index = 0;
  for (const item of equipment) {
    // Place multi-slot equipment
    if (item.equipment && item.isFirstSlot) {
      for (let i = 0; i < item.equipment.criticals; i++) {
        compacted[index + i] = item;
      }
      index += item.equipment.criticals;
    }
  }
  
  return compacted;
}
```

## Key Differences from MegaMekLab

### Improvements
1. **Modern DnD**: React DnD with touch support
2. **Visual Feedback**: Better drag previews and drop zones
3. **Smart Suggestions**: AI-powered allocation recommendations
4. **Undo/Redo**: Full history of allocations
5. **Batch Operations**: Allocate multiple items at once

### New Features
1. **Templates**: Save/load allocation patterns
2. **Optimization**: Algorithm to minimize vulnerability
3. **Visual Mode**: 3D mech view with equipment
4. **Quick Slots**: Favorite allocation patterns
5. **Search**: Find equipment in slots quickly

## Testing Strategy

### Unit Tests
- Allocation algorithms
- Validation rules
- Compaction/sorting logic
- Drag & drop calculations

### Integration Tests
- Complete allocation flow
- Auto-allocation features
- Multi-equipment operations
- Edge cases (full locations, etc.)

### E2E Tests
- Drag and drop operations
- Keyboard navigation
- Auto-allocation scenarios
- Save/load functionality

This comprehensive analysis provides the foundation for implementing a modern critical slot allocation system that improves upon MegaMekLab's functionality while maintaining full compatibility.
