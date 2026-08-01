// Standalone client-only build used ONLY for the Android APK.
// The web app keeps using vite.config.ts (TanStack Start SSR); this config packages
// the exact same routes as a static SPA that ships inside the APK, so the phone app
// runs on its own instead of loading a remote URL. All data still comes from the
// backend directly via the browser Supabase client.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./apk", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  base: "./",
  plugins: [
    tanstackRouter({
      routesDirectory: fileURLToPath(new URL("./src/routes", import.meta.url)),
      generatedRouteTree: fileURLToPath(new URL("./src/routeTree.gen.ts", import.meta.url)),
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    tsconfigPaths({ root: fileURLToPath(new URL(".", import.meta.url)) }),
  ],
  build: {
    outDir: fileURLToPath(new URL("./dist-apk", import.meta.url)),
    emptyOutDir: true,
  },
});
