const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function createEquipmentVariantsDatabase() {
  const dbPath = path.join(__dirname, 'data/battletech_enhanced.sqlite');
  
  try {
    console.log('🔧 Creating Equipment Variants Database - Phase 3, Step 6\n');

    // Remove existing database to start fresh
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️ Removed existing enhanced database\n');
    }

    // Create new enhanced database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('📊 Implementing Enhanced Equipment Schema...\n');

    // Create enhanced schema tables
    await createEnhancedSchema(db);
    console.log('✅ Enhanced schema created successfully\n');

    // Load existing equipment data
    const existingDbPath = path.join(__dirname, 'data/battletech_dev.sqlite');
    const existingDb = await open({
      filename: existingDbPath,
      driver: sqlite3.Database
    });

    const existingEquipment = await existingDb.all(`
      SELECT internal_id, name, type, category, tech_base, data
      FROM equipment 
      ORDER BY name
    `);

    await existingDb.close();
    console.log(`📋 Loaded ${existingEquipment.length} existing equipment items\n`);

    // Create equipment templates and variants
    console.log('🏗️ Creating Equipment Templates and Variants...\n');
    
    const creationResults = {
      templatesCreated: 0,
      variantsCreated: 0,
      criticalSystemsCreated: 0,
      missingSystemsCreated: 0
    };

    // Process critical missing systems first
    await createCriticalMissingSystems(db, creationResults);
    
    // Process existing equipment into templates and variants
    await processExistingEquipment(db, existingEquipment, creationResults);

    // Create tech base rules
    await createTechBaseRules(db);

    console.log('📊 EQUIPMENT VARIANTS DATABASE CREATION SUMMARY');
    console.log('================================================');
    console.log(`Templates Created: ${creationResults.templatesCreated}`);
    console.log(`Variants Created: ${creationResults.variantsCreated}`);
    console.log(`Critical Systems Created: ${creationResults.criticalSystemsCreated}`);
    console.log(`Missing Systems Created: ${creationResults.missingSystemsCreated}`);
    console.log('');

    // Generate variant creation report
    const variantReport = await generateVariantCreationReport(db);
    
    // Save results
    const results = {
      summary: creationResults,
      enhanced_schema_implemented: true,
      critical_systems_resolved: true,
      variant_report: variantReport,
      database_path: dbPath,
      creation_date: new Date().toISOString()
    };

    fs.writeFileSync('data/equipment_variants_creation_results.json', JSON.stringify(results, null, 2));
    console.log('💾 Equipment variants creation results saved\n');

    await db.close();
    console.log('✅ Equipment variants database creation complete!');
    
  } catch (error) {
    console.error('❌ Error creating equipment variants database:', error);
  }
}

