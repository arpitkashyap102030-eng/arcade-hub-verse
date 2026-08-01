#!/usr/bin/env bash
# One-click Android debug APK builder for 3CR Arcade.
# Usage:  ./scripts/build-apk.sh
# Poori app APK ke andar bundle hoti hai; sirf data backend se aata hai.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

say() { printf "\n\033[1;33m▶ %s\033[0m\n" "$1"; }
die() { printf "\n\033[1;31m✖ %s\033[0m\n" "$1" >&2; exit 1; }

# --- checks -----------------------------------------------------------------
command -v node >/dev/null || die "Node.js nahi mila. https://nodejs.org se install karo."
command -v java >/dev/null || die "Java (JDK 21) nahi mila. Android Studio install karo — JDK saath aata hai."

if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  for guess in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk" "$LOCALAPPDATA/Android/Sdk"; do
    [ -d "$guess" ] && export ANDROID_HOME="$guess" && break
  done
fi
[ -n "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" ] || \
  die "Android SDK nahi mila. Android Studio kholo → SDK Manager → SDK install karo, ya ANDROID_HOME set karo."

# --- install + sync ---------------------------------------------------------
say "Dependencies install kar raha hoon"
if [ -f bun.lockb ] || [ -f bun.lock ]; then bun install; else npm install; fi

if [ ! -d android ]; then
  say "Android project bana raha hoon"
  npx --yes cap add android
fi

say "App bundle build kar raha hoon (APK ke andar chalega)"
npx --yes vite build --config vite.apk.config.ts

say "Capacitor sync"
npx --yes cap sync android

# --- build ------------------------------------------------------------------
say "Gradle se debug APK build kar raha hoon (pehli baar 5-10 min lag sakta hai)"
cd android
if [ -f ./gradlew ]; then chmod +x ./gradlew; ./gradlew assembleDebug; else gradle assembleDebug; fi
cd "$ROOT"

APK="android/app/build/outputs/apk/debug/app-debug.apk"
[ -f "$APK" ] || die "APK nahi bani. Upar ka Gradle error dekho."

mkdir -p build-output
cp "$APK" build-output/3cr-arcade-debug.apk
printf "\n\033[1;32m✔ APK ready:\033[0m %s/build-output/3cr-arcade-debug.apk\n" "$ROOT"
printf "Phone par bhejo, Unknown Sources allow karo, aur install kar lo.\n\n"
