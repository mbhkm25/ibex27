import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'platform_admin') {
          navigate('/admin', { replace: true });
          return;
        }
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards Example */}
        {[
          { label: 'المبيعات اليوم', value: '1,200 ر.س', color: 'bg-blue-500' },
          { label: 'عدد الطلبات', value: '25', color: 'bg-green-500' },
          { label: 'العملاء الجدد', value: '5', color: 'bg-purple-500' },
          { label: 'المنتجات منخفضة المخزون', value: '3', color: 'bg-red-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;

