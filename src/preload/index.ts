import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

console.log('Preload script loaded successfully');

// Custom APIs for renderer
const api = {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  auth: {
    registerMerchant: (data) => ipcRenderer.invoke('auth:register-merchant', data),
  },
  inventory: {
    getAll: (storeId) => ipcRenderer.invoke('inventory:get-all', storeId),
    add: (product) => ipcRenderer.invoke('inventory:add', product),
    import: (data) => ipcRenderer.invoke('inventory:import', data),
    update: (product) => ipcRenderer.invoke('inventory:update', product),
    delete: (data) => ipcRenderer.invoke('inventory:delete', data),
  },
  sales: {
    create: (data) => ipcRenderer.invoke('sales:create', data),
  },
  customers: {
    getAll: (search) => ipcRenderer.invoke('customers:get-all', search),
    add: (data) => ipcRenderer.invoke('customers:add', data),
    update: (data) => ipcRenderer.invoke('customers:update', data),
    delete: (id) => ipcRenderer.invoke('customers:delete', id),
    getPendingRegistrationsCount: (storeId) => ipcRenderer.invoke('customers:get-pending-registrations-count', storeId),
  },
  expenses: {
    getAll: (storeId) => ipcRenderer.invoke('expenses:get-all', storeId),
    add: (data) => ipcRenderer.invoke('expenses:add', data),
    delete: (data) => ipcRenderer.invoke('expenses:delete', data),
  },
  reports: {
    getDashboard: (storeId) => ipcRenderer.invoke('reports:dashboard', storeId),
    getBestSellers: (storeId) => ipcRenderer.invoke('reports:best-sellers', storeId),
    getLowStock: (storeId) => ipcRenderer.invoke('reports:low-stock', storeId),
    getMonthlyRevenue: (storeId) => ipcRenderer.invoke('reports:revenue-monthly', storeId),
    getNetProfit: (data) => ipcRenderer.invoke('reports:net-profit', data),
    getInventoryValue: (storeId) => ipcRenderer.invoke('reports:inventory-value', storeId),
    getSalesVsPurchases: (data) => ipcRenderer.invoke('reports:sales-vs-purchases', data),
    getExpensesByCategory: (storeId) => ipcRenderer.invoke('reports:expenses-by-category', storeId),
    getFinancialAlerts: (storeId) => ipcRenderer.invoke('reports:financial-alerts', storeId),
  },
  duePayments: {
    getAll: (storeId) => ipcRenderer.invoke('due-payments:get-all', storeId),
    add: (data) => ipcRenderer.invoke('due-payments:add', data),
    update: (data) => ipcRenderer.invoke('due-payments:update', data),
    delete: (data) => ipcRenderer.invoke('due-payments:delete', data),
  },
  rents: {
    getAll: (storeId) => ipcRenderer.invoke('rents:get-all', storeId),
    add: (data) => ipcRenderer.invoke('rents:add', data),
    update: (data) => ipcRenderer.invoke('rents:update', data),
    delete: (data) => ipcRenderer.invoke('rents:delete', data),
    items: {
      getAll: (storeId) => ipcRenderer.invoke('rent-items:get-all', storeId),
      add: (data) => ipcRenderer.invoke('rent-items:add', data),
      delete: (data) => ipcRenderer.invoke('rent-items:delete', data),
    }
  },
  hr: {
    getPresences: (storeId) => ipcRenderer.invoke('presence:get-all', storeId),
    checkIn: (data) => ipcRenderer.invoke('presence:check-in', data),
    getSalaries: (storeId) => ipcRenderer.invoke('salaries:get-all', storeId),
    generateSalary: (data) => ipcRenderer.invoke('salaries:generate', data),
    getUsers: (storeId) => ipcRenderer.invoke('users:get-all', storeId),
    addUser: (data) => ipcRenderer.invoke('auth:register', data),
  },
  store: {
    get: (storeId) => ipcRenderer.invoke('store:get', storeId),
    save: (data) => ipcRenderer.invoke('store:save', data),
    uploadLogo: (data) => ipcRenderer.invoke('store:upload-logo', data),
    requests: {
      getAll: () => ipcRenderer.invoke('requests:get-all'),
      add: (data) => ipcRenderer.invoke('requests:add', data),
      updateStatus: (id, status) => ipcRenderer.invoke('requests:update-status', { id, status }),
    }
  },
  // Stores Management (Multi-store support)
  stores: {
    getBySlug: (slug) => ipcRenderer.invoke('stores:get-by-slug', slug),
    getById: (id) => ipcRenderer.invoke('stores:get-by-id', id),
    getMerchantStores: (merchantId) => ipcRenderer.invoke('stores:get-merchant-stores', merchantId),
    create: (data) => ipcRenderer.invoke('stores:create', data),
    update: (data) => ipcRenderer.invoke('stores:update', data),
    delete: (id) => ipcRenderer.invoke('stores:delete', id),
    updateSubscription: (data) => ipcRenderer.invoke('stores:update-subscription', data),
    getAll: () => ipcRenderer.invoke('stores:get-all'),
  },
  // Customer Authentication
  customerAuth: {
    register: (data) => ipcRenderer.invoke('customer-auth:register', data),
    login: (credentials) => ipcRenderer.invoke('customer-auth:login', credentials),
    approve: (customerId) => ipcRenderer.invoke('customer-auth:approve', customerId),
    reject: (customerId) => ipcRenderer.invoke('customer-auth:reject', customerId),
  },
  // Window management
  window: {
    openWithLogin: (type, title) => ipcRenderer.invoke('window:open-with-login', { type, title }),
  },
  // Customer Portal
  customerPortal: {
    getStores: (customerId) => ipcRenderer.invoke('customer-portal:get-stores', customerId),
    getStoreDetails: (data) => ipcRenderer.invoke('customer-portal:get-store-details', data),
    getPendingOrders: (storeId) => ipcRenderer.invoke('customer-portal:get-pending-orders', storeId),
    convertOrderToInvoice: (orderId) => ipcRenderer.invoke('customer-portal:convert-order-to-invoice', orderId),
    requestBalance: (data) => ipcRenderer.invoke('customer-portal:request-balance', data),
    getTransactions: (data) => ipcRenderer.invoke('customer-portal:get-transactions', data),
    getProducts: (storeId) => ipcRenderer.invoke('customer-portal:get-products', storeId),
    getOffers: (storeId) => ipcRenderer.invoke('customer-portal:get-offers', storeId),
    getInvoices: (data) => ipcRenderer.invoke('customer-portal:get-invoices', data),
    createOrder: (data) => ipcRenderer.invoke('customer-portal:create-order', data),
    getOrders: (data) => ipcRenderer.invoke('customer-portal:get-orders', data),
  },
  // Customer Balance Management (Merchant)
  customerBalance: {
    getRequests: (storeId) => ipcRenderer.invoke('customer-balance:get-requests', storeId),
    approve: (data) => ipcRenderer.invoke('customer-balance:approve', data),
    reject: (requestId) => ipcRenderer.invoke('customer-balance:reject', requestId),
    getPendingCount: (storeId) => ipcRenderer.invoke('customer-balance:get-pending-count', storeId),
  },
  // Database Migrations
  migrations: {
    run: () => ipcRenderer.invoke('migrations:run'),
  },
  // Audit Logs
  audit: {
    getLogs: (data) => ipcRenderer.invoke('audit:get-logs', data),
    getEntityLogs: (data) => ipcRenderer.invoke('audit:get-entity-logs', data),
  },
  // Backup
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    download: () => ipcRenderer.invoke('backup:download'),
    getHistory: () => ipcRenderer.invoke('backup:get-history'),
  },
  // Database Connection Test
  db: {
    testConnection: () => ipcRenderer.invoke('db:test-connection'),
    check: () => ipcRenderer.invoke('db:check'),
    cleanup: () => ipcRenderer.invoke('db:cleanup'),
    ensureAdmin: () => ipcRenderer.invoke('db:ensure-admin'),
    setup: () => ipcRenderer.invoke('db:setup'),
  },
  // Platform Admin
  platformAdmin: {
    getMerchants: () => ipcRenderer.invoke('platform-admin:get-merchants'),
    getMerchant: (merchantId) => ipcRenderer.invoke('platform-admin:get-merchant', merchantId),
    updateMerchantStatus: (data) => ipcRenderer.invoke('platform-admin:update-merchant-status', data),
    deleteMerchant: (merchantId) => ipcRenderer.invoke('platform-admin:delete-merchant', merchantId),
    getAllStores: () => ipcRenderer.invoke('platform-admin:get-all-stores'),
    updateStoreSubscription: (data) => ipcRenderer.invoke('platform-admin:update-store-subscription', data),
    deleteStore: (storeId) => ipcRenderer.invoke('platform-admin:delete-store', storeId),
    getDashboard: () => ipcRenderer.invoke('platform-admin:dashboard'),
    getTopStores: (limit) => ipcRenderer.invoke('platform-admin:top-stores', limit),
    getSubscriptionStats: () => ipcRenderer.invoke('platform-admin:subscription-stats'),
    checkSubscription: (storeId) => ipcRenderer.invoke('platform-admin:check-subscription', storeId),
    getAllBalanceRequests: (data) => ipcRenderer.invoke('platform-admin:get-all-balance-requests', data),
  },
  // Currencies
  currencies: {
    getAll: () => ipcRenderer.invoke('currencies:get-all'),
    getById: (currencyId) => ipcRenderer.invoke('currencies:get-by-id', currencyId),
    getStoreCurrency: (storeId) => ipcRenderer.invoke('currencies:get-store-currency', storeId),
    convert: (data) => ipcRenderer.invoke('currencies:convert', data),
  },
  // Purchases & Suppliers
  suppliers: {
    getAll: (storeId) => ipcRenderer.invoke('suppliers:get-all', storeId),
    add: (data) => ipcRenderer.invoke('suppliers:add', data),
    update: (data) => ipcRenderer.invoke('suppliers:update', data),
    delete: (data) => ipcRenderer.invoke('suppliers:delete', data),
  },
  purchases: {
    getAll: (storeId) => ipcRenderer.invoke('purchases:get-all', storeId),
    getById: (data) => ipcRenderer.invoke('purchases:get-by-id', data),
    create: (data) => ipcRenderer.invoke('purchases:create', data),
    update: (data) => ipcRenderer.invoke('purchases:update', data),
    delete: (data) => ipcRenderer.invoke('purchases:delete', data),
  },
  // Categories Management
  categories: {
    getAll: (storeId) => ipcRenderer.invoke('categories:get-all', storeId),
    add: (data) => ipcRenderer.invoke('categories:add', data),
    update: (data) => ipcRenderer.invoke('categories:update', data),
    delete: (data) => ipcRenderer.invoke('categories:delete', data),
  },
  // Subscription Management
  subscriptions: {
    getPlans: () => ipcRenderer.invoke('subscriptions:get-plans'),
    getAllPlans: () => ipcRenderer.invoke('subscriptions:get-all-plans'),
    getPlan: (planId) => ipcRenderer.invoke('subscriptions:get-plan', planId),
    addPlan: (data) => ipcRenderer.invoke('subscriptions:add-plan', data),
    updatePlan: (planId, data) => ipcRenderer.invoke('subscriptions:update-plan', planId, data),
    deletePlan: (planId) => ipcRenderer.invoke('subscriptions:delete-plan', planId),
    createRequest: (data) => ipcRenderer.invoke('subscriptions:create-request', data),
    getStoreRequests: (storeId) => ipcRenderer.invoke('subscriptions:get-store-requests', storeId),
    getAllRequests: () => ipcRenderer.invoke('subscriptions:get-all-requests'),
    approveRequest: (requestId, adminUserId) => ipcRenderer.invoke('subscriptions:approve-request', requestId, adminUserId),
    rejectRequest: (requestId, adminUserId, reason) => ipcRenderer.invoke('subscriptions:reject-request', requestId, adminUserId, reason),
  },
  // Sync Service (Hybrid Architecture)
  sync: {
    full: (storeId) => ipcRenderer.invoke('sync:full', storeId),
    quick: (storeId) => ipcRenderer.invoke('sync:quick', storeId),
    status: (storeId) => ipcRenderer.invoke('sync:status', storeId),
    startAuto: (storeId) => ipcRenderer.invoke('sync:start-auto', storeId),
    stopAuto: () => ipcRenderer.invoke('sync:stop-auto'),
    updateStatus: (storeId) => ipcRenderer.invoke('sync:update-status', storeId),
  }
}

// Expose IPC listeners for sync status updates
const ipcListeners = {
  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  removeListener: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('ipcListeners', ipcListeners)
    console.log('APIs exposed to Main World', { hasAuth: !!api.auth, hasRegisterMerchant: !!api.auth?.registerMerchant });
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.ipcListeners = ipcListeners
  console.log('APIs exposed to Main World (non-isolated)', { hasAuth: !!api.auth, hasRegisterMerchant: !!api.auth?.registerMerchant });
}
