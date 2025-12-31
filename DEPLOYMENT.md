# دليل رفع IBEX27 على Vercel

## 📦 ما تم إعداده

### 1. **Vercel Serverless Functions** (`/api/*`)
   - ✅ `api/customer-auth/login.ts` - تسجيل دخول العميل
   - ✅ `api/customer-portal/get-store-details.ts` - تفاصيل المتجر
   - ✅ `api/customer-portal/get-products.ts` - قائمة المنتجات
   - ✅ `api/customer-portal/get-orders.ts` - طلبات العميل
   - ✅ `api/stores/get-by-slug.ts` - جلب المتجر بالـ slug

### 2. **Web Adapter** (`src/renderer/src/lib/web-adapter.ts`)
   - ✅ يحول `window.api` calls إلى `fetch()` requests
   - ✅ يعمل تلقائياً في بيئة المتصفح

### 3. **QR Code Generator** (`src/renderer/src/pages/Store.tsx`)
   - ✅ زر "عرض كود QR للمتجر" في إعدادات المتجر
   - ✅ يولد رابط: `https://ibex-web.vercel.app/store/{slug}`

### 4. **Store Landing Page** (`src/renderer/src/pages/customer/StoreLanding.tsx`)
   - ✅ صفحة هبوط للمتجر عند فتح الرابط
   - ✅ تسمح للعميل بتسجيل الدخول أو إنشاء حساب

## 🚀 خطوات الرفع

### الخطوة 1: إعداد Vercel

```bash
# تثبيت Vercel CLI (اختياري)
npm i -g vercel

# تسجيل الدخول
vercel login
```

### الخطوة 2: رفع المشروع

#### الطريقة A: عبر Vercel Dashboard (موصى بها)

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **"New Project"**
3. اختر مستودع GitHub: `mbhkm25/ibex27`
4. في **Build Settings**:
   - Framework Preset: `Other`
   - Build Command: `npm run build:web`
   - Output Directory: `dist-web`
   - Install Command: `npm install`
5. اضغط **"Deploy"**

#### الطريقة B: عبر CLI

```bash
cd ibex27
vercel
```

### الخطوة 3: إضافة Environment Variables

في Vercel Dashboard → Project Settings → Environment Variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_81FTgGbhISvQ@ep-morning-union-a7vq0d6n-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require` |
| `NEXT_PUBLIC_WEB_URL` | `https://your-project.vercel.app` (سيتم تعيينه تلقائياً) |

**ملاحظة:** بعد الرفع الأول، Vercel سيعطيك رابط مثل `ibex-web-xxx.vercel.app`. استخدمه في `NEXT_PUBLIC_WEB_URL`.

### الخطوة 4: إعادة الرفع (Redeploy)

بعد إضافة Environment Variables، اضغط **"Redeploy"** في Vercel Dashboard.

## 🧪 اختبار محلي

قبل الرفع، يمكنك اختبار البناء محلياً:

```bash
# بناء نسخة الويب
npm run build:web

# تشغيل محلي (باستخدام serve)
npx serve dist-web

# أو باستخدام Vite Dev Server
npx vite --config vite.web.config.ts --port 5174
```

ثم افتح: `http://localhost:5174`

## 📱 استخدام QR Code

1. **في تطبيق Electron (التاجر):**
   - افتح "إعدادات المتجر"
   - اضغط "عرض كود QR للمتجر"
   - سيظهر QR Code مع الرابط

2. **للعميل:**
   - يمسح QR Code من جواله
   - يفتح الرابط في المتصفح
   - يرى صفحة المتجر
   - يسجل دخول أو ينشئ حساب
   - يتصفح المنتجات ويطلب

## 🔗 هيكل الروابط

بعد الرفع على Vercel:

```
https://ibex-web.vercel.app/
├── /store/{slug}              → صفحة هبوط المتجر
├── /customer/login            → تسجيل دخول العميل
├── /customer/dashboard        → لوحة تحكم العميل
└── /customer/store/{storeId}  → عرض المتجر (بعد تسجيل الدخول)
```

## ⚠️ ملاحظات مهمة

1. **قاعدة البيانات:**
   - نسخة الويب تستخدم **Neon Database مباشرة**
   - لا تحتاج Sync Service (هذا للتطبيق المحلي فقط)

2. **البنية الهجينة:**
   - **Electron App:** للتاجر والكاشير (محلي + سحابي)
   - **Web App (Vercel):** للعملاء (سحابي فقط)

3. **API Functions:**
   - جميع الـ Functions في `/api/*` تعمل كـ Serverless
   - تحتاج `DATABASE_URL` في Environment Variables
   - Vercel يتعرف عليها تلقائياً

4. **البناء:**
   - `npm run build:web` يبني فقط نسخة الويب
   - `npm run build` يبني نسخة Electron (للتاجر)

## 🐛 استكشاف الأخطاء

### مشكلة: API Functions لا تعمل

**الحل:**
- تأكد من إضافة `DATABASE_URL` في Environment Variables
- تأكد من إعادة الرفع بعد إضافة المتغيرات
- تحقق من Logs في Vercel Dashboard

### مشكلة: الروابط لا تعمل (404)

**الحل:**
- تأكد من `vercel.json` موجود
- تأكد من `rewrites` في `vercel.json` صحيحة
- تأكد من `base: '/'` في `vite.web.config.ts`

### مشكلة: QR Code لا يفتح الصفحة

**الحل:**
- تأكد من `NEXT_PUBLIC_WEB_URL` مضبوط بشكل صحيح
- تأكد من أن الرابط يبدأ بـ `https://` وليس `http://`
- تأكد من أن المتجر له `slug` صحيح في قاعدة البيانات

## ✅ Checklist قبل الرفع

- [ ] تم بناء المشروع محلياً (`npm run build:web`)
- [ ] تم إضافة `DATABASE_URL` في Vercel
- [ ] تم إضافة `NEXT_PUBLIC_WEB_URL` (بعد الحصول على رابط Vercel)
- [ ] تم اختبار API Functions محلياً (إن أمكن)
- [ ] تم اختبار QR Code في تطبيق Electron

## 🎉 بعد الرفع

1. احصل على رابط Vercel (مثل: `https://ibex-web.vercel.app`)
2. افتح تطبيق Electron → إعدادات المتجر
3. اضغط "عرض كود QR للمتجر"
4. امسح الكود من جوالك
5. يجب أن تفتح صفحة المتجر في المتصفح!

---

**جاهز للرفع! 🚀**

