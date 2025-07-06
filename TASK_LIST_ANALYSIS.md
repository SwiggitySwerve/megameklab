# BattleTech Editor App - Critical Issues Task List

## Executive Summary

The application is experiencing several critical issues related to state management, slot calculations, and equipment removal behavior. This document provides a comprehensive analysis of each problem and detailed solutions.

## Issue 1: State Persistence Between Refreshes

### Problem Description
- Unit state is not being saved between page refreshes
- Application resets to default configuration instead of restoring previous state
- Should default to "standard" configuration and restore saved state

### Root Cause Analysis
**Location**: `battletech-editor-app/components/multiUnit/MultiUnitProvider.tsx`

**Issues Found**:
1. **Incomplete State Serialization**: The `saveCompleteState` method exists but may not be capturing all necessary state data
2. **State Restoration Logic**: The `loadTabData` method has both legacy and new state formats but may not be properly restoring complete state
3. **Default Configuration Override**: The `createDefaultConfiguration` method sets non-standard defaults instead of true "standard" BattleTech defaults

**Key Code Sections**:
```typescript
// Lines 85-130: Default configuration is not truly "standard"
const createDefaultConfiguration = (): UnitConfiguration => ({
  chassis: 'Custom',
  model: 'New Design',
  tonnage: 50,  // Should be configurable or truly standard
  // ... other non-standard defaults
})

// Lines 461-506: State saving logic
const saveCompleteState = (tabId: string, unitManager: UnitCriticalManager) => {
  // This method exists but may not be called consistently
}

// Lines 517-556: State loading logic
const loadTabData = (tabId: string): { config: UnitConfiguration, hasCompleteState: boolean } => {
  // Mixed legacy and new state handling
}
```

### Solution Strategy
1. **Implement Proper State Persistence**:
   - Ensure `saveCompleteState` is called on every state change
   - Add debounced saving to prevent excessive localStorage writes
   - Implement proper state restoration on initialization

2. **Fix Default Configuration**:
   - Create truly "standard" BattleTech defaults
   - Allow user to choose starting configuration
   - Implement proper state restoration priority

3. **Add State Validation**:
   - Validate restored state before applying
   - Provide fallback to standard configuration if state is corrupted
   - Add state versioning for migration support

## Issue 2: Incorrect Total Slots Calculation

### Problem Description
- Total slots used calculation is incorrect
- System thinks there are "extra slots coming out of nowhere"
- Slot counting logic needs investigation and fixing

### Root Cause Analysis
**Location**: `battletech-editor-app/utils/criticalSlots/CriticalSlotCalculator.ts`

**Issues Found**:
1. **Double Counting in Breakdown**: The `getCompleteBreakdown` method may be counting slots multiple times
2. **Inconsistent Slot Counting**: Different methods use different slot counting logic
3. **Equipment Slot Calculation**: Equipment slots may be counted both in allocated and unallocated sections

**Key Code Sections**:
```typescript
// Lines 1385-1492: getCompleteBreakdown method
static getCompleteBreakdown(config: UnitConfiguration, sections: any, equipment: any[]): any {
  // This method has potential double-counting issues
  const totalUsedSlots = structural.total + allocatedSlots + unallocatedSlots;
  // Equipment may be counted in both allocatedSlots and unallocatedSlots
}
```

**Specific Problems**:
1. **Structural Slots**: Fixed components (17) + System components + Special components
2. **Allocated Equipment**: Equipment placed in critical sections
3. **Unallocated Equipment**: Equipment in the tray
4. **Potential Overlap**: Equipment may be counted in multiple categories

### Solution Strategy
1. **Audit Slot Counting Logic**:
   - Review all slot counting methods for consistency
   - Ensure equipment is only counted once
   - Implement proper slot categorization

2. **Fix Breakdown Calculation**:
   - Separate structural, system, and equipment slots clearly
   - Ensure no double counting between categories
   - Add validation to catch counting errors

3. **Add Debug Logging**:
   - Add detailed logging for slot calculations
   - Track where each slot is being counted
   - Provide breakdown of slot sources

## Issue 3: Equipment Removal Behavior

### Problem Description
- Double-clicking on heat sinks, endosteel, ferrofibrous should NOT remove them
- Only configuration changes in other tabs should adjust these components
- MASC and similar components should also be protected from removal

### Root Cause Analysis
**Location**: `battletech-editor-app/components/criticalSlots/EquipmentTray.tsx`

