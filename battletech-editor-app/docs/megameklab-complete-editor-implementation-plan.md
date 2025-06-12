# MegaMekLab Complete Editor Implementation Plan

## Overview
This document outlines the complete implementation plan for all MegaMekLab editor tabs, building on the completed Structure/Armor tab.

## Status Summary

### ✅ Completed: Structure/Armor Tab
- Basic Information panel
- Chassis configuration 
- Heat sink management
- Movement system
- Armor allocation with visual diagram
- Summary panel with calculations
- Full validation system
- Performance optimizations

### 📋 Remaining Tabs to Implement

## Equipment Tab Implementation Plan

### Overview
The Equipment tab handles weapon and equipment selection, with three main panels:
1. Current Load Out (left)
2. Equipment Database (right)
3. Unallocated Equipment (top right)

### Components to Implement

#### 1. Current Load Out Panel
```typescript
interface CurrentLoadOut {
  items: Array<{
    name: string;
    tons: number;
    crits: number;
    heat: number;
    location: string;
    size: string;
  }>;
  controls: {
    remove: () => void;
    removeAll: () => void;
  };
}
```

Features:
- Table showing equipped items
- Columns: Name, Tons, Crits, Heat, Loc, Size
- Remove/Remove All buttons
- Sortable columns

#### 2. Equipment Database Panel
```typescript
interface EquipmentDatabase {
  filters: {
    categories: {
      energy: boolean;
      ballistic: boolean;
      missile: boolean;
      artillery: boolean;
      physical: boolean;
      ammo: boolean;
      other: boolean;
    };
    hideOptions: {
      prototype: boolean;
      oneShot: boolean;
      torpedoes: boolean;
      ammoWithoutWeapon: boolean;
      unavailable: boolean;
    };
  };
  searchText: string;
  equipment: Array<EquipmentItem>;
  addButton: () => void;
}
```

Features:
- Category filter buttons (Energy, Ballistic, Missile, etc.)
- Hide options checkboxes
- Text search with filter
- Equipment table with columns:
  - Name, Damage, Heat, Min R, Range, Shots, Base, BV, Weight, Crit, Reference
- "Switch Table Columns" button
- "<< Add" button for selected items

#### 3. Unallocated Equipment Panel
Shows equipment added but not yet assigned to locations

### Implementation Phases
1. Create equipment database structure
2. Implement filtering system
3. Build equipment selection UI
4. Connect to unit data model
5. Implement drag & drop between panels

## Assign Criticals Tab Implementation Plan

### Overview
Visual critical slot assignment interface showing mech internal structure

### Layout
- Center: Mech internal structure diagram
- Each location shows critical slots as grid
- Drag & drop equipment to slots
- Visual feedback for valid/invalid placements

### Components

#### 1. Critical Slot Grid
```typescript
interface CriticalSlotGrid {
  location: string; // Head, CT, LT, RT, LA, RA, LL, RL
  slots: Array<{
    index: number;
    content: string | null;
    isFixed: boolean; // For engine, gyro, etc.
  }>;
  maxSlots: number; // 6 for head, 12 for others
}
```

#### 2. Auto-Assignment Functions
- Auto Fill Unallocated
- Auto Compact
- Auto Sort
- Fill/Compact/Sort individual buttons
- Reset button

### Implementation Phases
1. Create critical slot visualization
2. Implement fixed equipment placement (engine, gyro, etc.)
3. Add drag & drop functionality
4. Implement auto-assignment algorithms
5. Add validation for legal placements

## Fluff Tab Implementation Plan

### Overview
Unit description and background information

### Fields to Implement
- Unit Overview (large text area)
- Capabilities (text area)
- Battle History (text area)
- Deployment (text area)
- Variants (text area)
- Notable Pilots (text area)
- Notes (text area)

### Features
- Rich text editing support
- Import/Export text functionality
- Character count display
- Auto-save drafts

## Quirks Tab Implementation Plan

### Overview
Positive and negative unit quirks selection

