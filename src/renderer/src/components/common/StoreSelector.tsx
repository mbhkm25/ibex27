import React, { useState, useEffect } from 'react';
import { Store, ChevronDown, AlertCircle } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';

const StoreSelector: React.FC = () => {
  const { selectedStore, stores, loading, setSelectedStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  // Don't show for customers
  if (!user || !['merchant', 'cashier', 'platform_admin'].includes(user.role)) {
    return null;
  }

  const handleStoreSelect = (store: typeof stores[0]) => {
    setSelectedStore(store);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">جاري التحميل...</span>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="text-yellow-600" size={18} />
        <span className="text-sm text-yellow-700">لا توجد متاجر متاحة</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <Store className="text-blue-600" size={18} />
        <span className="flex-1 text-right text-sm font-medium text-gray-800">
          {selectedStore ? selectedStore.name : 'اختر متجر'}
        </span>
        <ChevronDown
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          size={18}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreSelect(store)}
                className={`w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  selectedStore?.id === store.id
                    ? 'bg-blue-50 border-r-4 border-blue-600'
                    : ''
                }`}
              >
                <Store
                  className={
                    selectedStore?.id === store.id
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }
                  size={18}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {store.name}
                  </p>
                  {store.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {store.description}
                    </p>
                  )}
                </div>
                {selectedStore?.id === store.id && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StoreSelector;

