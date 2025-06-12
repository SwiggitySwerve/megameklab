# Schema Comparison Analysis: MegaMekLab vs Implementation

## Critical Discrepancies Found

### 1. Tech Base Classification

**MegaMekLab Reality (from .mtf files):**
- "Inner Sphere" (pure IS tech)
- "Clan" (pure Clan tech)  
- "Mixed (IS Chassis)" (IS base + mixed components)
- "Mixed (Clan Chassis)" (Clan base + mixed components)

**Current Schema Implementation:**
```json
"tech_base": {
  "type": "string",
  "description": "Technological base of the unit (e.g., Inner Sphere, Clan, Mixed)"
}
```

**Issue**: Schema allows any string but doesn't enforce the specific mixed tech classifications found in actual data.

**Recommended Fix:**
```json
"tech_base": {
  "type": "string",
  "enum": ["Inner Sphere", "Clan", "Mixed (IS Chassis)", "Mixed (Clan Chassis)"],
  "description": "Technological base of the unit"
}
```

### 2. Unit Configuration Types

**MegaMekLab Reality (found in data):**
- "Biped"
- "Biped Omnimech"  
- "Quad"
- "Quad Omnimech"
- "Tripod"
- "Tripod Omnimech"
- "LAM" (Land-Air Mech)

**Current BattleMech Schema:**
```json
"config": {
  "type": "string",
  "enum": ["Biped", "Quad"]
}
```

**Issue**: Missing critical configuration types found in 230+ mixed tech units.

**Recommended Fix:**
```json
"config": {
  "type": "string",
  "enum": ["Biped", "Biped Omnimech", "Quad", "Quad Omnimech", "Tripod", "Tripod Omnimech", "LAM"],
  "description": "Physical configuration including OmniMech variants"
}
```

### 3. Equipment Tech Base Tracking

**MegaMekLab Reality:**
- Individual equipment items have tech base (IS/Clan)
- Mixed units combine IS and Clan equipment
- Critical for validation and construction rules

**Current Schema:**
```json
"weapons_and_equipment": {
  "items": {
    "properties": {
      "item_name": { "type": "string" },
      "item_type": { "type": "string" },
      "location": { "type": "string" }
    }
  }
}
```

**Issue**: No tracking of equipment tech base for mixed tech validation.

**Recommended Addition:**
```json
"weapons_and_equipment": {
  "items": {
    "properties": {
      "item_name": { "type": "string" },
      "item_type": { "type": "string" },
      "location": { "type": "string" },
      "tech_base": { "type": "string", "enum": ["IS", "Clan"] },
      "is_omnipod": { "type": "boolean", "default": false }
    }
  }
}
```

### 4. Role Classification

**MegaMekLab Reality (roles found in data):**
- "Sniper", "Juggernaut", "Brawler", "Skirmisher", "Scout"
- "Missile Boat", "Striker", "Fire Support", "Command"
- "Anti-Aircraft", "Assault", "Support"

**Current Schema:**
```json
"role": { 
  "type": "string", 
  "description": "The intended combat role of the unit (e.g., Striker, Missile Boat, Juggernaut)." 
}
```

**Issue**: No enumeration of valid roles for consistency.

**Recommended Enhancement:**
```json
"role": {
  "type": "string",
  "enum": ["Sniper", "Juggernaut", "Brawler", "Skirmisher", "Scout", "Missile Boat", "Striker", "Fire Support", "Command", "Anti-Aircraft", "Assault", "Support"],
  "description": "The intended combat role of the unit"
}
```

## Missing Schema Features

### 1. OmniMech Configuration Tracking

**Found in MegaMekLab:**
- OmniMech variants (Prime, A, B, C, D, etc.)
- Pod-mounted vs fixed equipment distinction
- Base chassis vs configuration data

**Missing from Schema:**
- No OmniMech-specific fields
- No pod-mounting flags
- No variant letter tracking

### 2. Mixed Tech Validation Rules

**MegaMekLab Rules:**
- Mixed (IS Chassis): IS structure/engine required
- Mixed (Clan Chassis): Clan structure/engine required  
- Equipment tech base must be tracked for compatibility

