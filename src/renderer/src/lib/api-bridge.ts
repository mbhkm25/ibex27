import { isElectron } from './is-electron';

// هذه الواجهة ستكون الوسيط بين الواجهة الأمامية ومصدر البيانات
// في سطح المكتب: تستخدم window.api (Electron IPC)
// في الويب: ستستخدم استدعاءات HTTP مباشرة لقاعدة البيانات أو Serverless Functions

export const getApi = () => {
  if (isElectron()) {
    return (window as any).api;
  }

  // Web Implementation (Mock/Direct Implementation for Web)
  // هنا سنضع منطق الاتصال بـ Neon مباشرة أو عبر API
  return {
    // محاكاة لبعض الوظائف الأساسية للويب
    customerPortal: {
      getStoreDetails: async (data: any) => {
        // TODO: Replace with fetch call to Vercel API
        console.log('Web: Fetching store details', data);
        return {};
      },
      getProducts: async (storeId: number) => {
        console.log('Web: Fetching products', storeId);
        return [];
      }
      // ... سيتم تنفيذ الباقي لاحقاً
    },
    // الوظائف التي لا تعمل في الويب تعود بـ null أو ترمي خطأ
    window: {
      openWithLogin: () => console.warn('Not supported in Web'),
    }
  };
};

