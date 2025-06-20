import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase, safeJsonParse } from '../../services/db';

interface EquipmentData {
  era?: string;
  source?: string;
  [key: string]: any; // For other properties in data
}

interface Equipment {
  id: any;
  name: any;
  type: any;
  tech_base: any;
  era?: string | null; // Can come from column or from data blob
  source?: string | null; // Can come from column or from data blob
  data?: EquipmentData | null; // Parsed data object
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    id,
    page = 1,
    limit = 10,
    type_array, // For filtering by equipment type
    q, // For text search on name
    tech_base_array, // For filtering by tech_base
    era_array, // For filtering by era
    sortBy,
    sortOrder = 'ASC' // Default to ascending order
  } = req.query as {
    id?: string | string[];
    page?: string | string[] | number;
    limit?: string | string[] | number;
    type_array?: string | string[];
    q?: string | string[];
    tech_base_array?: string | string[];
    era_array?: string | string[];
    sortBy?: string | string[];
    sortOrder?: string | string[];
  };

  let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
  let queryStringForLog: string = '';
  let queryParamsForLog: any[] = [];

  try {
    db = await openDatabase();    if (id) {
      const result: Equipment | undefined = await db.get<Equipment>(
        'SELECT id, name, type, tech_base, data FROM equipment WHERE id = ?',
        [id]
      );      if (!result) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      if (result.data && typeof result.data === 'string') {
        result.data = safeJsonParse(result.data, {} as EquipmentData);
      }
      // Augment with data from the blob if available
      result.era = result.data?.era || null;
      result.source = result.data?.source || null;

      return res.status(200).json(result);
    } else {
      const mainQueryFrom: string = 'FROM equipment';
      const whereConditions: string[] = [];
      const queryParams: any[] = [];

      if (q) {
        whereConditions.push(`LOWER(name) LIKE LOWER(?)`);
        queryParams.push(`%${typeof q === 'string' ? q : ''}%`);
      }

      if (type_array) {
        const types: string[] = Array.isArray(type_array) ? type_array : (typeof type_array === 'string' ? type_array.split(',') : []);
        if (types.length > 0) {
          const placeholders: string = types.map(() => `?`).join(', ');
          whereConditions.push(`type IN (${placeholders})`);
          queryParams.push(...types);
        }
      }      if (tech_base_array) {
        const techBases: string[] = Array.isArray(tech_base_array) ? tech_base_array : (typeof tech_base_array === 'string' ? tech_base_array.split(',') : []);
        if (techBases.length > 0) {
          const placeholders: string = techBases.map(() => `?`).join(', ');
          whereConditions.push(`tech_base IN (${placeholders})`);
          queryParams.push(...techBases);
        }
      }

      // We can't filter by era directly since it's in the data JSON
      // The era_array filter would need custom JSON processing
      
      let whereClause: string = '';
      if (whereConditions.length > 0) {
        whereClause = ' WHERE ' + whereConditions.join(' AND ');
      }

      const countQueryString: string = `SELECT COUNT(*) AS total ${mainQueryFrom}${whereClause}`;
      queryStringForLog = countQueryString; // Log this version
      queryParamsForLog = [...queryParams]; // Log params for count
      const totalResult: { total: any } | undefined = await db.get(countQueryString, queryParams);      const totalItems: number = parseInt(totalResult?.total, 10) || 0;

      let mainQueryString: string = `SELECT id, name, type, tech_base, data ${mainQueryFrom}${whereClause}`;
      const validSortColumns: string[] = ['id', 'name', 'type', 'tech_base'];
      const effectiveSortBy: string = validSortColumns.includes(sortBy as string) ? sortBy as string : 'name';
      const effectiveSortOrder: string = (sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      mainQueryString += ` ORDER BY "${effectiveSortBy}" ${effectiveSortOrder}`;

      const limitValue: number = parseInt(limit as string, 10) || 10;
      const pageValue: number = parseInt(page as string, 10) || 1;
      const offsetValue: number = (pageValue - 1) * limitValue;
      mainQueryString += ` LIMIT ? OFFSET ?`;

      const finalQueryParams: any[] = [...queryParams, limitValue, offsetValue];
      queryStringForLog = mainQueryString; // Log this version
      queryParamsForLog = finalQueryParams;      let items: Equipment[] = await db.all<Equipment[]>(mainQueryString, finalQueryParams);      items = items.map(row => {
        if (row.data && typeof row.data === 'string') {
          row.data = safeJsonParse(row.data, {} as EquipmentData);
        }
        // Augment with data from the blob if available
        row.era = row.data?.era || null;
        row.source = row.data?.source || null;
        return row;
      });

      return res.status(200).json({
        items,
        totalItems,
        totalPages: Math.ceil(totalItems / limitValue),
        currentPage: pageValue,
        sortBy: effectiveSortBy,
        sortOrder: effectiveSortOrder,
      });
    }
  } catch (error: any) {
    console.error('Error fetching equipment from SQLite database:', error);
    if (process.env.NODE_ENV === 'development') {
        console.error('Failing Query String (approximate for SQLite):', queryStringForLog);
        console.error('Query Params (approximate for SQLite):', queryParamsForLog);
    }
    return res.status(500).json({
      message: 'Error fetching equipment',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
}
