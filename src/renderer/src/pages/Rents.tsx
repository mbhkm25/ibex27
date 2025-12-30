import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const RentsPage = () => {
  const { selectedStore } = useStore();
  const [activeTab, setActiveTab] = useState<'rentals' | 'items'>('rentals');
  const [rentals, setRentals] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Rental Form State
  const [rentalForm, setRentalForm] = useState({
    id: 0,
    name: '',
    itemCount: 1,
    amount: '',
    penalty: '0',
    rentDate: new Date().toISOString().split('T')[0],
    durationDays: 1,
    paid: false,
    note: ''
  });

  // Item Form State
  const [itemForm, setItemForm] = useState({
    id: 0,
    name: '',
    code: '',
    stock: 0,
    rent3Days: '',
    rent1Week: '',
    rent1Month: '',
    note: ''
  });

  useEffect(() => {
    if (selectedStore) {
      loadData();
    }
  }, [activeTab, selectedStore]);

  const loadData = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      if (activeTab === 'rentals') {
        const data = await window.api.rents.getAll(selectedStore.id);
        setRentals(data);
      } else {
        const data = await window.api.rents.items.getAll(selectedStore.id);
        setItems(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    try {
      if (rentalForm.id) {
        await window.api.rents.update({ ...rentalForm, storeId: selectedStore.id });
      } else {
        await window.api.rents.add({ ...rentalForm, storeId: selectedStore.id });
      }
      setShowModal(false);
      resetForms();
      loadData();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    try {
      await window.api.rents.items.add({ ...itemForm, storeId: selectedStore.id });
      setShowModal(false);
      resetForms();
      loadData();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const resetForms = () => {
    setRentalForm({
      id: 0, name: '', itemCount: 1, amount: '', penalty: '0',
      rentDate: new Date().toISOString().split('T')[0], durationDays: 1, paid: false, note: ''
    });
    setItemForm({
      id: 0, name: '', code: '', stock: 0, rent3Days: '', rent1Week: '', rent1Month: '', note: ''
    });
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    if (confirm('هل أنت متأكد من الحذف؟')) {
      try {
        if (activeTab === 'rentals') {
          await window.api.rents.delete({ id, storeId: selectedStore.id });
        } else {
          await window.api.rents.items.delete({ id, storeId: selectedStore.id });
        }
        loadData();
      } catch (error: any) {
        alert(error.message || 'فشل الحذف');
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
            يجب اختيار متجر من القائمة أعلاه لعرض وإدارة التأجير
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة التأجير</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('rentals')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'rentals' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            سجلات التأجير
          </button>
          <button 
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            أصناف التأجير
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">الاسم</th>
                {activeTab === 'rentals' ? (
                  <>
                    <th className="px-6 py-3 font-medium">عدد العناصر</th>
                    <th className="px-6 py-3 font-medium">المبلغ</th>
                    <th className="px-6 py-3 font-medium">التاريخ</th>
                    <th className="px-6 py-3 font-medium">الحالة</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 font-medium">الكود</th>
                    <th className="px-6 py-3 font-medium">المخزون</th>
                    <th className="px-6 py-3 font-medium">سعر (3 أيام)</th>
                    <th className="px-6 py-3 font-medium">سعر (أسبوع)</th>
                  </>
                )}
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">جاري التحميل...</td></tr>
              ) : (activeTab === 'rentals' ? rentals : items).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>
              ) : (
                (activeTab === 'rentals' ? rentals : items).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{item.name}</td>
                    {activeTab === 'rentals' ? (
                      <>
                        <td className="px-6 py-4">{item.itemCount}</td>
                        <td className="px-6 py-4 font-bold">{item.amount} ر.س</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(item.rentDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${item.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.paid ? 'مدفوع' : 'معلق'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">{item.code}</td>
                        <td className="px-6 py-4">{item.stock}</td>
                        <td className="px-6 py-4">{item.rent3Days}</td>
                        <td className="px-6 py-4">{item.rent1Week}</td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
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
      
      <div className="flex justify-end">
         <button 
           onClick={() => { resetForms(); setShowModal(true); }}
           className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>{activeTab === 'rentals' ? 'تسجيل تأجير' : 'إضافة صنف'}</span>
         </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4">{activeTab === 'rentals' ? 'تسجيل عملية تأجير' : 'إضافة صنف للتأجير'}</h3>
            
            {activeTab === 'rentals' ? (
              <form onSubmit={handleRentalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">اسم المستأجر</label>
                  <input required value={rentalForm.name} onChange={e => setRentalForm({...rentalForm, name: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">عدد العناصر</label>
                    <input type="number" value={rentalForm.itemCount} onChange={e => setRentalForm({...rentalForm, itemCount: parseInt(e.target.value)})} className="w-full border p-2 rounded-lg" />
                  </div>
                   <div>
                    <label className="block text-sm mb-1">المبلغ الإجمالي</label>
                    <input required type="number" value={rentalForm.amount} onChange={e => setRentalForm({...rentalForm, amount: e.target.value})} className="w-full border p-2 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">تاريخ التأجير</label>
                    <input type="date" value={rentalForm.rentDate} onChange={e => setRentalForm({...rentalForm, rentDate: e.target.value})} className="w-full border p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">المدة (أيام)</label>
                    <input type="number" value={rentalForm.durationDays} onChange={e => setRentalForm({...rentalForm, durationDays: parseInt(e.target.value)})} className="w-full border p-2 rounded-lg" />
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                  <input type="checkbox" id="paid" checked={rentalForm.paid} onChange={e => setRentalForm({...rentalForm, paid: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="paid" className="text-sm">تم الدفع</label>
                </div>
                <div>
                  <label className="block text-sm mb-1">ملاحظات</label>
                  <textarea value={rentalForm.note} onChange={e => setRentalForm({...rentalForm, note: e.target.value})} className="w-full border p-2 rounded-lg h-24 resize-none" />
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleItemSubmit} className="space-y-4">
                 <div>
                  <label className="block text-sm mb-1">اسم الصنف</label>
                  <input required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">الكود</label>
                    <input required value={itemForm.code} onChange={e => setItemForm({...itemForm, code: e.target.value})} className="w-full border p-2 rounded-lg" />
                  </div>
                   <div>
                    <label className="block text-sm mb-1">المخزون</label>
                    <input type="number" value={itemForm.stock} onChange={e => setItemForm({...itemForm, stock: parseInt(e.target.value)})} className="w-full border p-2 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs mb-1">سعر 3 أيام</label>
                    <input type="number" value={itemForm.rent3Days} onChange={e => setItemForm({...itemForm, rent3Days: e.target.value})} className="w-full border p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">سعر أسبوع</label>
                    <input type="number" value={itemForm.rent1Week} onChange={e => setItemForm({...itemForm, rent1Week: e.target.value})} className="w-full border p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">سعر شهر</label>
                    <input type="number" value={itemForm.rent1Month} onChange={e => setItemForm({...itemForm, rent1Month: e.target.value})} className="w-full border p-2 rounded-lg" />
                  </div>
                </div>
                 <div>
                  <label className="block text-sm mb-1">ملاحظات</label>
                  <textarea value={itemForm.note} onChange={e => setItemForm({...itemForm, note: e.target.value})} className="w-full border p-2 rounded-lg h-24 resize-none" />
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

export default RentsPage;
