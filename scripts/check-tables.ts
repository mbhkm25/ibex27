/**
 * Script to check what tables actually exist in the database
 * Supports both cloud and local databases based on DB_ENV
 */

/// <reference types="node" />
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get connection string based on DB_ENV
const dbEnv = process.env.DB_ENV || 'cloud';
let connectionString: string | undefined;

if (dbEnv === 'local' && process.env.DATABASE_URL_LOCAL) {
  console.log('📍 Using LOCAL database');
  connectionString = process.env.DATABASE_URL_LOCAL;
} else {
  console.log('☁️  Using CLOUD database (Neon)');
  connectionString = process.env.DATABASE_URL;
}

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables.');
  console.error('   Please create a .env file with DATABASE_URL.');
  process.exit(1);
}

async function checkTables() {
  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
  });

  try {
    const envLabel = dbEnv === 'local' ? 'المحلية' : 'Neon';
    console.log(`🔍 فحص الجداول الموجودة في قاعدة بيانات ${envLabel}...\n`);

    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('ℹ️  لا توجد جداول في قاعدة البيانات');
      console.log('✅ قاعدة البيانات فارغة - يمكنك المتابعة مع npm run db:push\n');
    } else {
      console.log(`📊 عدد الجداول: ${tables.length}\n`);
      console.log('📋 الجداول الموجودة:');
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('');

      // Check for data in key tables
      const keyTables = ['users', 'stores', 'products', 'sales', 'customers', 'presences'];
      console.log('📊 فحص البيانات في الجداول المهمة:\n');
      
      for (const tableName of keyTables) {
        const exists = tables.some((t: any) => t.table_name === tableName);
        if (exists) {
          try {
            const count = await sql.unsafe(`SELECT COUNT(*)::int as count FROM ${tableName}`);
            console.log(`   ${tableName}: ${count[0]?.count || 0} صف`);
          } catch (error: any) {
            console.log(`   ${tableName}: خطأ في القراءة`);
          }
        }
      }
    }

  } catch (error: any) {
    console.error('❌ خطأ في الاتصال:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

