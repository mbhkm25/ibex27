import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/common';
import { useCustomer } from '../../contexts/CustomerContext';

interface CustomerLoginProps {
  onSuccess?: () => void;
}

const CustomerLogin = ({ onSuccess }: CustomerLoginProps) => {
  const navigate = useNavigate();
  const { setCustomer, setStores, loadCustomerData } = useCustomer();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      if (cleanedPhone.length !== 9) {
        setError('رقم الجوال يجب أن يكون 9 أرقام');
        setLoading(false);
        return;
      }

      const result = await window.api.customerAuth.login({
        phone: cleanedPhone,
        password,
      });

      if (result.customer && result.stores) {
        localStorage.setItem('customer', JSON.stringify(result.customer));
        localStorage.setItem('customerStores', JSON.stringify(result.stores));
        setCustomer(result.customer);
        setStores(result.stores);
        await loadCustomerData();
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/customer/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 9) {
      setPhone(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">IBEX</h1>
          <p className="text-gray-500">تسجيل دخول العميل</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="رقم الجوال (9 أرقام)"
            value={phone}
            onChange={handlePhoneChange}
            required
            placeholder="5xxxxxxxx"
            helperText="أدخل 9 أرقام فقط (بدون 05)"
          />

          <Input
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            variant="primary"
          >
            تسجيل الدخول
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ليس لديك حساب؟{' '}
            <span className="text-gray-400">اتصل بالتاجر للحصول على رابط التسجيل</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;

