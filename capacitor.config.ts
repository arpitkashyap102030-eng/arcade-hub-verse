import type { CapacitorConfig } from "@capacitor/cli";

// The Android app ships the whole UI inside the APK (built by `vite build --config
// vite.apk.config.ts` into dist-apk). It talks to the backend directly, so no
// remote page URL is loaded.
const config: CapacitorConfig = {
  appId: "app.lovable.threecrarcade",
  appName: "3CR Arcade",
  webDir: "dist-apk",
  android: {
    backgroundColor: "#131313",
  },
};

export default config;
