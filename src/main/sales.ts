import { ipcMain } from 'electron';
import { eq, sql, and } from 'drizzle-orm';
import { db } from './db';
import { sales, saleItems, products, customerStoreRelations, customerTransactions, duePayments } from './schema';

export function setupSalesHandlers() {
  ipcMain.handle('sales:create', async (_, { 
    items, 
    total, 
    paymentMethod, 
    userId, 
    storeId, 
    customerId,
    currencyId,
    exchangeRate 
  }) => {
    try {
      // Use database transaction to ensure atomicity (all or nothing)
      const result = await db.transaction(async (tx) => {
        // 1. Validate stock availability first (before any changes)
        for (const item of items) {
          const [product] = await tx
            .select()
            .from(products)
            .where(and(eq(products.id, item.id), eq(products.storeId, storeId)))
            .limit(1);

          if (!product) {
            throw new Error(`المنتج ${item.id} غير موجود في هذا المتجر`);
          }

          const currentStock = product.stock || 0;
          if (currentStock < item.quantity) {
            throw new Error(`المخزون غير كافي للمنتج ${product.name}. المتوفر: ${currentStock}, المطلوب: ${item.quantity}`);
          }
        }

        // 2. Validate and deduct customer balance if using balance payment or credit
        let balanceAmount = 0;
        if (customerId && storeId && (paymentMethod === 'customer_balance' || paymentMethod === 'mixed' || paymentMethod === 'credit')) {
          // Get customer store relation (should be locked in transaction)
          const [relation] = await tx
            .select()
            .from(customerStoreRelations)
            .where(
              and(
                eq(customerStoreRelations.customerId, customerId),
                eq(customerStoreRelations.storeId, storeId),
                eq(customerStoreRelations.status, 'active')
              )
            )
            .limit(1);

          if (!relation) {
            throw new Error('العميل غير مسجل في هذا المتجر أو غير نشط');
          }

          // Calculate balance amount based on payment method
          if (paymentMethod === 'credit') {
            // For credit, we don't deduct balance, but we create a due payment record
            balanceAmount = 0;
          } else {
            balanceAmount = paymentMethod === 'customer_balance' 
              ? total 
              : paymentMethod === 'mixed' 
                ? (total * 0.5) // 50% from balance, 50% cash
                : 0;

            if (balanceAmount > 0) {
              const currentBalance = parseFloat((relation.balance || '0').toString());
              
              // Validate balance sufficiency BEFORE any changes
              if (currentBalance < balanceAmount) {
                throw new Error(`رصيد العميل غير كافي. الرصيد المتاح: ${currentBalance.toFixed(2)} ر.س، المطلوب: ${balanceAmount.toFixed(2)} ر.س`);
              }

              // Update customer balance (atomic operation within transaction)
              const newBalance = currentBalance - balanceAmount;
              await tx
                .update(customerStoreRelations)
                .set({ balance: newBalance.toString() })
                .where(eq(customerStoreRelations.id, relation.id));
            }
          }
        }

        // 3. Create Sale Record
        const [sale] = await tx.insert(sales).values({
          storeId,
          customerId: customerId || null,
          total: total.toString(),
          paymentMethod,
          userId,
          currencyId: currencyId || null,
          exchangeRate: exchangeRate ? exchangeRate.toString() : null,
        }).returning();

        // 4. Add Sale Items and Update Stock (atomic operations)
        for (const item of items) {
          // Insert sale item
          await tx.insert(saleItems).values({
            saleId: sale.id,
            productId: item.id,
            quantity: item.quantity,
            price: item.price.toString(),
            total: (item.price * item.quantity).toString()
          });

          // Decrease stock atomically
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(eq(products.id, item.id));
        }

        // 5. Create customer transaction record (if balance was used)
        if (balanceAmount > 0 && customerId && storeId) {
          await tx.insert(customerTransactions).values({
            customerId,
            storeId,
            type: 'invoice',
            amount: balanceAmount.toString(),
            reference: `SALE-${sale.id}`,
            metadata: {
              saleId: sale.id,
              paymentMethod,
              totalAmount: total.toString(),
              cashAmount: paymentMethod === 'mixed' ? (total - balanceAmount).toString() : '0',
              balanceAmount: balanceAmount.toString(),
            },
          });
        }

        // 6. Create due payment record if payment method is credit
        if (paymentMethod === 'credit' && customerId && storeId) {
          await tx.insert(duePayments).values({
            storeId,
            customerId, // Link to customer
            name: `فاتورة بيع آجل رقم ${sale.id}`,
            invoice: `SALE-${sale.id}`,
            amount: total.toString(),
            status: 'unpaid',
            dateIn: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            note: `فاتورة بيع آجل للعميل ${customerId}`,
          });
        }

        // Return sale info for frontend
        return {
          saleId: sale.id,
          success: true,
          balanceUsed: balanceAmount,
        };
      });

      return result;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || 'فشل إتمام عملية البيع');
    }
  });
}

