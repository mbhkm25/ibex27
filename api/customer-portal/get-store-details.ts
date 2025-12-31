import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { stores, customerStoreRelations, customers } from '../../src/main/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, storeId } = req.body;

    if (!customerId || !storeId) {
      return res.status(400).json({ error: 'customerId and storeId are required' });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    const sql = postgres(connectionString, { ssl: 'require', max: 1 });
    const db = drizzle(sql);

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
      .limit(1);

    if (!store) {
      await sql.end();
      return res.status(404).json({ error: 'المتجر غير موجود' });
    }

    // Get customer balance in this store
    const [relation] = await db
      .select()
      .from(customerStoreRelations)
      .where(
        and(
          eq(customerStoreRelations.customerId, customerId),
          eq(customerStoreRelations.storeId, storeId)
        )
      )
      .limit(1);

    const balance = relation ? parseFloat(relation.balance || '0') : 0;

    await sql.end();

    return res.status(200).json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        phone: store.phone,
        contactInfo: store.contactInfo,
        settings: store.settings,
        bankAccounts: store.bankAccounts,
      },
      balance: balance.toString(),
    });
  } catch (error: any) {
    console.error('Get store details error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

