import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Upload, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useStore } from '../contexts/StoreContext';

const InventoryPage = () => {
  const { selectedStore } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: '',
    category: '', // Keep for backward compatibility
    showInPortal: true
  });

  useEffect(() => {
    if (selectedStore) {
      loadProducts();
      loadCategories();
    }
  }, [selectedStore]);

  const loadProducts = async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      const data = await window.api.inventory.getAll(selectedStore.id);
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedStore) return;
    
    try {
      const data = await window.api.categories.getAll(selectedStore.id);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
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
        await window.api.inventory.update({ ...formData, storeId: selectedStore.id });
      } else {
        await window.api.inventory.add({ ...formData, storeId: selectedStore.id });
      }
      setShowModal(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      alert(error.message || 'فشل حفظ المنتج');
    }
  };

  const resetForm = () => {
    setFormData({ id: 0, name: '', barcode: '', price: '', cost: '', stock: '', categoryId: '', category: '', showInPortal: true });
  };

  const handleEdit = (product) => {
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    if (confirm('هل أنت متأكد من حذف المنتج؟')) {
      try {
        await window.api.inventory.delete({ id, storeId: selectedStore.id });
        loadProducts();
      } catch (error: any) {
        alert(error.message || 'فشل حذف المنتج');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const items = results.data.map((row: any) => ({
            name: row.name || row.Name || row['الاسم'],
            barcode: row.barcode || row.Barcode || row['الباركود'],
            price: row.price || row.Price || row['السعر'],
            cost: row.cost || row.Cost || row['التكلفة'] || '0',
            stock: row.stock || row.Stock || row['الكمية'] || '0',
            category: row.category || row.Category || row['القسم']
          })).filter(i => i.name && i.price); // Basic validation

          if (items.length > 0) {
            if (!selectedStore) {
              alert('يرجى اختيار متجر أولاً');
              return;
            }
            await window.api.inventory.import({ items, storeId: selectedStore.id });
            alert(`تم استيراد ${items.length} منتج بنجاح`);
            loadProducts();
          } else {
            alert('لم يتم العثور على بيانات صالحة في الملف');
          }
        } catch (error) {
          alert('فشل الاستيراد: تأكد من صيغة الملف');
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    });
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="text-yellow-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">يرجى اختيار متجر</h3>
          <p className="text-sm text-yellow-700">
            يجب اختيار متجر من القائمة أعلاه لعرض وإدارة المنتجات
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المخزون</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            {importing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Upload size={20} />}
            <span>استيراد CSV</span>
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>إضافة منتج</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث عن منتج..." 
              className="w-full pr-10 pl-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">المنتج</th>
                <th className="px-6 py-3 font-medium">الباركود</th>
                <th className="px-6 py-3 font-medium">السعر</th>
                <th className="px-6 py-3 font-medium">المخزون</th>
                <th className="px-6 py-3 font-medium">في البوابة</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">جاري التحميل...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">لا توجد منتجات</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4 text-gray-500">{product.barcode || '-'}</td>
                    <td className="px-6 py-4">{product.price} ر.س</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${product.showInPortal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {product.showInPortal ? 'نعم' : 'لا'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEdit(product)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={18} /></button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
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
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">اسم المنتج</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border p-2 rounded-lg" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">السعر</label>
                  <input 
                    required
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">التكلفة</label>
                  <input 
                    type="number"
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">المخزون</label>
                  <input 
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">الباركود</label>
                  <input 
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">القسم / التصنيف</label>
                <select
                  value={formData.categoryId || ''}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                >
                  <option value="">بدون تصنيف</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    لا توجد تصنيفات. <a href="/#/categories" className="text-blue-600 hover:underline">إضافة تصنيف</a>
                  </p>
                )}
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

export default InventoryPage;
