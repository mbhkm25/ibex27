/**
 * Script to apply schema changes directly to database without interactive prompts
 * This script executes all SQL statements from drizzle-kit push output
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

async function applySchema() {
  const sql = postgres(connectionString!, {
    ssl: dbEnv === 'local' ? false : 'require',
    max: 1
  });

  try {
    console.log('🚀 بدء تطبيق التغييرات على قاعدة البيانات...\n');

    // Step 1: Create new tables
    console.log('📦 إنشاء الجداول الجديدة...');
    
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "store_id" integer,
        "user_id" integer NOT NULL,
        "action" text NOT NULL,
        "entity_type" text NOT NULL,
        "entity_id" integer,
        "description" text,
        "old_value" jsonb,
        "new_value" jsonb,
        "metadata" jsonb,
        "ip_address" text,
        "user_agent" text,
        "created_at" timestamp DEFAULT now()
      )
    `);
    console.log('✅ تم إنشاء جدول audit_logs');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "currencies" (
        "id" text PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "symbol" text NOT NULL,
        "name" text NOT NULL,
        "exchange_rate" numeric(10, 4) DEFAULT '1.0',
        "created_at" timestamp DEFAULT now(),
        "deleted_at" timestamp
      )
    `);
    console.log('✅ تم إنشاء جدول currencies');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "customer_balance_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "customer_id" integer NOT NULL,
        "store_id" integer NOT NULL,
        "bank" text NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "reference_number" text NOT NULL,
        "status" text DEFAULT 'pending',
        "approved_by" integer,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now(),
        "approved_at" timestamp
      )
    `);
    console.log('✅ تم إنشاء جدول customer_balance_requests');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "customer_order_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "price" numeric(10, 2) NOT NULL,
        "total" numeric(10, 2) NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `);
    console.log('✅ تم إنشاء جدول customer_order_items');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "customer_orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "customer_id" integer NOT NULL,
        "store_id" integer NOT NULL,
        "total" numeric(10, 2) NOT NULL,
        "status" text DEFAULT 'pending',
        "notes" text,
        "merchant_notes" text,
        "approved_by" integer,
        "created_at" timestamp DEFAULT now(),
        "approved_at" timestamp,
        "completed_at" timestamp,
        "deleted_at" timestamp
      )
    `);
    console.log('✅ تم إنشاء جدول customer_orders');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "customer_store_relations" (
        "id" serial PRIMARY KEY NOT NULL,
        "customer_id" integer NOT NULL,
        "store_id" integer NOT NULL,
        "balance" numeric(10, 2) DEFAULT '0',
        "status" text DEFAULT 'active',
        "registered_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now()
      )
    `);
    console.log('✅ تم إنشاء جدول customer_store_relations');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "customer_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "customer_id" integer NOT NULL,
        "store_id" integer NOT NULL,
        "type" text NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "reference" text,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now()
      )
    `);
    console.log('✅ تم إنشاء جدول customer_transactions');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "purchase_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "purchase_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "cost" numeric(10, 2) NOT NULL,
        "total" numeric(10, 2) NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `);
    console.log('✅ تم إنشاء جدول purchase_items');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "purchases" (
        "id" serial PRIMARY KEY NOT NULL,
        "store_id" integer NOT NULL,
        "supplier_id" integer,
        "total" numeric(10, 2) NOT NULL,
        "payment_type" text DEFAULT 'cash',
        "purchase_date" timestamp DEFAULT now(),
        "due_date" timestamp,
        "invoice_number" text,
        "notes" text,
        "user_id" integer,
        "created_at" timestamp DEFAULT now(),
        "deleted_at" timestamp
      )
    `);
    console.log('✅ تم إنشاء جدول purchases');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "store_offers" (
        "id" serial PRIMARY KEY NOT NULL,
        "store_id" integer NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "image_url" text,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp NOT NULL,
        "active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "deleted_at" timestamp
      )
    `);
    console.log('✅ تم إنشاء جدول store_offers');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "store_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "phone" text,
        "footer" text,
        "sub_footer" text,
        "deleted_at" timestamp
      )
    `);
    console.log('✅ تم إنشاء جدول store_settings');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "stores" (
        "id" serial PRIMARY KEY NOT NULL,
        "merchant_id" integer NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "phone" text,
        "subscription_plan" text DEFAULT 'basic',
        "subscription_status" text DEFAULT 'pending',
        "subscription_expiry" timestamp,
        "bank_accounts" jsonb DEFAULT '[]'::jsonb,
        "contact_info" jsonb DEFAULT '{}'::jsonb,
        "settings" jsonb DEFAULT '{}'::jsonb,
        "currency_id" text,
        "created_at" timestamp DEFAULT now(),
        "deleted_at" timestamp,
        CONSTRAINT "stores_slug_unique" UNIQUE("slug")
      )
    `);
    console.log('✅ تم إنشاء جدول stores');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" serial PRIMARY KEY NOT NULL,
        "store_id" integer NOT NULL,
        "name" text NOT NULL,
        "phone" text,
        "email" text,
        "address" text,
        "contact_person" text,
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "deleted_at" timestamp
      )
    `);
    console.log('✅ تم إنشاء جدول suppliers');

    console.log('\n📝 تعديل الجداول الموجودة...');

    // Step 2: Drop old constraints
    try {
      await sql.unsafe(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_barcode_unique"`);
      await sql.unsafe(`ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_user_id_users_id_fk"`);
      await sql.unsafe(`ALTER TABLE "salaries" DROP CONSTRAINT IF EXISTS "salaries_user_id_users_id_fk"`);
      await sql.unsafe(`ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "sale_items_sale_id_sales_id_fk"`);
      await sql.unsafe(`ALTER TABLE "presences" DROP CONSTRAINT IF EXISTS "presences_user_id_users_id_fk"`);
      console.log('✅ تم حذف القيود القديمة');
    } catch (e) {
      // Ignore errors if constraints don't exist
    }

    // Step 3: Alter existing tables
    try {
      await sql.unsafe(`ALTER TABLE "customers" ALTER COLUMN "phone" SET NOT NULL`);
    } catch (e) {
      // Column might already be NOT NULL
    }

    // Add new columns to customers
    const customerColumns = [
      { name: 'whatsapp', type: 'text' },
      { name: 'password', type: 'text NOT NULL', defaultValue: "''" },
      { name: 'registration_status', type: "text DEFAULT 'pending'" },
      { name: 'balance', type: "numeric(10, 2) DEFAULT '0'" },
      { name: 'allow_credit', type: 'boolean DEFAULT false' },
      { name: 'credit_limit', type: "numeric(10, 2) DEFAULT '0'" },
      { name: 'deleted_at', type: 'timestamp' }
    ];

    for (const col of customerColumns) {
      try {
        const exists = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'customers' AND column_name = ${col.name}
        `;
        if (exists.length === 0) {
          await sql.unsafe(`ALTER TABLE "customers" ADD COLUMN "${col.name}" ${col.type}`);
          console.log(`✅ تم إضافة عمود ${col.name} إلى customers`);
        }
      } catch (e: any) {
        console.log(`⚠️  خطأ في إضافة ${col.name}: ${e.message}`);
      }
    }

    // Add columns to other tables
    const tableModifications = [
      { table: 'due_payments', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' },
        { name: 'customer_id', type: 'integer' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'expenses', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'products', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' },
        { name: 'show_in_portal', type: 'boolean DEFAULT true' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'rent_items', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'rents', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'requests', columns: [
        { name: 'store_id', type: 'integer' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'sales', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' },
        { name: 'customer_id', type: 'integer' },
        { name: 'currency_id', type: 'text' },
        { name: 'exchange_rate', type: 'numeric(10, 4)' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'users', columns: [
        { name: 'store_id', type: 'integer' },
        { name: 'status', type: "text DEFAULT 'active'" },
        { name: 'subscription_status', type: 'text' },
        { name: 'subscription_expiry', type: 'timestamp' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'salaries', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' },
        { name: 'deleted_at', type: 'timestamp' }
      ]},
      { table: 'presences', columns: [
        { name: 'store_id', type: 'integer NOT NULL', defaultValue: '1' }
      ]}
    ];

    for (const { table, columns } of tableModifications) {
      for (const col of columns) {
        try {
          const exists = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = ${table} AND column_name = ${col.name}
          `;
          if (exists.length === 0) {
            if (col.defaultValue && col.type.includes('NOT NULL')) {
              // Add column with default value first, then set NOT NULL
              await sql.unsafe(`ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.type.replace(' NOT NULL', '')} DEFAULT ${col.defaultValue}`);
              await sql.unsafe(`ALTER TABLE "${table}" ALTER COLUMN "${col.name}" SET NOT NULL`);
            } else {
              await sql.unsafe(`ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.type}`);
            }
            console.log(`✅ تم إضافة عمود ${col.name} إلى ${table}`);
          }
        } catch (e: any) {
          console.log(`⚠️  خطأ في إضافة ${col.name} إلى ${table}: ${e.message}`);
        }
      }
    }

    // Set NOT NULL constraints
    try {
      await sql.unsafe(`ALTER TABLE "sales" ALTER COLUMN "user_id" SET NOT NULL`);
      await sql.unsafe(`ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL`);
      await sql.unsafe(`ALTER TABLE "salaries" ALTER COLUMN "user_id" SET NOT NULL`);
      await sql.unsafe(`ALTER TABLE "presences" ALTER COLUMN "user_id" SET NOT NULL`);
      console.log('✅ تم تطبيق قيود NOT NULL');
    } catch (e: any) {
      console.log(`⚠️  تحذير في تطبيق NOT NULL: ${e.message}`);
    }

    console.log('\n🔗 إضافة العلاقات (Foreign Keys)...');

    // Step 4: Add foreign key constraints
    const foreignKeys = [
      { table: 'due_payments', constraint: 'due_payments_store_id_stores_id_fk', sql: 'ALTER TABLE "due_payments" ADD CONSTRAINT "due_payments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'due_payments', constraint: 'due_payments_customer_id_customers_id_fk', sql: 'ALTER TABLE "due_payments" ADD CONSTRAINT "due_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'expenses', constraint: 'expenses_store_id_stores_id_fk', sql: 'ALTER TABLE "expenses" ADD CONSTRAINT "expenses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'products', constraint: 'products_store_id_stores_id_fk', sql: 'ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'rent_items', constraint: 'rent_items_store_id_stores_id_fk', sql: 'ALTER TABLE "rent_items" ADD CONSTRAINT "rent_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'rents', constraint: 'rents_store_id_stores_id_fk', sql: 'ALTER TABLE "rents" ADD CONSTRAINT "rents_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'requests', constraint: 'requests_store_id_stores_id_fk', sql: 'ALTER TABLE "requests" ADD CONSTRAINT "requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'sales', constraint: 'sales_store_id_stores_id_fk', sql: 'ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'sales', constraint: 'sales_customer_id_customers_id_fk', sql: 'ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'sales', constraint: 'sales_currency_id_currencies_id_fk', sql: 'ALTER TABLE "sales" ADD CONSTRAINT "sales_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'sales', constraint: 'sales_user_id_users_id_fk', sql: 'ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'salaries', constraint: 'salaries_store_id_stores_id_fk', sql: 'ALTER TABLE "salaries" ADD CONSTRAINT "salaries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'salaries', constraint: 'salaries_user_id_users_id_fk', sql: 'ALTER TABLE "salaries" ADD CONSTRAINT "salaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'sale_items', constraint: 'sale_items_sale_id_sales_id_fk', sql: 'ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'presences', constraint: 'presences_store_id_stores_id_fk', sql: 'ALTER TABLE "presences" ADD CONSTRAINT "presences_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'presences', constraint: 'presences_user_id_users_id_fk', sql: 'ALTER TABLE "presences" ADD CONSTRAINT "presences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'audit_logs', constraint: 'audit_logs_store_id_stores_id_fk', sql: 'ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'audit_logs', constraint: 'audit_logs_user_id_users_id_fk', sql: 'ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_balance_requests', constraint: 'customer_balance_requests_customer_id_customers_id_fk', sql: 'ALTER TABLE "customer_balance_requests" ADD CONSTRAINT "customer_balance_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_balance_requests', constraint: 'customer_balance_requests_store_id_stores_id_fk', sql: 'ALTER TABLE "customer_balance_requests" ADD CONSTRAINT "customer_balance_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_balance_requests', constraint: 'customer_balance_requests_approved_by_users_id_fk', sql: 'ALTER TABLE "customer_balance_requests" ADD CONSTRAINT "customer_balance_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_order_items', constraint: 'customer_order_items_order_id_customer_orders_id_fk', sql: 'ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "customer_orders"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_order_items', constraint: 'customer_order_items_product_id_products_id_fk', sql: 'ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_orders', constraint: 'customer_orders_customer_id_customers_id_fk', sql: 'ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_orders', constraint: 'customer_orders_store_id_stores_id_fk', sql: 'ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_orders', constraint: 'customer_orders_approved_by_users_id_fk', sql: 'ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_store_relations', constraint: 'customer_store_relations_customer_id_customers_id_fk', sql: 'ALTER TABLE "customer_store_relations" ADD CONSTRAINT "customer_store_relations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_store_relations', constraint: 'customer_store_relations_store_id_stores_id_fk', sql: 'ALTER TABLE "customer_store_relations" ADD CONSTRAINT "customer_store_relations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_transactions', constraint: 'customer_transactions_customer_id_customers_id_fk', sql: 'ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'customer_transactions', constraint: 'customer_transactions_store_id_stores_id_fk', sql: 'ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'purchase_items', constraint: 'purchase_items_purchase_id_purchases_id_fk', sql: 'ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'purchase_items', constraint: 'purchase_items_product_id_products_id_fk', sql: 'ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'purchases', constraint: 'purchases_store_id_stores_id_fk', sql: 'ALTER TABLE "purchases" ADD CONSTRAINT "purchases_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'purchases', constraint: 'purchases_supplier_id_suppliers_id_fk', sql: 'ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'purchases', constraint: 'purchases_user_id_users_id_fk', sql: 'ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'store_offers', constraint: 'store_offers_store_id_stores_id_fk', sql: 'ALTER TABLE "store_offers" ADD CONSTRAINT "store_offers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'stores', constraint: 'stores_merchant_id_users_id_fk', sql: 'ALTER TABLE "stores" ADD CONSTRAINT "stores_merchant_id_users_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'stores', constraint: 'stores_currency_id_currencies_id_fk', sql: 'ALTER TABLE "stores" ADD CONSTRAINT "stores_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE no action ON UPDATE no action' },
      { table: 'suppliers', constraint: 'suppliers_store_id_stores_id_fk', sql: 'ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE no action ON UPDATE no action' }
    ];

    for (const { table, constraint, sql: sqlStatement } of foreignKeys) {
      try {
        await sql.unsafe(`
          DO $$ BEGIN
            ${sqlStatement};
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        console.log(`✅ تم إضافة علاقة ${constraint}`);
      } catch (e: any) {
        // Ignore duplicate constraint errors
        if (!e.message.includes('duplicate') && !e.message.includes('already exists')) {
          console.log(`⚠️  تحذير في ${constraint}: ${e.message}`);
        }
      }
    }

    console.log('\n✅ تم تطبيق جميع التغييرات بنجاح!');

  } catch (error: any) {
    console.error('\n❌ خطأ في تطبيق التغييرات:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

applySchema()
  .then(() => {
    console.log('\n🎉 اكتمل التحديث بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل التحديث:', error);
    process.exit(1);
  });

