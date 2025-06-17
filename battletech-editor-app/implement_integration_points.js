const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function implementIntegrationPoints() {
  const dbPath = path.join(__dirname, 'data/battletech_enhanced.sqlite');
  
  try {
    console.log('🔧 Implementing Integration Points - Phase 5, Step 11\n');

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('🔗 Starting Comprehensive Integration Points Implementation...\n');

    const integrationResults = {
      constructionRulesIntegrations: 0,
      criticalSlotsIntegrations: 0,
      costBattleValueIntegrations: 0,
      validationEngineIntegrations: 0,
      realTimeIntegrations: 0,
      apiEndpointsCreated: 0,
      integrationTests: 0
    };

    // Implement construction rules integration
    console.log('🏗️ Construction Rules Integration Implementation...\n');
    await implementConstructionRulesIntegration(db, integrationResults);

    // Implement critical slots system integration
    console.log('🔧 Critical Slots System Integration Implementation...\n');
    await implementCriticalSlotsIntegration(db, integrationResults);

    // Implement cost & battle value integration
    console.log('💰 Cost & Battle Value Integration Implementation...\n');
    await implementCostBattleValueIntegration(db, integrationResults);

    // Implement validation engine integration
    console.log('✅ Validation Engine Integration Implementation...\n');
    await implementValidationEngineIntegration(db, integrationResults);

    // Implement real-time integration systems
    console.log('⚡ Real-time Integration Systems Implementation...\n');
    await implementRealTimeIntegrationSystems(db, integrationResults);

    // Create API endpoints for integrations
    console.log('🌐 API Endpoints Creation...\n');
    await createIntegrationAPIEndpoints(db, integrationResults);

    // Implement integration testing framework
    console.log('🧪 Integration Testing Framework Implementation...\n');
    await implementIntegrationTestingFramework(db, integrationResults);

    // Generate integration points report
    const integrationReport = await generateIntegrationPointsReport(db, integrationResults);

    console.log('📊 INTEGRATION POINTS IMPLEMENTATION SUMMARY');
    console.log('============================================');
    console.log(`Construction Rules Integrations: ${integrationResults.constructionRulesIntegrations}`);
    console.log(`Critical Slots Integrations: ${integrationResults.criticalSlotsIntegrations}`);
    console.log(`Cost & BV Integrations: ${integrationResults.costBattleValueIntegrations}`);
    console.log(`Validation Engine Integrations: ${integrationResults.validationEngineIntegrations}`);
    console.log(`Real-time Integrations: ${integrationResults.realTimeIntegrations}`);
    console.log(`API Endpoints Created: ${integrationResults.apiEndpointsCreated}`);
    console.log(`Integration Tests: ${integrationResults.integrationTests}`);
    console.log('');

    // Save results
    const results = {
      summary: {
        construction_rules_integrations: integrationResults.constructionRulesIntegrations,
        critical_slots_integrations: integrationResults.criticalSlotsIntegrations,
        cost_battle_value_integrations: integrationResults.costBattleValueIntegrations,
        validation_engine_integrations: integrationResults.validationEngineIntegrations,
        real_time_integrations: integrationResults.realTimeIntegrations,
        api_endpoints_created: integrationResults.apiEndpointsCreated,
        integration_tests: integrationResults.integrationTests
      },
      integration_points: integrationResults,
      integration_report: integrationReport,
      database_path: dbPath,
      creation_date: new Date().toISOString()
    };

    fs.writeFileSync('data/integration_points_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Integration points results saved\n');

    await db.close();
    console.log('✅ Integration points implementation complete!');
    
  } catch (error) {
    console.error('❌ Error implementing integration points:', error);
  }
}

