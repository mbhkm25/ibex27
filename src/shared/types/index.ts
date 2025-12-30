// ============================================
// Shared Types - IBEX Platform
// ============================================

// User Roles
export type UserRole = 'platform_admin' | 'merchant' | 'cashier' | 'customer';

// User Status
export type UserStatus = 'active' | 'suspended' | 'pending';

// Subscription Status
export type SubscriptionStatus = 'active' | 'expired' | 'pending' | 'cancelled';

// Subscription Plan
export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';

// Customer Registration Status
export type CustomerRegistrationStatus = 'pending' | 'approved' | 'rejected';

// Transaction Types
export type TransactionType = 'invoice' | 'deposit' | 'due_payment' | 'refund';

// Balance Request Status
export type BalanceRequestStatus = 'pending' | 'approved' | 'rejected';

// Payment Methods
export type PaymentMethod = 'cash' | 'card' | 'customer_balance' | 'mixed';

// Currency
export interface Currency {
  id: string;
  code: string; // SAR, YER, USD, etc.
  symbol: string; // ر.س, ريال, $, etc.
  name: string; // ريال سعودي, ريال يمني, etc.
  exchangeRate: number; // سعر الصرف مقابل العملة الأساسية
}

// Bank Account
export interface BankAccount {
  id?: number;
  bank: string; // البنك الأهلي، الراجحي، etc.
  accountNumber: string;
  iban?: string;
  accountName?: string;
}

// Contact Info
export interface ContactInfo {
  whatsapp?: string;
  email?: string;
  address?: string;
  phone?: string;
}

// Store Settings
export interface StoreSettings {
  currencyId?: string;
  taxRate?: number;
  invoiceFooter?: string;
  invoiceSubFooter?: string;
  logo?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// User Type
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  storeId?: number | null;
  status: UserStatus;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiry?: Date | null;
  createdAt: Date;
}

// Store Type
export interface Store {
  id: number;
  merchantId: number;
  name: string;
  slug: string; // unique identifier for customer portal
  description?: string | null;
  phone?: string | null;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  bankAccounts: BankAccount[];
  contactInfo: ContactInfo;
  settings: StoreSettings;
  currencyId?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
}

// Customer Type
export interface Customer {
  id: number;
  name: string;
  phone: string; // 9 digits
  whatsapp?: string | null;
  password: string; // hashed
  registrationStatus: CustomerRegistrationStatus;
  balance: number; // general balance
  deletedAt?: Date | null;
  createdAt: Date;
}

// Customer Store Relation
export interface CustomerStoreRelation {
  id: number;
  customerId: number;
  storeId: number;
  balance: number; // balance in this specific store
  status: 'active' | 'suspended';
  registeredAt: Date; // when customer registered via store link
  createdAt: Date;
}

// Customer Balance Request
export interface CustomerBalanceRequest {
  id: number;
  customerId: number;
  storeId: number;
  bank: string;
  amount: number;
  referenceNumber: string;
  status: BalanceRequestStatus;
  approvedBy?: number | null;
  createdAt: Date;
  approvedAt?: Date | null;
}

// Customer Transaction
export interface CustomerTransaction {
  id: number;
  customerId: number;
  storeId: number;
  type: TransactionType;
  amount: number;
  reference?: string | null; // invoice number or reference
  metadata?: Record<string, any>; // additional data
  createdAt: Date;
}

// Product Type
export interface Product {
  id: number;
  storeId: number;
  name: string;
  barcode?: string | null;
  price: number;
  cost: number;
  stock: number;
  category?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
}

// Sale Type
export interface Sale {
  id: number;
  storeId: number;
  customerId?: number | null;
  total: number;
  paymentMethod: PaymentMethod;
  userId: number; // cashier who made the sale
  currencyId?: string | null;
  exchangeRate?: number | null; // exchange rate at time of sale
  deletedAt?: Date | null;
  createdAt: Date;
}

// Sale Item Type
export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
}

// Store Offer/Advertisement
export interface StoreOffer {
  id: number;
  storeId: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startDate: Date;
  endDate: Date;
  active: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
}

