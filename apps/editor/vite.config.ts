import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = (p: string) => resolve(here, "../../packages", p, "src/index.ts");

// Workspace TS paketlerini doğrudan kaynağa alias'la → Vite normal derler.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@sas/core-renderer": pkg("core-renderer"),
      "@sas/device-frames": pkg("device-frames"),
      "@sas/store-specs": pkg("store-specs"),
      "@sas/themes": pkg("themes"),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [resolve(here, "../..")] },
    proxy: {
      // Export isteğini render-service HTTP sunucusuna yönlendir.
      "/api": { target: "http://localhost:8787", changeOrigin: true },
    },
  },
});
