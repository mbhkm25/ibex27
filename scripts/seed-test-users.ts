/**
 * Script to seed test users in the cloud database
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { users, stores, customers, customerStoreRelations } from '../src/main/schema';
import bcrypt from 'bcryptjs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

async function seedTestUsers() {
  console.log('🌱 Seeding test users in cloud database...\n');

  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
  });

  const db = drizzle(sql);

  try {
    // 1. Seed Admin
    console.log('1️⃣ Creating Admin (admin@ibex.com)...');
    try {
      // Check if admin exists (including deleted ones)
      const existingAdmin = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, 'admin@ibex.com'),
            eq(users.role, 'platform_admin')
          )
        )
        .limit(1);

      if (existingAdmin.length === 0) {
        // Create new admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.insert(users).values({
          name: 'مدير النظام',
          email: 'admin@ibex.com',
          password: hashedPassword,
          role: 'platform_admin',
          status: 'active',
        });
        console.log('   ✅ Admin created');
      } else if (existingAdmin[0].deletedAt) {
        // Admin exists but is deleted, restore it
        await db.update(users)
          .set({ 
            deletedAt: null,
            status: 'active'
          })
          .where(eq(users.id, existingAdmin[0].id));
        console.log('   ✅ Admin restored');
      } else {
        console.log('   ℹ️  Admin already exists');
      }
    } catch (error: any) {
      if (error.code === '23505') {
        console.log('   ℹ️  Admin already exists (duplicate key)');
      } else {
        console.error('   ❌ Error:', error.message);
      }
    }

    // 2. Seed Merchant
    console.log('\n2️⃣ Creating Merchant (merchant@example.com)...');
    const existingMerchant = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'merchant@example.com'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    let merchantId: number | undefined;

    if (existingMerchant.length === 0) {
      const hashedPassword = await bcrypt.hash('merchant123', 10);
      const newMerchant = await db.insert(users).values({
        name: 'تاجر تجريبي',
        email: 'merchant@example.com',
        password: hashedPassword,
        role: 'merchant',
        status: 'active',
      }).returning();
      merchantId = newMerchant[0].id;
      console.log('   ✅ Merchant created (ID:', merchantId, ')');
    } else {
      merchantId = existingMerchant[0].id;
      console.log('   ℹ️  Merchant already exists (ID:', merchantId, ')');
    }

    // 3. Create a test store if needed
    console.log('\n3️⃣ Checking/Creating test store...');
    const existingStore = await db.select().from(stores).limit(1);
    let storeId: number | undefined;

    if (existingStore.length === 0 && merchantId) {
      const newStore = await db.insert(stores).values({
        name: 'متجر تجريبي',
        slug: 'test-store',
        merchantId: merchantId,
      }).returning();
      storeId = newStore[0].id;
      console.log('   ✅ Test store created (ID:', storeId, ')');
    } else if (existingStore.length > 0) {
      storeId = existingStore[0].id;
      console.log('   ℹ️  Store already exists (ID:', storeId, ')');
    }

    // 4. Seed Cashier
    console.log('\n4️⃣ Creating Cashier (cashier@example.com)...');
    const existingCashier = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'cashier@example.com'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (existingCashier.length === 0) {
      if (!storeId) {
        console.log('   ⚠️  No store found, creating one...');
        if (merchantId) {
          const newStore = await db.insert(stores).values({
            name: 'متجر تجريبي',
            slug: 'test-store',
            merchantId: merchantId,
          }).returning();
          storeId = newStore[0].id;
        } else {
          console.log('   ❌ Cannot create cashier: No merchant or store found');
        }
      }

      if (storeId) {
        const hashedPassword = await bcrypt.hash('cashier123', 10);
        await db.insert(users).values({
          name: 'كاشير تجريبي',
          email: 'cashier@example.com',
          password: hashedPassword,
          role: 'cashier',
          storeId: storeId,
          status: 'active',
        });
        console.log('   ✅ Cashier created (Store ID:', storeId, ')');
      }
    } else {
      console.log('   ℹ️  Cashier already exists');
    }

    // 5. Seed Customer
    console.log('\n5️⃣ Creating Customer (phone: 771234567)...');
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.phone, '771234567'),
          isNull(customers.deletedAt)
        )
      )
      .limit(1);

    if (existingCustomer.length === 0) {
      const hashedPassword = await bcrypt.hash('customer123', 10);
      const newCustomer = await db.insert(customers).values({
        name: 'عميل تجريبي',
        phone: '771234567',
        password: hashedPassword,
        registrationStatus: 'approved',
        status: true,
      }).returning();

      // Link customer to store
      if (storeId) {
        await db.insert(customerStoreRelations).values({
          customerId: newCustomer[0].id,
          storeId: storeId,
          status: 'active',
        });
        console.log('   ✅ Customer created and linked to store (ID:', newCustomer[0].id, ')');
      } else {
        console.log('   ✅ Customer created (ID:', newCustomer[0].id, ') - No store to link');
      }
    } else {
      console.log('   ℹ️  Customer already exists');
    }

    console.log('\n✅ Seeding completed!');
    console.log('\n📋 Test Users Credentials:');
    console.log('   👑 Admin:    admin@ibex.com / admin123');
    console.log('   🏪 Merchant: merchant@example.com / merchant123');
    console.log('   💰 Cashier:  cashier@example.com / cashier123');
    console.log('   👤 Customer: 771234567 / customer123');

  } catch (error: any) {
    console.error('❌ Error seeding users:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

seedTestUsers();

