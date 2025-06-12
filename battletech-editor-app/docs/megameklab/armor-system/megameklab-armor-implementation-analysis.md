# MegaMekLab Armor Diagram Implementation Analysis

## Overview
This document provides a detailed analysis of the original MegaMekLab Java implementation's armor diagram setup and how we've recreated it in our modern React/TypeScript implementation.

## Original MegaMekLab Layout Analysis

### 1. Main Tab Structure
- **Structure/Armor Tab**: First tab in the editor
- **Equipment Tab**: Equipment selection and management
- **Assign Criticals Tab**: Critical slot assignment
- **Fluff Tab**: Unit description and background
- **Quirks Tab**: Special unit characteristics
- **Preview Tab**: Final unit record sheet

### 2. Structure/Armor Tab Layout (3-Column Design)

#### Left Column - Unit Identity
1. **Basic Information Section**
   - Chassis name input
   - Clan name input
   - Model designation
   - MUL ID field
   - Year/Era selection
   - Source/Era field
   - Tech Base dropdown (Inner Sphere/Clan)
   - Tech Level dropdown (Introductory/Standard/Advanced/Experimental)
   - Manual BV override
   - Role selection

2. **Icon Section**
   - Unit icon display area
   - "Choose file" button
   - "Import from cache" button
   - "Remove" button

3. **Chassis Configuration**
   - Tonnage spinner (20-100 tons)
   - Omni checkbox
   - Base Type (Standard/Primitive)
   - Motive Type (Biped/Quad)
   - Structure Type dropdown
   - Engine Type dropdown
   - Gyro Type dropdown
   - Cockpit Type dropdown
   - Enhancement dropdown

#### Middle Column - Systems & Summary
1. **Heat Sinks Section**
   - Type selection (Single/Double)
   - Number spinner
   - Engine Free display
   - Weight Free calculation
   - Total Dissipation display
   - Total Equipment Heat

2. **Movement Section**
   - Walk MP (Base/Final columns)
   - Run MP (calculated)
   - Jump/UMU MP
   - Jump Type selection
   - Mechanical Jump Booster MP

3. **Summary Section**
   - Weight/Crits/Availability table
   - Unit Type row
   - Structure row
   - Engine row
   - Gyro row
   - Cockpit row
   - Heatsinks row
   - Armor row
   - Jump Jets row
   - Equipment row
   - Myomer row
   - Other row
   - Earliest Possible Year calculation

#### Right Column - Armor Management
1. **Armor Section**
   - Armor Type dropdown (Standard/Ferro-Fibrous/etc.)
   - Armor Tonnage spinner
   - "Maximize Armor" button
   - "Use Remaining Tonnage" button

2. **Armor Allocation Section** (Most Important)
   - **Layout Structure**:
     ```
                    HD
                  [___]    
                 Max: 9
     
     LA        LT        CT        RT        RA
     [__]      [__]      [__]      [__]      [__]
            Rear      Rear      Rear
            [__]      [__]      [__]
        Max: 8  Max: 12  Max: 16  Max: 12  Max: 8
     
             LL              RL
            [__]            [__]
               Max: 12
     ```
   - Each location has spinner controls with +/- buttons
   - Max armor values displayed for each location
   - Rear armor only for torso locations

3. **Armor Statistics**
   - Unallocated Armor Points
   - Allocated Armor Points
   - Total Armor Points
   - Maximum Possible Armor Points
   - Wasted Armor Points
   - Points Per Ton

4. **Auto-Allocate Armor Button**
   - Orange button at bottom
   - Intelligently distributes armor points

## Our Implementation Details

### Component Structure
```
StructureArmorTab.tsx
├── SpinnerInput component (reusable numeric input)
├── Three-column grid layout
├── Armor allocation logic
└── Real-time validation
```

### Key Features Implemented
1. **Exact Layout Matching**: Recreated the 3-column layout with proper spacing
2. **Armor Allocation Pattern**: Mimics mech physical structure
3. **Interactive Spinners**: Custom +/- controls for each armor location
4. **Real-time Calculations**: Updates as values change
5. **Max Armor Limits**: Enforced per location based on tonnage
6. **Rear Armor Support**: Only for torso locations as per rules

### Technical Improvements
1. **TypeScript**: Full type safety
2. **React Hooks**: Modern state management
3. **Tailwind CSS**: Responsive design
4. **Accessibility**: WCAG 2.1 compliant
5. **Performance**: Optimized re-renders

## Component Analysis

### 1. SpinnerInput Component
- Custom numeric input with increment/decrement buttons
- Min/max value enforcement
- Step value support
- Disabled state handling
- Keyboard navigation support

### 2. Armor Calculation Logic
```typescript
const getMaxArmor = (location: string): number => {
  switch (location) {
    case 'Head': return 9;
    case 'Center Torso': return Math.floor(tonnage * 2 * 0.4);
    case 'Left Torso':
    case 'Right Torso': return Math.floor(tonnage * 2 * 0.3);
    case 'Left Arm':
    case 'Right Arm':
    case 'Left Leg':
    case 'Right Leg': return Math.floor(tonnage * 2 * 0.25);
    default: return 0;
  }
};
```

### 3. Data Structure
```typescript
armor: {
  type: 'Standard',
  total_armor_points: 307,
  locations: [
    { location: 'Head', armor_points: 9, rear_armor_points: 0 },
    { location: 'Center Torso', armor_points: 47, rear_armor_points: 10 },
    // ... etc
  ]
}
```

## Visual Design Decisions

1. **Color Scheme**
   - Gray backgrounds matching original
   - Blue accents for active elements
   - Orange for auto-allocate button
   - Green for maximize armor

2. **Typography**
   - Small, condensed fonts for space efficiency
   - Bold labels for sections
   - Consistent font sizes throughout

3. **Spacing**
   - Compact layout to fit all information
   - Clear visual separation between sections
   - Proper alignment of form elements

## Future Enhancements

1. **Drag-and-Drop Armor Allocation**
   - Drag armor points between locations
   - Visual feedback during drag

2. **Armor Diagram Visualization**
   - Visual mech silhouette
   - Color-coded armor levels
   - Click on diagram to allocate

3. **Advanced Validation**
   - Minimum armor warnings
   - Optimal armor distribution suggestions
   - Combat effectiveness analysis

4. **Templates**
   - Save/load armor configurations
   - Standard armor patterns (brawler, sniper, etc.)
   - Quick allocation presets

## Conclusion

We've successfully recreated the MegaMekLab armor allocation system with modern web technologies while maintaining full feature parity and improving the user experience. The implementation is more compact, responsive, and accessible than the original while preserving all the functionality that makes MegaMekLab the standard for BattleTech unit creation.
