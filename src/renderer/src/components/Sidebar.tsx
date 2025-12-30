import { Home, ShoppingCart, Users, Package, FileText, Settings, LogOut, DollarSign, Clock, CreditCard, Briefcase, Store, UserPlus, Wallet, Shield, Building2, Bell, ShoppingBag, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    registrations: 0,
    balanceRequests: 0,
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        loadNotifications(parsedUser);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  // Refresh notifications every 30 seconds
  useEffect(() => {
    if (user && user.role !== 'platform_admin') {
      const interval = setInterval(() => {
        loadNotifications(user);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async (currentUser: any) => {
    if (!currentUser || currentUser.role === 'platform_admin') return;

    try {
      const storeId = currentUser.storeId;
      if (!storeId) return;

      const [registrationsCount, balanceCount] = await Promise.all([
        window.api.customers.getPendingRegistrationsCount(storeId),
        window.api.customerBalance.getPendingCount(storeId),
      ]);

      setNotifications({
        registrations: registrationsCount || 0,
        balanceRequests: balanceCount || 0,
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const totalNotifications = notifications.registrations + notifications.balanceRequests;

  const isPlatformAdmin = user?.role === 'platform_admin';

  // Menu items for merchants/cashiers
  const merchantMenuItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: ShoppingCart, label: 'نقاط البيع', path: '/selling' },
    { icon: Package, label: 'المخزون', path: '/inventory' },
    { icon: Package, label: 'التصنيفات', path: '/categories' },
    { icon: ShoppingBag, label: 'المشتريات', path: '/purchases' },
    { icon: CreditCard, label: 'الديون', path: '/due-payments' },
    { icon: Clock, label: 'التأجير', path: '/rents' },
    { icon: Users, label: 'العملاء', path: '/customers' },
    { 
      icon: UserPlus, 
      label: 'طلبات التسجيل', 
      path: '/customer-registration-requests',
      badge: notifications.registrations > 0 ? notifications.registrations : undefined,
    },
    { 
      icon: Wallet, 
      label: 'طلبات الرصيد', 
      path: '/balance-requests',
      badge: notifications.balanceRequests > 0 ? notifications.balanceRequests : undefined,
    },
    { 
      icon: ShoppingBag, 
      label: 'طلبات الشراء', 
      path: '/customer-orders',
    },
    { icon: Briefcase, label: 'الموارد البشرية', path: '/hr' },
    { icon: DollarSign, label: 'المصروفات', path: '/expenses' },
    { icon: FileText, label: 'التقارير', path: '/reports' },
    { icon: Store, label: 'المتجر', path: '/store' },
    { icon: CreditCard, label: 'تجديد الاشتراك', path: '/renew-subscription' },
    { icon: Settings, label: 'الإعدادات', path: '/settings' },
  ];

  // Menu items for platform admin
  const adminMenuItems = [
    { icon: Home, label: 'لوحة التحكم', path: '/admin' },
    { icon: Users, label: 'إدارة التجار', path: '/admin/merchants' },
    { icon: Building2, label: 'إدارة المتاجر', path: '/admin/stores' },
    { icon: CreditCard, label: 'إدارة الباقات', path: '/admin/subscription-plans' },
    { icon: Calendar, label: 'طلبات الاشتراك', path: '/admin/subscription-requests' },
    { icon: Wallet, label: 'الطلبات المالية', path: '/admin/financial-requests' },
    { icon: Settings, label: 'الإعدادات', path: '/settings' },
  ];

  const menuItems = isPlatformAdmin ? adminMenuItems : merchantMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/#/login';
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-full">
      <div className="p-6 border-b flex items-center justify-center flex-shrink-0">
        <h1 className="text-2xl font-bold text-blue-600">Ibex27</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const badge = (item as any).badge;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                // Refresh notifications when clicking on notification items
                if (item.path === '/customer-registration-requests' || item.path === '/balance-requests') {
                  setTimeout(() => loadNotifications(user), 1000);
                }
              }}
              className={cn(
                "flex items-center justify-between space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors relative",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
              {badge && badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t flex-shrink-0">
        {user && (
          <div className="mb-2 px-4 py-2 text-sm text-gray-600">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-gray-500">{user.role === 'platform_admin' ? 'مدير المنصة' : user.role === 'merchant' ? 'تاجر' : 'كاشير'}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 space-x-reverse px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

