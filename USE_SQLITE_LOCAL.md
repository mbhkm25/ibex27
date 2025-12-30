# استخدام SQLite المحلي بدلاً من PostgreSQL

## ✅ الحل السريع: استخدام SQLite المحلي

المشروع يدعم بالفعل SQLite المحلي! لا حاجة لكلمة مرور.

### 1. تحديث ملف `.env`:

```env
# استخدام SQLite المحلي فقط (لا حاجة لـ PostgreSQL)
DB_ENV=local
DATABASE_URL_LOCAL=sqlite://./data/cashier.db
```

**أو** استخدم قاعدة البيانات السحابية:

```env
DB_ENV=cloud
DATABASE_URL=postgresql://neondb_owner:npg_81FTgGbhISvQ@ep-morning-union-a7vq0d6n-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

### 2. تشغيل المشروع:

```powershell
npm run dev
```

## 📝 ملاحظات:

- SQLite موجود في: `data/cashier.db`
- لا يحتاج إلى كلمة مرور
- يعمل بشكل كامل للمشروع
- المزامنة مع السحابة تعمل تلقائياً

## 🔄 العودة إلى PostgreSQL المحلي:

إذا أردت استخدام PostgreSQL المحلي لاحقاً:

1. أعد تعيين كلمة المرور:
   ```powershell
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5433 -c "ALTER USER postgres WITH PASSWORD 'your_new_password';"
   ```

2. حدث `.env`:
   ```env
   DB_ENV=local
   DATABASE_URL_LOCAL=postgresql://postgres:your_new_password@localhost:5433/postgres
   ```