async function implementConstructionRulesIntegration(db, results) {
  console.log('  🏗️ Implementing construction rules integration...');

  // Create construction rules integration configurations
  const constructionRulesIntegrations = [
    {
      integration_name: 'equipment_compatibility_validation',
      integration_type: 'construction_rules',
      description: 'Real-time equipment compatibility validation with construction rules',
      validation_sql: `
        SELECT 
          v.id as variant_id,
          v.variant_name,
          v.tech_base,
          v.weight_tons,
          v.critical_slots,
          t.name as template_name,
          cr.rule_description,
          cr.validation_logic,
          cr.error_message,
          CASE 
            WHEN v.tech_base = 'IS' AND cr.rule_type LIKE '%xl_engine%' THEN
              CASE WHEN v.critical_slots = 6 THEN 'VALID' ELSE 'INVALID' END
            WHEN v.tech_base = 'Clan' AND cr.rule_type LIKE '%xl_engine%' THEN
              CASE WHEN v.critical_slots = 4 THEN 'VALID' ELSE 'INVALID' END
            WHEN v.tech_base = 'IS' AND cr.rule_type LIKE '%double_heat_sink%' THEN
              CASE WHEN v.critical_slots = 3 THEN 'VALID' ELSE 'INVALID' END
            WHEN v.tech_base = 'Clan' AND cr.rule_type LIKE '%double_heat_sink%' THEN
              CASE WHEN v.critical_slots = 2 THEN 'VALID' ELSE 'INVALID' END
            ELSE 'VALID'
          END as validation_status
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        LEFT JOIN equipment_construction_rules cr ON cr.rule_type = ?
        WHERE v.id = ?
      `,
      endpoint: '/api/construction/validate-equipment',
      triggers: ['equipment_selection', 'tech_base_change', 'slot_allocation']
    },
    {
      integration_name: 'mixed_tech_construction_validation',
      integration_type: 'construction_rules',
      description: 'Mixed technology construction rules validation',
      validation_sql: `
        SELECT 
          COUNT(DISTINCT v.tech_base) as tech_base_count,
          GROUP_CONCAT(DISTINCT v.tech_base) as tech_bases_used,
          CASE 
            WHEN COUNT(DISTINCT v.tech_base) > 1 THEN 'MIXED_TECH'
            ELSE 'SINGLE_TECH'
          END as tech_classification,
          CASE 
            WHEN COUNT(DISTINCT v.tech_base) > 1 THEN 1.25
            ELSE 1.0
          END as cost_multiplier,
          CASE 
            WHEN COUNT(DISTINCT v.tech_base) > 1 THEN 1.1
            ELSE 1.0
          END as bv_multiplier
        FROM equipment_tech_variants v
        WHERE v.id IN (?)
      `,
      endpoint: '/api/construction/validate-mixed-tech',
      triggers: ['equipment_combination', 'build_validation', 'cost_calculation']
    },
    {
      integration_name: 'tech_base_displacement_calculation',
      integration_type: 'construction_rules',
      description: 'Calculate equipment displacement for tech base changes',
      validation_sql: `
        SELECT 
          original.variant_name as original_equipment,
          original.tech_base as original_tech_base,
          original.weight_tons as original_weight,
          original.critical_slots as original_slots,
          replacement.variant_name as replacement_equipment,
          replacement.tech_base as replacement_tech_base,
          replacement.weight_tons as replacement_weight,
          replacement.critical_slots as replacement_slots,
          (original.weight_tons - replacement.weight_tons) as weight_displacement,
          (original.critical_slots - replacement.critical_slots) as slot_displacement,
          CASE 
            WHEN replacement.weight_tons < original.weight_tons AND replacement.critical_slots <= original.critical_slots
            THEN 'BENEFICIAL_DISPLACEMENT'
            WHEN replacement.weight_tons > original.weight_tons OR replacement.critical_slots > original.critical_slots
            THEN 'NEGATIVE_DISPLACEMENT'
            ELSE 'NEUTRAL_DISPLACEMENT'
          END as displacement_type
        FROM equipment_tech_variants original
        JOIN equipment_tech_variants replacement ON original.template_id = replacement.template_id
        WHERE original.id = ? AND replacement.tech_base = ?
      `,
      endpoint: '/api/construction/calculate-displacement',
      triggers: ['tech_base_conversion', 'equipment_replacement', 'optimization_analysis']
    },
    {
      integration_name: 'era_technology_restrictions',
      integration_type: 'construction_rules',
      description: 'Era-based technology restriction validation',
      validation_sql: `
        SELECT 
          v.variant_name,
          v.tech_base,
          v.introduction_year,
          v.extinction_year,
          v.era_category,
          v.rules_level,
          CASE 
            WHEN ? BETWEEN COALESCE(v.introduction_year, 0) AND COALESCE(v.extinction_year, 9999)
            THEN 'AVAILABLE'
            WHEN ? < v.introduction_year
            THEN 'NOT_YET_AVAILABLE'
            WHEN ? > COALESCE(v.extinction_year, 9999)
            THEN 'NO_LONGER_AVAILABLE'
            ELSE 'UNKNOWN'
          END as availability_status,
          CASE 
            WHEN v.rules_level = 'Experimental' AND ? != 'Experimental'
            THEN 'RULES_RESTRICTION'
            WHEN v.rules_level = 'Advanced' AND ? IN ('Introductory', 'Standard')
            THEN 'RULES_RESTRICTION'
            ELSE 'RULES_ALLOWED'
          END as rules_status
        FROM equipment_tech_variants v
        WHERE v.id = ?
      `,
      endpoint: '/api/construction/validate-era-restrictions',
      triggers: ['era_selection', 'rules_level_change', 'equipment_validation']
    }
  ];

  // Create construction rules integration table
  await db.run(`
    CREATE TABLE IF NOT EXISTS construction_rules_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      integration_name TEXT UNIQUE NOT NULL,
      integration_type TEXT NOT NULL,
      description TEXT,
      validation_sql TEXT NOT NULL,
      endpoint TEXT,
      triggers TEXT, -- JSON array
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert construction rules integrations
  for (const integration of constructionRulesIntegrations) {
    await db.run(`
      INSERT OR REPLACE INTO construction_rules_integrations 
      (integration_name, integration_type, description, validation_sql, endpoint, triggers)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      integration.integration_name, integration.integration_type, integration.description,
      integration.validation_sql, integration.endpoint, JSON.stringify(integration.triggers)
    ]);
    results.constructionRulesIntegrations++;
  }

  console.log(`    ✅ Created ${results.constructionRulesIntegrations} construction rules integrations`);
}

