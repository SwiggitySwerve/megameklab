# MegaMekLab Equipment Tab Complete Analysis

## Overview
This document provides a comprehensive analysis of the MegaMekLab Java implementation of the Equipment tab and a detailed plan for implementing each component in our React application.

## MegaMekLab Equipment Tab Architecture

### 1. Main Structure (AbstractEquipmentTab.java)
The Equipment tab uses a horizontal split pane layout:

```
+----------------------------------------------------------+
|                     Equipment Tab                         |
+----------------------------------------------------------+
| +------------------------+ | +------------------------+ |
| | Current Loadout        | | | Equipment Database     | |
| | +------------------+   | | |                        | |
| | | Remove | Remove  |   | | | [Filter Controls]      | |
| | | All    |         |   | | |                        | |
| | +------------------+   | | | +--------------------+ | |
| |                        | | | | Equipment Table     | | |
| | +------------------+   | | | |                    | | |
| | | Equipment List   |   | | | | Name | Damage | Wt | | |
| | | - ER PPC         |   | | | | AC/20| 20     | 14 | | |
| | | - Medium Laser   |   | | | | ...  | ...    |... | | |
| | | - Heat Sink x10  |   | | | +--------------------+ | |
| | +------------------+   | | |                        | |
| +------------------------+ | +------------------------+ |
+----------------------------------------------------------+
```

### 2. Equipment Database View
The BMEquipmentDatabaseView component provides:

#### Column Sets
- **Fluff Mode**: Name, Tech, Tech Level, Tech Rating, Availability Dates, Cost
- **Stats Mode**: Name, Damage, Heat, Range, Shots, Tech, BV, Tonnage, Crits, Reference

#### Key Features
1. **Dynamic Column Display**: Switches between fluff and stats columns
2. **Equipment Filtering**: Based on tech level, unit type, availability
3. **Add Equipment**: Double-click or button to add to loadout
4. **Special Handling**: 
   - Targeting computers update existing
   - Fixed location equipment auto-spreads
   - Variable size equipment gets default size

### 3. Current Loadout Panel
Managed by CriticalTableModel:

#### Features
- **Equipment List**: Shows all mounted equipment
- **Size Editor**: Spinner for variable-size equipment
- **Remove Buttons**: Individual and bulk removal
- **Filtering**: showInLoadOut() method filters displayed equipment

#### Hidden Equipment (Not shown in loadout)
- Heat sinks (managed in Structure tab)
- Jump jets
- TSM/MASC (except superchargers)
- Armor/Structure
- LAM fuel tanks
- QuadVee tracks

### 4. Equipment Addition Logic

```java
protected void addEquipment(EquipmentType equip, int count) {
    if (equip instanceof MiscType && equip.hasFlag(MiscType.F_TARGCOMP)) {
        // Update existing targeting computer
        UnitUtil.updateTC(getMek(), equip);
    } else if (isMisc && UnitUtil.isFixedLocationSpreadEquipment(equip)) {
        // Spread across multiple locations
        MekUtil.createSpreadMounts(getMek(), equip);
    } else {
        // Standard addition
        Mounted mount = Mounted.createMounted(getMek(), equip);
        getMek().addEquipment(mount, Entity.LOC_NONE, false);
    }
}
```

## React Implementation Plan

### Phase 1: Core Equipment Management

#### 1.1 Equipment Database Component
```typescript
interface EquipmentDatabaseProps {
  unit: EditableUnit;
  onEquipmentAdd: (equipment: FullEquipment, count: number) => void;
  viewMode: 'fluff' | 'stats';
  filters?: EquipmentFilters;
}
```

Features:
- Virtual scrolling for performance
- Column configuration based on view mode
- Advanced filtering system
- Search functionality
- Equipment categories

#### 1.2 Equipment Loadout List
```typescript
interface EquipmentLoadoutProps {
  unit: EditableUnit;
  equipment: EquipmentPlacement[];
  onRemove: (equipmentId: string) => void;
  onRemoveAll: () => void;
  onSizeChange: (equipmentId: string, newSize: number) => void;
  filter?: (equipment: FullEquipment) => boolean;
}
```

Features:
- Grouped display by category
- Size adjustment for variable equipment
- Multi-select for bulk operations
- Drag source for critical allocation

#### 1.3 Equipment Filters
```typescript
interface EquipmentFilters {
  techBase?: 'Inner Sphere' | 'Clan' | 'Both';
  techLevel?: number;
  categories?: string[];
  weaponTypes?: string[];
  minWeight?: number;
  maxWeight?: number;
  search?: string;
  availability?: {
    year: number;
    faction?: string;
  };
}
```

### Phase 2: Advanced Features

#### 2.1 Smart Equipment Addition
```typescript
interface EquipmentAdditionStrategy {
  canAdd(equipment: FullEquipment, unit: EditableUnit): boolean;
  add(equipment: FullEquipment, unit: EditableUnit): EquipmentPlacement[];
  validate(equipment: FullEquipment, unit: EditableUnit): ValidationResult;
}

// Different strategies for different equipment types
class StandardEquipmentStrategy implements EquipmentAdditionStrategy { }
class SpreadEquipmentStrategy implements EquipmentAdditionStrategy { }
class TargetingComputerStrategy implements EquipmentAdditionStrategy { }
```

