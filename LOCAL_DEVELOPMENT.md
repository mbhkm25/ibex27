# التطوير المحلي - Local Development Guide

## 📋 نظرة عامة

المشروع يدعم العمل في بيئتين:
- **☁️ السحابية (Cloud)**: قاعدة بيانات Neon PostgreSQL (افتراضي)
- **💻 المحلية (Local)**: قاعدة بيانات PostgreSQL محلية للتطوير

## 🔧 الإعداد للمطورين

### الخيار 1: العمل مع قاعدة بيانات Neon (السحابية) - **الافتراضي**

هذا هو الإعداد الافتراضي. لا حاجة لإعداد إضافي:

```env
# .env
DATABASE_URL=postgresql://neondb_owner:npg_81FTgGbhISvQ@ep-morning-union-a7vq0d6n-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
DB_ENV=cloud
```

### الخيار 2: العمل مع قاعدة بيانات محلية

#### 1. تثبيت PostgreSQL محلياً

**Windows:**
- تحميل من [postgresql.org](https://www.postgresql.org/download/windows/)
- أو استخدام Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2. إنشاء قاعدة بيانات محلية

```bash
# الاتصال بـ PostgreSQL
psql -U postgres

# إنشاء قاعدة بيانات
CREATE DATABASE ibex27_local;

# إنشاء مستخدم (اختياري)
CREATE USER ibex27_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ibex27_local TO ibex27_user;

# الخروج
\q
```

#### 3. تحديث ملف `.env`

```env
# قاعدة البيانات السحابية (Neon) - للإنتاج
DATABASE_URL=postgresql://neondb_owner:npg_81FTgGbhISvQ@ep-morning-union-a7vq0d6n-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require

# قاعدة البيانات المحلية - للتطوير
DATABASE_URL_LOCAL=postgresql://postgres:password@localhost:5432/ibex27_local

# تغيير البيئة إلى 'local' للعمل محلياً
DB_ENV=local
```

#### 4. تطبيق المخطط على القاعدة المحلية

```bash
# تأكد من أن DB_ENV=local في .env
npm run db:push
```

## 🔄 التبديل بين البيئات

### للعمل محلياً:
```env
DB_ENV=local
```

### للعمل سحابياً (Neon):
```env
DB_ENV=cloud
# أو احذف السطر واتركه افتراضياً
```

## 📊 أوامر مفيدة

### فحص البيئة الحالية
```bash
# سيعرض رسالة توضح البيئة المستخدمة
npm run dev
```

### تطبيق المخطط على البيئة المحددة
```bash
npm run db:push
```

### فتح Drizzle Studio
```bash
npm run db:studio
# سيفتح واجهة للبيئة المحددة في DB_ENV
```

## ⚙️ كيف يعمل النظام

### في `src/main/db.ts`:
```typescript
// يقرأ DB_ENV من .env
// إذا كان 'local' ويوجد DATABASE_URL_LOCAL → يستخدم المحلية
// وإلا → يستخدم DATABASE_URL (Neon)
```

### في `drizzle.config.ts`:
```typescript
// نفس المنطق - Drizzle Kit يستخدم نفس البيئة
```

## 🎯 حالات الاستخدام

### التطوير المحلي (Local)
- ✅ أسرع (لا حاجة لاتصال بالإنترنت)
- ✅ آمن (لا يؤثر على بيانات الإنتاج)
- ✅ مناسب للاختبار والتجربة

### التطوير السحابي (Cloud/Neon)
- ✅ بيانات حقيقية
- ✅ متزامن مع الفريق
- ✅ مناسب للاختبار النهائي

## 🔒 الأمان

- ✅ ملف `.env` في `.gitignore`
- ✅ `DATABASE_URL_LOCAL` محمي
- ✅ كل بيئة منفصلة تماماً

## 🆘 استكشاف الأخطاء

### خطأ: "Connection refused" (محلي)
**الحل:**
1. تأكد من تشغيل PostgreSQL: `brew services start postgresql` (Mac) أو `sudo systemctl start postgresql` (Linux)
2. تحقق من `DATABASE_URL_LOCAL` في `.env`
3. تأكد من أن قاعدة البيانات موجودة

### خطأ: "database does not exist" (محلي)
**الحل:**
```bash
psql -U postgres
CREATE DATABASE ibex27_local;
```

### التبديل لا يعمل
**الحل:**
1. تأكد من تحديث `.env`
2. أعد تشغيل التطبيق: `npm run dev`
3. تحقق من رسائل Console

---

**💡 نصيحة:** استخدم المحلية للتطوير اليومي، والسحابية للاختبار النهائي والتزامن مع الفريق.

