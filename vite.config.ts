import { defineConfig } from "vite";
import { svelte }       from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "dist",
    // Single-file output so it can be dropped into any existing project
    rollupOptions: {
      output: {
        entryFileNames: "finder.js",
        assetFileNames: "finder.[ext]",
      },
    },
  },
});
