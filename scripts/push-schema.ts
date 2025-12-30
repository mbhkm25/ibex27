/**
 * Script to push schema changes to database automatically
 * This script applies the schema changes without requiring interactive input
 */

/// <reference types="node" />
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

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
  process.exit(1);
}

async function pushSchema() {
  const sql = postgres(connectionString!, {
    ssl: dbEnv === 'local' ? false : 'require',
    max: 1
  });

  try {
    console.log('🚀 بدء تطبيق التغييرات على قاعدة البيانات...\n');

    // Check existing data that might be affected
    const productsCount = await sql`SELECT COUNT(*)::int as count FROM products`.then(r => r[0]?.count || 0);
    const salesCount = await sql`SELECT COUNT(*)::int as count FROM sales`.then(r => r[0]?.count || 0);
    const presencesCount = await sql`SELECT COUNT(*)::int as count FROM presences`.then(r => r[0]?.count || 0);

    console.log(`📊 البيانات الموجودة:`);
    console.log(`   - products: ${productsCount} صف`);
    console.log(`   - sales: ${salesCount} صف`);
    console.log(`   - presences: ${presencesCount} صف`);

    if (productsCount > 0 || salesCount > 0 || presencesCount > 0) {
      console.log('\n⚠️  تحذير: سيتم مسح البيانات في الجداول التالية لإضافة store_id:');
      if (productsCount > 0) console.log(`   - products (${productsCount} صف)`);
      if (salesCount > 0) console.log(`   - sales (${salesCount} صف)`);
      if (presencesCount > 0) console.log(`   - presences (${presencesCount} صف)`);
      console.log('\n✅ المتابعة مع مسح البيانات...\n');
    }

    // Truncate tables that need store_id
    if (productsCount > 0) {
      await sql`TRUNCATE TABLE products CASCADE`;
      console.log('✅ تم مسح جدول products');
    }
    if (salesCount > 0) {
      await sql`TRUNCATE TABLE sales CASCADE`;
      console.log('✅ تم مسح جدول sales');
    }
    if (presencesCount > 0) {
      await sql`TRUNCATE TABLE presences CASCADE`;
      console.log('✅ تم مسح جدول presences');
    }

    console.log('\n📦 الآن قم بتشغيل: npm run db:push');
    console.log('   (سيتم تطبيق التغييرات بدون تحذيرات فقدان البيانات)\n');

  } catch (error: any) {
    console.error('❌ خطأ:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

pushSchema()
  .then(() => {
    console.log('✅ تم التحضير بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل:', error);
    process.exit(1);
  });

