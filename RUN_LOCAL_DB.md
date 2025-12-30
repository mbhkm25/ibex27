# تشغيل المشروع على قاعدة البيانات المحلية (PostgreSQL 5433)

## الطريقة السريعة:

### 1. رفع الجداول إلى قاعدة البيانات المحلية:

```powershell
Set-Location "C:\Users\USER\Downloads\26\ibex27"
$env:DB_ENV = "local"
$env:DATABASE_URL_LOCAL = "postgresql://postgres:YOUR_PASSWORD@localhost:5433/postgres"
npm run db:push-direct
```

**استبدل `YOUR_PASSWORD` بكلمة مرور PostgreSQL الخاصة بك**

### 2. تشغيل المشروع:

```powershell
Set-Location "C:\Users\USER\Downloads\26\ibex27"
$env:DB_ENV = "local"
$env:DATABASE_URL_LOCAL = "postgresql://postgres:YOUR_PASSWORD@localhost:5433/postgres"
npm run dev
```

## أو تحديث ملف `.env`:

```env
DB_ENV=local
DATABASE_URL_LOCAL=postgresql://postgres:YOUR_PASSWORD@localhost:5433/postgres
```

ثم شغّل:
```powershell
npm run dev
```

## ملاحظات:

- **المنفذ:** 5433 (وليس 5432)
- **المستخدم:** postgres (افتراضي)
- **قاعدة البيانات:** postgres (يمكنك إنشاء قاعدة بيانات جديدة باسم `ibex27_local`)

## إنشاء قاعدة بيانات جديدة (اختياري):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5433 -c "CREATE DATABASE ibex27_local;"
```

ثم استخدم:
```
DATABASE_URL_LOCAL=postgresql://postgres:YOUR_PASSWORD@localhost:5433/ibex27_local
```

