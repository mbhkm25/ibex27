import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, ShoppingBag, AlertCircle, X, Package, Upload, Sparkles } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const PurchasesPage = () => {
  const { selectedStore } = useStore();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [entryMode, setEntryMode] = useState<'manual' | 'ai'>('manual'); // Manual or AI Scanner
  const [search, setSearch] = useState('');

  // Purchase form data
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    paymentType: 'cash' as 'cash' | 'due',
    dueDate: '',
    invoiceNumber: '',
    notes: '',
    items: [] as Array<{ productId: string; quantity: string; cost: string }>,
  });

  // Supplier form data
  const [supplierForm, setSupplierForm] = useState({
    id: 0,
    name: '',
    phone: '',
    email: '',
    address: '',
    contactPerson: '',
    notes: '',
  });

  useEffect(() => {
    if (selectedStore) {
      loadData();
    }
  }, [selectedStore]);

  const loadData = async () => {
    if (!selectedStore) return;

    try {
      setLoading(true);
      const [purchasesData, suppliersData, productsData] = await Promise.all([
        window.api.purchases.getAll(selectedStore.id),
        window.api.suppliers.getAll(selectedStore.id),
        window.api.inventory.getAll(selectedStore.id),
      ]);
      setPurchases(purchasesData);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (error: any) {
      alert(error.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { productId: '', quantity: '1', cost: '0' }],
    });
  };

  const handleRemovePurchaseItem = (index: number) => {
    setPurchaseForm({
      ...purchaseForm,
      items: purchaseForm.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdatePurchaseItem = (index: number, field: string, value: string) => {
    const newItems = [...purchaseForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setPurchaseForm({ ...purchaseForm, items: newItems });
  };

  const calculateTotal = () => {
    return purchaseForm.items.reduce((sum, item) => {
      return sum + (parseFloat(item.cost || '0') * parseInt(item.quantity || '0'));
    }, 0);
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }

    if (purchaseForm.items.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    if (purchaseForm.paymentType === 'due' && !purchaseForm.dueDate) {
      alert('يرجى تحديد تاريخ الاستحقاق للفواتير الآجلة');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await window.api.purchases.create({
        storeId: selectedStore.id,
        supplierId: purchaseForm.supplierId || null,
        paymentType: purchaseForm.paymentType,
        dueDate: purchaseForm.paymentType === 'due' ? purchaseForm.dueDate : null,
        invoiceNumber: purchaseForm.invoiceNumber || null,
        notes: purchaseForm.notes || null,
        userId: user.id || null,
        items: purchaseForm.items.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          cost: parseFloat(item.cost),
        })),
      });

      alert('تم إضافة فاتورة الشراء بنجاح');
      setShowPurchaseModal(false);
      resetPurchaseForm();
      loadData();
    } catch (error: any) {
      alert(error.message || 'فشل إضافة فاتورة الشراء');
    }
  };

  const resetPurchaseForm = () => {
    setPurchaseForm({
      supplierId: '',
      paymentType: 'cash',
      dueDate: '',
      invoiceNumber: '',
      notes: '',
      items: [],
    });
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }

    try {
      if (supplierForm.id) {
        await window.api.suppliers.update({ ...supplierForm, storeId: selectedStore.id });
      } else {
        await window.api.suppliers.add({ ...supplierForm, storeId: selectedStore.id });
      }
      setShowSupplierModal(false);
      resetSupplierForm();
      loadData();
    } catch (error: any) {
      alert(error.message || 'فشل حفظ المورد');
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      id: 0,
      name: '',
      phone: '',
      email: '',
      address: '',
      contactPerson: '',
      notes: '',
    });
  };

  const handleEditSupplier = (supplier: any) => {
    setSupplierForm(supplier);
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }

    if (confirm('هل أنت متأكد من حذف المورد؟')) {
      try {
        await window.api.suppliers.delete({ id, storeId: selectedStore.id });
        loadData();
      } catch (error: any) {
        alert(error.message || 'فشل حذف المورد');
      }
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }

    if (confirm('هل أنت متأكد من حذف فاتورة الشراء؟')) {
      try {
        await window.api.purchases.delete({ id, storeId: selectedStore.id });
        loadData();
      } catch (error: any) {
        alert(error.message || 'فشل حذف فاتورة الشراء');
      }
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const searchLower = search.toLowerCase();
    return (
      purchase.invoiceNumber?.toLowerCase().includes(searchLower) ||
      purchase.supplier?.name?.toLowerCase().includes(searchLower) ||
      purchase.id.toString().includes(searchLower)
    );
  });

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="text-yellow-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">يرجى اختيار متجر</h3>
          <p className="text-sm text-yellow-700">
            يجب اختيار متجر من القائمة أعلاه لعرض وإدارة المشتريات
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المشتريات</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            إضافة مورد
          </button>
          <button
            onClick={() => {
              setEntryMode('manual');
              setShowPurchaseModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <ShoppingBag size={20} />
            إدخال يدوي
          </button>
          <button
            onClick={() => {
              setEntryMode('ai');
              setShowPurchaseModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
          >
            <Sparkles size={20} />
            مساعد ذكي (OCR)
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="بحث برقم الفاتورة أو اسم المورد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المورد</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">رقم الفاتورة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">طريقة الدفع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجمالي</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    لا توجد فواتير شراء
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{purchase.id}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3 text-sm">{purchase.supplier?.name || 'بدون مورد'}</td>
                    <td className="px-4 py-3 text-sm">{purchase.invoiceNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          purchase.paymentType === 'cash'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {purchase.paymentType === 'cash' ? 'كاش' : 'آجل'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">{parseFloat(purchase.total).toFixed(2)} ر.س</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDeletePurchase(purchase.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {entryMode === 'ai' ? 'المساعد الذكي لإدخال الفواتير' : 'فاتورة شراء جديدة'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEntryMode(entryMode === 'manual' ? 'ai' : 'manual')}
                  className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50"
                >
                  {entryMode === 'manual' ? 'التبديل إلى المساعد الذكي' : 'التبديل إلى الإدخال اليدوي'}
                </button>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    resetPurchaseForm();
                    setEntryMode('manual');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div>
              {entryMode === 'ai' ? (
                // AI Scanner Mode
                <div className="p-12">
                  <div className="border-4 border-dashed border-purple-300 rounded-2xl p-16 text-center bg-gradient-to-br from-purple-50 to-blue-50">
                    <div className="flex flex-col items-center gap-6">
                      <div className="bg-purple-100 rounded-full p-6">
                        <Sparkles className="text-purple-600" size={64} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-800 mb-2">
                          قريباً: المساعد الذكي لإدخال الفواتير
                        </h4>
                        <p className="text-lg text-gray-600 mb-4">
                          ارفع صورة فاتورة الشراء وسيقوم المساعد الذكي بقراءتها تلقائياً
                        </p>
                        <div className="bg-white rounded-lg p-6 max-w-md mx-auto border-2 border-purple-200">
                          <Upload className="text-purple-600 mx-auto mb-4" size={48} />
                          <p className="text-sm text-gray-500 mb-4">
                            سيتم إضافة ميزة OCR (Optical Character Recognition) قريباً
                          </p>
                          <button
                            type="button"
                            disabled
                            className="bg-purple-200 text-purple-700 px-6 py-3 rounded-lg cursor-not-allowed"
                          >
                            رفع صورة الفاتورة (قريباً)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setEntryMode('manual');
                      }}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      أو استخدم الإدخال اليدوي
                    </button>
                  </div>
                </div>
              ) : (
                // Manual Entry Mode
                <form onSubmit={handleSubmitPurchase} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                  <select
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">بدون مورد</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                  <select
                    value={purchaseForm.paymentType}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, paymentType: e.target.value as 'cash' | 'due' })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="cash">كاش</option>
                    <option value="due">آجل</option>
                  </select>
                </div>

                {purchaseForm.paymentType === 'due' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={purchaseForm.dueDate}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, dueDate: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم فاتورة المورد</label>
                  <input
                    type="text"
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">الأصناف</label>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                  >
                    <Plus size={16} />
                    إضافة صنف
                  </button>
                </div>

                <div className="space-y-2">
                  {purchaseForm.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleUpdatePurchaseItem(index, 'productId', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          required
                        >
                          <option value="">اختر المنتج</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (المخزون: {product.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="الكمية"
                          value={item.quantity}
                          onChange={(e) => handleUpdatePurchaseItem(index, 'quantity', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          min="1"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="التكلفة"
                          value={item.cost}
                          onChange={(e) => handleUpdatePurchaseItem(index, 'cost', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      <div className="w-24 text-sm font-bold">
                        {(parseFloat(item.cost || '0') * parseInt(item.quantity || '0')).toFixed(2)} ر.س
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePurchaseItem(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-blue-600">{calculateTotal().toFixed(2)} ر.س</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  حفظ الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    resetPurchaseForm();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {supplierForm.id ? 'تعديل مورد' : 'إضافة مورد جديد'}
              </h3>
              <button
                onClick={() => {
                  setShowSupplierModal(false);
                  resetSupplierForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم المورد *</label>
                  <input
                    type="text"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الشخص المسؤول</label>
                  <input
                    type="text"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupplierModal(false);
                    resetSupplierForm();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;

