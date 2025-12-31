/**
 * Web API Adapter
 * هذا الملف يقوم بتهيئة window.api عند التشغيل في المتصفح
 * ليعمل التطبيق بدون Electron IPC
 */

const API_BASE_URL = '/api'; // سيتم توجيهه إلى Vercel Serverless Functions

export function setupWebApi() {
  console.log('🌐 Initializing Web API Adapter...');

  const api: any = {
    // محاكاة تسجيل الدخول (سيتم ربطها بـ API لاحقاً)
    customerAuth: {
      login: async (credentials) => {
        console.log('Web Login:', credentials);
        // TODO: Call /api/auth/login
        return { 
          customer: { id: 1, name: 'Web User', token: 'mock-token' }, 
          stores: [] 
        };
      },
      register: async (data) => {
        console.log('Web Register:', data);
        return { success: true };
      }
    },

    // بوابة العميل
    customerPortal: {
      getStoreDetails: async (data) => {
        // Mock data or Fetch from API
        const response = await fetch(`${API_BASE_URL}/stores/${data.storeId}`);
        if (!response.ok) throw new Error('Failed to fetch store');
        return response.json();
      },
      getProducts: async (_storeId) => {
        // Mock data for demo
        return []; 
      },
      createOrder: async (data) => {
        console.log('Create Order:', data);
        return { success: true, orderId: 999 };
      }
    },

    // وظائف النافذة (غير موجودة في الويب، نعطلها أو نوجهها)
    window: {
      openWithLogin: async () => {
        console.warn('Window management is not available in Web version');
        return { success: false };
      }
    }
  };

  // حقن الـ API في الـ window
  // @ts-ignore
  window.api = api;
  console.log('✅ Web API injected into window.api');
}

