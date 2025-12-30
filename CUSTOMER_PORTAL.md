# Customer Portal - واجهة العميل

## الصفحات المنشأة

### 1. CustomerRegister.tsx
**المسار:** `/customer/store/:slug/register`

**الوظيفة:**
- صفحة تسجيل عميل جديد من رابط المتجر
- الحقول المطلوبة:
  - الاسم الرباعي
  - رقم الجوال (9 أرقام)
  - رقم واتساب (اختياري)
  - كلمة المرور
  - تأكيد كلمة المرور
- إرسال طلب تسجيل تلقائياً (حالة: pending)
- عرض رسالة نجاح بعد الإرسال

**الميزات:**
- تحميل بيانات المتجر من الـ slug
- التحقق من صحة البيانات
- تنسيق رقم الجوال تلقائياً
- رسائل خطأ واضحة

---

### 2. CustomerLogin.tsx
**المسار:** `/customer/login`

**الوظيفة:**
- تسجيل دخول العميل
- الحقول:
  - رقم الجوال (9 أرقام)
  - كلمة المرور
- حفظ بيانات العميل والمتاجر في localStorage
- التوجيه إلى لوحة التحكم بعد تسجيل الدخول

**الميزات:**
- التحقق من حالة التسجيل (يجب أن تكون approved)
- عرض رسائل خطأ واضحة
- تنسيق رقم الجوال تلقائياً

---

### 3. CustomerDashboard.tsx
**المسار:** `/customer/dashboard`

**الوظيفة:**
- لوحة تحكم العميل الرئيسية
- عرض قائمة جميع المتاجر المسجل فيها العميل
- لكل متجر:
  - اسم المتجر
  - الوصف
  - الرصيد الحالي
  - زر للانتقال إلى تفاصيل المتجر

**الميزات:**
- Header مع اسم العميل وزر تسجيل الخروج
- بطاقات متاجر تفاعلية
- حالة فارغة عند عدم وجود متاجر
- تصميم responsive

---

### 4. CustomerStoreView.tsx
**المسار:** `/customer/store/:storeId`

**الوظيفة:**
- صفحة تفاصيل المتجر الكاملة
- 5 تبويبات:
  1. **نظرة عامة:** معلومات التواصل والحسابات المصرفية
  2. **المنتجات:** تصفح جميع منتجات المتجر
  3. **العروض:** عرض العروض والإعلانات النشطة
  4. **العمليات:** سجل جميع العمليات (فواتير، إيداعات، إلخ)
  5. **تعبئة الرصيد:** نموذج طلب تعبئة رصيد

**الميزات:**
- بطاقة رصيد بارزة في الأعلى
- نظام تبويبات سهل الاستخدام
- نموذج طلب تعبئة رصيد:
  - البنك أو المصرف
  - المبلغ
  - الرقم المرجعي أو رقم الإشعار
- عرض تفاصيل الحسابات المصرفية
- عرض معلومات التواصل (هاتف، واتساب، بريد، عنوان)

---

## المكونات المستخدمة

### من `components/common`:
- `Button` - أزرار موحدة
- `Input` - حقول إدخال موحدة

### من `shared/utils`:
- `formatCurrency` - تنسيق العملات
- `formatPhone` - تنسيق أرقام الجوال

---

## التوجيه (Routing)

تم إضافة المسارات التالية في `App.tsx`:

```typescript
<Route path="/customer/store/:slug/register" element={<CustomerRegister />} />
<Route path="/customer/login" element={<CustomerLogin />} />
<Route path="/customer/dashboard" element={<CustomerDashboard />} />
<Route path="/customer/store/:storeId" element={<CustomerStoreView />} />
```

---

## التخزين المحلي (LocalStorage)

### البيانات المحفوظة:
- `customer` - بيانات العميل (بعد تسجيل الدخول)
- `customerStores` - قائمة المتاجر المسجل فيها

### الاستخدام:
```typescript
// حفظ
localStorage.setItem('customer', JSON.stringify(customerData));
localStorage.setItem('customerStores', JSON.stringify(storesData));

// قراءة
const customer = JSON.parse(localStorage.getItem('customer') || '{}');
const stores = JSON.parse(localStorage.getItem('customerStores') || '[]');

// حذف (تسجيل الخروج)
localStorage.removeItem('customer');
localStorage.removeItem('customerStores');
```

---

## API Calls المستخدمة

### Customer Auth:
- `window.api.customerAuth.register()` - تسجيل جديد
- `window.api.customerAuth.login()` - تسجيل دخول

### Customer Portal:
- `window.api.customerPortal.getStores()` - قائمة المتاجر
- `window.api.customerPortal.getStoreDetails()` - تفاصيل متجر
- `window.api.customerPortal.requestBalance()` - طلب تعبئة رصيد
- `window.api.customerPortal.getTransactions()` - سجل العمليات
- `window.api.customerPortal.getProducts()` - منتجات المتجر
- `window.api.customerPortal.getOffers()` - عروض المتجر

### Stores:
- `window.api.stores.getBySlug()` - جلب متجر بالـ slug

---

## التصميم

- **الألوان:** أزرق (#2563eb) كلون أساسي
- **الخطوط:** نظام خطوط Tailwind الافتراضي
- **الأيقونات:** Lucide React
- **التخطيط:** Responsive Grid System
- **التأثيرات:** Hover effects و transitions سلسة

---

## الخطوات التالية

1. ✅ إنشاء صفحات Customer Portal - **تم**
2. ⏳ إضافة نظام إشعارات للطلبات
3. ⏳ إضافة دعم للغة الإنجليزية (اختياري)
4. ⏳ تحسين تجربة المستخدم (UX)
5. ⏳ إضافة اختبارات (Tests)

