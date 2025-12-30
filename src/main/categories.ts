/**
 * Categories Handlers - إدارة التصنيفات
 */

import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { categories } from './schema';

export function setupCategoriesHandlers() {
  // Get all categories (filtered by storeId)
  ipcMain.handle('categories:get-all', async (_, storeId?: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      const whereClause = and(
        eq(categories.storeId, storeId),
        isNull(categories.deletedAt)
      );

      return await db
        .select()
        .from(categories)
        .where(whereClause)
        .orderBy(desc(categories.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب التصنيفات');
    }
  });

  // Add category (requires storeId)
  ipcMain.handle('categories:add', async (_, data: { storeId: number; name: string }) => {
    try {
      if (!data.storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      if (!data.name || data.name.trim().length === 0) {
        throw new Error('اسم التصنيف مطلوب');
      }

      // Check if category with same name already exists
      const existing = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.storeId, data.storeId),
            eq(categories.name, data.name.trim()),
            isNull(categories.deletedAt)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('التصنيف موجود بالفعل');
      }

      await db.insert(categories).values({
        storeId: data.storeId,
        name: data.name.trim(),
      });

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة التصنيف');
    }
  });

  // Update category - verify storeId matches
  ipcMain.handle('categories:update', async (_, { id, storeId, name }: { id: number; storeId: number; name: string }) => {
    try {
      // Verify category belongs to store
      const category = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, id),
            eq(categories.storeId, storeId),
            isNull(categories.deletedAt)
          )
        )
        .limit(1);

      if (category.length === 0) {
        throw new Error('التصنيف غير موجود أو لا ينتمي لهذا المتجر');
      }

      // Check if new name conflicts with existing category
      const existing = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.storeId, storeId),
            eq(categories.name, name.trim()),
            isNull(categories.deletedAt)
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new Error('اسم التصنيف مستخدم بالفعل');
      }

      await db
        .update(categories)
        .set({ name: name.trim() })
        .where(eq(categories.id, id));

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث التصنيف');
    }
  });

  // Delete category (soft delete) - verify storeId matches
  ipcMain.handle('categories:delete', async (_, { id, storeId }: { id: number; storeId: number }) => {
    try {
      // Verify category belongs to store
      const category = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.id, id),
            eq(categories.storeId, storeId),
            isNull(categories.deletedAt)
          )
        )
        .limit(1);

      if (category.length === 0) {
        throw new Error('التصنيف غير موجود أو لا ينتمي لهذا المتجر');
      }

      // Check if category is used by any products
      const { products } = await import('./schema');
      const productsUsingCategory = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.categoryId, id),
            isNull(products.deletedAt)
          )
        )
        .limit(1);

      if (productsUsingCategory.length > 0) {
        throw new Error('لا يمكن حذف التصنيف لأنه مستخدم في منتجات');
      }

      // Soft delete
      await db
        .update(categories)
        .set({ deletedAt: new Date() })
        .where(eq(categories.id, id));

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف التصنيف');
    }
  });
}

