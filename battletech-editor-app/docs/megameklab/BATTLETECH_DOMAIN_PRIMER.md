# BattleTech Domain Knowledge Primer

## Overview
This document provides essential BattleTech game mechanics knowledge needed to understand and extend the MegaMekLab implementation. For developers unfamiliar with BattleTech, this covers the core concepts.

## What is BattleTech?
BattleTech is a science fiction universe featuring giant combat robots called "BattleMechs" (or just "Mechs"). Players design and customize these mechs within strict construction rules, then use them in tactical combat.

## Core Concepts

### 1. BattleMechs (Mechs)
- **Definition**: Giant humanoid combat robots, typically 20-100 tons
- **Purpose**: Primary combat units in the BattleTech universe
- **Scale**: Usually 8-12 meters tall

### 2. Tonnage Classes
```
Light Mechs:     20-35 tons  (scouts, fast attackers)
Medium Mechs:    40-55 tons  (versatile, balanced)
Heavy Mechs:     60-75 tons  (main battle units)
Assault Mechs:   80-100 tons (maximum firepower/armor)
```

### 3. Mech Anatomy
```
        HEAD
         |
    CENTER TORSO (CT)
    /    |    \
LEFT     |     RIGHT
TORSO    |     TORSO
(LT)     |     (RT)
  |      |      |
LEFT    LEGS   RIGHT
ARM            ARM
(LA)          (RA)
```

### 4. Critical Locations
Each location has:
- **Structure Points**: Internal health
- **Armor Points**: External protection
- **Critical Slots**: Space for equipment

Critical Slot Counts:
- Head: 6 slots
- Center Torso: 12 slots
- Side Torsos: 12 slots each
- Arms: 12 slots each
- Legs: 6 slots each

## Construction Rules

### 1. Weight Budget
Everything has weight:
```typescript
Total Weight = Structure + Armor + Engine + Equipment + Heat Sinks
// Must not exceed mech tonnage
```

### 2. Critical Space
Equipment takes slots:
```typescript
// Examples:
Medium Laser: 1 slot, 1 ton
Large Laser: 2 slots, 5 tons
AC/20: 10 slots, 14 tons
```

### 3. Heat Management
- Weapons generate heat when fired
- Movement generates heat
- Heat sinks dissipate heat
- Overheating causes problems

### 4. Technology Levels
```
Introductory: Basic technology
Standard: Common equipment
Advanced: Rare/experimental
Experimental: Prototype tech
```

## Key Equipment Types

### 1. Weapons
**Energy Weapons**
- Lasers (Small, Medium, Large)
- PPCs (Particle Projector Cannons)
- Flamers

**Ballistic Weapons**
- Autocannons (AC/2, AC/5, AC/10, AC/20)
- Machine Guns
- Gauss Rifles

**Missile Weapons**
- SRMs (Short Range Missiles)
- LRMs (Long Range Missiles)
- MRMs (Medium Range Missiles)

### 2. Defensive Equipment
- **Armor**: Standard, Ferro-Fibrous, Reactive
- **CASE**: Protects from ammo explosions
- **AMS**: Anti-Missile System

### 3. Movement Equipment
- **Jump Jets**: Allow jumping movement
- **MASC**: Increases run speed
- **TSM**: Triple Strength Myomer

### 4. Special Equipment
- **ECM**: Electronic countermeasures
- **BAP**: Beagle Active Probe
- **TAG**: Target Acquisition Gear

## Important Game Mechanics

### 1. Armor Allocation
- Front and rear armor (torsos only)
- Maximum armor = 2 × structure points
- Head maximum = 9 points

### 2. Engine Rating
```
Engine Rating = Tonnage × Desired Walk MP
Walk MP × 1.5 = Run MP (round up)
```

### 3. Heat Scale
```
0-4:   No effects
5-9:   Movement penalties
10-14: To-hit penalties
15-19: Ammo explosion risk
20-24: Shutdown risk
25-29: System damage
30+:   Automatic shutdown
```

### 4. Construction Validation
Must validate:
- Weight limits
- Space limits
- Technology compatibility
- Structural requirements
- Heat sink requirements

## Special Unit Types

### 1. OmniMechs
- Fixed structure/engine/armor
- Swappable equipment pods
- More flexible but restricted

### 2. LAMs (Land-Air Mechs)
- Transform between mech and fighter
- Special construction rules
- Very complex

