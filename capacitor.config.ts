import type { CapacitorConfig } from "@capacitor/cli";

// This app is server-rendered, so the Android build wraps the live web app.
// After you publish in Lovable, put your published URL in `server.url` below.
const config: CapacitorConfig = {
  appId: "app.lovable.threecrarcade",
  appName: "3CR Arcade",
  webDir: "dist",
  server: {
    url: "https://id-preview--0285221f-b80b-4014-a13e-9bfb5ac5f5d4.lovable.app",
    cleartext: false,
  },
  android: {
    backgroundColor: "#131313",
  },
};

export default config;
