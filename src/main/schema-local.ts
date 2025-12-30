/**
 * SQLite Schema for Local Cashier Database
 * This is a simplified version of the main schema for offline use
 * Only includes essential tables needed for cashier operations
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Categories Table (Local cache)
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  // Sync metadata
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  cloudId: integer('cloud_id'), // ID from Neon database
});

// Products Table (Local cache for cashier)
export const products = sqliteTable('products', {
  id: integer('id').primaryKey(),
  storeId: integer('store_id').notNull(),
  name: text('name').notNull(),
  barcode: text('barcode'),
  price: real('price').notNull(),
  cost: real('cost').default(0),
  stock: integer('stock').default(0),
  categoryId: integer('category_id'), // Reference to categories
  category: text('category'), // Keep for backward compatibility
  showInPortal: integer('show_in_portal', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  // Sync metadata
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  cloudId: integer('cloud_id'), // ID from Neon database
});

// Sales Table (Local transactions)
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull(),
  customerId: integer('customer_id'),
  total: real('total').notNull(),
  paymentMethod: text('payment_method').default('cash'),
  userId: integer('user_id').notNull(),
  currencyId: text('currency_id'),
  exchangeRate: real('exchange_rate'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  // Sync metadata
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  cloudId: integer('cloud_id'), // ID from Neon database after sync
  syncStatus: text('sync_status').default('pending'), // 'pending' | 'synced' | 'error'
});

// Sale Items Table
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
  total: real('total').notNull(),
});

// Customers Table (Local cache)
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp'),
  password: text('password').notNull(),
  registrationStatus: text('registration_status').default('pending'),
  balance: real('balance').default(0),
  allowCredit: integer('allow_credit', { mode: 'boolean' }).default(false),
  creditLimit: real('credit_limit').default(0),
  ktp: text('ktp'),
  dob: integer('dob', { mode: 'timestamp' }),
  notes: text('notes'),
  status: integer('status', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  // Sync metadata
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  cloudId: integer('cloud_id'),
});

// Sync Queue Table (Tracks what needs to be synced)
export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tableName: text('table_name').notNull(), // 'sales', 'products', etc.
  recordId: integer('record_id').notNull(), // Local ID
  operation: text('operation').notNull(), // 'insert' | 'update' | 'delete'
  data: text('data'), // JSON string of the record
  status: text('status').default('pending'), // 'pending' | 'synced' | 'error'
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  retryCount: integer('retry_count').default(0),
});

// Store Info Table (Cached store information)
export const storeInfo = sqliteTable('store_info', {
  id: integer('id').primaryKey(),
  storeId: integer('store_id').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  settings: text('settings'), // JSON string
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

