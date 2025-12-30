/**
 * Script to check all users with admin@ibex.com email
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

async function checkAllUsers() {
  const sql = postgres(connectionString, { ssl: 'require', max: 1 });
  const db = drizzle(sql);

  try {
    console.log('🔍 Checking all users with email admin@ibex.com...\n');
    
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@ibex.com'));

    console.log(`Found ${allUsers.length} user(s) with this email:\n`);

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Deleted At: ${user.deletedAt || 'Not deleted'}`);
      console.log(`   Created At: ${user.createdAt || 'N/A'}`);
      console.log('');
    });

    // Check all users
    console.log('\n📊 All users in database:');
    const allUsersInDb = await db.select().from(users).limit(20);
    console.log(`Total users found: ${allUsersInDb.length}\n`);
    
    allUsersInDb.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Status: ${user.status} ${user.deletedAt ? '[DELETED]' : ''}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkAllUsers();

