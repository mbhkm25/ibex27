/**
 * Quick script to check if there's important data in the database
 */

/// <reference types="node" />
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables.');
  console.error('   Please create a .env file with DATABASE_URL.');
  process.exit(1);
}

async function checkData() {
  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
  });

  try {
    console.log('🔍 فحص البيانات الموجودة...\n');

    const tables = ['presences', 'sales', 'products'];
    
    for (const table of tables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = ${table}
        ) as exists
      `;

      if (exists[0].exists) {
        const count = await sql.unsafe(`SELECT COUNT(*)::int as count FROM ${table}`);
        const nullUser = table === 'presences' || table === 'sales' 
          ? await sql.unsafe(`SELECT COUNT(*)::int as count FROM ${table} WHERE user_id IS NULL`)
          : { count: 0 };
        const nullStore = table === 'products'
          ? await sql.unsafe(`SELECT COUNT(*)::int as count FROM ${table} WHERE store_id IS NULL`)
          : { count: 0 };

        console.log(`📊 ${table}:`);
        console.log(`   - إجمالي الصفوف: ${count[0]?.count || 0}`);
        if (nullUser[0]?.count > 0) {
          console.log(`   - صفوف بقيم NULL في user_id: ${nullUser[0].count}`);
        }
        if (nullStore[0]?.count > 0) {
          console.log(`   - صفوف بقيم NULL في store_id: ${nullStore[0].count}`);
        }
        console.log('');
      } else {
        console.log(`ℹ️  ${table}: الجدول غير موجود\n`);
      }
    }

  } catch (error: any) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sql.end();
  }
}

checkData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

