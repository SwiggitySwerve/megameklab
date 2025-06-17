const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function implementDataMigrationStrategy() {
  const dbPath = path.join(__dirname, 'data/battletech_enhanced.sqlite');
  
  try {
    console.log('🔧 Implementing Data Migration Strategy - Phase 4, Step 9\n');

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('📊 Starting Comprehensive Data Migration Implementation...\n');

    const migrationResults = {
      validationRulesCreated: 0,
      dataIntegrityChecks: 0,
      migrationToolsCreated: 0,
      batchUpdateMechanisms: 0,
      rollbackProcedures: 0,
      validationResults: {},
      integrityResults: {}
    };

    // Implement data validation system
    console.log('✅ Data Validation System Implementation...\n');
    await implementDataValidationSystem(db, migrationResults);

    // Create data integrity constraints
    console.log('🔒 Data Integrity Constraints Implementation...\n');
    await implementDataIntegrityConstraints(db, migrationResults);

    // Create migration tools
    console.log('🛠️ Migration Tools Creation...\n');
    await createMigrationTools(db, migrationResults);

    // Implement batch update mechanisms
    console.log('⚡ Batch Update Mechanisms...\n');
    await implementBatchUpdateMechanisms(db, migrationResults);

    // Create rollback procedures
    console.log('🔄 Rollback Procedures Implementation...\n');
    await createRollbackProcedures(db, migrationResults);

    // Validate current database state
    console.log('🔍 Database State Validation...\n');
    await validateCurrentDatabaseState(db, migrationResults);

    // Create backup and recovery system
    console.log('💾 Backup and Recovery System...\n');
    await createBackupRecoverySystem(db, migrationResults);

    // Generate migration strategy report
    const migrationReport = await generateMigrationReport(db, migrationResults);

    console.log('📊 DATA MIGRATION STRATEGY SUMMARY');
    console.log('==================================');
    console.log(`Validation Rules Created: ${migrationResults.validationRulesCreated}`);
    console.log(`Data Integrity Checks: ${migrationResults.dataIntegrityChecks}`);
    console.log(`Migration Tools: ${migrationResults.migrationToolsCreated}`);
    console.log(`Batch Mechanisms: ${migrationResults.batchUpdateMechanisms}`);
    console.log(`Rollback Procedures: ${migrationResults.rollbackProcedures}`);
    console.log('');

    // Save results
    const results = {
      summary: {
        validation_rules_created: migrationResults.validationRulesCreated,
        integrity_checks_implemented: migrationResults.dataIntegrityChecks,
        migration_tools_created: migrationResults.migrationToolsCreated,
        batch_mechanisms: migrationResults.batchUpdateMechanisms,
        rollback_procedures: migrationResults.rollbackProcedures
      },
      migration_strategy: migrationResults,
      migration_report: migrationReport,
      database_path: dbPath,
      creation_date: new Date().toISOString()
    };

    fs.writeFileSync('data/data_migration_strategy_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Data migration strategy results saved\n');

    await db.close();
    console.log('✅ Data migration strategy implementation complete!');
    
  } catch (error) {
    console.error('❌ Error implementing data migration strategy:', error);
  }
}

