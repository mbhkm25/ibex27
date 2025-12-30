import { pgTable, serial, text, timestamp, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';

// ============================================
// Platform Core Tables
// ============================================

// Currencies Table
export const currencies = pgTable('currencies', {
  id: text('id').primaryKey(), // SAR, YER, USD
  code: text('code').notNull(),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Users Table (Updated with roles and store relation)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'), // 'platform_admin' | 'merchant' | 'cashier' | 'customer'
  storeId: integer('store_id'), // For merchants and cashiers - will reference stores.id (defined below)
  status: text('status').default('active'), // 'active' | 'suspended' | 'pending'
  subscriptionStatus: text('subscription_status'), // 'active' | 'expired' | 'pending' | 'cancelled'
  subscriptionExpiry: timestamp('subscription_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Stores Table (Multi-tenant support)
export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  merchantId: integer('merchant_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // Unique identifier for customer portal URLs
  description: text('description'),
  phone: text('phone'),
  subscriptionPlan: text('subscription_plan').default('basic'), // 'basic' | 'premium' | 'enterprise'
  subscriptionStatus: text('subscription_status').default('pending'), // 'active' | 'expired' | 'pending' | 'cancelled'
  subscriptionExpiry: timestamp('subscription_expiry'), // تاريخ انتهاء الاشتراك
  bankAccounts: jsonb('bank_accounts').$type<Array<{
    id?: number;
    bank: string;
    accountNumber: string;
    iban?: string;
    accountName?: string;
  }>>().default([]),
  contactInfo: jsonb('contact_info').$type<{
    whatsapp?: string;
    email?: string;
    address?: string;
    phone?: string;
  }>().default({}),
  settings: jsonb('settings').$type<{
    currencyId?: string;
    taxRate?: number;
    invoiceFooter?: string;
    invoiceSubFooter?: string;
    welcomeMessage?: string; // نص الترحيب
    returnPolicy?: string; // شروط الاسترجاع
    logo?: string; // Base64 encoded image
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
    };
  }>().default({}),
  currencyId: text('currency_id').references(() => currencies.id),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Categories Table (Product Categories)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Products Table (Updated with storeId and categoryId)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: text('name').notNull(),
  barcode: text('barcode'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).default('0'),
  stock: integer('stock').default(0),
  categoryId: integer('category_id').references(() => categories.id), // Reference to categories table
  category: text('category'), // Keep for backward compatibility (will be migrated)
  showInPortal: boolean('show_in_portal').default(true), // Control visibility in customer portal
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Sales Table (Updated with storeId, customerId, currency support)
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id), // Nullable for walk-in customers
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').default('cash'), // 'cash' | 'card' | 'customer_balance' | 'mixed'
  userId: integer('user_id').references(() => users.id).notNull(), // Cashier who made the sale
  currencyId: text('currency_id').references(() => currencies.id),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }), // Exchange rate at time of sale
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => sales.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
});

// Customers Table (Updated with authentication and registration)
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(), // 9 digits
  whatsapp: text('whatsapp'), // WhatsApp number
  password: text('password').notNull(), // Hashed password
  registrationStatus: text('registration_status').default('pending'), // 'pending' | 'approved' | 'rejected'
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0'), // General balance
  allowCredit: boolean('allow_credit').default(false), // Allow credit purchases
  creditLimit: decimal('credit_limit', { precision: 10, scale: 2 }).default('0'), // Maximum credit limit
  ktp: text('ktp'), // Keep for backward compatibility
  dob: timestamp('dob'),
  notes: text('notes'),
  status: boolean('status').default(true), // Keep for backward compatibility
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Customer Store Relations (Customer registered in specific store)
export const customerStoreRelations = pgTable('customer_store_relations', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0'), // Balance in this specific store
  status: text('status').default('active'), // 'active' | 'suspended'
  registeredAt: timestamp('registered_at').defaultNow(), // When customer registered via store link
  createdAt: timestamp('created_at').defaultNow(),
});

