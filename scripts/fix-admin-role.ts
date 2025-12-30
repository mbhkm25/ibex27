/**
 * Script to fix admin role from 'admin' to 'platform_admin'
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { users } from '../src/main/schema';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

async function fixAdminRole() {
  const sql = postgres(connectionString, { ssl: 'require', max: 1 });
  const db = drizzle(sql);

  try {
    console.log('🔍 Finding admin user...');
    
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@ibex.com'))
      .limit(1);

    if (adminUser.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const user = adminUser[0];
    console.log(`Found user: ${user.name} (ID: ${user.id})`);
    console.log(`Current role: ${user.role}`);

    if (user.role !== 'platform_admin') {
      console.log('⚠️  Role is incorrect. Updating to platform_admin...');
      await db.update(users)
        .set({ role: 'platform_admin' })
        .where(eq(users.id, user.id));
      console.log('✅ Role updated to platform_admin');
    } else {
      console.log('✅ Role is already correct');
    }

    // Verify
    const updatedUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@ibex.com'))
      .limit(1);

    console.log('\n✅ Final status:');
    console.log(`   Name: ${updatedUser[0].name}`);
    console.log(`   Email: ${updatedUser[0].email}`);
    console.log(`   Role: ${updatedUser[0].role}`);
    console.log(`   Status: ${updatedUser[0].status}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

fixAdminRole();

