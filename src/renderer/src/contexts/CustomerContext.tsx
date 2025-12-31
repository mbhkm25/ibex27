import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string | null;
  registrationStatus: string;
  createdAt: Date;
}

interface CustomerStore {
  id: number;
  name: string;
  description?: string | null;
  balance: string;
  settings?: {
    currencyId?: string;
  };
  registeredAt: Date;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CustomerContextType {
  customer: Customer | null;
  stores: CustomerStore[];
  cart: CartItem[];
  selectedStore: CustomerStore | null;
  loading: boolean;
  setCustomer: (customer: Customer | null) => void;
  setStores: (stores: CustomerStore[]) => void;
  setSelectedStore: (store: CustomerStore | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateCartItem: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadCustomerData: () => Promise<void>;
  logout: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stores, setStores] = useState<CustomerStore[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<CustomerStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, []);

  useEffect(() => {
    // Save cart to localStorage
    if (selectedStore) {
      localStorage.setItem(`cart_${selectedStore.id}`, JSON.stringify(cart));
    }
  }, [cart, selectedStore]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const customerData = localStorage.getItem('customer');
      if (!customerData) {
        setLoading(false);
        return;
      }

      const customerObj: Customer = JSON.parse(customerData);
      setCustomer(customerObj);

      // Load stores
      const storesData = await window.api.customerPortal.getStores(customerObj.id);

      setStores(storesData);

      // Load saved cart if store is selected
      const savedStoreId = localStorage.getItem('selectedStoreId');
      if (savedStoreId && storesData.length > 0) {
        const store = storesData.find((s: CustomerStore) => s.id === parseInt(savedStoreId));
        if (store) {
          setSelectedStore(store);
          const savedCart = localStorage.getItem(`cart_${store.id}`);
          if (savedCart) {
            setCart(JSON.parse(savedCart));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.productId === item.productId);
      if (existingItem) {
        return prevCart.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, item.stock) }
            : i
        );
      }
      return [...prevCart, item];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((i) => i.productId !== productId));
  };

  const updateCartItem = (productId: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    if (selectedStore) {
      localStorage.removeItem(`cart_${selectedStore.id}`);
    }
  };

  const logout = () => {
    setCustomer(null);
    setStores([]);
    setCart([]);
    setSelectedStore(null);
    localStorage.removeItem('customer');
    localStorage.removeItem('customerStores');
    localStorage.removeItem('selectedStoreId');
    // Clear all cart data
    stores.forEach((store) => {
      localStorage.removeItem(`cart_${store.id}`);
    });
    window.location.href = '/#/customer/login';
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        stores,
        cart,
        selectedStore,
        loading,
        setCustomer,
        setStores,
        setSelectedStore,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        loadCustomerData,
        logout,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

