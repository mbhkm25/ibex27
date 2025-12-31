import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { customers, customerStoreRelations, stores } from '../../src/main/schema';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Connect to Neon Database
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    const sql = postgres(connectionString, { ssl: 'require', max: 1 });
    const db = drizzle(sql);

    // Find customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.phone, phone), isNull(customers.deletedAt)))
      .limit(1);

    if (!customer) {
      return res.status(401).json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      return res.status(401).json({ error: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    // Get customer stores
    const relations = await db
      .select({
        storeId: customerStoreRelations.storeId,
        balance: customerStoreRelations.balance,
        status: customerStoreRelations.status,
        store: {
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          description: stores.description,
          settings: stores.settings,
        },
      })
      .from(customerStoreRelations)
      .leftJoin(stores, eq(customerStoreRelations.storeId, stores.id))
      .where(
        and(
          eq(customerStoreRelations.customerId, customer.id),
          eq(customerStoreRelations.status, 'active'),
          isNull(stores.deletedAt)
        )
      );

    const customerStores = relations.map((rel) => ({
      id: rel.store.id,
      name: rel.store.name,
      slug: rel.store.slug,
      description: rel.store.description,
      settings: rel.store.settings,
      balance: parseFloat(rel.balance || '0'),
    }));

    await sql.end();

    // Return customer data (without password)
    const { password: _, ...customerWithoutPassword } = customer;

    return res.status(200).json({
      customer: customerWithoutPassword,
      stores: customerStores,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