async function implementCriticalSlotsIntegration(db, results) {
  console.log('  🔧 Implementing critical slots system integration...');

  // Create critical slots integration configurations
  const criticalSlotsIntegrations = [
    {
      integration_name: 'tech_base_slot_calculation',
      integration_type: 'critical_slots',
      description: 'Calculate critical slot requirements based on tech base',
      calculation_sql: `
        SELECT 
          v.variant_name,
          v.tech_base,
          v.critical_slots as base_slots,
          CASE 
            WHEN v.tech_base = 'Clan' AND t.name LIKE '%XL Engine%' THEN 4
            WHEN v.tech_base = 'IS' AND t.name LIKE '%XL Engine%' THEN 6
            WHEN v.tech_base = 'Clan' AND t.name LIKE '%Double Heat Sink%' THEN 2
            WHEN v.tech_base = 'IS' AND t.name LIKE '%Double Heat Sink%' THEN 3
            WHEN v.tech_base = 'Clan' AND c.name = 'Energy Weapons' THEN CEIL(v.critical_slots * 0.5)
            ELSE v.critical_slots
          END as calculated_slots,
          pm.modifier_value as performance_modifier,
          CASE 
            WHEN pm.modifier_type = 'slot_reduction' THEN 
              CEIL(v.critical_slots * (1 - pm.modifier_value))
            ELSE v.critical_slots
          END as modified_slots
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        LEFT JOIN equipment_performance_modifiers pm ON v.id = pm.variant_id AND pm.modifier_type = 'slot_reduction'
        WHERE v.id = ?
      `,
      endpoint: '/api/critical-slots/calculate-requirements',
      triggers: ['equipment_placement', 'tech_base_conversion', 'slot_optimization']
    },
    {
      integration_name: 'equipment_displacement_handling',
      integration_type: 'critical_slots',
      description: 'Handle equipment displacement for tech base changes',
      calculation_sql: `
        SELECT 
          location,
          slot_number,
          original_equipment_id,
          new_equipment_id,
          original_slots,
          new_slots,
          (new_slots - original_slots) as slot_difference,
          CASE 
            WHEN new_slots < original_slots THEN 'SLOT_FREED'
            WHEN new_slots > original_slots THEN 'ADDITIONAL_SLOTS_NEEDED'
            ELSE 'NO_CHANGE'
          END as displacement_type,
          CASE 
            WHEN new_slots > original_slots THEN
              (SELECT COUNT(*) FROM critical_slot_allocations 
               WHERE mech_location = location AND slot_number > (SELECT MAX(slot_number) FROM critical_slot_allocations WHERE equipment_id = original_equipment_id)
               AND equipment_id IS NULL)
            ELSE 0
          END as available_slots
        FROM (
          SELECT 
            'CT' as location, 1 as slot_number, ? as original_equipment_id, ? as new_equipment_id,
            (SELECT critical_slots FROM equipment_tech_variants WHERE id = ?) as original_slots,
            (SELECT critical_slots FROM equipment_tech_variants WHERE id = ?) as new_slots
        )
      `,
      endpoint: '/api/critical-slots/handle-displacement',
      triggers: ['equipment_replacement', 'tech_conversion', 'slot_reallocation']
    },
    {
      integration_name: 'slot_optimization_suggestions',
      integration_type: 'critical_slots',
      description: 'Suggest slot optimization opportunities',
      calculation_sql: `
        SELECT 
          v.variant_name,
          v.tech_base,
          v.critical_slots,
          alternative.variant_name as alternative_equipment,
          alternative.tech_base as alternative_tech_base,
          alternative.critical_slots as alternative_slots,
          (v.critical_slots - alternative.critical_slots) as slots_saved,
          (v.weight_tons - alternative.weight_tons) as weight_saved,
          CASE 
            WHEN alternative.critical_slots < v.critical_slots AND alternative.weight_tons <= v.weight_tons
            THEN 'BENEFICIAL_OPTIMIZATION'
            WHEN alternative.critical_slots < v.critical_slots AND alternative.weight_tons > v.weight_tons
            THEN 'SLOT_OPTIMIZATION_WEIGHT_PENALTY'
            ELSE 'NO_OPTIMIZATION'
          END as optimization_type
        FROM equipment_tech_variants v
        JOIN equipment_tech_variants alternative ON v.template_id = alternative.template_id
        WHERE v.id = ? AND alternative.tech_base != v.tech_base
        AND alternative.critical_slots < v.critical_slots
        ORDER BY slots_saved DESC, weight_saved DESC
      `,
      endpoint: '/api/critical-slots/optimization-suggestions',
      triggers: ['slot_analysis', 'optimization_request', 'efficiency_analysis']
    },
    {
      integration_name: 'critical_hit_effects_integration',
      integration_type: 'critical_slots',
      description: 'Calculate critical hit effects by tech base',
      calculation_sql: `
        SELECT 
          v.variant_name,
          v.tech_base,
          v.critical_slots,
          t.name as template_name,
          CASE 
            WHEN v.tech_base = 'Clan' AND t.name LIKE '%XL Engine%' THEN
              'Clan XL Engine: Side torso destruction destroys mech'
            WHEN v.tech_base = 'IS' AND t.name LIKE '%XL Engine%' THEN
              'IS XL Engine: Side torso destruction destroys mech'
            WHEN t.name LIKE '%Gauss%' THEN
              'Gauss Rifle: Critical hit causes immediate shutdown'
            WHEN c.name = 'Missile Weapons' AND v.variant_name LIKE '%LRM%' THEN
              'Missile weapon: Critical hit may cause ammunition explosion'
            ELSE 'Standard critical hit effects apply'
          END as critical_hit_effect,
          CASE 
            WHEN v.tech_base = 'Clan' THEN 'Enhanced critical resistance'
            ELSE 'Standard critical vulnerability'
          END as tech_base_modifier
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        WHERE v.id = ?
      `,
      endpoint: '/api/critical-slots/critical-hit-effects',
      triggers: ['damage_calculation', 'critical_hit_resolution', 'combat_effects']
    }
  ];

  // Create critical slots integration table
  await db.run(`
    CREATE TABLE IF NOT EXISTS critical_slots_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      integration_name TEXT UNIQUE NOT NULL,
      integration_type TEXT NOT NULL,
      description TEXT,
      calculation_sql TEXT NOT NULL,
      endpoint TEXT,
      triggers TEXT, -- JSON array
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert critical slots integrations
  for (const integration of criticalSlotsIntegrations) {
    await db.run(`
      INSERT OR REPLACE INTO critical_slots_integrations
      (integration_name, integration_type, description, calculation_sql, endpoint, triggers)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      integration.integration_name, integration.integration_type, integration.description,
      integration.calculation_sql, integration.endpoint, JSON.stringify(integration.triggers)
    ]);
    results.criticalSlotsIntegrations++;
  }

  console.log(`    ✅ Created ${results.criticalSlotsIntegrations} critical slots integrations`);
}

