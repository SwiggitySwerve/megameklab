# Unit JSON Format Analysis & Migration Requirements

## Executive Summary

🔍 **Analysis Conclusion**: The existing unit JSON files require significant formatting updates to align with the reorganized equipment system and new TypeScript interfaces.

## Current State Comparison

### 📄 JSON File Format (Current)
```json
{
  "chassis": "Zeus",
  "model": "ZEU-9T",
  "tech_base": "Inner Sphere",
  "mass": 80,
  "engine": {
    "rating": 320,
    "type": "Light Engine"
  },
  "structure": {
    "type": "Standard"
  },
  "heat_sinks": {
    "count": 17,
    "type": "Double"
  },
  "weapons_and_equipment": [
    {
      "item_name": "1 ISERPPC",
      "location": "Left Arm",
      "item_type": "1Iserppc",
      "tech_base": "IS",
      "is_omnipod": false
    }
  ]
}
```

### 🔧 TypeScript Interface (Target)
```typescript
interface UnitConfiguration {
  chassis: string;
  model: string;
  tonnage: number;
  unitType: 'BattleMech' | 'IndustrialMech';
  techBase: 'Inner Sphere' | 'Clan';
  walkMP: number;
  engineRating: number;
  runMP: number;
  engineType: EngineType;
  gyroType: ComponentConfiguration;
  structureType: ComponentConfiguration;
  armorType: ComponentConfiguration;
  armorAllocation: ArmorAllocation;
  heatSinkType: ComponentConfiguration;
  // ... additional fields
}
```

## Key Discrepancies Identified

### 🔴 Critical Issues

| JSON Field | TypeScript Field | Issue | Impact |
|------------|------------------|-------|---------|
| `tech_base` | `techBase` | Naming convention | 🔴 Type errors |
| `mass` | `tonnage` | Field name mismatch | 🔴 Configuration errors |
| `engine.type` | `engineType` | Structure difference | 🔴 Engine parsing failures |
| `structure.type` | `structureType` | Structure difference | 🔴 Structure parsing failures |
| `heat_sinks` | `heatSinkType` + counts | Complex restructuring needed | 🔴 Heat management errors |
| `weapons_and_equipment` | Not directly mapped | Equipment allocation system | 🔴 Equipment loading failures |

### 🟡 Equipment Reference Mismatches

| JSON Equipment Reference | Equipment Database Format | Status |
|-------------------------|---------------------------|---------|
| `"1 ISERPPC"` | `id: 'is_er_ppc'` | ❌ No direct mapping |
| `"1Iserppc"` | `id: 'is_er_ppc'` | ❌ Inconsistent naming |
| `"tech_base": "IS"` | `techBase: 'Inner Sphere'` | ❌ Value mismatch |
| `"item_type": "1Iserppc"` | Flattened variant system | ❌ Different approach |

### 🟡 ComponentConfiguration Incompatibilities

**JSON Structure:**
```json
"structure": {
  "type": "Standard",
  "manufacturer": null
}
```

**TypeScript Expected:**
```typescript
structureType: ComponentConfiguration = {
  type: "Standard",
  techBase: "Inner Sphere",
  category: "structure",
  rulesLevel: "Standard"
}
```

## Required Migration Updates

### 1. 🔄 Field Name Standardization

**Required Changes:**
```javascript
// Field mapping for migration
const FIELD_MAPPING = {
  'tech_base': 'techBase',
  'mass': 'tonnage',
  'walk_mp': 'walkMP',
  'jump_mp': 'jumpMP',
  'run_mp': 'runMP'
};
```

### 2. 🏗️ Structure Format Migration

**Current JSON:**
```json
"engine": {
  "rating": 320,
  "type": "Light Engine",
  "manufacturer": null
}
```

**Required Format:**
```typescript
{
  engineRating: 320,
  engineType: "Light Engine",
  walkMP: 4, // calculated from rating/tonnage
  runMP: 6   // calculated from walkMP
}
```

### 3. 📦 Component Configuration Migration

**Migration Required:**
```typescript
// JSON: "structure": { "type": "Standard" }
// Becomes:
structureType: {
  type: "Standard",
  techBase: "Inner Sphere", // inferred from unit tech_base
  category: "structure",
  rulesLevel: "Standard"
}
```

### 4. 🔧 Equipment Reference Update

**Current Equipment References:**
```json
{
  "item_name": "1 ISERPPC",
  "item_type": "1Iserppc",
  "tech_base": "IS"
}
```

**Required Migration:**
```typescript
// Need mapping table:
const EQUIPMENT_ID_MAPPING = {
  "1Iserppc": "is_er_ppc",
  "1Iserlargelaser": "is_er_large_laser",
  "1Islrm15": "lrm_15",
  // ... full mapping required
};

// Tech base normalization:
const TECH_BASE_MAPPING = {
  "IS": "Inner Sphere",
  "Clan": "Clan"
};
```

