import { useEffect, useState } from 'react';
import { Users, Search, MoreVertical, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { User } from '../../../../shared/types';

export default function MerchantsManagement() {
  const [merchants, setMerchants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      const data = await window.api.platformAdmin.getMerchants();
      setMerchants(data);
    } catch (error: any) {
      console.error('Failed to load merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (merchantId: number, newStatus: string) => {
    try {
      await window.api.platformAdmin.updateMerchantStatus({
        merchantId,
        status: newStatus,
      });
      await loadMerchants();
    } catch (error: any) {
      alert('فشل تحديث الحالة: ' + error.message);
    }
  };

  const handleDelete = async (merchantId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التاجر؟')) return;

    try {
      await window.api.platformAdmin.deleteMerchant(merchantId);
      await loadMerchants();
    } catch (error: any) {
      alert('فشل حذف التاجر: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
      suspended: { label: 'معلق', color: 'bg-red-100 text-red-800' },
      pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredMerchants = merchants.filter(
    (merchant) =>
      merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-800">إدارة التجار</h1>
          <p className="text-gray-600 mt-1">إدارة جميع التجار المسجلين في المنصة</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث عن تاجر..."
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
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{merchant.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {merchant.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(merchant.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(merchant.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {merchant.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(merchant.id, 'suspended')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="تعليق"
                          >
                            <AlertCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(merchant.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                            title="تفعيل"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(merchant.id)}
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

