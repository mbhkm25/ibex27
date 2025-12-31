import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, LogOut, Wallet, ShoppingBag, Calendar } from 'lucide-react';
import { useCustomer } from '../../contexts/CustomerContext';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { customer, stores, loading, loadCustomerData, logout } = useCustomer();

  useEffect(() => {
    if (!customer) {
      navigate('/customer/login');
      return;
    }
    loadCustomerData();
  }, [customer, navigate, loadCustomerData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم العميل</h1>
              <p className="text-sm text-gray-500 mt-1">مرحباً، {customer.name}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {stores.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <Store className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد متاجر مسجلة</h3>
            <p className="text-gray-500">لم يتم تسجيلك في أي متجر بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {stores.map((store: any) => {
              const currencySymbol = store.settings?.currencyId === 'SAR' ? 'ر.س' : 
                                   store.settings?.currencyId === 'YER' ? 'ريال' : 
                                   store.settings?.currencyId === 'USD' ? '$' : 'ر.س';
              const balance = parseFloat(store.balance || '0');

              return (
                <div
                  key={store.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Store Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold mb-1">{store.name}</h3>
                        {store.description && (
                          <p className="text-sm text-blue-100 line-clamp-2">{store.description}</p>
                        )}
                      </div>
                      <Store className="text-white opacity-20 flex-shrink-0" size={28} />
                    </div>
                  </div>

                  {/* Store Content */}
                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Balance */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Wallet size={18} />
                          <span className="text-sm font-medium">الرصيد</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          {balance.toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                    </div>

                    {/* Last Purchase */}
                    {store.lastPurchase ? (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Calendar size={16} />
                          <span className="text-xs font-medium">آخر عملية شراء</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">فاتورة #{store.lastPurchase.id}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(store.lastPurchase.createdAt)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-green-600">
                            {parseFloat(store.lastPurchase.total).toFixed(2)} {currencySymbol}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                        <p className="text-xs text-gray-500">لا توجد عمليات شراء سابقة</p>
                      </div>
                    )}

                    {/* Actions */}
                    <button
                      onClick={() => {
                        navigate(`/customer/store/${store.id}`);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      <span>تصفح المنتجات</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;

