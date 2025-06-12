# MegaMekLab Armor Diagram Implementation Plan

## Overview
This document outlines the implementation plan for achieving full MegaMekLab parity in the armor diagram and structure/armor tab functionality.

## Current State Analysis

### What We Have
1. ✅ Basic Information fields (Chassis, Model, Year, Tech Base)
2. ✅ Chassis configuration (Tonnage, Structure, Engine, Gyro, Cockpit)
3. ✅ Heat Sinks configuration
4. ✅ Movement panel with Walk/Run/Jump MPs
5. ✅ Armor type selection and tonnage input
6. ✅ Numeric armor allocation inputs
7. ✅ Armor statistics panel
8. ✅ Auto-allocation functionality

### What's Completed
1. ✅ Visual mech silhouette diagram (Phase 1)
2. ✅ Icon management (file upload, import from cache, remove) (Phase 2)
3. ✅ Additional fields (Clan Name, MUL ID, Source/Era, Role) (Phase 3)
4. ✅ Omni checkbox functionality (Phase 4)
5. ✅ Base Type selection (Standard/Primitive) (Phase 4)
6. ✅ Motive Type selection (Biped/Quad) (Phase 4)
7. ✅ Component weight/crit calculations in Summary (Phase 6)
8. ✅ Availability codes (Phase 6)
9. ✅ Engine Free heat sinks calculation (Phase 6)
10. ✅ Mechanical Jump Booster functionality (Phase 5)
11. ✅ Real-time validation and constraints (Phase 7)
12. ✅ All dropdowns connected to unit data (Phase 8)

### What's Remaining
1. ❌ Earliest Possible Year calculation based on components
2. ❌ Equipment heat calculation integration
3. ❌ "Use Remaining Tonnage" button functionality
4. ❌ Performance optimizations (debouncing, memoization)
5. ❌ Unit tests for calculations
6. ❌ Export compatibility testing

## Implementation Phases

### Phase 1: Visual Armor Diagram Component
Create a visual mech silhouette that shows armor values graphically.

#### Components to Create:
1. **MechArmorDiagram Component**
   ```tsx
   interface MechArmorDiagramProps {
     armorLocations: ArmorLocation[];
     maxArmorValues: Record<string, number>;
     onArmorChange: (location: string, value: number, isRear?: boolean) => void;
     readOnly?: boolean;
     mechType?: 'biped' | 'quad';
   }
   ```

2. **Visual Elements**:
   - SVG-based mech silhouette
   - Color-coded armor levels (green = full, yellow = partial, red = low)
   - Click/drag to adjust armor values
   - Hover tooltips showing current/max values
   - Visual indication of front/rear armor for torsos

### Phase 2: Icon Management System
Implement the icon upload and caching functionality.

#### Features:
1. File upload button with image preview
2. Import from cache (previously uploaded icons)
3. Remove icon functionality
4. Store icons in localStorage or IndexedDB
5. Default mech icon display

### Phase 3: Additional Fields and Calculations
Add missing fields and implement proper calculations.

#### New Fields:
1. Clan Name (optional text field)
2. MUL ID (Master Unit List identifier)
3. Source/Era (text field)
4. Role selection dropdown
5. Manual BV override

#### Calculations:
1. Engine Free heat sinks based on engine rating
2. Component weights based on tonnage and type
3. Critical slot requirements
4. Availability codes
5. Earliest Possible Year based on components

### Phase 4: Omni and Variant Support
Implement OmniMech functionality.

#### Features:
1. Omni checkbox that affects:
   - Fixed vs configurable equipment
   - Pod space calculations
   - Critical slot allocation rules
2. Base configuration vs variant management

### Phase 5: Advanced Movement Options
Complete the movement system implementation.

#### Features:
1. Mechanical Jump Booster support
2. UMU (Underwater Maneuvering Unit) option
3. Enhancement effects on movement:
   - MASC: Run MP = Walk MP × 2
   - TSM: +2 Walk MP when heat ≥ 9
   - Supercharger: +25% engine rating temporarily

### Phase 6: Component Weight and Availability System
Implement accurate weight calculations and tech availability.

#### Weight Calculations:
```typescript
interface ComponentWeight {
  structure: number;
  engine: number;
  gyro: number;
  cockpit: number;
  heatSinks: number;
  armor: number;
  jumpJets: number;
  equipment: number;
  weapons: number;
}
```

#### Availability Codes:
- Format: "A/B-C-D-E" (Intro/Standard-Advanced-Experimental-Extinct)
- Calculate based on all components
- Show most restrictive availability

### Phase 7: Validation and Constraints
Implement comprehensive validation system.

#### Validations:
1. Engine rating ≤ 400 (≤ 500 for certain types)
2. Armor points ≤ max for each location
3. Total weight ≤ mech tonnage
4. Heat sink minimums (10 for fusion engines)
5. Critical slot availability
6. Tech level compatibility

## Technical Implementation Details

### State Management
```typescript
interface StructureArmorState {
  basicInfo: {
    chassis: string;
    model: string;
    clanName?: string;
    mulId: number;
    year: number;
    sourceEra?: string;
    techBase: 'Inner Sphere' | 'Clan' | 'Mixed';
    techLevel: 'Introductory' | 'Standard' | 'Advanced' | 'Experimental';
    role?: string;
    manualBV?: number;
    icon?: string;
  };
  chassis: {
    tonnage: number;
    isOmni: boolean;
    baseType: 'Standard' | 'Primitive';
    motiveType: 'Biped' | 'Quad';
    structure: StructureType;
    engine: EngineConfig;
    gyro: GyroType;
    cockpit: CockpitType;
    enhancement: EnhancementType;
  };
  // ... rest of state
}
```

### Calculation Utilities
```typescript
// Internal structure calculation
function calculateInternalStructure(tonnage: number, location: string): number;

// Engine free heat sinks
function calculateEngineFreeHeatSinks(engineRating: number, engineType: string): number;

// Component weights
function calculateComponentWeight(component: ComponentType, tonnage: number): number;

// Availability calculation
function calculateAvailability(components: Component[]): AvailabilityCode;

// Earliest year calculation
function calculateEarliestYear(components: Component[]): number;
```

## UI/UX Improvements

### Visual Enhancements:
1. Smooth animations for armor value changes
2. Drag-to-adjust armor values on diagram
3. Visual feedback for invalid configurations
4. Tooltips with detailed information
5. Keyboard shortcuts for common actions

### Layout Optimization:
1. Responsive design for different screen sizes
2. Collapsible panels to save space
3. Tab navigation between major sections
4. Print-friendly view option

## Testing Requirements

### Unit Tests:
1. Armor calculation accuracy
2. Weight calculation correctness
3. Validation rule enforcement
4. State management integrity

### Integration Tests:
1. Armor allocation workflow
2. Icon upload/management
3. Save/load functionality
4. Export compatibility with MegaMekLab

## Performance Considerations

1. Debounce armor value updates
2. Memoize expensive calculations
3. Lazy load icon data
4. Optimize SVG rendering for diagram

## Timeline Estimate

- Phase 1 (Visual Diagram): 2-3 days
- Phase 2 (Icon Management): 1 day
- Phase 3 (Additional Fields): 1-2 days
- Phase 4 (Omni Support): 2 days
- Phase 5 (Advanced Movement): 1 day
- Phase 6 (Weights & Availability): 2 days
- Phase 7 (Validation): 1-2 days

Total: 10-14 days for full implementation

## Next Steps

1. Start with Phase 1 - Create the visual armor diagram component
2. Integrate it into the existing StructureArmorTab
3. Add interactive features (click/drag to adjust)
4. Implement visual feedback and animations
