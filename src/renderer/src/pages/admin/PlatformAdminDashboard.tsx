import { useEffect, useState } from 'react';
import { Users, Store, ShoppingBag, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../../shared/utils/currency';

interface DashboardStats {
  merchants: number;
  stores: number;
  customers: number;
  totalRevenue: number;
  activeStores: number;
  expiredStores: number;
}

export default function PlatformAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await window.api.platformAdmin.getDashboard();
      setStats(data);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">فشل تحميل البيانات</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'التجار',
      value: stats.merchants,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'المتاجر',
      value: stats.stores,
      icon: Store,
      color: 'bg-green-500',
    },
    {
      title: 'العملاء',
      value: stats.customers,
      icon: ShoppingBag,
      color: 'bg-purple-500',
    },
    {
      title: 'إجمالي المبيعات (30 يوم)',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      title: 'متاجر نشطة',
      value: stats.activeStores,
      icon: TrendingUp,
      color: 'bg-emerald-500',
    },
    {
      title: 'متاجر منتهية',
      value: stats.expiredStores,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم مدير المنصة</h1>
        <p className="text-gray-600 mt-1">نظرة عامة على المنصة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">إحصائيات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">نسبة المتاجر النشطة</p>
            <p className="text-xl font-bold text-green-600">
              {stats.stores > 0
                ? Math.round((stats.activeStores / stats.stores) * 100)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">متوسط المبيعات/متجر</p>
            <p className="text-xl font-bold text-blue-600">
              {stats.activeStores > 0
                ? formatCurrency(stats.totalRevenue / stats.activeStores)
                : formatCurrency(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

