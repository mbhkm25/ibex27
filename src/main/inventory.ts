import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { products } from './schema';

export function setupInventoryHandlers() {
  // Get all products (filtered by storeId)
  ipcMain.handle('inventory:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(products.storeId, storeId), isNull(products.deletedAt))
        : isNull(products.deletedAt);
      
      return await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المنتجات');
    }
  });

  // Add product (requires storeId)
  ipcMain.handle('inventory:add', async (_, product) => {
    try {
      if (!product.storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      await db.insert(products).values({
        ...product,
        price: product.price.toString(),
        cost: product.cost?.toString() || '0',
        stock: parseInt(product.stock) || 0,
        categoryId: product.categoryId || null,
        showInPortal: product.showInPortal !== undefined ? product.showInPortal : true,
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة المنتج');
    }
  });

  // Import products (Batch) - requires storeId
  ipcMain.handle('inventory:import', async (_, { items, storeId }: { items: any[]; storeId: number }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      // Drizzle supports batch insert
      // Ensure data types are correct
      const cleanItems = items.map(item => ({
        ...item,
        storeId, // Ensure all items have storeId
        price: item.price.toString(),
        cost: item.cost?.toString() || '0',
        stock: parseInt(item.stock) || 0
      }));
      
      if (cleanItems.length > 0) {
        await db.insert(products).values(cleanItems);
      }
      return true;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || 'فشل استيراد المنتجات');
    }
  });

  // Update product - verify storeId matches
  ipcMain.handle('inventory:update', async (_, { id, storeId, ...data }) => {
    try {
      // Verify product belongs to store if storeId provided
      if (storeId) {
        const product = await db
          .select()
          .from(products)
          .where(and(eq(products.id, id), eq(products.storeId, storeId)))
          .limit(1);
        
        if (product.length === 0) {
          throw new Error('المنتج غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      await db.update(products).set(data).where(eq(products.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث المنتج');
    }
  });

  // Delete product (soft delete) - verify storeId matches
  ipcMain.handle('inventory:delete', async (_, { id, storeId }: { id: number; storeId?: number }) => {
    try {
      // Verify product belongs to store if storeId provided
      if (storeId) {
        const product = await db
          .select()
          .from(products)
          .where(and(eq(products.id, id), eq(products.storeId, storeId), isNull(products.deletedAt)))
          .limit(1);
        
        if (product.length === 0) {
          throw new Error('المنتج غير موجود أو لا ينتمي لهذا المتجر');
        }
      }
      
      // Soft delete
      await db
        .update(products)
        .set({ deletedAt: new Date() })
        .where(eq(products.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف المنتج');
    }
  });
}
