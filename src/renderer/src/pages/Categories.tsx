/**
 * Categories Management Page - إدارة التصنيفات
 */

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const CategoriesPage = () => {
  const { selectedStore } = useStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '' });

  useEffect(() => {
    if (selectedStore) {
      loadCategories();
    }
  }, [selectedStore]);

  const loadCategories = async () => {
    if (!selectedStore) return;

    try {
      setLoading(true);
      const data = await window.api.categories.getAll(selectedStore.id);
      setCategories(data);
    } catch (error: any) {
      alert(error.message || 'فشل جلب التصنيفات');
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

    if (!formData.name.trim()) {
      alert('اسم التصنيف مطلوب');
      return;
    }

    try {
      if (formData.id) {
        await window.api.categories.update({
          id: formData.id,
          storeId: selectedStore.id,
          name: formData.name,
        });
      } else {
        await window.api.categories.add({
          storeId: selectedStore.id,
          name: formData.name,
        });
      }
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      alert(error.message || 'فشل حفظ التصنيف');
    }
  };

  const resetForm = () => {
    setFormData({ id: 0, name: '' });
  };

  const handleEdit = (category: any) => {
    setFormData({ id: category.id, name: category.name });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }

    if (confirm('هل أنت متأكد من حذف التصنيف؟')) {
      try {
        await window.api.categories.delete({ id, storeId: selectedStore.id });
        loadCategories();
      } catch (error: any) {
        alert(error.message || 'فشل حذف التصنيف');
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
            يجب اختيار متجر من القائمة أعلاه لعرض وإدارة التصنيفات
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة التصنيفات</h2>
          <p className="text-sm text-gray-500 mt-1">المتجر: {selectedStore.name}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>إضافة تصنيف</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">اسم التصنيف</th>
                <th className="px-6 py-3 font-medium">تاريخ الإنشاء</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-8">
                    جاري التحميل...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    لا توجد تصنيفات
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{category.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {formData.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">اسم التصنيف</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border p-2 rounded-lg"
                  placeholder="مثال: إلكترونيات، ملابس، أطعمة..."
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

export default CategoriesPage;

