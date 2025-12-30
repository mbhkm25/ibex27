// ============================================
// Currency Utilities
// ============================================

import type { Currency } from '../types';

// Default currencies (يمكن توسيعها لاحقاً)
export const DEFAULT_CURRENCIES: Currency[] = [
  {
    id: 'SAR',
    code: 'SAR',
    symbol: 'ر.س',
    name: 'ريال سعودي',
    exchangeRate: 1.0
  },
  {
    id: 'YER',
    code: 'YER',
    symbol: 'ريال',
    name: 'ريال يمني',
    exchangeRate: 0.004 // مثال: 1 SAR = 250 YER
  },
  {
    id: 'USD',
    code: 'USD',
    symbol: '$',
    name: 'دولار أمريكي',
    exchangeRate: 3.75 // مثال: 1 USD = 3.75 SAR
  }
];

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'SAR',
  locale: string = 'ar-SA'
): string {
  const currency = DEFAULT_CURRENCIES.find(c => c.id === currencyCode) || DEFAULT_CURRENCIES[0];
  
  // Format number with Arabic locale
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${formattedAmount} ${currency.symbol}`;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const from = DEFAULT_CURRENCIES.find(c => c.id === fromCurrency) || DEFAULT_CURRENCIES[0];
  const to = DEFAULT_CURRENCIES.find(c => c.id === toCurrency) || DEFAULT_CURRENCIES[0];
  
  // Convert to base currency (SAR) first, then to target currency
  const baseAmount = amount / from.exchangeRate;
  return baseAmount * to.exchangeRate;
}

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return DEFAULT_CURRENCIES.find(c => c.id === code);
}

/**
 * Validate phone number (9 digits for Saudi)
 */
export function validatePhone(phone: string): boolean {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's 9 digits
  return /^\d{9}$/.test(cleaned);
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `05${cleaned}`;
  }
  return phone;
}

