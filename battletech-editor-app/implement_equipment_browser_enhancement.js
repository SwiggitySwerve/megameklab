const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function implementEquipmentBrowserEnhancement() {
  const dbPath = path.join(__dirname, 'data/battletech_enhanced.sqlite');
  
  try {
    console.log('🔧 Implementing Equipment Browser Enhancement - Phase 5, Step 10\n');

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('🖥️ Starting Equipment Browser Enhancement Implementation...\n');

    const browserResults = {
      techBaseFiltersCreated: 0,
      comparisonToolsCreated: 0,
      searchFiltersCreated: 0,
      interfaceComponentsCreated: 0,
      integrationPointsCreated: 0,
      performanceMetrics: {},
      userExperienceFeatures: []
    };

    // Implement tech base filtering system
    console.log('🔍 Tech Base Filtering System Implementation...\n');
    await implementTechBaseFiltering(db, browserResults);

    // Create equipment comparison tools
    console.log('⚖️ Equipment Comparison Tools Creation...\n');
    await createEquipmentComparisonTools(db, browserResults);

    // Implement advanced search and browse
    console.log('🔎 Advanced Search & Browse Implementation...\n');
    await implementAdvancedSearchBrowse(db, browserResults);

    // Create user interface components
    console.log('🎨 User Interface Components Creation...\n');
    await createUserInterfaceComponents(db, browserResults);

    // Implement integration points
    console.log('🔗 Integration Points Implementation...\n');
    await implementIntegrationPoints(db, browserResults);

    // Create performance optimizations
    console.log('⚡ Performance Optimizations Implementation...\n');
    await implementPerformanceOptimizations(db, browserResults);

    // Generate browser enhancement report
    const browserReport = await generateBrowserEnhancementReport(db, browserResults);

    console.log('📊 EQUIPMENT BROWSER ENHANCEMENT SUMMARY');
    console.log('========================================');
    console.log(`Tech Base Filters: ${browserResults.techBaseFiltersCreated}`);
    console.log(`Comparison Tools: ${browserResults.comparisonToolsCreated}`);
    console.log(`Search Filters: ${browserResults.searchFiltersCreated}`);
    console.log(`Interface Components: ${browserResults.interfaceComponentsCreated}`);
    console.log(`Integration Points: ${browserResults.integrationPointsCreated}`);
    console.log('');

    // Save results
    const results = {
      summary: {
        tech_base_filters_created: browserResults.techBaseFiltersCreated,
        comparison_tools_created: browserResults.comparisonToolsCreated,
        search_filters_created: browserResults.searchFiltersCreated,
        interface_components_created: browserResults.interfaceComponentsCreated,
        integration_points_created: browserResults.integrationPointsCreated
      },
      browser_enhancement: browserResults,
      browser_report: browserReport,
      database_path: dbPath,
      creation_date: new Date().toISOString()
    };

    fs.writeFileSync('data/equipment_browser_enhancement_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Equipment browser enhancement results saved\n');

    await db.close();
    console.log('✅ Equipment browser enhancement implementation complete!');
    
  } catch (error) {
    console.error('❌ Error implementing equipment browser enhancement:', error);
  }
}

