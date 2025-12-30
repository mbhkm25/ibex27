/**
 * Sync Service - Synchronizes data between SQLite (local) and Neon (cloud)
 * Handles offline-first architecture with automatic sync when online
 */

import { eq, and, isNull, desc } from 'drizzle-orm';
import { localDb } from './db-local';
import { db } from './db';
import { products as localProducts, sales as localSales, customers as localCustomers, categories as localCategories, storeInfo } from './schema-local';
import { products as cloudProducts, sales as cloudSales, customers as cloudCustomers, categories as cloudCategories, saleItems as cloudSaleItems } from './schema';
import { saleItems as localSaleItems } from './schema-local';

interface SyncResult {
  success: boolean;
  pulled: number;
  pushed: number;
  errors: string[];
}

/**
 * Check if internet connection is available
 */
async function checkInternetConnection(): Promise<boolean> {
  try {
    // Try to ping a reliable server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal as any,
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Pull categories from cloud to local
 */
async function pullCategories(storeId: number): Promise<number> {
  try {
    // Get categories from cloud
    const cloudCategoriesList = await db
      .select()
      .from(cloudCategories)
      .where(and(
        eq(cloudCategories.storeId, storeId),
        isNull(cloudCategories.deletedAt)
      ));

    let syncedCount = 0;

    for (const category of cloudCategoriesList) {
      // Check if category exists locally
      const existing = await localDb
        .select()
        .from(localCategories)
        .where(eq(localCategories.cloudId, category.id))
        .limit(1);

      const categoryData = {
        id: category.id,
        storeId: category.storeId,
        name: category.name,
        createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
        deletedAt: category.deletedAt ? new Date(category.deletedAt) : null,
        syncedAt: new Date(),
        cloudId: category.id,
      };

      if (existing.length > 0) {
        // Update existing
        await localDb
          .update(localCategories)
          .set(categoryData)
          .where(eq(localCategories.cloudId, category.id));
      } else {
        // Insert new
        await localDb.insert(localCategories).values(categoryData);
      }

      syncedCount++;
    }

    console.log(`✅ Pulled ${syncedCount} categories from cloud`);
    return syncedCount;
  } catch (error: any) {
    console.error('❌ Error pulling categories:', error);
    throw error;
  }
}

/**
 * Pull products from cloud to local
 */
async function pullProducts(storeId: number): Promise<number> {
  try {
    // Get products from cloud
    const cloudProductsList = await db
      .select()
      .from(cloudProducts)
      .where(and(
        eq(cloudProducts.storeId, storeId),
        isNull(cloudProducts.deletedAt)
      ));

    let syncedCount = 0;

    for (const product of cloudProductsList) {
      // Check if product exists locally
      const existing = await localDb
        .select()
        .from(localProducts)
        .where(eq(localProducts.cloudId, product.id))
        .limit(1);

      const productData = {
        id: product.id,
        storeId: product.storeId,
        name: product.name,
        barcode: product.barcode || null,
        price: parseFloat(product.price),
        cost: product.cost ? parseFloat(product.cost) : 0,
        stock: product.stock || 0,
        categoryId: product.categoryId || null,
        category: product.category || null, // Keep for backward compatibility
        showInPortal: product.showInPortal ?? true,
        createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        deletedAt: product.deletedAt ? new Date(product.deletedAt) : null,
        syncedAt: new Date(),
        cloudId: product.id,
      };

      if (existing.length > 0) {
        // Update existing
        await localDb
          .update(localProducts)
          .set(productData)
          .where(eq(localProducts.cloudId, product.id));
      } else {
        // Insert new
        await localDb.insert(localProducts).values(productData);
      }

      syncedCount++;
    }

    console.log(`✅ Pulled ${syncedCount} products from cloud`);
    return syncedCount;
  } catch (error: any) {
    console.error('❌ Error pulling products:', error);
    throw error;
  }
}

/**
 * Pull customers from cloud to local
 */
async function pullCustomers(_storeId: number): Promise<number> {
  try {
    // Get customers from cloud (those registered in this store)
    const cloudCustomersList = await db
      .select()
      .from(cloudCustomers)
      .where(isNull(cloudCustomers.deletedAt));

    let syncedCount = 0;

    for (const customer of cloudCustomersList) {
      const existing = await localDb
        .select()
        .from(localCustomers)
        .where(eq(localCustomers.cloudId, customer.id))
        .limit(1);

      const customerData = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        whatsapp: customer.whatsapp || null,
        password: customer.password,
        registrationStatus: customer.registrationStatus || 'pending',
        balance: customer.balance ? parseFloat(customer.balance) : 0,
        allowCredit: customer.allowCredit ?? false,
        creditLimit: customer.creditLimit ? parseFloat(customer.creditLimit) : 0,
        ktp: customer.ktp || null,
        dob: customer.dob ? new Date(customer.dob) : null,
        notes: customer.notes || null,
        status: customer.status ?? true,
        createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
        deletedAt: customer.deletedAt ? new Date(customer.deletedAt) : null,
        syncedAt: new Date(),
        cloudId: customer.id,
      };

      if (existing.length > 0) {
        await localDb
          .update(localCustomers)
          .set(customerData)
          .where(eq(localCustomers.cloudId, customer.id));
      } else {
        await localDb.insert(localCustomers).values(customerData);
      }

      syncedCount++;
    }

    console.log(`✅ Pulled ${syncedCount} customers from cloud`);
    return syncedCount;
  } catch (error: any) {
    console.error('❌ Error pulling customers:', error);
    throw error;
  }
}

/**
 * Push sales from local to cloud
 */
async function pushSales(storeId: number): Promise<number> {
  try {
    // Get unsynced sales from local
    const unsyncedSales = await localDb
      .select()
      .from(localSales)
      .where(and(
        eq(localSales.storeId, storeId),
        eq(localSales.syncStatus, 'pending'),
        isNull(localSales.deletedAt)
      ))
      .orderBy(desc(localSales.createdAt));

    let syncedCount = 0;
    const errors: string[] = [];

    for (const sale of unsyncedSales) {
      try {
        // Get sale items
        const items = await localDb
          .select()
          .from(localSaleItems)
          .where(eq(localSaleItems.saleId, sale.id));

        // Insert sale into cloud
        const [insertedSale] = await db
          .insert(cloudSales)
          .values({
            storeId: sale.storeId,
            customerId: sale.customerId || null,
            total: sale.total.toString(),
            paymentMethod: sale.paymentMethod || 'cash',
            userId: sale.userId,
            currencyId: sale.currencyId || null,
            exchangeRate: sale.exchangeRate ? sale.exchangeRate.toString() : null,
            createdAt: sale.createdAt,
            deletedAt: sale.deletedAt || null,
          })
          .returning();

        // Insert sale items
        for (const item of items) {
          await db.insert(cloudSaleItems).values({
            saleId: insertedSale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString(),
            total: item.total.toString(),
          });
        }

        // Update local sale with cloud ID and sync status
        await localDb
          .update(localSales)
          .set({
            cloudId: insertedSale.id,
            syncStatus: 'synced',
            syncedAt: new Date(),
          })
          .where(eq(localSales.id, sale.id));

        syncedCount++;
      } catch (error: any) {
        errors.push(`Sale ${sale.id}: ${error.message}`);
        // Update sync status to error
        await localDb
          .update(localSales)
          .set({
            syncStatus: 'error',
          })
          .where(eq(localSales.id, sale.id));
      }
    }

    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} sales failed to sync:`, errors);
    }

    console.log(`✅ Pushed ${syncedCount} sales to cloud`);
    return syncedCount;
  } catch (error: any) {
    console.error('❌ Error pushing sales:', error);
    throw error;
  }
}

/**
 * Full sync: Pull from cloud and push to cloud
 */
export async function syncAll(storeId: number): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    pulled: 0,
    pushed: 0,
    errors: [],
  };

  try {
    console.log('🔄 Starting sync for store:', storeId);

    // Check internet connection
    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      throw new Error('لا يوجد اتصال بالإنترنت');
    }

    // Pull data from cloud
    try {
      const categoriesCount = await pullCategories(storeId);
      result.pulled += categoriesCount;
    } catch (error: any) {
      result.errors.push(`Categories pull: ${error.message}`);
    }

    try {
      const productsCount = await pullProducts(storeId);
      result.pulled += productsCount;
    } catch (error: any) {
      result.errors.push(`Products pull: ${error.message}`);
    }

    try {
      const customersCount = await pullCustomers(storeId);
      result.pulled += customersCount;
    } catch (error: any) {
      result.errors.push(`Customers pull: ${error.message}`);
    }

    // Push data to cloud
    try {
      const salesCount = await pushSales(storeId);
      result.pushed += salesCount;
    } catch (error: any) {
      result.errors.push(`Sales push: ${error.message}`);
    }

    // Update store info last sync time
    try {
      const existing = await localDb
        .select()
        .from(storeInfo)
        .where(eq(storeInfo.storeId, storeId))
        .limit(1);

      if (existing.length > 0) {
        await localDb
          .update(storeInfo)
          .set({
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(storeInfo.storeId, storeId));
      }
    } catch (error) {
      // Ignore store info update errors
    }

    result.success = result.errors.length === 0;
    console.log('✅ Sync completed:', result);
    return result;
  } catch (error: any) {
    result.errors.push(error.message);
    result.success = false;
    console.error('❌ Sync failed:', error);
    return result;
  }
}

/**
 * Quick sync: Only push pending sales (for background sync)
 */
export async function quickSync(storeId: number): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    pulled: 0,
    pushed: 0,
    errors: [],
  };

  try {
    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      throw new Error('لا يوجد اتصال بالإنترنت');
    }

    const salesCount = await pushSales(storeId);
    result.pushed += salesCount;
    result.success = true;

    return result;
  } catch (error: any) {
    result.errors.push(error.message);
    result.success = false;
    return result;
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus(storeId: number): Promise<{
  lastSyncAt: Date | null;
  pendingSales: number;
  isOnline: boolean;
}> {
  try {
    const store = await localDb
      .select()
      .from(storeInfo)
      .where(eq(storeInfo.storeId, storeId))
      .limit(1);

    const pendingSales = await localDb
      .select()
      .from(localSales)
      .where(and(
        eq(localSales.storeId, storeId),
        eq(localSales.syncStatus, 'pending'),
        isNull(localSales.deletedAt)
      ));

    const isOnline = await checkInternetConnection();

    return {
      lastSyncAt: store[0]?.lastSyncAt || null,
      pendingSales: pendingSales.length,
      isOnline,
    };
  } catch (error) {
    return {
      lastSyncAt: null,
      pendingSales: 0,
      isOnline: false,
    };
  }
}

