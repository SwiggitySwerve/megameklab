# Enhanced Critical Slot Data Model Implementation Plan

## Overview

This document outlines the implementation plan for an enhanced critical slot data model that provides better tracking of slot allocation, instant addition/removal capabilities, and improved UI synchronization.

## Current State

### Problems with Current Implementation
1. Empty slots are represented as "-Empty-" strings in the data model
2. Slot counting includes unallocated equipment
3. Legacy data format conversion issues
4. No centralized slot management logic
5. Drag and drop state is not properly tracked during drag operations

### Current Data Structure
```typescript
// Legacy format in unit.data.criticals
{
  location: string;
  slots: string[]; // Array of equipment names or "-Empty-"
}[]

// New format in unit.criticalAllocations
{
  [location: string]: CriticalSlot[]
}
```

## Enhanced Data Model Design

### Core Data Structures

```typescript
// Enhanced Critical Slot
interface EnhancedCriticalSlot {
  slotIndex: number;
  locationName: string;
  content: string | null; // null for empty slots
  isFixed: boolean; // For system components
  contentType: 'system' | 'equipment' | 'empty';
  equipmentId?: string; // Reference to equipment in weapons_and_equipment
  multiSlotGroupId?: string; // For multi-slot equipment
  multiSlotPosition?: 'start' | 'middle' | 'end';
}

// Critical Allocations Map
interface CriticalAllocations {
  [location: string]: EnhancedCriticalSlot[];
}

// Drag State
interface CriticalDragState {
  isDragging: boolean;
  draggedItem: {
    equipmentId: string;
    name: string;
    slots: number;
    sourceLocation?: string;
    sourceSlotIndex?: number;
  } | null;
  hoveredLocation?: string;
  hoveredSlotIndex?: number;
  canDrop: boolean;
}
```

### Key Features

1. **Null-based Empty Slots**
   - Empty slots are represented as `null` content, not "-Empty-" strings
   - UI components display empty slots with appropriate styling

2. **Slot Indexing**
   - Each slot tracks its index within the location
   - Enables precise slot management and multi-slot allocation

3. **Equipment References**
   - Direct reference to equipment in weapons_and_equipment array
   - Enables instant lookup and validation

4. **Multi-slot Support**
   - Track multi-slot equipment with group IDs
   - Position tracking for proper UI rendering

5. **System Component Tracking**
   - Fixed flag for non-removable components
   - Content type categorization

## Implementation Components

### 1. Critical Slot Manager Utility

```typescript
class CriticalSlotManager {
  // Core operations
  static initializeSlots(unit: EditableUnit): CriticalAllocations;
  static allocateEquipment(
    allocations: CriticalAllocations,
    location: string,
    startIndex: number,
    equipment: Equipment
  ): CriticalAllocations;
  static removeEquipment(
    allocations: CriticalAllocations,
    location: string,
    slotIndex: number
  ): CriticalAllocations;
  static moveEquipment(
    allocations: CriticalAllocations,
    fromLocation: string,
    fromIndex: number,
    toLocation: string,
    toIndex: number
  ): CriticalAllocations;
  
  // Validation
  static canAllocate(
    allocations: CriticalAllocations,
    location: string,
    startIndex: number,
    slots: number
  ): boolean;
  static validateAllocations(allocations: CriticalAllocations): ValidationResult;
  
  // Queries
  static getUsedSlotCount(allocations: CriticalAllocations): number;
  static getEmptySlotCount(allocations: CriticalAllocations, location?: string): number;
  static getEquipmentInLocation(
    allocations: CriticalAllocations,
    location: string
  ): Equipment[];
}
```

### 2. Enhanced useUnitData Hook Methods

```typescript
interface CriticalSlotMethods {
  // Allocation methods
  allocateEquipmentToSlot: (
    location: string,
    startIndex: number,
    equipment: Equipment
  ) => void;
  
  removeEquipmentFromSlot: (
    location: string,
    slotIndex: number
  ) => void;
  
  moveEquipmentBetweenSlots: (
    fromLocation: string,
    fromIndex: number,
    toLocation: string,
    toIndex: number
  ) => void;
  
  clearLocation: (location: string) => void;
  
  // Query methods
  getSlotContent: (location: string, index: number) => EnhancedCriticalSlot | null;
  canAcceptEquipment: (
    location: string,
    startIndex: number,
    equipment: Equipment
  ) => boolean;
  getLocationUsage: (location: string) => {
    used: number;
    total: number;
    percentage: number;
  };
}
```

### 3. UI Component Integration

```typescript
// Enhanced Critical Slot Component
interface EnhancedCriticalSlotProps {
  location: string;
  slotIndex: number;
  slot: EnhancedCriticalSlot;
  onDrop: (item: DraggedEquipment) => void;
  onRemove: () => void;
  isDragActive: boolean;
  canAcceptDrop: boolean;
  isHoveredMultiSlot: boolean;
}

// Critical Location Panel
interface CriticalLocationPanelProps {
  location: string;
  slots: EnhancedCriticalSlot[];
  onClearLocation: () => void;
  readOnly: boolean;
}
```

## Implementation Steps

### Phase 1: Data Model Migration
1. Update type definitions
2. Create migration utilities for legacy data
3. Implement CriticalSlotManager utility class
4. Add unit tests for data operations

### Phase 2: Hook Integration
1. Extend useUnitData hook with critical slot methods
2. Add real-time validation
3. Implement undo/redo support for critical operations
4. Create specialized useCriticalSlots hook

### Phase 3: UI Component Updates
1. Update CriticalSlotDropZone to use enhanced data
2. Create EnhancedCriticalSlot component
3. Update drag and drop logic
4. Implement hover state management

### Phase 4: Performance Optimization
1. Memoize slot calculations
2. Optimize re-render triggers
3. Implement virtual scrolling for large slot lists
4. Add slot pre-allocation for common configurations

## Benefits

1. **Improved Data Integrity**
   - No more string-based empty slots
   - Proper null handling
   - Type-safe operations

2. **Better Performance**
   - Instant slot updates
   - Reduced re-renders
   - Optimized calculations

3. **Enhanced User Experience**
   - Real-time feedback
   - Smooth drag and drop
   - Clear visual states

4. **Maintainability**
   - Centralized logic
   - Clear separation of concerns
   - Comprehensive testing

## Migration Strategy

1. **Backward Compatibility**
   - Support reading legacy format
   - Automatic conversion on load
   - Preserve existing functionality

2. **Gradual Rollout**
   - Feature flag for enhanced mode
   - A/B testing capability
   - Rollback mechanism

3. **Data Validation**
   - Comprehensive validation rules
   - Migration verification
   - Error recovery

## Testing Plan

1. **Unit Tests**
   - CriticalSlotManager operations
   - Data migration functions
   - Validation logic

2. **Integration Tests**
   - Hook integration
   - Component interaction
   - Drag and drop flows

3. **E2E Tests**
   - Complete allocation workflows
   - Error scenarios
   - Performance benchmarks

## Future Enhancements

1. **Advanced Features**
   - Slot templates for common configurations
   - Bulk allocation operations
   - Smart allocation suggestions

2. **Analytics**
   - Usage patterns tracking
   - Common allocation mistakes
   - Performance metrics

3. **Export/Import**
   - Standard format support
   - Validation on import
   - Conflict resolution
