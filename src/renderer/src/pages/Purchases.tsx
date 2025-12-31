import { useStore } from '../contexts/StoreContext';

const PurchasesPage = () => {
  const { selectedStore } = useStore();

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md text-center">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">صفحة المشتريات</h3>
        <p className="text-sm text-blue-700">
          هذه الصفحة قيد التطوير وستكون متاحة قريباً
        </p>
        {selectedStore && (
          <p className="text-xs text-blue-600 mt-2">
            المتجر المحدد: {selectedStore.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default PurchasesPage;
