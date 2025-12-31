import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import MerchantRegister from './pages/MerchantRegister';
import SellingPage from './pages/Selling';
import InventoryPage from './pages/Inventory';
import CategoriesPage from './pages/Categories';
import CustomersPage from './pages/Customers';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import ExpensesPage from './pages/Expenses';
import DuePaymentsPage from './pages/DuePayments';
import RentsPage from './pages/Rents';
import HRPage from './pages/HR';
import StorePage from './pages/Store';
import PurchasesPage from './pages/Purchases';
import CustomerRegistrationRequests from './pages/CustomerRegistrationRequests';
import BalanceRequests from './pages/BalanceRequests';
import CustomerOrdersPage from './pages/CustomerOrders';
import RenewSubscription from './pages/RenewSubscription';

// Platform Admin Pages
import PlatformAdminDashboard from './pages/admin/PlatformAdminDashboard';
import MerchantsManagement from './pages/admin/MerchantsManagement';
import StoresManagement from './pages/admin/StoresManagement';
import FinancialRequests from './pages/admin/FinancialRequests';
import SubscriptionPlans from './pages/admin/SubscriptionPlans';
import SubscriptionRequests from './pages/admin/SubscriptionRequests';

// Customer Portal Pages
import CustomerRegister from './pages/customer/CustomerRegister';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerStoreView from './pages/customer/CustomerStoreView';
import StoreLanding from './pages/customer/StoreLanding';

import RequireAuth from './components/RequireAuth';
import { StoreProvider } from './contexts/StoreContext';
import { CustomerProvider } from './contexts/CustomerContext';

function App(): JSX.Element {
  return (
    <StoreProvider>
      <CustomerProvider>
        <Router>
          <Routes>
            {/* Merchant/Admin Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<MerchantRegister />} />
            <Route path="/" element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }>
            <Route index element={<HomePage />} />
            <Route path="selling" element={<SellingPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="due-payments" element={<DuePaymentsPage />} />
            <Route path="rents" element={<RentsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customer-registration-requests" element={<CustomerRegistrationRequests />} />
            <Route path="balance-requests" element={<BalanceRequests />} />
            <Route path="customer-orders" element={<CustomerOrdersPage />} />
            <Route path="hr" element={<HRPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="store" element={<StorePage />} />
            <Route path="renew-subscription" element={<RenewSubscription />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Platform Admin Routes */}
            <Route path="admin" element={<PlatformAdminDashboard />} />
            <Route path="admin/merchants" element={<MerchantsManagement />} />
            <Route path="admin/stores" element={<StoresManagement />} />
            <Route path="admin/financial-requests" element={<FinancialRequests />} />
            <Route path="admin/subscription-plans" element={<SubscriptionPlans />} />
            <Route path="admin/subscription-requests" element={<SubscriptionRequests />} />
          </Route>

          {/* Customer Portal Routes */}
          <Route path="/store/:slug" element={<StoreLanding />} />
          <Route path="/customer/store/:slug/register" element={<CustomerRegister />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/store/:storeId" element={<CustomerStoreView />} />
          </Routes>
        </Router>
      </CustomerProvider>
    </StoreProvider>
  );
}

export default App;
