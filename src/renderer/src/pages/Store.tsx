import React, { useEffect, useState, useRef } from 'react';
import { Save, RefreshCw, CheckCircle, XCircle, Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const StorePage = () => {
  const { selectedStore } = useStore();
  const [activeTab, setActiveTab] = useState<'settings' | 'requests'>('settings');
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    phone: '',
    contactInfo: {
      whatsapp: '',
      email: '',
      address: '',
    },
    settings: {
      invoiceFooter: '',
      invoiceSubFooter: '',
      welcomeMessage: '',
      returnPolicy: '',
      logo: '',
    }
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedStore && activeTab === 'settings') {
      loadSettings();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab, selectedStore]);

  const loadSettings = async () => {
    if (!selectedStore) return;
    
    try {
      const data = await window.api.store.get(selectedStore.id);
      if (data) {
        setSettings({
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          contactInfo: data.contactInfo || {
            whatsapp: '',
            email: '',
            address: '',
          },
          settings: data.settings || {
            invoiceFooter: '',
            invoiceSubFooter: '',
            welcomeMessage: '',
            returnPolicy: '',
            logo: '',
          }
        });
        
        // Set logo preview if exists
        if (data.settings?.logo) {
          setLogoPreview(data.settings.logo);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await window.api.store.requests.getAll();
      setRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStore) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        
        try {
          await window.api.store.uploadLogo({
            storeId: selectedStore.id,
            imageData: base64Data,
          });
          
          setLogoPreview(base64Data);
          setSettings({
            ...settings,
            settings: {
              ...settings.settings,
              logo: base64Data,
            }
          });
          alert('تم رفع الشعار بنجاح');
        } catch (error: any) {
          alert(error.message || 'فشل رفع الشعار');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('فشل رفع الشعار');
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings({
      ...settings,
      settings: {
        ...settings.settings,
        logo: '',
      }
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }

    setLoading(true);
    try {
      await window.api.store.save({
        storeId: selectedStore.id,
        name: settings.name,
        description: settings.description,
        phone: settings.phone,
        contactInfo: settings.contactInfo,
        settings: settings.settings,
      });
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: number, status: string) => {
    await window.api.store.requests.updateStatus(id, status);
    loadRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">إدارة المتجر</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md ${activeTab === 'settings' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
          >
            إعدادات المتجر
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-md ${activeTab === 'requests' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
          >
            الطلبات والمهام
          </button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        !selectedStore ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">يرجى اختيار متجر من القائمة أعلاه</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Logo Upload Section */}
              <div className="border-b pb-6">
                <label className="block text-sm mb-3 font-medium">شعار المتجر</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="w-32 h-32 object-contain border rounded-lg" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <ImageIcon className="text-gray-400" size={32} />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Upload size={18} />
                      <span>{logoPreview ? 'تغيير الشعار' : 'رفع شعار'}</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-2">الصيغ المدعومة: JPG, PNG (حد أقصى 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">المعلومات الأساسية</h3>
                <div>
                  <label className="block text-sm mb-1 font-medium">اسم المتجر</label>
                  <input 
                    value={settings.name}
                    onChange={e => setSettings({...settings, name: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                    placeholder="أدخل اسم المتجر"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium">الوصف</label>
                  <textarea 
                    value={settings.description}
                    onChange={e => setSettings({...settings, description: e.target.value})}
                    className="w-full border p-2 rounded-lg h-24 resize-none" 
                    placeholder="وصف مختصر للمتجر..."
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium">رقم الهاتف</label>
                  <input 
                    value={settings.phone}
                    onChange={e => setSettings({...settings, phone: e.target.value})}
                    className="w-full border p-2 rounded-lg" 
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800">معلومات التواصل</h3>
                <div>
                  <label className="block text-sm mb-1 font-medium">واتساب</label>
                  <input 
                    value={settings.contactInfo.whatsapp}
                    onChange={e => setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, whatsapp: e.target.value }
                    })}
                    className="w-full border p-2 rounded-lg" 
                    placeholder="966xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium">البريد الإلكتروني</label>
                  <input 
                    type="email"
                    value={settings.contactInfo.email}
                    onChange={e => setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, email: e.target.value }
                    })}
                    className="w-full border p-2 rounded-lg" 
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium">العنوان</label>
                  <textarea 
                    value={settings.contactInfo.address}
                    onChange={e => setSettings({
                      ...settings,
                      contactInfo: { ...settings.contactInfo, address: e.target.value }
                    })}
                    className="w-full border p-2 rounded-lg h-20 resize-none" 
                    placeholder="عنوان المتجر..."
                  />
                </div>
              </div>

              {/* Invoice Settings */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800">إعدادات الفاتورة</h3>
                <div>
                  <label className="block text-sm mb-1 font-medium">تذييل الفاتورة (Footer)</label>
                  <input 
                    value={settings.settings.invoiceFooter}
                    onChange={e => setSettings({
                      ...settings,
                      settings: { ...settings.settings, invoiceFooter: e.target.value }
                    })}
                    className="w-full border p-2 rounded-lg" 
                    placeholder="شكراً لزيارتكم"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium">نص الترحيب</label>
                  <textarea 
                    value={settings.settings.welcomeMessage}
                    onChange={e => setSettings({
                      ...settings,
                      settings: { ...settings.settings, welcomeMessage: e.target.value }
                    })}
                    className="w-full border p-2 rounded-lg h-20 resize-none" 
                    placeholder="نص الترحيب الذي يظهر في الفاتورة..."
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 font-medium">شروط الاسترجاع</label>
                  <textarea 
                    value={settings.settings.returnPolicy}
                    onChange={e => setSettings({
                      ...settings,
                      settings: { ...settings.settings, returnPolicy: e.target.value }
                    })}
                    className="w-full border p-2 rounded-lg h-24 resize-none" 
                    placeholder="شروط الاسترجاع والاستبدال..."
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Save />}
                <span>حفظ التغييرات</span>
              </button>
            </form>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">العنوان</th>
                <th className="px-6 py-3 font-medium">ملاحظات</th>
                <th className="px-6 py-3 font-medium">الحالة</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{req.title}</td>
                  <td className="px-6 py-4 text-gray-500">{req.note || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => updateRequestStatus(req.id, 'completed')} className="text-green-600 hover:bg-green-50 p-1 rounded">
                      <CheckCircle size={18} />
                    </button>
                    <button onClick={() => updateRequestStatus(req.id, 'cancelled')} className="text-red-600 hover:bg-red-50 p-1 rounded">
                      <XCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">لا توجد طلبات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StorePage;

