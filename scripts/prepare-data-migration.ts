/**
 * Data Migration Script
 * Run this BEFORE running `npm run db:push` to prepare existing data
 * 
 * This script:
 * 1. Handles NULL user_id values in presences and sales tables
 * 2. Adds store_id columns as nullable and populates them
 * 3. Ensures all required data exists before schema changes
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

async function prepareDataMigration() {
  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
  });

  try {
    console.log('🔍 Starting data migration preparation...\n');

    // Check if stores table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stores'
      ) as exists
    `;

    if (!tableCheck[0].exists) {
      console.log('ℹ️  Database tables do not exist yet.');
      console.log('✅ This is a fresh database - you can proceed directly with: npm run db:push');
      console.log('   No data migration is needed for a fresh database.\n');
      return;
    }

    // Step 1: Get or create a default store
    console.log('📦 Step 1: Ensuring default store exists...');
    let defaultStoreId: number | null = null;

    const existingStores = await sql`
      SELECT id FROM stores WHERE deleted_at IS NULL ORDER BY id LIMIT 1
    `;

    if (existingStores.length > 0) {
      defaultStoreId = existingStores[0].id;
      console.log(`✅ Found existing store with ID: ${defaultStoreId}`);
    } else {
      // Get first merchant user to create a store
      const merchant = await sql`
        SELECT id FROM users 
        WHERE role = 'merchant' AND deleted_at IS NULL 
        ORDER BY id LIMIT 1
      `;

      if (merchant.length > 0) {
        const storeResult = await sql`
          INSERT INTO stores (merchant_id, name, slug, subscription_plan, subscription_status)
          VALUES (${merchant[0].id}, 'Default Store', 'default-store', 'basic', 'active')
          RETURNING id
        `;
        defaultStoreId = storeResult[0].id;
        console.log(`✅ Created default store with ID: ${defaultStoreId}`);
      } else {
        console.log('⚠️ No merchant found. Creating platform admin store...');
        const admin = await sql`
          SELECT id FROM users 
          WHERE role = 'platform_admin' AND deleted_at IS NULL 
          ORDER BY id LIMIT 1
        `;
        
        if (admin.length > 0) {
          const storeResult = await sql`
            INSERT INTO stores (merchant_id, name, slug, subscription_plan, subscription_status)
            VALUES (${admin[0].id}, 'Default Store', 'default-store', 'basic', 'active')
            RETURNING id
          `;
          defaultStoreId = storeResult[0].id;
          console.log(`✅ Created default store with ID: ${defaultStoreId}`);
        } else {
          throw new Error('No users found to create a default store');
        }
      }
    }

    if (!defaultStoreId) {
      throw new Error('Failed to get or create default store');
    }

    // Step 2: Handle NULL user_id in presences table
    console.log('\n👥 Step 2: Handling NULL user_id in presences table...');
    
    // Check if presences table exists
    const presencesTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'presences'
      ) as exists
    `;
    
    if (presencesTableExists[0].exists) {
      const nullPresences = await sql`
        SELECT id FROM presences WHERE user_id IS NULL
      `;
    
    if (nullPresences.length > 0) {
      console.log(`⚠️ Found ${nullPresences.length} presences with NULL user_id`);
      
      // Get first active user as default
      const defaultUser = await sql`
        SELECT id FROM users WHERE deleted_at IS NULL ORDER BY id LIMIT 1
      `;
      
      if (defaultUser.length > 0) {
        await sql`
          UPDATE presences 
          SET user_id = ${defaultUser[0].id}
          WHERE user_id IS NULL
        `;
        console.log(`✅ Updated ${nullPresences.length} presences with default user_id: ${defaultUser[0].id}`);
      } else {
        // Delete presences without user_id if no users exist
        await sql`DELETE FROM presences WHERE user_id IS NULL`;
        console.log(`⚠️ Deleted ${nullPresences.length} presences with NULL user_id (no users available)`);
      }
    } else {
      console.log('✅ No NULL user_id found in presences');
    }
    } else {
      console.log('ℹ️  presences table does not exist, skipping...');
    }

    // Step 3: Handle NULL user_id in sales table
    console.log('\n💰 Step 3: Handling NULL user_id in sales table...');
    
    // Check if sales table exists
    const salesTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'sales'
      ) as exists
    `;
    
    if (salesTableExists[0].exists) {
      const nullSales = await sql`
        SELECT id FROM sales WHERE user_id IS NULL
      `;
    
    if (nullSales.length > 0) {
      console.log(`⚠️ Found ${nullSales.length} sales with NULL user_id`);
      
      // Get first active user as default
      const defaultUser = await sql`
        SELECT id FROM users WHERE deleted_at IS NULL ORDER BY id LIMIT 1
      `;
      
      if (defaultUser.length > 0) {
        await sql`
          UPDATE sales 
          SET user_id = ${defaultUser[0].id}
          WHERE user_id IS NULL
        `;
        console.log(`✅ Updated ${nullSales.length} sales with default user_id: ${defaultUser[0].id}`);
      } else {
        // Delete sales without user_id if no users exist
        await sql`DELETE FROM sales WHERE user_id IS NULL`;
        console.log(`⚠️ Deleted ${nullSales.length} sales with NULL user_id (no users available)`);
      }
    } else {
      console.log('✅ No NULL user_id found in sales');
    }
    } else {
      console.log('ℹ️  sales table does not exist, skipping...');
    }

    // Step 4: Add store_id columns as nullable (if they don't exist)
    console.log('\n🏪 Step 4: Adding store_id columns (nullable)...');
    
    const tablesToUpdate = [
      'due_payments',
      'expenses',
      'products',
      'rent_items',
      'rents',
      'presences',
      'sales',
      'salaries'
    ];

    for (const table of tablesToUpdate) {
      const columnExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${table} AND column_name = 'store_id'
      `;

      if (columnExists.length === 0) {
        await sql.unsafe(`ALTER TABLE ${table} ADD COLUMN store_id integer`);
        console.log(`✅ Added store_id column to ${table}`);
      } else {
        console.log(`ℹ️  store_id column already exists in ${table}`);
      }
    }

    // Step 5: Populate store_id with default store
    console.log('\n📝 Step 5: Populating store_id columns...');
    
    for (const table of tablesToUpdate) {
      const nullCountResult = await sql.unsafe(`
        SELECT COUNT(*)::int as count FROM ${table} WHERE store_id IS NULL
      `);
      
      const nullCount = Number(nullCountResult[0]?.count || 0);
      
      if (nullCount > 0) {
        await sql.unsafe(`
          UPDATE ${table} 
          SET store_id = ${defaultStoreId}
          WHERE store_id IS NULL
        `);
        console.log(`✅ Updated ${nullCount} rows in ${table} with default store_id`);
      } else {
        console.log(`ℹ️  All rows in ${table} already have store_id`);
      }
    }

    // Step 6: Ensure customers table has required columns
    console.log('\n👤 Step 6: Ensuring customers table has required columns...');
    
    const customerColumns = [
      { name: 'whatsapp', type: 'text' },
      { name: 'password', type: 'text NOT NULL DEFAULT \'temp_password\'' },
      { name: 'registration_status', type: 'text DEFAULT \'pending\'' },
      { name: 'balance', type: 'numeric(10, 2) DEFAULT 0' },
      { name: 'allow_credit', type: 'boolean DEFAULT false' },
      { name: 'credit_limit', type: 'numeric(10, 2) DEFAULT 0' },
      { name: 'deleted_at', type: 'timestamp' }
    ];

    for (const col of customerColumns) {
      const exists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = ${col.name}
      `;

      if (exists.length === 0) {
        await sql.unsafe(`ALTER TABLE customers ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added ${col.name} column to customers`);
      }
    }

    // Ensure phone is NOT NULL (set default for NULL values first)
    const nullPhonesResult = await sql`
      SELECT COUNT(*)::int as count FROM customers WHERE phone IS NULL
    `;
    
    const nullPhonesCount = Number(nullPhonesResult[0]?.count || 0);
    
    if (nullPhonesCount > 0) {
      await sql`
        UPDATE customers 
        SET phone = '000000000'
        WHERE phone IS NULL
      `;
      console.log(`⚠️ Updated ${nullPhonesCount} customers with NULL phone to default value`);
    }

    console.log('\n✅ Data migration preparation completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run db:push');
    console.log('   2. The schema push should now succeed without data loss warnings');
    
  } catch (error: any) {
    console.error('\n❌ Migration preparation failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly (tsx will execute this)
prepareDataMigration()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

export { prepareDataMigration };

