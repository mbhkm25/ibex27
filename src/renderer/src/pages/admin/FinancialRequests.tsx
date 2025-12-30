import { useEffect, useState } from 'react';
import { Wallet, Building2, Calendar, Hash } from 'lucide-react';
import { formatCurrency } from '../../../../shared/utils/currency';

interface BalanceRequest {
  request: {
    id: number;
    customerId: number;
    storeId: number;
    bank: string;
    amount: string;
    referenceNumber: string;
    status: string;
    createdAt: Date;
    approvedAt?: Date;
  };
  customer: {
    id: number;
    name: string;
    phone: string;
  };
  store: {
    id: number;
    name: string;
    merchantId: number;
  };
}

export default function FinancialRequests() {
  const [requests, setRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await window.api.platformAdmin.getAllBalanceRequests({
        limit: 200,
        status: filter !== 'all' ? filter : undefined,
      });
      setRequests(data);
    } catch (error: any) {
      console.error('Failed to load requests:', error);
      alert(error.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'قيد المراجعة' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'موافق عليه' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'مرفوض' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const totalAmount = requests.reduce((sum, req) => {
    if (req.request.status === 'approved') {
      return sum + parseFloat(req.request.amount.toString());
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة الطلبات المالية</h1>
          <p className="text-gray-600 mt-1">مراقبة طلبات تعبئة الرصيد في جميع المتاجر</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
          <p className="text-2xl font-bold text-gray-800">{requests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">قيد المراجعة</p>
          <p className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.request.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">موافق عليها</p>
          <p className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.request.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">إجمالي المبالغ الموافق عليها</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'all', label: 'الكل', count: requests.length },
          { id: 'pending', label: 'قيد المراجعة', count: requests.filter(r => r.request.status === 'pending').length },
          { id: 'approved', label: 'موافق عليها', count: requests.filter(r => r.request.status === 'approved').length },
          { id: 'rejected', label: 'مرفوضة', count: requests.filter(r => r.request.status === 'rejected').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((item) => (
              <div key={item.request.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Wallet className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          طلب تعبئة رصيد #{item.request.id}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Building2 size={14} />
                            <span>المتجر: {item.store?.name || 'غير محدد'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash size={14} />
                            <span>المرجع: {item.request.referenceNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date(item.request.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">المبلغ</p>
                          <p className="text-xl font-bold text-blue-600">
                            {parseFloat(item.request.amount.toString()).toFixed(2)} ر.س
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">العميل</p>
                          <p className="font-medium text-gray-800">
                            {item.customer?.name || `ID: ${item.request.customerId}`}
                          </p>
                          {item.customer?.phone && (
                            <p className="text-xs text-gray-500 mt-1">{item.customer.phone}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">البنك</p>
                          <p className="font-medium text-gray-800">{item.request.bank}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 ml-6">
                    {getStatusBadge(item.request.status)}
                    
                    {item.request.status === 'approved' && item.request.approvedAt && (
                      <p className="text-xs text-gray-500">
                        تمت الموافقة: {new Date(item.request.approvedAt).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

