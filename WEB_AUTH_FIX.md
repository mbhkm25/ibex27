# ✅ إصلاح تسجيل الدخول في نسخة الويب

## 🎯 المشكلة

عند محاولة تسجيل دخول المدير في نسخة الويب على Vercel، كانت تظهر رسالة: **'API not available in web mode'**

## ✅ الحلول المطبقة

### 1. ✅ إنشاء Serverless Functions للمديرين والتجار

#### `api/auth/login.ts`
- **الوظيفة:** تسجيل دخول المديرين والتجار والكاشير
- **المدخلات:** `{ email, password }`
- **المخرجات:** بيانات المستخدم (بدون كلمة المرور)
- **الأمان:** 
  - التحقق من كلمة المرور باستخدام `bcrypt`
  - التحقق من حالة المستخدم (`status === 'active'`)
  - إرجاع خطأ واضح عند الفشل

#### `api/auth/get-user.ts`
- **الوظيفة:** الحصول على بيانات المستخدم الحالي (للتحقق من الجلسة)
- **المدخلات:** `{ userId }`
- **المخرجات:** بيانات المستخدم المحدثة

### 2. ✅ تحديث Web Adapter

تم تحديث `src/renderer/src/lib/web-adapter.ts` لدعم:

#### `window.api.login()`
```typescript
login: async (credentials: { email: string; password: string }) => {
  const user = await apiCall('auth/login', 'POST', credentials);
  // حفظ في localStorage تلقائياً
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', user.id?.toString() || '');
  }
  return user;
}
```

#### `window.api.getCurrentUser()`
```typescript
getCurrentUser: async () => {
  // قراءة من localStorage أولاً
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  // التحقق من الخادم (اختياري)
  const user = JSON.parse(userStr);
  if (user.id) {
    try {
      const verifiedUser = await apiCall('auth/get-user', 'POST', { userId: user.id });
      localStorage.setItem('user', JSON.stringify(verifiedUser));
      return verifiedUser;
    } catch (error) {
      // استخدام البيانات المحفوظة محلياً عند فشل التحقق
      return user;
    }
  }
  return user;
}
```

#### `window.api.logout()`
```typescript
logout: async () => {
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('selectedStoreId');
  localStorage.removeItem('selectedStore');
  return true;
}
```

### 3. ✅ معالجة Session باستخدام localStorage

- **حفظ الجلسة:** يتم حفظ بيانات المستخدم في `localStorage` تلقائياً عند تسجيل الدخول
- **التحقق من الجلسة:** `RequireAuth` يقرأ من `localStorage.getItem('user')`
- **Token:** يتم حفظ `authToken` (user ID) للاستخدام المستقبلي

### 4. ✅ إصلاح أزرار التطوير السريعة

تم تحديث `src/renderer/src/pages/Login.tsx`:

- **تسجيل الدخول العادي:** يعمل الآن عبر `window.api.login()`
- **أزرار التطوير:** تعمل الآن في الويب:
  - 👑 أدمن المنصة → `admin@ibex.com` / `admin123`
  - 🏪 التاجر → `merchant@example.com` / `merchant123`
  - 💰 الكاشير → `cashier@example.com` / `cashier123`
  - 👤 العميل → `771234567` / `customer123`
- **أزرار النافذة الجديدة:** في الويب، تفتح في تبويب جديد بدلاً من نافذة Electron

## 🔄 تدفق تسجيل الدخول

### في Electron (Desktop):
```
Login → window.api.login() → IPC → Main Process → Neon DB
```

### في الويب (Vercel):
```
Login → window.api.login() → fetch('/api/auth/login') → Serverless Function → Neon DB
```

## 📝 ملاحظات مهمة

1. **الأمان:**
   - كلمات المرور يتم التحقق منها باستخدام `bcrypt.compare()`
   - لا يتم إرجاع كلمة المرور في الاستجابة
   - يتم التحقق من حالة المستخدم (`active`)

2. **Session Management:**
   - البيانات محفوظة في `localStorage` (ليس `sessionStorage`)
   - الجلسة تبقى حتى يتم تسجيل الخروج أو مسح البيانات
   - يمكن التحقق من الجلسة عبر `getCurrentUser()`

3. **التوافق:**
   - الكود يعمل في Electron و Web
   - في Electron: يستخدم IPC
   - في Web: يستخدم Fetch API

## 🧪 الاختبار

### اختبار تسجيل الدخول:

1. **في Vercel:**
   ```
   https://your-app.vercel.app/#/login
   ```

2. **جرب:**
   - تسجيل دخول عادي (email + password)
   - أزرار التطوير السريعة (Admin, Merchant, Cashier, Customer)

3. **تحقق من:**
   - يتم حفظ `user` في localStorage
   - يتم التوجيه إلى الصفحة الصحيحة حسب الدور
   - لا تظهر أخطاء في Console

## ✅ Checklist

- [x] إنشاء `api/auth/login.ts`
- [x] إنشاء `api/auth/get-user.ts`
- [x] تحديث `web-adapter.ts` لدعم `login`, `getCurrentUser`, `logout`
- [x] تحديث `Login.tsx` لاستخدام API الجديد
- [x] إصلاح أزرار التطوير السريعة
- [x] تحديث `window.d.ts` لإضافة الأنواع
- [x] التأكد من استخدام localStorage للجلسة

---

**🎉 الآن تسجيل الدخول يعمل في نسخة الويب!**

