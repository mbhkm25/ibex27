import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input } from '../../components/common';

const CustomerRegister = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [store, setStore] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadStore();
  }, [slug]);

  const loadStore = async () => {
    if (!slug) return;
    try {
      const storeData = await window.api.stores.getBySlug(slug);
      if (!storeData) {
        setError('المتجر غير موجود');
        return;
      }
      setStore(storeData);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات المتجر');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      const cleanedPhone = formData.phone.replace(/\D/g, '');
      if (cleanedPhone.length !== 9) {
        setError('رقم الجوال يجب أن يكون 9 أرقام');
        setLoading(false);
        return;
      }

      const result = await window.api.customerAuth.register({
        name: formData.name,
        phone: cleanedPhone,
        whatsapp: formData.whatsapp || cleanedPhone,
        password: formData.password,
        storeSlug: slug!,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/customer/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'فشل إرسال طلب التسجيل');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">تم إرسال طلب التسجيل بنجاح!</h2>
            <p className="text-gray-600">
              سيتم مراجعة طلبك من قبل التاجر. سيتم إشعارك عند الموافقة على طلبك.
            </p>
          </div>
          <Button onClick={() => navigate('/customer/login')}>
            الانتقال إلى تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        {store && (
          <div className="text-center mb-6 pb-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{store.name}</h1>
            {store.description && (
              <p className="text-gray-600 text-sm">{store.description}</p>
            )}
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تسجيل حساب جديد</h2>
          <p className="text-gray-500 text-sm">املأ البيانات التالية لإرسال طلب التسجيل</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="الاسم الرباعي"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="أدخل اسمك الكامل"
          />

          <Input
            label="رقم الجوال (9 أرقام)"
            value={formData.phone}
            onChange={handlePhoneChange}
            required
            placeholder="5xxxxxxxx"
            helperText="أدخل 9 أرقام فقط (بدون 05)"
          />

          <Input
            label="رقم واتساب (اختياري)"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            placeholder="5xxxxxxxx"
            helperText="إذا كان مختلف عن رقم الجوال"
          />

          <Input
            label="كلمة المرور"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="6 أحرف على الأقل"
            helperText="يجب أن تكون 6 أحرف على الأقل"
          />

          <Input
            label="تأكيد كلمة المرور"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            placeholder="أعد إدخال كلمة المرور"
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            variant="primary"
          >
            إرسال طلب التسجيل
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            لديك حساب بالفعل؟{' '}
            <button
              onClick={() => navigate('/customer/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              تسجيل الدخول
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;

