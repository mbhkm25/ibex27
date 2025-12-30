# سكريبت لإعادة تعيين كلمة مرور PostgreSQL
# Run as Administrator

Write-Host "=== إعادة تعيين كلمة مرور PostgreSQL ===" -ForegroundColor Cyan

$pgPath = "C:\Program Files\PostgreSQL\16"
$dataPath = "$pgPath\data"
$pgPassFile = "$env:APPDATA\postgresql\pgpass.conf"

# إنشاء ملف pgpass.conf
Write-Host "`n1. إنشاء ملف pgpass.conf..." -ForegroundColor Yellow
$pgPassDir = Split-Path $pgPassFile
if (-not (Test-Path $pgPassDir)) {
    New-Item -ItemType Directory -Path $pgPassDir -Force | Out-Null
}

# إضافة إدخال لـ localhost:5433
$newEntry = "localhost:5433:*:postgres:postgres"
if (Test-Path $pgPassFile) {
    $content = Get-Content $pgPassFile
    if ($content -notcontains $newEntry) {
        Add-Content -Path $pgPassFile -Value $newEntry
        Write-Host "   ✅ تم إضافة إدخال جديد" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  الإدخال موجود بالفعل" -ForegroundColor Gray
    }
} else {
    Set-Content -Path $pgPassFile -Value $newEntry
    Write-Host "   ✅ تم إنشاء الملف" -ForegroundColor Green
}

Write-Host "`n2. الطريقة البديلة: استخدام SQLite المحلي" -ForegroundColor Yellow
Write-Host "   يمكنك استخدام SQLite المحلي الموجود في: data/cashier.db" -ForegroundColor Gray
Write-Host "   لا يحتاج إلى كلمة مرور!" -ForegroundColor Green

Write-Host "`n3. أو إعادة تعيين كلمة المرور يدوياً:" -ForegroundColor Yellow
Write-Host "   أ) افتح pgAdmin أو psql" -ForegroundColor Gray
Write-Host "   ب) أو استخدم الأمر التالي (بعد إيقاف الخدمة):" -ForegroundColor Gray
Write-Host "      net stop postgresql-x64-16" -ForegroundColor White
Write-Host "      & `"$pgPath\bin\pg_ctl.exe`" -D `"$dataPath`" -o `"-c authentication_timeout=0`" start" -ForegroundColor White
Write-Host "      & `"$pgPath\bin\psql.exe`" -U postgres -c `"ALTER USER postgres WITH PASSWORD 'newpassword';`"" -ForegroundColor White

Write-Host "`n=== انتهى ===" -ForegroundColor Cyan