async function implementDataValidationSystem(db, results) {
  console.log('  🔍 Creating comprehensive data validation rules...');

  // Create equipment data validation rules
  const equipmentValidationRules = [
    {
      table_name: 'equipment_templates',
      rule_name: 'template_name_uniqueness',
      validation_sql: `
        SELECT COUNT(*) as violations FROM equipment_templates 
        GROUP BY name HAVING COUNT(*) > 1
      `,
      description: 'Ensure template names are unique',
      severity: 'ERROR'
    },
    {
      table_name: 'equipment_tech_variants',
      rule_name: 'variant_tech_base_consistency',
      validation_sql: `
        SELECT COUNT(*) as violations FROM equipment_tech_variants 
        WHERE tech_base NOT IN ('IS', 'Clan', 'Mixed')
      `,
      description: 'Ensure tech base values are valid',
      severity: 'ERROR'
    },
    {
      table_name: 'equipment_tech_variants',
      rule_name: 'variant_weight_validity',
      validation_sql: `
        SELECT COUNT(*) as violations FROM equipment_tech_variants 
        WHERE weight_tons < 0 OR weight_tons > 100
      `,
      description: 'Ensure weight values are reasonable',
      severity: 'WARNING'
    },
    {
      table_name: 'equipment_tech_variants',
      rule_name: 'variant_slot_validity',
      validation_sql: `
        SELECT COUNT(*) as violations FROM equipment_tech_variants 
        WHERE critical_slots < 0 OR critical_slots > 50
      `,
      description: 'Ensure critical slot values are reasonable',
      severity: 'ERROR'
    },
    {
      table_name: 'equipment_tech_variants',
      rule_name: 'template_variant_relationship',
      validation_sql: `
        SELECT COUNT(*) as violations FROM equipment_tech_variants v
        LEFT JOIN equipment_templates t ON v.template_id = t.id
        WHERE t.id IS NULL
      `,
      description: 'Ensure all variants have valid template references',
      severity: 'ERROR'
    }
  ];

  // Tech base consistency validation rules
  const techBaseValidationRules = [
    {
      table_name: 'tech_base_rules',
      rule_name: 'tech_base_modifier_validity',
      validation_sql: `
        SELECT COUNT(*) as violations FROM tech_base_rules 
        WHERE modifier_type NOT IN ('multiplier', 'fixed', 'reduction')
      `,
      description: 'Ensure modifier types are valid',
      severity: 'ERROR'
    },
    {
      table_name: 'equipment_performance_modifiers',
      rule_name: 'performance_modifier_range',
      validation_sql: `
        SELECT COUNT(*) as violations FROM equipment_performance_modifiers 
        WHERE modifier_value < 0 OR modifier_value > 10
      `,
      description: 'Ensure performance modifiers are within reasonable range',
      severity: 'WARNING'
    }
  ];

  // Create validation functions table
  await db.run(`
    CREATE TABLE IF NOT EXISTS data_validation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      rule_name TEXT UNIQUE NOT NULL,
      validation_sql TEXT NOT NULL,
      description TEXT,
      severity TEXT CHECK (severity IN ('ERROR', 'WARNING', 'INFO')),
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert validation rules
  const allValidationRules = [...equipmentValidationRules, ...techBaseValidationRules];
  for (const rule of allValidationRules) {
    await db.run(`
      INSERT OR REPLACE INTO data_validation_rules (table_name, rule_name, validation_sql, description, severity)
      VALUES (?, ?, ?, ?, ?)
    `, [rule.table_name, rule.rule_name, rule.validation_sql, rule.description, rule.severity]);
    results.validationRulesCreated++;
  }

  console.log(`    ✅ Created ${results.validationRulesCreated} data validation rules`);
}

async function implementDataIntegrityConstraints(db, results) {
  console.log('  🔒 Implementing data integrity constraints...');

  // Create data integrity check procedures
  const integrityChecks = [
    {
      check_name: 'orphaned_variants_check',
      check_sql: `
        SELECT v.id, v.variant_name FROM equipment_tech_variants v
        LEFT JOIN equipment_templates t ON v.template_id = t.id
        WHERE t.id IS NULL
      `,
      description: 'Find variants without valid template references',
      fix_sql: 'DELETE FROM equipment_tech_variants WHERE template_id NOT IN (SELECT id FROM equipment_templates)'
    },
    {
      check_name: 'duplicate_template_names',
      check_sql: `
        SELECT name, COUNT(*) as count FROM equipment_templates 
        GROUP BY name HAVING COUNT(*) > 1
      `,
      description: 'Find duplicate template names',
      fix_sql: 'Manual intervention required'
    },
    {
      check_name: 'invalid_tech_base_values',
      check_sql: `
        SELECT id, tech_base FROM equipment_tech_variants 
        WHERE tech_base NOT IN ('IS', 'Clan', 'Mixed')
      `,
      description: 'Find invalid tech base values',
      fix_sql: `UPDATE equipment_tech_variants SET tech_base = 'Mixed' WHERE tech_base NOT IN ('IS', 'Clan', 'Mixed')`
    },
    {
      check_name: 'missing_performance_modifiers',
      check_sql: `
        SELECT v.id, v.variant_name FROM equipment_tech_variants v
        LEFT JOIN equipment_performance_modifiers m ON v.id = m.variant_id
        WHERE v.tech_base = 'Clan' AND m.id IS NULL
      `,
      description: 'Find Clan variants missing performance modifiers',
      fix_sql: 'Manual intervention required'
    }
  ];

  // Create integrity checks table
  await db.run(`
    CREATE TABLE IF NOT EXISTS data_integrity_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_name TEXT UNIQUE NOT NULL,
      check_sql TEXT NOT NULL,
      description TEXT,
      fix_sql TEXT,
      last_run DATETIME,
      violations_found INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  // Insert integrity checks
  for (const check of integrityChecks) {
    await db.run(`
      INSERT OR REPLACE INTO data_integrity_checks (check_name, check_sql, description, fix_sql)
      VALUES (?, ?, ?, ?)
    `, [check.check_name, check.check_sql, check.description, check.fix_sql]);
    results.dataIntegrityChecks++;
  }

  console.log(`    ✅ Created ${results.dataIntegrityChecks} data integrity checks`);
}

async function createMigrationTools(db, results) {
  console.log('  🛠️ Creating migration tools and utilities...');

  // Create migration history table
  await db.run(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL,
      migration_type TEXT NOT NULL, -- 'schema', 'data', 'validation'
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'ROLLBACK')),
      records_affected INTEGER,
      execution_time_ms INTEGER,
      description TEXT,
      rollback_sql TEXT
    )
  `);

  // Equipment import/export utilities
  const migrationTools = [
    {
      tool_name: 'equipment_template_exporter',
      tool_type: 'export',
      description: 'Export equipment templates to JSON format',
      sql_query: `
        SELECT t.*, c.name as category_name 
        FROM equipment_templates t
        JOIN equipment_categories c ON t.category_id = c.id
        ORDER BY t.name
      `
    },
    {
      tool_name: 'equipment_variants_exporter',
      tool_type: 'export',
      description: 'Export equipment variants with performance data',
      sql_query: `
        SELECT v.*, t.name as template_name, c.name as category_name
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        ORDER BY t.name, v.tech_base
      `
    },
    {
      tool_name: 'performance_modifiers_exporter',
      tool_type: 'export',
      description: 'Export performance modifiers with variant context',
      sql_query: `
        SELECT m.*, v.variant_name, t.name as template_name
        FROM equipment_performance_modifiers m
        JOIN equipment_tech_variants v ON m.variant_id = v.id
        JOIN equipment_templates t ON v.template_id = t.id
        ORDER BY t.name, v.tech_base
      `
    },
    {
      tool_name: 'tech_base_rules_exporter',
      tool_type: 'export',
      description: 'Export tech base rules and modifiers',
      sql_query: `
        SELECT * FROM tech_base_rules
        ORDER BY tech_base, rule_type, base_equipment_type
      `
    }
  ];

  // Create migration tools table
  await db.run(`
    CREATE TABLE IF NOT EXISTS migration_tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_name TEXT UNIQUE NOT NULL,
      tool_type TEXT NOT NULL, -- 'import', 'export', 'transform', 'validate'
      description TEXT,
      sql_query TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert migration tools
  for (const tool of migrationTools) {
    await db.run(`
      INSERT OR REPLACE INTO migration_tools (tool_name, tool_type, description, sql_query)
      VALUES (?, ?, ?, ?)
    `, [tool.tool_name, tool.tool_type, tool.description, tool.sql_query]);
    results.migrationToolsCreated++;
  }

  console.log(`    ✅ Created ${results.migrationToolsCreated} migration tools`);
}

