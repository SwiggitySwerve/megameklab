-- =================================================================
-- units Table
-- Stores individual combat units (BattleMechs, Vehicles, Fighters, etc.)
-- =================================================================
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_file_path TEXT UNIQUE NOT NULL, -- Path to the source .mtf/.blk file
    unit_type TEXT NOT NULL, -- e.g., 'BattleMech', 'Vehicle', 'Fighter', 'BattleArmor', 'ProtoMek', 'Infantry', 'ConventionalFighter', 'DropShip', 'SmallCraft', 'JumpShip', 'WarShip', 'SpaceStation', 'GunEmplacement'

    -- Extracted common fields for searching/indexing and quick overview
    chassis TEXT,
    model TEXT,
    mul_id TEXT, -- Master Unit List ID, can be string or number
    tech_base TEXT CHECK (tech_base IN ('Inner Sphere', 'Clan', 'Mixed (IS Chassis)', 'Mixed (Clan Chassis)')) NOT NULL, -- Enforced enum for tech base
    era TEXT, -- e.g., 'Succession Wars', 'Clan Invasion', 'Jihad'
    mass_tons INTEGER, -- Stored as integer for direct comparison, actual value might have decimals in source
    role TEXT, -- e.g., 'Striker', 'Missile Boat', 'Scout'
    source_book TEXT, -- Primary sourcebook for the unit variant
    
    -- OmniMech support fields
    is_omnimech BOOLEAN DEFAULT FALSE, -- Whether this unit is an OmniMech
    omnimech_base_chassis TEXT, -- Base chassis name for OmniMech variants
    omnimech_configuration TEXT, -- Configuration variant (Prime, A, B, C, etc.)
    config TEXT, -- Unit configuration (Biped, Quad, etc.)

    -- Full unit data conforming to its specific JSON schema
    data TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for units table
CREATE INDEX IF NOT EXISTS idx_units_chassis ON units(chassis);
CREATE INDEX IF NOT EXISTS idx_units_model ON units(model);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON units(unit_type);
CREATE INDEX IF NOT EXISTS idx_units_tech_base ON units(tech_base);
CREATE INDEX IF NOT EXISTS idx_units_era ON units(era);
CREATE INDEX IF NOT EXISTS idx_units_mass_tons ON units(mass_tons);
CREATE INDEX IF NOT EXISTS idx_units_role ON units(role);
CREATE INDEX IF NOT EXISTS idx_units_is_omnimech ON units(is_omnimech);
CREATE INDEX IF NOT EXISTS idx_units_omnimech_base_chassis ON units(omnimech_base_chassis);
CREATE INDEX IF NOT EXISTS idx_units_config ON units(config);
CREATE INDEX IF NOT EXISTS idx_units_data ON units(data);

-- =================================================================
-- equipment Table
-- Master list of unique equipment items (Weapons, Ammo, Gear)
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_id TEXT UNIQUE NOT NULL, -- Derived, e.g., "ISERLargeLaser", "AmmoLRM15"
    name TEXT NOT NULL, -- Common name, e.g., "Large Laser", "LRM 15 Ammo (24)"
    type TEXT, -- e.g., 'Weapon', 'Ammo', 'Equipment', 'HeatSink' (from equipmentSchema.json)
    category TEXT, -- e.g., 'EnergyWeapon', 'BallisticWeapon', 'Ammunition' (from equipmentSchema.json)
    tech_base TEXT CHECK (tech_base IN ('IS', 'Clan', 'Mixed')) NOT NULL, -- Enforced enum for equipment tech base

    -- Full equipment data conforming to equipmentSchema.json
    data TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for equipment table
CREATE INDEX IF NOT EXISTS idx_equipment_internal_id ON equipment(internal_id);
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_tech_base ON equipment(tech_base);
CREATE INDEX IF NOT EXISTS idx_equipment_data ON equipment(data);

-- =================================================================
-- unit_validation_options Table
-- Stores the (typically single) set of unit verification options
-- from UnitVerifierOptions.xml
-- =================================================================
CREATE TABLE IF NOT EXISTS unit_validation_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Only one row expected, effectively a singleton table
    name TEXT UNIQUE NOT NULL DEFAULT 'DefaultSettings', -- Changed default name slightly for clarity

    -- Full JSON data from UnitVerifierOptions.json
    data TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- End of schema_sqlite.sql

-- =================================================================
-- custom_unit_variants Table
-- Stores user-customized unit configurations.
-- =================================================================
CREATE TABLE IF NOT EXISTS custom_unit_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_unit_id INTEGER NOT NULL,
    variant_name TEXT NOT NULL,
    notes TEXT, -- Optional user notes for their variant
    custom_data TEXT NOT NULL, -- JSON blob storing { "loadout": [], "criticals": [], "armor": {} (optional) etc. }
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_unit_id) REFERENCES units(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_variants_base_unit_id ON custom_unit_variants(base_unit_id);
CREATE INDEX IF NOT EXISTS idx_custom_variants_variant_name ON custom_unit_variants(variant_name);
