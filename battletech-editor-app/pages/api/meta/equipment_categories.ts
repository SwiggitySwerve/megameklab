// battletech-editor-app/pages/api/meta/equipment_categories.js
import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase } from '../../../services/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
  try {
    db = await openDatabase(true); // Open in readonly mode

    const result: { type: string }[] = await db.all("SELECT DISTINCT type FROM equipment WHERE type IS NOT NULL AND TRIM(type) <> '' ORDER BY type ASC");
    const values: string[] = result.map(row => row.type);

    res.status(200).json(values);
  } catch (error: any) {
    console.error('Error fetching distinct equipment categories (types) from SQLite:', error);
    res.status(500).json({
      message: 'Error fetching distinct equipment categories (types)',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
}
