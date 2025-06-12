# MegaMekLab Armor Diagram Analysis

## Overview
This document provides a detailed analysis of the original MegaMekLab Java implementation's armor diagram setup, breaking down each component and interaction model.

## Screenshots Analysis

### 1. Structure/Armor Tab Layout

From the screenshots, the Structure/Armor tab contains several key sections:

#### Left Column (Configuration)
- **Basic Information**
  - Chassis name input
  - Clan name input  
  - Model designation
  - MUL ID field
  - Year input
  - Source/Era dropdown
  - Tech Base dropdown (Inner Sphere/Clan)
  - Tech Level dropdown (Standard/Advanced/etc)
  - Manual BV override
  - Role dropdown
  - Icon management (Choose file/Import from cache/Remove)

- **Chassis Configuration**
  - Tonnage spinner (25t shown)
  - Omni checkbox
  - Base Type dropdown (Standard)
  - Motive Type dropdown (Biped)
  - Structure dropdown (Standard/Endo Steel/etc)
  - Engine dropdown (Fusion/XL/Light/etc)
  - Gyro dropdown (Standard/XL/Compact/etc)
  - Cockpit dropdown (Standard Cockpit/Small/etc)
  - Enhancement dropdown (None/MASC/TSM/etc)

#### Center Column (Systems)
- **Heat Sinks**
  - Type dropdown (Single/Double)
  - Number spinner (10)
  - Engine Free indicator (shows how many are free)
  - Weight Free calculation
  - Total Dissipation display

- **Movement**
  - Base/Final columns
  - Walk MP spinners
  - Run MP (calculated)
  - Jump/UMU MP spinners
  - Jump Type dropdown (Jump Jet/Improved/etc)
  - Mech J. Booster MP

- **Summary Panel**
  - Unit Type display
  - Weight breakdown by component
  - Crits breakdown
  - Availability codes
  - Earliest Possible Year calculation

#### Right Column (Armor)
- **Armor Configuration**
  - Armor Type dropdown (Standard/Ferro-Fibrous/etc)
  - Armor Tonnage spinner with increment/decrement
  - Maximize Armor button
  - Use Remaining Tonnage button

- **Armor Allocation Grid**
  - Visual mech diagram (NOT shown in detail in screenshots)
  - HD (Head) input with Max indicator
  - Location inputs (LA/LT/CT/RT/RA)
  - Each location shows current/max values
  - Rear armor inputs for torso locations
  - LL/RL (Leg) inputs with max values

- **Armor Summary**
  - Unallocated Armor Points counter
  - Allocated Armor Points display  
  - Total Armor Points calculation
  - Maximum Possible Armor Points
  - Wasted Armor Points indicator
  - Points Per Ton ratio
  - Auto-Allocate Armor button

### 2. Equipment Tab Analysis

The Equipment tab shows a two-panel layout:

#### Left Panel - Current Loadout
- Headers: Name, Tons, Crits, Heat, Loc, Size
- Lists all equipped items with their stats
- Remove/Remove All buttons
- Shows equipment location assignments
- Total weight/crits/heat calculations

#### Right Panel - Equipment Database
- Category filters (Energy, Ballistic, Missile, etc)
- Hide filters (Prototype, One-Shot, Torpedoes, etc)
- Text search functionality
- Sortable columns (Name, Damage, Heat, Range, etc)
- Add buttons for each equipment item
- Availability indicators based on year

### 3. Quirks Tab

Two-column layout:
- Positive Quirks (left column)
- Negative Quirks (right column)
- Weapon-specific quirks section
- Checkbox selection interface

## Armor Diagram Component Architecture

### Visual Design Elements

1. **Mech Silhouette**
   - Front-facing bipedal mech outline
   - Distinct regions for each location
   - Visual separation between front/rear armor
   - Clear labeling of each section

2. **Armor Value Display**
   - Numeric inputs for each location
   - Current/Max value indicators
   - Color coding for armor status:
     - Green: Well armored
     - Yellow: Moderate armor
     - Red: Low armor
     - Gray: No armor

