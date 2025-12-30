import { ipcMain } from 'electron';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import { purchases, purchaseItems, products, suppliers, duePayments } from './schema';

export function setupPurchasesHandlers() {
  // ============================================
  // Suppliers Handlers
  // ============================================

  // Get all suppliers (filtered by storeId)
  ipcMain.handle('suppliers:get-all', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      return await db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.storeId, storeId),
            isNull(suppliers.deletedAt)
          )
        )
        .orderBy(desc(suppliers.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة الموردين');
    }
  });

  // Add supplier (requires storeId)
  ipcMain.handle('suppliers:add', async (_, data) => {
    try {
      if (!data.storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      await db.insert(suppliers).values({
        ...data,
        storeId: data.storeId,
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إضافة المورد');
    }
  });

  // Update supplier - verify storeId matches
  ipcMain.handle('suppliers:update', async (_, { id, storeId, ...data }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Verify supplier belongs to store
      const supplier = await db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.id, id),
            eq(suppliers.storeId, storeId),
            isNull(suppliers.deletedAt)
          )
        )
        .limit(1);

      if (supplier.length === 0) {
        throw new Error('المورد غير موجود أو لا ينتمي لهذا المتجر');
      }

      await db.update(suppliers).set(data).where(eq(suppliers.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث المورد');
    }
  });

  // Delete supplier (soft delete) - verify storeId matches
  ipcMain.handle('suppliers:delete', async (_, { id, storeId }: { id: number; storeId: number }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Verify supplier belongs to store
      const supplier = await db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.id, id),
            eq(suppliers.storeId, storeId),
            isNull(suppliers.deletedAt)
          )
        )
        .limit(1);

      if (supplier.length === 0) {
        throw new Error('المورد غير موجود أو لا ينتمي لهذا المتجر');
      }

      // Soft delete
      await db
        .update(suppliers)
        .set({ deletedAt: new Date() })
        .where(eq(suppliers.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف المورد');
    }
  });

  // ============================================
  // Purchases Handlers
  // ============================================

  // Get all purchases (filtered by storeId)
  ipcMain.handle('purchases:get-all', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      const purchasesList = await db
        .select({
          purchase: purchases,
          supplier: suppliers,
        })
        .from(purchases)
        .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
        .where(
          and(
            eq(purchases.storeId, storeId),
            isNull(purchases.deletedAt)
          )
        )
        .orderBy(desc(purchases.createdAt));

      // Get items for each purchase
      const purchasesWithItems = await Promise.all(
        purchasesList.map(async (p) => {
          const items = await db
            .select({
              item: purchaseItems,
              product: products,
            })
            .from(purchaseItems)
            .leftJoin(products, eq(purchaseItems.productId, products.id))
            .where(eq(purchaseItems.purchaseId, p.purchase.id));

          return {
            ...p.purchase,
            supplier: p.supplier,
            items: items.map(i => ({
              ...i.item,
              product: i.product,
            })),
          };
        })
      );

      return purchasesWithItems;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة المشتريات');
    }
  });

  // Get single purchase with items
  ipcMain.handle('purchases:get-by-id', async (_, { id, storeId }: { id: number; storeId: number }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      const [purchaseData] = await db
        .select({
          purchase: purchases,
          supplier: suppliers,
        })
        .from(purchases)
        .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.storeId, storeId),
            isNull(purchases.deletedAt)
          )
        )
        .limit(1);

      if (!purchaseData) {
        throw new Error('الشراء غير موجود أو لا ينتمي لهذا المتجر');
      }

      const items = await db
        .select({
          item: purchaseItems,
          product: products,
        })
        .from(purchaseItems)
        .leftJoin(products, eq(purchaseItems.productId, products.id))
        .where(eq(purchaseItems.purchaseId, id));

      return {
        ...purchaseData.purchase,
        supplier: purchaseData.supplier,
        items: items.map(i => ({
          ...i.item,
          product: i.product,
        })),
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب بيانات الشراء');
    }
  });

  // Create purchase (requires storeId) - with transaction
  ipcMain.handle('purchases:create', async (_, { storeId, items, supplierId, paymentType, dueDate, invoiceNumber, notes, userId }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      if (!items || items.length === 0) {
        throw new Error('يجب إضافة منتج واحد على الأقل');
      }

      // Validate payment type
      if (paymentType === 'due' && !dueDate) {
        throw new Error('يجب تحديد تاريخ الاستحقاق للفواتير الآجلة');
      }

      // Calculate total
      const total = items.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.cost) * parseInt(item.quantity));
      }, 0);

      // Use transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // 1. Create purchase record
        const [purchase] = await tx
          .insert(purchases)
          .values({
            storeId,
            supplierId: supplierId || null,
            total: total.toString(),
            paymentType: paymentType || 'cash',
            purchaseDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            invoiceNumber: invoiceNumber || null,
            notes: notes || null,
            userId: userId || null,
          })
          .returning();

        // 2. Add purchase items and update product stock/cost
        for (const item of items) {
          // Validate product exists and belongs to store
          const [product] = await tx
            .select()
            .from(products)
            .where(
              and(
                eq(products.id, item.productId),
                eq(products.storeId, storeId),
                isNull(products.deletedAt)
              )
            )
            .limit(1);

          if (!product) {
            throw new Error(`المنتج ${item.productId} غير موجود أو لا ينتمي لهذا المتجر`);
          }

          // Insert purchase item
          await tx.insert(purchaseItems).values({
            purchaseId: purchase.id,
            productId: item.productId,
            quantity: item.quantity,
            cost: item.cost.toString(),
            total: (item.quantity * parseFloat(item.cost)).toString(),
          });

          // Update product stock and cost
          // For cost: use weighted average if product already has stock, otherwise use new cost
          const currentStock = parseInt(product.stock?.toString() || '0');
          const currentCost = parseFloat(product.cost?.toString() || '0');
          const newCost = parseFloat(item.cost);
          const newQuantity = parseInt(item.quantity);

          let updatedCost = newCost;
          if (currentStock > 0 && currentCost > 0) {
            // Weighted average: (currentStock * currentCost + newQuantity * newCost) / (currentStock + newQuantity)
            const totalCurrentValue = currentStock * currentCost;
            const totalNewValue = newQuantity * newCost;
            const totalStock = currentStock + newQuantity;
            updatedCost = (totalCurrentValue + totalNewValue) / totalStock;
          }

          // Increase stock and update cost
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${newQuantity}`,
              cost: updatedCost.toString(),
            })
            .where(eq(products.id, item.productId));
        }

        // 3. Create due payment record if payment type is 'due'
        if (paymentType === 'due' && supplierId) {
          // Get supplier name
          const [supplier] = await tx
            .select()
            .from(suppliers)
            .where(eq(suppliers.id, supplierId))
            .limit(1);

          if (supplier) {
            await tx.insert(duePayments).values({
              storeId,
              customerId: null, // Supplier due payments don't have customerId
              name: supplier.name,
              invoice: invoiceNumber || `PURCHASE-${purchase.id}`,
              itemName: 'فاتورة شراء',
              itemAmount: items.length,
              amount: total.toString(),
              status: 'unpaid',
              note: notes || `فاتورة شراء رقم ${purchase.id}`,
              dateIn: new Date(),
              dueDate: dueDate ? new Date(dueDate) : new Date(),
            });
          }
        }

        return { purchaseId: purchase.id, success: true };
      });
    } catch (error: any) {
      console.error('Purchase creation error:', error);
      throw new Error(error.message || 'فشل إتمام عملية الشراء');
    }
  });

  // Update purchase - verify storeId matches
  ipcMain.handle('purchases:update', async (_, { id, storeId, ...data }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Verify purchase belongs to store
      const purchase = await db
        .select()
        .from(purchases)
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.storeId, storeId),
            isNull(purchases.deletedAt)
          )
        )
        .limit(1);

      if (purchase.length === 0) {
        throw new Error('الشراء غير موجود أو لا ينتمي لهذا المتجر');
      }

      const updateData: any = { ...data };
      if (data.total) updateData.total = data.total.toString();
      if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
      if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

      await db.update(purchases).set(updateData).where(eq(purchases.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث الشراء');
    }
  });

  // Delete purchase (soft delete) - verify storeId matches
  ipcMain.handle('purchases:delete', async (_, { id, storeId }: { id: number; storeId: number }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Verify purchase belongs to store
      const purchase = await db
        .select()
        .from(purchases)
        .where(
          and(
            eq(purchases.id, id),
            eq(purchases.storeId, storeId),
            isNull(purchases.deletedAt)
          )
        )
        .limit(1);

      if (purchase.length === 0) {
        throw new Error('الشراء غير موجود أو لا ينتمي لهذا المتجر');
      }

      // Soft delete
      await db
        .update(purchases)
        .set({ deletedAt: new Date() })
        .where(eq(purchases.id, id));
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل حذف الشراء');
    }
  });
}

