# 📦 ملاحظة: نظام المشتريات المستقبلي

## ✅ التأكد من التوافق مع Multi-Store

عند إضافة نظام المشتريات (Purchases) في المستقبل، يجب التأكد من:

### 1. Schema Design
```typescript
// في schema.ts - يجب إضافة:
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(), // ✅ مهم جداً
  supplierId: integer('supplier_id'), // اختياري
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow(),
  notes: text('notes'),
  deletedAt: timestamp('deleted_at'), // Soft Delete
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseItems = pgTable('purchase_items', {
  id: serial('id').primaryKey(),
  purchaseId: integer('purchase_id').references(() => purchases.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
});
```

### 2. Backend Handler Pattern
```typescript
// في purchases.ts - اتبع نفس نمط inventory.ts:

export function setupPurchasesHandlers() {
  // Get all purchases (filtered by storeId)
  ipcMain.handle('purchases:get-all', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      return await db
        .select()
        .from(purchases)
        .where(
          and(
            eq(purchases.storeId, storeId),
            isNull(purchases.deletedAt)
          )
        )
        .orderBy(desc(purchases.createdAt));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المشتريات');
    }
  });

  // Create purchase (requires storeId)
  ipcMain.handle('purchases:create', async (_, { storeId, items, ...data }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Use transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // 1. Create purchase record
        const [purchase] = await tx
          .insert(purchases)
          .values({
            storeId,
            ...data,
            total: data.total.toString(),
          })
          .returning();

        // 2. Add purchase items and increase stock
        for (const item of items) {
          // Insert purchase item
          await tx.insert(purchaseItems).values({
            purchaseId: purchase.id,
            productId: item.productId,
            quantity: item.quantity,
            cost: item.cost.toString(),
            total: (item.quantity * parseFloat(item.cost)).toString(),
          });

          // Increase product stock (for the same store)
          await tx
            .update(products)
            .set({ 
              stock: sql`${products.stock} + ${item.quantity}`,
              cost: item.cost.toString() // Update cost
            })
            .where(
              and(
                eq(products.id, item.productId),
                eq(products.storeId, storeId) // ✅ مهم: تأكد من أن المنتج ينتمي لنفس المتجر
              )
            );
        }

        return { purchaseId: purchase.id, success: true };
      });
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || 'فشل إتمام عملية الشراء');
    }
  });
}
```

### 3. Frontend Integration
```typescript
// في Purchases.tsx - استخدم useStore hook:

import { useStore } from '../contexts/StoreContext';

const PurchasesPage = () => {
  const { selectedStore } = useStore();

  const loadPurchases = async () => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    const data = await window.api.purchases.getAll(selectedStore.id);
    // ...
  };

  const handleCreatePurchase = async (purchaseData) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }

    await window.api.purchases.create({
      ...purchaseData,
      storeId: selectedStore.id, // ✅ مهم: تمرير storeId
      items: purchaseData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        cost: item.cost,
      }))
    });
  };
};
```

### 4. Preload API
```typescript
// في preload/index.ts - أضف:

purchases: {
  getAll: (storeId) => ipcRenderer.invoke('purchases:get-all', storeId),
  create: (data) => ipcRenderer.invoke('purchases:create', data),
  update: (data) => ipcRenderer.invoke('purchases:update', data),
  delete: (data) => ipcRenderer.invoke('purchases:delete', data),
},
```

## 🔑 النقاط المهمة

1. **storeId مطلوب دائماً**: جميع عمليات المشتريات يجب أن ترتبط بـ `storeId`
2. **زيادة المخزون**: عند الشراء، يجب زيادة `stock` للمنتجات في نفس المتجر فقط
3. **Transaction Safety**: استخدم `db.transaction` لضمان أن الشراء وزيادة المخزون يحدثان معاً
4. **Validation**: تحقق من أن المنتج ينتمي لنفس المتجر قبل زيادة المخزون
5. **Soft Delete**: استخدم `deletedAt` للحذف الناعم

## 📝 مثال كامل

```typescript
// عند شراء 10 وحدات من منتج ID=5 في متجر ID=1:

await window.api.purchases.create({
  storeId: 1, // ✅ المتجر المختار
  items: [
    {
      productId: 5,
      quantity: 10,
      cost: 50.00
    }
  ],
  total: 500.00,
  supplierId: null,
  notes: 'شراء عادي'
});

// النتيجة:
// 1. يتم إنشاء سجل في purchases
// 2. يتم إنشاء سجل في purchaseItems
// 3. يتم زيادة stock للمنتج 5 في المتجر 1 فقط
// 4. يتم تحديث cost للمنتج
```

---

**تاريخ الإنشاء:** 2024  
**الحالة:** ✅ جاهز للتطبيق عند إضافة نظام المشتريات

