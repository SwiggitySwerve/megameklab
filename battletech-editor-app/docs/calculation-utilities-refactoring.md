# Calculation Utilities Refactoring

## Overview
This document describes the refactoring of all component calculations into dedicated utility files, extracting multipliers and common calculations for consistent use across the application.

## Created Utility Files

### 1. `utils/engineCalculations.ts`
**Purpose**: Centralized calculations for all engine types

**Key Features**:
- Engine weight multipliers (Standard: 1.0, XL: 0.5, Light: 0.75, etc.)
- Slot requirements (Standard: 6, XL: 12, Light: 10, etc.)
- Integrated heat sink calculations
- Walk MP calculations
- Validation functions

**Example Usage**:
```typescript
const weight = calculateEngineWeight(300, 75, 'XL'); // 11.25 tons
const slots = calculateEngineSlots('XL'); // 12 slots
const integratedHS = calculateIntegratedHeatSinks(300, 'Standard'); // 10
```

### 2. `utils/structureCalculations.ts`
**Purpose**: Centralized calculations for all structure types

**Key Features**:
- Structure weight multipliers (Standard: 0.1, Endo Steel: 0.05, etc.)
- Slot requirements (Endo Steel: 14 IS/7 Clan)
- Internal structure point tables
- Tech base and rules level validation

**Example Usage**:
```typescript
const weight = calculateStructureWeight(75, 'Endo Steel'); // 3.75 tons
const slots = getStructureSlots('Endo Steel'); // 14 slots
const maxArmor = calculateMaxArmorPoints(75, 'Standard'); // Based on IS points
```

### 3. `utils/armorCalculations.ts`
**Purpose**: Centralized calculations for all armor types

**Key Features**:
- Points per ton (Standard: 16, Ferro-Fibrous: 17.92, etc.)
- Slot requirements with Clan variants
- Special properties (damage reduction, etc.)
- Tech restrictions and validation

**Example Usage**:
```typescript
const weight = calculateArmorWeight(200, 'Ferro-Fibrous'); // 11.16 tons
const slots = getArmorSlots('Ferro-Fibrous', 'Clan'); // 7 slots
```

### 4. `utils/gyroCalculations.ts`
**Purpose**: Centralized calculations for all gyro types

**Key Features**:
- Weight multipliers (Standard: 1.0, Compact: 1.5, XL: 0.5, etc.)
- Slot requirements (Standard: 4, XL: 6, Compact: 2)
- Special properties (hit points, piloting modifiers)
- Torso-mounted cockpit compatibility

**Example Usage**:
```typescript
const weight = calculateGyroWeight(300, 'Standard'); // 3 tons
const slots = getGyroSlots('XL'); // 6 slots
```

### 5. `utils/cockpitCalculations.ts`
**Purpose**: Centralized calculations for all cockpit types

**Key Features**:
- Fixed weights (Standard: 3, Small: 2, Primitive: 5, etc.)
- Slot distribution (head vs center torso)
- Special properties (ejection, life support, initiative)
- Equipment requirements

**Example Usage**:
```typescript
const weight = getCockpitWeight('Small'); // 2 tons
const slots = getCockpitSlots('Command Console'); // 2 slots
```

### 6. `utils/heatSinkCalculations.ts`
**Purpose**: Centralized calculations for all heat sink types

**Key Features**:
- Dissipation rates (Single: 1, Double: 2)
- Weight per heat sink
- Slot requirements (Single: 1, Double IS: 3, Double Clan: 2)
- Integrated vs external calculations

**Example Usage**:
```typescript
const result = getHeatSinkCalculations(20, 'Double', 300, 'Standard');
// Returns: { totalWeight: 20, engineIntegrated: 10, externalRequired: 10, ... }
```

## Implementation in UnitEditorWithHooks

### Before (Hardcoded Values):
```typescript
// Engine weight calculation
const engineMultiplier = systemComponents.engine.type === 'Standard' ? 1.0 :
                        systemComponents.engine.type === 'XL' ? 0.5 :
                        systemComponents.engine.type === 'Light' ? 0.75 : // etc...
const baseEngineWeight = (systemComponents.engine.rating * unit.mass) / 1000;
weight += Math.ceil(baseEngineWeight * engineMultiplier * 2) / 2;
```

### After (Using Utilities):
```typescript
// Engine weight calculation using utility
weight += calculateEngineWeight(
  systemComponents.engine.rating, 
  unit.mass, 
  systemComponents.engine.type
);
```

## Benefits Achieved

### 1. **Single Source of Truth**
- All multipliers and formulas in one place
- No duplicate calculation logic
- Consistent results across the application

### 2. **Maintainability**
- Easy to update formulas or add new types
- Clear organization by component type
- Self-documenting code with descriptive function names

### 3. **Extensibility**
- Easy to add new equipment types
- Clear patterns for new calculations
- Modular design supports future features

### 4. **Type Safety**
- Full TypeScript support
- Compile-time checking of equipment types
- Clear interfaces for calculation results

### 5. **Testability**
- Pure functions easy to unit test
- Isolated calculation logic
- No side effects

## Common Patterns

### Weight Multipliers
All weight calculations follow the pattern:
```typescript
const WEIGHT_MULTIPLIERS: Record<Type, number> = {
  'Standard': 1.0,
  'Advanced': 0.5,
  // etc.
};
```

### Slot Requirements
Slot calculations use consistent structures:
```typescript
const SLOT_REQUIREMENTS: Record<Type, number | SlotDistribution> = {
  'Type1': 4,
  'Type2': { location1: 2, location2: 2 }
};
```

### Tech Restrictions
Technology validation follows a standard format:
```typescript
const TECH_RESTRICTIONS: Record<Type, {
  techBase: TechBase[];
  rulesLevel: RulesLevel[];
  additionalRequirements?: string[];
}> = { /* ... */ };
```

## Usage Guidelines

1. **Always use utility functions** instead of inline calculations
2. **Import only what you need** to keep bundles small
3. **Use the validation functions** before applying calculations
4. **Leverage TypeScript** for type safety
5. **Extend utilities** rather than creating new calculation locations

## Future Enhancements

1. **Weapon heat calculations** - Extract from equipment database
2. **Jump jet calculations** - Weight and slot requirements
3. **Ammunition calculations** - Tons per shots
4. **Special equipment** - ECM, BAP, etc.
5. **Unit validation** - Comprehensive rules checking
