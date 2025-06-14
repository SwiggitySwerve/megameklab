# Unified Equipment Interface Implementation

## Overview
This document describes the implementation of a unified equipment interface that provides consistent weight and slot accounting across all equipment types in the BattleTech editor.

## Core Interface Structure

### IEquipmentItem
The base interface for all equipment:
```typescript
interface IEquipmentItem {
  name: string;
  weight: number;
  slots: number;
  location?: string;
  type: EquipmentCategory;
}
```

### Equipment Categories
- **System Components**: Engine, Gyro, Cockpit, Actuators, Life Support, Sensors
- **Structure & Armor**: Including special components (Endo Steel, Ferro-Fibrous)
- **Heat Management**: All heat sink types
- **Weapons & Equipment**: Weapons, Ammo, Equipment
- **Special Components**: Endo Steel, Ferro-Fibrous, etc.

## Implementation Areas

### 1. UnitEditorWithHooks - Fully Implemented ✅
- **Weight Calculation**: Uses unified interface to calculate total unit weight
  - Structure weight based on type and tonnage
  - Engine weight with proper multipliers
  - Gyro weight based on engine rating
  - Cockpit weight by type
  - Armor weight based on points and type
  - Equipment weight from unified interface
  
- **Critical Slot Calculation**: 
  - Uses `EquipmentCalculator.getAllEquipmentItems()` to gather all equipment
  - Uses `EquipmentCalculator.calculateTotalSlots()` for total required slots
  - Tracks assigned vs required slots
  
- **Heat Balance Calculation**:
  - Calculates heat generated from weapons
  - Calculates heat dissipated based on heat sink type and count
  - Uses unified interface for consistent calculations

### 2. EquipmentCalculator Utility Class
Provides centralized calculation methods:
- `calculateTotalWeight(items)`: Sums weight from all equipment
- `calculateTotalSlots(items)`: Sums slots from all equipment
- `getAllEquipmentItems()`: Gathers equipment from all sources
- `convertToEquipmentItem()`: Converts raw data to standard interface

### 3. Slot Calculation Methods
Helper methods for specific equipment types:
- `getEngineSlots()`: Returns slots based on engine type
- `getGyroSlots()`: Returns slots based on gyro type
- `getStructureSlots()`: Returns slots for structure components
- `getArmorSlots()`: Returns slots for armor components
- `getHeatSinkSlots()`: Returns slots based on heat sink type

## Benefits

### Single Source of Truth
- All equipment uses the same interface
- No duplicate slot/weight calculation logic
- Consistent handling across all tabs

### No Double Counting
- Equipment is counted exactly once
- Special components handled separately from regular equipment
- Clear separation between system components and user equipment

### Extensibility
- Easy to add new equipment types
- New categories can be added without changing existing code
- Abstract methods make calculations consistent

### Type Safety
- Full TypeScript support
- Compile-time checking of equipment properties
- Clear interfaces for all equipment types

## Weight Calculation Formula

```typescript
Total Weight = 
  + Structure Weight (tonnage * multiplier)
  + Engine Weight (rating * tonnage / 1000 * type multiplier)
  + Gyro Weight (ceiling(rating/100) * type multiplier)
  + Cockpit Weight (fixed by type)
  + Armor Weight (points / points-per-ton)
  + Equipment Weight (sum of all non-system equipment)
```

## Slot Calculation Formula

```typescript
Total Required Slots = 
  + Engine Slots (6-18 based on type)
  + Gyro Slots (2-6 based on type)
  + Fixed Actuators (22 slots)
  + Optional Actuators (lower arm, hand)
  + Structure Components (Endo Steel: 14 IS/7 Clan)
  + Armor Components (Ferro-Fibrous variants)
  + External Heat Sinks (1-3 slots each)
  + Weapons & Equipment (from database)
```

## Heat Calculation Formula

```typescript
Heat Generated = Sum of heat from all weapons
Heat Dissipated = (Engine Heat Sinks + External Heat Sinks) * Dissipation Rate
  where Dissipation Rate = 1 for Single, 2 for Double heat sinks
```

## Next Steps for Full Implementation

### 1. Update CriticalsTabWithHooks
- Use unified interface for unallocated equipment display
- Use EquipmentCalculator for slot validation
- Ensure consistent slot counting

### 2. Update EquipmentTabWithHooks
- Use unified interface for equipment stats display
- Use EquipmentCalculator for weight/slot totals
- Ensure consistent categorization

### 3. Update StructureTabWithHooks
- Use unified interface for component weights
- Use EquipmentCalculator for heat sink calculations
- Ensure consistent special component handling

### 4. Update ArmorTabWithHooks
- Use unified interface for armor weight calculations
- Ensure consistent armor type handling

## Testing Verification

To verify the implementation:
1. Add equipment and check weight updates correctly
2. Add special components and verify no double counting
3. Change structure/armor types and verify slot requirements update
4. Add/remove heat sinks and verify heat dissipation updates
5. Check critical slot count matches actual equipment requirements
