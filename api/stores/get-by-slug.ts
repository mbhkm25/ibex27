import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { stores } from '../../src/main/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: 'slug is required' });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    const sql = postgres(connectionString, { ssl: 'require', max: 1 });
    const db = drizzle(sql);

    // Get store by slug
    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.slug, slug as string), isNull(stores.deletedAt)))
      .limit(1);

    await sql.end();

    if (!store) {
      return res.status(404).json({ error: 'المتجر غير موجود' });
    }

    return res.status(200).json({
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      phone: store.phone,
      contactInfo: store.contactInfo,
      settings: store.settings,
      bankAccounts: store.bankAccounts,
    });
  } catch (error: any) {
    console.error('Get store by slug error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

