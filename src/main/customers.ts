import { ipcMain } from 'electron';
import { eq, desc, like, and, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import { customers, customerStoreRelations } from './schema';

export function setupCustomersHandlers() {
  ipcMain.handle('customers:get-all', async (_, searchString = '') => {
    try {
      if (searchString) {
        return await db.select().from(customers)
          .where(and(
            isNull(customers.deletedAt),
            like(customers.name, `%${searchString}%`)
          ))
          .orderBy(desc(customers.createdAt));
      } else {
        return await db.select().from(customers)
          .where(isNull(customers.deletedAt))
          .orderBy(desc(customers.createdAt));
      }
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب العملاء');
    }
  });

  ipcMain.handle('customers:add', async (_, data) => {
    try {
      await db.insert(customers).values(data);
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة العميل');
    }
  });

  ipcMain.handle('customers:update', async (_, { id, ...data }) => {
    try {
      await db.update(customers).set(data).where(eq(customers.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث العميل');
    }
  });

  ipcMain.handle('customers:delete', async (_, id) => {
    try {
      await db.delete(customers).where(eq(customers.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف العميل');
    }
  });

  // Get pending registration requests count for notifications
  ipcMain.handle('customers:get-pending-registrations-count', async (_, storeId?: number) => {
    try {
      if (storeId) {
        // Filter by customers registered in that store
        const result = await db
          .select({ count: sql<number>`count(distinct ${customers.id})` })
          .from(customers)
          .innerJoin(customerStoreRelations, eq(customers.id, customerStoreRelations.customerId))
          .where(and(
            eq(customers.registrationStatus, 'pending'),
            eq(customerStoreRelations.storeId, storeId),
            isNull(customers.deletedAt)
          ));
        
        return result[0]?.count || 0;
      } else {
        // All pending registrations
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(customers)
          .where(and(
            eq(customers.registrationStatus, 'pending'),
            isNull(customers.deletedAt)
          ));
        
        return result[0]?.count || 0;
      }
    } catch (error: any) {
      return 0;
    }
  });
}
