import { ipcMain } from 'electron';
import { sql, desc, eq, and, isNull, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { sales, saleItems, products, purchases, expenses, duePayments } from './schema';

export function setupReportsHandlers() {
  // Dashboard report (filtered by storeId)
  ipcMain.handle('reports:dashboard', async (_, storeId?: number) => {
    try {
      // Build where clause based on storeId
      const whereClause = storeId 
        ? and(eq(sales.storeId, storeId), isNull(sales.deletedAt))
        : isNull(sales.deletedAt);

      // Total Revenue
      const revenueResult = await db.select({ 
        total: sql<string>`sum(${sales.total})` 
      })
      .from(sales)
      .where(whereClause);
      
      const totalRevenue = parseFloat(revenueResult[0]?.total || '0');

      // Sales Count
      const countResult = await db.select({ 
        count: sql<number>`count(*)` 
      })
      .from(sales)
      .where(whereClause);
      const salesCount = countResult[0]?.count || 0;

      // Last 7 days revenue
      const last7DaysQuery = storeId
        ? sql`
          SELECT 
            to_char(${sales.createdAt}, 'YYYY-MM-DD') as date,
            sum(${sales.total}) as total
          FROM ${sales}
          WHERE ${sales.storeId} = ${storeId} AND ${sales.deletedAt} IS NULL
          GROUP BY 1
          ORDER BY 1 DESC
          LIMIT 7
        `
        : sql`
          SELECT 
            to_char(${sales.createdAt}, 'YYYY-MM-DD') as date,
            sum(${sales.total}) as total
          FROM ${sales}
          WHERE ${sales.deletedAt} IS NULL
          GROUP BY 1
          ORDER BY 1 DESC
          LIMIT 7
        `;
      
      const last7Days = await db.execute(last7DaysQuery);

      // Best Sellers (filtered by storeId if provided)
      const bestSellersQuery = db.select({
        name: products.name,
        totalSold: sql<number>`sum(${saleItems.quantity})`,
        revenue: sql<number>`sum(${saleItems.total})`
      })
      .from(saleItems)
      .leftJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(
        storeId
          ? and(
              eq(sales.storeId, storeId),
              isNull(sales.deletedAt),
              isNull(products.deletedAt)
            )
          : and(
              isNull(sales.deletedAt),
              isNull(products.deletedAt)
            )
      )
      .groupBy(products.name)
      .orderBy(desc(sql`sum(${saleItems.quantity})`))
      .limit(5);

      const bestSellers = await bestSellersQuery;

      // Low Stock (filtered by storeId if provided)
      const lowStockQuery = db.select({
        name: products.name,
        stock: products.stock
      })
      .from(products)
      .where(
        storeId
          ? and(
              eq(products.storeId, storeId),
              sql`${products.stock} < 10`,
              isNull(products.deletedAt)
            )
          : and(
              sql`${products.stock} < 10`,
              isNull(products.deletedAt)
            )
      )
      .orderBy(products.stock)
      .limit(10);

      const lowStock = await lowStockQuery;

      return {
        totalRevenue,
        salesCount,
        chartData: last7Days.reverse(),
        bestSellers,
        lowStock
      };
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || 'فشل جلب التقارير');
    }
  });

  // Best Sellers report (filtered by storeId)
  ipcMain.handle('reports:best-sellers', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(
            eq(sales.storeId, storeId),
            isNull(sales.deletedAt),
            isNull(products.deletedAt)
          )
        : and(
            isNull(sales.deletedAt),
            isNull(products.deletedAt)
          );

      const bestSellers = await db.select({
        name: products.name,
        totalSold: sql<number>`sum(${saleItems.quantity})`,
        revenue: sql<number>`sum(${saleItems.total})`
      })
      .from(saleItems)
      .leftJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(whereClause)
      .groupBy(products.name)
      .orderBy(desc(sql`sum(${saleItems.quantity})`))
      .limit(20);

      return bestSellers;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب أفضل المنتجات');
    }
  });

  // Low Stock report (filtered by storeId)
  ipcMain.handle('reports:low-stock', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(
            eq(products.storeId, storeId),
            sql`${products.stock} < 10`,
            isNull(products.deletedAt)
          )
        : and(
            sql`${products.stock} < 10`,
            isNull(products.deletedAt)
          );

      const lowStock = await db.select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        price: products.price
      })
      .from(products)
      .where(whereClause)
      .orderBy(products.stock)
      .limit(50);

      return lowStock;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب المنتجات قليلة المخزون');
    }
  });

  // Monthly Revenue report (filtered by storeId)
  ipcMain.handle('reports:revenue-monthly', async (_, storeId?: number) => {
    try {
      const monthlyRevenueQuery = storeId
        ? sql`
          SELECT 
            to_char(${sales.createdAt}, 'YYYY-MM') as month,
            sum(${sales.total}) as total
          FROM ${sales}
          WHERE ${sales.storeId} = ${storeId} AND ${sales.deletedAt} IS NULL
          GROUP BY 1
          ORDER BY 1 DESC
          LIMIT 12
        `
        : sql`
          SELECT 
            to_char(${sales.createdAt}, 'YYYY-MM') as month,
            sum(${sales.total}) as total
          FROM ${sales}
          WHERE ${sales.deletedAt} IS NULL
          GROUP BY 1
          ORDER BY 1 DESC
          LIMIT 12
        `;

      const monthlyRevenue = await db.execute(monthlyRevenueQuery);
      return monthlyRevenue;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب إيرادات الشهرية');
    }
  });

  // ============================================
  // Advanced Financial Reports
  // ============================================

  // Calculate Net Profit: (Total Sales - Cost of Goods Sold - Expenses)
  ipcMain.handle('reports:net-profit', async (_, { storeId, startDate, endDate }: { storeId: number; startDate?: string; endDate?: string }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Build date filter
      const dateFilter = startDate && endDate
        ? and(
            gte(sales.createdAt, new Date(startDate)),
            lte(sales.createdAt, new Date(endDate))
          )
        : undefined;

      // 1. Total Sales Revenue
      const salesWhere = dateFilter
        ? and(
            eq(sales.storeId, storeId),
            isNull(sales.deletedAt),
            dateFilter
          )
        : and(
            eq(sales.storeId, storeId),
            isNull(sales.deletedAt)
          );

      const salesResult = await db.select({
        total: sql<string>`COALESCE(sum(${sales.total}), 0)`
      })
      .from(sales)
      .where(salesWhere);

      const totalSales = parseFloat(salesResult[0]?.total || '0');

      // 2. Cost of Goods Sold (COGS)
      // Calculate based on sale items and their cost at time of sale
      // We'll use current product cost as approximation (for accurate COGS, we'd need to track cost history)
      const cogsResult = await db.select({
        total: sql<string>`
          COALESCE(sum(
            ${saleItems.quantity} * 
            COALESCE((
              SELECT ${products.cost} 
              FROM ${products} 
              WHERE ${products.id} = ${saleItems.productId} 
              LIMIT 1
            ), 0)
          ), 0)
        `
      })
      .from(saleItems)
      .leftJoin(sales, eq(saleItems.saleId, sales.id))
      .where(
        dateFilter
          ? and(
              eq(sales.storeId, storeId),
              isNull(sales.deletedAt),
              dateFilter
            )
          : and(
              eq(sales.storeId, storeId),
              isNull(sales.deletedAt)
            )
      );

      const costOfGoodsSold = parseFloat(cogsResult[0]?.total || '0');

      // 3. Total Expenses
      const expensesWhere = dateFilter
        ? and(
            eq(expenses.storeId, storeId),
            isNull(expenses.deletedAt),
            dateFilter
          )
        : and(
            eq(expenses.storeId, storeId),
            isNull(expenses.deletedAt)
          );

      const expensesResult = await db.select({
        total: sql<string>`COALESCE(sum(${expenses.amount}), 0)`
      })
      .from(expenses)
      .where(expensesWhere);

      const totalExpenses = parseFloat(expensesResult[0]?.total || '0');

      // 4. Net Profit = Total Sales - COGS - Expenses
      const netProfit = totalSales - costOfGoodsSold - totalExpenses;
      const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

      return {
        totalSales,
        costOfGoodsSold,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        startDate: startDate || null,
        endDate: endDate || null,
      };
    } catch (error: any) {
      console.error('Net profit calculation error:', error);
      throw new Error(error.message || 'فشل حساب صافي الربح');
    }
  });

  // Calculate Inventory Value: Stock * Average Cost
  ipcMain.handle('reports:inventory-value', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      const inventoryValueResult = await db.select({
        productId: products.id,
        name: products.name,
        stock: products.stock,
        cost: products.cost,
        value: sql<string>`${products.stock} * COALESCE(${products.cost}, 0)`
      })
      .from(products)
      .where(
        and(
          eq(products.storeId, storeId),
          isNull(products.deletedAt)
        )
      );

      const totalValue = inventoryValueResult.reduce((sum, item) => {
        const stock = parseInt(item.stock?.toString() || '0');
        const cost = parseFloat(item.cost?.toString() || '0');
        return sum + (stock * cost);
      }, 0);

      return {
        items: inventoryValueResult.map(item => ({
          productId: item.productId,
          name: item.name,
          stock: parseInt(item.stock?.toString() || '0'),
          cost: parseFloat(item.cost?.toString() || '0'),
          value: parseFloat(item.value || '0'),
        })),
        totalValue: parseFloat(totalValue.toFixed(2)),
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل حساب قيمة المخزون');
    }
  });

  // Sales vs Purchases Monthly Comparison
  ipcMain.handle('reports:sales-vs-purchases', async (_, { storeId, months = 6 }: { storeId: number; months?: number }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Get monthly sales
      const salesQuery = sql`
        SELECT 
          to_char(${sales.createdAt}, 'YYYY-MM') as month,
          COALESCE(sum(${sales.total}), 0) as sales
        FROM ${sales}
        WHERE ${sales.storeId} = ${storeId} 
          AND ${sales.deletedAt} IS NULL
          AND ${sales.createdAt} >= NOW() - INTERVAL '${months} months'
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      // Get monthly purchases
      const purchasesQuery = sql`
        SELECT 
          to_char(${purchases.purchaseDate}, 'YYYY-MM') as month,
          COALESCE(sum(${purchases.total}), 0) as purchases
        FROM ${purchases}
        WHERE ${purchases.storeId} = ${storeId} 
          AND ${purchases.deletedAt} IS NULL
          AND ${purchases.purchaseDate} >= NOW() - INTERVAL '${months} months'
        GROUP BY 1
        ORDER BY 1 ASC
      `;

      const [salesData, purchasesData] = await Promise.all([
        db.execute(salesQuery),
        db.execute(purchasesQuery),
      ]);

      // Merge data by month
      const salesMap = new Map(salesData.map((row: any) => [row.month, parseFloat(row.sales || '0')]));
      const purchasesMap = new Map(purchasesData.map((row: any) => [row.month, parseFloat(row.purchases || '0')]));

      // Get all unique months
      const allMonths = new Set([...salesMap.keys(), ...purchasesMap.keys()]);
      const mergedData = Array.from(allMonths)
        .sort()
        .map(month => ({
          month,
          sales: salesMap.get(month) || 0,
          purchases: purchasesMap.get(month) || 0,
        }));

      return mergedData;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب مقارنة المبيعات والمشتريات');
    }
  });

  // Expenses by Category (if category field exists, otherwise group by title)
  ipcMain.handle('reports:expenses-by-category', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      // Group expenses by title (as category)
      const expensesQuery = sql`
        SELECT 
          ${expenses.title} as category,
          COALESCE(sum(${expenses.amount}), 0) as total
        FROM ${expenses}
        WHERE ${expenses.storeId} = ${storeId} 
          AND ${expenses.deletedAt} IS NULL
        GROUP BY ${expenses.title}
        ORDER BY total DESC
      `;

      const expensesData = await db.execute(expensesQuery);
      return expensesData.map((row: any) => ({
        category: row.category,
        total: parseFloat(row.total || '0'),
      }));
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب توزيع المصاريف');
    }
  });

  // Financial Alerts
  ipcMain.handle('reports:financial-alerts', async (_, storeId: number) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }

      const alerts: any[] = [];

      // 1. Check for unpaid supplier due payments
      const unpaidSuppliers = await db.select({
        id: duePayments.id,
        name: duePayments.name,
        amount: duePayments.amount,
        dueDate: duePayments.dueDate,
      })
      .from(duePayments)
      .where(
        and(
          eq(duePayments.storeId, storeId),
          eq(duePayments.status, 'unpaid'),
          isNull(duePayments.deletedAt),
          sql`${duePayments.customerId} IS NULL` // Supplier payments (not customer)
        )
      )
      .orderBy(duePayments.dueDate);

      unpaidSuppliers.forEach((payment) => {
        const daysOverdue = Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 0) {
          alerts.push({
            type: 'supplier_payment_due',
            severity: daysOverdue > 30 ? 'high' : 'medium',
            title: 'مورد يحتاج دفع',
            message: `${payment.name} - المبلغ: ${parseFloat(payment.amount.toString()).toFixed(2)} ر.س - متأخر ${daysOverdue} يوم`,
            amount: parseFloat(payment.amount.toString()),
          });
        }
      });

      // 2. Highly profitable products (profit margin > 50%)
      const profitableProducts = await db.select({
        id: products.id,
        name: products.name,
        price: products.price,
        cost: products.cost,
        stock: products.stock,
        profitMargin: sql<string>`((${products.price} - COALESCE(${products.cost}, 0)) / ${products.price}) * 100`,
      })
      .from(products)
      .where(
        and(
          eq(products.storeId, storeId),
          isNull(products.deletedAt),
          sql`(${products.price} - COALESCE(${products.cost}, 0)) / ${products.price} > 0.5`
        )
      )
      .limit(5);

      profitableProducts.forEach((product) => {
        const margin = parseFloat(product.profitMargin || '0');
        if (margin > 50) {
          alerts.push({
            type: 'highly_profitable',
            severity: 'low',
            title: 'منتج مربح جداً',
            message: `${product.name} - هامش الربح: ${margin.toFixed(1)}%`,
            productId: product.id,
          });
        }
      });

      // 3. Slow-moving products (no sales in last 30 days but has stock)
      const slowMovingQuery = sql`
        SELECT DISTINCT
          ${products.id},
          ${products.name},
          ${products.stock}
        FROM ${products}
        LEFT JOIN ${saleItems} ON ${saleItems.productId} = ${products.id}
        LEFT JOIN ${sales} ON ${sales.id} = ${saleItems.saleId}
        WHERE ${products.storeId} = ${storeId}
          AND ${products.deletedAt} IS NULL
          AND ${products.stock} > 0
          AND (
            ${sales.id} IS NULL 
            OR ${sales.createdAt} < NOW() - INTERVAL '30 days'
          )
        LIMIT 10
      `;

      const slowMoving = await db.execute(slowMovingQuery);
      slowMoving.forEach((product: any) => {
        alerts.push({
          type: 'slow_moving',
          severity: 'medium',
          title: 'منتج راكد',
          message: `${product.name} - المخزون: ${product.stock} - لم يباع منذ 30 يوم`,
          productId: product.id,
        });
      });

      return alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
      });
    } catch (error: any) {
      console.error('Financial alerts error:', error);
      throw new Error(error.message || 'فشل جلب التنبيهات المالية');
    }
  });
}
