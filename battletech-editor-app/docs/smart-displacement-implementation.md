# Smart Displacement Implementation Summary

## Overview
The critical slot system now implements smart displacement logic that preserves user equipment placement when system components change. Only equipment that directly conflicts with new component placement is displaced.

## Implemented Components

### 1. **Engine Changes** ✅
- Standard engine: 6 CT slots
- XL engine: 6 CT + 3 LT + 3 RT slots
- Light engine: 6 CT + 2 LT + 2 RT slots
- XXL engine: 6 CT + 3 LT + 3 RT slots
- **Smart displacement**: Only equipment in conflicting slots is moved

### 2. **Gyro Changes** ✅
- Standard gyro: 4 slots (CT 6-9)
- Compact gyro: 2 slots (CT 6-7)
- XL gyro: 6 slots (CT 6-11)
- Heavy-Duty gyro: 4 slots (CT 6-9)
- **Smart displacement**: Equipment only displaced from newly occupied slots

### 3. **Structure Changes** ✅ (Already preserves slots)
- Updates equipment list only
- Adds/removes structure items as unallocated
- Critical slots remain unchanged

### 4. **Armor Changes** ✅ (Already preserves slots)
- Updates equipment list only
- Adds/removes armor items as unallocated
- Critical slots remain unchanged

### 5. **Heat Sink Changes** ✅ (Already works correctly)
- Updates equipment list only
- No critical slot changes

## How It Works

### Smart Update Algorithm
```typescript
1. Calculate old component slot positions
2. Calculate new component slot positions
3. Find slots that need to be cleared (new but not old)
4. Only displace equipment from those specific slots
5. Update equipment locations for displaced items
6. Preserve all other equipment in place
```

### Key Functions

- `getEngineSlots()`: Returns exact slot ranges for engine types
- `getGyroSlots()`: Returns exact slot ranges for gyro types  
- `smartUpdateSlots()`: Core algorithm for minimal displacement
- `updateDisplacedEquipment()`: Updates equipment list for displaced items

### Example Scenarios

#### Standard → XL Engine
- Standard uses: CT 0-5
- XL uses: CT 0-5, LT 0-2, RT 0-2
- **Result**: Only equipment in LT/RT slots 0-2 is displaced

#### XL → Standard Engine  
- XL uses: CT 0-5, LT 0-2, RT 0-2
- Standard uses: CT 0-5
- **Result**: No displacement! LT/RT slots just become available

#### Standard → Compact Gyro
- Standard uses: CT 6-9
- Compact uses: CT 6-7
- **Result**: No displacement! Slots 8-9 become available

## Benefits

1. **Preserves User Work**: Equipment placement is maintained wherever possible
2. **Minimal Disruption**: Only conflicting equipment is moved
3. **Intelligent Handling**: Shrinking components free slots without displacement
4. **Consistent Behavior**: All component changes follow the same pattern

## Testing

Test in `/customizer` with Criticals tab:
1. Place equipment in various slots
2. Change engine type - only conflicting equipment moves
3. Change gyro type - only conflicting equipment moves
4. Change structure/armor - equipment stays in place
5. All non-conflicting equipment remains exactly where placed

## Future Enhancements

1. **Cockpit Type Changes**: Add smart displacement for different cockpit configurations
2. **Visual Feedback**: Show which slots will be affected before confirming change
3. **Undo/Redo**: Allow reverting component changes
4. **Conflict Resolution**: Let user choose where to place displaced equipment
