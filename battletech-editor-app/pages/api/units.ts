import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { openDatabase, safeJsonParse } from '../../services/db';
import { validateUnit } from '../../utils/unitValidation';

interface Unit {
  id: any;
  chassis: any;
  model: any;
  mass: any;
  tech_base: any;
  rules_level: any;
  era: any;
  source: any;
  data: any;
  type: any;
  is_omnimech?: boolean;
  omnimech_base_chassis?: string;
  omnimech_configuration?: string;
  config?: string;
  validation_status?: 'valid' | 'warning' | 'error';
  validation_messages?: string[];
}

interface Quirk {
  Name: string;
  [key: string]: any;
}

interface UnitData {
  Quirks?: Quirk[];
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    id,
    page = 1,
    limit = 10,
    q,
    techBase,
    mass_gte,
    mass_lte,
    has_quirk,
    unit_type,
    weight_class,
    startYear,
    endYear,
    sortBy,
    sortOrder = 'ASC',
    isOmnimech,
    config
  } = req.query as {
    id?: string | string[];
    page?: string | string[] | number;
    limit?: string | string[] | number;
    q?: string | string[];
    techBase?: string | string[];
    mass_gte?: string | string[];
    mass_lte?: string | string[];
    has_quirk?: string | string[];
    unit_type?: string | string[];
    weight_class?: string | string[];
    startYear?: string | string[];
    endYear?: string | string[];
    sortBy?: string | string[];
    sortOrder?: string | string[];
    isOmnimech?: string | string[];
    config?: string | string[];
  };

  let db: Database<sqlite3.Database, sqlite3.Statement> | undefined;
  let mainQueryStringForLog: string = '';
  let finalQueryParamsForLog: any[] = [];

  try {
    db = await openDatabase();

    if (id) {
      const result: Unit | undefined = await db.get<Unit>(
        'SELECT id, chassis, model, mass_tons AS mass, tech_base, era, source_book AS source, data, unit_type AS type, is_omnimech, omnimech_base_chassis, omnimech_configuration, config FROM units WHERE id = ?',
        [id]
      );

      if (!result) {
        return res.status(404).json({ message: 'Unit not found' });
      }

      // Parse the data field if it's a string
      if (result.data && typeof result.data === 'string') {
        result.data = safeJsonParse(result.data, {});
      }

      // Add validation status
      try {
        // Create placeholder weights and crits objects for validation
        const weights = { total: 0 };
        const crits = { total: 0 };
        const validationResult = validateUnit(result, weights, crits);
        result.validation_status = validationResult.isValid ? 'valid' : 
          (validationResult.errors.length > 0 ? 'error' : 'warning');
        result.validation_messages = [
          ...validationResult.errors.map(e => e.message),
          ...validationResult.warnings.map(w => w.message)
        ];
      } catch (validationError) {
        console.warn('Validation failed for unit:', result.id, validationError);
        result.validation_status = 'error';
        result.validation_messages = ['Validation system error'];
      }

      return res.status(200).json(result);
    } else {
      const mainQueryFrom: string = 'FROM units';
      const whereConditions: string[] = [];
      const queryParams: any[] = [];

      if (q) {
        whereConditions.push(`(LOWER(chassis) LIKE LOWER(?) OR LOWER(model) LIKE LOWER(?))`);
        queryParams.push(`%${typeof q === 'string' ? q : ''}%`, `%${typeof q === 'string' ? q : ''}%`);
      }
      if (unit_type) {
        whereConditions.push(`unit_type = ?`);
        queryParams.push(unit_type);
      }
      if (techBase) {
        whereConditions.push(`tech_base = ?`);
        queryParams.push(techBase);
      }
      if (mass_gte) {
        whereConditions.push(`mass_tons >= ?`);
        queryParams.push(parseInt(mass_gte as string, 10));
      }
      if (mass_lte) {
        whereConditions.push(`mass_tons <= ?`);
        queryParams.push(parseInt(mass_lte as string, 10));
      }
      if (weight_class) {
        const weightClassMap: { [key: string]: { gte: number; lte: number } } = {
          'Light': { gte: 20, lte: 35 },
          'Medium': { gte: 40, lte: 55 },
          'Heavy': { gte: 60, lte: 75 },
          'Assault': { gte: 80, lte: 100 }
        };
        const selectedWeightClass = weightClassMap[weight_class as string];
        if (selectedWeightClass) {
          whereConditions.push(`mass_tons >= ?`);
          queryParams.push(selectedWeightClass.gte);
          whereConditions.push(`mass_tons <= ?`);
          queryParams.push(selectedWeightClass.lte);
        }
      }
      if (isOmnimech !== undefined) {
        whereConditions.push(`is_omnimech = ?`);
        queryParams.push(isOmnimech === 'true' ? 1 : 0);
      }
      if (config) {
        whereConditions.push(`config = ?`);
        queryParams.push(config);
      }
      // Note: Era filtering temporarily disabled due to missing available_year column
      // TODO: Add available_year column to database schema or use alternative era logic
      if (startYear) {
        // For now, we'll skip era filtering and just accept the parameter
        console.warn('Era filtering (startYear) not implemented - missing available_year column');
      }
      if (endYear) {
        // For now, we'll skip era filtering and just accept the parameter  
        console.warn('Era filtering (endYear) not implemented - missing available_year column');
      }

      // Quirk filter will be applied after fetching initial data if present
      const applyQuirkFilterLater: boolean = !!has_quirk;
      const queryParamsForCount: any[] = [...queryParams];
      const whereClauseForCount: string = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';

      const queryParamsForMain: any[] = [...queryParams];
      const whereClauseForMain: string = whereClauseForCount;

      // Count query
      const countQueryString: string = `SELECT COUNT(*) AS total ${mainQueryFrom}${whereClauseForCount}`;
      mainQueryStringForLog = countQueryString;
      finalQueryParamsForLog = queryParamsForCount;
      const totalResult: { total: any } | undefined = await db.get(countQueryString, queryParamsForCount);
      let totalItems: number = parseInt(totalResult?.total, 10) || 0;

      // Main query construction
      let mainQueryString: string = `SELECT id, chassis, model, mass_tons AS mass, tech_base, era, source_book AS source, data, unit_type AS type, is_omnimech, omnimech_base_chassis, omnimech_configuration, config ${mainQueryFrom}${whereClauseForMain}`;
      const validSortColumns: string[] = ['id', 'chassis', 'model', 'mass_tons', 'mass', 'tech_base', 'era', 'unit_type', 'is_omnimech', 'config', 'role'];
      let effectiveSortBy: string = sortBy as string;
      // Map 'mass' to 'mass_tons' for database compatibility
      if (effectiveSortBy === 'mass') {
        effectiveSortBy = 'mass_tons';
      }
      // Use 'id' as fallback for invalid or missing sort columns
      if (!validSortColumns.includes(effectiveSortBy) && effectiveSortBy !== 'mass_tons') {
        effectiveSortBy = 'id';
      }
      const effectiveSortOrder: string = (sortOrder as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      mainQueryString += ` ORDER BY "${effectiveSortBy}" ${effectiveSortOrder}`;

      let items: Unit[];
      const limitValue: number = parseInt(limit as string, 10) || 10;
      const pageValue: number = parseInt(page as string, 10) || 1;
      let offsetValue: number;

      if (!applyQuirkFilterLater) {
        offsetValue = (pageValue - 1) * limitValue;
        mainQueryString += ` LIMIT ? OFFSET ?`;
        queryParamsForMain.push(limitValue, offsetValue);
        mainQueryStringForLog = mainQueryString;
        finalQueryParamsForLog = queryParamsForMain;
        items = await db.all<Unit[]>(mainQueryString, queryParamsForMain);
      } else {
        mainQueryStringForLog = mainQueryString;
        finalQueryParamsForLog = queryParamsForMain;
        items = await db.all<Unit[]>(mainQueryString, queryParamsForMain);
      }

      // Process results with validation
      items = items.map(row => {
        if (row.data && typeof row.data === 'string') {
          row.data = safeJsonParse(row.data, {} as UnitData);
        }
        
        // Convert SQLite integers to proper JavaScript booleans
        // Database boundary: SQLite stores booleans as integers (1/0)
        row.is_omnimech = Boolean(Number(row.is_omnimech) === 1);
        
        // Add validation status for each unit
        try {
          // Create placeholder weights and crits objects for validation
          const weights = { total: 0 };
          const crits = { total: 0 };
          const validationResult = validateUnit(row, weights, crits);
          row.validation_status = validationResult.isValid ? 'valid' : 
            (validationResult.errors.length > 0 ? 'error' : 'warning');
          row.validation_messages = [
            ...validationResult.errors.map(e => e.message),
            ...validationResult.warnings.map(w => w.message)
          ];
        } catch (validationError) {
          row.validation_status = 'error';
          row.validation_messages = ['Validation system error'];
        }
        
        return row;
      });

      if (applyQuirkFilterLater && has_quirk) {
        const quirkSearchTerm: string = (has_quirk as string).toLowerCase();
        items = items.filter(unit => {
          const unitData = unit.data as UnitData;
          if (unitData && Array.isArray(unitData.Quirks)) {
            return unitData.Quirks.some(quirk =>
              typeof quirk.Name === 'string' && quirk.Name.toLowerCase().includes(quirkSearchTerm)
            );
          }
          return false;
        });
        totalItems = items.length;
        offsetValue = (pageValue - 1) * limitValue;
        items = items.slice(offsetValue, offsetValue + limitValue);
      }

      const totalPages: number = Math.ceil(totalItems / limitValue);

      return res.status(200).json({
        items,
        totalItems,
        totalPages,
        currentPage: pageValue,
        sortBy: effectiveSortBy === 'mass_tons' ? 'mass' : effectiveSortBy,
        sortOrder: effectiveSortOrder
      });
    }
  } catch (error: any) {
    console.error('Error fetching units from SQLite database:', error);
    if (process.env.NODE_ENV === 'development') {
       console.error('Failing Query String (approximate for SQLite):', mainQueryStringForLog);
       console.error('Query Params (approximate for SQLite):', finalQueryParamsForLog);
    }
    return res.status(500).json({
      message: 'Error fetching units',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (db) {
      await db.close();
    }
  }
}