3. **Interactive Elements**
   - Click to increment/decrement armor values
   - Drag to allocate multiple points
   - Shift-click for bulk operations
   - Right-click for context menu

### Data Flow

1. **Armor Allocation Process**
   ```
   User Input → Validation → Update Model → Recalculate → Update UI
   ```

2. **Constraints**
   - Maximum armor per location based on internal structure
   - Total armor points limited by tonnage
   - Rear armor cannot exceed front armor (torsos)
   - Head has special armor limits

3. **Auto-Allocation Algorithm**
   - Prioritizes vital locations (CT, Head)
   - Balances front/rear torso armor
   - Distributes remaining points evenly
   - Respects maximum values per location

## Implementation Plan

### Phase 1: Core Armor System Enhancement
1. Enhance existing MechArmorDiagram component
2. Add numeric input controls alongside visual display
3. Implement click-to-increment functionality
4. Add drag-to-allocate feature

### Phase 2: Advanced Controls
1. Maximize Armor functionality
2. Use Remaining Tonnage feature
3. Auto-Allocate Armor algorithm
4. Armor type effects (points per ton)

### Phase 3: Visual Feedback
1. Color coding based on armor coverage
2. Hover tooltips showing armor percentages
3. Visual indicators for maximum values
4. Animation for armor changes

### Phase 4: Integration
1. Connect with weight calculations
2. Update validation system
3. Sync with equipment changes
4. Export armor data correctly

## Key Differences from Current Implementation

### Current Implementation Has:
- Basic visual diagram
- Simple click interaction
- Fixed armor display

### MegaMekLab Implementation Adds:
- Numeric input fields
- Max value indicators  
- Unallocated points tracker
- Auto-allocation features
- Tonnage-based constraints
- Multiple interaction modes

## Technical Considerations

### State Management
```typescript
interface ArmorAllocation {
  location: string;
  armorPoints: number;
  rearArmorPoints?: number;
  maxArmor: number;
  maxRearArmor?: number;
}

interface ArmorState {
  armorType: string;
  totalArmorTonnage: number;
  allocations: ArmorAllocation[];
  unallocatedPoints: number;
  pointsPerTon: number;
}
```

### Validation Rules
1. Cannot exceed max armor per location
2. Total armor limited by tonnage
3. Rear armor ≤ front armor (torsos)
4. Head armor special limits (3 or 9)
5. Must be whole numbers

### User Interactions
1. **Click**: Increment by 1
2. **Shift-Click**: Increment by 5
3. **Right-Click**: Decrement by 1
4. **Drag**: Allocate multiple points
5. **Double-Click**: Max out location
6. **Keyboard**: Arrow keys for fine control

## Component Integration Map

```
StructureArmorTab
├── BasicInfoPanel
├── ChassisConfigPanel
├── HeatSinkPanel
├── MovementPanel
├── ArmorConfigPanel
│   ├── ArmorTypeSelector
│   ├── ArmorTonnageControl
│   └── ArmorActionButtons
├── MechArmorDiagram
│   ├── MechSilhouette
│   ├── ArmorLocationControl (per location)
│   │   ├── ArmorValueInput
│   │   ├── MaxValueIndicator
│   │   └── InteractionHandlers
│   └── ArmorVisualFeedback
└── ArmorSummaryPanel
    ├── PointsDisplay
    ├── AllocationStatus
    └── AutoAllocateButton
```

## Implementation Priority

1. **High Priority**
   - Numeric input controls
   - Max value indicators
   - Tonnage constraints
   - Unallocated points display

2. **Medium Priority**
   - Auto-allocation algorithm
   - Drag interaction
   - Visual feedback colors
   - Keyboard controls

3. **Low Priority**
   - Animations
   - Context menus
   - Advanced tooltips
   - Preset configurations

## Conclusion

The MegaMekLab armor system provides a comprehensive and user-friendly interface for armor allocation. The key to successful implementation is balancing the visual diagram with precise numeric controls while maintaining all the validation rules and constraints of the BattleTech construction system.
