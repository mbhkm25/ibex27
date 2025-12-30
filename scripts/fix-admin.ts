/**
 * Script to fix/create admin user
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { users } from '../src/main/schema';
import bcrypt from 'bcryptjs';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

async function fixAdmin() {
  const sql = postgres(connectionString, { ssl: 'require', max: 1 });
  const db = drizzle(sql);

  try {
    console.log('🔍 Checking admin user...');
    
    // Check all admins (including deleted)
    const allAdmins = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'admin@ibex.com'),
          eq(users.role, 'platform_admin')
        )
      );

    console.log(`Found ${allAdmins.length} admin record(s)`);

    if (allAdmins.length > 0) {
      const admin = allAdmins[0];
      if (admin.deletedAt) {
        console.log('⚠️  Admin exists but is deleted. Restoring...');
        await db.update(users)
          .set({ 
            deletedAt: null,
            status: 'active',
            name: 'مدير النظام'
          })
          .where(eq(users.id, admin.id));
        console.log('✅ Admin restored');
      } else {
        console.log('✅ Admin already exists and is active');
        console.log('   ID:', admin.id);
        console.log('   Name:', admin.name);
        console.log('   Status:', admin.status);
      }
    } else {
      console.log('❌ Admin not found. Creating...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await db.insert(users).values({
        name: 'مدير النظام',
        email: 'admin@ibex.com',
        password: hashedPassword,
        role: 'platform_admin',
        status: 'active',
      }).returning();
      console.log('✅ Admin created');
      console.log('   ID:', newAdmin[0].id);
      console.log('   Email: admin@ibex.com');
      console.log('   Password: admin123');
    }

    // Verify
    const activeAdmin = await db
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

    if (activeAdmin.length > 0) {
      console.log('\n✅ Admin is now active and ready to use!');
    } else {
      console.log('\n❌ Admin still not found after fix attempt');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === '23505') {
      console.log('   (Duplicate key - admin might exist with different criteria)');
    }
  } finally {
    await sql.end();
  }
}

fixAdmin();

