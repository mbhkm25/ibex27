/**
 * Web Adapter for IBEX27
 * هذا الملف يعمل كبديل لـ preload/index.ts عند العمل في بيئة المتصفح.
 * يقوم بتوجيه الطلبات إلى Vercel Serverless Functions
 */

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

async function apiCall(endpoint: string, method: 'GET' | 'POST' = 'POST', body?: any) {
  const response = await fetch(`${API_BASE}/api/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

export const initWebEnvironment = () => {
  console.log('🌐 Initializing Web Adapter for Browser Environment');

  // تعريف الـ API البديل للمتصفح
  (window as any).api = {
    // تسجيل الدخول (للعميل)
    customerAuth: {
      login: async (credentials: { phone: string; password: string }) => {
        return apiCall('customer-auth/login', 'POST', credentials);
      },
      register: async (data: any) => {
        // TODO: Create register endpoint
        console.log('Web Auth Register:', data);
        throw new Error('Registration endpoint not implemented yet');
      },
      approve: async () => {
        throw new Error('Not available in web version');
      },
      reject: async () => {
        throw new Error('Not available in web version');
      },
    },

    // بوابة العميل
    customerPortal: {
      getStores: async (customerId: number) => {
        // TODO: Create get-stores endpoint
        return [];
      },
      getStoreDetails: async (data: { customerId: number; storeId: number }) => {
        return apiCall('customer-portal/get-store-details', 'POST', data);
      },
      getProducts: async (storeId: number) => {
        return apiCall(`customer-portal/get-products?storeId=${storeId}`, 'GET');
      },
      getOffers: async (storeId: number) => {
        // TODO: Create get-offers endpoint
        return [];
      },
      getTransactions: async (data: { customerId: number; storeId: number }) => {
        // TODO: Create get-transactions endpoint
        return [];
      },
      getInvoices: async (data: { customerId: number; storeId: number }) => {
        // TODO: Create get-invoices endpoint
        return [];
      },
      getOrders: async (data: { customerId: number; storeId: number }) => {
        return apiCall('customer-portal/get-orders', 'POST', data);
      },
      getPendingOrders: async (storeId: number) => {
        // TODO: Create get-pending-orders endpoint
        return [];
      },
      createOrder: async (order: any) => {
        // TODO: Create create-order endpoint
        console.log('Create Order (Web):', order);
        throw new Error('Create order endpoint not implemented yet');
      },
      convertOrderToInvoice: async () => {
        throw new Error('Not available in web version');
      },
      requestBalance: async () => {
        // TODO: Create request-balance endpoint
        throw new Error('Request balance endpoint not implemented yet');
      },
    },

    // تسجيل الدخول للمديرين والتجار (Merchant/Admin)
    login: async (credentials: { email: string; password: string }) => {
      const user = await apiCall('auth/login', 'POST', credentials);
      // Save to localStorage for session management
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', user.id?.toString() || ''); // Simple token (user ID)
      }
      return user;
    },
    
    // الحصول على بيانات المستخدم الحالي
    getCurrentUser: async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return null;
      }
      
      try {
        const user = JSON.parse(userStr);
        // Optionally verify with server
        if (user.id) {
          try {
            const verifiedUser = await apiCall('auth/get-user', 'POST', { userId: user.id });
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify(verifiedUser));
            return verifiedUser;
          } catch (error) {
            // If verification fails, return cached user
            console.warn('Failed to verify user, using cached data:', error);
            return user;
          }
        }
        return user;
      } catch (error) {
        console.error('Failed to parse user:', error);
        return null;
      }
    },
    
    // تسجيل الخروج
    logout: async () => {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('selectedStoreId');
      localStorage.removeItem('selectedStore');
      return true;
    },
    
    inventory: { getAll: async () => [] },
    sales: { create: async () => {} },
    customers: { getAll: async () => [] },
    
    // Window management (No-op in web)
    window: {
      openWithLogin: async () => {
        console.log('Window open ignored in web');
        return { success: false };
      },
    },
  };

  // تعريف المستمعين (Listeners)
  (window as any).ipcListeners = {
    on: (channel: string, callback: Function) => {
      console.log(`Listen on ${channel} (Web Mock)`);
    },
    removeListener: () => {},
  };
};