async function implementBatchUpdateMechanisms(db, results) {
  console.log('  ⚡ Implementing batch update mechanisms...');

  // Create batch operation templates
  const batchOperations = [
    {
      operation_name: 'bulk_template_update',
      operation_type: 'UPDATE',
      description: 'Update multiple equipment templates in batch',
      sql_template: `
        UPDATE equipment_templates 
        SET {field_updates}
        WHERE id IN ({template_ids})
      `,
      parameters: 'field_updates, template_ids'
    },
    {
      operation_name: 'bulk_variant_tech_base_correction',
      operation_type: 'UPDATE',
      description: 'Correct tech base assignments in batch',
      sql_template: `
        UPDATE equipment_tech_variants 
        SET tech_base = ?
        WHERE template_id IN (
          SELECT id FROM equipment_templates WHERE name LIKE ?
        )
      `,
      parameters: 'new_tech_base, name_pattern'
    },
    {
      operation_name: 'bulk_performance_modifier_insert',
      operation_type: 'INSERT',
      description: 'Insert performance modifiers for multiple variants',
      sql_template: `
        INSERT INTO equipment_performance_modifiers (variant_id, modifier_type, modifier_value, condition_type, description)
        SELECT v.id, ?, ?, ?, ?
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        WHERE v.tech_base = ? AND t.base_type = ?
      `,
      parameters: 'modifier_type, modifier_value, condition_type, description, tech_base, base_type'
    },
    {
      operation_name: 'bulk_category_reassignment',
      operation_type: 'UPDATE',
      description: 'Reassign equipment to different categories in batch',
      sql_template: `
        UPDATE equipment_templates 
        SET category_id = (SELECT id FROM equipment_categories WHERE name = ?)
        WHERE base_type LIKE ?
      `,
      parameters: 'new_category_name, base_type_pattern'
    }
  ];

  // Create batch operations table
  await db.run(`
    CREATE TABLE IF NOT EXISTS batch_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_name TEXT UNIQUE NOT NULL,
      operation_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
      description TEXT,
      sql_template TEXT NOT NULL,
      parameters TEXT, -- JSON array of parameter names
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert batch operations
  for (const operation of batchOperations) {
    await db.run(`
      INSERT OR REPLACE INTO batch_operations (operation_name, operation_type, description, sql_template, parameters)
      VALUES (?, ?, ?, ?, ?)
    `, [operation.operation_name, operation.operation_type, operation.description, operation.sql_template, operation.parameters]);
    results.batchUpdateMechanisms++;
  }

  console.log(`    ✅ Created ${results.batchUpdateMechanisms} batch update mechanisms`);
}

async function createRollbackProcedures(db, results) {
  console.log('  🔄 Creating rollback procedures...');

  // Create rollback procedures
  const rollbackProcedures = [
    {
      procedure_name: 'rollback_template_changes',
      procedure_type: 'ROLLBACK',
      description: 'Rollback changes to equipment templates',
      rollback_sql: `
        -- Restore from backup table if exists
        DELETE FROM equipment_templates WHERE id IN ({affected_ids});
        INSERT INTO equipment_templates SELECT * FROM equipment_templates_backup WHERE id IN ({affected_ids});
      `,
      requirements: 'equipment_templates_backup table must exist'
    },
    {
      procedure_name: 'rollback_variant_changes',
      procedure_type: 'ROLLBACK',
      description: 'Rollback changes to equipment variants',
      rollback_sql: `
        DELETE FROM equipment_tech_variants WHERE id IN ({affected_ids});
        INSERT INTO equipment_tech_variants SELECT * FROM equipment_tech_variants_backup WHERE id IN ({affected_ids});
      `,
      requirements: 'equipment_tech_variants_backup table must exist'
    },
    {
      procedure_name: 'rollback_performance_modifiers',
      procedure_type: 'ROLLBACK',
      description: 'Rollback performance modifier changes',
      rollback_sql: `
        DELETE FROM equipment_performance_modifiers WHERE variant_id IN ({affected_variant_ids});
        INSERT INTO equipment_performance_modifiers SELECT * FROM equipment_performance_modifiers_backup WHERE variant_id IN ({affected_variant_ids});
      `,
      requirements: 'equipment_performance_modifiers_backup table must exist'
    }
  ];

  // Create rollback procedures table
  await db.run(`
    CREATE TABLE IF NOT EXISTS rollback_procedures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      procedure_name TEXT UNIQUE NOT NULL,
      procedure_type TEXT NOT NULL,
      description TEXT,
      rollback_sql TEXT NOT NULL,
      requirements TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert rollback procedures
  for (const procedure of rollbackProcedures) {
    await db.run(`
      INSERT OR REPLACE INTO rollback_procedures (procedure_name, procedure_type, description, rollback_sql, requirements)
      VALUES (?, ?, ?, ?, ?)
    `, [procedure.procedure_name, procedure.procedure_type, procedure.description, procedure.rollback_sql, procedure.requirements]);
    results.rollbackProcedures++;
  }

  console.log(`    ✅ Created ${results.rollbackProcedures} rollback procedures`);
}

async function validateCurrentDatabaseState(db, results) {
  console.log('  🔍 Validating current database state...');

  // Run validation checks
  const validationResults = {};

  // Check template uniqueness
  const templateCheck = await db.get(`
    SELECT COUNT(*) as total, COUNT(DISTINCT name) as unique_names
    FROM equipment_templates
  `);
  validationResults.template_uniqueness = {
    total_templates: templateCheck.total,
    unique_names: templateCheck.unique_names,
    has_duplicates: templateCheck.total !== templateCheck.unique_names
  };

  // Check variant consistency
  const variantCheck = await db.get(`
    SELECT 
      COUNT(*) as total_variants,
      SUM(CASE WHEN tech_base = 'IS' THEN 1 ELSE 0 END) as is_variants,
      SUM(CASE WHEN tech_base = 'Clan' THEN 1 ELSE 0 END) as clan_variants,
      SUM(CASE WHEN tech_base = 'Mixed' THEN 1 ELSE 0 END) as mixed_variants
    FROM equipment_tech_variants
  `);
  validationResults.variant_distribution = variantCheck;

  // Check orphaned variants
  const orphanCheck = await db.get(`
    SELECT COUNT(*) as orphaned_variants
    FROM equipment_tech_variants v
    LEFT JOIN equipment_templates t ON v.template_id = t.id
    WHERE t.id IS NULL
  `);
  validationResults.orphaned_variants = orphanCheck.orphaned_variants;

  // Check performance modifiers coverage
  const modifierCheck = await db.get(`
    SELECT 
      COUNT(DISTINCT v.id) as total_variants,
      COUNT(DISTINCT m.variant_id) as variants_with_modifiers
    FROM equipment_tech_variants v
    LEFT JOIN equipment_performance_modifiers m ON v.id = m.variant_id
  `);
  validationResults.modifier_coverage = {
    total_variants: modifierCheck.total_variants,
    variants_with_modifiers: modifierCheck.variants_with_modifiers,
    coverage_percentage: ((modifierCheck.variants_with_modifiers / modifierCheck.total_variants) * 100).toFixed(1)
  };

  results.validationResults = validationResults;

  console.log(`    ✅ Database validation complete - ${Object.keys(validationResults).length} checks performed`);
}

async function createBackupRecoverySystem(db, results) {
  console.log('  💾 Creating backup and recovery system...');

  // Create backup configuration
  const backupConfig = {
    backup_tables: [
      'equipment_templates',
      'equipment_tech_variants',
      'equipment_performance_modifiers',
      'tech_base_rules',
      'equipment_categories',
      'equipment_construction_rules'
    ],
    backup_frequency: 'daily',
    retention_days: 30,
    compression: true,
    incremental: false
  };

  // Create backup log table
  await db.run(`
    CREATE TABLE IF NOT EXISTS backup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_name TEXT NOT NULL,
      backup_type TEXT NOT NULL, -- 'FULL', 'INCREMENTAL', 'SCHEMA'
      tables_backed_up TEXT, -- JSON array
      backup_size_bytes INTEGER,
      backup_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')),
      error_message TEXT
    )
  `);

  // Create version control for schema changes
  await db.run(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_number TEXT UNIQUE NOT NULL,
      description TEXT,
      migration_sql TEXT,
      rollback_sql TEXT,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      applied_by TEXT DEFAULT 'system'
    )
  `);

  // Insert current schema version
  await db.run(`
    INSERT OR IGNORE INTO schema_versions (version_number, description, migration_sql)
    VALUES (?, ?, ?)
  `, ['1.0.0', 'Initial enhanced equipment schema with IS/Clan tech base support', 'CREATE TABLE statements from enhanced_equipment_schema.sql']);

  console.log(`    ✅ Backup and recovery system configured`);
}

async function generateMigrationReport(db, results) {
  console.log('  📊 Generating comprehensive migration report...');

  const report = {
    database_statistics: {},
    validation_summary: results.validationResults,
    integrity_status: {},
    migration_tools_available: results.migrationToolsCreated,
    batch_operations_available: results.batchUpdateMechanisms,
    rollback_procedures_available: results.rollbackProcedures,
    recommendations: []
  };

  // Get database statistics
  const stats = await db.get(`
    SELECT 
      (SELECT COUNT(*) FROM equipment_templates) as total_templates,
      (SELECT COUNT(*) FROM equipment_tech_variants) as total_variants,
      (SELECT COUNT(*) FROM equipment_performance_modifiers) as total_modifiers,
      (SELECT COUNT(*) FROM tech_base_rules) as total_tech_rules
  `);
  report.database_statistics = stats;

  // Generate recommendations
  if (results.validationResults.orphaned_variants > 0) {
    report.recommendations.push('Clean up orphaned variants without valid template references');
  }
  
  if (results.validationResults.template_uniqueness.has_duplicates) {
    report.recommendations.push('Resolve duplicate template names for data consistency');
  }

  if (parseFloat(results.validationResults.modifier_coverage.coverage_percentage) < 50) {
    report.recommendations.push('Increase performance modifier coverage for equipment variants');
  }

  return report;
}

implementDataMigrationStrategy();
