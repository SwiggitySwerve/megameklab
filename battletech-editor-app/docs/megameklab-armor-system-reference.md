# MegaMekLab Armor System Reference Documentation

## Overview

This document provides a comprehensive reference for the armor system implementation in MegaMekLab's Java application, including tonnage limitations, auto-allocation algorithms, and key differences from our current implementation.

## Table of Contents

1. [Armor Tonnage Limitations](#armor-tonnage-limitations)
2. [Armor Points Calculation](#armor-points-calculation)
3. [Auto-Allocation Algorithm](#auto-allocation-algorithm)
4. [System Interactions](#system-interactions)
5. [Differences from Current Implementation](#differences-from-current-implementation)
6. [Edge Cases and Special Handling](#edge-cases-and-special-handling)
7. [Implementation Recommendations](#implementation-recommendations)

## Armor Tonnage Limitations

### Maximum Armor Tonnage Formula

The maximum armor tonnage a mech can carry is determined by:

```java
public static double getMaximumArmorTonnage(Entity unit) {
    double armorPerTon = ArmorType.forEntity(unit).getPointsPerTon(unit);
    double points = (unit.getTotalInternal() * 2);
    
    // Add head bonus points
    if (unit.isSuperHeavy()) {
        points += 4;
    } else {
        points += 3;
    }
    
    double armorWeight = points / armorPerTon;
    return Math.ceil(armorWeight * 2.0) / 2.0; // Round to nearest half-ton
}
```

### Key Factors Affecting Armor Tonnage

1. **Mech Tonnage**: Determines internal structure, which directly affects maximum armor
2. **Armor Type**: Different types have different points per ton
3. **Tech Level**: Some armor types are restricted by tech level
4. **Mech Type**: Superheavy mechs get an extra armor point for the head

### Armor Points Per Ton by Type

| Armor Type | Points per Ton | Critical Slots | Notes |
|------------|----------------|----------------|-------|
| Standard | 16 | 0 | Base armor type |
| Ferro-Fibrous (IS) | 17.6 | 14 | 10% more points |
| Ferro-Fibrous (Clan) | 17.6 | 7 | 10% more points |
| Light Ferro-Fibrous | 16.96 | 7 | 6% more points |
| Heavy Ferro-Fibrous | 18.88 | 21 | 18% more points |
| Stealth | 16 | 12 | Special handling |
| Hardened | 8 | 0 | Double weight |
| Reactive | 14.4 | 14 | 10% less points |
| Reflective | 16 | 10 | Same as standard |

## Armor Points Calculation

### Maximum Armor Points by Location

```java
public static int getMaximumArmorPoints(Entity unit, int loc) {
    if ((unit instanceof Mek) && (loc == Mek.LOC_HEAD)) {
        return unit.isSuperHeavy() ? 12 : 9;
    } else if (unit instanceof Mek) {
        return unit.getInternal(loc) * 2;
    }
}
```

### Total Maximum Armor Points

The total maximum armor points for a mech is calculated as:
- **Body Locations**: Internal Structure × 2
- **Head**: 9 points (standard) or 12 points (superheavy)
- **Total**: Sum of all locations

Example for a 50-ton mech:
```
Internal Structure: 83 points total (excluding head)
Head: 3 IS + 9 max armor = 9 armor points
Body: 80 IS × 2 = 160 armor points
Total Maximum: 169 armor points
```

## Auto-Allocation Algorithm

### Phase 1: Initial Distribution

The algorithm starts by calculating the percentage of maximum armor to allocate:

```java
double pointsToAllocate = TestEntity.getArmorPoints(getMek());
double maxArmor = UnitUtil.getMaximumArmorPoints(getMek());
double percent = pointsToAllocate / maxArmor;
```

### Phase 2: Head Allocation

The head receives special treatment with a 5× multiplier:

```java
int headMaxArmor = unit.isSuperHeavy() ? 12 : 9;
int headArmor = (int) Math.min(Math.floor(percent * headMaxArmor * 5), headMaxArmor);
```

### Phase 3: Proportional Distribution

After head allocation, remaining points are distributed proportionally:

```java
for (int location = 0; location < unit.locations(); location++) {
    double IS = unit.getInternal(location) * 2;
    double allocate = Math.min(IS * percent, pointsToAllocate);
    
    if (hasRearArmor(location)) {
        // Torso locations: 75% front, 25% rear
        int rear = (int) Math.floor(allocate * 0.25);
        int front = (int) Math.ceil(allocate * 0.75);
        
        // Prevent rounding from exceeding allocation
        if (rear + front > allocate) {
            if (front > rear * 3) {
                front--;
            } else {
                rear--;
            }
        }
    }
}
```

### Phase 4: Leftover Points Distribution

The most complex phase handles remaining points with specific priorities:

```java
private void allocateLeftoverPoints(double points) {
    while (points >= 1) {
        if (points >= 2) {
            // Priority 1: Symmetric torso locations
            if (canAddToTorso(LT) && canAddToTorso(RT)) {
                addSymmetric(LT, RT);
                points -= 2;
            }
            // Priority 2: Symmetric leg locations
            else if (canAddToLeg(LL) && canAddToLeg(RL)) {
                addSymmetric(LL, RL);
                points -= 2;
            }
            // Priority 3: Symmetric arm locations
            else if (canAddToArm(LA) && canAddToArm(RA)) {
                addSymmetric(LA, RA);
                points -= 2;
            }
        } else {
            // Single point allocation priorities
            if (head < headMax) {
                addToHead();
            } else if (LT < RT) {
                balanceLocation(LT);
            } else if (RT < LT) {
                balanceLocation(RT);
            } // ... continue for all unbalanced locations
            else if (CT < maxCT) {
                addToCT();
            }
        }
    }
}
```

### Special Case: CT Redistribution

When only 1 point remains and both head and CT are maxed:

```java
if (points == 1 && head == headMax && CT == maxCT) {
    CT--;  // Remove 1 from CT
    points++;  // Now we have 2 points to allocate symmetrically
}
```

## System Interactions

### 1. Armor Type Changes

When armor type changes:
- All existing armor mounts are removed
- New armor mounts are created based on type
- Critical slots are allocated if needed
- Tonnage is recalculated based on new points per ton

### 2. Maximize Armor Button

```java
public void maximizeArmor() {
    double maxArmor = UnitUtil.getMaximumArmorTonnage(getMek());
    getMek().setArmorTonnage(maxArmor);
    // Triggers auto-allocation
}
```

### 3. Use Remaining Tonnage Button

```java
public void useRemainingTonnageArmor() {
    double currentTonnage = UnitUtil.getEntityVerifier(getMek()).calculateWeight();
    currentTonnage += UnitUtil.getUnallocatedAmmoTonnage(getMek());
    double totalTonnage = getMek().getWeight();
    double remainingTonnage = TestEntity.floor(
        totalTonnage - currentTonnage, 
        TestEntity.Ceil.HALFTON
    );
    
    double maxArmor = MathUtility.clamp(
        getMek().getArmorWeight() + remainingTonnage,
        0,
        UnitUtil.getMaximumArmorTonnage(getMek())
    );
    getMek().setArmorTonnage(maxArmor);
}
```

### 4. Manual Armor Allocation

When manually setting armor points:
- Validates against location maximum
- Updates tonnage if not patchwork
- Maintains front/rear ratio for torsos
- Updates UI statistics in real-time

### 5. Patchwork Armor Handling

Patchwork armor has special handling:
- Each location tracks its own armor type
- Tonnage calculated per location
- Critical slots allocated per location
- Auto-allocate button is disabled

## Differences from Current Implementation

### 1. Head Allocation Formula

**MegaMekLab**: `headArmor = min(percent * headMax * 5, headMax)`
**Current**: May use simple proportional allocation

### 2. Torso Front/Rear Split

**MegaMekLab**: Exactly 75% front, 25% rear with rounding compensation
**Current**: May use different ratios or no compensation

### 3. Leftover Points Priority

**MegaMekLab Priority Order**:
1. Symmetric torso pairs (LT+RT)
2. Symmetric leg pairs (LL+RL)
3. Symmetric arm pairs (LA+RA)
4. Head (if not maxed)
5. Balance uneven locations
6. Center torso

**Current**: May have different priority order

### 4. CT Redistribution Logic

**MegaMekLab**: Removes 1 from CT when stuck with 1 point
**Current**: May not implement this edge case

### 5. Tonnage Calculation

**MegaMekLab**: Always rounds to nearest half-ton
**Current**: May use different rounding

## Edge Cases and Special Handling

### 1. Superheavy Mechs
- Head maximum: 12 instead of 9
- Different critical slot calculations
- Special armor mounting rules

### 2. Stealth Armor
- Requires ECM equipment
- Auto-places critical slots
- Falls back to standard if slots unavailable

### 3. Hardened Armor
- Only 8 points per ton (double weight)
- No critical slots required
- Special damage reduction rules

### 4. Zero Armor Allocation
- All locations set to 0
- No tonnage allocated
- Statistics show all points as unallocated

### 5. Fractional Points
- Only whole armor points can be allocated
- Fractional tonnage results in unused capacity
- UI shows wasted points

## Implementation Recommendations

### 1. Update Auto-Allocation Algorithm

```typescript
// Implement exact MegaMekLab algorithm
const autoAllocateArmor = (unit: Unit) => {
  const totalPoints = unit.data.armor.total_armor_points;
  const maxPoints = calculateMaxArmorPoints(unit);
  const percent = totalPoints / maxPoints;
  
  // Phase 1: Head allocation with 5x multiplier
  const headMax = unit.isSuperHeavy ? 12 : 9;
  const headArmor = Math.min(Math.floor(percent * headMax * 5), headMax);
  
  // Phase 2: Proportional distribution
  // Phase 3: Leftover points with correct priority
  // Phase 4: CT redistribution if needed
};
```

### 2. Fix Tonnage Calculations

```typescript
// Always round to nearest half-ton
const roundToHalfTon = (tonnage: number): number => {
  return Math.ceil(tonnage * 2) / 2;
};
```

### 3. Implement Proper Validation

```typescript
// Validate armor points against maximum
const validateArmorPoints = (unit: Unit, location: string, points: number): boolean => {
  const maxArmor = getMaxArmorForLocation(unit, location);
  return points <= maxArmor;
};
```

### 4. Add Missing Edge Cases

- CT redistribution logic
- Superheavy mech handling
- Patchwork armor support
- Stealth armor validation

### 5. Update UI Feedback

- Show points per ton for current armor type
- Display wasted points when fractional
- Indicate when locations are at maximum
- Disable auto-allocate for patchwork

## Testing Recommendations

1. **Unit Tests**: Test each phase of allocation separately
2. **Integration Tests**: Test full allocation flow
3. **Edge Case Tests**: Test all special cases
4. **Comparison Tests**: Compare output with MegaMekLab
5. **Performance Tests**: Ensure allocation is fast for all mech sizes

## Conclusion

This document provides a complete reference for implementing MegaMekLab-compatible armor allocation. The key to achieving parity is:

1. Implementing the exact allocation algorithm with correct priorities
2. Handling all edge cases properly
3. Using correct tonnage calculations and rounding
4. Providing appropriate UI feedback

Following these guidelines will ensure the armor system behaves identically to MegaMekLab, providing a consistent experience for users familiar with that tool.
