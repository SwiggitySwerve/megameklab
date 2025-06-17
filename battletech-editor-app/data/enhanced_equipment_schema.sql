-- =================================================================
-- ENHANCED EQUIPMENT SCHEMA FOR IS/CLAN TECH BASE SUPPORT
-- Addresses all structural issues identified in equipment audit
-- =================================================================

-- =================================================================
-- equipment_categories Table
-- Hierarchical categorization system to replace flat "Unknown" categories
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    parent_category_id INTEGER,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES equipment_categories(id)
);

-- =================================================================
-- equipment_templates Table
-- Immutable base equipment definitions (read-only templates)
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    base_type TEXT NOT NULL, -- Core equipment type (e.g., 'Large Laser', 'Gauss Rifle')
    category_id INTEGER NOT NULL,
    sub_category TEXT, -- More specific classification within category
    description TEXT,
    rules_text TEXT,
    is_template BOOLEAN DEFAULT TRUE,
    template_version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES equipment_categories(id)
);

-- =================================================================
-- tech_base_rules Table
-- Rules and constraints for each technology base
-- =================================================================
CREATE TABLE IF NOT EXISTS tech_base_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_base TEXT NOT NULL CHECK (tech_base IN ('IS', 'Clan', 'Mixed')),
    rule_type TEXT NOT NULL, -- 'weight_modifier', 'slot_modifier', 'cost_modifier', etc.
    base_equipment_type TEXT, -- Equipment type this rule applies to
    modifier_value REAL, -- Multiplier or fixed value
    modifier_type TEXT CHECK (modifier_type IN ('multiplier', 'fixed', 'reduction')),
    description TEXT,
    era_restriction TEXT, -- Era when this rule applies
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- equipment_tech_variants Table
-- Specific IS/Clan variants with complete performance data
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_tech_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    tech_base TEXT NOT NULL CHECK (tech_base IN ('IS', 'Clan', 'Mixed')),
    variant_name TEXT NOT NULL, -- "IS Large Laser", "Clan Large Laser"
    internal_id TEXT UNIQUE NOT NULL, -- Derived ID for compatibility
    
    -- Physical Characteristics
    weight_tons REAL NOT NULL,
    critical_slots INTEGER NOT NULL,
    
    -- Combat Performance (for weapons)
    damage INTEGER,
    heat_generated INTEGER,
    range_short INTEGER,
    range_medium INTEGER,
    range_long INTEGER,
    range_extreme INTEGER,
    minimum_range INTEGER DEFAULT 0,
    
    -- Special Characteristics
    ammo_per_ton INTEGER, -- For ammunition equipment
    shots_per_ton INTEGER, -- Alternative ammo measurement
    burst_fire_shots INTEGER, -- For weapons with burst fire
    
    -- Economic Data
    cost_cbills INTEGER,
    battle_value INTEGER,
    
    -- Availability
    introduction_year INTEGER,
    extinction_year INTEGER,
    reintroduction_year INTEGER,
    availability_rating TEXT, -- Common, Uncommon, Rare, etc.
    
    -- Rules and Restrictions
    special_rules TEXT, -- JSON array of special rules
    restrictions TEXT, -- JSON array of restrictions
    incompatible_with TEXT, -- JSON array of incompatible equipment
    
    -- Era and Source Information
    era_category TEXT, -- Age of War, Succession Wars, Clan Invasion, etc.
    rules_level TEXT CHECK (rules_level IN ('Introductory', 'Standard', 'Advanced', 'Experimental', 'Extinct')),
    source_book TEXT,
    page_reference TEXT,
    
    -- System Integration
    is_omnipod BOOLEAN DEFAULT FALSE,
    requires_ammo BOOLEAN DEFAULT FALSE,
    ammo_type TEXT, -- Reference to ammunition type if applicable
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES equipment_templates(id),
    UNIQUE(template_id, tech_base)
);

-- =================================================================
-- equipment_performance_modifiers Table
-- Additional performance modifiers for complex equipment
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_performance_modifiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    modifier_type TEXT NOT NULL, -- 'range_bonus', 'accuracy_bonus', 'heat_reduction', etc.
    modifier_value REAL NOT NULL,
    condition_type TEXT, -- 'always', 'range_dependent', 'situational'
    condition_value TEXT, -- JSON describing when modifier applies
    description TEXT,
    FOREIGN KEY (variant_id) REFERENCES equipment_tech_variants(id) ON DELETE CASCADE
);

