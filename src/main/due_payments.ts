import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { duePayments } from './schema';

export function setupDuePaymentHandlers() {
  // Get all due payments (filtered by storeId)
  ipcMain.handle('due-payments:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(duePayments.storeId, storeId), isNull(duePayments.deletedAt))
        : isNull(duePayments.deletedAt);
      
      return await db
        .select()
        .from(duePayments)
        .where(whereClause)
        .orderBy(desc(duePayments.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة الديون');
    }
  });

  // Add due payment (requires storeId)
  ipcMain.handle('due-payments:add', async (_, data) => {
    try {
      if (!data.storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      await db.insert(duePayments).values({
        ...data,
        amount: data.amount.toString(),
        dateIn: new Date(data.dateIn),
        dueDate: new Date(data.dueDate)
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة الدين');
    }
  });

  // Update due payment - verify storeId matches
  ipcMain.handle('due-payments:update', async (_, { id, storeId, ...data }) => {
    try {
      // Verify due payment belongs to store if storeId provided
      if (storeId) {
        const duePayment = await db
          .select()
          .from(duePayments)
          .where(and(eq(duePayments.id, id), eq(duePayments.storeId, storeId), isNull(duePayments.deletedAt)))
          .limit(1);
        
        if (duePayment.length === 0) {
          throw new Error('الدين غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      const updateData = { ...data };
      if (data.amount) updateData.amount = data.amount.toString();
      if (data.dateIn) updateData.dateIn = new Date(data.dateIn);
      if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
      
      await db.update(duePayments).set(updateData).where(eq(duePayments.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث الدين');
    }
  });

  // Delete due payment (soft delete) - verify storeId matches
  ipcMain.handle('due-payments:delete', async (_, { id, storeId }: { id: number; storeId?: number }) => {
    try {
      // Verify due payment belongs to store if storeId provided
      if (storeId) {
        const duePayment = await db
          .select()
          .from(duePayments)
          .where(and(eq(duePayments.id, id), eq(duePayments.storeId, storeId), isNull(duePayments.deletedAt)))
          .limit(1);
        
        if (duePayment.length === 0) {
          throw new Error('الدين غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      // Soft delete
      await db
        .update(duePayments)
        .set({ deletedAt: new Date() })
        .where(eq(duePayments.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف الدين');
    }
  });
}

