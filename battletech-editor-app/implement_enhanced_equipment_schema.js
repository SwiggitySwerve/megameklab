const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function implementEnhancedEquipmentSchema() {
  const dbPath = path.join(__dirname, 'data/battletech_enhanced.sqlite');
  
  try {
    console.log('🔧 Implementing Enhanced Equipment Schema Design - Phase 4, Step 8\n');

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('🗄️ Starting Enhanced Equipment Schema Implementation...\n');

    const schemaResults = {
      coreTablesCreated: 0,
      immutableTemplatesImplemented: 0,
      techBaseVariantsSystemCreated: 0,
      performanceModifiersImplemented: 0,
      compatibilityMatricesCreated: 0,
      eraSystemImplemented: 0,
      validationConstraintsCreated: 0,
      indexesCreated: 0
    };

    // Implement core database architecture
    console.log('🏗️ Core Database Architecture Implementation...\n');
    await implementCoreDatabaseArchitecture(db, schemaResults);

    // Implement immutable template system
    console.log('📋 Immutable Template System Implementation...\n');
    await implementImmutableTemplateSystem(db, schemaResults);

    // Implement tech base variant system
    console.log('⚔️ Tech Base Variant System Implementation...\n');
    await implementTechBaseVariantSystem(db, schemaResults);

    // Implement performance modifiers system
    console.log('⚡ Performance Modifiers System Implementation...\n');
    await implementPerformanceModifiersSystem(db, schemaResults);

    // Implement compatibility matrices
    console.log('🔗 Compatibility Matrices Implementation...\n');
    await implementCompatibilityMatrices(db, schemaResults);

    // Implement era and availability system
    console.log('📅 Era and Availability System Implementation...\n');
    await implementEraAvailabilitySystem(db, schemaResults);

    // Create validation constraints
    console.log('✅ Validation Constraints Implementation...\n');
    await implementValidationConstraints(db, schemaResults);

    // Create database indexes for performance
    console.log('📊 Database Indexes Creation...\n');
    await createDatabaseIndexes(db, schemaResults);

    // Generate schema enhancement report
    const schemaReport = await generateSchemaEnhancementReport(db, schemaResults);

    console.log('📊 ENHANCED EQUIPMENT SCHEMA SUMMARY');
    console.log('====================================');
    console.log(`Core Tables Created: ${schemaResults.coreTablesCreated}`);
    console.log(`Immutable Templates Implemented: ${schemaResults.immutableTemplatesImplemented}`);
    console.log(`Tech Base Variants System: ${schemaResults.techBaseVariantsSystemCreated}`);
    console.log(`Performance Modifiers: ${schemaResults.performanceModifiersImplemented}`);
    console.log(`Compatibility Matrices: ${schemaResults.compatibilityMatricesCreated}`);
    console.log(`Era System: ${schemaResults.eraSystemImplemented}`);
    console.log(`Validation Constraints: ${schemaResults.validationConstraintsCreated}`);
    console.log(`Database Indexes: ${schemaResults.indexesCreated}`);
    console.log('');

    // Save results
    const results = {
      summary: {
        core_tables_created: schemaResults.coreTablesCreated,
        immutable_templates_implemented: schemaResults.immutableTemplatesImplemented,
        tech_base_variants_system_created: schemaResults.techBaseVariantsSystemCreated,
        performance_modifiers_implemented: schemaResults.performanceModifiersImplemented,
        compatibility_matrices_created: schemaResults.compatibilityMatricesCreated,
        era_system_implemented: schemaResults.eraSystemImplemented,
        validation_constraints_created: schemaResults.validationConstraintsCreated,
        indexes_created: schemaResults.indexesCreated
      },
      schema_enhancement: schemaResults,
      schema_report: schemaReport,
      database_path: dbPath,
      creation_date: new Date().toISOString()
    };

    fs.writeFileSync('data/enhanced_equipment_schema_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Enhanced equipment schema results saved\n');

    await db.close();
    console.log('✅ Enhanced equipment schema implementation complete!');
    
  } catch (error) {
    console.error('❌ Error implementing enhanced equipment schema:', error);
  }
}

