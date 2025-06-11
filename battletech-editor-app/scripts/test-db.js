const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join('/usr/src/app', 'battletech_dev.sqlite');

console.log('Testing database connection and basic queries...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database successfully.');
});

// Test basic queries
db.serialize(() => {
    // Check if tables exist
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='equipment'", (err, row) => {
        if (err) {
            console.error('Error checking equipment table:', err.message);
        } else if (row) {
            console.log('✓ Equipment table exists');
            
            // Count equipment records
            db.get("SELECT COUNT(*) as count FROM equipment", (err, row) => {
                if (err) {
                    console.error('Error counting equipment:', err.message);
                } else {
                    console.log(`✓ Equipment table has ${row.count} records`);
                }
            });
        } else {
            console.log('✗ Equipment table does not exist');
        }
    });

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='units'", (err, row) => {
        if (err) {
            console.error('Error checking units table:', err.message);
        } else if (row) {
            console.log('✓ Units table exists');
            
            // Count unit records
            db.get("SELECT COUNT(*) as count FROM units", (err, row) => {
                if (err) {
                    console.error('Error counting units:', err.message);
                } else {
                    console.log(`✓ Units table has ${row.count} records`);
                }
            });
        } else {
            console.log('✗ Units table does not exist');
        }
    });

    // Sample a few records
    db.all("SELECT chassis, model, unit_type FROM units LIMIT 5", (err, rows) => {
        if (err) {
            console.error('Error sampling units:', err.message);
        } else if (rows && rows.length > 0) {
            console.log('✓ Sample units:');
            rows.forEach(row => {
                console.log(`  - ${row.chassis} ${row.model} (${row.unit_type})`);
            });
        }
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
        console.log('Database test completed successfully!');
    }
});
