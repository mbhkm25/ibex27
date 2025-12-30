/**
 * Sync Status Component - Displays sync status indicator
 */

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SyncStatusData {
  type: 'initial' | 'periodic' | 'status';
  success?: boolean;
  pulled?: number;
  pushed?: number;
  errors?: string[];
  pendingSales?: number;
  isOnline?: boolean;
  lastSyncAt?: Date | null;
  timestamp: Date;
}

export function SyncStatus({ storeId }: { storeId: number | null }) {
  const [status, setStatus] = useState<SyncStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    // Get initial status
    updateStatus();

    // Listen for sync status updates from main process
    const handleSyncUpdate = (_event: any, data: SyncStatusData) => {
      setStatus(data);
      setIsLoading(false);
    };

    // @ts-ignore - ipcListeners API
    if (window.ipcListeners) {
      // @ts-ignore
      window.ipcListeners.on('sync:status-update', handleSyncUpdate);
    }
    
    // Start auto sync when component mounts
    if (storeId) {
      // @ts-ignore
      window.api?.sync?.startAuto?.(storeId).catch(console.error);
    }

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => {
      // @ts-ignore
      if (window.ipcListeners) {
        // @ts-ignore
        window.ipcListeners.removeListener('sync:status-update', handleSyncUpdate);
      }
      clearInterval(interval);
    };
  }, [storeId]);

  const updateStatus = async () => {
    if (!storeId) return;
    
    try {
      setIsLoading(true);
      // @ts-ignore
      const syncStatus = await window.api.sync.status(storeId);
      setStatus({
        type: 'status',
        isOnline: syncStatus.isOnline,
        pendingSales: syncStatus.pendingSales,
        lastSyncAt: syncStatus.lastSyncAt,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to get sync status:', error);
      setStatus({
        type: 'status',
        isOnline: false,
        pendingSales: 0,
        lastSyncAt: null,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!storeId) return null;

  // Determine status color and icon
  const getStatusInfo = () => {
    if (!status) {
      return { color: 'text-gray-400', icon: CloudOff, text: 'جاري التحميل...' };
    }

    // Check if online
    if (status.isOnline === false) {
      return { color: 'text-red-500', icon: CloudOff, text: 'غير متصل' };
    }

    // Check for errors
    if (status.errors && status.errors.length > 0) {
      return { color: 'text-yellow-500', icon: AlertCircle, text: 'خطأ في المزامنة' };
    }

    // Check for pending sales
    if (status.pendingSales && status.pendingSales > 0) {
      return { 
        color: 'text-yellow-500', 
        icon: AlertCircle, 
        text: `${status.pendingSales} مبيعات معلقة` 
      };
    }

    // All synced
    if (status.success !== false) {
      return { color: 'text-green-500', icon: CheckCircle2, text: 'مزامن' };
    }

    return { color: 'text-gray-400', icon: Cloud, text: 'غير معروف' };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  // Format last sync time
  const formatLastSync = () => {
    if (!status?.lastSyncAt) return 'لم تتم المزامنة';
    const date = new Date(status.lastSyncAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <Icon className={`w-4 h-4 ${statusInfo.color} ${isLoading ? 'animate-pulse' : ''}`} />
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
        {status?.lastSyncAt && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatLastSync()}
          </span>
        )}
      </div>
      {status?.pushed !== undefined && status.pushed > 0 && (
        <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
          +{status.pushed}
        </span>
      )}
    </div>
  );
}

