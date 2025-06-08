// battletech-editor-app/pages/api/meta/unit_eras.js
import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase } from '../../../services/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;  try {
    db = await openDatabase(true); // Open in readonly mode

    const result = await db.all("SELECT DISTINCT era FROM units WHERE era IS NOT NULL AND TRIM(era) <> '' ORDER BY era ASC");
    const values: string[] = result.map(row => row.era);

    res.status(200).json(values);
  } catch (error: any) {
    console.error('Error fetching distinct unit eras from SQLite:', error);
    res.status(500).json({
      message: 'Error fetching distinct unit eras',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
}
