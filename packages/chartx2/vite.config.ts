import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: "src/lib/public/index.ts",
      fileName: "index",
      formats: ["es"]
    }
  }
});
