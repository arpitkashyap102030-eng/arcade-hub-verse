# APK kaise banayein (3CR Arcade)

App ko Capacitor se Android app me wrap kar diya gaya hai. APK compile aapke computer par hoga (Lovable cloud me Android SDK nahi hota).

## Ek baar ka setup

1. [Android Studio](https://developer.android.com/studio) install karo (Java/JDK isi ke saath aa jaata hai).
2. Lovable me **GitHub → Export to GitHub** karke project apne PC par clone karo.
3. Terminal me project folder kholo.

## One-click script (sabse aasan)

Project folder me terminal kholo aur chalao:

```bash
npm run apk
```

Windows par:

```bat
scripts\build-apk.bat
```

Script khud install, `cap add android`, `cap sync` aur Gradle debug build kar deta hai.
APK yahan milegi: `build-output/3cr-arcade-debug.apk`

Published URL par point karna ho to:

```bash
npm run apk
```

## Manual steps (agar script na chale)

```bash
npm install            # ya: bun install
npx cap add android    # sirf pehli baar
npx cap sync android
npx cap open android   # Android Studio khul jayega
```

Android Studio me: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.

APK yahan milegi:
`android/app/build/outputs/apk/debug/app-debug.apk`

Ya bina Android Studio ke, terminal se:

```bash
cd android && ./gradlew assembleDebug
```

## Zaroori baat

`capacitor.config.ts` me `server.url` set hai. Abhi wo **preview URL** par point kar raha hai. App publish karne ke baad us URL ko apne published `.lovable.app` (ya custom domain) se badal do, phir `npx cap sync android` dobara chalao — warna APK preview par hi chalti rahegi.

Play Store ke liye release build chahiye (signed AAB): Android Studio → **Build → Generate Signed Bundle / APK**.

## PWA (bina APK ke)

App installable PWA bhi hai — phone browser me site kholo → menu → **Add to Home Screen**. App icon aur fullscreen mil jayega, koi APK ki zaroorat nahi.
