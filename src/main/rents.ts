import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { rents, rentItems } from './schema';

export function setupRentHandlers() {
  // Rent Transactions (filtered by storeId)
  ipcMain.handle('rents:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(rents.storeId, storeId), isNull(rents.deletedAt))
        : isNull(rents.deletedAt);
      
      return await db
        .select()
        .from(rents)
        .where(whereClause)
        .orderBy(desc(rents.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة الإيجارات');
    }
  });

  // Add rent (requires storeId)
  ipcMain.handle('rents:add', async (_, data) => {
    try {
      if (!data.storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      await db.insert(rents).values({
        ...data,
        amount: data.amount.toString(),
        penalty: data.penalty?.toString() || '0',
        rentDate: new Date(data.rentDate)
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة الإيجار');
    }
  });

  // Update rent - verify storeId matches
  ipcMain.handle('rents:update', async (_, { id, storeId, ...data }) => {
    try {
      // Verify rent belongs to store if storeId provided
      if (storeId) {
        const rent = await db
          .select()
          .from(rents)
          .where(and(eq(rents.id, id), eq(rents.storeId, storeId), isNull(rents.deletedAt)))
          .limit(1);
        
        if (rent.length === 0) {
          throw new Error('الإيجار غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      const updateData = { ...data };
      if (data.amount) updateData.amount = data.amount.toString();
      if (data.penalty) updateData.penalty = data.penalty.toString();
      if (data.rentDate) updateData.rentDate = new Date(data.rentDate);
      
      await db.update(rents).set(updateData).where(eq(rents.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث الإيجار');
    }
  });

  // Delete rent (soft delete) - verify storeId matches
  ipcMain.handle('rents:delete', async (_, { id, storeId }: { id: number; storeId?: number }) => {
    try {
      // Verify rent belongs to store if storeId provided
      if (storeId) {
        const rent = await db
          .select()
          .from(rents)
          .where(and(eq(rents.id, id), eq(rents.storeId, storeId), isNull(rents.deletedAt)))
          .limit(1);
        
        if (rent.length === 0) {
          throw new Error('الإيجار غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      // Soft delete
      await db
        .update(rents)
        .set({ deletedAt: new Date() })
        .where(eq(rents.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف الإيجار');
    }
  });

  // Rent Items (Catalog) - filtered by storeId
  ipcMain.handle('rent-items:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(rentItems.storeId, storeId), isNull(rentItems.deletedAt))
        : isNull(rentItems.deletedAt);
      
      return await db
        .select()
        .from(rentItems)
        .where(whereClause)
        .orderBy(desc(rentItems.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة عناصر الإيجار');
    }
  });

  // Add rent item (requires storeId)
  ipcMain.handle('rent-items:add', async (_, data) => {
    try {
      if (!data.storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      await db.insert(rentItems).values({
        ...data,
        rent3Days: data.rent3Days?.toString() || '0',
        rent1Week: data.rent1Week?.toString() || '0',
        rent1Month: data.rent1Month?.toString() || '0'
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة عنصر الإيجار');
    }
  });

  // Delete rent item (soft delete) - verify storeId matches
  ipcMain.handle('rent-items:delete', async (_, { id, storeId }: { id: number; storeId?: number }) => {
    try {
      // Verify rent item belongs to store if storeId provided
      if (storeId) {
        const rentItem = await db
          .select()
          .from(rentItems)
          .where(and(eq(rentItems.id, id), eq(rentItems.storeId, storeId), isNull(rentItems.deletedAt)))
          .limit(1);
        
        if (rentItem.length === 0) {
          throw new Error('عنصر الإيجار غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      // Soft delete
      await db
        .update(rentItems)
        .set({ deletedAt: new Date() })
        .where(eq(rentItems.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف عنصر الإيجار');
    }
  });
}