async function createEnhancedSchema(db) {
  // Read the enhanced schema SQL file
  const schemaPath = path.join(__dirname, 'data/enhanced_equipment_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Execute schema creation
  await db.exec(schemaSql);
  
  console.log('✅ Enhanced equipment schema tables created');
}

async function createCriticalMissingSystems(db, results) {
  console.log('🚨 Creating Critical Missing Systems...\n');

  // Create XL Engine template and variants
  await createXLEngineVariants(db, results);
  
  // Create proper Double Heat Sink variants
  await createDoubleHeatSinkVariants(db, results);
  
  // Create missing cockpit variants
  await createCockpitVariants(db, results);
  
  // Create missing gyro variants
  await createGyroVariants(db, results);

  console.log(`✅ Created ${results.criticalSystemsCreated} critical system variants\n`);
}

async function createXLEngineVariants(db, results) {
  console.log('⚙️ Creating XL Engine Template and Variants...');

  // Get energy weapons category ID
  const categoryResult = await db.get(`
    SELECT id FROM equipment_categories WHERE name = 'Engines'
  `);
  
  if (!categoryResult) {
    console.log('❌ Engines category not found, creating...');
    await db.run(`
      INSERT INTO equipment_categories (name, description, display_order) 
      VALUES ('Engines', 'Engine systems and components', 4)
    `);
  }

  const categoryId = categoryResult ? categoryResult.id : 
    (await db.get('SELECT last_insert_rowid() as id')).id;

  // Create XL Engine template
  const templateResult = await db.run(`
    INSERT INTO equipment_templates (name, base_type, category_id, description, rules_text)
    VALUES (?, ?, ?, ?, ?)
  `, [
    'XL Engine',
    'XL Engine',
    categoryId,
    'Extra-Light Fusion Engine - 50% weight reduction from standard fusion engine',
    'XL engines are destroyed if either side torso is destroyed. Weight is 50% of standard fusion engine.'
  ]);

  const templateId = templateResult.lastID;
  results.templatesCreated++;

  // Create IS XL Engine variant
  await db.run(`
    INSERT INTO equipment_tech_variants (
      template_id, tech_base, variant_name, internal_id, weight_tons, critical_slots,
      cost_cbills, battle_value, introduction_year, era_category, rules_level,
      special_rules
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    templateId, 'IS', 'IS XL Engine', 'ISXLEngine', 0, 6, 0, 0, 3057,
    'Clan Invasion', 'Standard',
    JSON.stringify(['6 critical slots: 3 in each side torso', 'Destroyed if either side torso destroyed', '50% weight of standard fusion engine'])
  ]);
  results.variantsCreated++;
  results.criticalSystemsCreated++;

  // Create Clan XL Engine variant
  await db.run(`
    INSERT INTO equipment_tech_variants (
      template_id, tech_base, variant_name, internal_id, weight_tons, critical_slots,
      cost_cbills, battle_value, introduction_year, era_category, rules_level,
      special_rules
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    templateId, 'Clan', 'Clan XL Engine', 'ClanXLEngine', 0, 4, 0, 0, 2824,
    'Age of War', 'Standard',
    JSON.stringify(['4 critical slots: 2 in each side torso', 'Destroyed if either side torso destroyed', '50% weight of standard fusion engine'])
  ]);
  results.variantsCreated++;
  results.criticalSystemsCreated++;

  console.log('  ✅ IS XL Engine (6 slots: 3+3)');
  console.log('  ✅ Clan XL Engine (4 slots: 2+2)');
  results.missingSystemsCreated += 2;
}

async function createDoubleHeatSinkVariants(db, results) {
  console.log('🔥 Creating Double Heat Sink Template and Variants...');

  // Get heat management category ID
  let categoryResult = await db.get(`
    SELECT id FROM equipment_categories WHERE name = 'Heat Management'
  `);
  
  if (!categoryResult) {
    console.log('❌ Heat Management category not found, creating...');
    await db.run(`
      INSERT INTO equipment_categories (name, parent_category_id, description, display_order) 
      VALUES ('Heat Management', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'Heat sinks and cooling systems', 21)
    `);
    categoryResult = await db.get('SELECT last_insert_rowid() as id');
  }

  const categoryId = categoryResult.id;

  // Create Double Heat Sink template
  const templateResult = await db.run(`
    INSERT INTO equipment_templates (name, base_type, category_id, description, rules_text)
    VALUES (?, ?, ?, ?, ?)
  `, [
    'Double Heat Sink',
    'Double Heat Sink',
    categoryId,
    'Double Heat Sink - Dissipates 2 heat points instead of 1',
    'Double Heat Sinks dissipate 2 heat points. Slot requirements differ between IS and Clan technology.'
  ]);

  const templateId = templateResult.lastID;
  results.templatesCreated++;

  // Create IS Double Heat Sink variant
  await db.run(`
    INSERT INTO equipment_tech_variants (
      template_id, tech_base, variant_name, internal_id, weight_tons, critical_slots,
      cost_cbills, battle_value, introduction_year, era_category, rules_level,
      special_rules, heat_generated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    templateId, 'IS', 'IS Double Heat Sink', 'ISDoubleHeatSink', 1.0, 3, 6000, 0, 3040,
    'Succession Wars', 'Standard',
    JSON.stringify(['3 critical slots outside engine', 'Dissipates 2 heat points', '1 ton weight']),
    -2
  ]);
  results.variantsCreated++;
  results.criticalSystemsCreated++;

  // Create Clan Double Heat Sink variant
  await db.run(`
    INSERT INTO equipment_tech_variants (
      template_id, tech_base, variant_name, internal_id, weight_tons, critical_slots,
      cost_cbills, battle_value, introduction_year, era_category, rules_level,
      special_rules, heat_generated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    templateId, 'Clan', 'Clan Double Heat Sink', 'ClanDoubleHeatSink', 1.0, 2, 6000, 0, 2800,
    'Age of War', 'Standard',
    JSON.stringify(['2 critical slots outside engine', 'Dissipates 2 heat points', '1 ton weight']),
    -2
  ]);
  results.variantsCreated++;
  results.criticalSystemsCreated++;

  console.log('  ✅ IS Double Heat Sink (3 slots)');
  console.log('  ✅ Clan Double Heat Sink (2 slots)');
  results.missingSystemsCreated += 2;
}

async function createCockpitVariants(db, results) {
  console.log('🪑 Creating Advanced Cockpit Variants...');

  // Get equipment category ID
  let categoryResult = await db.get(`
    SELECT id FROM equipment_categories WHERE name = 'Cockpit Systems'
  `);
  
  if (!categoryResult) {
    await db.run(`
      INSERT INTO equipment_categories (name, parent_category_id, description, display_order) 
      VALUES ('Cockpit Systems', (SELECT id FROM equipment_categories WHERE name = 'Equipment'), 'Cockpit, life support, and pilot systems', 26)
    `);
    categoryResult = await db.get('SELECT last_insert_rowid() as id');
  }

  const categoryId = categoryResult.id;

  // Create Small Cockpit template and variant
  const smallCockpitResult = await db.run(`
    INSERT INTO equipment_templates (name, base_type, category_id, description, rules_text)
    VALUES (?, ?, ?, ?, ?)
  `, [
    'Small Cockpit',
    'Small Cockpit',
    categoryId,
    'Small Cockpit - Reduced weight and space requirements',
    'Small cockpit reduces pilot protection but saves weight and space.'
  ]);

  await db.run(`
    INSERT INTO equipment_tech_variants (
      template_id, tech_base, variant_name, internal_id, weight_tons, critical_slots,
      cost_cbills, battle_value, introduction_year, era_category, rules_level,
      special_rules
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    smallCockpitResult.lastID, 'Mixed', 'Small Cockpit', 'SmallCockpit', 2.0, 1, 175000, 0, 3067,
    'Civil War', 'Standard',
    JSON.stringify(['1 critical slot in head', '2 tons weight', 'Reduced pilot protection'])
  ]);

  results.templatesCreated++;
  results.variantsCreated++;
  results.missingSystemsCreated++;

  console.log('  ✅ Small Cockpit (1 slot, 2 tons)');
}

async function createGyroVariants(db, results) {
  console.log('⚖️ Creating Advanced Gyro Variants...');

  // Get equipment category ID
  let categoryResult = await db.get(`
    SELECT id FROM equipment_categories WHERE name = 'Equipment'
  `);
  
  const categoryId = categoryResult.id;

  // Create XL Gyro template and variant
  const xlGyroResult = await db.run(`
    INSERT INTO equipment_templates (name, base_type, category_id, description, rules_text)
    VALUES (?, ?, ?, ?, ?)
  `, [
    'XL Gyro',
    'XL Gyro',
    categoryId,
    'Extra-Light Gyro - Reduced critical slot requirements',
    'XL Gyro uses fewer critical slots but is more fragile.'
  ]);

  await db.run(`
    INSERT INTO equipment_tech_variants (
      template_id, tech_base, variant_name, internal_id, weight_tons, critical_slots,
      cost_cbills, battle_value, introduction_year, era_category, rules_level,
      special_rules
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    xlGyroResult.lastID, 'Mixed', 'XL Gyro', 'XLGyro', 0.5, 2, 750000, 0, 3067,
    'Civil War', 'Standard',
    JSON.stringify(['2 critical slots in center torso', 'Reduced weight', 'More fragile than standard gyro'])
  ]);

  results.templatesCreated++;
  results.variantsCreated++;
  results.missingSystemsCreated++;

  console.log('  ✅ XL Gyro (2 slots)');
}

async function processExistingEquipment(db, existingEquipment, results) {
  console.log('🔄 Processing Existing Equipment into Templates and Variants...\n');

  const processedTemplates = new Map();
  
  for (const equipment of existingEquipment) {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(equipment.data);
      } catch (e) {
        parsedData = {};
      }

      // Determine base template name
      const baseTemplateName = getBaseTemplateName(equipment.name);
      
      // Skip if we already processed this template
      if (processedTemplates.has(baseTemplateName)) {
        // Just add variant to existing template
        const templateId = processedTemplates.get(baseTemplateName);
        await createEquipmentVariant(db, templateId, equipment, parsedData, results);
        continue;
      }

      // Create new template
      const templateId = await createEquipmentTemplate(db, baseTemplateName, equipment, results);
      processedTemplates.set(baseTemplateName, templateId);
      
      // Create variant for this equipment
      await createEquipmentVariant(db, templateId, equipment, parsedData, results);
      
    } catch (error) {
      console.error(`Error processing equipment ${equipment.internal_id}:`, error.message);
    }
  }

  console.log(`\n✅ Processed ${existingEquipment.length} equipment items into templates and variants`);
}

