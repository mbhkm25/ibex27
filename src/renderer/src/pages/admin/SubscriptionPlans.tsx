import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Check, X, Package, Users, Building2 } from 'lucide-react';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    price: '',
    durationMonths: 1,
    maxProducts: '',
    maxUsers: '',
    maxStores: 1,
    active: true,
    features: [] as Array<{ name: string; included: boolean }>,
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await window.api.subscriptions.getAllPlans();
      setPlans(data);
    } catch (error: any) {
      console.error('Failed to load plans:', error);
      alert(error.message || 'فشل تحميل الباقات');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      price: '',
      durationMonths: 1,
      maxProducts: '',
      maxUsers: '',
      maxStores: 1,
      active: true,
      features: [],
    });
    setEditingPlan(null);
    setNewFeature('');
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      displayName: plan.displayName || '',
      description: plan.description || '',
      price: plan.price || '',
      durationMonths: plan.durationMonths || 1,
      maxProducts: plan.maxProducts?.toString() || '',
      maxUsers: plan.maxUsers?.toString() || '',
      maxStores: plan.maxStores || 1,
      active: plan.active !== undefined ? plan.active : true,
      features: plan.features || [],
    });
    setShowModal(true);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, { name: newFeature.trim(), included: true }],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleToggleFeature = (index: number) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index].included = !updatedFeatures[index].included;
    setFormData({ ...formData, features: updatedFeatures });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        durationMonths: formData.durationMonths,
        maxProducts: formData.maxProducts ? parseInt(formData.maxProducts) : undefined,
        maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
        maxStores: formData.maxStores,
        active: formData.active,
        features: formData.features.length > 0 ? formData.features : undefined,
      };

      if (editingPlan) {
        await window.api.subscriptions.updatePlan(editingPlan.id, payload);
      } else {
        await window.api.subscriptions.addPlan(payload);
      }

      setShowModal(false);
      resetForm();
      loadPlans();
      alert(editingPlan ? 'تم تحديث الباقة بنجاح' : 'تم إضافة الباقة بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل الحفظ');
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      await window.api.subscriptions.deletePlan(planId);
      loadPlans();
      alert('تم حذف الباقة بنجاح');
    } catch (error: any) {
      alert(error.message || 'فشل الحذف');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الباقات</h2>
          <p className="text-gray-600 mt-1">إدارة باقات الاشتراك المتاحة للتجار</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>إضافة باقة جديدة</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">الاسم</th>
                  <th className="px-6 py-3 font-medium">السعر</th>
                  <th className="px-6 py-3 font-medium">المدة</th>
                  <th className="px-6 py-3 font-medium">الحدود</th>
                  <th className="px-6 py-3 font-medium">الحالة</th>
                  <th className="px-6 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      لا توجد باقات
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-800">{plan.displayName}</div>
                          {plan.description && (
                            <div className="text-sm text-gray-500">{plan.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-600">
                          {parseFloat(plan.price).toFixed(2)} ر.س
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {plan.durationMonths} {plan.durationMonths === 1 ? 'شهر' : 'أشهر'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {plan.maxProducts && (
                            <div className="flex items-center gap-1">
                              <Package size={14} className="text-gray-400" />
                              <span>منتجات: {plan.maxProducts}</span>
                            </div>
                          )}
                          {plan.maxUsers && (
                            <div className="flex items-center gap-1">
                              <Users size={14} className="text-gray-400" />
                              <span>مستخدمون: {plan.maxUsers}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Building2 size={14} className="text-gray-400" />
                            <span>متاجر: {plan.maxStores || 1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {plan.active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
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
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingPlan ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الباقة (ID) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="basic, premium, enterprise"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العرض *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="الباقة الأساسية"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدة (شهور) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 1 })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حد المنتجات</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxProducts}
                    onChange={(e) => setFormData({ ...formData, maxProducts: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="غير محدود"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حد المستخدمين</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="غير محدود"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عدد المتاجر *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStores}
                    onChange={(e) => setFormData({ ...formData, maxStores: parseInt(e.target.value) || 1 })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المميزات</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="أضف ميزة جديدة"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    إضافة
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(index)}
                        className={`p-1 rounded ${feature.included ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {feature.included ? <Check size={16} /> : <X size={16} />}
                      </button>
                      <span className="flex-1 text-sm">{feature.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm">نشط (متاح للاختيار)</label>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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

export default SubscriptionPlans;

