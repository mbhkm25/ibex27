import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Star, Package, Bell } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const ReportsPage = () => {
  const { selectedStore } = useStore();
  const [data, setData] = useState<any>(null);
  const [netProfit, setNetProfit] = useState<any>(null);
  const [inventoryValue, setInventoryValue] = useState<any>(null);
  const [salesVsPurchases, setSalesVsPurchases] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedStore) {
      loadAllReports();
    }
  }, [selectedStore]);

  const loadAllReports = async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      const [
        dashboardData,
        profitData,
        inventoryData,
        salesPurchasesData,
        expensesData,
        alertsData
      ] = await Promise.all([
        window.api.reports.getDashboard(selectedStore.id),
        window.api.reports.getNetProfit({ storeId: selectedStore.id }),
        window.api.reports.getInventoryValue(selectedStore.id),
        window.api.reports.getSalesVsPurchases({ storeId: selectedStore.id, months: 6 }),
        window.api.reports.getExpensesByCategory(selectedStore.id),
        window.api.reports.getFinancialAlerts(selectedStore.id),
      ]);
      
      setData(dashboardData);
      setNetProfit(profitData);
      setInventoryValue(inventoryData);
      setSalesVsPurchases(salesPurchasesData);
      setExpensesByCategory(expensesData);
      setAlerts(alertsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="text-red-600" size={20} />;
      case 'medium': return <AlertTriangle className="text-yellow-600" size={20} />;
      case 'low': return <Bell className="text-blue-600" size={20} />;
      default: return <Bell size={20} />;
    }
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <AlertTriangle className="text-yellow-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">يرجى اختيار متجر</h3>
          <p className="text-sm text-yellow-700">
            يجب اختيار متجر من القائمة أعلاه لعرض التقارير
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">جاري تحميل التقارير...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-500">فشل تحميل البيانات</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التقارير ولوحة المعلومات</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-1">إجمالي المبيعات</p>
            <h3 className="text-2xl font-bold text-gray-800">{data.totalRevenue.toFixed(2)} ر.س</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-1">صافي الربح</p>
            <h3 className={`text-2xl font-bold ${netProfit?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netProfit?.netProfit.toFixed(2) || '0.00'} ر.س
            </h3>
            {netProfit && (
              <p className="text-xs text-gray-500 mt-1">هامش الربح: {netProfit.profitMargin.toFixed(1)}%</p>
            )}
          </div>
          <div className="bg-green-50 p-3 rounded-full text-green-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-1">قيمة المخزون</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {inventoryValue?.totalValue.toFixed(2) || '0.00'} ر.س
            </h3>
          </div>
          <div className="bg-purple-50 p-3 rounded-full text-purple-600">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-1">عدد الفواتير</p>
            <h3 className="text-2xl font-bold text-gray-800">{data.salesCount}</h3>
            <p className="text-xs text-gray-500 mt-1">
              متوسط: {data.salesCount > 0 ? (data.totalRevenue / data.salesCount).toFixed(2) : 0} ر.س
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-full text-orange-600">
            <ShoppingBag size={24} />
          </div>
        </div>
      </div>

      {/* Financial Performance Indicator */}
      {netProfit && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" />
            مؤشر الأداء المالي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">إجمالي المبيعات</p>
              <p className="text-xl font-bold text-blue-600">{netProfit.totalSales.toFixed(2)} ر.س</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">تكلفة السلع</p>
              <p className="text-xl font-bold text-orange-600">{netProfit.costOfGoodsSold.toFixed(2)} ر.س</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">المصاريف</p>
              <p className="text-xl font-bold text-red-600">{netProfit.totalExpenses.toFixed(2)} ر.س</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">صافي الربح</p>
              <p className={`text-xl font-bold ${netProfit.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfit.netProfit.toFixed(2)} ر.س
              </p>
              <p className="text-xs text-gray-500 mt-1">هامش: {netProfit.profitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Purchases Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="font-bold text-gray-800 mb-6">مقارنة المبيعات بالمشتريات (شهرياً)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesVsPurchases}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" name="المبيعات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" name="المشتريات" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="font-bold text-gray-800 mb-6">توزيع المصاريف حسب الفئة</h3>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, name }) => `${name}: ${value?.toFixed(0)} ر.س`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {expensesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              لا توجد مصاريف مسجلة
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart (Last 7 Days) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="font-bold text-gray-800 mb-6">مبيعات آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="المبيعات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 overflow-y-auto">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" />
            المنتجات الأكثر مبيعاً
          </h3>
          <table className="w-full text-right">
            <thead className="text-gray-500 text-sm border-b">
              <tr>
                <th className="pb-2">المنتج</th>
                <th className="pb-2">الكمية</th>
                <th className="pb-2">الإيراد</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.bestSellers?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 font-bold">{item.totalSold}</td>
                  <td className="py-3 text-green-600">{item.revenue} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="text-orange-600" />
            أهم التنبيهات المالية
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 flex items-start gap-3 ${getSeverityColor(alert.severity)}`}
              >
                <div className="mt-0.5">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-1">{alert.title}</h4>
                  <p className="text-sm">{alert.message}</p>
                  {alert.amount && (
                    <p className="text-xs mt-1 font-semibold">المبلغ: {alert.amount.toFixed(2)} ر.س</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-red-600">
          <AlertTriangle />
          تنبيهات المخزون المنخفض
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.lowStock?.map((item: any, idx: number) => (
            <div key={idx} className="bg-red-50 p-4 rounded-lg border border-red-100 flex justify-between items-center">
              <span className="font-medium text-gray-800">{item.name}</span>
              <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm font-bold">
                {item.stock}
              </span>
            </div>
          ))}
          {data.lowStock?.length === 0 && (
            <p className="text-gray-500 text-sm col-span-full">المخزون بحالة جيدة</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