**Schema Gaps:**
- No validation rules for mixed tech
- No structure for enforcing chassis/equipment compatibility

### 3. Era-Based Tech Restrictions

**MegaMekLab Reality:**
- Tech availability varies by era
- Mixed tech forbidden pre-3050 (except prototypes)
- Advanced tech appears in specific eras

**Schema Missing:**
- No era-based validation rules
- No tech level progression tracking

## Comparison with Actual MegaMekLab Implementation

### Java Code vs Schema Alignment

**UnitUtil.java Analysis:**
```java
// Mixed tech detection
public static boolean isMixedTech(Entity unit) {
    return unit.isMixedTech();
}

// Tech base validation
public static boolean isLegal(Entity unit, ITechnology tech) {
    if (unit.isMixedTech()) {
        // Complex mixed tech validation logic
    }
}
```

**Schema Implications:**
- Java code has sophisticated mixed tech handling
- Schema doesn't capture this complexity
- Validation logic exists but isn't reflected in schema

### MTF File Format vs Schema

**MTF File Structure:**
```
chassis:BattleAxe
model:BKX-RISC
Config:Biped
techbase:Mixed (IS Chassis)
era:3137
```

**Schema Alignment:**
- ✅ chassis, model mapping correct
- ❌ Config vs config casing inconsistency  
- ❌ techbase vs tech_base naming mismatch
- ❌ Mixed tech enum values not enforced

## Recommended Schema Updates

### 1. Enhanced BattleMech Schema

```json
{
  "properties": {
    "config": {
      "type": "string",
      "enum": ["Biped", "Biped Omnimech", "Quad", "Quad Omnimech", "Tripod", "Tripod Omnimech", "LAM"]
    },
    "tech_base": {
      "type": "string", 
      "enum": ["Inner Sphere", "Clan", "Mixed (IS Chassis)", "Mixed (Clan Chassis)"]
    },
    "is_omnimech": { "type": "boolean", "default": false },
    "omnimech_base_chassis": { "type": "string" },
    "omnimech_configuration": { "type": "string", "pattern": "^(Prime|[A-Z]|[0-9]+)$" },
    "weapons_and_equipment": {
      "items": {
        "properties": {
          "tech_base": { "type": "string", "enum": ["IS", "Clan"] },
          "is_omnipod": { "type": "boolean", "default": false }
        }
      }
    }
  }
}
```

### 2. Mixed Tech Validation Schema

```json
{
  "if": { "properties": { "tech_base": { "const": "Mixed (IS Chassis)" } } },
  "then": {
    "properties": {
      "structure": { "properties": { "type": { "pattern": "^(IS|Standard)" } } },
      "engine": { "properties": { "type": { "not": { "pattern": "Clan" } } } }
    }
  }
}
```

### 3. Era-Based Tech Restrictions

```json
{
  "if": { "properties": { "era": { "type": "integer", "maximum": 3049 } } },
  "then": {
    "properties": {
      "tech_base": { "enum": ["Inner Sphere", "Clan"] }
    }
  }
}
```

## Implementation Priority

### High Priority
1. **Tech Base Enumeration**: Critical for mixed tech validation
2. **Config Type Expansion**: Essential for OmniMech support  
3. **Equipment Tech Base**: Required for construction rules

### Medium Priority
1. **Role Enumeration**: Improves data consistency
2. **OmniMech Fields**: Supports advanced unit types
3. **Mixed Tech Validation**: Enforces construction rules

### Low Priority
1. **Era Restrictions**: Nice-to-have validation
2. **Casing Consistency**: Cosmetic improvements
3. **Advanced Configurations**: Future-proofing

## Template Generation Impact

The current schemas would generate templates that:
- ✅ Handle basic mech structure correctly
- ❌ Miss 15% of units (mixed tech designs)
- ❌ Cannot validate equipment compatibility  
- ❌ Lack OmniMech configuration support
- ❌ Allow invalid tech combinations

**Recommended**: Update schemas before template generation to ensure complete MegaMekLab compatibility.
