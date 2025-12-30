import React, { useEffect, useState } from 'react';
import { Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const ExpensesPage = () => {
  const { selectedStore } = useStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    note: ''
  });

  useEffect(() => {
    if (selectedStore) {
      loadExpenses();
    }
  }, [selectedStore]);

  const loadExpenses = async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      const data = await window.api.expenses.getAll(selectedStore.id);
      setExpenses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    try {
      await window.api.expenses.add({ ...formData, storeId: selectedStore.id });
      setShowModal(false);
      setFormData({ title: '', amount: '', note: '' });
      loadExpenses();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await window.api.expenses.delete({ id, storeId: selectedStore.id });
        loadExpenses();
      } catch (error: any) {
        alert(error.message || 'فشل حذف المصروف');
      }
    }
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="text-yellow-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">يرجى اختيار متجر</h3>
          <p className="text-sm text-yellow-700">
            يجب اختيار متجر من القائمة أعلاه لعرض وإدارة المصروفات
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">المصروفات</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>إضافة مصروف</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">البند</th>
                <th className="px-6 py-3 font-medium">المبلغ</th>
                <th className="px-6 py-3 font-medium">ملاحظات</th>
                <th className="px-6 py-3 font-medium">التاريخ</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">جاري التحميل...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">لا توجد مصروفات</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{expense.title}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{expense.amount} ر.س</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{expense.note || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(expense.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">إضافة مصروف جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">بند المصروف</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border p-2 rounded-lg" 
                  placeholder="مثال: فاتورة كهرباء"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">المبلغ</label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    required
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full pr-10 pl-4 py-2 border rounded-lg" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">ملاحظات</label>
                <textarea 
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                  className="w-full border p-2 rounded-lg h-24 resize-none" 
                />
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
