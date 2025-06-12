# MegaMekLab Armor Allocation Logic Analysis

## Overview

This document analyzes the exact armor allocation logic from MegaMekLab's Java implementation, specifically from `BMStructureTab.java`.

## Core Armor Allocation Algorithm

### 1. Initial Head Allocation
```java
// put 5 times the percentage of total possible armor into the head
int headArmor = (int) Math.min(Math.floor(percent * headMaxArmor * 5), headMaxArmor);
```

The head gets special treatment - it receives 5x the percentage of its maximum armor, capped at the head's max (9 for standard mechs, 12 for superheavy).

### 2. Torso and Limb Allocation

After allocating to the head, the remaining armor is distributed based on internal structure:

```java
double IS = (getMek().getInternal(location) * 2);
double allocate = Math.min(IS * percent, pointsToAllocate);
```

For torso locations (CT, LT, RT), armor is split:
- **75% front armor**
- **25% rear armor**

### 3. Leftover Points Distribution

The most complex part is the `allocateLeftoverPoints` method:

```java
private void allocateLeftoverPoints(double points) {
    while (points >= 1) {
        // if two or more are left, add armor to symmetrical locations
        if (points >= 2) {
            // Try torso pairs first
            if (canAddToTorso(LT) && canAddToTorso(RT)) {
                addToTorso(LT, RT);
                points -= 2;
            }
            // Then legs
            else if (canAddToLeg(LL) && canAddToLeg(RL)) {
                addToLeg(LL, RL);
                points -= 2;
            }
            // Then arms
            else if (canAddToArm(LA) && canAddToArm(RA)) {
                addToArm(LA, RA);
                points -= 2;
            }
        }
        // Single point allocation
        else {
            // First try head
            if (head < headMax) {
                addToHead();
                points--;
            }
            // Then balance uneven allocations
            else if (LT < RT) addToLT();
            else if (RT < LT) addToRT();
            else if (RA < LA) addToRA();
            else if (LA < RA) addToLA();
            else if (RL < LL) addToRL();
            else if (LL < RL) addToLL();
            // If all balanced, add to CT
            else if (CT < maxCT) addToCT();
        }
    }
}
```

### 4. Special Case: Max Head and CT

If only 1 point remains and both head and CT are at maximum:
```java
if (points == 1) {
    if ((head == headMax) && (CT == maxCT)) {
        // Remove 1 from CT to allow symmetric locations to get extra
        CT--;
        points++;
    }
}
```

## Key Differences from Current Implementation

1. **Priority Order**: MegaMekLab prioritizes torso pairs before legs, then arms
2. **Rear Armor**: Always allocates exactly 25% to rear for torso locations
3. **Rounding**: Ensures front + rear doesn't exceed allocated amount due to rounding
4. **CT Redistribution**: Special logic to remove from CT when at max to allow symmetric additions

## Armor Type and Tonnage Handling

### Armor Type Change
```java
public void armorTypeChanged(int at, int aTechLevel) {
    if (at != EquipmentType.T_ARMOR_PATCHWORK) {
        UnitUtil.removeISorArmorMounts(getMek(), false);
        createArmorMountsAndSetArmorType(at, aTechLevel);
    }
}
```

### Tonnage Calculation
- Standard armor: 16 points per ton
- Ferro-Fibrous: 17.6 points per ton (both IS and Clan)
- Stealth armor has special handling for critical slot allocation

### Maximize Armor
```java
public void maximizeArmor() {
    double maxArmor = UnitUtil.getMaximumArmorTonnage(getMek());
    getMek().setArmorTonnage(maxArmor);
}
```

### Use Remaining Tonnage
```java
public void useRemainingTonnageArmor() {
    double currentTonnage = UnitUtil.getEntityVerifier(getMek()).calculateWeight();
    currentTonnage += UnitUtil.getUnallocatedAmmoTonnage(getMek());
    double totalTonnage = getMek().getWeight();
    double remainingTonnage = TestEntity.floor(totalTonnage - currentTonnage, TestEntity.Ceil.HALFTON);
    
    double maxArmor = MathUtility.clamp(
        getMek().getArmorWeight() + remainingTonnage, 
        0,
        UnitUtil.getMaximumArmorTonnage(getMek())
    );
}
```

## Implementation Recommendations

1. **Update Auto-Allocation Algorithm**:
   - Match the exact head allocation formula (5x percentage)
   - Implement proper 75/25 front/rear split for torsos
   - Follow the exact priority order for leftover points

2. **Improve Leftover Distribution**:
   - Prioritize symmetric location pairs (torso > legs > arms)
   - Implement CT redistribution logic
   - Balance uneven allocations in correct order

3. **Handle Armor Types Properly**:
   - Different points per ton for different armor types
   - Special handling for patchwork armor
   - Critical slot requirements for certain armor types

4. **Tonnage Calculations**:
   - Round to nearest half-ton
   - Include unallocated ammo tonnage in calculations
   - Respect maximum armor tonnage limits
