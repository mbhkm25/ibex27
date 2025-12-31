import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, LogIn, UserPlus } from 'lucide-react';
import CustomerLogin from './CustomerLogin';
import CustomerRegister from './CustomerRegister';

const StoreLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      loadStore();
    }
    // Check if customer is already logged in
    const customerStr = localStorage.getItem('customer');
    if (customerStr) {
      try {
        setCustomer(JSON.parse(customerStr));
      } catch (e) {
        console.error('Failed to parse customer:', e);
      }
    }
  }, [slug]);

  const loadStore = async () => {
    try {
      setLoading(true);
      
      // Try Electron API first (if available)
      if (window.api?.stores?.getBySlug) {
        const data = await window.api.stores.getBySlug(slug!);
        setStore(data);
        return;
      }
      
      // Web mode: fetch from API
      const response = await fetch(`/api/stores/get-by-slug?slug=${slug}`);
      if (response.ok) {
        const data = await response.json();
        setStore(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'المتجر غير موجود');
      }
    } catch (error: any) {
      console.error('Failed to load store:', error);
      alert(error.message || 'فشل تحميل بيانات المتجر');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterStore = () => {
    if (customer) {
      // Find store in customer's stores
      const customerStores = JSON.parse(localStorage.getItem('customerStores') || '[]');
      const storeData = customerStores.find((s: any) => s.slug === slug);
      if (storeData) {
        navigate(`/customer/store/${storeData.id}`);
      } else {
        alert('أنت غير مسجل في هذا المتجر');
        setShowRegister(true);
      }
    } else {
      setShowLogin(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Store className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">المتجر غير موجود</h2>
          <p className="text-gray-600">الرابط الذي تحاول الوصول إليه غير صحيح</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return <CustomerLogin onSuccess={() => {
      setShowLogin(false);
      loadStore();
      const customerStr = localStorage.getItem('customer');
      if (customerStr) {
        setCustomer(JSON.parse(customerStr));
      }
    }} />;
  }

  if (showRegister) {
    return <CustomerRegister />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{store.name}</h1>
                {store.description && (
                  <p className="text-sm text-gray-500 mt-1">{store.description}</p>
                )}
              </div>
            </div>
            {customer ? (
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                لوحة التحكم
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                >
                  <LogIn size={18} />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  <span>إنشاء حساب</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <Store className="mx-auto text-blue-600 mb-6" size={64} />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">مرحباً بك في {store.name}</h2>
            {store.settings?.welcomeMessage && (
              <p className="text-lg text-gray-600 mb-8">{store.settings.welcomeMessage}</p>
            )}
            <p className="text-gray-500 mb-8">
              تصفح منتجاتنا واطلب بسهولة من خلال بوابة العملاء
            </p>
            <button
              onClick={handleEnterStore}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg flex items-center justify-center gap-3 mx-auto transition-colors"
            >
              <ShoppingBag size={24} />
              <span>دخول المتجر</span>
            </button>
          </div>
        </div>

        {/* Store Info */}
        {store.contactInfo && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات التواصل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {store.contactInfo.phone && (
                <div>
                  <span className="text-gray-500">الهاتف:</span>
                  <span className="font-medium mr-2">{store.contactInfo.phone}</span>
                </div>
              )}
              {store.contactInfo.whatsapp && (
                <div>
                  <span className="text-gray-500">واتساب:</span>
                  <span className="font-medium mr-2">{store.contactInfo.whatsapp}</span>
                </div>
              )}
              {store.contactInfo.email && (
                <div>
                  <span className="text-gray-500">البريد:</span>
                  <span className="font-medium mr-2">{store.contactInfo.email}</span>
                </div>
              )}
              {store.contactInfo.address && (
                <div>
                  <span className="text-gray-500">العنوان:</span>
                  <span className="font-medium mr-2">{store.contactInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StoreLanding;