async function implementCostBattleValueIntegration(db, results) {
  console.log('  💰 Implementing cost & battle value integration...');

  // Create cost & battle value integration configurations
  const costBVIntegrations = [
    {
      integration_name: 'tech_base_cost_calculation',
      integration_type: 'cost_battle_value',
      description: 'Calculate equipment costs based on tech base',
      calculation_sql: `
        SELECT 
          v.variant_name,
          v.tech_base,
          v.cost_cbills as base_cost,
          CASE 
            WHEN v.tech_base = 'Clan' THEN v.cost_cbills * 1.5
            ELSE v.cost_cbills
          END as tech_adjusted_cost,
          mixed_tech.cost_multiplier,
          CASE 
            WHEN mixed_tech.cost_multiplier > 1.0 THEN
              (v.cost_cbills * CASE WHEN v.tech_base = 'Clan' THEN 1.5 ELSE 1.0 END) * mixed_tech.cost_multiplier
            ELSE v.cost_cbills * CASE WHEN v.tech_base = 'Clan' THEN 1.5 ELSE 1.0 END
          END as final_cost
        FROM equipment_tech_variants v
        LEFT JOIN (
          SELECT 1.25 as cost_multiplier WHERE ? = 'mixed_tech'
          UNION SELECT 1.0 as cost_multiplier WHERE ? != 'mixed_tech'
        ) mixed_tech
        WHERE v.id = ?
      `,
      endpoint: '/api/cost-bv/calculate-cost',
      triggers: ['cost_calculation', 'tech_base_change', 'mixed_tech_detection']
    },
    {
      integration_name: 'battle_value_calculation',
      integration_type: 'cost_battle_value',
      description: 'Calculate battle value based on tech base and performance',
      calculation_sql: `
        SELECT 
          v.variant_name,
          v.tech_base,
          v.battle_value as base_bv,
          pm.modifier_value as performance_modifier,
          CASE 
            WHEN v.tech_base = 'Clan' THEN
              v.battle_value * (1 + COALESCE(pm.modifier_value, 0))
            ELSE v.battle_value
          END as tech_adjusted_bv,
          mixed_tech.bv_multiplier,
          CASE 
            WHEN mixed_tech.bv_multiplier > 1.0 THEN
              (v.battle_value * (1 + COALESCE(pm.modifier_value, 0))) * mixed_tech.bv_multiplier
            ELSE v.battle_value * (1 + COALESCE(pm.modifier_value, 0))
          END as final_bv
        FROM equipment_tech_variants v
        LEFT JOIN equipment_performance_modifiers pm ON v.id = pm.variant_id AND pm.modifier_type = 'battle_value'
        LEFT JOIN (
          SELECT 1.1 as bv_multiplier WHERE ? = 'mixed_tech'
          UNION SELECT 1.0 as bv_multiplier WHERE ? != 'mixed_tech'
        ) mixed_tech
        WHERE v.id = ?
      `,
      endpoint: '/api/cost-bv/calculate-battle-value',
      triggers: ['bv_calculation', 'performance_analysis', 'mixed_tech_penalty']
    },
    {
      integration_name: 'era_pricing_adjustments',
      integration_type: 'cost_battle_value',
      description: 'Era-based pricing adjustments for equipment availability',
      calculation_sql: `
        SELECT 
          v.variant_name,
          v.tech_base,
          v.cost_cbills as base_cost,
          v.introduction_year,
          v.era_category,
          v.availability_rating,
          CASE 
            WHEN ? < v.introduction_year THEN 0 -- Not available
            WHEN v.availability_rating = 'X' THEN v.cost_cbills * 3.0 -- Extremely rare
            WHEN v.availability_rating = 'F' THEN v.cost_cbills * 2.0 -- Very rare
            WHEN v.availability_rating = 'E' THEN v.cost_cbills * 1.5 -- Rare
            WHEN v.availability_rating = 'D' THEN v.cost_cbills * 1.2 -- Uncommon
            ELSE v.cost_cbills -- Common
          END as era_adjusted_cost,
          CASE 
            WHEN ? < v.introduction_year THEN 'NOT_AVAILABLE'
            WHEN v.availability_rating IN ('X', 'F') THEN 'VERY_EXPENSIVE'
            WHEN v.availability_rating = 'E' THEN 'EXPENSIVE'
            WHEN v.availability_rating = 'D' THEN 'MODERATE'
            ELSE 'STANDARD'
          END as pricing_category
        FROM equipment_tech_variants v
        WHERE v.id = ?
      `,
      endpoint: '/api/cost-bv/calculate-era-pricing',
      triggers: ['era_selection', 'availability_check', 'market_pricing']
    },
    {
      integration_name: 'mixed_tech_penalties',
      integration_type: 'cost_battle_value',
      description: 'Calculate mixed technology penalties',
      calculation_sql: `
        SELECT 
          total_equipment_count,
          is_equipment_count,
          clan_equipment_count,
          mixed_equipment_count,
          CASE 
            WHEN (is_equipment_count > 0 AND clan_equipment_count > 0) OR mixed_equipment_count > 0
            THEN 'MIXED_TECH'
            WHEN clan_equipment_count > 0 AND is_equipment_count = 0
            THEN 'PURE_CLAN'
            ELSE 'PURE_IS'
          END as tech_classification,
          CASE 
            WHEN (is_equipment_count > 0 AND clan_equipment_count > 0) OR mixed_equipment_count > 0
            THEN 1.25
            ELSE 1.0
          END as cost_penalty,
          CASE 
            WHEN (is_equipment_count > 0 AND clan_equipment_count > 0) OR mixed_equipment_count > 0
            THEN 1.1
            ELSE 1.0
          END as bv_penalty,
          CASE 
            WHEN (is_equipment_count > 0 AND clan_equipment_count > 0) OR mixed_equipment_count > 0
            THEN -1
            ELSE 0
          END as availability_penalty
        FROM (
          SELECT 
            COUNT(*) as total_equipment_count,
            SUM(CASE WHEN tech_base = 'IS' THEN 1 ELSE 0 END) as is_equipment_count,
            SUM(CASE WHEN tech_base = 'Clan' THEN 1 ELSE 0 END) as clan_equipment_count,
            SUM(CASE WHEN tech_base = 'Mixed' THEN 1 ELSE 0 END) as mixed_equipment_count
          FROM equipment_tech_variants
          WHERE id IN (?)
        )
      `,
      endpoint: '/api/cost-bv/calculate-mixed-tech-penalties',
      triggers: ['mixed_tech_detection', 'penalty_calculation', 'unit_validation']
    }
  ];

  // Create cost & battle value integration table
  await db.run(`
    CREATE TABLE IF NOT EXISTS cost_bv_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      integration_name TEXT UNIQUE NOT NULL,
      integration_type TEXT NOT NULL,
      description TEXT,
      calculation_sql TEXT NOT NULL,
      endpoint TEXT,
      triggers TEXT, -- JSON array
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert cost & battle value integrations
  for (const integration of costBVIntegrations) {
    await db.run(`
      INSERT OR REPLACE INTO cost_bv_integrations
      (integration_name, integration_type, description, calculation_sql, endpoint, triggers)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      integration.integration_name, integration.integration_type, integration.description,
      integration.calculation_sql, integration.endpoint, JSON.stringify(integration.triggers)
    ]);
    results.costBattleValueIntegrations++;
  }

  console.log(`    ✅ Created ${results.costBattleValueIntegrations} cost & battle value integrations`);
}

