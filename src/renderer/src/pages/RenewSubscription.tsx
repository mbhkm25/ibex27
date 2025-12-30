import { useEffect, useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Check, X, Building2, Users, Package, Upload, AlertCircle } from 'lucide-react';

const RenewSubscription = () => {
  const { selectedStore } = useStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cash' | 'card',
    paymentReference: '',
    paymentReceipt: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (selectedStore) {
      loadPlans();
      loadRequests();
    }
  }, [selectedStore]);

  const loadPlans = async () => {
    try {
      const data = await window.api.subscriptions.getPlans();
      setPlans(data);
    } catch (error: any) {
      console.error('Failed to load plans:', error);
      alert(error.message || 'فشل تحميل الباقات');
    }
  };

  const loadRequests = async () => {
    if (!selectedStore) return;
    try {
      const data = await window.api.subscriptions.getStoreRequests(selectedStore.id);
      setRequests(data);
    } catch (error: any) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setPaymentData({ ...paymentData, paymentReceipt: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !selectedPlan) return;

    setSubmitting(true);
    try {
      // Convert image to base64 if exists
      let receiptBase64: string | undefined;
      if (paymentData.paymentReceipt) {
        receiptBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(paymentData.paymentReceipt as Blob);
        });
      }

      await window.api.subscriptions.createRequest({
        storeId: selectedStore.id,
        planId: selectedPlan.id,
        amount: parseFloat(selectedPlan.price),
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference || undefined,
        paymentReceipt: receiptBase64 || undefined,
      });

      alert('تم إرسال طلب الاشتراك بنجاح! سيتم مراجعته من قبل إدارة المنصة.');
      setShowPaymentForm(false);
      setSelectedPlan(null);
      setPaymentData({
        paymentMethod: 'bank_transfer',
        paymentReference: '',
        paymentReceipt: null,
      });
      loadRequests();
    } catch (error: any) {
      alert(error.message || 'فشل إرسال طلب الاشتراك');
    } finally {
      setSubmitting(false);
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

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">يرجى اختيار متجر أولاً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">تجديد الاشتراك</h2>
          <p className="text-gray-600 mt-1">اختر باقة اشتراك جديدة لمتجرك</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">حالة الاشتراك الحالية</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">اسم المتجر</p>
            <p className="font-medium">{selectedStore.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">الباقة الحالية</p>
            <p className="font-medium">{selectedStore.subscriptionPlan || 'غير محدد'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">حالة الاشتراك</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedStore.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' :
              selectedStore.subscriptionStatus === 'expired' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {selectedStore.subscriptionStatus === 'active' ? 'نشط' :
               selectedStore.subscriptionStatus === 'expired' ? 'منتهي' :
               'قيد الانتظار'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">تاريخ الانتهاء</p>
            <p className="font-medium">
              {selectedStore.subscriptionExpiry
                ? new Date(selectedStore.subscriptionExpiry).toLocaleDateString('ar-SA')
                : 'غير محدد'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      {!showPaymentForm ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">الباقات المتاحة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold text-gray-800">{plan.displayName}</h4>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {parseFloat(plan.price).toFixed(2)} ر.س
                  </div>
                  <div className="text-sm text-gray-500">
                    / {plan.durationMonths} {plan.durationMonths === 1 ? 'شهر' : 'أشهر'}
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((feature: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <Check className="text-green-600 flex-shrink-0" size={16} />
                        ) : (
                          <X className="text-gray-300 flex-shrink-0" size={16} />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                          {feature.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      {plan.maxProducts && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="text-blue-600" size={16} />
                          <span>حد أقصى {plan.maxProducts} منتج</span>
                        </div>
                      )}
                      {plan.maxUsers && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="text-blue-600" size={16} />
                          <span>حد أقصى {plan.maxUsers} مستخدم</span>
                        </div>
                      )}
                      {plan.maxStores && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="text-blue-600" size={16} />
                          <span>{plan.maxStores} متجر</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  اختر هذه الباقة
                </button>
              </div>
            ))}
          </div>
          {plans.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle className="mx-auto text-yellow-600 mb-2" size={32} />
              <p className="text-yellow-800">لا توجد باقات متاحة حالياً</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              إتمام طلب الاشتراك - {selectedPlan?.displayName}
            </h3>
            <button
              onClick={() => {
                setShowPaymentForm(false);
                setSelectedPlan(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الدفع *
              </label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  paymentMethod: e.target.value as 'bank_transfer' | 'cash' | 'card',
                })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="cash">نقد</option>
                <option value="card">بطاقة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم المرجع / رقم الإشعار *
              </label>
              <input
                type="text"
                value={paymentData.paymentReference}
                onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="أدخل رقم المرجع من عملية الدفع"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إيصال الدفع (اختياري)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  {paymentData.paymentReceipt ? (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-green-600" size={32} />
                      <p className="text-sm text-gray-600">{paymentData.paymentReceipt.name}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPaymentData({ ...paymentData, paymentReceipt: null });
                        }}
                        className="text-red-600 text-sm"
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-gray-400" size={32} />
                      <p className="text-sm text-gray-600">اضغط لرفع صورة الإيصال</p>
                      <p className="text-xs text-gray-400">JPG, PNG (حد أقصى 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">المبلغ الإجمالي:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {selectedPlan ? parseFloat(selectedPlan.price).toFixed(2) : '0.00'} ر.س
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                سيتم مراجعة طلبك من قبل إدارة المنصة والموافقة عليه يدوياً
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Previous Requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">طلبات الاشتراك السابقة</h3>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-800">
                        {request.plan?.displayName || 'باقة غير محددة'}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>المبلغ: {parseFloat(request.amount).toFixed(2)} ر.س</p>
                      <p>طريقة الدفع: {
                        request.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' :
                        request.paymentMethod === 'cash' ? 'نقد' : 'بطاقة'
                      }</p>
                      {request.paymentReference && (
                        <p>رقم المرجع: {request.paymentReference}</p>
                      )}
                      <p>التاريخ: {new Date(request.createdAt).toLocaleString('ar-SA')}</p>
                      {request.approvedAt && (
                        <p className="text-green-600">تمت الموافقة: {new Date(request.approvedAt).toLocaleString('ar-SA')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewSubscription;

