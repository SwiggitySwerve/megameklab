import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase, safeJsonParse } from '../../../services/db';

// Define expected response data structure
interface CustomVariantDetail {
  id: number;
  base_unit_id: number;
  variant_name: string;
  notes?: string | null;
  custom_data: any; // Parsed JSON object
  created_at: string;
  updated_at: string;
}
interface GetCustomVariantResponse {
  variant?: CustomVariantDetail;
  message?: string; // For errors or informational messages
  error?: string;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetCustomVariantResponse>
) {
  if (req.method === 'GET') {
    let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
    try {
      const { variantId } = req.query;

      if (!variantId || typeof variantId !== 'string') {
        return res.status(400).json({ message: 'variantId path parameter is required and must be a string.' });
      }

      const idNum = parseInt(variantId, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({ message: 'variantId must be a valid number.' });
      }

      db = await openDatabase();

      const variant: CustomVariantDetail | undefined = await db.get(
        'SELECT id, base_unit_id, variant_name, notes, custom_data, created_at, updated_at FROM custom_unit_variants WHERE id = ?',
        [idNum]
      );

      if (!variant) {
        return res.status(404).json({ message: 'Custom variant not found.' });
      }      // Parse custom_data from JSON string to object
      if (variant.custom_data && typeof variant.custom_data === 'string') {
        variant.custom_data = safeJsonParse(variant.custom_data, {});
      }

      return res.status(200).json({ variant });

    } catch (error: any) {
      console.error(`Error fetching custom variant ID ${req.query.variantId}:`, error);
      return res.status(500).json({ message: 'Failed to fetch custom variant.', error: error.message });
    } finally {
      if (db) await db.close();
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
