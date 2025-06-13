# MegaMekLab Armor System Screen-by-Screen Breakdown

## Structure/Armor Tab Layout

### Overall Tab Organization
```
+----------------------------------------------------------+
|  Structure/Armor Tab                                      |
+----------------------------------------------------------+
| +----------------+ +----------------+ +----------------+  |
| | Left Column    | | Center Column  | | Right Column   |  |
| |                | |                | |                |  |
| | - Basic Info   | | - Heat Sinks   | | - Armor Type   |  |
| | - Icon         | | - Movement     | | - Allocation   |  |
| | - Chassis      | | - LAM Fuel     | | - Patchwork   |  |
| |                | | - Summary      | |                |  |
| +----------------+ +----------------+ +----------------+  |
+----------------------------------------------------------+
```

## Detailed Component Breakdown

### 1. MVFArmorView (Armor Type Selection)
```
+----------------------------------------+
| Armor                                  |
+----------------------------------------+
| Type: [Standard         ▼]            |
| Tonnage: [___10.5___] ○ Maximize      |
|          ○ Use Remaining Tonnage       |
+----------------------------------------+
```

Features:
- Dropdown for armor type selection
- Numeric input for tonnage (0.5 ton increments)
- Maximize button (sets to max allowed)
- Use remaining tonnage button

### 2. ArmorAllocationView (Main Diagram)

#### 2.1 Mech Layout
```
+----------------------------------------+
| Armor Allocation                       |
+----------------------------------------+
|              [Head]                    |
|               □ 9                      |
|                                        |
| [LA]    [LT]    [CT]    [RT]    [RA]  |
|  □ 20   □ 22   □ 31    □ 22    □ 20  |
|         ■ 7    ■ 10     ■ 7           |
|                                        |
|      [LL]    [CL]     [RL]            |
|      □ 26            □ 26             |
+----------------------------------------+
| Unallocated:     0                    |
| Allocated:       168                   |
| Total:           168                   |
| Max Possible:    279                   |
| Wasted:          0                     |
| Points/Ton:      16.00                 |
+----------------------------------------+
| [       Auto-Allocate       ]          |
+----------------------------------------+
```

□ = Front armor spinner
■ = Rear armor spinner (torso locations only)

#### 2.2 Tank Layout
```
+----------------------------------------+
|              [Front]                   |
|               □ 40                     |
|                                        |
| [Left]    [Turret]      [Right]       |
|  □ 30      □ 40          □ 30         |
|                                        |
|           [Turret 2]                   |
|             □ 0                        |
|                                        |
|              [Rear]                    |
|              □ 25                      |
+----------------------------------------+
```

#### 2.3 VTOL Layout
```
+----------------------------------------+
|              [Front]                   |
|               □ 20                     |
|                                        |
| [Left]     [Rotor]      [Right]       |
|  □ 15       □ 2          □ 15         |
|                                        |
|            [Turret]                    |
|              □ 0                       |
|                                        |
|              [Rear]                    |
|              □ 15                      |
+----------------------------------------+
```

### 3. ArmorLocationView (Individual Location)
```
+-------------+
| RT          |
+-------------+
| Front: □ 22 |
| Rear:  □ 7  |
| (max: 30)   |
+-------------+
```

Components:
- Location name as title
- Front armor spinner (always shown)
- Rear armor spinner (conditional)
- Max armor display

### 4. PatchworkArmorView
```
+----------------------------------------+
| Patchwork Armor                        |
+----------------------------------------+
| Head:    [Standard        ▼]          |
| CT:      [Ferro-Fibrous   ▼]          |
| LT:      [Standard        ▼]          |
| RT:      [Standard        ▼]          |
| LA:      [Light FF        ▼]          |
| RA:      [Light FF        ▼]          |
| LL:      [Standard        ▼]          |
| RL:      [Standard        ▼]          |
+----------------------------------------+
```

Shows only when patchwork armor is selected.

## Interaction Flows

### 1. Basic Armor Allocation
1. User selects armor type from dropdown
2. Sets total armor tonnage
3. Adjusts individual location values
4. System shows real-time statistics

### 2. Auto-Allocation Process
1. User clicks "Auto-Allocate" button
2. Algorithm distributes based on:
   - Head gets 5x normal percentage
   - Torsos get 75% front, 25% rear
   - Remaining distributed by IS ratio
   - Leftover points allocated smartly

### 3. Patchwork Mode
1. User selects "Patchwork" armor type
2. Patchwork panel appears
3. User selects armor type per location
4. System calculates total weight
5. Auto-allocate disabled

## Visual Feedback

### Color Coding
- **Red**: Unallocated points > 0
- **Normal**: Balanced allocation
- **Disabled**: Read-only mode

### Constraints
- Spinners enforce min/max values
- Can't exceed location maximum
- Front + Rear ≤ Max for location
- Real-time validation

## Responsive Behavior

### Desktop (Full View)
- All columns visible
- Spacious layout
- Hover tooltips

### Tablet (Compact View)
- Columns stack vertically
- Slightly reduced spacing
- Touch-friendly controls

### Mobile (Minimal View)
- Single column
- Collapsible sections
- Larger touch targets

## Key UX Patterns

### 1. Immediate Feedback
- Changes apply instantly
- Statistics update real-time
- Visual indicators for issues

### 2. Smart Defaults
- Auto-allocate for quick setup
- Sensible initial values
- Role-based presets

### 3. Error Prevention
- Spinners prevent invalid values
- Clear maximum indicators
- Helpful tooltips

### 4. Efficiency Tools
- Maximize armor button
- Use remaining tonnage
- Symmetric allocation helpers

## Implementation Notes

### From MegaMekLab Code
1. **Layout Arrays**: Define position grids
2. **Dynamic Creation**: Build based on unit type
3. **Event Handling**: Change listeners on spinners
4. **Validation**: Enforce constraints in setters
5. **Statistics**: Calculate and display totals

### React Adaptations
1. **State Management**: Use React hooks
2. **Components**: Modular, reusable parts
3. **Styling**: CSS-in-JS or Tailwind
4. **Accessibility**: ARIA labels, keyboard nav
5. **Testing**: Unit and integration tests

This detailed breakdown provides a complete picture of how the armor system works in MegaMekLab and how we can implement it in React.
