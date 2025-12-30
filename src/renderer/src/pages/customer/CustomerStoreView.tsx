import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, Receipt, Package, Tag, Phone, Mail, MapPin, Building2, ShoppingCart, Plus, Minus, X, Upload, FileImage, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useCustomer } from '../../contexts/CustomerContext';

const CustomerStoreView = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { customer, stores, cart, addToCart, removeFromCart, updateCartItem, clearCart, setSelectedStore } = useCustomer();
  const [store, setStore] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'offers' | 'transactions' | 'deposit' | 'cart'>('overview');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showCart, setShowCart] = useState(false);
  
  // Deposit form
  const [depositForm, setDepositForm] = useState({
    bank: '',
    amount: '',
    currency: 'SAR',
    referenceNumber: '',
    receiptImage: null as File | null,
  });
  const [depositLoading, setDepositLoading] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    if (storeId && customer) {
      loadStoreDetails();
      // Set selected store in context
      const storeObj = stores.find((s: any) => s.id === parseInt(storeId));
      if (storeObj) {
        setSelectedStore(storeObj);
      }
    }
  }, [storeId, customer]);

  useEffect(() => {
    if (store && activeTab === 'transactions') {
      loadTransactions();
      loadInvoices();
    } else if (store && activeTab === 'products') {
      loadProducts();
    } else if (store && activeTab === 'offers') {
      loadOffers();
    } else if (store && activeTab === 'cart') {
      loadOrders();
    }
  }, [store, activeTab]);

  const loadStoreDetails = async () => {
    try {
      if (!customer) {
        navigate('/customer/login');
        return;
      }

      const data = await window.api.customerPortal.getStoreDetails({
        customerId: customer.id,
        storeId: parseInt(storeId!),
      });

      setStore(data.store);
      setBalance(parseFloat(data.balance || '0'));
    } catch (error: any) {
      console.error('Failed to load store:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      if (!customer) return;
      const data = await window.api.customerPortal.getTransactions({
        customerId: customer.id,
        storeId: parseInt(storeId!),
      });
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      if (!customer) return;
      const data = await window.api.customerPortal.getInvoices({
        customerId: customer.id,
        storeId: parseInt(storeId!),
      });
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await window.api.customerPortal.getProducts(parseInt(storeId!));
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadOffers = async () => {
    try {
      const data = await window.api.customerPortal.getOffers(parseInt(storeId!));
      setOffers(data);
    } catch (error) {
      console.error('Failed to load offers:', error);
    }
  };

  const loadOrders = async () => {
    try {
      if (!customer) return;
      const data = await window.api.customerPortal.getOrders({
        customerId: customer.id,
        storeId: parseInt(storeId!),
      });
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      alert('المنتج غير متوفر في المخزون');
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      stock: product.stock,
    });
    setShowCart(true);
  };

  const handleSubmitOrder = async () => {
    if (!customer || cart.length === 0) return;

    try {
      await window.api.customerPortal.createOrder({
        customerId: customer.id,
        storeId: parseInt(storeId!),
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        notes: orderNotes || null,
      });

      alert('تم إرسال الطلب بنجاح! سيتم مراجعته من قبل التاجر.');
      clearCart();
      setOrderNotes('');
      setShowCart(false);
      loadOrders();
    } catch (error: any) {
      alert(error.message || 'فشل إرسال الطلب');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);

    try {
      if (!customer) return;

      // Convert image to base64 if exists
      let receiptBase64 = null;
      if (depositForm.receiptImage) {
        receiptBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(depositForm.receiptImage!);
        });
      }

      await window.api.customerPortal.requestBalance({
        customerId: customer.id,
        storeId: parseInt(storeId!),
        bank: depositForm.bank,
        amount: parseFloat(depositForm.amount),
        referenceNumber: depositForm.referenceNumber,
        receiptImage: receiptBase64, // Will be stored in metadata
      });

      alert('تم إرسال طلب تعبئة الرصيد بنجاح. سيتم مراجعته من قبل التاجر.');
      setDepositForm({
        bank: '',
        amount: '',
        currency: 'SAR',
        referenceNumber: '',
        receiptImage: null,
      });
      setActiveTab('overview');
      loadStoreDetails();
    } catch (error: any) {
      alert(error.message || 'فشل إرسال طلب تعبئة الرصيد');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setDepositForm({ ...depositForm, receiptImage: file });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; color: string; text: string }> = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'قيد الانتظار' },
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300', text: 'موافق عليه' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300', text: 'مرفوض' },
      completed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800 border-blue-300', text: 'مكتمل' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const currencySymbol = store?.settings?.currencyId === 'SAR' ? 'ر.س' : 
                         store?.settings?.currencyId === 'YER' ? 'ريال' : 
                         store?.settings?.currencyId === 'USD' ? '$' : 'ر.س';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">المتجر غير موجود</p>
          <Button onClick={() => navigate('/customer/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{store.name}</h1>
              {store.description && (
                <p className="text-sm text-gray-500 mt-1">{store.description}</p>
              )}
            </div>
            {/* Cart Badge */}
            {cart.length > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 sm:p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">رصيدك في المتجر</p>
              <p className="text-2xl sm:text-3xl font-bold">
                {balance.toFixed(2)} {currencySymbol}
              </p>
            </div>
            <Wallet size={40} className="opacity-20 hidden sm:block" />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: Building2 },
              { id: 'products', label: 'المنتجات', icon: Package },
              { id: 'offers', label: 'العروض', icon: Tag },
              { id: 'transactions', label: 'سجل العمليات', icon: Receipt },
              { id: 'cart', label: 'طلباتي', icon: ShoppingCart },
              { id: 'deposit', label: 'تعبئة الرصيد', icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'cart') setShowCart(false);
                }}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات التواصل</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {store.contactInfo?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="text-gray-400 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">الهاتف</p>
                          <p className="font-medium">{store.contactInfo.phone}</p>
                        </div>
                      </div>
                    )}
                    {store.contactInfo?.whatsapp && (
                      <div className="flex items-center gap-3">
                        <Phone className="text-gray-400 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">واتساب</p>
                          <p className="font-medium">{store.contactInfo.whatsapp}</p>
                        </div>
                      </div>
                    )}
                    {store.contactInfo?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="text-gray-400 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                          <p className="font-medium">{store.contactInfo.email}</p>
                        </div>
                      </div>
                    )}
                    {store.contactInfo?.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="text-gray-400 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">العنوان</p>
                          <p className="font-medium">{store.contactInfo.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {store.bankAccounts && store.bankAccounts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">الحسابات المصرفية</h3>
                    <div className="space-y-3">
                      {store.bankAccounts.map((account: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="font-semibold text-gray-800 mb-2">{account.bank}</p>
                          <p className="text-sm text-gray-600">رقم الحساب: {account.accountNumber}</p>
                          {account.iban && (
                            <p className="text-sm text-gray-600">IBAN: {account.iban}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products Tab with Add to Cart */}
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <h4 className="font-semibold text-gray-800 mb-2">{product.name}</h4>
                    <p className="text-lg font-bold text-blue-600 mb-2">
                      {parseFloat(product.price).toFixed(2)} {currencySymbol}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      المخزون: <span className={product.stock > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {product.stock}
                      </span>
                    </p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        product.stock > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.stock > 0 ? 'إضافة للسلة' : 'غير متوفر'}
                    </button>
                  </div>
                ))}
                {products.length === 0 && (
                  <p className="text-gray-500 text-center col-span-full py-8">لا توجد منتجات متاحة</p>
                )}
              </div>
            )}

            {/* Offers Tab */}
            {activeTab === 'offers' && (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <h4 className="font-semibold text-gray-800 mb-2">{offer.title}</h4>
                    {offer.description && (
                      <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      من {new Date(offer.startDate).toLocaleDateString('ar-SA')} إلى{' '}
                      {new Date(offer.endDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                ))}
                {offers.length === 0 && (
                  <p className="text-gray-500 text-center py-8">لا توجد عروض حالياً</p>
                )}
              </div>
            )}

            {/* Transactions Tab - Enhanced */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {/* Wallet Transactions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">حركات المحفظة</h3>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-800">
                                {transaction.type === 'invoice' && 'فاتورة'}
                                {transaction.type === 'deposit' && 'إيداع'}
                                {transaction.type === 'due_payment' && 'دفعة آجلة'}
                                {transaction.type === 'refund' && 'استرداد'}
                              </p>
                            </div>
                            {transaction.reference && (
                              <p className="text-sm text-gray-500">المرجع: {transaction.reference}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(transaction.createdAt).toLocaleString('ar-SA')}
                            </p>
                          </div>
                          <p className={`text-lg font-bold ${
                            transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {Math.abs(parseFloat(transaction.amount)).toFixed(2)} {currencySymbol}
                          </p>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-gray-500 text-center py-8">لا توجد حركات محفظة</p>
                    )}
                  </div>
                </div>

                {/* Invoices */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">الفواتير</h3>
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-800">فاتورة #{invoice.id}</p>
                              <Eye size={16} className="text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">
                              {invoice.items?.length || 0} منتج
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(invoice.createdAt).toLocaleString('ar-SA')}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {parseFloat(invoice.total).toFixed(2)} {currencySymbol}
                          </p>
                        </div>
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <p className="text-gray-500 text-center py-8">لا توجد فواتير</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cart/Orders Tab */}
            {activeTab === 'cart' && (
              <div className="space-y-4">
                {/* Current Cart */}
                {cart.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-3">السلة الحالية</h3>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.productId} className="bg-white rounded-lg p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.price.toFixed(2)} {currencySymbol} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-bold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-800">الإجمالي:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {calculateCartTotal().toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="ملاحظات (اختياري)"
                        className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                        rows={2}
                      />
                      <button
                        onClick={handleSubmitOrder}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        إرسال الطلب
                      </button>
                    </div>
                  </div>
                )}

                {/* Previous Orders */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">طلباتي السابقة</h3>
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-800">طلب #{order.id}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleString('ar-SA')}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="space-y-2 mb-3">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-600 flex justify-between">
                              <span>{item.product?.name || 'منتج محذوف'} × {item.quantity}</span>
                              <span>{parseFloat(item.total).toFixed(2)} {currencySymbol}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="font-bold text-gray-800">الإجمالي:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {parseFloat(order.total).toFixed(2)} {currencySymbol}
                          </span>
                        </div>
                        {order.notes && (
                          <p className="text-xs text-gray-500 mt-2">ملاحظات: {order.notes}</p>
                        )}
                        {order.merchantNotes && (
                          <p className="text-xs text-blue-600 mt-2">ملاحظات التاجر: {order.merchantNotes}</p>
                        )}
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-gray-500 text-center py-8">لا توجد طلبات سابقة</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Deposit Tab - Enhanced */}
            {activeTab === 'deposit' && (
              <form onSubmit={handleDeposit} className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البنك أو المصرف *</label>
                  <select
                    value={depositForm.bank}
                    onChange={(e) => setDepositForm({ ...depositForm, bank: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">اختر البنك</option>
                    {store.bankAccounts?.map((account: any, index: number) => (
                      <option key={index} value={account.bank}>
                        {account.bank}
                      </option>
                    ))}
                    <option value="other">آخر</option>
                  </select>
                  {depositForm.bank === 'other' && (
                    <Input
                      className="mt-2"
                      placeholder="أدخل اسم البنك"
                      value={depositForm.bank}
                      onChange={(e) => setDepositForm({ ...depositForm, bank: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                    <select
                      value={depositForm.currency}
                      onChange={(e) => setDepositForm({ ...depositForm, currency: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="SAR">SAR</option>
                      <option value="YER">YER</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرقم المرجعي أو رقم الإشعار *</label>
                  <Input
                    value={depositForm.referenceNumber}
                    onChange={(e) => setDepositForm({ ...depositForm, referenceNumber: e.target.value })}
                    required
                    placeholder="رقم المرجع من الإيداع"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">صورة إشعار الإيداع</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      {depositForm.receiptImage ? (
                        <div className="space-y-2">
                          <FileImage className="mx-auto text-green-600" size={32} />
                          <p className="text-sm text-gray-600">{depositForm.receiptImage.name}</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setDepositForm({ ...depositForm, receiptImage: null });
                            }}
                            className="text-red-600 text-sm"
                          >
                            إزالة الصورة
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto text-gray-400" size={32} />
                          <p className="text-sm text-gray-600">اضغط لرفع صورة الإشعار</p>
                          <p className="text-xs text-gray-400">JPG, PNG (حد أقصى 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={depositLoading}
                  className="w-full"
                  variant="primary"
                >
                  إرسال طلب تعبئة الرصيد
                </Button>

                <p className="text-sm text-gray-500 text-center">
                  سيتم مراجعة طلبك من قبل التاجر والموافقة عليه يدوياً
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">تفاصيل الفاتورة #{selectedInvoice.id}</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">التاريخ</p>
                  <p className="font-medium">{new Date(selectedInvoice.createdAt).toLocaleString('ar-SA')}</p>
                </div>
                <div>
                  <p className="text-gray-500">طريقة الدفع</p>
                  <p className="font-medium">
                    {selectedInvoice.paymentMethod === 'cash' ? 'نقدي' :
                     selectedInvoice.paymentMethod === 'customer_balance' ? 'من الرصيد' :
                     selectedInvoice.paymentMethod === 'mixed' ? 'مختلط' : 'بطاقة'}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">الأصناف</h4>
                <div className="space-y-2">
                  {selectedInvoice.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product?.name || 'منتج محذوف'}</p>
                        <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                      </div>
                      <p className="font-bold">
                        {parseFloat(item.total).toFixed(2)} {currencySymbol}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span className="text-blue-600">
                    {parseFloat(selectedInvoice.total).toFixed(2)} {currencySymbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-end">
          <div className="bg-white w-full sm:w-96 h-[80vh] sm:h-auto flex flex-col shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">السلة</h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.price.toFixed(2)} {currencySymbol} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-white rounded"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1 hover:bg-white rounded disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">الإجمالي:</span>
                <span className="text-xl font-bold text-blue-600">
                  {calculateCartTotal().toFixed(2)} {currencySymbol}
                </span>
              </div>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="ملاحظات (اختياري)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
              />
              <button
                onClick={handleSubmitOrder}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStoreView;