**Current Implementation**:
```typescript
// Lines 133-148: Configuration component detection
const isConfigurationComponent = (equipment: any): boolean => {
  const actualEquipment = equipment.equipmentData || equipment;
  const name = actualEquipment.name?.toLowerCase() || '';
  
  // Check for structure/armor components via componentType field
  const specialEq = actualEquipment as any;
  const isStructureOrArmor = specialEq.componentType === 'structure' || specialEq.componentType === 'armor';
  
  // Check for jump jets - these should only be managed via movement configuration
  const isJumpJet = name.includes('jump') || name.includes('umu') || name.includes('booster');
  
  const isConfigComponent = isStructureOrArmor || isJumpJet;
  
  return isConfigComponent;
};
```

**Issues Found**:
1. **Incomplete Protection**: Heat sinks, endosteel, ferrofibrous not properly protected
2. **Missing Component Types**: Some configuration components don't have proper `componentType` flags
3. **Name-Based Detection**: Relies on name matching which is fragile

### Solution Strategy
1. **Expand Protected Components List**:
   - Add heat sinks to protected components
   - Add endosteel and ferrofibrous armor
   - Add MASC and similar enhancement systems
   - Add engine and gyro components

2. **Improve Detection Logic**:
   - Use `componentType` field consistently
   - Add fallback name-based detection for legacy equipment
   - Create comprehensive protected component registry

3. **Add User Feedback**:
   - Show clear tooltips for protected components
   - Explain why components can't be removed
   - Direct users to appropriate configuration tabs

## Issue 4: Data Model Investigation

### Problem Description
- Need to ensure data model can handle all interactions properly
- Verify state serialization/deserialization works correctly
- Ensure equipment types and relationships are properly defined

### Investigation Areas

#### 1. Equipment Data Structure
**Location**: `battletech-editor-app/types/criticalSlots.ts`

**Key Questions**:
- Are all equipment types properly categorized?
- Do configuration components have proper flags?
- Is the equipment hierarchy consistent?

#### 2. State Serialization
**Location**: `battletech-editor-app/utils/criticalSlots/UnitSerializationManager.ts`

**Key Questions**:
- Can all state be properly serialized?
- Are there circular references preventing serialization?
- Is the serialized format backward compatible?

#### 3. Component Configuration
**Location**: `battletech-editor-app/types/componentConfiguration.ts`

**Key Questions**:
- Are all component types properly defined?
- Do configuration objects have all necessary properties?
- Is the migration from legacy formats working?

## Detailed Task List

### Phase 1: State Persistence Fixes

#### Task 1.1: Audit State Saving Logic
- **File**: `battletech-editor-app/components/multiUnit/MultiUnitProvider.tsx`
- **Lines**: 461-506
- **Action**: Review `saveCompleteState` method and ensure it captures all necessary state
- **Deliverable**: Updated state saving logic with proper error handling

#### Task 1.2: Fix State Restoration
- **File**: `battletech-editor-app/components/multiUnit/MultiUnitProvider.tsx`
- **Lines**: 517-556
- **Action**: Improve `loadTabData` method to properly restore complete state
- **Deliverable**: Robust state restoration with validation and fallbacks

#### Task 1.3: Implement Standard Defaults
- **File**: `battletech-editor-app/components/multiUnit/MultiUnitProvider.tsx`
- **Lines**: 85-130
- **Action**: Create truly standard BattleTech default configuration
- **Deliverable**: Standard configuration that follows BattleTech rules

#### Task 1.4: Add State Validation
- **File**: `battletech-editor-app/utils/criticalSlots/UnitSerializationManager.ts`
- **Action**: Add state validation before applying restored state
- **Deliverable**: State validation with proper error handling and recovery

### Phase 2: Slot Calculation Fixes

#### Task 2.1: Audit Slot Counting Logic
- **File**: `battletech-editor-app/utils/criticalSlots/CriticalSlotCalculator.ts`
- **Lines**: 1385-1492
- **Action**: Review and fix `getCompleteBreakdown` method
- **Deliverable**: Corrected slot counting without double counting

#### Task 2.2: Fix Equipment Slot Calculation
- **File**: `battletech-editor-app/utils/criticalSlots/CriticalSlotCalculator.ts`
- **Lines**: 1427-1455
- **Action**: Ensure equipment is only counted once
- **Deliverable**: Proper equipment slot categorization

