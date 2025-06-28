const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkDatabaseSchema() {
  const dbPath = path.join(__dirname, 'data/battletech_enhanced.sqlite');
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('🔍 Checking Database Schema...\n');

    // Get all table names
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    
    for (const table of tables) {
      console.log(`📋 Table: ${table.name}`);
      const columns = await db.all(`PRAGMA table_info(${table.name})`);
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      console.log('');
    }

    await db.close();
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

checkDatabaseSchema();