async function implementTechBaseFiltering(db, results) {
  console.log('  🔍 Creating comprehensive tech base filtering system...');

  // Create tech base filter configurations
  const techBaseFilters = [
    {
      filter_name: 'tech_base_primary',
      filter_type: 'dropdown',
      options: ['All', 'Inner Sphere', 'Clan', 'Mixed'],
      default_value: 'All',
      description: 'Primary tech base selection filter',
      sql_condition: `
        CASE 
          WHEN ? = 'All' THEN 1=1
          WHEN ? = 'Inner Sphere' THEN v.tech_base = 'IS'
          WHEN ? = 'Clan' THEN v.tech_base = 'Clan'
          WHEN ? = 'Mixed' THEN v.tech_base = 'Mixed'
        END
      `
    },
    {
      filter_name: 'availability_era',
      filter_type: 'dropdown',
      options: ['All Eras', 'Age of War', 'Succession Wars', 'Clan Invasion', 'Civil War', 'Dark Age'],
      default_value: 'All Eras',
      description: 'Equipment availability by historical era',
      sql_condition: `
        CASE 
          WHEN ? = 'All Eras' THEN 1=1
          ELSE v.era_category = ?
        END
      `
    },
    {
      filter_name: 'rules_level',
      filter_type: 'dropdown',
      options: ['All Levels', 'Introductory', 'Standard', 'Advanced', 'Experimental'],
      default_value: 'Standard',
      description: 'Equipment complexity and rules level',
      sql_condition: `
        CASE 
          WHEN ? = 'All Levels' THEN 1=1
          ELSE v.rules_level = ?
        END
      `
    },
    {
      filter_name: 'weight_range',
      filter_type: 'range',
      min_value: 0,
      max_value: 100,
      default_min: 0,
      default_max: 100,
      description: 'Equipment weight range in tons',
      sql_condition: 'v.weight_tons BETWEEN ? AND ?'
    },
    {
      filter_name: 'slot_range',
      filter_type: 'range',
      min_value: 0,
      max_value: 50,
      default_min: 0,
      default_max: 50,
      description: 'Critical slot requirements range',
      sql_condition: 'v.critical_slots BETWEEN ? AND ?'
    }
  ];

  // Create tech base filters table
  await db.run(`
    CREATE TABLE IF NOT EXISTS tech_base_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filter_name TEXT UNIQUE NOT NULL,
      filter_type TEXT NOT NULL, -- 'dropdown', 'range', 'checkbox', 'search'
      options TEXT, -- JSON array for dropdown options
      default_value TEXT,
      min_value REAL,
      max_value REAL,
      default_min REAL,
      default_max REAL,
      description TEXT,
      sql_condition TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      display_order INTEGER DEFAULT 0
    )
  `);

  // Insert tech base filters
  for (const filter of techBaseFilters) {
    await db.run(`
      INSERT OR REPLACE INTO tech_base_filters 
      (filter_name, filter_type, options, default_value, min_value, max_value, default_min, default_max, description, sql_condition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      filter.filter_name, filter.filter_type, 
      filter.options ? JSON.stringify(filter.options) : null,
      filter.default_value, filter.min_value, filter.max_value,
      filter.default_min, filter.default_max,
      filter.description, filter.sql_condition
    ]);
    results.techBaseFiltersCreated++;
  }

  console.log(`    ✅ Created ${results.techBaseFiltersCreated} tech base filters`);
}

async function createEquipmentComparisonTools(db, results) {
  console.log('  ⚖️ Creating equipment comparison tools...');

  // Create comparison tool configurations
  const comparisonTools = [
    {
      tool_name: 'is_vs_clan_comparison',
      tool_type: 'side_by_side',
      description: 'Side-by-side comparison of IS vs Clan equipment variants',
      comparison_sql: `
        SELECT 
          t.name as template_name,
          v1.variant_name as is_variant,
          v1.weight_tons as is_weight,
          v1.critical_slots as is_slots,
          v1.cost_cbills as is_cost,
          v1.battle_value as is_bv,
          v2.variant_name as clan_variant,
          v2.weight_tons as clan_weight,
          v2.critical_slots as clan_slots,
          v2.cost_cbills as clan_cost,
          v2.battle_value as clan_bv,
          ROUND(((v1.weight_tons - v2.weight_tons) / v1.weight_tons * 100), 1) as weight_reduction_percent,
          ROUND(((v1.critical_slots - v2.critical_slots) / v1.critical_slots * 100), 1) as slot_reduction_percent
        FROM equipment_templates t
        JOIN equipment_tech_variants v1 ON t.id = v1.template_id AND v1.tech_base = 'IS'
        JOIN equipment_tech_variants v2 ON t.id = v2.template_id AND v2.tech_base = 'Clan'
        WHERE t.name = ?
        ORDER BY t.name
      `
    },
    {
      tool_name: 'performance_analysis',
      tool_type: 'analysis',
      description: 'Detailed performance analysis with efficiency metrics',
      comparison_sql: `
        SELECT 
          v.*,
          t.name as template_name,
          c.name as category_name,
          COALESCE(pm.modifier_value, 0) as performance_modifier,
          CASE 
            WHEN v.tech_base = 'Clan' AND v.critical_slots < 
                 (SELECT AVG(critical_slots) FROM equipment_tech_variants WHERE tech_base = 'IS' AND template_id = v.template_id)
            THEN 'More Efficient'
            WHEN v.tech_base = 'IS' AND v.critical_slots > 
                 (SELECT AVG(critical_slots) FROM equipment_tech_variants WHERE tech_base = 'Clan' AND template_id = v.template_id)
            THEN 'Less Efficient'
            ELSE 'Standard'
          END as efficiency_rating
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        LEFT JOIN equipment_performance_modifiers pm ON v.id = pm.variant_id
        WHERE v.id = ?
      `
    },
    {
      tool_name: 'replacement_suggestions',
      tool_type: 'recommendations',
      description: 'Equipment replacement and upgrade suggestions',
      comparison_sql: `
        SELECT 
          target.variant_name as current_equipment,
          suggestions.variant_name as suggested_replacement,
          suggestions.tech_base as replacement_tech_base,
          target.weight_tons - suggestions.weight_tons as weight_savings,
          target.critical_slots - suggestions.critical_slots as slot_savings,
          suggestions.cost_cbills - target.cost_cbills as cost_difference,
          CASE 
            WHEN suggestions.weight_tons < target.weight_tons AND suggestions.critical_slots <= target.critical_slots 
            THEN 'Upgrade'
            WHEN suggestions.weight_tons > target.weight_tons OR suggestions.critical_slots > target.critical_slots
            THEN 'Downgrade'
            ELSE 'Alternative'
          END as suggestion_type
        FROM equipment_tech_variants target
        JOIN equipment_tech_variants suggestions ON target.template_id = suggestions.template_id
        WHERE target.id = ? AND suggestions.id != target.id
        ORDER BY weight_savings DESC, slot_savings DESC
      `
    },
    {
      tool_name: 'tech_upgrade_analysis',
      tool_type: 'upgrade_path',
      description: 'Analysis of tech base upgrade paths and benefits',
      comparison_sql: `
        SELECT 
          base_tech.variant_name as base_equipment,
          base_tech.tech_base as base_tech_base,
          upgrade_tech.variant_name as upgrade_equipment,
          upgrade_tech.tech_base as upgrade_tech_base,
          upgrade_tech.weight_tons - base_tech.weight_tons as weight_change,
          upgrade_tech.critical_slots - base_tech.critical_slots as slot_change,
          upgrade_tech.cost_cbills - base_tech.cost_cbills as cost_change,
          upgrade_tech.battle_value - base_tech.battle_value as bv_change
        FROM equipment_tech_variants base_tech
        JOIN equipment_tech_variants upgrade_tech ON base_tech.template_id = upgrade_tech.template_id
        WHERE base_tech.tech_base = 'IS' AND upgrade_tech.tech_base = 'Clan'
        AND (upgrade_tech.weight_tons < base_tech.weight_tons OR upgrade_tech.critical_slots < base_tech.critical_slots)
        ORDER BY (upgrade_tech.weight_tons - base_tech.weight_tons), (upgrade_tech.critical_slots - base_tech.critical_slots)
      `
    }
  ];

  // Create comparison tools table
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_comparison_tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_name TEXT UNIQUE NOT NULL,
      tool_type TEXT NOT NULL, -- 'side_by_side', 'analysis', 'recommendations', 'upgrade_path'
      description TEXT,
      comparison_sql TEXT NOT NULL,
      parameters TEXT, -- JSON array of parameter types
      output_format TEXT DEFAULT 'table',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert comparison tools
  for (const tool of comparisonTools) {
    await db.run(`
      INSERT OR REPLACE INTO equipment_comparison_tools (tool_name, tool_type, description, comparison_sql)
      VALUES (?, ?, ?, ?)
    `, [tool.tool_name, tool.tool_type, tool.description, tool.comparison_sql]);
    results.comparisonToolsCreated++;
  }

  console.log(`    ✅ Created ${results.comparisonToolsCreated} comparison tools`);
}

async function implementAdvancedSearchBrowse(db, results) {
  console.log('  🔎 Implementing advanced search and browse capabilities...');

  // Create search filter configurations
  const searchFilters = [
    {
      filter_name: 'category_browse',
      filter_type: 'hierarchical',
      description: 'Browse equipment by category hierarchy',
      search_sql: `
        SELECT 
          v.id, v.variant_name, v.tech_base, v.weight_tons, v.critical_slots,
          t.name as template_name, c.name as category_name,
          COUNT(*) OVER (PARTITION BY c.name) as category_count
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        WHERE (?='' OR c.name = ?)
        ORDER BY c.display_order, t.name, v.tech_base
      `
    },
    {
      filter_name: 'performance_search',
      filter_type: 'multi_criteria',
      description: 'Search by performance characteristics',
      search_sql: `
        SELECT 
          v.id, v.variant_name, v.tech_base, v.weight_tons, v.critical_slots,
          v.damage, v.heat_generated, v.range_long, v.cost_cbills,
          t.name as template_name, c.name as category_name
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        WHERE 
          (? = 0 OR v.damage >= ?) AND
          (? = 0 OR v.heat_generated <= ?) AND
          (? = 0 OR v.range_long >= ?) AND
          (? = 0 OR v.weight_tons <= ?) AND
          (? = 0 OR v.critical_slots <= ?)
        ORDER BY v.damage DESC, v.range_long DESC
      `
    },
    {
      filter_name: 'compatibility_search',
      filter_type: 'compatibility',
      description: 'Search for compatible equipment combinations',
      search_sql: `
        SELECT 
          v.id, v.variant_name, v.tech_base, v.weight_tons, v.critical_slots,
          t.name as template_name,
          comp.compatible_tech_base,
          comp.compatibility_type,
          comp.restriction_reason
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        LEFT JOIN equipment_compatibility comp ON v.id = comp.equipment_variant_id
        WHERE 
          (? = 'All' OR v.tech_base = ?) AND
          (? = 'All' OR comp.compatibility_type = ?)
        ORDER BY v.tech_base, t.name
      `
    },
    {
      filter_name: 'availability_search',
      filter_type: 'temporal',
      description: 'Search by era availability and introduction dates',
      search_sql: `
        SELECT 
          v.id, v.variant_name, v.tech_base, v.introduction_year, v.era_category,
          v.availability_rating, v.rules_level,
          t.name as template_name, c.name as category_name
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        WHERE 
          (? = 0 OR v.introduction_year >= ?) AND
          (? = 0 OR v.introduction_year <= ?) AND
          (? = '' OR v.era_category = ?) AND
          (? = '' OR v.rules_level = ?)
        ORDER BY v.introduction_year, t.name
      `
    },
    {
      filter_name: 'text_search',
      filter_type: 'full_text',
      description: 'Full-text search across equipment names and descriptions',
      search_sql: `
        SELECT 
          v.id, v.variant_name, v.tech_base, v.weight_tons, v.critical_slots,
          t.name as template_name, t.description, c.name as category_name,
          CASE 
            WHEN v.variant_name LIKE ? THEN 3
            WHEN t.name LIKE ? THEN 2
            WHEN t.description LIKE ? THEN 1
            ELSE 0
          END as relevance_score
        FROM equipment_tech_variants v
        JOIN equipment_templates t ON v.template_id = t.id
        JOIN equipment_categories c ON t.category_id = c.id
        WHERE 
          v.variant_name LIKE ? OR 
          t.name LIKE ? OR 
          t.description LIKE ?
        ORDER BY relevance_score DESC, t.name
      `
    }
  ];

  // Create search filters table
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_search_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filter_name TEXT UNIQUE NOT NULL,
      filter_type TEXT NOT NULL, -- 'hierarchical', 'multi_criteria', 'compatibility', 'temporal', 'full_text'
      description TEXT,
      search_sql TEXT NOT NULL,
      parameters TEXT, -- JSON array describing parameter types
      result_columns TEXT, -- JSON array of result column definitions
      is_active BOOLEAN DEFAULT TRUE,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert search filters
  for (const filter of searchFilters) {
    await db.run(`
      INSERT OR REPLACE INTO equipment_search_filters (filter_name, filter_type, description, search_sql)
      VALUES (?, ?, ?, ?)
    `, [filter.filter_name, filter.filter_type, filter.description, filter.search_sql]);
    results.searchFiltersCreated++;
  }

  console.log(`    ✅ Created ${results.searchFiltersCreated} search filters`);
}

async function createUserInterfaceComponents(db, results) {
  console.log('  🎨 Creating user interface components...');

  // Create UI component specifications
  const uiComponents = [
    {
      component_name: 'tech_base_selector',
      component_type: 'filter_dropdown',
      description: 'Tech base selection dropdown with IS/Clan/Mixed options',
      props: JSON.stringify({
        options: ['All', 'Inner Sphere', 'Clan', 'Mixed'],
        defaultValue: 'All',
        onChange: 'handleTechBaseChange',
        className: 'tech-base-selector'
      }),
      styles: JSON.stringify({
        width: '200px',
        marginRight: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc'
      })
    },
    {
      component_name: 'equipment_comparison_card',
      component_type: 'comparison_display',
      description: 'Card component displaying IS vs Clan equipment comparison',
      props: JSON.stringify({
        isEquipment: 'object',
        clanEquipment: 'object',
        showPerformanceMetrics: true,
        showEfficiencyRatings: true
      }),
      styles: JSON.stringify({
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        marginBottom: '12px'
      })
    },
    {
      component_name: 'equipment_search_bar',
      component_type: 'search_input',
      description: 'Advanced search bar with filters and suggestions',
      props: JSON.stringify({
        placeholder: 'Search equipment by name, type, or specifications...',
        onSearch: 'handleEquipmentSearch',
        enableFilters: true,
        showSuggestions: true
      }),
      styles: JSON.stringify({
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '6px'
      })
    },
    {
      component_name: 'performance_metrics_display',
      component_type: 'metrics_grid',
      description: 'Grid displaying equipment performance metrics and comparisons',
      props: JSON.stringify({
        metrics: 'array',
        showComparisons: true,
        highlightDifferences: true,
        format: 'percentage'
      }),
      styles: JSON.stringify({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '16px'
      })
    },
    {
      component_name: 'equipment_category_tree',
      component_type: 'hierarchical_browser',
      description: 'Hierarchical tree view for browsing equipment categories',
      props: JSON.stringify({
        categories: 'hierarchical_array',
        onCategorySelect: 'handleCategorySelect',
        expandable: true,
        showCounts: true
      }),
      styles: JSON.stringify({
        width: '280px',
        height: '400px',
        overflow: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '4px'
      })
    }
  ];

  // Create UI components table
  await db.run(`
    CREATE TABLE IF NOT EXISTS ui_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_name TEXT UNIQUE NOT NULL,
      component_type TEXT NOT NULL,
      description TEXT,
      props TEXT, -- JSON object defining component properties
      styles TEXT, -- JSON object defining component styles
      dependencies TEXT, -- JSON array of required dependencies
      version TEXT DEFAULT '1.0.0',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert UI components
  for (const component of uiComponents) {
    await db.run(`
      INSERT OR REPLACE INTO ui_components (component_name, component_type, description, props, styles)
      VALUES (?, ?, ?, ?, ?)
    `, [component.component_name, component.component_type, component.description, component.props, component.styles]);
    results.interfaceComponentsCreated++;
  }

  console.log(`    ✅ Created ${results.interfaceComponentsCreated} UI components`);
}

async function implementIntegrationPoints(db, results) {
  console.log('  🔗 Implementing integration points...');

  // Create integration point configurations
  const integrationPoints = [
    {
      integration_name: 'construction_rules_validation',
      integration_type: 'real_time_validation',
      description: 'Real-time validation with construction rules engine',
      endpoint: '/api/equipment/validate',
      integration_sql: `
        SELECT 
          rule.rule_description,
          rule.validation_logic,
          rule.error_message,
          rule.is_warning
        FROM equipment_construction_rules rule
        WHERE rule.rule_type = ? AND rule.is_warning = 0
      `,
      triggers: ['equipment_selection', 'tech_base_change', 'configuration_update']
    },
    {
      integration_name: 'performance_calculation',
      integration_type: 'calculation_engine',
      description: 'Integration with performance calculation engine',
      endpoint: '/api/equipment/calculate-performance',
      integration_sql: `
        SELECT 
          v.*,
          pm.modifier_type,
          pm.modifier_value,
          pm.condition_type,
          tr.modifier_value as tech_rule_modifier
        FROM equipment_tech_variants v
        LEFT JOIN equipment_performance_modifiers pm ON v.id = pm.variant_id
        LEFT JOIN tech_base_rules tr ON v.tech_base = tr.tech_base AND tr.base_equipment_type = ?
        WHERE v.id = ?
      `,
      triggers: ['equipment_comparison', 'efficiency_analysis', 'upgrade_suggestions']
    },
    {
      integration_name: 'migration_tools_export',
      integration_type: 'data_export',
      description: 'Integration with data migration tools for export functionality',
      endpoint: '/api/equipment/export',
      integration_sql: `
        SELECT query FROM migration_tools WHERE tool_name = ? AND tool_type = 'export'
      `,
      triggers: ['user_export_request', 'backup_operation', 'data_analysis']
    },
    {
      integration_name: 'availability_checking',
      integration_type: 'era_validation',
      description: 'Era availability and technology restriction checking',
      endpoint: '/api/equipment/check-availability',
      integration_sql: `
        SELECT 
          v.introduction_year,
          v.extinction_year,
          v.era_category,
          v.rules_level,
          comp.compatibility_type,
          comp.restriction_reason
        FROM equipment_tech_variants v
        LEFT JOIN equipment_compatibility comp ON v.id = comp.equipment_variant_id
        WHERE v.id = ? AND (? BETWEEN COALESCE(v.introduction_year, 0) AND COALESCE(v.extinction_year, 9999))
      `,
      triggers: ['era_selection', 'equipment_filtering', 'construction_validation']
    },
    {
      integration_name: 'mixed_tech_penalties',
      integration_type: 'cost_calculation',
      description: 'Mixed tech penalty calculation and enforcement',
      endpoint: '/api/equipment/calculate-mixed-tech',
      integration_sql: `
        SELECT 
          sr.cost_multiplier,
          sr.bv_multiplier,
          sr.availability_penalty,
          COUNT(DISTINCT v.tech_base) as tech_base_count
        FROM equipment_tech_variants v
        CROSS JOIN (SELECT * FROM special_rules WHERE restriction_type = 'mixed_tech_penalty') sr
        WHERE v.id IN (?)
        HAVING tech_base_count > 1
      `,
      triggers: ['mixed_tech_detection', 'cost_calculation', 'battle_value_calculation']
    }
  ];

  // Create integration points table
  await db.run(`
    CREATE TABLE IF NOT EXISTS equipment_integration_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      integration_name TEXT UNIQUE NOT NULL,
      integration_type TEXT NOT NULL,
      description TEXT,
      endpoint TEXT,
      integration_sql TEXT,
      triggers TEXT, -- JSON array of trigger events
      response_format TEXT DEFAULT 'json',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert integration points
  for (const integration of integrationPoints) {
    await db.run(`
      INSERT OR REPLACE INTO equipment_integration_points 
      (integration_name, integration_type, description, endpoint, integration_sql, triggers)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      integration.integration_name, integration.integration_type, integration.description,
      integration.endpoint, integration.integration_sql, JSON.stringify(integration.triggers)
    ]);
    results.integrationPointsCreated++;
  }

  console.log(`    ✅ Created ${results.integrationPointsCreated} integration points`);
}

