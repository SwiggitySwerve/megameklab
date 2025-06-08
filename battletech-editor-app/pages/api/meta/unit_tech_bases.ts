// battletech-editor-app/pages/api/meta/unit_tech_bases.js
import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase } from '../../../services/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
  try {
    db = await openDatabase(true); // Open in readonly mode

    const result: { tech_base: string }[] = await db.all("SELECT DISTINCT tech_base FROM units WHERE tech_base IS NOT NULL AND TRIM(tech_base) <> '' ORDER BY tech_base ASC");
    const values: string[] = result.map(row => row.tech_base);

    res.status(200).json(values);
  } catch (error: any) {
    console.error('Error fetching distinct unit tech bases from SQLite:', error);
    res.status(500).json({
      message: 'Error fetching distinct unit tech bases',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
}
