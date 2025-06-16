# XL Gyro Incompatibility Issue

## Problem Statement

The XL Gyro in BattleTech requires 6 critical slots (slots 3-8) in the Center Torso, which creates an incompatibility with the standard engine slot layout.

## Standard Layout
- Engine: Slots 0-2 and 7-9 (6 slots total, split around gyro)
- Standard Gyro: Slots 3-6 (4 slots)
- Available: Slots 10-11

## XL Gyro Conflict
- Engine: Slots 0-2 and 7-9
- XL Gyro: Slots 3-8 (6 slots) ⚠️ **Overlaps with engine slots 7-8!**

## Technical Issue
The XL Gyro would need to occupy slots 3-8, but slots 7-9 are already reserved for the engine in the standard layout. This creates an impossible configuration.

## Possible Solutions

### 1. Prohibit XL Gyro (Current Implementation)
When the user tries to select XL Gyro with a Standard/ICE/Fuel Cell engine, the change is rejected with a warning.

### 2. Alternative Engine Layout for XL Gyro
For mechs with XL Gyro, use a different engine placement:
- Engine: Slots 0-2 and 9-11
- XL Gyro: Slots 3-8
- This would require special handling and might not align with canon rules

### 3. Engine Type Restrictions
Only allow XL Gyro with certain engine types (XL, Light, XXL) that have different slot requirements.

## Current Status
The system currently implements Solution #1 - XL Gyro changes are rejected when incompatible with the current engine type.

## Code References
- `componentSync.ts`: `syncGyroChange()` function checks for incompatibility
- `componentRules.ts`: `placeEngine()` and `placeGyro()` handle standard placement