-- =================================================================
-- equipment_compatibility Table
-- Cross-tech compatibility and restriction rules
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_compatibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_variant_id INTEGER NOT NULL,
    compatible_tech_base TEXT CHECK (compatible_tech_base IN ('IS', 'Clan', 'Mixed')),
    compatibility_type TEXT CHECK (compatibility_type IN ('required', 'compatible', 'incompatible', 'restricted')),
    restriction_reason TEXT,
    mixed_tech_penalty REAL, -- Additional cost/BV penalty for mixed tech
    era_restriction TEXT,
    FOREIGN KEY (equipment_variant_id) REFERENCES equipment_tech_variants(id) ON DELETE CASCADE
);

-- =================================================================
-- equipment_slot_requirements Table
-- Detailed critical slot requirements by location
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_slot_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    location_type TEXT, -- 'any', 'torso', 'arm', 'leg', 'head', 'engine'
    slots_required INTEGER NOT NULL,
    is_fixed_location BOOLEAN DEFAULT FALSE, -- Must be in specific location
    can_split BOOLEAN DEFAULT TRUE, -- Can be split across multiple locations
    special_requirements TEXT, -- JSON describing special placement rules
    FOREIGN KEY (variant_id) REFERENCES equipment_tech_variants(id) ON DELETE CASCADE
);

-- =================================================================
-- equipment_ammunition Table
-- Ammunition variants and compatibility
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_ammunition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weapon_variant_id INTEGER NOT NULL,
    ammo_variant_id INTEGER NOT NULL,
    ammo_type TEXT NOT NULL, -- 'standard', 'cluster', 'precision', 'armor_piercing', etc.
    rounds_per_ton INTEGER NOT NULL,
    damage_modifier REAL DEFAULT 1.0,
    range_modifier REAL DEFAULT 1.0,
    special_effects TEXT, -- JSON array of special effects
    cost_multiplier REAL DEFAULT 1.0,
    availability_modifier INTEGER DEFAULT 0, -- Modifier to availability rating
    FOREIGN KEY (weapon_variant_id) REFERENCES equipment_tech_variants(id),
    FOREIGN KEY (ammo_variant_id) REFERENCES equipment_tech_variants(id)
);

-- =================================================================
-- equipment_construction_rules Table
-- Rules for equipment placement and construction validation
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_construction_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    rule_type TEXT NOT NULL, -- 'placement', 'displacement', 'dependency', 'limitation'
    rule_description TEXT NOT NULL,
    validation_logic TEXT, -- JSON describing validation rules
    error_message TEXT, -- Message to show when rule is violated
    is_warning BOOLEAN DEFAULT FALSE, -- Whether violation is warning vs error
    FOREIGN KEY (variant_id) REFERENCES equipment_tech_variants(id) ON DELETE CASCADE
);

-- =================================================================
-- equipment_heat_dissipation Table
-- Heat management rules for different equipment and tech bases
-- =================================================================
CREATE TABLE IF NOT EXISTS equipment_heat_dissipation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    base_heat_generation INTEGER DEFAULT 0,
    heat_dissipation INTEGER DEFAULT 0, -- For heat sinks
    engine_heat_scaling BOOLEAN DEFAULT FALSE, -- Whether heat scales with engine
    special_heat_rules TEXT, -- JSON for complex heat interactions
    FOREIGN KEY (variant_id) REFERENCES equipment_tech_variants(id) ON DELETE CASCADE
);

-- =================================================================
-- Legacy equipment table - kept for compatibility during migration
-- =================================================================
-- Note: This table will remain during transition period but equipment_tech_variants
-- will become the primary source of truth for equipment data

-- =================================================================
-- Indexes for Performance
-- =================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_equipment_templates_name ON equipment_templates(name);
CREATE INDEX IF NOT EXISTS idx_equipment_templates_category ON equipment_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_templates_base_type ON equipment_templates(base_type);

CREATE INDEX IF NOT EXISTS idx_equipment_variants_template ON equipment_tech_variants(template_id);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_tech_base ON equipment_tech_variants(tech_base);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_internal_id ON equipment_tech_variants(internal_id);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_name ON equipment_tech_variants(variant_name);