#### Task 2.3: Add Slot Calculation Debugging
- **File**: `battletech-editor-app/utils/criticalSlots/CriticalSlotCalculator.ts`
- **Action**: Add detailed logging for slot calculations
- **Deliverable**: Debug logging to track slot counting issues

#### Task 2.4: Validate Slot Totals
- **File**: `battletech-editor-app/utils/criticalSlots/UnitCriticalManager.ts`
- **Lines**: 1696-1724
- **Action**: Ensure slot total methods return correct values
- **Deliverable**: Accurate slot total calculations

### Phase 3: Equipment Protection Fixes

#### Task 3.1: Expand Protected Components
- **File**: `battletech-editor-app/components/criticalSlots/EquipmentTray.tsx`
- **Lines**: 133-148
- **Action**: Add heat sinks, endosteel, ferrofibrous to protected components
- **Deliverable**: Comprehensive protected component list

#### Task 3.2: Improve Detection Logic
- **File**: `battletech-editor-app/components/criticalSlots/EquipmentTray.tsx`
- **Action**: Improve `isConfigurationComponent` method
- **Deliverable**: Robust component detection using multiple methods

#### Task 3.3: Add User Feedback
- **File**: `battletech-editor-app/components/criticalSlots/EquipmentTray.tsx`
- **Lines**: 175-185
- **Action**: Improve tooltips and user feedback for protected components
- **Deliverable**: Clear user guidance for protected components

#### Task 3.4: Update Equipment Data
- **File**: `battletech-editor-app/data/equipment/`
- **Action**: Ensure all configuration components have proper `componentType` flags
- **Deliverable**: Consistent equipment categorization

### Phase 4: Data Model Validation

#### Task 4.1: Audit Equipment Types
- **File**: `battletech-editor-app/types/criticalSlots.ts`
- **Action**: Review equipment type definitions and relationships
- **Deliverable**: Comprehensive equipment type audit

#### Task 4.2: Test State Serialization
- **File**: `battletech-editor-app/utils/criticalSlots/UnitSerializationManager.ts`
- **Action**: Test serialization/deserialization with all equipment types
- **Deliverable**: Robust state serialization testing

#### Task 4.3: Validate Component Configuration
- **File**: `battletech-editor-app/types/componentConfiguration.ts`
- **Action**: Ensure all component configurations are properly defined
- **Deliverable**: Complete component configuration validation

#### Task 4.4: Add Integration Tests
- **File**: `battletech-editor-app/__tests__/integration/`
- **Action**: Add comprehensive integration tests for state management
- **Deliverable**: Test coverage for all state management scenarios

## Implementation Priority

### High Priority (Fix First)
1. Task 1.1: Audit State Saving Logic
2. Task 1.2: Fix State Restoration
3. Task 2.1: Audit Slot Counting Logic
4. Task 3.1: Expand Protected Components

### Medium Priority
1. Task 1.3: Implement Standard Defaults
2. Task 2.2: Fix Equipment Slot Calculation
3. Task 3.2: Improve Detection Logic
4. Task 4.1: Audit Equipment Types

### Low Priority (Polish)
1. Task 1.4: Add State Validation
2. Task 2.3: Add Slot Calculation Debugging
3. Task 3.3: Add User Feedback
4. Task 4.2-4.4: Testing and validation

## Success Criteria

### State Persistence
- [ ] Unit state persists correctly between page refreshes
- [ ] Application defaults to standard configuration when no saved state exists
- [ ] State restoration handles corrupted data gracefully
- [ ] No data loss during normal operation

### Slot Calculations
- [ ] Total slots used calculation is accurate
- [ ] No double counting of equipment slots
- [ ] Slot breakdown shows correct categorization
- [ ] Debug logging helps identify calculation issues

### Equipment Protection
- [ ] Heat sinks cannot be removed via double-click
- [ ] Endosteel and ferrofibrous armor are protected
- [ ] MASC and similar systems are protected
- [ ] Clear user feedback explains why components can't be removed

### Data Model
- [ ] All equipment types are properly categorized
- [ ] State serialization works for all equipment types
- [ ] Component configurations are consistent
- [ ] Integration tests pass for all scenarios

## Notes

- The application uses a complex state management system with multiple managers
- State persistence relies on localStorage with debounced saving
- Equipment protection currently uses name-based detection which is fragile
- Slot calculations involve multiple systems that may be double-counting
- The data model supports both legacy and new equipment formats

This task list provides a comprehensive roadmap for fixing all identified issues while maintaining backward compatibility and improving the overall robustness of the application. 