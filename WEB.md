# اپ و وب — یک کدبیس، دو خروجی

سورس Ionic/Angular داخل پوشه `android/` هم اپ اندروید (Capacitor) است و هم نسخه وب/PWA روی `https://kidingo.ir`.

ریپوی جدا برای وب لازم نیست؛ همه چیز در همان `kidamooz-android` است.

## قانون اصلی

هر تغییری در فیچر، UI، منطق، API client یا باگ‌فیکس اپ باید طوری نوشته شود که روی **وب هم درست کار کند** مگر اینکه صریحاً فقط native باشد.

- کد مشترک را در `src/` بزن؛ دو فورک جدا نساز.
- قابلیت‌های فقط‌اندروید را با `Capacitor.isNativePlatform()` (یا معادل) گیت کن و برای وب مسیر جایگزین بگذار (مثلاً `MediaRecorder` به‌جای پلاگین native).
- قبل از اتمام کار، چک کن: موبایل وب، دسکتاپ، و در صورت نیاز native.

## Git

فقط یک ریموت:

```text
origin → https://github.com/mahdiihd/kidamooz-android.git
```

```bash
git push origin main
```

## دیپلوی وب (PWA)

1. بیلد: `npm run build:pwa` داخل `android/`
2. خروجی: `android/www`
3. روی سرور کپی به: `/opt/kidamooz/deploy/app-www`
4. Nginx: ریشه `kidingo.ir` = اپ؛ مسیرهای مدیا (`/covers`, `/audio`, `/drawings`, `/misc` و آیکون‌های CDN) = MinIO

فایل‌های مرتبط:

- `public/manifest.webmanifest`, `public/icons/`
- `ngsw-config.json`
- `src/main.ts` (ثبت SW فقط وقتی native نیست)
- `deploy/nginx/conf.d/kidamooz.conf`
- `deploy/docker-compose.yml` (ماونت `./app-www`)

## چک‌لیست سریع بعد از تغییر اپ

- [ ] روی وب (مرورگر / PWA) هم منطقی و قابل‌استفاده است
- [ ] پلاگین Capacitor بدون کرش روی وب هندل شده
- [ ] در صورت نیاز به انتشار وب: بیلد PWA + آپدیت `app-www` روی سرور
- [ ] `git push origin main`
