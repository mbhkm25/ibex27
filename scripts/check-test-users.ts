/**
 * Script to check if test users exist in the cloud database
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { users, customers } from '../src/main/schema';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

async function checkTestUsers() {
  console.log('🔍 Checking test users in cloud database...\n');

  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
  });

  const db = drizzle(sql);

  try {
    // Check Admin (check all, including deleted)
    console.log('1️⃣ Checking Admin (admin@ibex.com)...');
    const adminAll = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'admin@ibex.com'),
          eq(users.role, 'platform_admin')
        )
      )
      .limit(1);
    
    const admin = adminAll.filter(u => !u.deletedAt);

    if (admin.length > 0) {
      console.log('   ✅ Admin exists:', admin[0].name);
      console.log('      Email:', admin[0].email);
      console.log('      Role:', admin[0].role);
      console.log('      Status:', admin[0].status);
    } else {
      console.log('   ❌ Admin NOT FOUND');
    }

    // Check Merchant
    console.log('\n2️⃣ Checking Merchant (merchant@example.com)...');
    const merchant = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'merchant@example.com'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (merchant.length > 0) {
      console.log('   ✅ Merchant exists:', merchant[0].name);
      console.log('      Email:', merchant[0].email);
      console.log('      Role:', merchant[0].role);
      console.log('      Status:', merchant[0].status);
    } else {
      console.log('   ❌ Merchant NOT FOUND');
    }

    // Check Cashier
    console.log('\n3️⃣ Checking Cashier (cashier@example.com)...');
    const cashier = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'cashier@example.com'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (cashier.length > 0) {
      console.log('   ✅ Cashier exists:', cashier[0].name);
      console.log('      Email:', cashier[0].email);
      console.log('      Role:', cashier[0].role);
      console.log('      Status:', cashier[0].status);
      console.log('      Store ID:', cashier[0].storeId);
    } else {
      console.log('   ❌ Cashier NOT FOUND');
    }

    // Check Customer
    console.log('\n4️⃣ Checking Customer (phone: 771234567)...');
    const customer = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.phone, '771234567'),
          isNull(customers.deletedAt)
        )
      )
      .limit(1);

    if (customer.length > 0) {
      console.log('   ✅ Customer exists:', customer[0].name);
      console.log('      Phone:', customer[0].phone);
      console.log('      Registration Status:', customer[0].registrationStatus);
      console.log('      Status:', customer[0].status);
    } else {
      console.log('   ❌ Customer NOT FOUND');
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Admin: ${admin.length > 0 ? '✅' : '❌'}`);
    console.log(`   Merchant: ${merchant.length > 0 ? '✅' : '❌'}`);
    console.log(`   Cashier: ${cashier.length > 0 ? '✅' : '❌'}`);
    console.log(`   Customer: ${customer.length > 0 ? '✅' : '❌'}`);

    if (admin.length === 0 || merchant.length === 0 || cashier.length === 0 || customer.length === 0) {
      console.log('\n⚠️  Some test users are missing. Run the app to auto-create them.');
    } else {
      console.log('\n✅ All test users exist!');
    }

  } catch (error: any) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await sql.end();
  }
}

checkTestUsers();

