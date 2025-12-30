import { useEffect, useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useLocation } from 'react-router-dom';
import SubscriptionExpired from '../pages/SubscriptionExpired';

interface SubscriptionCheckProps {
  children: React.ReactNode;
}

/**
 * Component to check subscription status before allowing access
 */
export default function SubscriptionCheck({ children }: SubscriptionCheckProps) {
  const { selectedStore } = useStore();
  const location = useLocation();
  const [subscriptionValid, setSubscriptionValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Allow access to renewal page even if expired
  if (location.pathname === '/renew-subscription') {
    return <>{children}</>;
  }

  useEffect(() => {
    if (selectedStore) {
      checkSubscription();
    } else {
      setLoading(false);
      setSubscriptionValid(true); // Allow access if no store selected (will be handled by StoreSelector)
    }
  }, [selectedStore]);

  const checkSubscription = async () => {
    if (!selectedStore) return;

    try {
      setLoading(true);
      const result = await window.api.platformAdmin.checkSubscription(selectedStore.id);
      
      if (result.valid) {
        setSubscriptionValid(true);
      } else {
        setSubscriptionValid(false);
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
      // On error, allow access (fail open) - admin can fix later
      setSubscriptionValid(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحقق من الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (subscriptionValid === false) {
    return <SubscriptionExpired store={selectedStore} />;
  }

  return <>{children}</>;
}