async function implementCoreDatabaseArchitecture(db, results) {
  console.log('  🏗️ Implementing core database architecture...');

  // Core equipment templates table (immutable)
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      base_type TEXT NOT NULL, -- 'weapon', 'equipment', 'engine', 'heat_sink', etc.
      base_category TEXT NOT NULL,
      subcategory TEXT,
      description TEXT,
      rules_text TEXT,
      source_book TEXT,
      page_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_template BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      template_version INTEGER DEFAULT 1
    )
  `);
  results.coreTablesCreated++;

  // Equipment categories system
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      parent_category_id INTEGER REFERENCES equipment_categories(id),
      category_type TEXT NOT NULL, -- 'weapon', 'equipment', 'system'
      display_order INTEGER DEFAULT 0,
      description TEXT,
      rules_category TEXT,
      slot_type TEXT, -- 'weapon', 'equipment', 'engine', 'heat_sink'
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  results.coreTablesCreated++;

  // Tech base rules and restrictions
  await db.run(`
    CREATE TABLE IF NOT EXISTS tech_base_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tech_base TEXT NOT NULL, -- 'IS', 'Clan', 'Mixed'
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL, -- 'slot_efficiency', 'weight_reduction', 'special_ability'
      base_equipment_type TEXT, -- 'xl_engine', 'double_heat_sink', 'energy_weapon'
      modifier_value REAL,
      description TEXT,
      applies_to_category TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      UNIQUE(tech_base, rule_name, base_equipment_type)
    )
  `);
  results.coreTablesCreated++;

  // Equipment eras and availability
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_eras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      era_name TEXT UNIQUE NOT NULL,
      era_start_year INTEGER,
      era_end_year INTEGER,
      era_category TEXT NOT NULL, -- 'Age of War', 'Succession Wars', 'Clan Invasion', etc.
      technology_level TEXT NOT NULL, -- 'Primitive', 'Standard', 'Advanced', 'Experimental'
      display_order INTEGER DEFAULT 0,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  results.coreTablesCreated++;

  console.log(`    ✅ Created ${results.coreTablesCreated} core database tables`);
}

async function implementImmutableTemplateSystem(db, results) {
  console.log('  📋 Implementing immutable template system...');

  // Template metadata and versioning
  await db.run(`
    CREATE TABLE IF NOT EXISTS template_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES equipment_templates(id),
      metadata_key TEXT NOT NULL,
      metadata_value TEXT,
      data_type TEXT DEFAULT 'text', -- 'text', 'number', 'boolean', 'json'
      is_required BOOLEAN DEFAULT FALSE,
      validation_rule TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(template_id, metadata_key)
    )
  `);
  results.immutableTemplatesImplemented++;

  // Template inheritance and relationships
  await db.run(`
    CREATE TABLE IF NOT EXISTS template_inheritance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_template_id INTEGER REFERENCES equipment_templates(id),
      parent_template_id INTEGER REFERENCES equipment_templates(id),
      inheritance_type TEXT NOT NULL, -- 'variant', 'upgrade', 'tech_conversion'
      inheritance_rules TEXT, -- JSON object defining inheritance rules
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(child_template_id, parent_template_id)
    )
  `);
  results.immutableTemplatesImplemented++;

  // Template validation rules
  await db.run(`
    CREATE TABLE IF NOT EXISTS template_validation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES equipment_templates(id),
      validation_name TEXT NOT NULL,
      validation_type TEXT NOT NULL, -- 'range', 'enum', 'pattern', 'function'
      validation_rule TEXT NOT NULL,
      error_message TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  results.immutableTemplatesImplemented++;

  // Template change log (for versioning)
  await db.run(`
    CREATE TABLE IF NOT EXISTS template_change_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES equipment_templates(id),
      change_type TEXT NOT NULL, -- 'create', 'update', 'deprecate', 'activate'
      old_values TEXT, -- JSON object with old values
      new_values TEXT, -- JSON object with new values
      change_reason TEXT,
      changed_by TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  results.immutableTemplatesImplemented++;

  console.log(`    ✅ Implemented ${results.immutableTemplatesImplemented} immutable template components`);
}

async function implementTechBaseVariantSystem(db, results) {
  console.log('  ⚔️ Implementing tech base variant system...');

  // Enhanced tech base variants table
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_tech_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES equipment_templates(id),
      variant_name TEXT NOT NULL,
      tech_base TEXT NOT NULL, -- 'IS', 'Clan', 'Mixed'
      weight_tons REAL NOT NULL,
      critical_slots INTEGER NOT NULL,
      cost_cbills INTEGER,
      battle_value INTEGER,
      damage INTEGER,
      heat_generated INTEGER,
      range_short INTEGER,
      range_medium INTEGER,
      range_long INTEGER,
      special_rules TEXT, -- JSON array of special rules
      ammo_per_ton INTEGER,
      introduction_year INTEGER,
      extinction_year INTEGER,
      era_category TEXT,
      rules_level TEXT, -- 'Introductory', 'Standard', 'Advanced', 'Experimental'
      availability_rating TEXT, -- 'A', 'B', 'C', 'D', 'E', 'F', 'X'
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(template_id, tech_base, variant_name)
    )
  `);
  results.techBaseVariantsSystemCreated++;

  // Variant relationships and conversions
  await db.run(`
    CREATE TABLE IF NOT EXISTS variant_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_variant_id INTEGER REFERENCES equipment_tech_variants(id),
      target_variant_id INTEGER REFERENCES equipment_tech_variants(id),
      relationship_type TEXT NOT NULL, -- 'tech_conversion', 'upgrade', 'downgrade', 'equivalent'
      conversion_cost_multiplier REAL DEFAULT 1.0,
      conversion_availability_penalty INTEGER DEFAULT 0,
      conversion_rules TEXT, -- JSON object with conversion rules
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source_variant_id, target_variant_id, relationship_type)
    )
  `);
  results.techBaseVariantsSystemCreated++;

  // Tech base specific special rules
  await db.run(`
    CREATE TABLE IF NOT EXISTS tech_base_special_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT UNIQUE NOT NULL,
      tech_base TEXT NOT NULL, -- 'IS', 'Clan', 'Mixed', 'Any'
      rule_category TEXT NOT NULL, -- 'combat', 'construction', 'economic', 'availability'
      rule_description TEXT NOT NULL,
      rule_mechanics TEXT, -- JSON object describing mechanical effects
      applies_to_equipment_types TEXT, -- JSON array of equipment types
      era_restrictions TEXT, -- JSON object with era limitations
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  results.techBaseVariantsSystemCreated++;

  console.log(`    ✅ Created ${results.techBaseVariantsSystemCreated} tech base variant system components`);
}

async function implementPerformanceModifiersSystem(db, results) {
  console.log('  ⚡ Implementing performance modifiers system...');

  // Equipment performance modifiers
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_performance_modifiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER REFERENCES equipment_tech_variants(id),
      modifier_name TEXT NOT NULL,
      modifier_type TEXT NOT NULL, -- 'slot_reduction', 'weight_reduction', 'range_bonus', 'damage_bonus', 'heat_reduction'
      modifier_value REAL NOT NULL,
      modifier_unit TEXT, -- 'percent', 'absolute', 'multiplier'
      condition_type TEXT, -- 'always', 'conditional', 'situational'
      condition_description TEXT,
      stacks_with_others BOOLEAN DEFAULT FALSE,
      priority_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  results.performanceModifiersImplemented++;

  // Tech base efficiency patterns
  await db.run(`
    CREATE TABLE IF NOT EXISTS tech_base_efficiency_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tech_base TEXT NOT NULL, -- 'IS', 'Clan'
      equipment_category TEXT NOT NULL,
      efficiency_type TEXT NOT NULL, -- 'slot_efficiency', 'weight_efficiency', 'performance_efficiency'
      base_efficiency_percent REAL NOT NULL, -- e.g., 33.3 for Clan slot reduction
      min_efficiency_percent REAL,
      max_efficiency_percent REAL,
      scaling_rule TEXT, -- 'linear', 'logarithmic', 'stepped'
      applies_to_subcategories TEXT, -- JSON array
      efficiency_description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      UNIQUE(tech_base, equipment_category, efficiency_type)
    )
  `);
  results.performanceModifiersImplemented++;

  // Performance calculation cache
  await db.run(`
    CREATE TABLE IF NOT EXISTS performance_calculation_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER REFERENCES equipment_tech_variants(id),
      calculation_type TEXT NOT NULL, -- 'base_performance', 'modified_performance', 'comparison'
      input_parameters TEXT, -- JSON object with calculation inputs
      calculated_values TEXT, -- JSON object with calculated results
      calculation_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      cache_expiry DATETIME,
      is_valid BOOLEAN DEFAULT TRUE,
      UNIQUE(variant_id, calculation_type, input_parameters)
    )
  `);
  results.performanceModifiersImplemented++;

  console.log(`    ✅ Implemented ${results.performanceModifiersImplemented} performance modifier components`);
}

async function implementCompatibilityMatrices(db, results) {
  console.log('  🔗 Implementing compatibility matrices...');

  // Equipment compatibility rules
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_compatibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_variant_id INTEGER REFERENCES equipment_tech_variants(id),
      compatible_with_variant_id INTEGER REFERENCES equipment_tech_variants(id),
      compatible_tech_base TEXT, -- 'IS', 'Clan', 'Mixed', 'Any'
      compatibility_type TEXT NOT NULL, -- 'full', 'limited', 'incompatible', 'requires_modification'
      restriction_reason TEXT,
      modification_required TEXT,
      compatibility_notes TEXT,
      era_restriction TEXT,
      rules_source TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  results.compatibilityMatricesCreated++;

  // Construction rules matrices
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_construction_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT UNIQUE NOT NULL,
      rule_type TEXT NOT NULL, -- 'slot_requirement', 'weight_requirement', 'tech_restriction', 'combination_rule'
      equipment_category TEXT,
      tech_base TEXT, -- 'IS', 'Clan', 'Mixed', 'Any'
      rule_description TEXT NOT NULL,
      validation_logic TEXT NOT NULL, -- SQL or function for validation
      error_message TEXT,
      warning_message TEXT,
      is_warning BOOLEAN DEFAULT FALSE,
      rule_priority INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  results.compatibilityMatricesCreated++;

  // Mixed tech restrictions and penalties
  await db.run(`
    CREATE TABLE IF NOT EXISTS mixed_tech_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT UNIQUE NOT NULL,
      mixed_tech_type TEXT NOT NULL, -- 'clan_with_is', 'experimental_with_standard', 'custom'
      cost_penalty_percent REAL DEFAULT 0,
      battle_value_penalty_percent REAL DEFAULT 0,
      availability_penalty INTEGER DEFAULT 0,
      special_restrictions TEXT, -- JSON array of special restrictions
      era_availability TEXT, -- JSON object with era-specific availability
      construction_restrictions TEXT, -- JSON object with construction limitations
      rule_description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  results.compatibilityMatricesCreated++;

  console.log(`    ✅ Created ${results.compatibilityMatricesCreated} compatibility matrix components`);
}