-- Performance lookup indexes
CREATE INDEX IF NOT EXISTS idx_equipment_variants_weight ON equipment_tech_variants(weight_tons);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_slots ON equipment_tech_variants(critical_slots);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_cost ON equipment_tech_variants(cost_cbills);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_bv ON equipment_tech_variants(battle_value);

-- Era and availability indexes
CREATE INDEX IF NOT EXISTS idx_equipment_variants_intro_year ON equipment_tech_variants(introduction_year);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_era ON equipment_tech_variants(era_category);
CREATE INDEX IF NOT EXISTS idx_equipment_variants_rules_level ON equipment_tech_variants(rules_level);

-- Tech base compatibility indexes
CREATE INDEX IF NOT EXISTS idx_compatibility_tech_base ON equipment_compatibility(compatible_tech_base);
CREATE INDEX IF NOT EXISTS idx_compatibility_type ON equipment_compatibility(compatibility_type);

-- Construction rule indexes
CREATE INDEX IF NOT EXISTS idx_construction_rules_type ON equipment_construction_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_slot_requirements_location ON equipment_slot_requirements(location_type);

-- =================================================================
-- Data Population Views for Equipment Categories
-- =================================================================

-- Insert standard equipment categories
INSERT OR IGNORE INTO equipment_categories (name, parent_category_id, description, display_order) VALUES
-- Top Level Categories
('Weapons', NULL, 'All weapon systems', 1),
('Equipment', NULL, 'Non-weapon equipment and systems', 2),
('Ammunition', NULL, 'Ammunition for weapons', 3),
('Engines', NULL, 'Engine systems and components', 4),
('Structure', NULL, 'Internal structure and framework', 5),
('Armor', NULL, 'Armor types and systems', 6);

-- Weapon Subcategories
INSERT OR IGNORE INTO equipment_categories (name, parent_category_id, description, display_order) VALUES
('Energy Weapons', (SELECT id FROM equipment_categories WHERE name = 'Weapons'), 'Laser, PPC, and other energy-based weapons', 11),
('Ballistic Weapons', (SELECT id FROM equipment_categories WHERE name = 'Weapons'), 'Autocannon, Gauss, and projectile weapons', 12),
('Missile Weapons', (SELECT id FROM equipment_categories WHERE name = 'Weapons'), 'LRM, SRM, and guided missile systems', 13);

-- Equipment Subcategories  
INSERT OR IGNORE INTO equipment_categories (name, parent_category_id, description, display_order) VALUES
('Heat Management', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'Heat sinks and cooling systems', 21),
('Electronic Warfare', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'ECM, BAP, TAG, and electronic systems', 22),
('Targeting Systems', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'Targeting computers and fire control', 23),
('Special Equipment', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'CASE, MASC, and other special systems', 24),
('Jump Jets', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'Jump jet systems and variants', 25),
('Cockpit Systems', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'Cockpit, life support, and pilot systems', 26),
('Actuators', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'Limb actuators and movement systems', 27);

-- =================================================================
-- Basic Tech Base Rules
-- =================================================================

-- Clan weight reduction rules (typical 10-20% lighter)
INSERT OR IGNORE INTO tech_base_rules (tech_base, rule_type, base_equipment_type, modifier_value, modifier_type, description) VALUES
('Clan', 'weight_modifier', 'Energy Weapons', 0.8, 'multiplier', 'Clan energy weapons typically 20% lighter'),
('Clan', 'weight_modifier', 'Ballistic Weapons', 0.9, 'multiplier', 'Clan ballistic weapons typically 10% lighter'),
('Clan', 'slot_modifier', 'Energy Weapons', 0.5, 'multiplier', 'Clan energy weapons typically use half the slots'),
('Clan', 'slot_modifier', 'XL Engine', 0.67, 'multiplier', 'Clan XL engines use 4 slots vs IS 6 slots'),
('Clan', 'slot_modifier', 'Double Heat Sink', 0.67, 'multiplier', 'Clan DHS use 2 slots vs IS 3 slots');

-- IS specific rules
INSERT OR IGNORE INTO tech_base_rules (tech_base, rule_type, base_equipment_type, modifier_value, modifier_type, description) VALUES
('IS', 'cost_modifier', 'Advanced Technology', 1.5, 'multiplier', 'IS advanced tech typically more expensive'),
('IS', 'availability_modifier', 'Clan Technology', -2, 'reduction', 'Clan tech less available to IS');

-- =================================================================
-- End of Enhanced Equipment Schema
-- =================================================================
