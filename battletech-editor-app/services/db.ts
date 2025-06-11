// Database service to provide consistent access to the SQLite database
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { logApiError } from './errorLogger';

// Define the path to the SQLite database file
// Check if we're running in Docker (environment variable) or use local development path
const SQLITE_DB_FILE = process.env.DB_PATH || 
  (process.env.NODE_ENV === 'production' 
    ? path.resolve('/usr/src/app', 'battletech_dev.sqlite')
    : path.resolve(process.cwd(), 'data', 'battletech_dev.sqlite'));

/**
 * Opens a connection to the SQLite database
 * @param readOnly - Whether to open the database in read-only mode
 * @returns A Promise that resolves to a Database instance
 */
export async function openDatabase(readOnly = false): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  const options: { 
    filename: string;
    driver: any;
    mode?: number;
  } = {
    filename: SQLITE_DB_FILE,
    driver: sqlite3.Database
  };

  if (readOnly) {
    options.mode = sqlite3.OPEN_READONLY;
  }
  try {
    const db = await open(options);
      // Enable foreign keys constraint enforcement
    await db.exec('PRAGMA foreign_keys = ON;');
    
    // Check for JSON function support
    try {
      await db.get("SELECT json_extract('{}', '$')");
    } catch (err) {
      console.warn('SQLite JSON functions might not be fully supported in this version');
    }
    
    return db;
  } catch (error) {
    logApiError('Database connection', error, { database: SQLITE_DB_FILE });
    throw error;
  }
}

/**
 * Helper function to safely parse JSON from a database field
 * @param jsonString - The JSON string to parse
 * @param defaultValue - The default value to return if parsing fails
 * @returns The parsed JSON object or the default value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logApiError('JSON parsing', error, { invalidJson: jsonString });
    return defaultValue;
  }
}
