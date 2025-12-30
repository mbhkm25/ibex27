import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { stores } from './schema';
import { generateSlug } from '../shared/utils/validation';

export function setupStoresHandlers() {
  // Get store by slug (for customer portal)
  ipcMain.handle('stores:get-by-slug', async (_, slug: string) => {
    try {
      const result = await db
        .select()
        .from(stores)
        .where(and(eq(stores.slug, slug), isNull(stores.deletedAt)))
        .limit(1);
      
      return result[0] || null;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب بيانات المتجر');
    }
  });

  // Get store by ID
  ipcMain.handle('stores:get-by-id', async (_, id: number) => {
    try {
      const result = await db
        .select()
        .from(stores)
        .where(and(eq(stores.id, id), isNull(stores.deletedAt)))
        .limit(1);
      
      return result[0] || null;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب بيانات المتجر');
    }
  });

  // Get all stores for a merchant
  ipcMain.handle('stores:get-merchant-stores', async (_, merchantId: number) => {
    try {
      const result = await db
        .select()
        .from(stores)
        .where(and(eq(stores.merchantId, merchantId), isNull(stores.deletedAt)))
        .orderBy(desc(stores.createdAt));
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المتاجر');
    }
  });

  // Create new store
  ipcMain.handle('stores:create', async (_, data: {
    merchantId: number;
    name: string;
    description?: string;
    phone?: string;
    subscriptionPlan?: string;
    currencyId?: string;
  }) => {
    try {
      // Generate unique slug
      let slug = generateSlug(data.name);
      let slugExists = true;
      let counter = 1;
      
      while (slugExists) {
        const existing = await db
          .select()
          .from(stores)
          .where(eq(stores.slug, slug))
          .limit(1);
        
        if (existing.length === 0) {
          slugExists = false;
        } else {
          slug = `${generateSlug(data.name)}-${counter}`;
          counter++;
        }
      }

      const newStore = await db.insert(stores).values({
        merchantId: data.merchantId,
        name: data.name,
        slug,
        description: data.description || null,
        phone: data.phone || null,
        subscriptionPlan: data.subscriptionPlan || 'basic',
        subscriptionStatus: 'pending',
        currencyId: data.currencyId || null,
        bankAccounts: [],
        contactInfo: {},
        settings: {},
      }).returning();

      return newStore[0];
    } catch (error: any) {
      throw new Error(error.message || 'فشل إنشاء المتجر');
    }
  });

  // Update store
  ipcMain.handle('stores:update', async (_, { id, ...data }: any) => {
    try {
      // If name is being updated, regenerate slug
      if (data.name) {
        const store = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
        if (store[0] && store[0].name !== data.name) {
          data.slug = generateSlug(data.name);
        }
      }

      await db.update(stores).set(data).where(eq(stores.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث المتجر');
    }
  });

  // Soft delete store
  ipcMain.handle('stores:delete', async (_, id: number) => {
    try {
      await db.update(stores)
        .set({ deletedAt: new Date() })
        .where(eq(stores.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف المتجر');
    }
  });

  // Update store subscription status
  ipcMain.handle('stores:update-subscription', async (_, { id, status, plan }: {
    id: number;
    status: string;
    plan?: string;
  }) => {
    try {
      const updateData: any = { subscriptionStatus: status };
      if (plan) {
        updateData.subscriptionPlan = plan;
      }
      
      await db.update(stores).set(updateData).where(eq(stores.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث حالة الاشتراك');
    }
  });

  // Get all stores (for platform admin)
  ipcMain.handle('stores:get-all', async () => {
    try {
      const result = await db
        .select()
        .from(stores)
        .where(isNull(stores.deletedAt))
        .orderBy(desc(stores.createdAt));
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المتاجر');
    }
  });
}

