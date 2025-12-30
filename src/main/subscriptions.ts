import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { subscriptionPlans, subscriptionRequests, stores, users } from './schema';

/**
 * Subscription Management Handlers
 * إدارة الباقات وطلبات الاشتراك
 */

export function setupSubscriptionHandlers() {
  // ============================================
  // إدارة الباقات (Subscription Plans)
  // ============================================

  // جلب جميع الباقات النشطة
  ipcMain.handle('subscriptions:get-plans', async () => {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(and(eq(subscriptionPlans.active, true), isNull(subscriptionPlans.deletedAt)))
        .orderBy(subscriptionPlans.price);

      return plans;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب الباقات');
    }
  });

  // جلب جميع الباقات (لأدمن المنصة)
  ipcMain.handle('subscriptions:get-all-plans', async () => {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(isNull(subscriptionPlans.deletedAt))
        .orderBy(subscriptionPlans.price);

      return plans;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب الباقات');
    }
  });

  // جلب باقة محددة
  ipcMain.handle('subscriptions:get-plan', async (_, planId: number) => {
    try {
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);

      if (!plan) {
        throw new Error('الباقة غير موجودة');
      }

      return plan;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب الباقة');
    }
  });

  // إضافة باقة جديدة (لأدمن المنصة)
  ipcMain.handle('subscriptions:add-plan', async (_, planData: {
    name: string;
    displayName: string;
    description?: string;
    price: number;
    durationMonths?: number;
    features?: Array<{ name: string; included: boolean }>;
    maxProducts?: number;
    maxUsers?: number;
    maxStores?: number;
    active?: boolean;
  }) => {
    try {
      const [newPlan] = await db
        .insert(subscriptionPlans)
        .values({
          name: planData.name,
          displayName: planData.displayName,
          description: planData.description || null,
          price: planData.price.toString(),
          durationMonths: planData.durationMonths || 1,
          features: planData.features || [],
          maxProducts: planData.maxProducts || null,
          maxUsers: planData.maxUsers || null,
          maxStores: planData.maxStores || 1,
          active: planData.active !== undefined ? planData.active : true,
        })
        .returning();

      return newPlan;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة الباقة');
    }
  });

  // تحديث باقة (لأدمن المنصة)
  ipcMain.handle('subscriptions:update-plan', async (_, planId: number, planData: {
    name?: string;
    displayName?: string;
    description?: string;
    price?: number;
    durationMonths?: number;
    features?: Array<{ name: string; included: boolean }>;
    maxProducts?: number;
    maxUsers?: number;
    maxStores?: number;
    active?: boolean;
  }) => {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (planData.name !== undefined) updateData.name = planData.name;
      if (planData.displayName !== undefined) updateData.displayName = planData.displayName;
      if (planData.description !== undefined) updateData.description = planData.description;
      if (planData.price !== undefined) updateData.price = planData.price.toString();
      if (planData.durationMonths !== undefined) updateData.durationMonths = planData.durationMonths;
      if (planData.features !== undefined) updateData.features = planData.features;
      if (planData.maxProducts !== undefined) updateData.maxProducts = planData.maxProducts;
      if (planData.maxUsers !== undefined) updateData.maxUsers = planData.maxUsers;
      if (planData.maxStores !== undefined) updateData.maxStores = planData.maxStores;
      if (planData.active !== undefined) updateData.active = planData.active;

      const [updatedPlan] = await db
        .update(subscriptionPlans)
        .set(updateData)
        .where(eq(subscriptionPlans.id, planId))
        .returning();

      if (!updatedPlan) {
        throw new Error('الباقة غير موجودة');
      }

      return updatedPlan;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث الباقة');
    }
  });

  // حذف باقة (Soft Delete)
  ipcMain.handle('subscriptions:delete-plan', async (_, planId: number) => {
    try {
      const [deletedPlan] = await db
        .update(subscriptionPlans)
        .set({ deletedAt: new Date() })
        .where(eq(subscriptionPlans.id, planId))
        .returning();

      if (!deletedPlan) {
        throw new Error('الباقة غير موجودة');
      }

      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف الباقة');
    }
  });

  // ============================================
  // إدارة طلبات الاشتراك (Subscription Requests)
  // ============================================

  // إنشاء طلب اشتراك جديد
  ipcMain.handle('subscriptions:create-request', async (_, requestData: {
    storeId: number;
    planId: number;
    amount: number;
    paymentMethod: 'bank_transfer' | 'cash' | 'card';
    paymentReference?: string;
    paymentReceipt?: string; // Base64 image
    metadata?: Record<string, any>;
  }) => {
    try {
      // التحقق من وجود المتجر
      const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, requestData.storeId))
        .limit(1);

      if (!store) {
        throw new Error('المتجر غير موجود');
      }

      // التحقق من وجود الباقة
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, requestData.planId))
        .limit(1);

      if (!plan) {
        throw new Error('الباقة غير موجودة');
      }

      // إنشاء الطلب
      const [newRequest] = await db
        .insert(subscriptionRequests)
        .values({
          storeId: requestData.storeId,
          planId: requestData.planId,
          amount: requestData.amount.toString(),
          paymentMethod: requestData.paymentMethod,
          paymentReference: requestData.paymentReference || null,
          paymentReceipt: requestData.paymentReceipt || null,
          status: 'pending',
          metadata: requestData.metadata || {},
        })
        .returning();

      return newRequest;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إنشاء طلب الاشتراك');
    }
  });

  // جلب طلبات الاشتراك لمتجر محدد
  ipcMain.handle('subscriptions:get-store-requests', async (_, storeId: number) => {
    try {
      const requests = await db
        .select({
          id: subscriptionRequests.id,
          storeId: subscriptionRequests.storeId,
          planId: subscriptionRequests.planId,
          amount: subscriptionRequests.amount,
          paymentMethod: subscriptionRequests.paymentMethod,
          paymentReference: subscriptionRequests.paymentReference,
          status: subscriptionRequests.status,
          createdAt: subscriptionRequests.createdAt,
          approvedAt: subscriptionRequests.approvedAt,
          plan: {
            id: subscriptionPlans.id,
            name: subscriptionPlans.name,
            displayName: subscriptionPlans.displayName,
            price: subscriptionPlans.price,
            durationMonths: subscriptionPlans.durationMonths,
          },
        })
        .from(subscriptionRequests)
        .leftJoin(subscriptionPlans, eq(subscriptionRequests.planId, subscriptionPlans.id))
        .where(eq(subscriptionRequests.storeId, storeId))
        .orderBy(desc(subscriptionRequests.createdAt));

      return requests;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب طلبات الاشتراك');
    }
  });

  // جلب جميع طلبات الاشتراك (لأدمن المنصة)
  ipcMain.handle('subscriptions:get-all-requests', async () => {
    try {
      const requests = await db
        .select({
          id: subscriptionRequests.id,
          storeId: subscriptionRequests.storeId,
          planId: subscriptionRequests.planId,
          amount: subscriptionRequests.amount,
          paymentMethod: subscriptionRequests.paymentMethod,
          paymentReference: subscriptionRequests.paymentReference,
          status: subscriptionRequests.status,
          createdAt: subscriptionRequests.createdAt,
          approvedAt: subscriptionRequests.approvedAt,
          rejectionReason: subscriptionRequests.rejectionReason,
          store: {
            id: stores.id,
            name: stores.name,
            slug: stores.slug,
          },
          plan: {
            id: subscriptionPlans.id,
            name: subscriptionPlans.name,
            displayName: subscriptionPlans.displayName,
            price: subscriptionPlans.price,
            durationMonths: subscriptionPlans.durationMonths,
          },
          approvedByUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(subscriptionRequests)
        .leftJoin(stores, eq(subscriptionRequests.storeId, stores.id))
        .leftJoin(subscriptionPlans, eq(subscriptionRequests.planId, subscriptionPlans.id))
        .leftJoin(users, eq(subscriptionRequests.approvedBy, users.id))
        .orderBy(desc(subscriptionRequests.createdAt));

      return requests;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب طلبات الاشتراك');
    }
  });

  // الموافقة على طلب اشتراك (لأدمن المنصة)
  ipcMain.handle('subscriptions:approve-request', async (_, requestId: number, adminUserId: number) => {
    try {
      // جلب الطلب
      const [request] = await db
        .select()
        .from(subscriptionRequests)
        .where(eq(subscriptionRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw new Error('طلب الاشتراك غير موجود');
      }

      if (request.status !== 'pending') {
        throw new Error('الطلب غير قيد الانتظار');
      }

      // جلب الباقة
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, request.planId))
        .limit(1);

      if (!plan) {
        throw new Error('الباقة غير موجودة');
      }

      // حساب تاريخ انتهاء الاشتراك
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (plan.durationMonths || 1));

      // تحديث حالة الطلب
      await db
        .update(subscriptionRequests)
        .set({
          status: 'approved',
          approvedBy: adminUserId,
          approvedAt: new Date(),
        })
        .where(eq(subscriptionRequests.id, requestId));

      // تحديث حالة الاشتراك في المتجر
      await db
        .update(stores)
        .set({
          subscriptionPlan: plan.name,
          subscriptionStatus: 'active',
          subscriptionExpiry: expiryDate,
        })
        .where(eq(stores.id, request.storeId));

      return { success: true, expiryDate };
    } catch (error: any) {
      throw new Error(error.message || 'فشل الموافقة على طلب الاشتراك');
    }
  });

  // رفض طلب اشتراك (لأدمن المنصة)
  ipcMain.handle('subscriptions:reject-request', async (_, requestId: number, adminUserId: number, reason?: string) => {
    try {
      const [request] = await db
        .select()
        .from(subscriptionRequests)
        .where(eq(subscriptionRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw new Error('طلب الاشتراك غير موجود');
      }

      if (request.status !== 'pending') {
        throw new Error('الطلب غير قيد الانتظار');
      }

      await db
        .update(subscriptionRequests)
        .set({
          status: 'rejected',
          approvedBy: adminUserId,
          approvedAt: new Date(),
          rejectionReason: reason || null,
        })
        .where(eq(subscriptionRequests.id, requestId));

      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'فشل رفض طلب الاشتراك');
    }
  });
}

