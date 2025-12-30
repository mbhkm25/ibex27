import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StoreSelector from '../components/common/StoreSelector';
import SubscriptionCheck from '../components/SubscriptionCheck';
import { SyncStatus } from '../components/SyncStatus';
import { useStore } from '../contexts/StoreContext';

const Layout = () => {
  const [user, setUser] = useState<any>(null);
  const { selectedStore } = useStore();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('selectedStoreId');
    localStorage.removeItem('selectedStore');
    window.location.href = '/#/login';
  };

  // Check if user needs store selection
  const needsStoreSelection = user && ['merchant', 'cashier'].includes(user.role) && !selectedStore;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Store Selector and Logout Button */}
        <header className="bg-white shadow-sm border-b flex-shrink-0 px-6 py-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              {user && (
                <p className="text-sm text-gray-600">
                  مرحباً، <span className="font-medium text-gray-800">{user.name}</span>
                </p>
              )}
              {/* Store Selector */}
              {user && ['merchant', 'cashier', 'platform_admin'].includes(user.role) && (
                <StoreSelector />
              )}
              {/* Sync Status Indicator */}
              {user && ['merchant', 'cashier'].includes(user.role) && selectedStore && (
                <SyncStatus storeId={selectedStore.id} />
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </header>
        
        {/* Alert if store not selected */}
        {needsStoreSelection && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <p className="text-sm text-yellow-800">
              ⚠️ يرجى اختيار متجر من القائمة أعلاه للمتابعة
            </p>
          </div>
        )}
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {user && ['merchant', 'cashier'].includes(user.role) ? (
            <SubscriptionCheck>
              <Outlet />
            </SubscriptionCheck>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;