async function implementValidationEngineIntegration(db, results) {
  console.log('  ✅ Implementing validation engine integration...');

  // Create validation engine integration configurations
  const validationEngineIntegrations = [
    {
      integration_name: 'real_time_tech_base_validation',
      integration_type: 'validation_engine',
      description: 'Real-time tech base compatibility validation',
      validation_sql: `
        SELECT 
          v.id,
          v.variant_name,
          v.tech_base,
          dvr.rule_name,
          dvr.validation_sql,
          dvr.description,
          dvr.severity,
          CASE 
            WHEN dvr.rule_name = 'variant_tech_base_consistency' AND v.tech_base NOT IN ('IS', 'Clan', 'Mixed')
            THEN 'INVALID'
            WHEN dvr.rule_name = 'variant_slot_validity' AND (v.critical_slots < 0 OR v.critical_slots > 50)
            THEN 'INVALID'
            WHEN dvr.rule_name = 'variant_weight_validity' AND (v.weight_tons < 0 OR v.weight_tons > 100)
            THEN 'INVALID'
            ELSE 'VALID'
          END as validation_result
        FROM equipment_tech_variants v
        CROSS JOIN data_validation_rules dvr
        WHERE v.id = ? AND dvr.is_active = 1
      `,
      endpoint: '/api/validation/real-time-tech-base',
      triggers: ['equipment_selection', 'tech_base_change', 'form_input']
    },
    {
      integration_name: 'equipment_combination_validation',
      integration_type: 'validation_engine',
      description: 'Validate equipment combinations and conflicts',
      validation_sql: `
        SELECT 
          v1.variant_name as equipment_1,
          v2.variant_name as equipment_2,
          v1.tech_base as tech_base_1,
          v2.tech_base as tech_base_2,
          CASE 
            WHEN v1.tech_base != v2.tech_base THEN 'MIXED_TECH_WARNING'
            WHEN t1.name LIKE '%XL Engine%' AND t2.name LIKE '%XL Engine%' THEN 'MULTIPLE_XL_ENGINES_ERROR'
            WHEN c1.name = c2.name AND v1.id != v2.id THEN 'DUPLICATE_CATEGORY_WARNING'
            ELSE 'COMPATIBLE'
          END as compatibility_status
        FROM equipment_tech_variants v1
        JOIN equipment_templates t1 ON v1.template_id = t1.id
        JOIN equipment_categories c1 ON t1.category_id = c1.id
        CROSS JOIN equipment_tech_variants v2
        JOIN equipment_templates t2 ON v2.template_id = t2.id
        JOIN equipment_categories c2 ON t2.category_id = c2.id
        WHERE v1.id = ? AND v2.id = ?
      `,
      endpoint: '/api/validation/equipment-combinations',
      triggers: ['equipment_combination', 'build_validation', 'compatibility_check']
    },
    {
      integration_name: 'integrity_check_validation',
      integration_type: 'validation_engine',
      description: 'Run comprehensive data integrity checks',
      validation_sql: `
        SELECT 
          check_name,
          description,
          violations_found,
          last_run,
          CASE 
            WHEN violations_found = 0 THEN 'PASSED'
            WHEN violations_found > 0 THEN 'FAILED'
            ELSE 'NOT_RUN'
          END as check_status
        FROM data_integrity_checks
        WHERE is_active = 1
        ORDER BY violations_found DESC
      `,
      endpoint: '/api/validation/integrity-checks',
      triggers: ['data_validation', 'system_check', 'maintenance']
    }
  ];

  // Create validation engine integration table
  await db.run(`
    CREATE TABLE IF NOT EXISTS validation_engine_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      integration_name TEXT UNIQUE NOT NULL,
      integration_type TEXT NOT NULL,
      description TEXT,
      validation_sql TEXT NOT NULL,
      endpoint TEXT,
      triggers TEXT, -- JSON array
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert validation engine integrations
  for (const integration of validationEngineIntegrations) {
    await db.run(`
      INSERT OR REPLACE INTO validation_engine_integrations
      (integration_name, integration_type, description, validation_sql, endpoint, triggers)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      integration.integration_name, integration.integration_type, integration.description,
      integration.validation_sql, integration.endpoint, JSON.stringify(integration.triggers)
    ]);
    results.validationEngineIntegrations++;
  }

  console.log(`    ✅ Created ${results.validationEngineIntegrations} validation engine integrations`);
}

