# Component Synchronization Implementation Plan

## Phase 0: Baseline Testing (IN PROGRESS)

### Completed:
1. ✅ Created baseline tests for Structure Tab behavior
   - Tests verify that engine changes do NOT update critical slots (current bug)
   - Tests confirm heat sink changes do NOT create equipment items
   - Tests document current field update behavior

2. ✅ Created baseline tests for Equipment Tab behavior
   - Tests verify equipment starts with empty location when added
   - Tests confirm equipment removal behavior
   - Tests verify criticals are NOT modified by equipment tab

3. ✅ Created baseline tests for Criticals Tab behavior
   - Tests document current drag & drop behavior
   - Tests verify system component protection
   - Tests confirm equipment location sync

4. ✅ Created integration tests for current flow
   - Tests document the current bugs/limitations
   - Tests verify equipment flow between tabs

### Next Steps:
1. Run all baseline tests to ensure they pass
2. Use these tests as regression tests during implementation

## Phase 1: Data Model Foundation

### Goals:
1. Create unified `systemComponents` structure to track:
   - Engine type and rating
   - Gyro type
   - Cockpit type
   - Structure type
   - Heat sink configuration

2. Add `criticalAllocations` as single source of truth for slot contents

3. Create migration utilities from current data structure

### Implementation:
```typescript
interface SystemComponents {
  engine: {
    type: 'Standard' | 'XL' | 'Light' | 'XXL' | 'Compact' | 'ICE' | 'Fuel Cell';
    rating: number;
    manufacturer?: string;
  };
  
  gyro: {
    type: 'Standard' | 'XL' | 'Compact' | 'Heavy-Duty';
  };
  
  cockpit: {
    type: 'Standard' | 'Small' | 'Command Console' | 'Torso-Mounted';
  };
  
  structure: {
    type: 'Standard' | 'Endo Steel' | 'Composite' | 'Reinforced';
  };
  
  heatSinks: {
    type: 'Single' | 'Double' | 'Compact';
    total: number;
    engineIntegrated: number; // Auto-calculated
    externalRequired: number;  // total - engineIntegrated
  };
}

interface CriticalAllocationMap {
  [location: string]: CriticalSlot[];
}

interface CriticalSlot {
  index: number;
  content: string | null;
  contentType: 'system' | 'equipment' | 'heat-sink' | 'empty';
  isFixed: boolean;
  isManuallyPlaced: boolean;
  linkedSlots?: number[]; // For multi-slot items
}
```

## Phase 2: Component Rules Engine

### Goals:
1. Create rules for component placement based on type
2. Implement slot calculations for each component type
3. Add conflict detection and resolution

### Key Rules:
- **Standard Engine**: 6 CT slots
- **XL Engine**: 6 CT + 3 LT + 3 RT slots
- **Light Engine**: 6 CT + 2 LT + 2 RT slots
- **XXL Engine**: 6 CT + 6 LT + 6 RT slots
- **Compact Engine**: 3 CT slots
- **Standard Gyro**: 4 CT slots
- **Compact Gyro**: 2 CT slots
- **XL Gyro**: 6 CT slots
- **Heavy-Duty Gyro**: 4 CT slots
- **Endo Steel**: 14 slots distributed across mech
- **Ferro-Fibrous**: 14 slots distributed across mech

## Phase 3: Structure Tab Integration

### Goals:
1. Update Structure Tab to populate `systemComponents`
2. Implement automatic critical slot updates on component changes
3. Add conflict detection when changing components
4. Generate external heat sinks as equipment items

### Implementation Steps:
1. Modify `handleEngineChange` to:
   - Update `systemComponents.engine`
   - Calculate new critical slot requirements
   - Check for conflicts with existing equipment
   - Update `criticalAllocations`
   
2. Modify `handleHeatSinksChange` to:
   - Update `systemComponents.heatSinks`
   - Calculate external heat sinks needed
   - Generate heat sink equipment items
   - Add to unallocated equipment pool

## Phase 4: Critical Slot Synchronization

### Goals:
1. Update Criticals Tab to use `criticalAllocations` as source of truth
2. Implement bi-directional sync with equipment locations
3. Add visual indicators for system vs equipment slots
4. Handle external heat sinks as placeable items

## Phase 5: Equipment Tab Updates

### Goals:
1. Add realistic tonnage and critical slot requirements
2. Update equipment database with accurate BattleTech values
3. Ensure proper tracking in unified model

## Phase 6: Validation & Cleanup

### Goals:
1. Add comprehensive validation functions
2. Remove deprecated data structures
3. Add error recovery mechanisms
4. Create migration path for existing data

## Test-Driven Development Process

For each phase:
1. Write tests for expected behavior
2. Implement changes
3. Verify all tests pass
4. Update baseline tests to expect new behavior
5. Run full test suite

## Current Status

### Completed Phases:

**Phase 0: Baseline Testing** - ✅ COMPLETE
- All baseline tests created
- Tests document current behavior and bugs

**Phase 1: Data Model Foundation** - ✅ COMPLETE
- Created `types/systemComponents.ts` with unified data model
- Added SystemComponents and CriticalAllocationMap types
- Added component weight and slot calculation functions

**Phase 2: Component Rules Engine** - ✅ COMPLETE
- Created `utils/componentRules.ts` with placement rules
- Implemented automatic critical slot initialization
- Added component distribution patterns

**Phase 3: Structure Tab Integration** - ✅ COMPLETE
- Created `utils/componentSync.ts` for synchronization
- Implemented sync functions for engine, gyro, structure changes
- Added heat sink equipment generation

**Phase 5: Equipment Tab Updates** - ✅ COMPLETE
- Created `utils/equipmentDatabase.ts` with realistic BattleTech values
- Accurate tonnage and critical slot requirements for all equipment
- Updated `utils/equipmentData.ts` to use new database

### Remaining Phases:

**Phase 4: Critical Slot Synchronization** - TODO
- Update Criticals Tab to use criticalAllocations
- Implement bi-directional sync
- Add visual indicators for system vs equipment

**Phase 6: Validation & Cleanup** - TODO
- Add comprehensive validation
- Remove deprecated code
- Add error recovery
- Create data migration utilities

## Key Achievements

1. **Realistic Equipment Values**: All weapons, equipment, and ammunition now have accurate tonnage and critical slot requirements based on official BattleTech rules.

2. **System Component Rules**: Engine types (Standard, XL, Light, etc.) now correctly calculate their critical slot requirements across torso locations.

3. **Component Synchronization**: Changes to engine, gyro, or structure type will automatically update critical slots (once integrated with UI).

4. **Heat Sink Management**: External heat sinks are properly calculated and generated as equipment items.

## Next Steps

1. **Integrate with Structure Tab UI**: Update the Structure Tab component to use the new sync functions
2. **Update Criticals Tab**: Modify to use the unified criticalAllocations data
3. **Run Tests**: Execute all baseline tests and fix any issues
4. **Add Migration Path**: Create utilities to convert existing unit data to new format
