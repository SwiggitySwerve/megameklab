# MegaMekLab Armor Allocation Layout Analysis

## Original Layout Structure

The armor allocation in MegaMekLab follows this specific pattern:

### Top Section (Head)
```
                HD
              [___]    
            Max: 9
```

### Middle Section (Arms and Torsos)
```
LA        LT        CT        RT        RA
[__]      [__]      [__]      [__]      [__]
       Rear      Rear      Rear
       [__]      [__]      [__]
   Max: 8  Max: 12  Max: 16  Max: 12  Max: 8
```

### Bottom Section (Legs)
```
        LL              RL
       [__]            [__]
           Max: 12
```

## Key Observations:
1. Head is centered at the top
2. Arms and torsos are in a single row
3. Rear armor for torsos appears below the main values
4. Max values appear below each section
5. Legs are centered at the bottom
6. The layout mimics the actual mech structure