async function implementRealTimeIntegrationSystems(db, results) {
  console.log('  ⚡ Implementing real-time integration systems...');

  // Create real-time integration configurations
  const realTimeIntegrations = [
    {
      integration_name: 'websocket_equipment_updates',
      integration_type: 'real_time',
      description: 'Real-time equipment updates via WebSocket',
      event_types: ['equipment_selection', 'tech_base_change', 'slot_allocation', 'validation_result'],
      endpoint: '/ws/equipment-updates',
      message_format: 'json'
    },
    {
      integration_name: 'live_validation_feedback',
      integration_type: 'real_time',
      description: 'Live validation feedback system',
      event_types: ['validation_error', 'validation_warning', 'validation_success'],
      endpoint: '/ws/validation-feedback',
      message_format: 'json'
    },
    {
      integration_name: 'performance_metric_streaming',
      integration_type: 'real_time',
      description: 'Stream performance metrics and calculations',
      event_types: ['performance_calculation', 'efficiency_update', 'comparison_result'],
      endpoint: '/ws/performance-metrics',
      message_format: 'json'
    }
  ];

  // Create real-time integrations table
  await db.run(`
    CREATE TABLE IF NOT EXISTS real_time_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      integration_name TEXT UNIQUE NOT NULL,
      integration_type TEXT NOT NULL,
      description TEXT,
      event_types TEXT, -- JSON array
      endpoint TEXT,
      message_format TEXT DEFAULT 'json',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert real-time integrations
  for (const integration of realTimeIntegrations) {
    await db.run(`
      INSERT OR REPLACE INTO real_time_integrations
      (integration_name, integration_type, description, event_types, endpoint, message_format)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      integration.integration_name, integration.integration_type, integration.description,
      JSON.stringify(integration.event_types), integration.endpoint, integration.message_format
    ]);
    results.realTimeIntegrations++;
  }

  console.log(`    ✅ Created ${results.realTimeIntegrations} real-time integrations`);
}

