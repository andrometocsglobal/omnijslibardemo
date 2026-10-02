// Copies the built OMNIDIM library (UMD <script> build) and the MediaPipe
// WASM runtime into the demo's public/ folder so the app is fully static and
// self-hosted (works on Netlify and offline via the service worker).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lib = join(root, "packages/omnidim/dist");
const pub = join(root, "apps/demo/public");

if (!existsSync(join(lib, "omnidim.umd.js"))) {
  console.error("✗ packages/omnidim/dist/omnidim.umd.js missing — run `npm run build:lib` first.");
  process.exit(1);
}

mkdirSync(join(pub, "lib"), { recursive: true });
for (const f of ["omnidim.umd.js", "omnidim.umd.js.map", "omnidim.mjs", "omnidim.mjs.map"]) {
  if (existsSync(join(lib, f))) cpSync(join(lib, f), join(pub, "lib", f));
}
console.log("✓ OMNIDIM library copied to apps/demo/public/lib/");

// The package does not export package.json, so locate its folder directly
// (hoisted workspace install first, then the app's own node_modules).
const mpCandidates = [join(root, "node_modules/@mediapipe/tasks-vision"), join(root, "apps/demo/node_modules/@mediapipe/tasks-vision")];
const mp = mpCandidates.find((p) => existsSync(join(p, "wasm")));
if (mp) {
  cpSync(join(mp, "wasm"), join(pub, "mediapipe/wasm"), { recursive: true });
  console.log("✓ MediaPipe WASM copied to apps/demo/public/mediapipe/wasm/");
} else {
  console.warn("! MediaPipe WASM not found — hand tracking will load it from the CDN.");
}
