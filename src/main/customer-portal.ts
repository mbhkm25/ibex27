import { ipcMain } from 'electron';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { db } from './db';
import {
  customerStoreRelations,
  customerBalanceRequests,
  customerTransactions,
  stores,
  products,
  storeOffers,
  sales,
  saleItems,
  customerOrders,
  customerOrderItems,
  customers,
} from './schema';

export function setupCustomerPortalHandlers() {
  // Get customer stores (for dashboard) with last purchase info
  ipcMain.handle('customer-portal:get-stores', async (_, customerId: number) => {
    try {
      const result = await db
        .select({
          store: stores,
          relation: customerStoreRelations,
        })
        .from(customerStoreRelations)
        .innerJoin(stores, eq(customerStoreRelations.storeId, stores.id))
        .where(and(
          eq(customerStoreRelations.customerId, customerId),
          eq(customerStoreRelations.status, 'active'),
          isNull(stores.deletedAt)
        ))
        .orderBy(desc(customerStoreRelations.registeredAt));

      // Get last purchase for each store
      const storesWithLastPurchase = await Promise.all(
        result.map(async (r) => {
          const lastSale = await db
            .select()
            .from(sales)
            .where(and(
              eq(sales.customerId, customerId),
              eq(sales.storeId, r.store.id),
              isNull(sales.deletedAt)
            ))
            .orderBy(desc(sales.createdAt))
            .limit(1);

          return {
            ...r.store,
            balance: r.relation.balance,
            registeredAt: r.relation.registeredAt,
            lastPurchase: lastSale.length > 0 ? {
              id: lastSale[0].id,
              total: lastSale[0].total,
              createdAt: lastSale[0].createdAt,
            } : null,
          };
        })
      );

      return storesWithLastPurchase;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المتاجر');
    }
  });

  // Get store details for customer
  ipcMain.handle('customer-portal:get-store-details', async (_, {
    customerId,
    storeId,
  }: {
    customerId: number;
    storeId: number;
  }) => {
    try {
      // Get store
      const store = await db
        .select()
        .from(stores)
        .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
        .limit(1);

      if (store.length === 0) {
        throw new Error('المتجر غير موجود');
      }

      // Get customer relation
      const relation = await db
        .select()
        .from(customerStoreRelations)
        .where(and(
          eq(customerStoreRelations.customerId, customerId),
          eq(customerStoreRelations.storeId, storeId),
          eq(customerStoreRelations.status, 'active')
        ))
        .limit(1);

      if (relation.length === 0) {
        throw new Error('غير مسموح لك بالوصول إلى هذا المتجر');
      }

      return {
        store: store[0],
        balance: relation[0].balance,
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب بيانات المتجر');
    }
  });

  // Request balance deposit
  ipcMain.handle('customer-portal:request-balance', async (_, data: {
    customerId: number;
    storeId: number;
    bank: string;
    amount: number;
    referenceNumber: string;
    receiptImage?: string; // Base64 image
  }) => {
    try {
      // Verify customer has access to store
      const relation = await db
        .select()
        .from(customerStoreRelations)
        .where(and(
          eq(customerStoreRelations.customerId, data.customerId),
          eq(customerStoreRelations.storeId, data.storeId),
          eq(customerStoreRelations.status, 'active')
        ))
        .limit(1);

      if (relation.length === 0) {
        throw new Error('غير مسموح لك بالوصول إلى هذا المتجر');
      }

      // Create balance request with receipt image in metadata
      const request = await db.insert(customerBalanceRequests).values({
        customerId: data.customerId,
        storeId: data.storeId,
        bank: data.bank,
        amount: data.amount.toString(),
        referenceNumber: data.referenceNumber,
        status: 'pending',
        metadata: data.receiptImage ? { receiptImage: data.receiptImage } : null,
      }).returning();

      return request[0];
    } catch (error: any) {
      throw new Error(error.message || 'فشل إرسال طلب تعبئة الرصيد');
    }
  });

  // Get customer transactions
  ipcMain.handle('customer-portal:get-transactions', async (_, {
    customerId,
    storeId,
    limit = 50,
  }: {
    customerId: number;
    storeId: number;
    limit?: number;
  }) => {
    try {
      const result = await db
        .select()
        .from(customerTransactions)
        .where(and(
          eq(customerTransactions.customerId, customerId),
          eq(customerTransactions.storeId, storeId)
        ))
        .orderBy(desc(customerTransactions.createdAt))
        .limit(limit);

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب العمليات');
    }
  });

  // Get store products (for customer browsing) - only show products with showInPortal = true
  ipcMain.handle('customer-portal:get-products', async (_, storeId: number) => {
    try {
      const result = await db
        .select()
        .from(products)
        .where(and(
          eq(products.storeId, storeId),
          eq(products.showInPortal, true), // Only show products marked for portal
          isNull(products.deletedAt)
        ))
        .orderBy(desc(products.createdAt));

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المنتجات');
    }
  });

  // Get store offers
  ipcMain.handle('customer-portal:get-offers', async (_, storeId: number) => {
    try {
      const now = new Date();
      const result = await db
        .select()
        .from(storeOffers)
        .where(and(
          eq(storeOffers.storeId, storeId),
          eq(storeOffers.active, true),
          isNull(storeOffers.deletedAt)
        ))
        .orderBy(desc(storeOffers.createdAt));

      // Filter by date range
      return result.filter(offer => {
        const start = new Date(offer.startDate);
        const end = new Date(offer.endDate);
        return now >= start && now <= end;
      });
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب العروض');
    }
  });

  // Get customer invoices (sales)
  ipcMain.handle('customer-portal:get-invoices', async (_, {
    customerId,
    storeId,
    limit = 50,
  }: {
    customerId: number;
    storeId: number;
    limit?: number;
  }) => {
      try {
        const result = await db
          .select({
            sale: sales,
            items: saleItems,
          })
          .from(sales)
          .leftJoin(saleItems, eq(sales.id, saleItems.saleId))
          .where(and(
            eq(sales.customerId, customerId),
            eq(sales.storeId, storeId),
            isNull(sales.deletedAt)
          ))
          .orderBy(desc(sales.createdAt))
          .limit(limit);

        // Group items by sale
        const invoices = result.reduce((acc: any, row: any) => {
          const saleId = row.sale.id;
          if (!acc[saleId]) {
            acc[saleId] = {
              ...row.sale,
              items: [],
            };
          }
          if (row.items) {
            acc[saleId].items.push(row.items);
          }
          return acc;
        }, {});

        return Object.values(invoices);
      } catch (error: any) {
        throw new Error(error.message || 'فشل جلب الفواتير');
      }
  });

  // Create customer order (shopping cart order)
  ipcMain.handle('customer-portal:create-order', async (_, {
    customerId,
    storeId,
    items,
    notes,
  }: {
    customerId: number;
    storeId: number;
    items: Array<{ productId: number; quantity: number; price: number }>;
    notes?: string;
  }) => {
    try {
      // Verify customer has access to store
      const relation = await db
        .select()
        .from(customerStoreRelations)
        .where(and(
          eq(customerStoreRelations.customerId, customerId),
          eq(customerStoreRelations.storeId, storeId),
          eq(customerStoreRelations.status, 'active')
        ))
        .limit(1);

      if (relation.length === 0) {
        throw new Error('غير مسموح لك بالوصول إلى هذا المتجر');
      }

      if (!items || items.length === 0) {
        throw new Error('يجب إضافة منتج واحد على الأقل');
      }

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Use transaction
      return await db.transaction(async (tx) => {
        // Create order
        const [order] = await tx
          .insert(customerOrders)
          .values({
            customerId,
            storeId,
            total: total.toString(),
            status: 'pending',
            notes: notes || null,
          })
          .returning();

        // Add order items
        for (const item of items) {
          await tx.insert(customerOrderItems).values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString(),
            total: (item.price * item.quantity).toString(),
          });
        }

        return { orderId: order.id, success: true };
      });
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(error.message || 'فشل إنشاء الطلب');
    }
  });

  // Get customer orders
  ipcMain.handle('customer-portal:get-orders', async (_, {
    customerId,
    storeId,
  }: {
    customerId: number;
    storeId: number;
  }) => {
    try {
      const orders = await db
        .select()
        .from(customerOrders)
        .where(and(
          eq(customerOrders.customerId, customerId),
          eq(customerOrders.storeId, storeId),
          isNull(customerOrders.deletedAt)
        ))
        .orderBy(desc(customerOrders.createdAt));

      // Get items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await db
            .select({
              item: customerOrderItems,
              product: products,
            })
            .from(customerOrderItems)
            .leftJoin(products, eq(customerOrderItems.productId, products.id))
            .where(eq(customerOrderItems.orderId, order.id));

          return {
            ...order,
            items: items.map(i => ({
              ...i.item,
              product: i.product,
            })),
          };
        })
      );

      return ordersWithItems;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب الطلبات');
    }
  });

  // Get pending orders for merchant (store view)
  ipcMain.handle('customer-portal:get-pending-orders', async (_, storeId: number) => {
    try {
      const orders = await db
        .select({
          order: customerOrders,
          customer: customers,
        })
        .from(customerOrders)
        .leftJoin(customers, eq(customerOrders.customerId, customers.id))
        .where(and(
          eq(customerOrders.storeId, storeId),
          eq(customerOrders.status, 'pending'),
          isNull(customerOrders.deletedAt)
        ))
        .orderBy(desc(customerOrders.createdAt));

      // Get items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async ({ order, customer }) => {
          const items = await db
            .select({
              item: customerOrderItems,
              product: products,
            })
            .from(customerOrderItems)
            .leftJoin(products, eq(customerOrderItems.productId, products.id))
            .where(eq(customerOrderItems.orderId, order.id));

          return {
            ...order,
            customer,
            items: items.map(i => ({
              ...i.item,
              product: i.product,
            })),
          };
        })
      );

      return ordersWithItems;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب الطلبات المعلقة');
    }
  });

  // Convert order to invoice (prepare for POS)
  ipcMain.handle('customer-portal:convert-order-to-invoice', async (_, orderId: number) => {
    try {
      // Get order with items
      const [order] = await db
        .select()
        .from(customerOrders)
        .where(eq(customerOrders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      if (order.status !== 'pending') {
        throw new Error('الطلب تم معالجته مسبقاً');
      }

      // Get order items with product details
      const items = await db
        .select({
          item: customerOrderItems,
          product: products,
        })
        .from(customerOrderItems)
        .leftJoin(products, eq(customerOrderItems.productId, products.id))
        .where(eq(customerOrderItems.orderId, orderId));

      // Format items for POS
      const posItems = items.map(({ item, product }) => ({
        id: product?.id || item.productId,
        name: product?.name || `Product ${item.productId}`,
        quantity: parseInt(item.quantity.toString()),
        price: parseFloat(item.price.toString()),
        productId: item.productId,
      }));

      return {
        orderId: order.id,
        customerId: order.customerId,
        storeId: order.storeId,
        items: posItems,
        total: parseFloat(order.total.toString()),
        notes: order.notes,
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحويل الطلب إلى فاتورة');
    }
  });
}

