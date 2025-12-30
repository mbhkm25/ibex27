import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from project root (override system env vars)
// Use process.cwd() to get the project root, not __dirname (which points to out/main after build)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, override: true });
console.log('📁 Loading .env from:', envPath);
console.log('🔍 DATABASE_URL after loading:', process.env.DATABASE_URL ? 'Found' : 'NOT FOUND');
console.log('🔍 DB_ENV:', process.env.DB_ENV || 'cloud (default)');

/**
 * Get database connection string based on environment
 * Supports both local and cloud (Neon) databases
 */
function getConnectionString(): string {
  const dbEnv = process.env.DB_ENV || 'cloud';
  
  if (dbEnv === 'local') {
    // Use local database if DATABASE_URL_LOCAL is set
    const localUrl = process.env.DATABASE_URL_LOCAL;
    if (localUrl) {
      console.log('📍 Using LOCAL database');
      return localUrl;
    }
    // Fallback to DATABASE_URL if DATABASE_URL_LOCAL is not set
    console.log('⚠️ DB_ENV=local but DATABASE_URL_LOCAL not set, using DATABASE_URL');
  } else {
    console.log('☁️  Using CLOUD database (Neon)');
  }
  
  // Default to cloud database (Neon)
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
    throw new Error(
      'DATABASE_URL is not set in environment variables.\n' +
      'Please create a .env file with DATABASE_URL.\n' +
      'For local development, set DB_ENV=local and DATABASE_URL_LOCAL'
    );
  }
  
  console.log('✅ Using connection string:', connectionString.substring(0, 50) + '...');
  return connectionString;
}

// Don't call getConnectionString() at module load - call it lazily in initDatabase()
let connectionString: string | null = null;

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize database connection
 */
export function initDatabase() {
  try {
    console.log('🔌 Initializing database connection...');
    
    // Get connection string (lazy evaluation)
    if (!connectionString) {
      connectionString = getConnectionString();
    }
    
    // Determine if SSL is required (cloud databases need SSL, local usually don't)
    const isCloud = process.env.DB_ENV !== 'local' || !process.env.DATABASE_URL_LOCAL;
    const needsSSL = isCloud || connectionString.includes('sslmode=require');
    
    client = postgres(connectionString, { 
      prepare: false,
      ssl: needsSSL ? 'require' : false,
      max: 1, // Limit connections in dev
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
      max_lifetime: 60 * 30, // Maximum connection lifetime (30 minutes)
      onnotice: (notice: any) => {
        // Handle database notices and errors
        if (notice.severity === 'ERROR') {
          console.error('Database error:', notice);
        }
      },
      transform: {
        undefined: null
      }
    });

    dbInstance = drizzle(client, { schema });
    
    console.log('✅ Database connection initialized');
    return dbInstance;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    if (client) {
      await client`SELECT 1`;
      console.log('✅ Database connection test successful');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

/**
 * Get database instance (lazy initialization)
 */
export function getDb() {
  if (!dbInstance) {
    console.log('⚠️ Database not initialized, initializing now...');
    return initDatabase();
  }
  return dbInstance;
}

// Initialize database on module load
try {
  dbInstance = initDatabase();
} catch (error) {
  console.error('Failed to initialize database on module load:', error);
}

export const db = dbInstance || getDb();
