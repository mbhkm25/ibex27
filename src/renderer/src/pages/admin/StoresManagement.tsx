import { useEffect, useState } from 'react';
import { Store, Search, CheckCircle, XCircle, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { Store as StoreType } from '../../../../shared/types';
import { formatCurrency } from '../../../../shared/utils/currency';

interface StoreWithMerchant extends StoreType {
  merchant?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function StoresManagement() {
  const [stores, setStores] = useState<StoreWithMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await window.api.platformAdmin.getAllStores();
      setStores(data.map((item: any) => ({ ...item.store, merchant: item.merchant })));
    } catch (error: any) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionUpdate = async (
    storeId: number,
    subscriptionStatus: string,
    subscriptionPlan?: string,
    subscriptionExpiry?: string
  ) => {
    try {
      await window.api.platformAdmin.updateStoreSubscription({
        storeId,
        subscriptionStatus,
        subscriptionPlan,
        subscriptionExpiry,
      });
      await loadStores();
      alert('تم تحديث الاشتراك بنجاح');
    } catch (error: any) {
      alert('فشل تحديث الاشتراك: ' + error.message);
    }
  };

  const handleDelete = async (storeId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتجر؟')) return;

    try {
      await window.api.platformAdmin.deleteStore(storeId);
      await loadStores();
    } catch (error: any) {
      alert('فشل حذف المتجر: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
      expired: { label: 'منتهي', color: 'bg-red-100 text-red-800' },
      pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'ملغي', color: 'bg-gray-100 text-gray-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planMap: Record<string, { label: string; color: string }> = {
      basic: { label: 'أساسي', color: 'bg-blue-100 text-blue-800' },
      premium: { label: 'مميز', color: 'bg-purple-100 text-purple-800' },
      enterprise: { label: 'مؤسسي', color: 'bg-yellow-100 text-yellow-800' },
    };

    const planInfo = planMap[plan] || { label: plan, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${planInfo.color}`}>
        {planInfo.label}
      </span>
    );
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.merchant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المتاجر</h1>
          <p className="text-gray-600 mt-1">إدارة جميع المتاجر المسجلة في المنصة</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث عن متجر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المتجر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاجر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  خطة الاشتراك
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  حالة الاشتراك
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Store className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{store.name}</div>
                          {store.description && (
                            <div className="text-xs text-gray-500">{store.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.merchant?.name || 'غير معروف'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getPlanBadge(store.subscriptionPlan)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(store.subscriptionStatus)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(store.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {store.subscriptionStatus === 'active' ? (
                          <button
                            onClick={() => handleSubscriptionUpdate(store.id, 'expired')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="إنهاء الاشتراك"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSubscriptionUpdate(store.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                            title="تفعيل الاشتراك"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="text-red-600 hover:text-red-900"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

