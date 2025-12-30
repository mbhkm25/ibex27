import { ipcMain } from 'electron';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connection string for migrations (same as db.ts)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables. Please create a .env file with DATABASE_URL.');
}

/**
 * Run database migrations from SQL files
 * This should be called on app startup
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('Running database migrations...');
    
    // Get the migrations directory path
    const migrationsFolder = process.env.NODE_ENV === 'production' 
      ? join(__dirname, '../../drizzle')
      : join(__dirname, '../../../drizzle');

    if (!existsSync(migrationsFolder)) {
      console.log('⚠️ Migrations folder not found, skipping migrations');
      return;
    }

    // Get all SQL migration files
    const files = readdirSync(migrationsFolder)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to run in order

    if (files.length === 0) {
      console.log('⚠️ No migration files found');
      return;
    }

    // Create a temporary connection for migrations
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    const sql = postgres(connectionString, { 
      ssl: 'require',
      max: 1 
    });

    // Create migrations table to track applied migrations
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Get already applied migrations
    const appliedMigrations = await sql`
      SELECT name FROM drizzle_migrations
    `;
    const appliedNames = new Set(appliedMigrations.map((m: any) => m.name));

    // Run each migration
    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`⏭️  Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`📦 Applying migration: ${file}`);
      const migrationPath = join(migrationsFolder, file);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');

      // Split by statement breakpoint and execute each statement
      const statements = migrationSQL
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await sql.unsafe(statement);
        }
      }

      // Record migration as applied
      await sql`
        INSERT INTO drizzle_migrations (name) VALUES (${file})
      `;

      console.log(`✅ Applied migration: ${file}`);
    }

    // Check and add missing columns BEFORE ending connection
    await ensureUsersTableColumns(sql);

    await sql.end();
    console.log('✅ All migrations completed successfully');
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    // Don't throw - allow app to continue even if migrations fail
    // This is important for development when schema might not match
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Ensure users table has all required columns
 * This is a safety check for existing databases
 */
async function ensureUsersTableColumns(sql: any): Promise<void> {
  try {
    console.log('🔍 Checking users table columns...');
    
    // Check if store_id column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'store_id'
    `;
    
    if (columnCheck.length === 0) {
      console.log('➕ Adding store_id column to users table...');
      try {
        await sql.unsafe('ALTER TABLE users ADD COLUMN store_id integer');
        console.log('✅ Added store_id column');
      } catch (alterError: any) {
        // If column already exists (race condition), ignore error
        if (alterError.message && alterError.message.includes('already exists')) {
          console.log('ℹ️ store_id column already exists');
        } else {
          console.error('Error adding store_id column:', alterError);
          throw alterError;
        }
      }
    } else {
      console.log('✅ store_id column already exists');
    }

    // Check if status column exists
    const statusCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'status'
    `;
    
    if (statusCheck.length === 0) {
      console.log('➕ Adding status column to users table...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
      `;
      console.log('✅ Added status column');
    }

    // Check if subscription_status column exists
    const subscriptionStatusCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'subscription_status'
    `;
    
    if (subscriptionStatusCheck.length === 0) {
      console.log('➕ Adding subscription_status column to users table...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS subscription_status text
      `;
      console.log('✅ Added subscription_status column');
    }

    // Check if subscription_expiry column exists
    const subscriptionExpiryCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'subscription_expiry'
    `;
    
    if (subscriptionExpiryCheck.length === 0) {
      console.log('➕ Adding subscription_expiry column to users table...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS subscription_expiry timestamp
      `;
      console.log('✅ Added subscription_expiry column');
    }

    // Check if created_at column exists
    const createdAtCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'created_at'
    `;
    
    if (createdAtCheck.length === 0) {
      console.log('➕ Adding created_at column to users table...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()
      `;
      console.log('✅ Added created_at column');
    }

    // Check if deleted_at column exists
    const deletedAtCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'deleted_at'
    `;
    
    if (deletedAtCheck.length === 0) {
      console.log('➕ Adding deleted_at column to users table...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS deleted_at timestamp
      `;
      console.log('✅ Added deleted_at column');
    }

    console.log('✅ Users table columns check completed');
  } catch (error: any) {
    console.error('⚠️ Error checking users table columns:', error);
    // Don't throw - this is a safety check
  }
}

/**
 * Setup IPC handlers for migrations
 */
export function setupMigrationsHandlers(): void {
  ipcMain.handle('migrations:run', async () => {
    try {
      await runMigrations();
      return { success: true, message: 'تم تطبيق التحديثات بنجاح' };
    } catch (error: any) {
      console.error('Migration error:', error);
      return { success: false, message: error.message || 'فشل تطبيق التحديثات' };
    }
  });
}

