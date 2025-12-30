import { ipcMain } from 'electron';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import { users, stores, customers, sales } from './schema';

/**
 * Platform Admin Handlers
 * إدارة التجار والمتاجر والاشتراكات
 */

export function setupPlatformAdminHandlers() {
  // ============================================
  // إدارة التجار (Merchants)
  // ============================================

  // جلب جميع التجار
  ipcMain.handle('platform-admin:get-merchants', async () => {
    try {
      const merchants = await db
        .select()
        .from(users)
        .where(and(eq(users.role, 'merchant'), isNull(users.deletedAt)))
        .orderBy(desc(users.createdAt));
      
      return merchants.map(({ password, ...merchant }) => merchant);
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب التجار');
    }
  });

  // جلب تاجر محدد
  ipcMain.handle('platform-admin:get-merchant', async (_, merchantId: number) => {
    try {
      const [merchant] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, merchantId), eq(users.role, 'merchant')))
        .limit(1);
      
      if (!merchant) {
        throw new Error('التاجر غير موجود');
      }

      const { password, ...merchantWithoutPassword } = merchant;
      return merchantWithoutPassword;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب التاجر');
    }
  });

  // تحديث حالة التاجر
  ipcMain.handle('platform-admin:update-merchant-status', async (_, { merchantId, status }) => {
    try {
      await db
        .update(users)
        .set({ status })
        .where(and(eq(users.id, merchantId), eq(users.role, 'merchant')));
      
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث حالة التاجر');
    }
  });

  // حذف تاجر (Soft Delete)
  ipcMain.handle('platform-admin:delete-merchant', async (_, merchantId: number) => {
    try {
      await db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(and(eq(users.id, merchantId), eq(users.role, 'merchant')));
      
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف التاجر');
    }
  });

  // ============================================
  // إدارة المتاجر (Stores)
  // ============================================

  // جلب جميع المتاجر مع معلومات التاجر
  ipcMain.handle('platform-admin:get-all-stores', async () => {
    try {
      const allStores = await db
        .select({
          store: stores,
          merchant: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(stores)
        .leftJoin(users, eq(stores.merchantId, users.id))
        .where(isNull(stores.deletedAt))
        .orderBy(desc(stores.createdAt));
      
      return allStores;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المتاجر');
    }
  });

  // تحديث حالة الاشتراك
  ipcMain.handle('platform-admin:update-store-subscription', async (_, { 
    storeId, 
    subscriptionStatus, 
    subscriptionPlan,
    subscriptionExpiry 
  }) => {
    try {
      const updateData: any = {
        subscriptionStatus,
        subscriptionPlan,
      };
      
      if (subscriptionExpiry) {
        updateData.subscriptionExpiry = new Date(subscriptionExpiry);
      }
      
      await db
        .update(stores)
        .set(updateData)
        .where(eq(stores.id, storeId));
      
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث الاشتراك');
    }
  });

  // التحقق من حالة الاشتراك
  ipcMain.handle('platform-admin:check-subscription', async (_, storeId: number) => {
    try {
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);
      
      if (!store) {
        return { valid: false, reason: 'المتجر غير موجود' };
      }

      // Check if subscription is active
      if (store.subscriptionStatus !== 'active') {
        return { 
          valid: false, 
          reason: 'الاشتراك غير نشط',
          status: store.subscriptionStatus 
        };
      }

      // Check expiry date
      if (store.subscriptionExpiry) {
        const now = new Date();
        const expiry = new Date(store.subscriptionExpiry);
        
        if (now > expiry) {
          // Auto-update status to expired
          await db
            .update(stores)
            .set({ subscriptionStatus: 'expired' })
            .where(eq(stores.id, storeId));
          
          return { 
            valid: false, 
            reason: 'انتهى الاشتراك',
            expiredAt: expiry 
          };
        }
      }

      return { valid: true, store };
    } catch (error: any) {
      throw new Error(error.message || 'فشل التحقق من الاشتراك');
    }
  });

  // جلب جميع طلبات تعبئة الرصيد (للمراقبة المالية)
  ipcMain.handle('platform-admin:get-all-balance-requests', async (_, { 
    limit = 100,
    status 
  }: { limit?: number; status?: string } = {}) => {
    try {
      const { customerBalanceRequests, customers, stores: storesTable } = await import('./schema');
      
      const whereClause = status 
        ? and(eq(customerBalanceRequests.status, status))
        : undefined;

      const requests = await db
        .select({
          request: customerBalanceRequests,
          customer: {
            id: customers.id,
            name: customers.name,
            phone: customers.phone,
          },
          store: {
            id: storesTable.id,
            name: storesTable.name,
            merchantId: storesTable.merchantId,
          },
        })
        .from(customerBalanceRequests)
        .leftJoin(customers, eq(customerBalanceRequests.customerId, customers.id))
        .leftJoin(storesTable, eq(customerBalanceRequests.storeId, storesTable.id))
        .where(whereClause)
        .orderBy(desc(customerBalanceRequests.createdAt))
        .limit(limit);

      return requests;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب طلبات تعبئة الرصيد');
    }
  });

  // حذف متجر (Soft Delete)
  ipcMain.handle('platform-admin:delete-store', async (_, storeId: number) => {
    try {
      await db
        .update(stores)
        .set({ deletedAt: new Date() })
        .where(eq(stores.id, storeId));
      
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف المتجر');
    }
  });

  // ============================================
  // الإحصائيات الشاملة
  // ============================================

  // لوحة تحكم المدير
  ipcMain.handle('platform-admin:dashboard', async () => {
    try {
      // عدد التجار
      const [merchantsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, 'merchant'), isNull(users.deletedAt)));

      // عدد المتاجر
      const [storesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(stores)
        .where(isNull(stores.deletedAt));

      // عدد العملاء
      const [customersCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(isNull(customers.deletedAt));

      // إجمالي المبيعات (آخر 30 يوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalRevenue] = await db
        .select({ total: sql<number>`COALESCE(SUM(${sales.total}), 0)` })
        .from(sales)
        .where(
          and(
            sql`${sales.createdAt} >= ${thirtyDaysAgo}`,
            isNull(sales.deletedAt)
          )
        );

      // المتاجر النشطة (اشتراك نشط)
      const [activeStoresCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(stores)
        .where(
          and(
            eq(stores.subscriptionStatus, 'active'),
            isNull(stores.deletedAt)
          )
        );

      // المتاجر المعلقة (اشتراك منتهي)
      const [expiredStoresCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(stores)
        .where(
          and(
            eq(stores.subscriptionStatus, 'expired'),
            isNull(stores.deletedAt)
          )
        );

      return {
        merchants: merchantsCount?.count || 0,
        stores: storesCount?.count || 0,
        customers: customersCount?.count || 0,
        totalRevenue: totalRevenue?.total || 0,
        activeStores: activeStoresCount?.count || 0,
        expiredStores: expiredStoresCount?.count || 0,
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب الإحصائيات');
    }
  });

  // إحصائيات المتاجر (أفضل متاجر حسب المبيعات)
  ipcMain.handle('platform-admin:top-stores', async (_, limit = 10) => {
    try {
      const topStores = await db
        .select({
          storeId: stores.id,
          storeName: stores.name,
          merchantName: users.name,
          totalSales: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
          salesCount: sql<number>`COUNT(${sales.id})`,
        })
        .from(stores)
        .leftJoin(users, eq(stores.merchantId, users.id))
        .leftJoin(sales, eq(sales.storeId, stores.id))
        .where(isNull(stores.deletedAt))
        .groupBy(stores.id, stores.name, users.name)
        .orderBy(desc(sql`COALESCE(SUM(${sales.total}), 0)`))
        .limit(limit);
      
      return topStores;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب أفضل المتاجر');
    }
  });

  // إحصائيات الاشتراكات
  ipcMain.handle('platform-admin:subscription-stats', async () => {
    try {
      const stats = await db
        .select({
          plan: stores.subscriptionPlan,
          status: stores.subscriptionStatus,
          count: sql<number>`count(*)`,
        })
        .from(stores)
        .where(isNull(stores.deletedAt))
        .groupBy(stores.subscriptionPlan, stores.subscriptionStatus);
      
      return stats;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب إحصائيات الاشتراكات');
    }
  });
}