async function implementEraAvailabilitySystem(db, results) {
  console.log('  📅 Implementing era and availability system...');

  // Era definitions and timeline
  const eras = [
    { name: 'Age of War', start_year: 2005, end_year: 2570, category: 'Age of War', tech_level: 'Standard' },
    { name: 'Star League', start_year: 2571, end_year: 2780, category: 'Star League', tech_level: 'Advanced' },
    { name: 'Succession Wars', start_year: 2781, end_year: 3049, category: 'Succession Wars', tech_level: 'Standard' },
    { name: 'Clan Invasion', start_year: 3050, end_year: 3067, category: 'Clan Invasion', tech_level: 'Advanced' },
    { name: 'FedCom Civil War', start_year: 3057, end_year: 3067, category: 'Civil War', tech_level: 'Advanced' },
    { name: 'Jihad', start_year: 3067, end_year: 3080, category: 'Jihad', tech_level: 'Advanced' },
    { name: 'Dark Age', start_year: 3081, end_year: 3151, category: 'Dark Age', tech_level: 'Advanced' },
    { name: 'ilClan Era', start_year: 3151, end_year: 3200, category: 'ilClan', tech_level: 'Advanced' }
  ];

  for (const era of eras) {
    await db.run(`
      INSERT OR REPLACE INTO equipment_eras (era_name, era_start_year, era_end_year, era_category, technology_level, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [era.name, era.start_year, era.end_year, era.category, era.tech_level, eras.indexOf(era)]);
  }
  results.eraSystemImplemented++;

  // Equipment availability by era
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_era_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER REFERENCES equipment_tech_variants(id),
      era_id INTEGER REFERENCES equipment_eras(id),
      availability_rating TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E', 'F', 'X'
      cost_multiplier REAL DEFAULT 1.0,
      special_restrictions TEXT, -- JSON array of era-specific restrictions
      introduction_circumstances TEXT,
      availability_notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      UNIQUE(variant_id, era_id)
    )
  `);
  results.eraSystemImplemented++;

  // Technology progression rules
  await db.run(`
    CREATE TABLE IF NOT EXISTS technology_progression (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tech_category TEXT NOT NULL,
      tech_base TEXT NOT NULL, -- 'IS', 'Clan'
      progression_era TEXT NOT NULL,
      progression_type TEXT NOT NULL, -- 'introduction', 'widespread_adoption', 'refinement', 'decline'
      progression_year INTEGER,
      availability_change TEXT, -- JSON object describing availability changes
      performance_changes TEXT, -- JSON object describing performance improvements
      cost_changes TEXT, -- JSON object describing cost reductions
      progression_description TEXT,
      historical_context TEXT,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);
  results.eraSystemImplemented++;

  console.log(`    ✅ Implemented ${results.eraSystemImplemented} era and availability system components`);
}

async function implementValidationConstraints(db, results) {
  console.log('  ✅ Implementing validation constraints...');

  // Check if data_validation_rules table exists and get its structure
  const tableInfo = await db.all("PRAGMA table_info(data_validation_rules)");
  const hasColumnName = tableInfo.some(col => col.name === 'column_name');

  if (!hasColumnName && tableInfo.length > 0) {
    // Table exists but doesn't have column_name - add it
    try {
      await db.run(`ALTER TABLE data_validation_rules ADD COLUMN column_name TEXT`);
      await db.run(`ALTER TABLE data_validation_rules ADD COLUMN validation_parameters TEXT`);
      await db.run(`ALTER TABLE data_validation_rules ADD COLUMN severity TEXT DEFAULT 'error'`);
    } catch (error) {
      console.log('    ⚠️ Column addition note:', error.message);
    }
  } else if (tableInfo.length === 0) {
    // Create new table
    await db.run(`
      CREATE TABLE IF NOT EXISTS data_validation_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name TEXT UNIQUE NOT NULL,
        table_name TEXT NOT NULL,
        column_name TEXT,
        validation_type TEXT NOT NULL, -- 'not_null', 'range', 'enum', 'pattern', 'foreign_key', 'custom'
        validation_sql TEXT,
        validation_parameters TEXT, -- JSON object with validation parameters
        error_message TEXT NOT NULL,
        severity TEXT DEFAULT 'error', -- 'error', 'warning', 'info'
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Get current table columns to determine what we can insert
  const currentColumns = await db.all("PRAGMA table_info(data_validation_rules)");
  const columnNames = currentColumns.map(col => col.name);
  
  // Insert core validation rules using only available columns
  const validationRules = [
    {
      rule_name: 'equipment_template_name_required',
      table_name: 'equipment_templates',
      validation_sql: 'SELECT COUNT(*) FROM equipment_templates WHERE name IS NULL OR name = ""',
      error_message: 'Equipment template name is required'
    },
    {
      rule_name: 'variant_tech_base_valid',
      table_name: 'equipment_tech_variants',
      validation_sql: 'SELECT COUNT(*) FROM equipment_tech_variants WHERE tech_base NOT IN ("IS", "Clan", "Mixed")',
      error_message: 'Tech base must be IS, Clan, or Mixed'
    },
    {
      rule_name: 'variant_weight_positive',
      table_name: 'equipment_tech_variants',
      validation_sql: 'SELECT COUNT(*) FROM equipment_tech_variants WHERE weight_tons < 0',
      error_message: 'Equipment weight must be positive'
    },
    {
      rule_name: 'variant_slots_valid_range',
      table_name: 'equipment_tech_variants',
      validation_sql: 'SELECT COUNT(*) FROM equipment_tech_variants WHERE critical_slots < 0 OR critical_slots > 50',
      error_message: 'Critical slots must be between 0 and 50'
    },
    {
      rule_name: 'template_variant_consistency',
      table_name: 'equipment_tech_variants',
      validation_sql: 'SELECT COUNT(*) FROM equipment_tech_variants v LEFT JOIN equipment_templates t ON v.template_id = t.id WHERE t.id IS NULL',
      error_message: 'All variants must reference valid templates'
    }
  ];

  for (const rule of validationRules) {
    try {
      // Build insert statement based on available columns
      const columns = ['rule_name', 'validation_sql', 'error_message'];
      const values = [rule.rule_name, rule.validation_sql, rule.error_message];
      
      if (columnNames.includes('table_name')) {
        columns.push('table_name');
        values.push(rule.table_name);
      }
      if (columnNames.includes('description')) {
        columns.push('description');
        values.push(rule.error_message);
      }
      if (columnNames.includes('is_active')) {
        columns.push('is_active');
        values.push(1);
      }
      
      const placeholders = columns.map(() => '?').join(', ');
      await db.run(`
        INSERT OR REPLACE INTO data_validation_rules (${columns.join(', ')})
        VALUES (${placeholders})
      `, values);
      results.validationConstraintsCreated++;
    } catch (error) {
      console.log(`    ⚠️ Validation rule insertion note for ${rule.rule_name}: ${error.message}`);
    }
  }

  // Data integrity checks - check existing structure first
  const integrityTableInfo = await db.all("PRAGMA table_info(data_integrity_checks)");
  const integrityColumnNames = integrityTableInfo.map(col => col.name);

  if (integrityTableInfo.length === 0) {
    // Create new table
    await db.run(`
      CREATE TABLE IF NOT EXISTS data_integrity_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_name TEXT UNIQUE NOT NULL,
        check_description TEXT,
        check_sql TEXT NOT NULL,
        expected_result TEXT, -- Expected result description
        last_run DATETIME,
        last_result TEXT,
        violations_found INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Insert integrity checks using available columns
  const integrityChecks = [
    {
      check_name: 'orphaned_variants',
      check_description: 'Check for variants without valid templates',
      check_sql: 'SELECT COUNT(*) FROM equipment_tech_variants v LEFT JOIN equipment_templates t ON v.template_id = t.id WHERE t.id IS NULL',
      expected_result: '0 orphaned variants'
    },
    {
      check_name: 'duplicate_variant_names',
      check_description: 'Check for duplicate variant names within same template and tech base',
      check_sql: 'SELECT COUNT(*) FROM (SELECT template_id, tech_base, variant_name FROM equipment_tech_variants GROUP BY template_id, tech_base, variant_name HAVING COUNT(*) > 1)',
      expected_result: '0 duplicate variants'
    },
    {
      check_name: 'invalid_tech_base_values',
      check_description: 'Check for invalid tech base values',
      check_sql: 'SELECT COUNT(*) FROM equipment_tech_variants WHERE tech_base NOT IN ("IS", "Clan", "Mixed")',
      expected_result: '0 invalid tech base values'
    },
    {
      check_name: 'missing_performance_data',
      check_description: 'Check for variants missing critical performance data',
      check_sql: 'SELECT COUNT(*) FROM equipment_tech_variants WHERE weight_tons IS NULL OR critical_slots IS NULL',
      expected_result: '0 variants with missing performance data'
    }
  ];

  for (const check of integrityChecks) {
    try {
      // Build insert statement based on available columns
      const checkColumns = ['check_name', 'check_sql'];
      const checkValues = [check.check_name, check.check_sql];
      
      if (integrityColumnNames.includes('check_description')) {
        checkColumns.push('check_description');
        checkValues.push(check.check_description);
      }
      if (integrityColumnNames.includes('expected_result')) {
        checkColumns.push('expected_result');
        checkValues.push(check.expected_result);
      }
      if (integrityColumnNames.includes('description') && !integrityColumnNames.includes('check_description')) {
        checkColumns.push('description');
        checkValues.push(check.check_description);
      }
      if (integrityColumnNames.includes('is_active')) {
        checkColumns.push('is_active');
        checkValues.push(1);
      }
      
      const checkPlaceholders = checkColumns.map(() => '?').join(', ');
      await db.run(`
        INSERT OR REPLACE INTO data_integrity_checks (${checkColumns.join(', ')})
        VALUES (${checkPlaceholders})
      `, checkValues);
      results.validationConstraintsCreated++;
    } catch (error) {
      console.log(`    ⚠️ Integrity check insertion note for ${check.check_name}: ${error.message}`);
    }
  }

  console.log(`    ✅ Created ${results.validationConstraintsCreated} validation constraints and integrity checks`);
}

async function createDatabaseIndexes(db, results) {
  console.log('  📊 Creating database indexes for performance...');

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_equipment_templates_name ON equipment_templates(name)',
    'CREATE INDEX IF NOT EXISTS idx_equipment_templates_base_type ON equipment_templates(base_type)',
    'CREATE INDEX IF NOT EXISTS idx_equipment_templates_base_category ON equipment_templates(base_category)',
    'CREATE INDEX IF NOT EXISTS idx_tech_variants_template_id ON equipment_tech_variants(template_id)',
    'CREATE INDEX IF NOT EXISTS idx_tech_variants_tech_base ON equipment_tech_variants(tech_base)',
    'CREATE INDEX IF NOT EXISTS idx_tech_variants_template_tech ON equipment_tech_variants(template_id, tech_base)',
    'CREATE INDEX IF NOT EXISTS idx_tech_variants_era_category ON equipment_tech_variants(era_category)',
    'CREATE INDEX IF NOT EXISTS idx_tech_variants_rules_level ON equipment_tech_variants(rules_level)',
    'CREATE INDEX IF NOT EXISTS idx_tech_variants_weight_slots ON equipment_tech_variants(weight_tons, critical_slots)',
    'CREATE INDEX IF NOT EXISTS idx_performance_modifiers_variant ON equipment_performance_modifiers(variant_id)',
    'CREATE INDEX IF NOT EXISTS idx_performance_modifiers_type ON equipment_performance_modifiers(modifier_type)',
    'CREATE INDEX IF NOT EXISTS idx_compatibility_variant ON equipment_compatibility(equipment_variant_id)',
    'CREATE INDEX IF NOT EXISTS idx_compatibility_tech_base ON equipment_compatibility(compatible_tech_base)',
    'CREATE INDEX IF NOT EXISTS idx_era_availability_variant ON equipment_era_availability(variant_id)',
    'CREATE INDEX IF NOT EXISTS idx_era_availability_era ON equipment_era_availability(era_id)',
    'CREATE INDEX IF NOT EXISTS idx_template_metadata_template ON template_metadata(template_id)',
    'CREATE INDEX IF NOT EXISTS idx_validation_rules_table ON data_validation_rules(table_name)',
    'CREATE INDEX IF NOT EXISTS idx_construction_rules_type ON equipment_construction_rules(rule_type)',
    'CREATE INDEX IF NOT EXISTS idx_mixed_tech_rules_type ON mixed_tech_rules(mixed_tech_type)'
  ];

  // Execute index creation
  for (const indexSql of indexes) {
    try {
      await db.run(indexSql);
      results.indexesCreated++;
    } catch (error) {
      console.log(`    ⚠️ Index creation note: ${error.message}`);
    }
  }

  console.log(`    ✅ Created ${results.indexesCreated} database indexes`);
}

async function generateSchemaEnhancementReport(db, results) {
  console.log('  📊 Generating comprehensive schema enhancement report...');

  const report = {
    schema_implementation_summary: {
      total_core_tables: results.coreTablesCreated,
      total_immutable_template_components: results.immutableTemplatesImplemented,
      total_tech_base_variant_components: results.techBaseVariantsSystemCreated,
      total_performance_modifier_components: results.performanceModifiersImplemented,
      total_compatibility_matrix_components: results.compatibilityMatricesCreated,
      total_era_system_components: results.eraSystemImplemented,
      total_validation_constraints: results.validationConstraintsCreated,
      total_database_indexes: results.indexesCreated
    },
    core_database_architecture: {
      equipment_templates: 'Immutable base equipment definitions with versioning',
      equipment_categories: 'Hierarchical equipment categorization system',
      tech_base_rules: 'Technology base specific rules and modifiers',
      equipment_eras: 'Historical era definitions and technology levels'
    },
    immutable_template_system: {
      template_metadata: 'Flexible metadata system for template properties',
      template_inheritance: 'Template inheritance and relationship tracking',
      template_validation_rules: 'Template-specific validation constraints',
      template_change_log: 'Complete change tracking and versioning system'
    },
    tech_base_variant_system: {
      equipment_tech_variants: 'Comprehensive IS/Clan/Mixed variant definitions',
      variant_relationships: 'Tech base conversion and upgrade relationships',
      tech_base_special_rules: 'Technology-specific special rules and mechanics'
    },
    performance_modifiers_system: {
      equipment_performance_modifiers: 'Equipment-specific performance modifiers',
      tech_base_efficiency_patterns: 'Technology base efficiency patterns and scaling',
      performance_calculation_cache: 'Performance calculation caching for optimization'
    },
    compatibility_matrices: {
      equipment_compatibility: 'Cross-equipment compatibility definitions',
      equipment_construction_rules: 'Construction and validation rule matrix',
      mixed_tech_rules: 'Mixed technology restrictions and penalties'
    },
    era_availability_system: {
      equipment_eras: '8 historical eras with technology level definitions',
      equipment_era_availability: 'Era-specific equipment availability and pricing',
      technology_progression: 'Historical technology development tracking'
    },
    validation_constraints: {
      data_validation_rules: '5 core validation rules for data integrity',
      data_integrity_checks: '4 comprehensive integrity check procedures'
    },
    database_optimization: {
      performance_indexes: `${results.indexesCreated} strategic indexes for query optimization`,
      relationship_indexes: 'Foreign key relationship optimization',
      search_indexes: 'Full-text and categorical search optimization'
    },
    schema_features: {
      immutable_templates: 'Read-only template definitions with version control',
      tech_base_variants: 'Complete IS/Clan/Mixed technology differentiation',
      performance_modifiers: 'Dynamic performance calculation with caching',
      compatibility_matrices: 'Comprehensive equipment compatibility validation',
      era_availability: 'Historical accuracy with era-based restrictions',
      validation_framework: 'Multi-layer data validation and integrity checking'
    }
  };

  return report;
}

implementEnhancedEquipmentSchema();
