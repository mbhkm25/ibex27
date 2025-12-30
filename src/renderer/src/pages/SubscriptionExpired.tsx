import { AlertCircle, Phone, Mail, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionExpiredProps {
  store: any;
}

export default function SubscriptionExpired({ store }: SubscriptionExpiredProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            الاشتراك منتهي
          </h1>
          
          <p className="text-gray-600 mb-6">
            عذراً، انتهى الاشتراك الخاص بمتجرك. يرجى التواصل مع إدارة المنصة لتجديد الاشتراك.
          </p>

          {store && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-right">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">اسم المتجر:</span>
                  <span className="font-medium text-gray-900">{store.name}</span>
                </div>
                {store.subscriptionExpiry && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">تاريخ الانتهاء:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(store.subscriptionExpiry).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">حالة الاشتراك:</span>
                  <span className="font-medium text-red-600">
                    {store.subscriptionStatus === 'expired' ? 'منتهي' : store.subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                للتواصل مع الإدارة:
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>الهاتف: <span className="font-medium">+966 50 123 4567</span></p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-5" />
                  البريد: <span className="font-medium">admin@ibex27.com</span>
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>ملاحظة:</strong> لن تتمكن من إجراء أي عمليات بيع أو تعديلات حتى يتم تجديد الاشتراك.
              </p>
            </div>

            <button
              onClick={() => navigate('/renew-subscription')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              تجديد الاشتراك الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

