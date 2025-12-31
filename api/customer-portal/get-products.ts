import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { products } from '../../src/main/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const storeId = parseInt(req.query.storeId as string);

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    const sql = postgres(connectionString, { ssl: 'require', max: 1 });
    const db = drizzle(sql);

    // Get products for store (only visible in portal)
    const productsList = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        stock: products.stock,
        categoryId: products.categoryId,
        barcode: products.barcode,
      })
      .from(products)
      .where(
        and(
          eq(products.storeId, storeId),
          eq(products.showInPortal, true),
          isNull(products.deletedAt)
        )
      );

    await sql.end();

    return res.status(200).json(productsList);
  } catch (error: any) {
    console.error('Get products error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

