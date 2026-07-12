# Kidamooz

اپ موبایل قصه‌های شبانه برای کودکان — ساخته‌شده با Angular، Ionic و Capacitor.

## پیش‌نیازها

- [Node.js](https://nodejs.org/) 20+
- npm
- [Android Studio](https://developer.android.com/studio) (برای بیلد و انتشار اندروید)
- JDK 17+

## نصب

```bash
npm install
```

## اجرا و توسعه

```bash
# توسعه در مرورگر (با hot reload)
npm start
```

اپ روی `http://localhost:4200` اجرا می‌شود. برای تست موبایل در مرورگر، DevTools را روی حالت موبایل بگذارید.

### اسکریپت‌های مفید

```bash
npm run lint          # بررسی کد
npm test              # اجرای تست‌ها
npm run watch         # بیلد development با watch
```

## بیلد Production (وب)

```bash
npm run ionic:build
```

خروجی در پوشه `www/` ساخته می‌شود. این پوشه همان محتوایی است که Capacitor داخل اپ اندروید قرار می‌دهد.

## اجرا روی اندروید

بعد از هر بیلد production، حتماً sync کنید:

```bash
npm run ionic:build
npm run cap:sync
npm run cap:android
```

`cap:android` پروژه را در Android Studio باز می‌کند. از آنجا می‌توانید:

1. یک emulator یا دستگاه فیزیکی وصل کنید
2. دکمه **Run** را بزنید

### بیلد مستقیم از ترمینال (اختیاری)

```bash
cd android
./gradlew assembleDebug
```

فایل APK در مسیر زیر ساخته می‌شود:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## انتشار در Google Play

1. بیلد production بگیرید:

```bash
npm run ionic:build
npm run cap:sync
```

2. Android Studio را باز کنید:

```bash
npm run cap:android
```

3. از منوی **Build → Generate Signed Bundle / APK** یک **Android App Bundle (AAB)** بسازید.
4. keystore خود را بسازید یا انتخاب کنید (اولین بار).
5. فایل `.aab` را در [Google Play Console](https://play.google.com/console) آپلود کنید.

### قبل از انتشار

- `versionCode` و `versionName` را در `android/app/build.gradle` افزایش دهید
- آیکون و splash screen اپ را سفارشی کنید
- `environment.prod.ts` را برای API واقعی تنظیم کنید

## پوش نوتیفیکیشن (FCM)

بدون `google-services.json` اپ بعد از دادن دسترسی نوتیف کرش می‌کند (Firebase initialize نمی‌شود).

1. در [Firebase Console](https://console.firebase.google.com/) یک پروژه بسازید و اپ Android با package `com.kidamooz.app` اضافه کنید
2. فایل `google-services.json` را دانلود کنید
3. آن را اینجا بگذارید: `android/app/google-services.json`
4. دوباره بیلد و sync کنید:

```bash
npm run ionic:build
npm run cap:sync
```

نمونه ساختار فایل: `android/app/google-services.json.example`

## تنظیمات محیط (Environment)

| فایل | کاربرد |
|------|--------|
| `src/environments/environment.ts` | توسعه |
| `src/environments/environment.prod.ts` | production |

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://api.kidamooz.com',
  useMock: true,   // false برای اتصال به API واقعی
  features: {
    parents: false,
    psychology: false,
    more: false,
  },
};
```

## اطلاعات پروژه

| مورد | مقدار |
|------|--------|
| App ID | `com.kidamooz.app` |
| App Name | `kidamooz` |
| خروجی وب | `www/` |
| پلتفرم موبایل | Android (minSdk 24) |

## ساختار کلی

```
src/app/
├── core/        # سرویس‌ها، مدل‌ها، mock data
├── shared/      # کامپوننت‌ها و pipeهای مشترک
└── features/    # صفحات (home، stories، player، ...)
```

## جریان معمول توسعه

```bash
npm start                    # توسعه در مرورگر
npm run lint                 # قبل از commit
npm run ionic:build          # بیلد production
npm run cap:sync             # همگام‌سازی با اندروید
npm run cap:android          # تست روی emulator/دستگاه
```
