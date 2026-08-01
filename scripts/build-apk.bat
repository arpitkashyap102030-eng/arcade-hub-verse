@echo off
REM One-click Android debug APK builder for 3CR Arcade (Windows).
REM Usage: scripts\build-apk.bat  [https://your-app.lovable.app]
setlocal
cd /d "%~dp0.."

where node >nul 2>&1 || (echo Node.js nahi mila - https://nodejs.org & exit /b 1)
where java >nul 2>&1 || (echo Java/JDK nahi mila - Android Studio install karo & exit /b 1)

echo Dependencies install...
call npm install || exit /b 1

if not exist android (
  echo Android project bana raha hoon...
  call npx --yes cap add android || exit /b 1
)

call npx --yes vite build --config vite.apk.config.ts || exit /b 1
call npx --yes cap sync android || exit /b 1

echo Gradle build (pehli baar 5-10 min)...
cd android
call gradlew.bat assembleDebug || exit /b 1
cd ..

if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
  echo APK nahi bani - upar ka error dekho & exit /b 1
)
if not exist build-output mkdir build-output
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "build-output\3cr-arcade-debug.apk" >nul
echo.
echo APK ready: build-output\3cr-arcade-debug.apk
endlocal