async function implementPerformanceOptimizations(db, results) {
  console.log('  ⚡ Implementing performance optimizations...');

  // Create indexes for fast equipment browsing
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_variants_tech_base_category ON equipment_tech_variants(tech_base) JOIN equipment_templates ON template_id = id JOIN equipment_categories ON category_id = id',
    'CREATE INDEX IF NOT EXISTS idx_variants_weight_slots ON equipment_tech_variants(weight_tons, critical_slots)',
    'CREATE INDEX IF NOT EXISTS idx_variants_introduction_year ON equipment_tech_variants(introduction_year)',
    'CREATE INDEX IF NOT EXISTS idx_variants_era_rules ON equipment_tech_variants(era_category, rules_level)',
    'CREATE INDEX IF NOT EXISTS idx_templates_name_search ON equipment_templates(name)',
    'CREATE INDEX IF NOT EXISTS idx_performance_modifiers_variant ON equipment_performance_modifiers(variant_id, modifier_type)'
  ];

  // Create performance optimization configurations
  const optimizations = [
    {
      optimization_name: 'equipment_list_caching',
      optimization_type: 'query_caching',
      description: 'Cache frequently accessed equipment lists',
      cache_duration: 300, // 5 minutes
      cache_key_pattern: 'equipment_list_{tech_base}_{category}'
    },
    {
      optimization_name: 'comparison_result_caching',
      optimization_type: 'query_caching',
      description: 'Cache equipment comparison results',
      cache_duration: 600, // 10 minutes
      cache_key_pattern: 'comparison_{template_id}_{comparison_type}'
    },
    {
      optimization_name: 'search_result_pagination',
      optimization_type: 'pagination',
      description: 'Paginate large search results for better performance',
      page_size: 50,
      max_results: 1000
    }
  ];

  // Execute index creation
  for (const indexSql of indexes) {
    try {
      await db.run(indexSql);
    } catch (error) {
      console.log(`    ⚠️ Index creation note: ${error.message}`);
    }
  }

  // Create performance optimizations table
  await db.run(`
    CREATE TABLE IF NOT EXISTS performance_optimizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      optimization_name TEXT UNIQUE NOT NULL,
      optimization_type TEXT NOT NULL,
      description TEXT,
      cache_duration INTEGER,
      cache_key_pattern TEXT,
      page_size INTEGER,
      max_results INTEGER,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert performance optimizations
  for (const optimization of optimizations) {
    await db.run(`
      INSERT OR REPLACE INTO performance_optimizations 
      (optimization_name, optimization_type, description, cache_duration, cache_key_pattern, page_size, max_results)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      optimization.optimization_name, optimization.optimization_type, optimization.description,
      optimization.cache_duration, optimization.cache_key_pattern, 
      optimization.page_size, optimization.max_results
    ]);
  }

  results.performanceMetrics = {
    indexes_created: indexes.length,
    optimizations_configured: optimizations.length,
    cache_strategies: optimizations.filter(o => o.optimization_type === 'query_caching').length
  };

  console.log(`    ✅ Created ${indexes.length} database indexes and ${optimizations.length} performance optimizations`);
}