### 5. 📊 Armor Allocation Migration

**JSON Format:**
```json
"armor": {
  "type": "Ferro-Fibrous",
  "locations": [
    {
      "location": "LA",
      "armor_points": 25,
      "rear_armor_points": null
    }
  ]
}
```

**Required TypeScript Format:**
```typescript
{
  armorType: {
    type: "Ferro-Fibrous",
    techBase: "Inner Sphere",
    category: "armor",
    rulesLevel: "Standard"
  },
  armorAllocation: {
    LA: { front: 25, rear: 0 },
    RA: { front: 25, rear: 0 },
    // ... all locations
  }
}
```

## Migration Strategy

### Phase 1: Create Migration Utilities

1. **Equipment ID Mapper**
   ```typescript
   interface EquipmentMapping {
     jsonId: string;
     databaseId: string;
     techBase: string;
   }
   ```

2. **Field Normalizer**
   ```typescript
   function normalizeUnitFields(jsonUnit: any): Partial<UnitConfiguration>
   ```

3. **Component Configuration Builder**
   ```typescript
   function buildComponentConfiguration(
     type: string, 
     techBase: string, 
     category: string
   ): ComponentConfiguration
   ```

### Phase 2: Create Conversion Service

```typescript
class UnitJSONMigrationService {
  migrateUnit(jsonUnit: any): UnitConfiguration;
  migrateEquipment(jsonEquipment: any[]): EquipmentAllocation[];
  validateMigration(original: any, migrated: UnitConfiguration): ValidationResult;
}
```

### Phase 3: Batch Migration Tool

```typescript
class BatchUnitMigrator {
  migrateDirectory(sourcePath: string, targetPath: string): MigrationReport;
  generateMigrationReport(): MigrationSummary;
  validateAllMigrations(): ValidationSummary;
}
```

## Equipment Database Integration

### Required Equipment Mapping Table

**Must Create:**
```typescript
// Comprehensive mapping from JSON item_type to equipment database IDs
const MEGAMEKLAB_TO_DATABASE_MAPPING: Record<string, {
  databaseId: string;
  category: string;
  techBase?: string;
}> = {
  "1Iserppc": { 
    databaseId: "is_er_ppc", 
    category: "Energy Weapons",
    techBase: "Inner Sphere"
  },
  "1Iserlargelaser": { 
    databaseId: "is_er_large_laser", 
    category: "Energy Weapons",
    techBase: "Inner Sphere"
  },
  // ... hundreds more entries needed
};
```

### Equipment Allocation Integration

**Challenge**: JSON uses simple location strings, TypeScript uses complex allocation system.

**Solution Required:**
```typescript
interface EquipmentAllocationMigrator {
  convertJSONEquipment(
    jsonEquipment: any[], 
    unitConfig: UnitConfiguration
  ): {
    allocatedEquipment: EquipmentAllocation[];
    unallocatedEquipment: EquipmentAllocation[];
    migrationErrors: string[];
  };
}
```

## Implementation Priority

### 🔴 High Priority (Required for Basic Functionality)
1. **Field name standardization** (tech_base → techBase, mass → tonnage)
2. **Basic component configuration migration** (structure, armor, engine)
3. **Equipment ID mapping creation**
4. **Tech base value normalization**

### 🟡 Medium Priority (Required for Full Compatibility)
5. **Complex component configuration migration**
6. **Armor allocation format conversion**
7. **Heat sink configuration migration**
8. **Movement system migration**

### 🟢 Low Priority (Enhancement)
9. **Manufacturer information preservation**
10. **Fluff text migration**
11. **Advanced component features**
12. **Quirks and special abilities**

## Conclusion

**🎯 Required Action**: The unit JSON files need comprehensive format migration to work with the reorganized TypeScript system.

### Key Requirements:
1. ✅ **Create equipment mapping table** (JSON item_type → database ID)
2. ✅ **Implement field name standardization** (snake_case → camelCase)
3. ✅ **Migrate component structures** to ComponentConfiguration format
4. ✅ **Convert tech base values** ("IS"/"Clan" → "Inner Sphere"/"Clan")
5. ✅ **Restructure armor allocation** from array to typed object format
6. ✅ **Create migration validation** to ensure data integrity

### Estimated Effort:
- **Equipment Mapping**: ~200 equipment entries to map
- **Migration Service**: ~500 lines of TypeScript
- **Validation**: ~200 lines of test cases
- **Batch Processing**: ~100 lines for directory processing

**The JSON format migration is essential for the unit data to work correctly with the new typed equipment system and component architecture.**