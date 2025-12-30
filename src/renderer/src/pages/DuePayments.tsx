import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const DuePaymentsPage = () => {
  const { selectedStore } = useStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    amount: '',
    status: 'unpaid',
    dateIn: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    if (selectedStore) {
      loadPayments();
    }
  }, [selectedStore]);

  const loadPayments = async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      const data = await window.api.duePayments.getAll(selectedStore.id);
      setPayments(data);
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
      if (formData.id) {
        await window.api.duePayments.update({ ...formData, storeId: selectedStore.id });
      } else {
        await window.api.duePayments.add({ ...formData, storeId: selectedStore.id });
      }
      setShowModal(false);
      resetForm();
      loadPayments();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      try {
        await window.api.duePayments.delete({ id, storeId: selectedStore.id });
        loadPayments();
      } catch (error: any) {
        alert(error.message || 'فشل حذف السجل');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      name: '',
      amount: '',
      status: 'unpaid',
      dateIn: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      note: ''
    });
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="text-yellow-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">يرجى اختيار متجر</h3>
          <p className="text-sm text-yellow-700">
            يجب اختيار متجر من القائمة أعلاه لعرض وإدارة الديون المستحقة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">الديون المستحقة</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>إضافة دين</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">الاسم</th>
                <th className="px-6 py-3 font-medium">المبلغ</th>
                <th className="px-6 py-3 font-medium">الحالة</th>
                <th className="px-6 py-3 font-medium">تاريخ الاستحقاق</th>
                <th className="px-6 py-3 font-medium">ملاحظات</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">جاري التحميل...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">لا توجد ديون مسجلة</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{payment.name}</td>
                    <td className="px-6 py-4 font-bold text-red-600">{payment.amount} ر.س</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {payment.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(payment.dueDate).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{payment.note || '-'}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button 
                        onClick={() => { setFormData({...payment, dateIn: new Date(payment.dateIn).toISOString().split('T')[0], dueDate: new Date(payment.dueDate).toISOString().split('T')[0]}); setShowModal(true); }}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(payment.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                        <Trash2 size={18} />
                      </button>
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
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'تعديل بيانات الدين' : 'تسجيل دين جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">الاسم</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border p-2 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">المبلغ</label>
                <input 
                  required
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full border p-2 rounded-lg" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">تاريخ الدين</label>
                  <input 
                    type="date"
                    required
                    value={formData.dateIn}
                    onChange={e => setFormData({...formData, dateIn: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">تاريخ الاستحقاق</label>
                  <input 
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">الحالة</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                >
                  <option value="unpaid">غير مدفوع</option>
                  <option value="paid">مدفوع</option>
                </select>
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

export default DuePaymentsPage;