// Customer Balance Requests (Deposit requests)
export const customerBalanceRequests = pgTable('customer_balance_requests', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  bank: text('bank').notNull(), // Bank name
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  referenceNumber: text('reference_number').notNull(), // Reference/Notification number
  status: text('status').default('pending'), // 'pending' | 'approved' | 'rejected'
  approvedBy: integer('approved_by').references(() => users.id), // Merchant who approved
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Store receipt image and other data
  createdAt: timestamp('created_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
});

// Customer Transactions (History of all customer operations)
export const customerTransactions = pgTable('customer_transactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  type: text('type').notNull(), // 'invoice' | 'deposit' | 'due_payment' | 'refund'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reference: text('reference'), // Invoice number or reference
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Additional data
  createdAt: timestamp('created_at').defaultNow(),
});

// Store Offers/Advertisements
export const storeOffers = pgTable('store_offers', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Expenses Table (Updated with storeId)
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  title: text('title').notNull(),
  note: text('note'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// New Tables

// Due Payments Table (Updated with storeId, customerId)
export const duePayments = pgTable('due_payments', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id), // Nullable for non-customer due payments
  name: text('name').notNull(),
  invoice: text('invoice'),
  itemName: text('item_name'),
  itemAmount: integer('item_amount').default(0),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull(), // 'paid' | 'unpaid'
  note: text('note'),
  dateIn: timestamp('date_in').notNull(),
  dueDate: timestamp('due_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Rent Items Table (Updated with storeId)
export const rentItems = pgTable('rent_items', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  note: text('note'),
  stock: integer('stock').default(0),
  rent3Days: decimal('rent_3_days', { precision: 10, scale: 2 }).default('0'),
  rent1Week: decimal('rent_1_week', { precision: 10, scale: 2 }).default('0'),
  rent1Month: decimal('rent_1_month', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Rents Table (Updated with storeId)
export const rents = pgTable('rents', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: text('name').notNull(),
  itemCount: integer('item_count').default(1),
  note: text('note'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  penalty: decimal('penalty', { precision: 10, scale: 2 }).default('0'),
  identity: boolean('identity').default(false),
  picture: boolean('picture').default(false),
  paid: boolean('paid').default(false),
  durationDays: integer('duration_days').notNull(),
  rentDate: timestamp('rent_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Presences Table (Updated with storeId)
export const presences = pgTable('presences', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: text('status').notNull(), // 'present' | 'absent' | 'sick'
  note: text('note'),
  path: text('path'), // photo path
  long: decimal('long', { precision: 10, scale: 7 }),
  lat: decimal('lat', { precision: 10, scale: 7 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Salaries Table (Updated with storeId)
export const salaries = pgTable('salaries', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: text('status').notNull(), // 'paid' | 'pending'
  period: text('period').notNull(), // '2023-10'
  items: jsonb('items').$type<{id?: number, description?: string, amount?: string}[]>(),
  deductions: jsonb('deductions').$type<{id?: number, description?: string, amount?: string}[]>(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Store Settings Table (Legacy - يمكن دمجه في stores.settings لاحقاً)
export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  phone: text('phone'),
  footer: text('footer'),
  subFooter: text('sub_footer'),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Requests Table (General requests - يمكن ربطه بمتجر محدد لاحقاً)
export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id), // Nullable for platform-level requests
  title: text('title').notNull(),
  note: text('note'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// ============================================
// Purchases & Suppliers Tables
// ============================================

// Suppliers Table (Multi-tenant support)
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  contactPerson: text('contact_person'), // اسم الشخص المسؤول
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Purchases Table (Multi-tenant support)
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id), // Nullable for purchases without supplier
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  paymentType: text('payment_type').default('cash'), // 'cash' | 'due' - كاش أو آجل
  purchaseDate: timestamp('purchase_date').defaultNow(),
  dueDate: timestamp('due_date'), // Required if paymentType is 'due'
  invoiceNumber: text('invoice_number'), // رقم فاتورة المورد
  notes: text('notes'),
  userId: integer('user_id').references(() => users.id), // User who created the purchase
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Purchase Items Table
export const purchaseItems = pgTable('purchase_items', {
  id: serial('id').primaryKey(),
  purchaseId: integer('purchase_id').references(() => purchases.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(), // Cost per unit
  total: decimal('total', { precision: 10, scale: 2 }).notNull(), // quantity * cost
  createdAt: timestamp('created_at').defaultNow(),
});

// Customer Orders Table (Shopping cart orders from customer portal)
export const customerOrders = pgTable('customer_orders', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending'), // 'pending' | 'approved' | 'rejected' | 'completed'
  notes: text('notes'), // Customer notes
  merchantNotes: text('merchant_notes'), // Merchant notes
  approvedBy: integer('approved_by').references(() => users.id), // Merchant who approved
  createdAt: timestamp('created_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  completedAt: timestamp('completed_at'),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Customer Order Items Table
export const customerOrderItems = pgTable('customer_order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => customerOrders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Price at time of order
  total: decimal('total', { precision: 10, scale: 2 }).notNull(), // quantity * price
  createdAt: timestamp('created_at').defaultNow(),
});

// Audit Logs Table (for tracking sensitive operations)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id), // Nullable for platform-level operations
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(), // 'balance_change', 'invoice_delete', 'price_update', etc.
  entityType: text('entity_type').notNull(), // 'customer', 'product', 'sale', etc.
  entityId: integer('entity_id'), // ID of the affected entity
  description: text('description'), // Human-readable description
  oldValue: jsonb('old_value').$type<Record<string, any>>(), // Previous state
  newValue: jsonb('new_value').$type<Record<string, any>>(), // New state
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Additional context
  ipAddress: text('ip_address'), // Client IP if available
  userAgent: text('user_agent'), // Browser/client info if available
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// Subscription Management Tables
// ============================================

// Subscription Plans Table
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // 'basic', 'premium', 'enterprise'
  displayName: text('display_name').notNull(), // 'الباقة الأساسية', 'الباقة المميزة', etc.
  description: text('description'), // وصف الباقة
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // السعر الشهري
  durationMonths: integer('duration_months').default(1), // مدة الاشتراك بالشهور (1, 3, 6, 12)
  features: jsonb('features').$type<Array<{
    name: string;
    included: boolean;
  }>>().default([]), // المميزات (مثل: عدد المنتجات، عدد المستخدمين، إلخ)
  maxProducts: integer('max_products'), // الحد الأقصى للمنتجات (null = غير محدود)
  maxUsers: integer('max_users'), // الحد الأقصى للمستخدمين (null = غير محدود)
  maxStores: integer('max_stores').default(1), // الحد الأقصى للمتاجر
  active: boolean('active').default(true), // هل الباقة نشطة ومتاحة للاختيار
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft Delete
});

// Subscription Requests Table (طلبات تجديد/تغيير الاشتراك)
export const subscriptionRequests = pgTable('subscription_requests', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').references(() => stores.id).notNull(),
  planId: integer('plan_id').references(() => subscriptionPlans.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // المبلغ المدفوع
  paymentMethod: text('payment_method').notNull(), // 'bank_transfer' | 'cash' | 'card'
  paymentReference: text('payment_reference'), // رقم المرجع (رقم الإشعار، رقم التحويل، إلخ)
  paymentReceipt: text('payment_receipt'), // Base64 image of receipt
  status: text('status').default('pending'), // 'pending' | 'approved' | 'rejected'
  approvedBy: integer('approved_by').references(() => users.id), // أدمن المنصة الذي وافق
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'), // سبب الرفض إن وجد
  metadata: jsonb('metadata').$type<Record<string, any>>(), // بيانات إضافية
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// Add Foreign Key References (after all tables are defined)
// ============================================
// Note: Drizzle ORM handles references automatically, but we need to ensure proper order
// The references above are correct - Drizzle will validate them at runtime
