import { useEffect, useState } from 'react';
import { Check, X, Eye, AlertCircle, Building2 } from 'lucide-react';

const SubscriptionRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await window.api.subscriptions.getAllRequests();
      setRequests(data);
    } catch (error: any) {
      console.error('Failed to load requests:', error);
      alert(error.message || 'فشل تحميل طلبات الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) return;

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }
      const user = JSON.parse(userStr);
      await window.api.subscriptions.approveRequest(requestId, user.id);
      alert('تمت الموافقة على الطلب بنجاح');
      loadRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      alert(error.message || 'فشل الموافقة على الطلب');
    }
  };

  const handleReject = async (requestId: number) => {
    if (!rejectReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }
      const user = JSON.parse(userStr);
      await window.api.subscriptions.rejectRequest(requestId, user.id, rejectReason);
      alert('تم رفض الطلب بنجاح');
      loadRequests();
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error: any) {
      alert(error.message || 'فشل رفض الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { text: string; color: string; icon: any }> = {
      pending: { text: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle },
      approved: { text: 'موافق عليه', color: 'bg-green-100 text-green-800 border-green-300', icon: Check },
      rejected: { text: 'مرفوض', color: 'bg-red-100 text-red-800 border-red-300', icon: X },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  const filteredRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">طلبات الاشتراك</h2>
          <p className="text-gray-600 mt-1">مراجعة وموافقة طلبات تجديد الاشتراك</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            إجمالي الطلبات: {requests.length} | قيد الانتظار: {filteredRequests.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">المتجر</th>
                  <th className="px-6 py-3 font-medium">الباقة</th>
                  <th className="px-6 py-3 font-medium">المبلغ</th>
                  <th className="px-6 py-3 font-medium">طريقة الدفع</th>
                  <th className="px-6 py-3 font-medium">التاريخ</th>
                  <th className="px-6 py-3 font-medium">الحالة</th>
                  <th className="px-6 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="font-medium">{request.store?.name || 'غير محدد'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{request.plan?.displayName || 'غير محدد'}</span>
                        <div className="text-xs text-gray-500">
                          {request.plan?.durationMonths} {request.plan?.durationMonths === 1 ? 'شهر' : 'أشهر'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-600">
                          {parseFloat(request.amount).toFixed(2)} ر.س
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {
                          request.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' :
                          request.paymentMethod === 'cash' ? 'نقد' : 'بطاقة'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(request.createdAt).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                            title="عرض التفاصيل"
                          >
                            <Eye size={18} />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:bg-green-50 p-1 rounded"
                                title="موافقة"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setRejectReason('');
                                }}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                                title="رفض"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">تفاصيل طلب الاشتراك #{selectedRequest.id}</h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">المتجر</p>
                  <p className="font-medium">{selectedRequest.store?.name || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الباقة</p>
                  <p className="font-medium">{selectedRequest.plan?.displayName || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المبلغ</p>
                  <p className="font-bold text-blue-600">
                    {parseFloat(selectedRequest.amount).toFixed(2)} ر.س
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">طريقة الدفع</p>
                  <p className="font-medium">
                    {selectedRequest.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' :
                     selectedRequest.paymentMethod === 'cash' ? 'نقد' : 'بطاقة'}
                  </p>
                </div>
                {selectedRequest.paymentReference && (
                  <div>
                    <p className="text-sm text-gray-500">رقم المرجع</p>
                    <p className="font-medium">{selectedRequest.paymentReference}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">التاريخ</p>
                  <p className="font-medium">
                    {new Date(selectedRequest.createdAt).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              {selectedRequest.paymentReceipt && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">إيصال الدفع</p>
                  <img
                    src={selectedRequest.paymentReceipt}
                    alt="إيصال الدفع"
                    className="max-w-full h-auto border rounded-lg"
                  />
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سبب الرفض (في حالة الرفض)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="أدخل سبب الرفض..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      موافقة
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      رفض
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'approved' && selectedRequest.approvedAt && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>تمت الموافقة:</strong> {new Date(selectedRequest.approvedAt).toLocaleString('ar-SA')}
                  </p>
                  {selectedRequest.approvedByUser && (
                    <p className="text-xs text-green-600 mt-1">
                      بواسطة: {selectedRequest.approvedByUser.name}
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>سبب الرفض:</strong> {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionRequests;

