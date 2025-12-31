import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await window.api.login({ email, password });
      if (user) {
        // User is already saved to localStorage by web-adapter
        // Navigate based on role
        if (user.role === 'platform_admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // Quick login buttons for development
  const handleQuickLogin = async (type: 'admin' | 'merchant' | 'cashier' | 'customer') => {
    setError('');
    setLoading(true);

    try {
      let user;
      
      switch (type) {
        case 'admin':
          // Platform Admin
          user = await window.api.login({ 
            email: 'admin@ibex.com', 
            password: 'admin123' 
          });
          if (user) {
            // User is already saved to localStorage by web-adapter
            navigate('/admin');
          }
          break;
          
        case 'merchant':
          // Merchant
          user = await window.api.login({ 
            email: 'merchant@example.com', 
            password: 'merchant123' 
          });
          if (user) {
            // User is already saved to localStorage by web-adapter
            navigate('/');
          }
          break;
          
        case 'cashier':
          // Cashier
          user = await window.api.login({ 
            email: 'cashier@example.com', 
            password: 'cashier123' 
          });
          if (user) {
            // User is already saved to localStorage by web-adapter
            navigate('/');
          }
          break;
          
        case 'customer':
          // Customer (uses phone instead of email)
          try {
            const customerData = await window.api.customerAuth?.login({
              phone: '771234567',
              password: 'customer123'
            });
            if (customerData) {
              localStorage.setItem('customer', JSON.stringify(customerData.customer));
              localStorage.setItem('customerStores', JSON.stringify(customerData.stores));
              navigate('/customer/dashboard');
            }
          } catch (err: any) {
            setError('العميل: ' + (err.message || 'فشل تسجيل الدخول'));
          }
          break;
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Ibex27</h1>
          <p className="text-gray-500">تسجيل الدخول للمتابعة</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="admin@ibex.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ليس لديك حساب؟{' '}
            <Link 
              to="/register" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>

        {/* Quick Login Buttons for Development */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-4 text-center">🔧 أزرار سريعة للتطوير (مؤقتة)</p>
          <div className="space-y-2">
            {/* Admin */}
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                👑 أدمن المنصة
              </button>
              <button
                type="button"
                onClick={() => {
                  // In web mode, open in new tab instead of new window
                  if (window.api.window?.openWithLogin) {
                    window.api.window.openWithLogin('admin', 'أدمن المنصة - Ibex27');
                  } else {
                    // Fallback: open in new tab
                    window.open(window.location.href, '_blank');
                  }
                }}
                disabled={loading}
                className="px-2 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors disabled:opacity-50 border border-purple-200"
                title="فتح في نافذة جديدة"
              >
                🪟
              </button>
            </div>
            
            {/* Merchant */}
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('merchant')}
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                🏪 التاجر
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.api.window?.openWithLogin) {
                    window.api.window.openWithLogin('merchant', 'التاجر - Ibex27');
                  } else {
                    window.open(window.location.href, '_blank');
                  }
                }}
                disabled={loading}
                className="px-2 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50 border border-blue-200"
                title="فتح في نافذة جديدة"
              >
                🪟
              </button>
            </div>
            
            {/* Cashier */}
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('cashier')}
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                💰 الكاشير
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.api.window?.openWithLogin) {
                    window.api.window.openWithLogin('cashier', 'الكاشير - Ibex27');
                  } else {
                    window.open(window.location.href, '_blank');
                  }
                }}
                disabled={loading}
                className="px-2 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-50 border border-green-200"
                title="فتح في نافذة جديدة"
              >
                🪟
              </button>
            </div>
            
            {/* Customer */}
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors disabled:opacity-50"
              >
                👤 العميل
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.api.window?.openWithLogin) {
                    window.api.window.openWithLogin('customer', 'العميل - Ibex27');
                  } else {
                    window.open(window.location.href, '_blank');
                  }
                }}
                disabled={loading}
                className="px-2 py-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors disabled:opacity-50 border border-orange-200"
                title="فتح في نافذة جديدة"
              >
                🪟
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