#### 2.2 Equipment Categories
```typescript
const EQUIPMENT_CATEGORIES = {
  WEAPONS: {
    ENERGY: ['Laser', 'PPC', 'Flamer'],
    BALLISTIC: ['Autocannon', 'Gauss', 'Machine Gun'],
    MISSILE: ['LRM', 'SRM', 'MRM', 'ATM'],
    ARTILLERY: ['Arrow IV', 'Long Tom', 'Sniper']
  },
  EQUIPMENT: {
    ELECTRONICS: ['ECM', 'BAP', 'C3', 'TAG'],
    PHYSICAL: ['Claws', 'Sword', 'Hatchet'],
    DEFENSIVE: ['AMS', 'CASE', 'Reactive Armor'],
    MOVEMENT: ['MASC', 'TSM', 'Jump Jets']
  },
  AMMUNITION: {
    // Grouped by weapon type
  }
};
```

#### 2.3 Equipment Validation
```typescript
interface EquipmentValidator {
  checkTechLevel(equipment: FullEquipment, unit: EditableUnit): boolean;
  checkWeight(equipment: FullEquipment, unit: EditableUnit): boolean;
  checkSlots(equipment: FullEquipment, unit: EditableUnit): boolean;
  checkCompatibility(equipment: FullEquipment, unit: EditableUnit): boolean;
  checkMutualExclusion(equipment: FullEquipment, unit: EditableUnit): string[];
}
```

### Phase 3: Enhanced UX Features

#### 3.1 Equipment Quick Actions
- Favorites system
- Recent equipment list
- Equipment sets/loadouts
- Quick filters (weapons only, etc.)

#### 3.2 Equipment Information
- Detailed tooltips
- Comparison view
- Rules/fluff text display
- Visual equipment browser

#### 3.3 Bulk Operations
- Add multiple of same equipment
- Equipment packages (e.g., "Brawler Package")
- Copy loadout from another unit
- Equipment optimization suggestions

## Component Integration

```
EquipmentTab
├── EquipmentSplitPane
│   ├── LoadoutPanel
│   │   ├── LoadoutControls
│   │   │   ├── RemoveButton
│   │   │   └── RemoveAllButton
│   │   └── LoadoutList
│   │       ├── EquipmentGroup
│   │       └── EquipmentItem
│   │           ├── NameDisplay
│   │           ├── SizeControl
│   │           └── LocationDisplay
│   └── DatabasePanel
│       ├── FilterControls
│       │   ├── CategoryFilter
│       │   ├── TechFilter
│       │   ├── SearchBox
│       │   └── ViewModeToggle
│       └── EquipmentTable
│           ├── HeaderRow
│           └── EquipmentRow
└── EquipmentValidation
```

## Key Differences from MegaMekLab

### Improvements
1. **Better Filtering**: Faceted search, saved filters
2. **Visual Categories**: Icons and grouping
3. **Drag & Drop**: Between database and loadout
4. **Smart Suggestions**: Based on role and remaining tonnage
5. **Responsive Design**: Mobile-friendly layout

### New Features
1. **Equipment Sets**: Save and load configurations
2. **Comparison Tool**: Compare multiple items
3. **Build Templates**: Role-based equipment packages
4. **Visual Browser**: Image-based equipment selection
5. **Advanced Search**: Full-text and parameter search

## Implementation Priority

### High Priority (Core)
1. Equipment database with basic filtering
2. Loadout list with add/remove
3. Basic validation
4. Equipment categories

### Medium Priority (Enhanced)
1. Advanced filtering
2. Drag & drop support
3. Variable size equipment
4. Equipment tooltips

### Low Priority (Advanced)
1. Equipment sets/templates
2. Visual browser
3. Optimization suggestions
4. Comparison tools

## Data Structures

### Equipment Placement
```typescript
interface EquipmentPlacement {
  id: string;
  equipment: FullEquipment;
  location: string; // LOC_NONE initially
  slots: number[]; // Empty until allocated
  size?: number; // For variable equipment
  linkedId?: string; // For split equipment
  isRear?: boolean;
  isTurretMounted?: boolean;
}
```

### Equipment Validation Result
```typescript
interface EquipmentValidationResult {
  canAdd: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  suggestions?: EquipmentSuggestion[];
  requiredSlots: number;
  weightRemaining: number;
}
```

## Testing Strategy

### Unit Tests
- Equipment filtering logic
- Addition strategies
- Validation rules
- Category assignment

### Integration Tests
- Add/remove flow
- Filter combinations
- Drag and drop
- Bulk operations

### E2E Tests
- Complete equipment selection
- Critical allocation flow
- Save/load equipment sets
- Performance with large databases

This comprehensive analysis provides the foundation for implementing a modern, user-friendly equipment management system that improves upon MegaMekLab while maintaining compatibility.