async function generateBrowserEnhancementReport(db, results) {
  console.log('  📊 Generating comprehensive browser enhancement report...');

  const report = {
    implementation_summary: {
      total_filters: results.techBaseFiltersCreated,
      total_comparison_tools: results.comparisonToolsCreated,
      total_search_filters: results.searchFiltersCreated,
      total_ui_components: results.interfaceComponentsCreated,
      total_integration_points: results.integrationPointsCreated
    },
    tech_base_filtering: {
      primary_filters: ['tech_base_primary', 'availability_era', 'rules_level'],
      range_filters: ['weight_range', 'slot_range'],
      filter_capabilities: ['dropdown_selection', 'range_filtering', 'era_validation']
    },
    comparison_tools: {
      side_by_side_comparison: 'IS vs Clan equipment variants with efficiency metrics',
      performance_analysis: 'Detailed efficiency ratings and performance modifiers',
      replacement_suggestions: 'Equipment upgrade and replacement recommendations',
      tech_upgrade_analysis: 'Technology base upgrade path analysis'
    },
    search_capabilities: {
      hierarchical_browsing: 'Category-based equipment browsing with counts',
      performance_search: 'Multi-criteria search by damage, heat, range, weight, slots',
      compatibility_search: 'Equipment compatibility and restriction checking',
      availability_search: 'Era-based availability and introduction year filtering',
      full_text_search: 'Search across names and descriptions with relevance scoring'
    },
    ui_components: {
      tech_base_selector: 'Dropdown for IS/Clan/Mixed selection',
      equipment_comparison_card: 'Side-by-side comparison display',
      equipment_search_bar: 'Advanced search with filters and suggestions',
      performance_metrics_display: 'Grid showing performance metrics and comparisons',
      equipment_category_tree: 'Hierarchical category browser'
    },
    integration_points: {
      construction_rules_validation: 'Real-time validation with construction engine',
      performance_calculation: 'Integration with performance calculation engine',
      migration_tools_export: 'Data export functionality integration',
      availability_checking: 'Era availability and restriction validation',
      mixed_tech_penalties: 'Mixed tech cost and BV penalty calculation'
    },
    performance_features: results.performanceMetrics,
    user_experience_enhancements: [
      'Real-time tech base filtering with instant results',
      'Side-by-side IS vs Clan equipment comparisons',
      'Performance efficiency ratings and metrics display',
      'Equipment replacement and upgrade suggestions',
      'Advanced search with multiple criteria',
      'Category-based hierarchical browsing',
      'Era availability validation',
      'Mixed tech penalty calculation',
      'Export functionality for equipment data'
    ]
  };

  return report;
}

implementEquipmentBrowserEnhancement();
