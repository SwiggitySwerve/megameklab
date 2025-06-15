# Equipment Color Coding System

## Overview
Added visual clarity to equipment in the critical section through a comprehensive color coding system that applies to both the critical slots diagram and unallocated equipment lists.

## Color Scheme

### System Components (Dark Gray)
- **Color**: #374151 (bg-gray-700)
- **Applies to**: Engine, Gyro, Cockpit, Life Support, Sensors, Actuators
- **Characteristics**: Cannot be removed, fixed components

### Unhittable Components (Light Gray)
- **Color**: #6B7280 (bg-gray-500)
- **Applies to**: Endo Steel, Ferro-Fibrous, and other structure/armor components
- **Characteristics**: Take up critical slots but cannot be targeted

### Energy Weapons (Yellow)
- **Color**: #D97706 (bg-yellow-600)
- **Applies to**: Lasers, PPCs, Flamers, Plasma Rifles
- **Characteristics**: High visibility for energy-based weapons

### Ballistic Weapons (Purple)
- **Color**: #7C3AED (bg-purple-600)
- **Applies to**: Autocannons, Machine Guns, Gauss Rifles
- **Characteristics**: Distinguished from energy weapons

### Missile Weapons (Teal)
- **Color**: #14B8A6 (bg-teal-600)
- **Applies to**: SRMs, LRMs, MRMs, Streak missiles
- **Characteristics**: Clear visual indicator for missile systems

### Movement Equipment (Blue)
- **Color**: #2563EB (bg-blue-600)
- **Applies to**: Jump Jets, MASC, Supercharger, TSM
- **Characteristics**: Movement enhancement equipment

### Heat Sinks (Green)
- **Color**: #059669 (bg-green-600)
- **Applies to**: Single Heat Sinks, Double Heat Sinks
- **Characteristics**: Heat management components

### Armor/Structure (Rose)
- **Color**: #E11D48 (bg-rose-600)
- **Applies to**: Special armor and structure types
- **Characteristics**: Defensive components

### Ballistic Ammunition (Lavender)
- **Color**: #C084FC (bg-purple-400)
- **Applies to**: Autocannon, Machine Gun, Gauss Rifle ammo
- **Characteristics**: Lighter shade of ballistic weapon color

### Missile Ammunition (Aqua)
- **Color**: #5EEAD4 (bg-cyan-400)
- **Applies to**: SRM, LRM, MRM, Streak missile ammo
- **Characteristics**: Lighter shade of missile weapon color

### Energy Ammunition (Light Yellow)
- **Color**: #FDE047 (bg-yellow-400)
- **Applies to**: Plasma Rifle ammo
- **Characteristics**: Lighter shade of energy weapon color

### Electronics (Green)
- **Color**: #10B981 (bg-green-500)
- **Applies to**: ECM, BAP, C3, Targeting Computers
- **Characteristics**: Electronic warfare and targeting systems

### Physical Weapons (Red)
- **Color**: #DC2626 (bg-red-600)
- **Applies to**: Hatchets, Swords, Claws
- **Characteristics**: Melee combat equipment

### Miscellaneous Equipment (Medium Gray)
- **Color**: #4B5563 (bg-gray-600)
- **Applies to**: Equipment not in other categories
- **Characteristics**: General equipment

### Empty Slots (Dark Background)
- **Color**: #1E293B (bg-slate-800)
- **Applies to**: Unoccupied critical slots
- **Characteristics**: Dashed border, lower opacity

## Implementation Details

### Files Created
1. **`utils/equipmentColors.ts`**
   - Central color definition and categorization logic
   - `getEquipmentCategory()` - Determines equipment category
   - `getEquipmentColorClasses()` - Returns Tailwind classes
   - `getEquipmentColorStyle()` - Returns inline styles if needed
   - `getEquipmentColorLegend()` - Provides legend data

### Files Updated
1. **`components/editor/criticals/CriticalSlotDropZone.tsx`**
   - Integrated color coding into critical slot rendering
   - Applied color classes based on equipment type

2. **`components/editor/criticals/CriticalSlotDropZone.module.css`**
   - Modified to work with Tailwind color classes
   - Removed hardcoded colors, using dynamic classes instead

3. **`components/editor/equipment/DraggableEquipmentItem.tsx`**
   - Applied color coding to unallocated equipment items
   - Shows consistent colors between list and slots

4. **`components/editor/equipment/DraggableEquipmentItem.module.css`**
   - Updated to support dynamic coloring
   - Enhanced hover effects with brightness filter

## Usage

### In Critical Slots
```typescript
const colorClasses = getEquipmentColorClasses(equipment.name);
// Apply: colorClasses.bg, colorClasses.border, colorClasses.text
```

### In Equipment Lists
```typescript
const colorClasses = getEquipmentColorClasses(equipment.name);
className={`${styles.container} ${colorClasses.bg} ${colorClasses.border} ${colorClasses.text}`}
```

## Benefits
1. **Visual Clarity**: Instant recognition of equipment types
2. **Consistency**: Same colors in both critical slots and equipment lists
3. **Accessibility**: High contrast colors for readability
4. **Maintainability**: Centralized color definitions
5. **Extensibility**: Easy to add new equipment categories

## Future Enhancements
1. Add a color legend component to display in the UI
2. Allow user customization of color schemes
3. Add colorblind-friendly alternative palettes
4. Implement tooltips showing equipment category on hover
