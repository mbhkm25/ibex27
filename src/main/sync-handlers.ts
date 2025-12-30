/**
 * IPC Handlers for Sync Service
 */

import { ipcMain } from 'electron';
import { syncAll, quickSync, getSyncStatus } from './sync-service';
import { startAutoSync, stopAutoSync, updateSyncStatus } from './auto-sync';
import { BrowserWindow } from 'electron';

let mainWindowRef: BrowserWindow | null = null;

export function setupSyncHandlers(mainWindow?: BrowserWindow | null) {
  if (mainWindow) {
    mainWindowRef = mainWindow;
  }

  // Full sync (pull + push)
  ipcMain.handle('sync:full', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد معرف المتجر');
      }
      return await syncAll(storeId);
    } catch (error: any) {
      throw new Error(error.message || 'فشل المزامنة');
    }
  });

  // Quick sync (push only)
  ipcMain.handle('sync:quick', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد معرف المتجر');
      }
      return await quickSync(storeId);
    } catch (error: any) {
      throw new Error(error.message || 'فشل المزامنة السريعة');
    }
  });

  // Get sync status
  ipcMain.handle('sync:status', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد معرف المتجر');
      }
      return await getSyncStatus(storeId);
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب حالة المزامنة');
    }
  });

  // Start auto sync
  ipcMain.handle('sync:start-auto', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد معرف المتجر');
      }
      startAutoSync(storeId, mainWindowRef);
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'فشل بدء المزامنة التلقائية');
    }
  });

  // Stop auto sync
  ipcMain.handle('sync:stop-auto', async () => {
    stopAutoSync();
    return { success: true };
  });

  // Update sync status (manual trigger)
  ipcMain.handle('sync:update-status', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد معرف المتجر');
      }
      await updateSyncStatus(storeId, mainWindowRef);
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحديث حالة المزامنة');
    }
  });
}