### Layout
- Two columns: Positive Quirks (left), Negative Quirks (right)
- Checkbox lists for each category
- Search/filter functionality

### Quirk Categories

#### Positive Quirks
- Animalistic Appearance
- Anti-Aircraft Targeting
- Battle Computer
- Battle Fists (LA/RA)
- Combat Computer
- Command Mek
- Compact Mek
- Cowl
- Directional Torso Mount
- Distracting
- Easy to Maintain
- Easy to Pilot
- Extended Torso Twist
- Fast Reload
- Fine Manipulators
- Good Reputation
- Hyper-Extending Actuators
- Improved Communications
- Improved Life Support
- Improved Sensors
- Improved Targeting (Long/Medium/Short)
- Multi-Trac
- Narrow/Low Profile
- Nimble Jumper
- Overhead Arms
- Protected Actuators
- Reinforced Legs
- Rugged
- Searchlight
- Stable
- Ubiquitous (Clans/Inner Sphere)
- Variable Range Targeting (long/short)
- Vestigial Hands (Left/Right)

#### Negative Quirks
- Bad Reputation (Clan/Inner Sphere)
- Cramped Cockpit
- Difficult Ejection
- Difficult to Maintain
- EM Interference
- Exposed Actuators
- Flawed Cooling System
- Hard to Pilot
- Illegal Design
- Low-Mounted Arms
- No Ejection System
- No/Minimal Arms
- No Torso Twist
- Non-Standard Parts
- Obsolete
- Poor Life Support
- Poor Performance
- Poor Sealing
- Poor Targeting (Long/Medium/Short)
- Poor Workmanship
- Prototype
- Ramshackle
- Sensor Ghosts
- Susceptible to Centurion Weapon System
- Unbalanced
- Weak Head Armor
- Weak Legs

### Special Quirks (Weapons)
- Accurate Weapon
- Ammo Feed Problems
- Directional Torso Mounted Weapon
- Exposed Weapon Linkage
- Fast Reload
- Improved Cooling Jacket
- Inaccurate Weapon
- Jettison-Capable Weapon
- Misrepaired Weapon
- Misreplaced Weapon
- Modular Weapon
- Non-Functional
- Poor Cooling Jacket
- Stabilized Weapon

### Implementation
1. Create quirk data structure
2. Build checkbox UI with categories
3. Implement search/filter
4. Connect to unit data
5. Add quirk effects to calculations

## Preview Tab Implementation Plan

### Overview
Final unit summary and record sheet preview

### Components
1. Unit summary statistics
2. Record sheet preview (HTML/PDF generation)
3. Export options
4. Print functionality

### Features
- Multiple record sheet formats
- Export to various formats (PDF, HTML, MTF, MUL)
- Print preview
- Custom record sheet templates

## Integration Requirements

### Cross-Tab Dependencies
1. Equipment affects:
   - Weight calculations (Structure/Armor)
   - Critical slot assignments
   - Heat generation
   - Battle Value

2. Quirks affect:
   - Movement calculations
   - Targeting modifiers
   - Maintenance costs
   - Battle Value

3. Critical assignments affect:
   - Legal equipment placement
   - Damage transfer rules
   - Equipment functionality

### Data Model Updates
```typescript
interface CompleteUnit extends Unit {
  equipment: EquipmentLoadout;
  criticals: CriticalAssignments;
  fluff: UnitFluff;
  quirks: {
    positive: string[];
    negative: string[];
    weapons: WeaponQuirk[];
  };
}
```

## Implementation Priority
1. Equipment Tab (core functionality)
2. Assign Criticals Tab (required for legal builds)
3. Quirks Tab (affects calculations)
4. Preview Tab (output generation)
5. Fluff Tab (descriptive only)

## Timeline Estimate
- Equipment Tab: 3-4 days
- Assign Criticals Tab: 2-3 days
- Quirks Tab: 1-2 days
- Preview Tab: 2-3 days
- Fluff Tab: 1 day
- Integration & Testing: 2-3 days

Total: 11-17 days for complete implementation
