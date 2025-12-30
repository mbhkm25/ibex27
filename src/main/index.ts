import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupAuthHandlers, checkAndSeedAdmin } from './auth'
import { setupInventoryHandlers } from './inventory'
import { setupSalesHandlers } from './sales'
import { setupCustomersHandlers } from './customers'
import { setupExpensesHandlers } from './expenses'
import { setupReportsHandlers } from './reports'
import { setupDuePaymentHandlers } from './due_payments'
import { setupRentHandlers } from './rents'
import { setupHRHandlers } from './hr'
import { setupStoreHandlers } from './store'
import { setupStoresHandlers } from './stores'
import { setupCustomerAuthHandlers } from './customer-auth'
import { setupCustomerPortalHandlers } from './customer-portal'
import { setupCustomerBalanceHandlers } from './customer-balance'
import { runMigrations, setupMigrationsHandlers } from './migrations'
import { setupPlatformAdminHandlers } from './platform-admin'
import { setupSubscriptionHandlers } from './subscriptions'
import { setupDatabase } from './db-setup'
import { testConnection } from './db'
import { setupCurrenciesHandlers } from './currencies'
import { setupPurchasesHandlers } from './purchases'
import { setupCategoriesHandlers } from './categories'
import { setupAuditHandlers } from './audit'
import { setupBackupHandlers } from './backup'
import { setupSyncHandlers } from './sync-handlers'
import { initLocalDatabase } from './db-local'
import { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  
  mainWindow = window;

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  return window;
}

/**
 * Create a new window with auto-login
 */
function createWindowWithLogin(type: 'admin' | 'merchant' | 'cashier' | 'customer', title: string): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    title: title,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      partition: `persist:${type}-${Date.now()}` // Separate session for each window
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  // Load the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Auto-login when window is ready
  window.webContents.once('did-finish-load', () => {
    // Wait a bit for React to initialize
    setTimeout(() => {
      let loginScript: string;
      
      if (type === 'customer') {
        loginScript = `
          (async () => {
            try {
              const customerData = await window.api.customerAuth.login({
                phone: '771234567',
                password: 'customer123'
              });
              localStorage.setItem('customer', JSON.stringify(customerData.customer));
              localStorage.setItem('customerStores', JSON.stringify(customerData.stores));
              window.location.hash = '#/customer/dashboard';
              window.location.reload();
            } catch (error) {
              console.error('Auto-login failed:', error);
            }
          })();
        `;
      } else {
        const email = type === 'admin' ? 'admin@ibex.com' : type === 'merchant' ? 'merchant@example.com' : 'cashier@example.com';
        const password = type === 'admin' ? 'admin123' : type === 'merchant' ? 'merchant123' : 'cashier123';
        const route = type === 'admin' ? '/admin' : '/';
        
        loginScript = `
          (async () => {
            try {
              const user = await window.api.login({ email: '${email}', password: '${password}' });
              localStorage.setItem('user', JSON.stringify(user));
              window.location.hash = '#${route}';
              window.location.reload();
            } catch (error) {
              console.error('Auto-login failed:', error);
            }
          })();
        `;
      }
      
      window.webContents.executeJavaScript(loginScript);
    }, 1500);
  });

  return window;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Setup Migrations Handler
  setupMigrationsHandlers()
  
  // Setup database connection test handler
  ipcMain.handle('db:test-connection', async () => {
    const connected = await testConnection();
    return { connected, message: connected ? 'الاتصال بقاعدة البيانات ناجح' : 'فشل الاتصال بقاعدة البيانات' };
  });

  // Handler to create new window with auto-login
  ipcMain.handle('window:open-with-login', async (_, { type, title }: { type: 'admin' | 'merchant' | 'cashier' | 'customer', title: string }) => {
    const window = createWindowWithLogin(type, title);
    return { success: true, windowId: window.id };
  });
  
  // Test database connection first
  testConnection().then((connected) => {
    if (!connected) {
      console.error('❌ Database connection failed! Please check your connection string.');
      console.error('Connection string location: src/main/db.ts');
    }
    
    // Run database migrations
    return runMigrations();
  }).then(() => {
    // Setup Auth Handlers
    setupAuthHandlers()
    setupInventoryHandlers()
    setupSalesHandlers()
    setupCustomersHandlers()
    setupExpensesHandlers()
    setupReportsHandlers()
    setupDuePaymentHandlers()
    setupRentHandlers()
    setupHRHandlers()
    setupStoreHandlers()
    setupAuditHandlers()
    setupBackupHandlers()
    
    // Setup New Platform Handlers
    setupStoresHandlers()
    setupCustomerAuthHandlers()
    setupCustomerPortalHandlers()
    setupCustomerBalanceHandlers()
    setupPlatformAdminHandlers()
    setupSubscriptionHandlers()
    setupCurrenciesHandlers()
    setupPurchasesHandlers()
    setupCategoriesHandlers()
    setupSyncHandlers(mainWindow)
    
    // Initialize local SQLite database for offline mode
    try {
      initLocalDatabase()
      console.log('✅ Local SQLite database initialized')
    } catch (error) {
      console.warn('⚠️  Failed to initialize local database:', error)
    }
    
    // Setup database: check, cleanup, and ensure admin
    setupDatabase().then((result) => {
      console.log('📊 Database Setup Summary:');
      console.log(`  - Connected: ${result.check.connected}`);
      console.log(`  - Tables: ${result.check.tables.length}`);
      console.log(`  - Missing Tables: ${result.check.missingTables.length}`);
      console.log(`  - Unused Tables Removed: ${result.cleanup.removed.length}`);
      console.log(`  - Admin User: ${result.admin.created ? 'Created' : 'Exists'}`);
    }).catch((error) => {
      console.error('Database setup error:', error);
    });

    // Try to seed initial user (fallback)
    checkAndSeedAdmin()
    
    // Seed test users for development
    import('./auth').then(({ seedTestUsers }) => {
      seedTestUsers().catch((error) => {
        console.error('Failed to seed test users:', error);
      });
    })

    createWindow()
  }).catch((error) => {
    console.error('Failed to initialize app:', error)
    // Still create window even if migrations fail (for development)
    createWindow()
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