### 3. QuadVees
- Four-legged mechs that transform to vehicles
- Different critical layout
- Special movement rules

### 4. ProtoMechs
- Mini-mechs (2-9 tons)
- Different construction rules
- Clan technology only

### 5. Battle Armor
- Powered armor suits
- Can ride on OmniMechs
- Squad-based units

## Technology Factions

### 1. Inner Sphere
- Older, heavier technology
- More common/available
- Generally less efficient

### 2. Clan
- Advanced technology
- Lighter, more powerful
- More expensive/rare

### 3. Mixed Tech
- Combines both technologies
- Special rules apply
- Era-dependent availability

## Common Quirks

### Positive Quirks
- **Easy to Maintain**: Reduced repair time/cost
- **Rugged**: Extra durability
- **Stable**: Better accuracy

### Negative Quirks
- **Difficult to Maintain**: Increased repair time/cost
- **Poor Workmanship**: Reduced reliability
- **Cramped Cockpit**: Pilot penalties

## File Formats

### MTF (Mech Template File)
- Human-readable text format
- Standard for mech sharing
- Contains all mech data

### BLK (Block File)
- Binary format
- More compact
- Used by game engines

## Validation Examples

### Weight Validation
```typescript
// Example: 50-ton mech
Structure: 5.0 tons (Standard)
Engine: 10.5 tons (Fusion 210)
Gyro: 3.0 tons
Cockpit: 3.0 tons
Heat Sinks: 2.0 tons (2 additional)
Armor: 8.5 tons (136 points)
Jump Jets: 3.0 tons (3 JJs)
Weapons: 15.0 tons
------------------------
Total: 50.0 tons ✓
```

### Critical Space Validation
```typescript
// Right Arm example:
Shoulder (required)
Upper Arm Actuator (required)
Lower Arm Actuator (can remove)
Hand Actuator (can remove)
Medium Laser (1 slot)
Medium Laser (1 slot)
Heat Sink (2 slots)
-- Empty -- (4 slots)
Total: 12 slots ✓
```

## Common Mistakes to Avoid

1. **Forgetting Required Components**
   - Every mech needs engine, gyro, cockpit
   - Life support and sensors are required

2. **Armor Allocation Errors**
   - Rear armor on arms/legs (they don't have it)
   - Exceeding maximum armor values

3. **Heat Sink Confusion**
   - Engine provides 10 free heat sinks
   - Additional heat sinks cost tonnage

4. **Ammo Placement**
   - Should be in torsos with CASE
   - Never in head or center torso

5. **Technology Mixing**
   - Check era availability
   - Verify faction compatibility

## Glossary

- **BV**: Battle Value (point cost)
- **C-Bill**: Currency (construction cost)
- **Crit**: Critical hit/slot
- **DHS**: Double Heat Sink
- **ECM**: Electronic Counter Measures
- **FF**: Ferro-Fibrous (armor type)
- **IS**: Inner Sphere
- **JJ**: Jump Jet
- **LAM**: Land-Air Mech
- **LRM**: Long Range Missile
- **MASC**: Myomer Accelerator Signal Circuitry
- **MP**: Movement Points
- **PPC**: Particle Projector Cannon
- **SHS**: Single Heat Sink
- **SRM**: Short Range Missile
- **TAG**: Target Acquisition Gear
- **TSM**: Triple Strength Myomer
- **XL**: Extra Light (engine type)

## Resources for Learning More

1. **Sarna.net** - BattleTech wiki
2. **Official BattleTech website**
3. **MegaMek/MegaMekLab** - Open source implementations
4. **Total Warfare** - Core rulebook
5. **TechManual** - Construction rules

## Implementation Notes

When working on the editor:

1. **Always validate against construction rules**
   - The rules are complex and interconnected
   - Edge cases are common

2. **Reference the original MegaMekLab**
   - It's the gold standard for validation
   - Our implementation should match its behavior

3. **Test with various mech types**
   - Standard bipeds
   - Quad mechs
   - OmniMechs
   - Special types (LAM, QuadVee)

4. **Consider tournament legality**
   - Some combinations are legal but not tournament-legal
   - Track rules levels carefully

This primer covers the essential knowledge needed to work on the MegaMekLab implementation. The actual rules are much more detailed, but this should provide enough context to understand the codebase and make informed decisions.
