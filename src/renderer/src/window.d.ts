export interface IElectronAPI {
  loadPreferences: () => Promise<void>
}

export interface IAuthAPI {
  login: (credentials: any) => Promise<any>
  auth: {
    registerMerchant: (data: {
      name: string
      email: string
      phone: string
      password: string
    }) => Promise<{ success: boolean; message: string }>
  }
  inventory: {
    getAll: (storeId: number) => Promise<any[]>
    add: (product: any) => Promise<boolean>
    import: (data: { items: any[]; storeId: number }) => Promise<boolean>
    update: (product: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  sales: {
    create: (data: any) => Promise<{ success: boolean; saleId?: number; error?: string }>
  }
  customerBalance: {
    getRequests: (storeId: number) => Promise<any[]>
    getPendingCount: (storeId: number) => Promise<number>
    approve: (data: any) => Promise<boolean>
    reject: (requestId: number) => Promise<boolean>
  }
  customerAuth: {
    login: (data: any) => Promise<any>
    register: (data: any) => Promise<any>
    approve: (customerId: number) => Promise<boolean>
    reject: (customerId: number) => Promise<boolean>
  }
  stores: {
    getAll: () => Promise<any[]>
    getMerchantStores: (merchantId: number) => Promise<any[]>
    getBySlug: (slug: string) => Promise<any>
    get: (storeId: number) => Promise<any>
    save: (data: any) => Promise<boolean>
    uploadLogo: (data: any) => Promise<boolean>
    requests: {
      getAll: () => Promise<any[]>
      add: (data: any) => Promise<boolean>
      updateStatus: (id: number, status: string) => Promise<boolean>
    }
  }
  expenses: {
    getAll: (storeId: number) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  reports: {
    getDashboard: (storeId: number) => Promise<{
      totalRevenue: number
      salesCount: number
      chartData: any[]
      bestSellers: any[]
      lowStock: any[]
    }>
    getNetProfit: (data: { storeId: number; months?: number }) => Promise<any>
    getInventoryValue: (storeId: number) => Promise<any>
    getSalesVsPurchases: (data: { storeId: number; months?: number }) => Promise<any>
    getExpensesByCategory: (storeId: number) => Promise<any>
    getFinancialAlerts: (storeId: number) => Promise<any>
  }
  duePayments: {
    getAll: (storeId: number) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  categories: {
    getAll: (storeId: number) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  purchases: {
    getAll: (storeId: number) => Promise<any[]>
    create: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  suppliers: {
    getAll: (storeId: number) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  currencies: {
    getAll: () => Promise<any[]>
    getStoreCurrency: (storeId: number) => Promise<any>
    convert: (data: { from: string; to: string; amount: number; fromCurrencyId?: string; toCurrencyId?: string }) => Promise<{ convertedAmount: number; exchangeRate: number }>
  }
  subscriptions: {
    getPlans: () => Promise<any[]>
    getStoreRequests: (storeId: number) => Promise<any[]>
    createRequest: (data: any) => Promise<boolean>
    getAllPlans: () => Promise<any[]>
    updatePlan: (id: number, data: any) => Promise<boolean>
    addPlan: (data: any) => Promise<boolean>
    deletePlan: (id: number) => Promise<boolean>
    getAllRequests: () => Promise<any[]>
    approveRequest: (requestId: number, approvedBy: number) => Promise<boolean>
    rejectRequest: (requestId: number, approvedBy: number, reason: string) => Promise<boolean>
  }
  platformAdmin: {
    getDashboard: () => Promise<any>
    getAllBalanceRequests: (filters?: any) => Promise<any[]>
    getMerchants: () => Promise<any[]>
    updateMerchantStatus: (data: any) => Promise<boolean>
    deleteMerchant: (merchantId: number) => Promise<boolean>
    getAllStores: () => Promise<any[]>
    updateStoreSubscription: (data: any) => Promise<boolean>
    deleteStore: (storeId: number) => Promise<boolean>
    checkSubscription: (storeId: number) => Promise<any>
  }
  audit: {
    getLogs: (filters?: any) => Promise<any[]>
  }
  backup: {
    create: () => Promise<string>
    restore: (filePath: string) => Promise<boolean>
  }
  migrations: {
    run: () => Promise<boolean>
  }
  sync: {
    start: () => Promise<boolean>
    getStatus: () => Promise<any>
  }
  autoSync: {
    enable: () => Promise<boolean>
    disable: () => Promise<boolean>
  }
  reports: {
    getDashboard: (storeId: number) => Promise<{
      totalRevenue: number
      salesCount: number
      chartData: any[]
      bestSellers: any[]
      lowStock: any[]
    }>
    getNetProfit: (data: { storeId: number; months?: number }) => Promise<any>
    getInventoryValue: (storeId: number) => Promise<any>
    getSalesVsPurchases: (data: { storeId: number; months?: number }) => Promise<any>
    getExpensesByCategory: (storeId: number) => Promise<any>
    getFinancialAlerts: (storeId: number) => Promise<any>
  }
  customerPortal: {
    getStores: (customerId: number) => Promise<any[]>
    getStoreDetails: (data: { customerId: number; storeId: number }) => Promise<{
      store: any
      balance: string
    }>
    requestBalance: (data: {
      customerId: number
      storeId: number
      bank: string
      amount: number
      referenceNumber: string
      receiptImage?: string
    }) => Promise<any>
    getTransactions: (data: {
      customerId: number
      storeId: number
      limit?: number
    }) => Promise<any[]>
    getProducts: (storeId: number) => Promise<any[]>
    getOffers: (storeId: number) => Promise<any[]>
    getInvoices: (data: {
      customerId: number
      storeId: number
      limit?: number
    }) => Promise<any[]>
    getPendingOrders: (storeId: number) => Promise<any[]>
    convertOrderToInvoice: (orderId: number) => Promise<any>
    getOrders: (data: { customerId: number; storeId: number; limit?: number }) => Promise<any[]>
    createOrder: (data: any) => Promise<any>
  }
  stores: {
    getAll: () => Promise<any[]>
    getMerchantStores: (merchantId: number) => Promise<any[]>
    getBySlug: (slug: string) => Promise<any>
    get: (storeId: number) => Promise<any>
    save: (data: any) => Promise<boolean>
    uploadLogo: (data: any) => Promise<boolean>
    requests: {
      getAll: () => Promise<any[]>
      add: (data: any) => Promise<boolean>
      updateStatus: (id: number, status: string) => Promise<boolean>
    }
  }
  inventory: {
    getAll: (storeId: number) => Promise<any[]>
    add: (product: any) => Promise<boolean>
    import: (data: { items: any[]; storeId: number }) => Promise<boolean>
    update: (product: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  expenses: {
    getAll: (storeId: number) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  duePayments: {
    getAll: (storeId: number) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
  }
  rents: {
    getAll: (storeId: number) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
    items: {
      getAll: (storeId: number) => Promise<any[]>
      add: (data: any) => Promise<boolean>
      delete: (data: { id: number; storeId: number }) => Promise<boolean>
    }
  }
  hr: {
    getPresences: (storeId: number) => Promise<any[]>
    checkIn: (data: any) => Promise<boolean>
    getSalaries: (storeId: number) => Promise<any[]>
    generateSalary: (data: any) => Promise<boolean>
    getUsers: (storeId: number) => Promise<any[]>
    addUser: (data: any) => Promise<boolean>
  }
  sales: {
    create: (data: any) => Promise<{ success: boolean; saleId?: number; error?: string }>
  }
  customers: {
    getAll: (data?: { storeId: number; search?: string }) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (data: { id: number; storeId: number }) => Promise<boolean>
    getPendingRegistrationsCount: (storeId: number) => Promise<number>
  }
  window: {
    openWithLogin: (type: 'admin' | 'merchant' | 'cashier' | 'customer', title: string) => Promise<{ success: boolean; windowId: number }>
  }
}

declare global {
  interface Window {
    electronAPI?: any
    api: IAuthAPI
  }
}
