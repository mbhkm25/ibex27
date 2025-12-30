import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { expenses } from './schema';

export function setupExpensesHandlers() {
  // Get all expenses (filtered by storeId)
  ipcMain.handle('expenses:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(expenses.storeId, storeId), isNull(expenses.deletedAt))
        : isNull(expenses.deletedAt);
      
      return await db
        .select()
        .from(expenses)
        .where(whereClause)
        .orderBy(desc(expenses.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المصروفات');
    }
  });

  // Add expense (requires storeId)
  ipcMain.handle('expenses:add', async (_, data) => {
    try {
      if (!data.storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      await db.insert(expenses).values({
        ...data,
        amount: data.amount.toString() // Ensure decimal is string for insert
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة المصروف');
    }
  });

  // Delete expense (soft delete) - verify storeId matches
  ipcMain.handle('expenses:delete', async (_, { id, storeId }: { id: number; storeId?: number }) => {
    try {
      // Verify expense belongs to store if storeId provided
      if (storeId) {
        const expense = await db
          .select()
          .from(expenses)
          .where(and(eq(expenses.id, id), eq(expenses.storeId, storeId), isNull(expenses.deletedAt)))
          .limit(1);
        
        if (expense.length === 0) {
          throw new Error('المصروف غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      // Soft delete
      await db
        .update(expenses)
        .set({ deletedAt: new Date() })
        .where(eq(expenses.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف المصروف');
    }
  });
}

