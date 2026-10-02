import { defineConfig } from "vite";

// Library build:
//   dist/omnidim.mjs     — ES module (import)
//   dist/omnidim.umd.js  — <script> tag / require(); exposes global `OmniDim`
export default defineConfig({
  build: {
    target: "es2020",
    sourcemap: true,
    emptyOutDir: true,
    lib: {
      entry: "src/index.js",
      name: "OmniDim",
      formats: ["es", "umd"],
      fileName: (format) => (format === "es" ? "omnidim.mjs" : "omnidim.umd.js"),
    },
  },
  test: {
    include: ["test/**/*.test.js"],
  },
});
