// battletech-editor-app/pages/api/meta/categories.js
import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase } from '../../../services/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
  try {
    db = await openDatabase(true); // Open in readonly mode    // Fetches distinct 'unit_type' values from the 'units' table.
    // This 'unit_type' column is assumed to store the unit categories like "BattleMech", "Vehicle", etc.
    const result: { unit_type: string }[] = await db.all("SELECT DISTINCT unit_type FROM units WHERE unit_type IS NOT NULL AND TRIM(unit_type) <> '' ORDER BY unit_type ASC");
    // The `sqlite` wrapper's .all() method returns rows directly as an array of objects
    const categories: string[] = result.map(row => row.unit_type);

    res.status(200).json(categories);
  } catch (error: any) {
    console.error('Error fetching unit categories from SQLite:', error);
    res.status(500).json({
      message: 'Error fetching unit categories',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
}
