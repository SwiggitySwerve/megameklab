const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkEquipment() {
  const dbPath = path.join(__dirname, 'data/battletech_dev.sqlite');
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('🔧 Checking equipment database...\n');

    // Check total equipment
    const totalEquipment = await db.get('SELECT COUNT(*) as total FROM equipment');
    console.log(`📊 Total equipment items: ${totalEquipment.total}`);

    // Check tech_base distribution for equipment
    const equipmentTechBase = await db.all(`
      SELECT tech_base, COUNT(*) as count 
      FROM equipment 
      GROUP BY tech_base 
      ORDER BY count DESC
    `);
    
    console.log('\n🎯 Equipment Tech Base Distribution:');
    equipmentTechBase.forEach(row => {
      console.log(`  ${row.tech_base}: ${row.count} items`);
    });

    // Check equipment types
    const equipmentTypes = await db.all(`
      SELECT type, COUNT(*) as count 
      FROM equipment 
      GROUP BY type 
      ORDER BY count DESC
    `);
    
    console.log('\n📋 Equipment Types:');
    equipmentTypes.forEach(row => {
      console.log(`  ${row.type || 'NULL'}: ${row.count} items`);
    });

    // Check equipment categories
    const equipmentCategories = await db.all(`
      SELECT category, COUNT(*) as count 
      FROM equipment 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    console.log('\n🗂️ Equipment Categories:');
    equipmentCategories.forEach(row => {
      console.log(`  ${row.category || 'NULL'}: ${row.count} items`);
    });

    // Sample some equipment data to see structure
    const sampleEquipment = await db.all(`
      SELECT internal_id, name, type, category, tech_base, data
      FROM equipment 
      LIMIT 10
    `);
    
    console.log('\n📋 Sample Equipment:');
    sampleEquipment.forEach(item => {
      console.log(`  ${item.internal_id}: ${item.name} (${item.tech_base}) - ${item.type}/${item.category}`);
    });

    // Look for potential Clan equipment by name patterns
    const potentialClanEquipment = await db.all(`
      SELECT internal_id, name, tech_base
      FROM equipment 
      WHERE name LIKE '%Clan%' 
         OR internal_id LIKE '%Clan%'
         OR name LIKE '%ER %'
         OR name LIKE '%Ultra%'
         OR name LIKE '%LB %'
      LIMIT 20
    `);
    
    console.log('\n🔍 Potential Clan Equipment (by name pattern):');
    if (potentialClanEquipment.length === 0) {
      console.log('  ❌ No Clan equipment found by name patterns');
    } else {
      potentialClanEquipment.forEach(item => {
        console.log(`  ${item.internal_id}: ${item.name} (${item.tech_base})`);
      });
    }

    // Check a sample equipment's data structure
    const sampleEquipmentData = await db.get(`
      SELECT name, data
      FROM equipment 
      WHERE type IS NOT NULL
      LIMIT 1
    `);
    
    if (sampleEquipmentData) {
      console.log('\n📄 Sample Equipment Data Structure:');
      console.log(`Equipment: ${sampleEquipmentData.name}`);
      try {
        const parsedData = JSON.parse(sampleEquipmentData.data);
        console.log('Data fields:', Object.keys(parsedData));
        console.log('Sample data:', JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.log('Data (raw):', sampleEquipmentData.data.substring(0, 200) + '...');
      }
    }

    await db.close();
    console.log('\n✅ Equipment check complete!');
    
  } catch (error) {
    console.error('❌ Error checking equipment:', error);
  }
}

checkEquipment();
