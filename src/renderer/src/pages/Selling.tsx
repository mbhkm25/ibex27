import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Trash2, Plus, Minus, Printer, Check, User, Wallet, X, AlertCircle, DollarSign, Download, MessageCircle } from 'lucide-react';
import { generateInvoicePDF } from '../lib/pdf-generator';
import { printThermalInvoice, downloadThermalInvoice, sendInvoiceViaWhatsApp } from '../lib/thermal-invoice';
import { useStore } from '../contexts/StoreContext';
import QRCode from 'qrcode';

const SellingPage = () => {
  const { selectedStore } = useStore();
  const location = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>({});
  
  // Customer selection
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [customerCreditLimit, setCustomerCreditLimit] = useState<number>(0);
  const [customerAllowCredit, setCustomerAllowCredit] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'customer_balance' | 'mixed' | 'credit'>('cash');
  
  // Currency selection
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  const [baseCurrency, setBaseCurrency] = useState<any>(null);
  const [convertedTotal, setConvertedTotal] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [invoiceQr, setInvoiceQr] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStore) {
      loadProducts();
      loadStoreSettings();
      loadCustomers();
      loadCurrencies();
    }
  }, [selectedStore]);

  // Handle order data from navigation state
  useEffect(() => {
    const orderData = location.state?.orderData;
    if (orderData && selectedStore) {
      // Set customer
      if (orderData.customerId) {
        const customer = customers.find(c => c.id === orderData.customerId);
        if (customer) {
          setSelectedCustomer(customer);
        }
      }
      
      // Add items to cart
      if (orderData.items && orderData.items.length > 0) {
        const cartItems = orderData.items.map((item: any) => {
          const product = products.find(p => p.id === item.id);
          if (product) {
            return {
              id: product.id,
              name: product.name,
              price: product.price.toString(),
              quantity: item.quantity,
            };
          }
          return null;
        }).filter(Boolean);
        
        if (cartItems.length > 0) {
          setCart(cartItems);
        }
      }
      
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, selectedStore, products, customers]);

  useEffect(() => {
    if (selectedCustomer && selectedStore) {
      loadCustomerBalance();
    } else {
      setCustomerBalance(0);
    }
  }, [selectedCustomer, selectedStore]);

  // Generate QR for last sale (customer invoice link)
  useEffect(() => {
    if (!lastSale || !selectedStore) {
      setInvoiceQr(null);
      return;
    }

    const invoiceUrl = `/#/customer/invoice/${selectedStore.slug}/${lastSale.id}`;

    QRCode.toDataURL(
      invoiceUrl,
      {
        width: 220,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      },
      (err, url) => {
        if (err) {
          console.error('Failed to generate invoice QR:', err);
          setInvoiceQr(null);
        } else {
          setInvoiceQr(url);
        }
      }
    );
  }, [lastSale, selectedStore]);

  const loadProducts = async () => {
    if (!selectedStore) return;
    
    try {
      const data = await window.api.inventory.getAll(selectedStore.id);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadStoreSettings = async () => {
    try {
      const settings = await window.api.store.get();
      if (settings) setStoreSettings(settings);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await window.api.customers.getAll('');
      setCustomers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCustomerBalance = async () => {
    if (!selectedCustomer || !selectedStore) return;
    
    try {
      const storeDetails = await window.api.customerPortal.getStoreDetails({
        customerId: selectedCustomer.id,
        storeId: selectedStore.id,
      });
      
      setCustomerBalance(parseFloat(storeDetails.balance || '0'));
      
      // Load customer credit settings
      const customerData = customers.find(c => c.id === selectedCustomer.id);
      if (customerData) {
        setCustomerAllowCredit(customerData.allowCredit || false);
        setCustomerCreditLimit(parseFloat(customerData.creditLimit?.toString() || '0'));
      }
    } catch (error) {
      console.error('Failed to load customer balance:', error);
      setCustomerBalance(0);
      setCustomerAllowCredit(false);
      setCustomerCreditLimit(0);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  // Load currencies
  const loadCurrencies = async () => {
    try {
      const allCurrencies = await window.api.currencies.getAll();
      setCurrencies(allCurrencies);
      
      // Get store currency
      if (selectedStore) {
        const storeCurrency = await window.api.currencies.getStoreCurrency(selectedStore.id);
        if (storeCurrency) {
          setBaseCurrency(storeCurrency);
          setSelectedCurrency(storeCurrency);
        } else if (allCurrencies.length > 0) {
          // Default to SAR if no currency set
          const sar = allCurrencies.find((c: any) => c.id === 'SAR') || allCurrencies[0];
          setBaseCurrency(sar);
          setSelectedCurrency(sar);
        }
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  };

  // Convert total when currency changes
  useEffect(() => {
    if (selectedCurrency && baseCurrency && selectedCurrency.id !== baseCurrency.id) {
      convertTotal();
    } else {
      setConvertedTotal(total);
      setExchangeRate(1);
    }
  }, [selectedCurrency, baseCurrency, total]);

  const convertTotal = async () => {
    if (!selectedCurrency || !baseCurrency || selectedCurrency.id === baseCurrency.id) {
      setConvertedTotal(total);
      setExchangeRate(1);
      return;
    }

    try {
      const result = await window.api.currencies.convert({
        amount: total,
        fromCurrencyId: baseCurrency.id,
        toCurrencyId: selectedCurrency.id,
      });
      setConvertedTotal(result.convertedAmount);
      setExchangeRate(result.exchangeRate);
    } catch (error) {
      console.error('Failed to convert currency:', error);
      setConvertedTotal(total);
      setExchangeRate(1);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (!selectedStore) {
      alert('يرجى اختيار متجر أولاً');
      return;
    }
    
    // Validate customer balance if using balance payment (with detailed error)
    if (paymentMethod === 'customer_balance') {
      if (!selectedCustomer) {
        alert('يرجى اختيار عميل للدفع من الرصيد');
        return;
      }
      if (customerBalance < total) {
        const currencySymbol = baseCurrency?.symbol || 'ر.س';
        alert(`رصيد العميل غير كافي!\nالرصيد المتاح: ${customerBalance.toFixed(2)} ${currencySymbol}\nالمطلوب: ${total.toFixed(2)} ${currencySymbol}\nالنقص: ${(total - customerBalance).toFixed(2)} ${currencySymbol}`);
        return;
      }
    }
    
    if (paymentMethod === 'mixed') {
      if (!selectedCustomer) {
        alert('يرجى اختيار عميل للدفع المختلط');
        return;
      }
      const balanceNeeded = total * 0.5;
      if (customerBalance < balanceNeeded) {
        const currencySymbol = baseCurrency?.symbol || 'ر.س';
        alert(`رصيد العميل غير كافي للدفع المختلط!\nالرصيد المتاح: ${customerBalance.toFixed(2)} ${currencySymbol}\nالمطلوب (50%): ${balanceNeeded.toFixed(2)} ${currencySymbol}\nالنقص: ${(balanceNeeded - customerBalance).toFixed(2)} ${currencySymbol}`);
        return;
      }
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Use base currency total for backend (always store in base currency)
      const saleData = {
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        total, // Always use base currency total
        paymentMethod,
        userId: user.id,
        storeId: selectedStore.id,
        customerId: selectedCustomer?.id || null,
        currencyId: selectedCurrency?.id || baseCurrency?.id || null,
        exchangeRate: selectedCurrency?.id !== baseCurrency?.id ? exchangeRate : null,
      };
      
      const result = await window.api.sales.create(saleData);
      
      // Get sale details with actual saleId
      const saleId = result.saleId;
      
      setLastSale({
        id: saleId,
        ...saleData,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.price) * item.quantity
        })),
        customer: selectedCustomer,
        createdAt: new Date(),
        result: result
      });

      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      loadProducts();
      if (selectedCustomer) {
        loadCustomerBalance();
      }
    } catch (error: any) {
      alert(error.message || 'فشل إتمام عملية البيع');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLastSale = async () => {
    if (!lastSale || !selectedStore) return;
    
    try {
      // Prepare thermal invoice data
      const invoiceData = {
        store: {
          name: selectedStore.name,
          phone: selectedStore.phone || storeSettings.phone,
          description: selectedStore.description || undefined,
          logo: selectedStore.settings?.logo || storeSettings.logo,
          footer: selectedStore.settings?.invoiceFooter || storeSettings.footer,
          slug: selectedStore.slug
        },
        sale: {
          id: lastSale.id,
          createdAt: lastSale.createdAt,
          paymentMethod: lastSale.paymentMethod,
          total: lastSale.total,
          currency: baseCurrency ? {
            symbol: baseCurrency.symbol,
            name: baseCurrency.name
          } : undefined,
          exchangeRate: lastSale.exchangeRate || undefined,
          convertedTotal: selectedCurrency && selectedCurrency.id !== baseCurrency?.id ? convertedTotal : undefined,
          convertedCurrency: selectedCurrency && selectedCurrency.id !== baseCurrency?.id ? {
            symbol: selectedCurrency.symbol,
            name: selectedCurrency.name
          } : undefined
        },
        items: lastSale.items || [],
        customer: selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          balance: lastSale.result?.balanceUsed !== undefined 
            ? customerBalance - (lastSale.result.balanceUsed || 0)
            : customerBalance
        } : undefined,
        cashier: (() => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return { name: user.name };
          }
          return undefined;
        })()
      };

      await printThermalInvoice(invoiceData);
    } catch (error: any) {
      console.error('Print error:', error);
      alert('فشل طباعة الفاتورة: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  const handleDownloadInvoice = async () => {
    if (!lastSale || !selectedStore) return;
    
    try {
      const invoiceData = {
        store: {
          name: selectedStore.name,
          phone: selectedStore.phone || storeSettings.phone,
          description: selectedStore.description || undefined,
          logo: selectedStore.settings?.logo || storeSettings.logo,
          footer: selectedStore.settings?.invoiceFooter || storeSettings.footer,
          slug: selectedStore.slug
        },
        sale: {
          id: lastSale.id,
          createdAt: lastSale.createdAt,
          paymentMethod: lastSale.paymentMethod,
          total: lastSale.total,
          currency: baseCurrency ? {
            symbol: baseCurrency.symbol,
            name: baseCurrency.name
          } : undefined,
          exchangeRate: lastSale.exchangeRate || undefined,
          convertedTotal: selectedCurrency && selectedCurrency.id !== baseCurrency?.id ? convertedTotal : undefined,
          convertedCurrency: selectedCurrency && selectedCurrency.id !== baseCurrency?.id ? {
            symbol: selectedCurrency.symbol,
            name: selectedCurrency.name
          } : undefined
        },
        items: lastSale.items || [],
        customer: selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          balance: lastSale.result?.balanceUsed !== undefined 
            ? customerBalance - (lastSale.result.balanceUsed || 0)
            : customerBalance
        } : undefined,
        cashier: (() => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return { name: user.name };
          }
          return undefined;
        })()
      };

      await downloadThermalInvoice(invoiceData);
    } catch (error: any) {
      console.error('Download error:', error);
      alert('فشل تحميل الفاتورة: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  const handleSendWhatsApp = () => {
    if (!lastSale || !selectedStore) return;
    
    try {
      const invoiceData = {
        store: {
          name: selectedStore.name,
          phone: selectedStore.phone || storeSettings.phone,
          description: selectedStore.description || undefined,
          logo: selectedStore.settings?.logo || storeSettings.logo,
          footer: selectedStore.settings?.invoiceFooter || storeSettings.footer,
          slug: selectedStore.slug
        },
        sale: {
          id: lastSale.id,
          createdAt: lastSale.createdAt,
          paymentMethod: lastSale.paymentMethod,
          total: lastSale.total,
          currency: baseCurrency ? {
            symbol: baseCurrency.symbol,
            name: baseCurrency.name
          } : undefined,
          exchangeRate: lastSale.exchangeRate || undefined,
          convertedTotal: selectedCurrency && selectedCurrency.id !== baseCurrency?.id ? convertedTotal : undefined,
          convertedCurrency: selectedCurrency && selectedCurrency.id !== baseCurrency?.id ? {
            symbol: selectedCurrency.symbol,
            name: selectedCurrency.name
          } : undefined
        },
        items: lastSale.items || [],
        customer: selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          balance: lastSale.result?.balanceUsed !== undefined 
            ? customerBalance - (lastSale.result.balanceUsed || 0)
            : customerBalance
        } : undefined,
        cashier: (() => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            return { name: user.name };
          }
          return undefined;
        })()
      };

      sendInvoiceViaWhatsApp(invoiceData);
    } catch (error: any) {
      console.error('WhatsApp error:', error);
      alert('فشل إرسال الفاتورة: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(search) || (p.barcode && p.barcode.includes(search))
  );

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="text-yellow-600 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">يرجى اختيار متجر</h3>
          <p className="text-sm text-yellow-700">
            يجب اختيار متجر من القائمة أعلاه لبدء عملية البيع
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 relative">
      {/* Product Grid (Left) */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الباركود..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all bg-white"
              >
                <div className="h-24 bg-gray-100 rounded-md mb-3 flex items-center justify-center text-gray-400">
                  <ShoppingCart size={32} />
                </div>
                <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-blue-600 font-bold">{product.price} ر.س</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart (Right) */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={20} />
            سلة المشتريات
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer Selection */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={16} />
                العميل
              </label>
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setPaymentMethod('cash');
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {selectedCustomer ? (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-sm">{selectedCustomer.name}</div>
                <div className="text-xs text-gray-500">{selectedCustomer.phone}</div>
                {customerBalance > 0 && (
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Wallet size={12} />
                    الرصيد: {customerBalance.toFixed(2)} ر.س
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute right-2 top-2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="ابحث عن عميل..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pr-8 pl-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                />
                {customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredCustomers.slice(0, 5).map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch('');
                        }}
                        className="w-full text-right px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Currency Selection */}
          {currencies.length > 1 && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <DollarSign size={16} />
                العملة
              </label>
              <select
                value={selectedCurrency?.id || ''}
                onChange={(e) => {
                  const currency = currencies.find((c: any) => c.id === e.target.value);
                  if (currency) setSelectedCurrency(currency);
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              >
                {currencies.map((currency: any) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
              {selectedCurrency && baseCurrency && selectedCurrency.id !== baseCurrency.id && (
                <p className="text-xs text-purple-600 mt-2">
                  سعر الصرف: 1 {baseCurrency.symbol} = {exchangeRate.toFixed(4)} {selectedCurrency.symbol}
                </p>
              )}
            </div>
          )}

          {/* Payment Method Selection */}
          {selectedCustomer && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <label className="text-sm font-medium text-gray-700 mb-2 block">طريقة الدفع</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                  />
                  <span className="text-sm">نقد</span>
                </label>
                {customerBalance > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="customer_balance"
                      checked={paymentMethod === 'customer_balance'}
                      onChange={() => setPaymentMethod('customer_balance')}
                    />
                    <span className="text-sm">
                      من الرصيد ({baseCurrency ? `${customerBalance.toFixed(2)} ${baseCurrency.symbol}` : `${customerBalance.toFixed(2)} ر.س`})
                    </span>
                  </label>
                )}
                {customerBalance > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mixed"
                      checked={paymentMethod === 'mixed'}
                      onChange={() => setPaymentMethod('mixed')}
                    />
                    <span className="text-sm">مختلط (50% نقد + 50% رصيد)</span>
                  </label>
                )}
                {customerAllowCredit && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit"
                      checked={paymentMethod === 'credit'}
                      onChange={() => setPaymentMethod('credit')}
                    />
                    <span className="text-sm">
                      بيع آجل (حد الائتمان: {baseCurrency ? `${customerCreditLimit.toFixed(2)} ${baseCurrency.symbol}` : `${customerCreditLimit.toFixed(2)} ر.س`})
                    </span>
                  </label>
                )}
              </div>
              
              {/* Balance Warning */}
              {paymentMethod === 'customer_balance' && customerBalance < total && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 text-xs">
                    <AlertCircle size={14} />
                    <span className="font-medium">رصيد غير كافي!</span>
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {baseCurrency && (
                      <>
                        الرصيد: {customerBalance.toFixed(2)} {baseCurrency.symbol} | 
                        المطلوب: {total.toFixed(2)} {baseCurrency.symbol} | 
                        النقص: {(total - customerBalance).toFixed(2)} {baseCurrency.symbol}
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {paymentMethod === 'mixed' && customerBalance < total * 0.5 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 text-xs">
                    <AlertCircle size={14} />
                    <span className="font-medium">رصيد غير كافي للدفع المختلط!</span>
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {baseCurrency && (
                      <>
                        الرصيد: {customerBalance.toFixed(2)} {baseCurrency.symbol} | 
                        المطلوب (50%): {(total * 0.5).toFixed(2)} {baseCurrency.symbol} | 
                        النقص: {((total * 0.5) - customerBalance).toFixed(2)} {baseCurrency.symbol}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart Items */}
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-50" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                  <p className="text-blue-600 text-sm">{item.price} ر.س</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded border"><Minus size={14} /></button>
                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded border"><Plus size={14} /></button>
                </div>

                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>الإجمالي</span>
              <div className="text-right">
                <div className="text-blue-600">
                  {baseCurrency ? `${total.toFixed(2)} ${baseCurrency.symbol}` : `${total.toFixed(2)} ر.س`}
                </div>
                {selectedCurrency && baseCurrency && selectedCurrency.id !== baseCurrency.id && (
                  <div className="text-sm text-gray-500 font-normal">
                    ≈ {convertedTotal.toFixed(2)} {selectedCurrency.symbol}
                  </div>
                )}
              </div>
            </div>
                {selectedCustomer && paymentMethod !== 'cash' && (
              <div className="text-sm pt-2 border-t">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>الرصيد المتاح:</span>
                  <span className={customerBalance >= (paymentMethod === 'customer_balance' ? total : total * 0.5) ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {baseCurrency ? `${customerBalance.toFixed(2)} ${baseCurrency.symbol}` : `${customerBalance.toFixed(2)} ر.س`}
                  </span>
                </div>
                {paymentMethod === 'customer_balance' && (
                  <div className="flex justify-between text-gray-600">
                    <span>المتبقي بعد الدفع:</span>
                    <span className={customerBalance >= total ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {baseCurrency ? `${Math.max(0, customerBalance - total).toFixed(2)} ${baseCurrency.symbol}` : `${Math.max(0, customerBalance - total).toFixed(2)} ر.س`}
                    </span>
                  </div>
                )}
                {paymentMethod === 'mixed' && (
                  <>
                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>من الرصيد (50%):</span>
                      <span>{baseCurrency ? `${(total * 0.5).toFixed(2)} ${baseCurrency.symbol}` : `${(total * 0.5).toFixed(2)} ر.س`}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>نقد (50%):</span>
                      <span>{baseCurrency ? `${(total * 0.5).toFixed(2)} ${baseCurrency.symbol}` : `${(total * 0.5).toFixed(2)} ر.س`}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
              cart.length === 0 || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'جاري المعالجة...' : 'إتمام البيع'}
          </button>
        </div>
      </div>

      {/* Success/Print Modal */}
      {lastSale && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
          <div className="bg-white p-8 rounded-xl text-center max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold mb-2">تمت العملية بنجاح!</h3>
            <p className="text-gray-500 mb-6">الإجمالي: {lastSale.total} ر.س</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handlePrintLastSale}
                  className="bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <Printer size={18} />
                  طباعة
                </button>
                <button 
                  onClick={handleDownloadInvoice}
                  className="bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                >
                  <Download size={18} />
                  حفظ
                </button>
              </div>
              {selectedCustomer && selectedCustomer.phone && (
                <button 
                  onClick={handleSendWhatsApp}
                  className="w-full bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600"
                >
                  <MessageCircle size={18} />
                  إرسال عبر واتساب
                </button>
              )}
              <button 
                onClick={() => setLastSale(null)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
              >
                عملية جديدة
              </button>

              {/* QR Payment / Invoice Link */}
              {invoiceQr && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    يمكن للعميل مسح رمز QR لعرض الفاتورة والدفع من بوابة العميل.
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={invoiceQr}
                      alt="Invoice QR Code"
                      className="w-32 h-32 object-contain border border-gray-200 rounded-lg p-1 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellingPage;
