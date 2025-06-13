# MegaMekLab Armor Diagram Complete Analysis

## Overview
This document provides a complete analysis of the MegaMekLab Java implementation of the armor diagram system and a detailed plan for implementing each component in our React application.

## MegaMekLab Architecture Analysis

### 1. Main Structure Tab (BMStructureTab.java)
The Structure/Armor tab is organized into three columns:

#### Left Column
- **BasicInfoView**: Unit name, tech level, tonnage
- **IconView**: Unit icon display
- **BMChassisView**: Chassis configuration (structure, engine, gyro, cockpit)

#### Center Column
- **HeatSinkView**: Heat sink management
- **MovementView**: Walk/Jump MP configuration
- **BMLAMFuelView**: LAM fuel (conditional)
- **SummaryView**: Build summary statistics

#### Right Column (Armor Components)
- **MVFArmorView**: Armor type selection and tonnage
- **ArmorAllocationView**: Main armor diagram
- **PatchworkArmorView**: Patchwork armor configuration (conditional)

### 2. ArmorAllocationView Component

#### Layout System
Uses predefined layouts based on unit type:

```java
MEK_LAYOUT = {
    {-1, -1, HEAD, -1, -1},
    {LARM, LT, CT, RT, RARM},
    {-1, LLEG, CLEG, RLEG, -1}
}

TANK_LAYOUT = {
    {-1, FRONT, -1},
    {LEFT, TURRET, RIGHT},
    {-1, TURRET_2, -1},
    {-1, REAR, -1}
}
```

#### Key Features
1. **Dynamic Layout**: Adapts to unit type (Mech, Tank, VTOL, Aerospace, etc.)
2. **Location Views**: Each location is an ArmorLocationView component
3. **Statistics Panel**: Shows allocation summary
4. **Auto-Allocate**: Algorithm for optimal armor distribution

#### Statistics Displayed
- Unallocated points (red when != 0)
- Allocated points
- Total armor points
- Maximum possible
- Wasted points
- Points per ton (or kg/point for small units)

### 3. ArmorLocationView Component

#### Features
- **Title**: Location name (e.g., "CT", "RT", "Head")
- **Front Armor**: Spinner control
- **Rear Armor**: Spinner control (conditional)
- **Max Display**: Shows maximum armor for location
- **Validation**: Enforces min/max constraints

#### Behavior
- Real-time updates
- Prevents over-allocation
- Handles front/rear balance
- Tooltip shows armor weight for patchwork

### 4. Auto-Allocation Algorithm

From the code analysis, the algorithm:
1. Allocates 5x percentage to head (max 9/12 for SH)
2. Distributes remaining by internal structure
3. Uses 75% front / 25% rear for torsos
4. Allocates leftover points strategically
5. Prioritizes symmetry and critical locations

## React Implementation Plan

### Phase 1: Core Components

#### 1.1 ArmorLocationControl Component
```typescript
interface ArmorLocationControlProps {
  location: string;
  locationName: string;
  maxArmor: number;
  currentFront: number;
  currentRear?: number;
  hasRear: boolean;
  minArmor?: number;
  onChange: (location: string, front: number, rear: number) => void;
  disabled?: boolean;
  patchworkMode?: boolean;
  armorWeight?: number;
}
```

Features:
- Numeric input controls with increment/decrement
- Visual feedback for constraints
- Compact and expanded modes
- Touch-friendly design

#### 1.2 MechArmorDiagram Component
```typescript
interface MechArmorDiagramProps {
  unit: EditableUnit;
  onArmorChange: (location: string, front: number, rear: number) => void;
  layout?: 'compact' | 'standard' | 'detailed';
  showVisual?: boolean;
  readOnly?: boolean;
}
```

Features:
- Dynamic layout based on unit type
- Grid-based positioning system
- Visual mech silhouette option
- Responsive design

#### 1.3 ArmorStatisticsPanel Component
```typescript
interface ArmorStatisticsPanelProps {
  unit: EditableUnit;
  armorType: ArmorType;
  compactMode?: boolean;
}
```

Displays:
- Allocation progress bar
- Points breakdown
- Efficiency metrics
- Weight calculations

### Phase 2: Enhanced Features

#### 2.1 Visual Armor Diagram
- SVG-based mech silhouette
- Color-coded armor levels
- Interactive hover states
- Click to edit functionality

#### 2.2 Auto-Allocation System
```typescript
interface AutoAllocationOptions {
  strategy: 'balanced' | 'front-heavy' | 'maximum-protection';
  priorityLocations?: string[];
  frontRearRatio?: number;
  headMultiplier?: number;
  preserveSymmetry?: boolean;
}
```

#### 2.3 Armor Distribution Presets
- Standard configurations
- Role-based templates
- Custom user presets
- Import/export capability

### Phase 3: Advanced Features

#### 3.1 Patchwork Armor Support
- Per-location armor type selection
- Weight calculation per location
- Critical slot tracking
- Compatibility validation

#### 3.2 History and Undo/Redo
- Track armor changes
- Bulk operations support
- Comparison view
- Reset to checkpoint

#### 3.3 Validation and Warnings
- Real-time constraint checking
- Visual indicators
- Helpful error messages
- Suggestions for fixes

## Component Integration Map

```
StructureArmorTab
├── ArmorTypeSelector
│   └── Handles armor type and tonnage
├── MechArmorDiagram
│   ├── ArmorLocationControl (per location)
│   └── MechSilhouette (optional visual)
├── ArmorStatisticsPanel
│   └── Shows allocation summary
├── ArmorDistributionPresets
│   └── Quick allocation options
└── PatchworkArmorManager (conditional)
    └── Per-location armor configuration
```

## Implementation Priority

### High Priority (Core Functionality)
1. ArmorLocationControl - Basic input control
2. MechArmorDiagram - Layout and organization
3. ArmorStatisticsPanel - Feedback and validation
4. Auto-allocation algorithm

### Medium Priority (Enhanced UX)
1. Visual mech diagram
2. Distribution presets
3. Touch-friendly controls
4. Responsive layouts

### Low Priority (Advanced)
1. Patchwork armor full support
2. History/undo system
3. Import/export presets
4. Armor optimization hints

## Key Differences from MegaMekLab

### Improvements
1. **Modern UI**: Material Design components
2. **Better Visuals**: SVG diagrams with animations
3. **Mobile Support**: Touch-friendly controls
4. **Smart Validation**: Real-time helpful feedback
5. **Presets System**: Quick configuration options

### Maintained Features
1. **Layout System**: Similar positioning logic
2. **Auto-Allocate**: Enhanced algorithm
3. **Statistics**: Comprehensive feedback
4. **Constraints**: Proper validation

## Next Steps

1. Create ArmorLocationControl component
2. Implement MechArmorDiagram with layout system
3. Build ArmorStatisticsPanel
4. Port auto-allocation algorithm
5. Add visual diagram support
6. Implement preset system
7. Add patchwork armor support
8. Create comprehensive tests

## Testing Strategy

### Unit Tests
- Armor calculation functions
- Auto-allocation algorithm
- Constraint validation
- Layout positioning

### Integration Tests
- Complete armor allocation flow
- Preset application
- Patchwork mode switching
- Save/load functionality

### Visual Tests
- Different unit types
- Various armor configurations
- Responsive layouts
- Error states

This analysis provides a complete understanding of the MegaMekLab implementation and a clear path forward for our React implementation.
