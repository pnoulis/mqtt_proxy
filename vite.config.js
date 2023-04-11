/// <reference types="vitest" />
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import { getEnvar } from "js_utils";

// https:vitejs.dev/config/
const conf = {};
const MODE = getEnvar("MODE", true, "production");

if (!/dev/.test(MODE)) {
  conf.build = {
    outDir: "dist",
  };
}

// https:vitejs.dev/config/
export default defineConfig({
  ...conf,
  build: {
    outDir: "build",
    target: "esnext",
    sourcemap: true,
    emptyOutDir: true,
    copyPublicDir: false,
    lib: {
      entry: {
        index: "./src/index.js",
      },
      name: "mqtt_proxy",
      formats: ["es"],
    },
    ...conf.build,
  },
  test: {
    // ...
    include: [
      ...configDefaults.include,
      "tests.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
});
