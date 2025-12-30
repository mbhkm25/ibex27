import { ipcMain } from 'electron';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { currencies, stores } from './schema';

export function setupCurrenciesHandlers() {
  // Get all currencies
  ipcMain.handle('currencies:get-all', async () => {
    try {
      const result = await db
        .select()
        .from(currencies)
        .where(isNull(currencies.deletedAt))
        .orderBy(currencies.code);
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب العملات');
    }
  });

  // Get currency by ID
  ipcMain.handle('currencies:get-by-id', async (_, currencyId: string) => {
    try {
      const [currency] = await db
        .select()
        .from(currencies)
        .where(and(eq(currencies.id, currencyId), isNull(currencies.deletedAt)))
        .limit(1);
      
      return currency || null;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب العملة');
    }
  });

  // Get store currency (from store settings)
  ipcMain.handle('currencies:get-store-currency', async (_, storeId: number) => {
    try {
      const [store] = await db
        .select()
        .from(stores)
        .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
        .limit(1);

      if (!store) {
        throw new Error('المتجر غير موجود');
      }

      if (!store.currencyId) {
        // Return default currency (SAR) if no currency set
        const [defaultCurrency] = await db
          .select()
          .from(currencies)
          .where(and(eq(currencies.id, 'SAR'), isNull(currencies.deletedAt)))
          .limit(1);
        
        return defaultCurrency || null;
      }

      const [currency] = await db
        .select()
        .from(currencies)
        .where(and(eq(currencies.id, store.currencyId), isNull(currencies.deletedAt)))
        .limit(1);

      return currency || null;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب عملة المتجر');
    }
  });

  // Convert amount between currencies
  ipcMain.handle('currencies:convert', async (_, {
    amount,
    fromCurrencyId,
    toCurrencyId,
  }: {
    amount: number;
    fromCurrencyId: string;
    toCurrencyId: string;
  }) => {
    try {
      if (fromCurrencyId === toCurrencyId) {
        return { convertedAmount: amount, exchangeRate: 1 };
      }

      const [fromCurrency] = await db
        .select()
        .from(currencies)
        .where(and(eq(currencies.id, fromCurrencyId), isNull(currencies.deletedAt)))
        .limit(1);

      const [toCurrency] = await db
        .select()
        .from(currencies)
        .where(and(eq(currencies.id, toCurrencyId), isNull(currencies.deletedAt)))
        .limit(1);

      if (!fromCurrency || !toCurrency) {
        throw new Error('عملة غير موجودة');
      }

      // Convert: amount in fromCurrency -> base currency -> toCurrency
      // Assuming base currency is SAR (exchangeRate = 1)
      const fromRate = parseFloat(fromCurrency.exchangeRate || '1');
      const toRate = parseFloat(toCurrency.exchangeRate || '1');

      // Convert to base currency first, then to target currency
      const baseAmount = amount / fromRate;
      const convertedAmount = baseAmount * toRate;
      const exchangeRate = toRate / fromRate;

      return {
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        exchangeRate: parseFloat(exchangeRate.toFixed(4)),
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل تحويل العملة');
    }
  });
}

