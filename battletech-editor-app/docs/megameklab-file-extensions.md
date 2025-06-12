# MegaMekLab File Extensions and Unit Types

## File Extensions by Unit Type

Based on the MegaMekLab data files structure, different unit types use different file extensions:

### 1. BattleMechs
- **Extension:** `.mtf` (Mech Technical Format)
- **Example:** `Atlas AS7-D.mtf`
- **Path:** `megameklab/data/mekfiles/meks/`

### 2. Combat Vehicles
- **Extension:** `.blk` (Block format)
- **Example:** `Hover Tank.blk`
- **Path:** `megameklab/data/mekfiles/vehicles/`

### 3. Battle Armor
- **Extension:** `.blk`
- **Example:** `Elemental BA [Laser] (Sqd4).blk`
- **Path:** `megameklab/data/mekfiles/battlearmor/`

### 4. Aerospace Fighters
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/fighters/`

### 5. Conventional Fighters
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/convfighter/`

### 6. ProtoMechs
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/protomeks/`

### 7. Infantry
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/infantry/`

### 8. Dropships
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/dropships/`

### 9. Small Craft
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/smallcraft/`

### 10. Jumpships
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/jumpships/`

### 11. Warships
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/warship/`

### 12. Space Stations
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/spacestation/`

### 13. Gun Emplacements
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/ge/`

### 14. Handheld Weapons
- **Extension:** `.blk`
- **Path:** `megameklab/data/mekfiles/handheld/`

## Summary

- **MTF Format:** Used exclusively for BattleMechs
- **BLK Format:** Used for all other unit types

## Implementation Requirements

Our export/import system needs to:

1. **Detect unit type** to determine correct file extension
2. **Use `.mtf` for mechs**, `.blk` for everything else
3. **Parse both formats** correctly on import
4. **Generate appropriate format** on export

## File Format Differences

### MTF Format (Mechs)
- Human-readable text format
- Colon-delimited key-value pairs
- Specific to BattleMech data structure

### BLK Format (Everything Else)
- Block-based format
- More generic structure
- Supports varied unit types

## Export Logic

```typescript
function getFileExtension(unitType: string): string {
  return unitType.toLowerCase() === 'mech' ? 'mtf' : 'blk';
}
```

## Import Logic

```typescript
function detectFileFormat(filename: string): 'mtf' | 'blk' {
  return filename.toLowerCase().endsWith('.mtf') ? 'mtf' : 'blk';
}
