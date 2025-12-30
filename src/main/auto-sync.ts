/**
 * Auto Sync Service - Background synchronization
 * Handles automatic syncing on app start and periodic syncing
 */

import { BrowserWindow } from 'electron';
import { syncAll, quickSync, getSyncStatus } from './sync-service';

let syncInterval: NodeJS.Timeout | null = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start automatic background sync
 */
export function startAutoSync(storeId: number | null, mainWindow: BrowserWindow | null) {
  // Stop existing interval if any
  stopAutoSync();

  if (!storeId || !mainWindow) {
    console.log('⚠️  Auto sync: No storeId or window, skipping auto sync');
    return;
  }

  console.log('🔄 Starting auto sync for store:', storeId);

  // Initial sync on app start (full sync)
  performInitialSync(storeId, mainWindow);

  // Periodic quick sync every 5 minutes
  syncInterval = setInterval(() => {
    performQuickSync(storeId, mainWindow);
  }, SYNC_INTERVAL_MS);

  console.log('✅ Auto sync started (every 5 minutes)');
}

/**
 * Stop automatic sync
 */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️  Auto sync stopped');
  }
}

/**
 * Perform initial full sync on app start
 */
async function performInitialSync(storeId: number, mainWindow: BrowserWindow) {
  try {
    console.log('🔄 Performing initial sync...');
    const result = await syncAll(storeId);
    
    // Send sync status to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync:status-update', {
        type: 'initial',
        success: result.success,
        pulled: result.pulled,
        pushed: result.pushed,
        errors: result.errors,
        timestamp: new Date(),
      });
    }

    if (result.success) {
      console.log(`✅ Initial sync completed: ${result.pulled} pulled, ${result.pushed} pushed`);
    } else {
      console.warn(`⚠️  Initial sync completed with errors:`, result.errors);
    }
  } catch (error: any) {
    console.error('❌ Initial sync failed:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync:status-update', {
        type: 'initial',
        success: false,
        errors: [error.message],
        timestamp: new Date(),
      });
    }
  }
}

/**
 * Perform periodic quick sync (push only)
 */
async function performQuickSync(storeId: number, mainWindow: BrowserWindow) {
  try {
    console.log('🔄 Performing quick sync...');
    const result = await quickSync(storeId);
    
    // Get current sync status
    const status = await getSyncStatus(storeId);
    
    // Send sync status to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync:status-update', {
        type: 'periodic',
        success: result.success,
        pushed: result.pushed,
        errors: result.errors,
        pendingSales: status.pendingSales,
        isOnline: status.isOnline,
        lastSyncAt: status.lastSyncAt,
        timestamp: new Date(),
      });
    }

    if (result.success && result.pushed > 0) {
      console.log(`✅ Quick sync completed: ${result.pushed} sales pushed`);
    } else if (result.success) {
      console.log('✅ Quick sync: No pending sales');
    } else {
      console.warn(`⚠️  Quick sync completed with errors:`, result.errors);
    }
  } catch (error: any) {
    console.error('❌ Quick sync failed:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync:status-update', {
        type: 'periodic',
        success: false,
        errors: [error.message],
        timestamp: new Date(),
      });
    }
  }
}

/**
 * Get current sync status and send to renderer
 */
export async function updateSyncStatus(storeId: number | null, mainWindow: BrowserWindow | null) {
  if (!storeId || !mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  try {
    const status = await getSyncStatus(storeId);
    mainWindow.webContents.send('sync:status-update', {
      type: 'status',
      pendingSales: status.pendingSales,
      isOnline: status.isOnline,
      lastSyncAt: status.lastSyncAt,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❌ Failed to update sync status:', error);
  }
}

