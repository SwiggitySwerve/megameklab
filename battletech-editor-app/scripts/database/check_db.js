const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkDatabase() {
  const dbPath = path.join(__dirname, 'data/battletech_dev.sqlite');
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('🔍 Checking database...\n');

    // Check total units
    const totalCount = await db.get('SELECT COUNT(*) as total FROM units');
    console.log(`📊 Total units: ${totalCount.total}`);

    // Check tech_base distribution
    const techBaseDistribution = await db.all(`
      SELECT tech_base, COUNT(*) as count 
      FROM units 
      GROUP BY tech_base 
      ORDER BY count DESC
    `);
    
    console.log('\n🎯 Tech Base Distribution:');
    techBaseDistribution.forEach(row => {
      console.log(`  ${row.tech_base}: ${row.count} units`);
    });

    // Check for mixed tech specifically
    const mixedTech = await db.all(`
      SELECT tech_base, COUNT(*) as count 
      FROM units 
      WHERE tech_base LIKE 'Mixed%'
      GROUP BY tech_base
    `);
    
    console.log('\n🔬 Mixed Tech Units:');
    if (mixedTech.length === 0) {
      console.log('  ❌ No mixed tech units found');
    } else {
      mixedTech.forEach(row => {
        console.log(`  ✅ ${row.tech_base}: ${row.count} units`);
      });
    }

    // Check OmniMech distribution
    const omniMechCount = await db.get(`
      SELECT COUNT(*) as total 
      FROM units 
      WHERE is_omnimech = 1
    `);
    console.log(`\n🤖 OmniMech units: ${omniMechCount.total}`);

    // Sample some unit data
    const sampleUnits = await db.all(`
      SELECT chassis, model, tech_base, is_omnimech, config 
      FROM units 
      LIMIT 10
    `);
    
    console.log('\n📋 Sample Units:');
    sampleUnits.forEach(unit => {
      console.log(`  ${unit.chassis} ${unit.model} - ${unit.tech_base} ${unit.is_omnimech ? '(OmniMech)' : ''}`);
    });

    await db.close();
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabase();
