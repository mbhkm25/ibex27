import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, User, Phone, Clock } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const CustomerRegistrationRequests = () => {
  const { selectedStore } = useStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadCustomers();
  }, [filter]);

  const loadCustomers = async () => {
    if (!selectedStore) return;
    try {
      setLoading(true);
      const allCustomers = await window.api.customers.getAll({ storeId: selectedStore.id });
      
      // Filter by registration status
      let filtered = allCustomers;
      if (filter !== 'all') {
        filtered = allCustomers.filter((c: any) => c.registrationStatus === filter);
      } else {
        // Show only customers with registration status
        filtered = allCustomers.filter((c: any) => c.registrationStatus);
      }
      
      setCustomers(filtered);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (customerId: number) => {
    if (!confirm('هل تريد الموافقة على تسجيل هذا العميل؟')) return;
    
    try {
      await window.api.customerAuth.approve(customerId);
      loadCustomers();
      alert('تم الموافقة على التسجيل بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل الموافقة على التسجيل');
    }
  };

  const handleReject = async (customerId: number) => {
    if (!confirm('هل تريد رفض تسجيل هذا العميل؟')) return;
    
    try {
      await window.api.customerAuth.reject(customerId);
      loadCustomers();
      alert('تم رفض التسجيل');
    } catch (error: any) {
      alert(error.message || 'فشل رفض التسجيل');
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

  const pendingCount = customers.filter((c: any) => c.registrationStatus === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">طلبات تسجيل العملاء</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة طلبات التسجيل الجديدة</p>
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
          { id: 'pending', label: 'قيد المراجعة', count: customers.filter((c: any) => c.registrationStatus === 'pending').length },
          { id: 'approved', label: 'موافق عليها', count: customers.filter((c: any) => c.registrationStatus === 'approved').length },
          { id: 'rejected', label: 'مرفوضة', count: customers.filter((c: any) => c.registrationStatus === 'rejected').length },
          { id: 'all', label: 'الكل', count: customers.length },
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

      {/* Customers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <div key={customer.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{customer.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Phone size={14} />
                            <span>{customer.phone || '-'}</span>
                          </div>
                          {customer.whatsapp && customer.whatsapp !== customer.phone && (
                            <div className="flex items-center gap-1">
                              <span>واتساب: {customer.whatsapp}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{new Date(customer.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {customer.notes && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                        {customer.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(customer.registrationStatus)}
                    
                    {customer.registrationStatus === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(customer.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={18} />
                          <span>موافقة</span>
                        </button>
                        <button
                          onClick={() => handleReject(customer.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle size={18} />
                          <span>رفض</span>
                        </button>
                      </div>
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
};

export default CustomerRegistrationRequests;


