# IBEX27 - Web Version (Customer Portal)

هذا دليل لرفع نسخة الويب من بوابة العميل على Vercel.

## 📋 المتطلبات

1. حساب Vercel (مجاني)
2. قاعدة بيانات Neon (موجودة بالفعل)
3. Node.js 18+ محلياً للبناء

## 🚀 خطوات الرفع على Vercel

### 1. إعداد متغيرات البيئة

في Vercel Dashboard:
- اذهب إلى Settings → Environment Variables
- أضف:
  - `DATABASE_URL`: رابط قاعدة بيانات Neon
  - `NEXT_PUBLIC_WEB_URL`: رابط موقع Vercel (سيتم تعيينه تلقائياً)

### 2. بناء المشروع محلياً (اختياري للاختبار)

```bash
npm run build:web
```

سيتم إنشاء مجلد `dist-web` يحتوي على الملفات الجاهزة.

### 3. رفع المشروع على Vercel

#### الطريقة الأولى: عبر Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

#### الطريقة الثانية: عبر GitHub

1. تأكد من رفع المشروع على GitHub (تم بالفعل)
2. اذهب إلى [vercel.com](https://vercel.com)
3. اضغط "New Project"
4. اختر مستودع `mbhkm25/ibex27`
5. في Build Settings:
   - Framework Preset: `Other`
   - Build Command: `npm run build:web`
   - Output Directory: `dist-web`
6. أضف Environment Variables (DATABASE_URL)
7. اضغط "Deploy"

### 4. إعداد Routes في Vercel

Vercel سيتعرف تلقائياً على:
- `/api/*` → Serverless Functions في مجلد `api/`
- `/*` → SPA Routes (سيتم توجيهها إلى `index.html`)

## 🔗 الروابط

بعد الرفع، ستحصل على رابط مثل:
- `https://ibex-web.vercel.app`

روابط المتاجر ستكون:
- `https://ibex-web.vercel.app/store/{store-slug}`

## 📱 استخدام QR Code

1. افتح تطبيق Electron (التاجر)
2. اذهب إلى "إعدادات المتجر"
3. اضغط "عرض كود QR للمتجر"
4. سيظهر QR Code يحتوي على رابط: `https://ibex-web.vercel.app/store/{slug}`
5. يمكن للعملاء مسح الكود للدخول مباشرة إلى المتجر

## 🛠️ التطوير المحلي

لتشغيل نسخة الويب محلياً:

```bash
npm run build:web
npx serve dist-web
```

أو باستخدام Vite Dev Server:

```bash
npx vite --config vite.web.config.ts
```

## 📝 ملاحظات

- نسخة الويب تستخدم **Neon Database مباشرة** (لا تحتاج Sync Service)
- جميع API Calls تتم عبر `/api/*` Serverless Functions
- التطبيق يعمل كـ SPA (Single Page Application)
- الروابط تستخدم Hash Router (`/#/store/slug`)

## 🔒 الأمان

- جميع API Functions تحتاج `DATABASE_URL` في Environment Variables
- لا يتم كشف `DATABASE_URL` في الكود المرفوع
- يمكن إضافة Authentication لاحقاً للـ API Functions

