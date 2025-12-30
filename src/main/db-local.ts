/**
 * Local SQLite Database Connection
 * Used for offline cashier operations
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as schema from './schema-local';

// Database file path (in user data directory)
const getUserDataPath = () => {
  if (process.env.APP_DATA_PATH) {
    return process.env.APP_DATA_PATH;
  }
  // Default to app directory for development
  const appPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, { recursive: true });
  }
  return appPath;
};

const dbPath = path.join(getUserDataPath(), 'cashier.db');

let sqliteDb: Database.Database | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize SQLite database connection
 */
export function initLocalDatabase(): ReturnType<typeof drizzle> {
  try {
    console.log('🔌 Initializing local SQLite database...');
    console.log('📁 Database path:', dbPath);

    // Create database file if it doesn't exist
    sqliteDb = new Database(dbPath);
    
    // Enable foreign keys
    sqliteDb.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    sqliteDb.pragma('journal_mode = WAL');

    dbInstance = drizzle(sqliteDb, { schema });

    // Create tables if they don't exist
    createTables();

    console.log('✅ Local database initialized');
    return dbInstance;
  } catch (error) {
    console.error('❌ Failed to initialize local database:', error);
    throw error;
  }
}

/**
 * Create tables in SQLite database
 */
function createTables() {
  if (!sqliteDb) return;

  try {
    // Categories table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER,
        deleted_at INTEGER,
        synced_at INTEGER,
        cloud_id INTEGER
      )
    `);

    // Products table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        barcode TEXT,
        price REAL NOT NULL,
        cost REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        category_id INTEGER,
        category TEXT,
        show_in_portal INTEGER DEFAULT 1,
        created_at INTEGER,
        deleted_at INTEGER,
        synced_at INTEGER,
        cloud_id INTEGER
      )
    `);

    // Sales table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        customer_id INTEGER,
        total REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        user_id INTEGER NOT NULL,
        currency_id TEXT,
        exchange_rate REAL,
        created_at INTEGER NOT NULL,
        deleted_at INTEGER,
        synced_at INTEGER,
        cloud_id INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )
    `);

    // Sale items table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      )
    `);

    // Customers table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        whatsapp TEXT,
        password TEXT NOT NULL,
        registration_status TEXT DEFAULT 'pending',
        balance REAL DEFAULT 0,
        allow_credit INTEGER DEFAULT 0,
        credit_limit REAL DEFAULT 0,
        ktp TEXT,
        dob INTEGER,
        notes TEXT,
        status INTEGER DEFAULT 1,
        created_at INTEGER,
        deleted_at INTEGER,
        synced_at INTEGER,
        cloud_id INTEGER
      )
    `);

    // Sync queue table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        operation TEXT NOT NULL,
        data TEXT,
        status TEXT DEFAULT 'pending',
        error TEXT,
        created_at INTEGER NOT NULL,
        synced_at INTEGER,
        retry_count INTEGER DEFAULT 0
      )
    `);

    // Store info table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS store_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        settings TEXT,
        last_sync_at INTEGER,
        updated_at INTEGER
      )
    `);

    // Create indexes for better performance
    sqliteDb.exec(`
      CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
      CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON sales(sync_status);
      CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `);

    console.log('✅ Local database tables created');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

/**
 * Get local database instance
 */
export function getLocalDb() {
  if (!dbInstance) {
    return initLocalDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeLocalDatabase() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    dbInstance = null;
    console.log('✅ Local database connection closed');
  }
}

/**
 * Get database file path
 */
export function getLocalDbPath(): string {
  return dbPath;
}

// Initialize on module load
try {
  dbInstance = initLocalDatabase();
} catch (error) {
  console.error('Failed to initialize local database on module load:', error);
}

export const localDb = dbInstance || getLocalDb();