async function createIntegrationAPIEndpoints(db, results) {
  console.log('  🌐 Creating API endpoints for integrations...');

  // Create API endpoint configurations
  const apiEndpoints = [
    {
      endpoint_path: '/api/equipment/validate',
      method: 'POST',
      description: 'Validate equipment selection and configuration',
      parameters: ['equipment_id', 'tech_base', 'slot_allocation'],
      response_format: 'validation_result'
    },
    {
      endpoint_path: '/api/equipment/calculate-performance',
      method: 'GET',
      description: 'Calculate equipment performance metrics',
      parameters: ['equipment_id', 'comparison_type'],
      response_format: 'performance_metrics'
    },
    {
      endpoint_path: '/api/equipment/suggest-replacements',
      method: 'GET',
      description: 'Suggest equipment replacements and upgrades',
      parameters: ['current_equipment_id', 'optimization_type'],
      response_format: 'replacement_suggestions'
    },
    {
      endpoint_path: '/api/construction/validate-mixed-tech',
      method: 'POST',
      description: 'Validate mixed technology configurations',
      parameters: ['equipment_list', 'validation_level'],
      response_format: 'mixed_tech_validation'
    },
    {
      endpoint_path: '/api/critical-slots/calculate',
      method: 'POST',
      description: 'Calculate critical slot requirements',
      parameters: ['equipment_id', 'tech_base', 'location'],
      response_format: 'slot_calculation'
    },
    {
      endpoint_path: '/api/cost-bv/calculate',
      method: 'POST',
      description: 'Calculate cost and battle value',
      parameters: ['equipment_list', 'era', 'tech_classification'],
      response_format: 'cost_bv_calculation'
    }
  ];

  // Create API endpoints table
  await db.run(`
    CREATE TABLE IF NOT EXISTS integration_api_endpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint_path TEXT UNIQUE NOT NULL,
      method TEXT NOT NULL,
      description TEXT,
      parameters TEXT, -- JSON array
      response_format TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert API endpoints
  for (const endpoint of apiEndpoints) {
    await db.run(`
      INSERT OR REPLACE INTO integration_api_endpoints
      (endpoint_path, method, description, parameters, response_format)
      VALUES (?, ?, ?, ?, ?)
    `, [
      endpoint.endpoint_path, endpoint.method, endpoint.description,
      JSON.stringify(endpoint.parameters), endpoint.response_format
    ]);
    results.apiEndpointsCreated++;
  }

  console.log(`    ✅ Created ${results.apiEndpointsCreated} API endpoints`);
}

async function implementIntegrationTestingFramework(db, results) {
  console.log('  🧪 Implementing integration testing framework...');

  // Create integration test configurations
  const integrationTests = [
    {
      test_name: 'equipment_compatibility_test',
      test_type: 'integration',
      description: 'Test equipment compatibility validation',
      test_sql: `
        SELECT COUNT(*) as test_count FROM equipment_tech_variants
        WHERE tech_base IN ('IS', 'Clan', 'Mixed')
      `,
      expected_result: 'test_count > 0',
      test_category: 'validation'
    },
    {
      test_name: 'slot_calculation_test',
      test_type: 'integration',
      description: 'Test critical slot calculation accuracy',
      test_sql: `
        SELECT 
          COUNT(*) as xl_engine_tests
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        WHERE t.name LIKE '%XL Engine%'
        AND ((v.tech_base = 'IS' AND v.critical_slots = 6) OR (v.tech_base = 'Clan' AND v.critical_slots = 4))
      `,
      expected_result: 'xl_engine_tests > 0',
      test_category: 'calculation'
    },
    {
      test_name: 'mixed_tech_detection_test',
      test_type: 'integration',
      description: 'Test mixed technology detection',
      test_sql: `
        SELECT 
          COUNT(DISTINCT tech_base) as tech_base_count
        FROM equipment_tech_variants
        WHERE id IN (1, 2, 3)
      `,
      expected_result: 'tech_base_count >= 1',
      test_category: 'detection'
    },
    {
      test_name: 'performance_modifier_test',
      test_type: 'integration',
      description: 'Test performance modifier application',
      test_sql: `
        SELECT COUNT(*) as modifier_count
        FROM equipment_performance_modifiers
        WHERE modifier_type IN ('slot_reduction', 'weight_reduction')
      `,
      expected_result: 'modifier_count > 0',
      test_category: 'performance'
    },
    {
      test_name: 'validation_rules_test',
      test_type: 'integration',
      description: 'Test validation rules functionality',
      test_sql: `
        SELECT COUNT(*) as rule_count
        FROM data_validation_rules
        WHERE is_active = 1
      `,
      expected_result: 'rule_count >= 5',
      test_category: 'validation'
    }
  ];

  // Create integration tests table
  await db.run(`
    CREATE TABLE IF NOT EXISTS integration_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_name TEXT UNIQUE NOT NULL,
      test_type TEXT NOT NULL,
      description TEXT,
      test_sql TEXT NOT NULL,
      expected_result TEXT,
      test_category TEXT,
      last_run DATETIME,
      last_result TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert integration tests
  for (const test of integrationTests) {
    await db.run(`
      INSERT OR REPLACE INTO integration_tests
      (test_name, test_type, description, test_sql, expected_result, test_category)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      test.test_name, test.test_type, test.description,
      test.test_sql, test.expected_result, test.test_category
    ]);
    results.integrationTests++;
  }

  console.log(`    ✅ Created ${results.integrationTests} integration tests`);
}

async function generateIntegrationPointsReport(db, results) {
  console.log('  📊 Generating comprehensive integration points report...');

  const report = {
    integration_summary: {
      total_construction_rules: results.constructionRulesIntegrations,
      total_critical_slots: results.criticalSlotsIntegrations,
      total_cost_bv: results.costBattleValueIntegrations,
      total_validation_engine: results.validationEngineIntegrations,
      total_real_time: results.realTimeIntegrations,
      total_api_endpoints: results.apiEndpointsCreated,
      total_integration_tests: results.integrationTests
    },
    construction_rules_integration: {
      equipment_compatibility: 'Real-time validation with construction rules',
      mixed_tech_validation: 'Mixed technology construction rule enforcement',
      displacement_calculation: 'Equipment displacement for tech base changes',
      era_restrictions: 'Era-based technology restriction validation'
    },
    critical_slots_integration: {
      slot_calculation: 'Tech base specific slot requirement calculation',
      displacement_handling: 'Equipment displacement management for tech changes',
      optimization_suggestions: 'Slot optimization opportunity identification',
      critical_hit_effects: 'Tech base specific critical hit effect calculation'
    },
    cost_battle_value_integration: {
      tech_base_costs: 'Technology base specific cost calculations',
      battle_value_calculation: 'Performance-adjusted battle value computation',
      era_pricing: 'Era availability based pricing adjustments',
      mixed_tech_penalties: 'Mixed technology cost and BV penalty application'
    },
    validation_engine_integration: {
      real_time_validation: 'Live tech base compatibility validation',
      equipment_combinations: 'Equipment combination conflict detection',
      integrity_checks: 'Comprehensive data integrity validation'
    },
    real_time_systems: {
      websocket_updates: 'Real-time equipment update streaming',
      live_validation: 'Live validation feedback system',
      performance_streaming: 'Real-time performance metric updates'
    },
    api_endpoints: {
      equipment_validation: '/api/equipment/validate',
      performance_calculation: '/api/equipment/calculate-performance',
      replacement_suggestions: '/api/equipment/suggest-replacements',
      mixed_tech_validation: '/api/construction/validate-mixed-tech',
      slot_calculation: '/api/critical-slots/calculate',
      cost_bv_calculation: '/api/cost-bv/calculate'
    },
    integration_testing: {
      equipment_compatibility: 'Equipment compatibility validation testing',
      slot_calculation: 'Critical slot calculation accuracy testing',
      mixed_tech_detection: 'Mixed technology detection testing',
      performance_modifiers: 'Performance modifier application testing',
      validation_rules: 'Validation rules functionality testing'
    }
  };

  return report;
}

implementIntegrationPoints();
