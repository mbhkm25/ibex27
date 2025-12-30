import { ipcMain } from 'electron';
import { eq, desc } from 'drizzle-orm';
import { db } from './db';
import { stores, requests } from './schema';

export function setupStoreHandlers() {
  // Get store settings (for selected store)
  ipcMain.handle('store:get', async (_, storeId?: number) => {
    if (!storeId) {
      // Try to get from user's storeId
      return null;
    }
    const result = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    return result[0] || null;
  });

  // Save store settings
  ipcMain.handle('store:save', async (_, { storeId, ...data }: any) => {
    if (!storeId) {
      throw new Error('يجب تحديد المتجر');
    }
    
    // Update store with new settings
    await db.update(stores).set(data).where(eq(stores.id, storeId));
    return true;
  });

  // Upload logo (convert image to base64 and save in settings)
  ipcMain.handle('store:upload-logo', async (_, { storeId, imageData }: { storeId: number; imageData: string }) => {
    if (!storeId) {
      throw new Error('يجب تحديد المتجر');
    }

    // Get current store settings
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store) {
      throw new Error('المتجر غير موجود');
    }

    // Update settings with logo (base64 data URL)
    const currentSettings = store.settings || {};
    const updatedSettings = {
      ...currentSettings,
      logo: imageData, // Store as base64 data URL
    };

    await db.update(stores)
      .set({ settings: updatedSettings })
      .where(eq(stores.id, storeId));

    return { success: true, logo: imageData };
  });

  // Requests
  ipcMain.handle('requests:get-all', async () => {
    return await db.select().from(requests).orderBy(desc(requests.createdAt));
  });

  ipcMain.handle('requests:add', async (_, data) => {
    await db.insert(requests).values(data);
    return true;
  });

  ipcMain.handle('requests:update-status', async (_, { id, status }) => {
    await db.update(requests).set({ status }).where(eq(requests.id, id));
    return true;
  });
}

