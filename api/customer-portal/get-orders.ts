import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { customerOrders, customerOrderItems, products } from '../../src/main/schema';

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

    // Get orders
    const orders = await db
      .select()
      .from(customerOrders)
      .where(
        and(
          eq(customerOrders.customerId, customerId),
          eq(customerOrders.storeId, storeId),
          isNull(customerOrders.deletedAt)
        )
      )
      .orderBy(customerOrders.createdAt);

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            id: customerOrderItems.id,
            productId: customerOrderItems.productId,
            quantity: customerOrderItems.quantity,
            price: customerOrderItems.price,
            total: customerOrderItems.total,
            product: {
              id: products.id,
              name: products.name,
            },
          })
          .from(customerOrderItems)
          .leftJoin(products, eq(customerOrderItems.productId, products.id))
          .where(eq(customerOrderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    await sql.end();

    return res.status(200).json(ordersWithItems);
  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