function getBaseTemplateName(equipmentName) {
  // Remove tech base prefixes and specific identifiers
  let baseName = equipmentName
    .replace(/^(IS|Clan|CL|1\s+|2\s+|3\s+|4\s+)/, '') // Remove tech prefixes and numbers
    .replace(/\s*\(.*?\)$/, '') // Remove parenthetical suffixes
    .replace(/\s*(omnipod|OMNIPOD|R)$/, '') // Remove omnipod indicators
    .replace(/\s*Prototype$/, '') // Remove prototype suffix
    .replace(/\s*(armored)$/, '') // Remove armored suffix
    .trim();
  
  return baseName || equipmentName;
}

async function createEquipmentTemplate(db, templateName, equipment, results) {
  // Get appropriate category ID
  const categoryId = await getOrCreateCategoryId(db, equipment);
  
  const templateResult = await db.run(`
    INSERT INTO equipment_templates (name, base_type, category_id, description)
    VALUES (?, ?, ?, ?)
  `, [
    templateName,
    templateName,
    categoryId,
    `Base template for ${templateName} equipment variants`
  ]);

  results.templatesCreated++;
  return templateResult.lastID;
}

async function createEquipmentVariant(db, templateId, equipment, parsedData, results) {
  // Determine proper tech base
  let techBase = equipment.tech_base;
  if (techBase === 'Mixed' && (equipment.name.includes('IS') || equipment.name.includes('Inner Sphere'))) {
    techBase = 'IS';
  } else if (techBase === 'Mixed' && (equipment.name.includes('Clan') || equipment.name.includes('CL'))) {
    techBase = 'Clan';
  }

  await db.run(`
    INSERT INTO equipment_tech_variants (
      template_id, tech_base, variant_name, internal_id, weight_tons, critical_slots,
      cost_cbills, battle_value, damage, heat_generated, range_short, range_medium, range_long,
      ammo_per_ton, introduction_year, era_category, rules_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    templateId, techBase, equipment.name, equipment.internal_id,
    parsedData.tonnage || 0, parsedData.critical_slots || 0,
    parsedData.cost_cbills || 0, parsedData.battle_value || 0,
    parsedData.damage || null, parsedData.heat || null,
    parsedData.range_short || null, parsedData.range_medium || null, parsedData.range_long || null,
    parsedData.ammo_per_ton || null,
    parsedData.introduction_year || null, parsedData.era || null, parsedData.rules_level || 'Standard'
  ]);

  results.variantsCreated++;
}

async function getOrCreateCategoryId(db, equipment) {
  // Map equipment to appropriate category
  const nameLower = equipment.name.toLowerCase();
  
  let categoryName = 'Equipment'; // Default
  
  if (nameLower.includes('laser') || nameLower.includes('ppc') || nameLower.includes('flamer') || nameLower.includes('plasma')) {
    categoryName = 'Energy Weapons';
  } else if (nameLower.includes('gauss') || nameLower.includes('autocannon') || nameLower.includes('machine gun') || nameLower.includes('ultra') || nameLower.includes('lb ')) {
    categoryName = 'Ballistic Weapons';
  } else if (nameLower.includes('lrm') || nameLower.includes('srm') || nameLower.includes('streak') || nameLower.includes('atm') || nameLower.includes('rocket')) {
    categoryName = 'Missile Weapons';
  } else if (nameLower.includes('engine')) {
    categoryName = 'Engines';
  } else if (nameLower.includes('heat sink')) {
    categoryName = 'Heat Management';
  } else if (nameLower.includes('armor') || nameLower.includes('ferro')) {
    categoryName = 'Armor';
  } else if (nameLower.includes('endo steel') || nameLower.includes('structure')) {
    categoryName = 'Structure';
  }

  let categoryResult = await db.get(`
    SELECT id FROM equipment_categories WHERE name = ?
  `, [categoryName]);

  if (!categoryResult) {
    await db.run(`
      INSERT INTO equipment_categories (name, description, display_order) 
      VALUES (?, ?, ?)
    `, [categoryName, `${categoryName} category`, 10]);
    categoryResult = await db.get('SELECT last_insert_rowid() as id');
  }

  return categoryResult.id;
}

async function createTechBaseRules(db) {
  console.log('📋 Creating Tech Base Rules...\n');

  const rules = [
    ['Clan', 'weight_modifier', 'Energy Weapons', 0.8, 'multiplier', 'Clan energy weapons typically 20% lighter'],
    ['Clan', 'weight_modifier', 'Ballistic Weapons', 0.9, 'multiplier', 'Clan ballistic weapons typically 10% lighter'],
    ['Clan', 'slot_modifier', 'Energy Weapons', 0.5, 'multiplier', 'Clan energy weapons typically use half the slots'],
    ['Clan', 'slot_modifier', 'XL Engine', 0.67, 'multiplier', 'Clan XL engines use 4 slots vs IS 6 slots'],
    ['Clan', 'slot_modifier', 'Double Heat Sink', 0.67, 'multiplier', 'Clan DHS use 2 slots vs IS 3 slots']
  ];

  for (const rule of rules) {
    await db.run(`
      INSERT INTO tech_base_rules (tech_base, rule_type, base_equipment_type, modifier_value, modifier_type, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, rule);
  }

  console.log('✅ Tech base rules created');
}

async function generateVariantCreationReport(db) {
  const variants = await db.all(`
    SELECT t.name as template_name, v.tech_base, v.variant_name, v.weight_tons, v.critical_slots
    FROM equipment_tech_variants v
    JOIN equipment_templates t ON v.template_id = t.id
    ORDER BY t.name, v.tech_base
  `);

  const report = {
    total_variants: variants.length,
    by_tech_base: {},
    critical_systems: []
  };

  // Count by tech base
  variants.forEach(variant => {
    if (!report.by_tech_base[variant.tech_base]) {
      report.by_tech_base[variant.tech_base] = 0;
    }
    report.by_tech_base[variant.tech_base]++;
  });

  // Identify critical systems
  const criticalSystems = ['XL Engine', 'Double Heat Sink', 'Small Cockpit', 'XL Gyro'];
  report.critical_systems = variants.filter(v => 
    criticalSystems.some(cs => v.template_name.includes(cs))
  );

  return report;
}

createEquipmentVariantsDatabase();
