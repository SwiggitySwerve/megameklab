// src/lib/database.ts
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const projectRoot = path.resolve(process.cwd()); // In Docker, this will be /app

// Determine DB path based on environment
const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(projectRoot, 'data', 'battletech-editor.db');

// Ensure the data directory exists only if not using in-memory DB
if (process.env.NODE_ENV !== 'test') {
  const dbDir = path.join(projectRoot, 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created directory: ${dbDir}`);
  }
}

const verboseSqlite3 = sqlite3.verbose(); // Use verbose for more detailed logs, especially in dev/test

export interface Unit { // Exporting for potential use elsewhere
  id?: number;
  name: string;
  type: string;
  data: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * Establishes a connection to the SQLite database.
 * @returns A promise that resolves with the database instance.
 */
const getDbConnection = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new verboseSqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(`Error connecting to SQLite database at "${dbPath}":`, err.message);
        reject(err);
      } else {
        // if (process.env.NODE_ENV !== 'test') { // Don't log for :memory:
        //   console.log(`Connected to SQLite database at ${dbPath}`);
        // }
        resolve(db);
      }
    });
  });
};

/**
 * Initializes the database by creating necessary tables if they don't exist.
 */
export const initializeDatabase = async (): Promise<void> => {
  let db: sqlite3.Database | null = null;
  try {
    db = await getDbConnection();
    await new Promise<void>((resolve, reject) => {
      db!.serialize(() => { // Use serialize to ensure sequential execution
        db!.run(`
          CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `, (err) => {
          if (err) {
            console.error('Error creating units table:', err.message);
            return reject(err);
          }
          console.log('Units table checked/created successfully.');
        });

        db!.run(`
            CREATE TRIGGER IF NOT EXISTS update_units_updated_at
            AFTER UPDATE ON units
            FOR EACH ROW
            BEGIN
                UPDATE units SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;
        `, (triggerErr) => {
            if (triggerErr) {
                console.error('Error creating updated_at trigger for units:', triggerErr.message);
                return reject(triggerErr);
            }
            console.log('Units updated_at trigger checked/created successfully.');
            resolve();
        });
      });
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error; // Re-throw to indicate failure
  } finally {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database connection during init:', err.message);
        }
      });
    }
  }
};

/**
 * Adds a new unit to the database.
 * @param name - Name of the unit.
 * @param type - Type of the unit.
 * @param data - Additional data for the unit (will be stringified).
 * @returns Promise resolving with the ID of the newly inserted unit.
 */
export const addUnit = async (name: string, type: string, data: any): Promise<number> => {
  const db = await getDbConnection();
  const sql = `INSERT INTO units (name, type, data) VALUES (?, ?, ?)`;
  const jsonData = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    db.run(sql, [name, type, jsonData], function (err) { // Use function() to access this.lastID
      if (err) {
        console.error('Error adding unit:', err.message);
        reject(err);
      } else {
        resolve(this.lastID);
      }
      db.close((closeErr) => {
        if (closeErr) console.error('Error closing DB after adding unit:', closeErr.message);
      });
    });
  });
};

/**
 * Fetches all units from the database.
 * @returns Promise resolving with an array of unit objects.
 */
export const getAllUnits = async (): Promise<Unit[]> => {
  const db = await getDbConnection();
  const sql = `SELECT * FROM units ORDER BY created_at DESC`;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows: Unit[]) => {
      if (err) {
        console.error('Error fetching all units:', err.message);
        reject(err);
      } else {
        const units = rows.map(row => ({
          ...row,
          data: row.data ? JSON.parse(row.data as string) : null,
        }));
        resolve(units);
      }
      db.close((closeErr) => {
        if (closeErr) console.error('Error closing DB after getting all units:', closeErr.message);
      });
    });
  });
};

/**
 * Fetches a single unit by its ID.
 * @param id - The ID of the unit to fetch.
 * @returns Promise resolving with the unit object or null if not found.
 */
export const getUnitById = async (id: number): Promise<Unit | null> => {
  const db = await getDbConnection();
  const sql = `SELECT * FROM units WHERE id = ?`;

  return new Promise((resolve, reject) => {
    db.get(sql, [id], (err, row: Unit) => {
      if (err) {
        console.error(`Error fetching unit with ID ${id}:`, err.message);
        reject(err);
      } else {
        if (row) {
          resolve({
            ...row,
            data: row.data ? JSON.parse(row.data as string) : null,
          });
        } else {
          resolve(null);
        }
      }
      db.close((closeErr) => {
        if (closeErr) console.error(`Error closing DB after getting unit ${id}:`, closeErr.message);
      });
    });
  });
};


// Example usage (optional, for local testing if this file were run directly)
// async function main() {
//   try {
//     console.log('Initializing database...');
//     await initializeDatabase();
//     console.log('Database initialized.');

//     console.log('Adding a sample unit...');
//     const newUnitId = await addUnit('Atlas', 'Assault Mech', {
//       tonnage: 100,
//       weapons: ['LRM20', 'AC20', 'Medium Lasers'],
//     });
//     console.log(`Added new unit with ID: ${newUnitId}`);

//     console.log('Fetching all units...');
//     const units = await getAllUnits();
//     console.log('All units:', JSON.stringify(units, null, 2));

//     if (units.length > 0) {
//       const firstUnitId = units[0].id!;
//       console.log(`Fetching unit with ID: ${firstUnitId}...`);
//       const unit = await getUnitById(firstUnitId);
//       console.log(`Unit ${firstUnitId}:`, JSON.stringify(unit, null, 2));
//     }

//      const nonExistentUnitId = 999;
//      console.log(`Fetching non-existent unit with ID: ${nonExistentUnitId}...`);
//      const nonExistentUnit = await getUnitById(nonExistentUnitId);
//      console.log(`Non-existent unit ${nonExistentUnitId}:`, nonExistentUnit);


//   } catch (error) {
//     console.error('Error in database operations:', error);
//   }
// }

// // This type of check is problematic in Next.js.
// // For testing, consider a separate script or API route.
// // if (typeof require !== 'undefined' && require.main === module) {
// //   main();
// // }
