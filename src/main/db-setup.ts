import { ipcMain } from 'electron';
import postgres from 'postgres';
import { db } from './db';
import { users } from './schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables. Please create a .env file with DATABASE_URL.');
}

// Assert that connectionString is defined after the check
const dbConnectionString = connectionString!;

/**
 * Required tables for the application
 */
const REQUIRED_TABLES = [
  'currencies',
  'users',
  'stores',
  'products',
  'sales',
  'sale_items',
  'customers',
  'customer_store_relations',
  'customer_balance_requests',
  'customer_transactions',
  'store_offers',
  'expenses',
  'due_payments',
  'rent_items',
  'rents',
  'presences',
  'salaries',
  'requests',
  'drizzle_migrations', // Migration tracking table
];

/**
 * Tables that can be removed (legacy or unused)
 */
const UNUSED_TABLES = [
  'store_settings', // Can be merged into stores.settings JSONB
];

/**
 * Check database connection and tables
 */
export async function checkDatabase(): Promise<{
  connected: boolean;
  tables: string[];
  missingTables: string[];
  unusedTables: string[];
  errors: string[];
}> {
  const result = {
    connected: false,
    tables: [] as string[],
    missingTables: [] as string[],
    unusedTables: [] as string[],
    errors: [] as string[],
  };

  try {
    const sql = postgres(dbConnectionString, {
      ssl: 'require',
      max: 1,
    });

    // Test connection
    await sql`SELECT 1`;
    result.connected = true;

    // Get all tables
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    result.tables = tablesResult.map((t: any) => t.table_name);

    // Check for missing required tables
    result.missingTables = REQUIRED_TABLES.filter(
      (table) => !result.tables.includes(table)
    );

    // Check for unused tables
    result.unusedTables = result.tables.filter(
      (table) => UNUSED_TABLES.includes(table)
    );

    await sql.end();
  } catch (error: any) {
    result.errors.push(error.message || 'Unknown error');
    console.error('Database check error:', error);
  }

  return result;
}

/**
 * Clean up unused tables
 */
export async function cleanupUnusedTables(): Promise<{
  success: boolean;
  removed: string[];
  errors: string[];
}> {
  const result = {
    success: false,
    removed: [] as string[],
    errors: [] as string[],
  };

  try {
    const sql = postgres(dbConnectionString, {
      ssl: 'require',
      max: 1,
    });

    // Get unused tables that exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name = ANY(${UNUSED_TABLES})
    `;

    const tablesToRemove = tablesResult.map((t: any) => t.table_name);

    for (const table of tablesToRemove) {
      try {
        await sql.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
        result.removed.push(table);
        console.log(`✅ Removed unused table: ${table}`);
      } catch (error: any) {
        result.errors.push(`Failed to remove ${table}: ${error.message}`);
        console.error(`❌ Failed to remove table ${table}:`, error);
      }
    }

    await sql.end();
    result.success = true;
  } catch (error: any) {
    result.errors.push(error.message || 'Unknown error');
    console.error('Cleanup error:', error);
  }

  return result;
}

/**
 * Ensure admin user exists
 */
export async function ensureAdminUser(): Promise<{
  success: boolean;
  created: boolean;
  message: string;
}> {
  try {
    // Check if admin exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'admin@ibex.com'),
          eq(users.role, 'platform_admin'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (existingAdmin.length > 0) {
      return {
        success: true,
        created: false,
        message: 'حساب مدير المنصة موجود بالفعل',
      };
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      name: 'مدير النظام',
      email: 'admin@ibex.com',
      password: hashedPassword,
      role: 'platform_admin',
      status: 'active',
    });

    console.log('✅ Admin user created successfully');
    return {
      success: true,
      created: true,
      message: 'تم إنشاء حساب مدير المنصة بنجاح',
    };
  } catch (error: any) {
    console.error('Failed to create admin user:', error);
    return {
      success: false,
      created: false,
      message: `فشل إنشاء حساب المدير: ${error.message}`,
    };
  }
}

/**
 * Setup database: check, cleanup, and ensure admin
 */
export async function setupDatabase(): Promise<{
  check: Awaited<ReturnType<typeof checkDatabase>>;
  cleanup: Awaited<ReturnType<typeof cleanupUnusedTables>>;
  admin: Awaited<ReturnType<typeof ensureAdminUser>>;
}> {
  console.log('🔍 Starting database setup...');

  const check = await checkDatabase();
  console.log('📊 Database check completed:', {
    connected: check.connected,
    tablesCount: check.tables.length,
    missingTables: check.missingTables.length,
    unusedTables: check.unusedTables.length,
  });

  let cleanup: { success: boolean; removed: string[]; errors: string[]; } = { success: false, removed: [], errors: [] };
  if (check.unusedTables.length > 0) {
    console.log('🧹 Cleaning up unused tables...');
    cleanup = await cleanupUnusedTables();
  }

  console.log('👤 Ensuring admin user exists...');
  const admin = await ensureAdminUser();

  console.log('✅ Database setup completed');
  return { check, cleanup, admin };
}

/**
 * Setup IPC handlers for database management
 */
export function setupDatabaseHandlers(): void {
  ipcMain.handle('db:check', async () => {
    try {
      return await checkDatabase();
    } catch (error: any) {
      return {
        connected: false,
        tables: [],
        missingTables: [],
        unusedTables: [],
        errors: [error.message || 'Unknown error'],
      };
    }
  });

  ipcMain.handle('db:cleanup', async () => {
    try {
      return await cleanupUnusedTables();
    } catch (error: any) {
      return {
        success: false,
        removed: [],
        errors: [error.message || 'Unknown error'],
      };
    }
  });

  ipcMain.handle('db:ensure-admin', async () => {
    try {
      return await ensureAdminUser();
    } catch (error: any) {
      return {
        success: false,
        created: false,
        message: error.message || 'Unknown error',
      };
    }
  });

  ipcMain.handle('db:setup', async () => {
    try {
      return await setupDatabase();
    } catch (error: any) {
      return {
        check: {
          connected: false,
          tables: [],
          missingTables: [],
          unusedTables: [],
          errors: [error.message || 'Unknown error'],
        },
        cleanup: {
          success: false,
          removed: [],
          errors: [],
        },
        admin: {
          success: false,
          created: false,
          message: error.message || 'Unknown error',
        },
      };
    }
  });
}

