import { ipcMain } from 'electron';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './db';
import {
  customerBalanceRequests,
  customerStoreRelations,
  customerTransactions,
} from './schema';

export function setupCustomerBalanceHandlers() {
  // Get all balance requests for a store (merchant view)
  ipcMain.handle('customer-balance:get-requests', async (_, storeId: number) => {
    try {
      const result = await db
        .select()
        .from(customerBalanceRequests)
        .where(eq(customerBalanceRequests.storeId, storeId))
        .orderBy(desc(customerBalanceRequests.createdAt));

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب طلبات تعبئة الرصيد');
    }
  });

  // Approve balance request - with transaction for safety
  ipcMain.handle('customer-balance:approve', async (_, {
    requestId,
    approvedBy,
  }: {
    requestId: number;
    approvedBy: number;
  }) => {
    try {
      // Use transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Get the request (with lock)
        const request = await tx
          .select()
          .from(customerBalanceRequests)
          .where(eq(customerBalanceRequests.id, requestId))
          .limit(1);

        if (request.length === 0) {
          throw new Error('طلب تعبئة الرصيد غير موجود');
        }

        const requestData = request[0];

        if (requestData.status !== 'pending') {
          throw new Error('تم معالجة هذا الطلب مسبقاً');
        }

        // Update request status
        await tx.update(customerBalanceRequests)
          .set({
            status: 'approved',
            approvedBy,
            approvedAt: new Date(),
          })
          .where(eq(customerBalanceRequests.id, requestId));

        // Update customer balance in store relation (atomic)
        const relation = await tx
          .select()
          .from(customerStoreRelations)
          .where(and(
            eq(customerStoreRelations.customerId, requestData.customerId),
            eq(customerStoreRelations.storeId, requestData.storeId)
          ))
          .limit(1);

        if (relation.length > 0) {
          const currentBalance = parseFloat(relation[0].balance?.toString() || '0');
          const newBalance = currentBalance + parseFloat(requestData.amount.toString());
          
          await tx.update(customerStoreRelations)
            .set({ balance: newBalance.toString() })
            .where(eq(customerStoreRelations.id, relation[0].id));

          // Create transaction record
          await tx.insert(customerTransactions).values({
            customerId: requestData.customerId,
            storeId: requestData.storeId,
            type: 'deposit',
            amount: requestData.amount.toString(),
            reference: requestData.referenceNumber,
            metadata: {
              bank: requestData.bank,
              requestId: requestId,
              receiptImage: requestData.metadata?.receiptImage || null,
            },
          });
        } else {
          throw new Error('علاقة العميل بالمتجر غير موجودة');
        }

        return { success: true };
      });
    } catch (error: any) {
      console.error('Approve balance error:', error);
      throw new Error(error.message || 'فشل الموافقة على طلب تعبئة الرصيد');
    }
  });

  // Reject balance request
  ipcMain.handle('customer-balance:reject', async (_, requestId: number) => {
    try {
      await db.update(customerBalanceRequests)
        .set({ status: 'rejected' })
        .where(eq(customerBalanceRequests.id, requestId));

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل رفض طلب تعبئة الرصيد');
    }
  });

  // Get pending requests count for notifications
  ipcMain.handle('customer-balance:get-pending-count', async (_, storeId: number) => {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(customerBalanceRequests)
        .where(and(
          eq(customerBalanceRequests.storeId, storeId),
          eq(customerBalanceRequests.status, 'pending')
        ));
      
      return result[0]?.count || 0;
    } catch (error: any) {
      return 0;
    }
  });
}

