import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Wallet, Building2, Calendar, Hash, X, Eye } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const BalanceRequests = () => {
  const { selectedStore } = useStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStore) {
      loadRequests();
    }
  }, [selectedStore, filter]);

  const loadRequests = async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      const allRequests = await window.api.customerBalance.getRequests(selectedStore.id);
      
      // Get customer details for each request
      const requestsWithCustomers = await Promise.all(
        allRequests.map(async (request: any) => {
          try {
            const customer = await window.api.customers.getAll({ storeId: selectedStore.id });
            const customerData = customer.find((c: any) => c.id === request.customerId);
            return {
              ...request,
              customer: customerData || null,
            };
          } catch {
            return { ...request, customer: null };
          }
        })
      );
      
      // Filter by status
      let filtered = requestsWithCustomers;
      if (filter !== 'all') {
        filtered = requestsWithCustomers.filter((r: any) => r.status === filter);
      }
      
      // Sort by date (newest first)
      filtered.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setRequests(filtered);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!confirm('هل تريد الموافقة على طلب تعبئة الرصيد هذا؟ سيتم إضافة المبلغ إلى رصيد العميل.')) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await window.api.customerBalance.approve({
        requestId,
        approvedBy: user.id,
      });
      loadRequests();
      alert('تم الموافقة على طلب تعبئة الرصيد بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل الموافقة على الطلب');
    }
  };

  const handleReject = async (requestId: number) => {
    if (!confirm('هل تريد رفض طلب تعبئة الرصيد هذا؟')) return;
    
    try {
      await window.api.customerBalance.reject(requestId);
      loadRequests();
      alert('تم رفض الطلب');
    } catch (error: any) {
      alert(error.message || 'فشل رفض الطلب');
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

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">طلبات تعبئة الرصيد</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة طلبات تعبئة رصيد العملاء</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <span className="text-yellow-700 font-medium">
              {pendingCount} طلب قيد المراجعة
            </span>
          </div>
        )}
      </div>


      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'pending', label: 'قيد المراجعة', count: requests.filter((r: any) => r.status === 'pending').length },
          { id: 'approved', label: 'موافق عليها', count: requests.filter((r: any) => r.status === 'approved').length },
          { id: 'rejected', label: 'مرفوضة', count: requests.filter((r: any) => r.status === 'rejected').length },
          { id: 'all', label: 'الكل', count: requests.length },
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
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : !selectedStore ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">يرجى اختيار متجر من القائمة أعلاه</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Wallet className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          طلب تعبئة رصيد #{request.id}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Building2 size={14} />
                            <span>البنك: {request.bank}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash size={14} />
                            <span>المرجع: {request.referenceNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">المبلغ</p>
                          <p className="text-xl font-bold text-blue-600">
                            {parseFloat(request.amount?.toString() || '0').toFixed(2)} ر.س
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">العميل</p>
                          <p className="font-medium text-gray-800">
                            {request.customer?.name || `ID: ${request.customerId}`}
                          </p>
                          {request.customer?.phone && (
                            <p className="text-xs text-gray-500 mt-1">{request.customer.phone}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Receipt Image */}
                      {request.metadata?.receiptImage && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-500 mb-2">صورة إشعار الإيداع</p>
                          <button
                            onClick={() => setSelectedReceipt(request.metadata.receiptImage)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            <Eye size={16} />
                            <span>معاينة الصورة</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(request.status)}
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={18} />
                          <span>موافقة</span>
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle size={18} />
                          <span>رفض</span>
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'approved' && request.approvedAt && (
                      <p className="text-xs text-gray-500">
                        تمت الموافقة: {new Date(request.approvedAt).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Image Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">صورة إشعار الإيداع</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] flex items-center justify-center">
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceRequests;


