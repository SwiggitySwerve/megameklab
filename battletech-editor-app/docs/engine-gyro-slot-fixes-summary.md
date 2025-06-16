# Engine and Gyro Slot Fixes Summary

## Issues Fixed

### 1. Engine Placement
**Problem**: Engine was incorrectly placing all 6 slots consecutively (0-5)
**Fix**: Engine now correctly uses split placement: slots 0-2 and 7-9

### 2. Gyro Placement  
**Problem**: Gyro was finding "first available slot after engine" which was incorrect
**Fix**: Gyro now always starts at slot 3, regardless of engine type

### 3. XL Gyro Compatibility
**Problem**: XL Gyro (slots 3-8) conflicts with standard engine layout (slots 7-9)
**Fix**: 
- Added compatibility check that rejects XL Gyro with Standard/ICE/Fuel Cell/Compact engines
- These engine types use the split CT layout which conflicts with XL gyro

### 4. XL Engine + XL Gyro Support
**Problem**: XL engines were disappearing when used with XL gyro
**Fix**: Added special layout for XL/Light/XXL engines with XL gyro:
- Engine uses slots 0-2 and 9-11 (avoiding XL gyro at 3-8)
- Side torso slots remain unchanged

## Correct Slot Layouts

### Standard Configuration
```
Center Torso (12 slots):
0-2: Engine (first part)
3-6: Gyro (Standard/Heavy-Duty)
7-9: Engine (second part)
10-11: Available
```

### XL Gyro with Compatible Engine (XL/Light/XXL)
```
Center Torso (12 slots):
0-2: Engine (first part)
3-8: XL Gyro (6 slots)
9-11: Engine (second part)
```

### Compact Gyro
```
Center Torso (12 slots):
0-2: Engine (first part)
3-4: Compact Gyro (2 slots)
5-6: Available
7-9: Engine (second part)
10-11: Available
```

## Compatibility Matrix

| Engine Type | Standard Gyro | XL Gyro | Compact Gyro | Heavy-Duty Gyro |
|------------|---------------|---------|--------------|-----------------|
| Standard   | ✓             | ✗       | ✓            | ✓               |
| XL         | ✓             | ✓       | ✓            | ✓               |
| Light      | ✓             | ✓       | ✓            | ✓               |
| XXL        | ✓             | ✓       | ✓            | ✓               |
| Compact    | ✓             | ✗       | ✓            | ✓               |
| ICE        | ✓             | ✗       | ✓            | ✓               |
| Fuel Cell  | ✓             | ✗       | ✓            | ✓               |

## Code Changes

### componentRules.ts
- Fixed `placeEngine()` to use split placement (0-2, 7-9)
- Added `gyroType` parameter to handle XL gyro special case
- Added special layout for XL/Light/XXL engines with XL gyro

### componentSync.ts  
- Added compatibility check in `syncGyroChange()`
- Prevents incompatible engine/gyro combinations

### smartSlotUpdate.ts
- Fixed engine slot ranges to use correct split layout
- Fixed gyro to always start at slot 3

## Testing

Use the following test pages to verify the fixes:
- `/test-engine-gyro-fix` - General engine/gyro placement test
- `/test-xl-gyro` - Specific XL gyro compatibility test
- `/test-engine-displacement` - Equipment displacement test

## Smart Displacement

When engine or gyro types change:
1. Only equipment in conflicting slots is displaced
2. Displaced equipment moves to unallocated (location = '')
3. No automatic placement occurs
4. User must manually re-allocate displaced equipment
