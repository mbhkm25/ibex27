import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Store {
  id: number;
  merchantId: number;
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  subscriptionPlan: any;
  subscriptionStatus: string;
  subscriptionExpiry: Date | null;
  bankAccounts: any[];
  contactInfo: any;
  settings: any;
  currencyId?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
}

interface StoreContextType {
  selectedStore: Store | null;
  stores: Store[];
  loading: boolean;
  setSelectedStore: (store: Store | null) => void;
  loadStores: () => Promise<void>;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // Load stores from API
  const loadStores = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setStores([]);
        setSelectedStoreState(null);
        return;
      }

      const user = JSON.parse(userStr);
      
      // Only load stores for merchant, cashier, or platform_admin
      if (!['merchant', 'cashier', 'platform_admin'].includes(user.role)) {
        setStores([]);
        setSelectedStoreState(null);
        return;
      }

      // For platform_admin, get all stores
      if (user.role === 'platform_admin') {
        const allStores = await window.api.stores.getAll();
        setStores(allStores);
        
        // Load selected store from localStorage or select first one
        const savedStoreId = localStorage.getItem('selectedStoreId');
        if (savedStoreId) {
          const store = allStores.find((s: Store) => s.id === parseInt(savedStoreId));
          if (store) {
            setSelectedStoreState(store);
            localStorage.setItem('selectedStore', JSON.stringify(store));
            return;
          }
        }
        
        // Auto-select first store if available
        if (allStores.length > 0) {
          setSelectedStoreState(allStores[0]);
          localStorage.setItem('selectedStoreId', allStores[0].id.toString());
          localStorage.setItem('selectedStore', JSON.stringify(allStores[0]));
        }
        return;
      }

      // For merchant and cashier, get their stores
      const merchantStores = await window.api.stores.getMerchantStores(user.id);
      setStores(merchantStores);

      // Load selected store from localStorage or select first one
      const savedStoreId = localStorage.getItem('selectedStoreId');
      if (savedStoreId) {
        const store = merchantStores.find((s: Store) => s.id === parseInt(savedStoreId));
        if (store) {
          setSelectedStoreState(store);
          localStorage.setItem('selectedStore', JSON.stringify(store));
          return;
        }
      }

      // Auto-select first store if available
      if (merchantStores.length > 0) {
        setSelectedStoreState(merchantStores[0]);
        localStorage.setItem('selectedStoreId', merchantStores[0].id.toString());
        localStorage.setItem('selectedStore', JSON.stringify(merchantStores[0]));
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
      setStores([]);
      setSelectedStoreState(null);
    } finally {
      setLoading(false);
    }
  };

  // Set selected store and save to localStorage
  const setSelectedStore = (store: Store | null) => {
    setSelectedStoreState(store);
    if (store) {
      localStorage.setItem('selectedStoreId', store.id.toString());
      localStorage.setItem('selectedStore', JSON.stringify(store));
    } else {
      localStorage.removeItem('selectedStoreId');
      localStorage.removeItem('selectedStore');
    }
  };

  // Refresh stores list
  const refreshStores = async () => {
    await loadStores();
  };

  // Load stores on mount
  useEffect(() => {
    // Try to load from localStorage first
    const savedStore = localStorage.getItem('selectedStore');
    if (savedStore) {
      try {
        const store = JSON.parse(savedStore);
        setSelectedStoreState(store);
      } catch (e) {
        console.error('Failed to parse saved store:', e);
      }
    }

    // Then load from API
    loadStores();
  }, []);

  // Reload stores when user changes
  useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        loadStores();
      } else {
        setStores([]);
        setSelectedStoreState(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        selectedStore,
        stores,
        loading,
        setSelectedStore,
        loadStores,
        refreshStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

