import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, CheckCircle, XCircle, Link2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useStore } from '../contexts/StoreContext';

const CustomersPage = () => {
  const { selectedStore } = useStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    phone: '',
    ktp: '',
    dob: '',
    notes: '',
    status: true
  });

  // Customer portal link & QR (per store)
  const [portalLink, setPortalLink] = useState<string>('');
  const [portalQr, setPortalQr] = useState<string>('');

  useEffect(() => {
    loadCustomers();
  }, [search]);

  useEffect(() => {
    if (!selectedStore) {
      setPortalLink('');
      setPortalQr('');
      return;
    }

    // Build customer registration link for current store
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/#/customer/store/${selectedStore.slug}/register`;
    setPortalLink(link);

    // Generate QR code as Data URL
    QRCode.toDataURL(
      link,
      {
        width: 240,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      },
      (err, url) => {
        if (err) {
          console.error('Failed to generate customer portal QR:', err);
          setPortalQr('');
        } else {
          setPortalQr(url);
        }
      }
    );
  }, [selectedStore]);

  const loadCustomers = async () => {
    if (!selectedStore) return;
    try {
      const data = await window.api.customers.getAll({ storeId: selectedStore.id, search });
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dob: formData.dob ? new Date(formData.dob) : null
      };
      
      if (formData.id) {
        await window.api.customers.update(payload);
      } else {
        await window.api.customers.add(payload);
      }
      setShowModal(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const resetForm = () => {
    setFormData({ id: 0, name: '', phone: '', ktp: '', dob: '', notes: '', status: true });
  };

  const handleEdit = (customer) => {
    setFormData({
      ...customer,
      dob: customer.dob ? new Date(customer.dob).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      await window.api.customers.delete(id);
      loadCustomers();
    }
  };

  const handleCopyPortalLink = async () => {
    if (!portalLink) return;
    try {
      await navigator.clipboard.writeText(portalLink);
      alert('تم نسخ رابط تسجيل العملاء إلى الحافظة');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('تعذر نسخ الرابط، يمكنك نسخه يدوياً من الحقل.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">العملاء</h2>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>إضافة عميل</span>
        </button>
      </div>

      {/* Customer Portal Link & QR for current store */}
      {selectedStore && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Link2 className="text-blue-600" size={18} />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  رابط تسجيل العملاء لمتجر: {selectedStore.name}
                </p>
                <p className="text-xs text-gray-500">
                  شارك هذا الرابط مع عملائك أو اطبعه كرمز QR ليقوموا بالتسجيل بأنفسهم.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-center">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">رابط تسجيل العملاء</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={portalLink}
                  className="flex-1 px-3 py-2 border rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCopyPortalLink}
                  className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  نسخ
                </button>
              </div>
            </div>
            {portalQr && (
              <div className="flex flex-col items-center justify-center border rounded-lg p-3 bg-gray-50">
                <img
                  src={portalQr}
                  alt="Customer portal QR"
                  className="w-32 h-32 object-contain"
                />
                <p className="text-[11px] text-gray-500 mt-2 text-center">
                  امسح الكود لفتح صفحة تسجيل العملاء لهذا المتجر
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث بالاسم..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">الاسم</th>
                <th className="px-6 py-3 font-medium">رقم الهاتف</th>
                <th className="px-6 py-3 font-medium">حالة التسجيل</th>
                <th className="px-6 py-3 font-medium">الهوية (KTP)</th>
                <th className="px-6 py-3 font-medium">تاريخ الميلاد</th>
                <th className="px-6 py-3 font-medium">الحالة</th>
                <th className="px-6 py-3 font-medium">ملاحظات</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">جاري التحميل...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">لا يوجد عملاء</td></tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{customer.name}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      {customer.phone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {customer.registrationStatus ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          customer.registrationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          customer.registrationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {customer.registrationStatus === 'approved' ? 'موافق عليه' :
                           customer.registrationStatus === 'pending' ? 'قيد المراجعة' :
                           'مرفوض'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          تقليدي
                        </span>
                      )}
                      {customer.registrationStatus === 'pending' && (
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={async () => {
                              if (confirm('هل تريد الموافقة على تسجيل هذا العميل؟')) {
                                try {
                                  await window.api.customerAuth.approve(customer.id);
                                  loadCustomers();
                                } catch (error: any) {
                                  alert(error.message || 'فشل الموافقة');
                                }
                              }
                            }}
                            className="text-green-600 hover:bg-green-50 p-1 rounded"
                            title="موافقة"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('هل تريد رفض تسجيل هذا العميل؟')) {
                                try {
                                  await window.api.customerAuth.reject(customer.id);
                                  loadCustomers();
                                } catch (error: any) {
                                  alert(error.message || 'فشل الرفض');
                                }
                              }
                            }}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                            title="رفض"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{customer.ktp || '-'}</td>
                    <td className="px-6 py-4">
                      {customer.dob ? new Date(customer.dob).toLocaleDateString('ar-SA') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${customer.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {customer.status ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">{customer.notes || '-'}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
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
            <h3 className="text-xl font-bold mb-4">{formData.id ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">رقم الهاتف</label>
                  <input 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">رقم الهوية (KTP)</label>
                  <input 
                    value={formData.ktp}
                    onChange={e => setFormData({...formData, ktp: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">تاريخ الميلاد</label>
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full border p-2 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">ملاحظات</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full border p-2 rounded-lg h-24 resize-none" 
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="status" className="text-sm">نشط</label>
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

export default CustomersPage;
