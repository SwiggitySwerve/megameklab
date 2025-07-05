# BattleTech Construction Rules Validation Report

## Executive Summary

After conducting a comprehensive review of the BattleTech Editor App's construction rules implementation, I have identified several critical discrepancies between the codebase and official BattleTech construction rules from the TechManual. **The previous test fixes changed implementations to match test expectations rather than ensuring both tests and implementations follow official BattleTech rules.**

## Critical Issues Found

### 1. **ARMOR POINT CALCULATIONS - INCORRECT VALUES**

**Issue**: Multiple inconsistent armor efficiency values throughout the codebase that do not match official BattleTech rules.

**Official BattleTech Rules (TechManual)**:
- Standard Armor: **16 points per ton**
- Ferro-Fibrous (IS): **17.92 points per ton** (12% improvement)
- Ferro-Fibrous (Clan): **19.2 points per ton** (20% improvement)
- Light Ferro-Fibrous: **16.8 points per ton** (5% improvement)
- Heavy Ferro-Fibrous: **19.2 points per ton** (20% improvement)

**Found in Codebase**:

1. **Correct Implementation** (`utils/armorCalculations.ts`):
```typescript
'Ferro-Fibrous': {
  pointsPerTon: 17.92, // ✓ CORRECT
  criticalSlots: 14,
  techBase: 'Inner Sphere'
}
```

2. **INCORRECT Implementation** (`services/validation/focused/WeightValidator.ts:326-332`):
```typescript
case 'Ferro-Fibrous':
  armorWeight = totalArmor / 17.6; // ❌ WRONG - Should be 17.92
case 'Light Ferro-Fibrous':
  armorWeight = totalArmor / 19.2; // ❌ WRONG - Should be 16.8
case 'Heavy Ferro-Fibrous':
  armorWeight = totalArmor / 16.8; // ❌ WRONG - Should be 19.2
```

3. **Test Expectations** (`__tests__/utils/criticalSlots/UnitCriticalManager.test.ts`):
```typescript
// Tests expect incorrect values of 20 and 18 instead of official 17.92 and 16.8
```

### 2. **HEAT SINK CALCULATION ERRORS**

**Issue**: Heat calculation methods returning structured objects when tests expect flat objects.

**Problem**: The implementation was changed to match test expectations rather than maintaining proper heat calculation structure:

```typescript
// BEFORE (Correct structure):
return {
  inputs: { weaponHeat, runningHeat },
  value: totalHeat,
  breakdown: { weapons: weaponHeat, movement: runningHeat }
};

// AFTER (Changed to match tests):
return {
  totalHeat: weaponHeat + runningHeat,
  weaponHeat,
  movementHeat: runningHeat
};
```

### 3. **ENGINE WEIGHT CALCULATIONS**

**Issue**: Inconsistent engine weight calculation formulas across different services.

**Found Issues**:
- Some services use `engineRating / 25` (incorrect)
- Others use complex step functions based on rating ranges
- Official BattleTech uses specific engine weight tables

### 4. **VALIDATION RULE INTEGRITY**

**Issue**: Equipment validation returning different error types than expected by construction rules.

**Example**: Engine placement validation expecting `rule_violation` but implementation returns `location_invalid`.

## Specific Code Locations Requiring Correction

### 1. WeightValidator.ts (Lines 321-338)
```typescript
// INCORRECT - Fix these values:
case 'Ferro-Fibrous':
  armorWeight = totalArmor / 17.92; // Not 17.6
case 'Light Ferro-Fibrous':
  armorWeight = totalArmor / 16.8;  // Not 19.2
case 'Heavy Ferro-Fibrous':
  armorWeight = totalArmor / 19.2;  // Not 16.8
```

### 2. CalculationUtilitiesManager.ts (Heat Methods)
Need to restore proper structured return values for heat calculations while updating tests to expect correct structure.

### 3. UnitCriticalManager.test.ts
Tests expecting armor efficiency values of 20 and 18 need to be corrected to official values of 17.92 and 16.8.

## Official BattleTech Construction Rules Reference

### Armor Rules (TechManual p. 205)
- **Maximum Armor**: 2× Internal Structure per location (except head = 9 max)
- **Standard Armor**: 16 points per ton, 0 critical slots
- **Ferro-Fibrous (IS)**: 17.92 points per ton, 14 critical slots
- **Ferro-Fibrous (Clan)**: 19.2 points per ton, 7 critical slots
- **Light Ferro-Fibrous**: 16.8 points per ton, 7 critical slots
- **Heavy Ferro-Fibrous**: 19.2 points per ton, 21 critical slots

### Weight Rules
- **Total Weight**: Must not exceed tonnage rating
- **Minimum Weight**: Typically 95% of tonnage rating
- **Fractional Accounting**: Optional rule allowing kg-level precision

### Heat Sink Rules
- **Engine Heat Sinks**: Built into engine (10 for most engines)
- **External Heat Sinks**: Additional heat sinks in critical slots
- **Double Heat Sinks**: 2× dissipation, same weight as single

## Recommended Actions

### Immediate (Critical)
1. **Fix armor point calculations** in `WeightValidator.ts` to use official values
2. **Correct test expectations** to match official BattleTech rules
3. **Restore proper heat calculation structure** in `CalculationUtilitiesManager.ts`

### Short-term (Important)
1. **Standardize engine weight calculations** across all services
2. **Implement proper equipment validation error types**
3. **Add validation against official construction tables**

### Long-term (Enhancement)
1. **Create official BattleTech rules reference module**
2. **Implement construction rule compliance scoring**
3. **Add support for advanced construction options (Fractional Accounting, Patchwork Armor)**

## Impact Assessment

**High Risk Areas**:
- Armor weight calculations affecting unit viability
- Heat management validation for weapon loadouts
- Equipment placement validation for tournament legality

**Medium Risk Areas**:
- Engine weight calculations affecting tonnage balance
- Critical slot allocation for advanced technologies

**Low Risk Areas**:
- UI display formatting
- Non-critical recommendation systems

## Conclusion

The current implementation has been compromised by changing core construction rule logic to match test expectations rather than ensuring both tests and implementation follow official BattleTech rules. This violates the fundamental principle that **implementations must follow the rules of construction**, not test expectations.

**Recommendation**: Revert implementation changes and correct test expectations to align with official BattleTech TechManual construction rules.