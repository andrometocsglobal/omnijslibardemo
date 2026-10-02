import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static client-side build — no server code. The OMNIDIM library is NOT
// bundled: it is loaded by <script src="/lib/omnidim.umd.js"> in index.html.
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber"],
          mediapipe: ["@mediapipe/tasks-vision"],
        },
      },
    },
  },
});
