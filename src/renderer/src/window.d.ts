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
    getAll: () => Promise<any[]>
    add: (product: any) => Promise<boolean>
    import: (items: any[]) => Promise<boolean>
    update: (product: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
  }
  sales: {
    create: (data: any) => Promise<boolean>
  }
  customers: {
    getAll: (search?: string) => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
  }
  expenses: {
    getAll: () => Promise<any[]>
    add: (data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
  }
  reports: {
    getDashboard: () => Promise<{
      totalRevenue: number
      salesCount: number
      chartData: any[]
      bestSellers: any[]
      lowStock: any[]
    }>
  }
  duePayments: {
    getAll: () => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
  }
  rents: {
    getAll: () => Promise<any[]>
    add: (data: any) => Promise<boolean>
    update: (data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
    items: {
      getAll: () => Promise<any[]>
      add: (data: any) => Promise<boolean>
      delete: (id: number) => Promise<boolean>
    }
  }
  hr: {
    getPresences: () => Promise<any[]>
    checkIn: (data: any) => Promise<boolean>
    getSalaries: () => Promise<any[]>
    generateSalary: (data: any) => Promise<boolean>
    getUsers: () => Promise<any[]>
    addUser: (data: any) => Promise<boolean>
  }
  store: {
    get: () => Promise<any>
    save: (data: any) => Promise<boolean>
    requests: {
      getAll: () => Promise<any[]>
      add: (data: any) => Promise<boolean>
      updateStatus: (id: number, status: string) => Promise<boolean>
    }
  }
  stores: {
    getBySlug: (slug: string) => Promise<any>
    getById: (id: number) => Promise<any>
    getMerchantStores: (merchantId: number) => Promise<any[]>
    create: (data: any) => Promise<any>
    update: (data: any) => Promise<boolean>
    delete: (id: number) => Promise<boolean>
    updateSubscription: (data: { id: number; status: string; plan?: string }) => Promise<boolean>
    getAll: () => Promise<any[]>
  }
  customerAuth: {
    register: (data: {
      name: string
      phone: string
      whatsapp?: string
      password: string
      storeSlug: string
    }) => Promise<{ success: boolean; message: string; customerId: number }>
    login: (credentials: { phone: string; password: string }) => Promise<{
      customer: any
      stores: any[]
    }>
    approve: (customerId: number) => Promise<boolean>
    reject: (customerId: number) => Promise<boolean>
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
  }
  customerBalance: {
    getRequests: (storeId: number) => Promise<any[]>
    approve: (data: { requestId: number; approvedBy: number }) => Promise<boolean>
    reject: (requestId: number) => Promise<boolean>
  }
  window: {
    openWithLogin: (type: 'admin' | 'merchant' | 'cashier' | 'customer', title: string) => Promise<{ success: boolean; windowId: number }>
  }
}

declare global {
  interface Window {
    electron: IElectronAPI
    api: IAuthAPI
  }
}
