import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

const host = process.env.TAURI_DEV_HOST;
const chartx2PackageRoot = new URL("../../packages/chartx2", import.meta.url).pathname;

export default defineConfig(async () => ({
  plugins: [sveltekit()],
  clearScreen: false,
  server: {
    port: 1422,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1423
        }
      : undefined,
    fs: {
      allow: [chartx2PackageRoot],
    },
    watch: {
      ignored: ["**/src-tauri/**"]
    }
  }
}));
