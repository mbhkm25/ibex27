import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validatePhone } from '../../../shared/utils/currency';
import { validateEmail, validatePassword } from '../../../shared/utils/validation';

const MerchantRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Check API availability on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.api) {
        console.error('window.api is not defined');
        setError('واجهة البرمجة غير متاحة. يرجى إعادة تحميل الصفحة.');
      } else if (!window.api.auth) {
        console.error('window.api.auth is not defined');
        setError('واجهة البرمجة غير متاحة. يرجى إعادة تحميل الصفحة.');
      } else {
        console.log('API is available:', {
          hasApi: !!window.api,
          hasAuth: !!window.api.auth,
          hasRegisterMerchant: !!(window.api.auth && window.api.auth.registerMerchant)
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // التحقق من البيانات
    if (!formData.name.trim()) {
      setError('الاسم الرباعي مطلوب');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('البريد الإلكتروني غير صحيح');
      setLoading(false);
      return;
    }

    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (!validatePhone(cleanedPhone)) {
      setError('رقم الجوال يجب أن يكون 9 أرقام');
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      setLoading(false);
      return;
    }

    try {
      // Check if api is available with better error handling
      if (typeof window === 'undefined' || !window.api) {
        throw new Error('واجهة البرمجة غير متاحة. يرجى إعادة تحميل الصفحة.');
      }
      
      if (!window.api.auth) {
        throw new Error('واجهة البرمجة غير متاحة. يرجى إعادة تحميل الصفحة.');
      }
      
      if (typeof window.api.auth.registerMerchant !== 'function') {
        throw new Error('واجهة البرمجة غير متاحة. يرجى إعادة تحميل الصفحة.');
      }

      await window.api.auth.registerMerchant({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: cleanedPhone,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 9) {
      setFormData({ ...formData, phone: value });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم إنشاء الحساب بنجاح!</h2>
          <p className="text-gray-600 mb-4">سيتم توجيهك إلى صفحة تسجيل الدخول...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Ibex27</h1>
          <p className="text-gray-500">إنشاء حساب تاجر جديد</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم الرباعي <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="أحمد محمد علي السعيد"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني <span className="text-red-500">*</span>
            </label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="merchant@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الجوال (9 أرقام) <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="512345678"
              maxLength={9}
              required
            />
            <p className="text-xs text-gray-500 mt-1">أدخل 9 أرقام فقط (بدون 05 أو +966)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور <span className="text-red-500">*</span>
            </label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              minLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">6 أحرف على الأقل</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تأكيد كلمة المرور <span className="text-red-500">*</span>
            </label>
            <input 
              type="password" 
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            لديك حساب بالفعل؟{' '}
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MerchantRegister;

