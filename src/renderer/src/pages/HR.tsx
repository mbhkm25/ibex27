import React, { useEffect, useState } from 'react';
import { Users, Clock, DollarSign, CheckCircle, XCircle, Plus, Printer, AlertCircle } from 'lucide-react';
import { generateSalarySlipPDF } from '../lib/pdf-generator';
import { useStore } from '../contexts/StoreContext';

const HRPage = () => {
  const { selectedStore } = useStore();
  const [activeTab, setActiveTab] = useState<'users' | 'presence' | 'salaries'>('presence');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>({});

  // User Form
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Salary Form
  const [salaryForm, setSalaryForm] = useState({
    userId: 0,
    status: 'pending',
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    total: '',
    items: [] as any[],
    deductions: [] as any[],
    note: ''
  });

  // Users List for Select
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (selectedStore) {
      loadData();
      loadStoreSettings();
      if (activeTab === 'salaries') loadUsers();
    }
  }, [activeTab, selectedStore]);

  const loadData = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      let result;
      if (activeTab === 'users') result = await window.api.hr.getUsers(selectedStore.id);
      if (activeTab === 'presence') result = await window.api.hr.getPresences(selectedStore.id);
      if (activeTab === 'salaries') result = await window.api.hr.getSalaries(selectedStore.id);
      setData(result || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreSettings = async () => {
    if (!selectedStore) return;
    try {
      const settings = await window.api.stores.get(selectedStore.id);
      if (settings) setStoreSettings(settings);
    } catch (error) {
      console.error('Failed to load store settings', error);
    }
  };

  const loadUsers = async () => {
    if (!selectedStore) return;
    
    const users = await window.api.hr.getUsers(selectedStore.id);
    setUsersList(users);
  };

  const handleCheckIn = async (status: 'present' | 'absent') => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return alert('يرجى تسجيل الدخول أولاً');
    
    try {
      await window.api.hr.checkIn({
        userId: user.id,
        storeId: selectedStore.id,
        status,
        note: 'تسجيل يدوي من النظام',
        lat: 0,
        long: 0
      });
      loadData();
    } catch (error: any) {
      alert(error.message || 'فشل تسجيل الحضور');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    try {
      await window.api.hr.addUser({ ...userForm, storeId: selectedStore.id });
      setShowModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'user' });
      loadData();
    } catch (error: any) {
      alert(error.message || 'فشل إضافة المستخدم');
    }
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    try {
      const items = [{ description: 'راتب أساسي', amount: salaryForm.total }];
      await window.api.hr.generateSalary({
        ...salaryForm,
        storeId: selectedStore.id,
        items,
        deductions: []
      });
      
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message || 'فشل إنشاء الراتب');
    }
  };

  const handlePrintSalary = async (salary: any) => {
    const user = usersList.find(u => u.id === salary.userId) || { name: salary.userName };
    
    await generateSalarySlipPDF(
      storeSettings,
      user,
      {
        ...salary,
        items: salary.items || [{ description: 'راتب', amount: salary.total }],
        deductions: salary.deductions || []
      }
    );
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="text-yellow-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">يرجى اختيار متجر</h3>
          <p className="text-sm text-yellow-700">
            يجب اختيار متجر من القائمة أعلاه لعرض وإدارة الموارد البشرية
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">الموارد البشرية</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'presence', label: 'الحضور', icon: Clock },
            { id: 'salaries', label: 'الرواتب', icon: DollarSign },
            { id: 'users', label: 'الموظفين', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'presence' && (
        <div className="flex gap-4 mb-6">
          <button onClick={() => handleCheckIn('present')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold">
            <CheckCircle /> تسجيل حضور
          </button>
          <button onClick={() => handleCheckIn('absent')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold">
            <XCircle /> تسجيل غياب
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">
                  {activeTab === 'users' ? 'الموظف' : activeTab === 'salaries' ? 'الموظف' : 'الموظف'}
                </th>
                <th className="px-6 py-3 font-medium">
                  {activeTab === 'users' ? 'البريد الإلكتروني' : activeTab === 'salaries' ? 'الفترة' : 'الحالة'}
                </th>
                <th className="px-6 py-3 font-medium">
                  {activeTab === 'users' ? 'الدور' : activeTab === 'salaries' ? 'الإجمالي' : 'التوقيت'}
                </th>
                <th className="px-6 py-3 font-medium">تاريخ التسجيل</th>
                {activeTab === 'salaries' && <th className="px-6 py-3 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">جاري التحميل...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.userName || item.name}</td>
                    <td className="px-6 py-4">
                      {activeTab === 'users' ? item.email : 
                       activeTab === 'salaries' ? item.period : 
                       <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {item.status === 'present' ? 'حاضر' : 'غائب'}
                       </span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === 'users' ? (item.role === 'admin' ? 'مدير' : 'موظف') : 
                       activeTab === 'salaries' ? `${item.total} ر.س` : 
                       new Date(item.createdAt).toLocaleTimeString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    {activeTab === 'salaries' && (
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handlePrintSalary(item)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                          title="طباعة"
                        >
                          <Printer size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(activeTab === 'users' || activeTab === 'salaries') && (
        <div className="flex justify-end mt-4">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>{activeTab === 'users' ? 'إضافة موظف' : 'صرف راتب'}</span>
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">
              {activeTab === 'users' ? 'إضافة موظف جديد' : 'إصدار راتب'}
            </h3>
            
            {activeTab === 'users' ? (
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">الاسم</label>
                  <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-1">البريد الإلكتروني</label>
                  <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-1">كلمة المرور</label>
                  <input required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-1">الدور</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full border p-2 rounded-lg">
                    <option value="user">موظف</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">الموظف</label>
                  <select required value={salaryForm.userId} onChange={e => setSalaryForm({...salaryForm, userId: parseInt(e.target.value)})} className="w-full border p-2 rounded-lg">
                    <option value="">اختر موظف...</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">الفترة</label>
                  <input type="month" required value={salaryForm.period} onChange={e => setSalaryForm({...salaryForm, period: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-1">المبلغ الإجمالي</label>
                  <input required type="number" value={salaryForm.total} onChange={e => setSalaryForm({...salaryForm, total: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-1">ملاحظات</label>
                  <textarea value={salaryForm.note} onChange={e => setSalaryForm({...salaryForm, note: e.target.value})} className="w-full border p-2 rounded-lg h-24 resize-none" />
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPage;
