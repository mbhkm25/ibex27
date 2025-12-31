import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initWebEnvironment } from './lib/web-adapter'

// Initialize Web API adapter if running in browser
initWebEnvironment();

// Web fallback for API
if (!window.api) {
  window.api = {
    login: () => Promise.reject(new Error('API not available in web mode')),
    auth: {
      registerMerchant: () => Promise.reject(new Error('API not available in web mode')),
    },
    inventory: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      add: () => Promise.reject(new Error('API not available in web mode')),
      import: () => Promise.reject(new Error('API not available in web mode')),
      update: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
    },
    sales: {
      create: () => Promise.reject(new Error('API not available in web mode')),
    },
    customers: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      add: () => Promise.reject(new Error('API not available in web mode')),
      update: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
      getPendingRegistrationsCount: () => Promise.reject(new Error('API not available in web mode')),
    },
    expenses: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      add: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
    },
    reports: {
      getDashboard: () => Promise.reject(new Error('API not available in web mode')),
      getNetProfit: () => Promise.reject(new Error('API not available in web mode')),
      getInventoryValue: () => Promise.reject(new Error('API not available in web mode')),
      getSalesVsPurchases: () => Promise.reject(new Error('API not available in web mode')),
      getExpensesByCategory: () => Promise.reject(new Error('API not available in web mode')),
      getFinancialAlerts: () => Promise.reject(new Error('API not available in web mode')),
    },
    duePayments: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      add: () => Promise.reject(new Error('API not available in web mode')),
      update: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
    },
    rents: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      add: () => Promise.reject(new Error('API not available in web mode')),
      update: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
      items: {
        getAll: () => Promise.reject(new Error('API not available in web mode')),
        add: () => Promise.reject(new Error('API not available in web mode')),
        delete: () => Promise.reject(new Error('API not available in web mode')),
      },
    },
    hr: {
      getPresences: () => Promise.reject(new Error('API not available in web mode')),
      checkIn: () => Promise.reject(new Error('API not available in web mode')),
      getSalaries: () => Promise.reject(new Error('API not available in web mode')),
      generateSalary: () => Promise.reject(new Error('API not available in web mode')),
      getUsers: () => Promise.reject(new Error('API not available in web mode')),
      addUser: () => Promise.reject(new Error('API not available in web mode')),
    },
    stores: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      getMerchantStores: () => Promise.reject(new Error('API not available in web mode')),
      getBySlug: () => Promise.reject(new Error('API not available in web mode')),
      get: () => Promise.reject(new Error('API not available in web mode')),
      save: () => Promise.reject(new Error('API not available in web mode')),
      uploadLogo: () => Promise.reject(new Error('API not available in web mode')),
      requests: {
        getAll: () => Promise.reject(new Error('API not available in web mode')),
        add: () => Promise.reject(new Error('API not available in web mode')),
        updateStatus: () => Promise.reject(new Error('API not available in web mode')),
      },
    },
    customerAuth: {
      register: () => Promise.reject(new Error('API not available in web mode')),
      login: () => Promise.reject(new Error('API not available in web mode')),
      approve: () => Promise.reject(new Error('API not available in web mode')),
      reject: () => Promise.reject(new Error('API not available in web mode')),
    },
    customerPortal: {
      getStores: () => Promise.reject(new Error('API not available in web mode')),
      getStoreDetails: () => Promise.reject(new Error('API not available in web mode')),
      requestBalance: () => Promise.reject(new Error('API not available in web mode')),
      getTransactions: () => Promise.reject(new Error('API not available in web mode')),
      getProducts: () => Promise.reject(new Error('API not available in web mode')),
      getOffers: () => Promise.reject(new Error('API not available in web mode')),
      getInvoices: () => Promise.reject(new Error('API not available in web mode')),
      getPendingOrders: () => Promise.reject(new Error('API not available in web mode')),
      convertOrderToInvoice: () => Promise.reject(new Error('API not available in web mode')),
      getOrders: () => Promise.reject(new Error('API not available in web mode')),
      createOrder: () => Promise.reject(new Error('API not available in web mode')),
    },
    customerBalance: {
      getRequests: () => Promise.reject(new Error('API not available in web mode')),
      getPendingCount: () => Promise.reject(new Error('API not available in web mode')),
      approve: () => Promise.reject(new Error('API not available in web mode')),
      reject: () => Promise.reject(new Error('API not available in web mode')),
    },
    categories: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      add: () => Promise.reject(new Error('API not available in web mode')),
      update: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
    },
    purchases: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      create: () => Promise.reject(new Error('API not available in web mode')),
      update: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
    },
    suppliers: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      add: () => Promise.reject(new Error('API not available in web mode')),
      update: () => Promise.reject(new Error('API not available in web mode')),
      delete: () => Promise.reject(new Error('API not available in web mode')),
    },
    currencies: {
      getAll: () => Promise.reject(new Error('API not available in web mode')),
      getStoreCurrency: () => Promise.reject(new Error('API not available in web mode')),
      convert: () => Promise.reject(new Error('API not available in web mode')),
    },
    subscriptions: {
      getPlans: () => Promise.reject(new Error('API not available in web mode')),
      getStoreRequests: () => Promise.reject(new Error('API not available in web mode')),
      createRequest: () => Promise.reject(new Error('API not available in web mode')),
      getAllPlans: () => Promise.reject(new Error('API not available in web mode')),
      updatePlan: () => Promise.reject(new Error('API not available in web mode')),
      addPlan: () => Promise.reject(new Error('API not available in web mode')),
      deletePlan: () => Promise.reject(new Error('API not available in web mode')),
      getAllRequests: () => Promise.reject(new Error('API not available in web mode')),
      approveRequest: () => Promise.reject(new Error('API not available in web mode')),
      rejectRequest: () => Promise.reject(new Error('API not available in web mode')),
    },
    platformAdmin: {
      getDashboard: () => Promise.reject(new Error('API not available in web mode')),
      getAllBalanceRequests: () => Promise.reject(new Error('API not available in web mode')),
      getMerchants: () => Promise.reject(new Error('API not available in web mode')),
      updateMerchantStatus: () => Promise.reject(new Error('API not available in web mode')),
      deleteMerchant: () => Promise.reject(new Error('API not available in web mode')),
      getAllStores: () => Promise.reject(new Error('API not available in web mode')),
      updateStoreSubscription: () => Promise.reject(new Error('API not available in web mode')),
      deleteStore: () => Promise.reject(new Error('API not available in web mode')),
      checkSubscription: () => Promise.reject(new Error('API not available in web mode')),
    },
    audit: {
      getLogs: () => Promise.reject(new Error('API not available in web mode')),
    },
    backup: {
      create: () => Promise.reject(new Error('API not available in web mode')),
      restore: () => Promise.reject(new Error('API not available in web mode')),
    },
    migrations: {
      run: () => Promise.reject(new Error('API not available in web mode')),
    },
    sync: {
      start: () => Promise.reject(new Error('API not available in web mode')),
      getStatus: () => Promise.reject(new Error('API not available in web mode')),
    },
    autoSync: {
      enable: () => Promise.reject(new Error('API not available in web mode')),
      disable: () => Promise.reject(new Error('API not available in web mode')),
    },
    window: {
      openWithLogin: () => Promise.reject(new Error('API not available in web mode')),
    },
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)


