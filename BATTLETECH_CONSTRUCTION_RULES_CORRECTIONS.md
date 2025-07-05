# BattleTech Construction Rules Corrections Report

## Executive Summary

After reviewing the BattleTech Editor App against official BattleTech construction rules, I have identified several critical violations where the implementations do not follow the official TechManual rules. These need to be corrected to ensure proper BattleTech construction validation.

## Critical Corrections Required

### 1. **ENGINE HEAT SINK CALCULATION - INCORRECT MINIMUM**

**Issue**: Multiple files apply an artificial minimum of 10 heat sinks, which violates official BattleTech rules.

**Official Rule**: Engine heat sinks = **Engine Rating ÷ 25** (rounded down), **NO MINIMUM**
- A 25-rating engine provides **1 heat sink** (25 ÷ 25 = 1)
- A 50-rating engine provides **2 heat sinks** (50 ÷ 25 = 2)
- A 250-rating engine provides **10 heat sinks** (250 ÷ 25 = 10)

**Files to Correct**:

1. **services/validation/orchestration/commands/ConfigurationValidationCommand.ts:183**
   ```typescript
   // ❌ INCORRECT - Artificial minimum of 10
   const engineHeatSinks = Math.min(10, Math.floor(engineRating / 25))
   
   // ✅ CORRECT - No minimum, pure formula
   const engineHeatSinks = Math.floor(engineRating / 25)
   ```

2. **battletech-editor-app/services/calculation/CalculationOrchestrator.ts:815**
   ```typescript
   // ❌ INCORRECT
   const engineHeatSinks = Math.min(10, Math.floor(config.engineRating / 25));
   
   // ✅ CORRECT
   const engineHeatSinks = Math.floor(config.engineRating / 25);
   ```

3. **battletech-editor-app/services/allocation/AnalysisManager.ts:462**
   ```typescript
   // ❌ INCORRECT
   const engineHeatSinks = Math.min(10, Math.floor((config.engineRating || 0) / 25));
   
   // ✅ CORRECT
   const engineHeatSinks = Math.floor((config.engineRating || 0) / 25);
   ```

4. **battletech-editor-app/utils/heatSinkCalculations.ts:65-69**
   ```typescript
   // ❌ INCORRECT - Artificial minimum of 10 for 250+ engines
   if (engineRating >= 250) {
     return 10;
   }
   
   // ✅ CORRECT - Remove this condition, use pure formula
   // Just use: return Math.floor(engineRating / 25);
   ```

### 2. **ARMOR POINTS PER TON - INCORRECT VALUES**

**Issue**: Armor efficiency values in WeightValidator.ts do not match official BattleTech TechManual values.

**Official Values (TechManual)**:
- **Standard Armor**: 16 points per ton
- **Ferro-Fibrous**: 17.92 points per ton  
- **Light Ferro-Fibrous**: 16.8 points per ton
- **Heavy Ferro-Fibrous**: 19.2 points per ton

**File to Correct**: `battletech-editor-app/services/validation/focused/WeightValidator.ts:321-338`

```typescript
// ❌ CURRENT (INCORRECT)
case 'Standard':
  armorWeight = totalArmor / 16; // ✓ This one is correct
  break;
case 'Ferro-Fibrous':
  armorWeight = totalArmor / 17.6; // ❌ Should be 17.92
  break;
case 'Light Ferro-Fibrous':
  armorWeight = totalArmor / 19.2; // ❌ Should be 16.8
  break;
case 'Heavy Ferro-Fibrous':
  armorWeight = totalArmor / 16.8; // ❌ Should be 19.2
  break;

// ✅ CORRECTED
case 'Standard':
  armorWeight = totalArmor / 16; // ✓ Correct
  break;
case 'Ferro-Fibrous':
  armorWeight = totalArmor / 17.92; // ✓ Official TechManual value
  break;
case 'Light Ferro-Fibrous':
  armorWeight = totalArmor / 16.8; // ✓ Official TechManual value
  break;
case 'Heavy Ferro-Fibrous':
  armorWeight = totalArmor / 19.2; // ✓ Official TechManual value
  break;
```

### 3. **HEAT CALCULATION STRUCTURE - TESTS EXPECT WRONG FORMAT**

**Issue**: Heat calculation methods were changed to return flat objects instead of the proper structured format.

**Files to Revert**:

1. **battletech-editor-app/services/validation/CalculationUtilitiesManager.ts**
   - Methods should return structured objects with `inputs` and `value` properties
   - Tests should be updated to expect proper structure, not flat objects

2. **Test files expecting flat structure should be corrected**:
   - `CalculationUtilitiesManager.test.ts` expects flat objects like `{ totalHeat: 10 }`
   - Should expect structured objects like `{ inputs: {...}, value: { totalHeat: 10 } }`

### 4. **MINIMUM HEAT SINK REQUIREMENT - WRONG RULE**

**Issue**: The code applies a minimum of 10 heat sinks universally, but BattleTech rules state:
- **Minimum heat sinks = 10 OR number of heat-generating weapons, whichever is higher**
- **NOT** a universal minimum of 10

**Files to Correct**:
- All validation files that check `totalHeatSinks < 10`
- Should check `totalHeatSinks < Math.max(10, heatGeneratingWeapons)`

### 5. **CRITICAL SLOT CALCULATIONS**

**Issue**: Need to verify critical slot calculations follow official rules:
- **Standard Heat Sinks**: 1 critical slot each
- **Double Heat Sinks (IS)**: 3 critical slots each  
- **Double Heat Sinks (Clan)**: 2 critical slots each
- **Engine heat sinks**: 0 critical slots (they're built into the engine)

## Implementation Priority

1. **CRITICAL**: Fix engine heat sink calculation (remove artificial minimums)
2. **CRITICAL**: Fix armor point values to match TechManual
3. **HIGH**: Revert heat calculation structure changes
4. **MEDIUM**: Fix minimum heat sink requirement logic
5. **LOW**: Verify critical slot calculations

## Testing Strategy

After making these corrections:

1. **Run all tests** - Many will fail because they expect the wrong values
2. **Update test expectations** to match official BattleTech rules
3. **Verify against official examples** from TechManual
4. **Test edge cases** like very light mechs (20-25 tons) with small engines

## Notes

- **Never change implementations to match tests** - Tests should validate official rules
- **Always reference TechManual** for official values
- **Consider creating a rules reference document** with official values
- **Test with canonical BattleTech examples** to verify correctness

## Official References

- **BattleTech TechManual** - Primary source for construction rules
- **Sarna.net** - Community-maintained rule reference
- **MegaMek source code** - Open source implementation for reference