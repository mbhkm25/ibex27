import React, { useEffect, useState } from 'react';
import { ShoppingBag, User, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useNavigate } from 'react-router-dom';

const CustomerOrdersPage = () => {
  const { selectedStore } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedStore) {
      loadOrders();
    }
  }, [selectedStore]);

  const loadOrders = async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      const data = await window.api.customerPortal.getPendingOrders(selectedStore.id);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async (order: any) => {
    try {
      const invoiceData = await window.api.customerPortal.convertOrderToInvoice(order.id);
      
      // Navigate to selling page with order data
      navigate('/selling', { 
        state: { 
          orderData: invoiceData,
          customerId: invoiceData.customerId,
          items: invoiceData.items,
        } 
      });
    } catch (error: any) {
      alert(error.message || 'فشل تحويل الطلب إلى فاتورة');
    }
  };

  const handleApprove = async (orderId: number) => {
    // TODO: Implement order approval
    alert('سيتم تنفيذ الموافقة على الطلب قريباً');
  };

  const handleReject = async (orderId: number) => {
    if (!confirm('هل تريد رفض هذا الطلب؟')) return;
    // TODO: Implement order rejection
    alert('سيتم تنفيذ رفض الطلب قريباً');
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">يرجى اختيار متجر من القائمة أعلاه</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">طلبات الشراء القادمة</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">لا توجد طلبات معلقة</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          طلب شراء #{order.id}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          {order.customer && (
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{order.customer.name} ({order.customer.phone})</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            <span className="font-semibold text-blue-600">
                              {parseFloat(order.total.toString()).toFixed(2)} ر.س
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">ملاحظات العميل:</span> {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">أصناف الطلب:</p>
                      <div className="space-y-2">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <span className="font-medium">{item.product?.name || `Product ${item.productId}`}</span>
                              <span className="text-gray-500 mr-2">× {item.quantity}</span>
                            </div>
                            <span className="text-gray-700">
                              {parseFloat(item.price.toString()).toFixed(2)} ر.س
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 ml-6">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                      قيد المراجعة
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConvertToInvoice(order)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FileText size={18} />
                        <span>تجهيز الفاتورة</span>
                      </button>
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={18} />
                        <span>موافقة</span>
                      </button>
                      <button
                        onClick={() => handleReject(order.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle size={18} />
                        <span>رفض</span>
                      </button>
                    </div>
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

export default CustomerOrdersPage;

