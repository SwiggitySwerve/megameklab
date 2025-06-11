import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase, safeJsonParse } from '../../services/db';

// Define the path to the SQLite database file
const SQLITE_DB_FILE: string = "battletech_dev.sqlite"; // Adjust if your DB file is elsewhere or named differently

// Define expected request body structure for POST
interface SaveCustomVariantRequest {
  baseUnitId: number | string;
  variantName: string;
  notes?: string;
  customData: {
    loadout: any[]; // Define more specific types if possible (e.g., UnitEquipmentItem[])
    criticals: any[]; // Define more specific types if possible (e.g., CriticalLocation[])
    // Potentially other customized aspects like armor, engine modifications etc.
  };
}

// Define expected response data structure for POST
interface SaveCustomVariantResponse {
  message: string;
  variantId?: number;
  error?: string;
}

// Define response data structure for GET (list)
interface CustomVariantListItem {
  id: number;
  base_unit_id: number;
  variant_name: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}
interface ListCustomVariantsResponse {
  items?: CustomVariantListItem[];
  message?: string; // Also used for error messages in GET list
  error?: string;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveCustomVariantResponse | ListCustomVariantsResponse> // Union type for response
) {
  if (req.method === 'POST') {
    let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
    try {
      const { baseUnitId, variantName, notes, customData } = req.body as SaveCustomVariantRequest;

      // Basic validation for POST
      if (!baseUnitId || !variantName || !customData) {
        return res.status(400).json({ message: 'Missing required fields: baseUnitId, variantName, and customData are required.' });
      }
      if (typeof variantName !== 'string' || variantName.trim() === '') {
        return res.status(400).json({ message: 'variantName must be a non-empty string.' });
      }
      if (typeof customData !== 'object' || customData === null || !customData.loadout || !customData.criticals) {
        return res.status(400).json({ message: 'customData must be an object with at least loadout and criticals arrays.' });
      }
      if (!Array.isArray(customData.loadout) || !Array.isArray(customData.criticals)) {
        return res.status(400).json({ message: 'customData.loadout and customData.criticals must be arrays.' });
      }

      db = await openDatabase();

      const customDataString = JSON.stringify(customData);
      const baseUnitIdNum = typeof baseUnitId === 'string' ? parseInt(baseUnitId, 10) : baseUnitId;

      if (isNaN(baseUnitIdNum)) {
          return res.status(400).json({ message: 'baseUnitId must be a valid number for POST request.' });
      }

      const result = await db.run(
        'INSERT INTO custom_unit_variants (base_unit_id, variant_name, notes, custom_data, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [baseUnitIdNum, variantName.trim(), notes || null, customDataString]
      );

      if (result.lastID) {
        return res.status(201).json({ message: 'Custom variant saved successfully.', variantId: result.lastID });
      } else {
        console.error('Save custom variant: Insert seemed to succeed but lastID was not available.', result);
        return res.status(500).json({ message: 'Failed to save custom variant. Could not retrieve new variant ID.' });
      }

    } catch (error: any) {
      console.error('Error saving custom variant:', error);
      if (error.message && error.message.includes("FOREIGN KEY constraint failed")) {
           return res.status(400).json({ message: 'Failed to save custom variant. Invalid baseUnitId or other foreign key constraint.', error: error.message });
      }
      return res.status(500).json({ message: 'Failed to save custom variant.', error: error.message });
    } finally {
      if (db) {
        await db.close();
      }
    }  } else if (req.method === 'GET') {
    let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
    try {
      const { baseUnitId, variantName } = req.query;

      db = await openDatabase();
        // If specific parameters are provided, filter by them
      if (baseUnitId && variantName) {
        if (typeof baseUnitId !== 'string' || typeof variantName !== 'string') {
          return res.status(400).json({ message: 'baseUnitId and variantName must be strings for GET.' });
        }

        const baseUnitIdNum = parseInt(baseUnitId, 10);
        if (isNaN(baseUnitIdNum)) {
          return res.status(400).json({ message: 'baseUnitId must be a valid number for GET request.' });
        }

        const variants: CustomVariantListItem[] = await db.all(
          'SELECT id, base_unit_id, variant_name, notes, created_at, updated_at FROM custom_unit_variants WHERE base_unit_id = ? AND variant_name = ? ORDER BY created_at DESC',
          [baseUnitIdNum, variantName]
        );

        return res.status(200).json({ items: variants });
      } 
      // If only baseUnitId is provided, filter by baseUnitId
      else if (baseUnitId) {
        if (typeof baseUnitId !== 'string') {
          return res.status(400).json({ message: 'baseUnitId must be a string for GET.' });
        }

        const baseUnitIdNum = parseInt(baseUnitId, 10);
        if (isNaN(baseUnitIdNum)) {
          return res.status(400).json({ message: 'baseUnitId must be a valid number for GET request.' });
        }

        const unitVariants: CustomVariantListItem[] = await db.all(
          'SELECT id, base_unit_id, variant_name, notes, created_at, updated_at FROM custom_unit_variants WHERE base_unit_id = ? ORDER BY created_at DESC',
          [baseUnitIdNum]
        );

        return res.status(200).json({ items: unitVariants });
      }
      // Otherwise return all variants
      else {
        const variants: CustomVariantListItem[] = await db.all(
          'SELECT id, base_unit_id, variant_name, notes, created_at, updated_at FROM custom_unit_variants ORDER BY created_at DESC'
        );

        return res.status(200).json({ items: variants });
      }

    } catch (error: any) {
      console.error('Error fetching custom variant list:', error);
      return res.status(500).json({ message: 'Failed to fetch custom variant list.', error: error.message });
    } finally {
      if (db) await db.close();
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
