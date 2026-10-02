# 10 — PWA, Android Install and Netlify Deployment

## 1. Netlify (static, client-side only)

There are no functions and no server APIs. Two ways to deploy:

**A. Git deploy**
1. In Netlify, choose *Add new site → Import an existing project* and pick this GitHub repo.
2. `netlify.toml` already sets:
   - build command: `npm ci && npm run build`
   - publish directory: `apps/demo/dist`
   - Node 22
   - the SPA redirect (`/* → /index.html 200`)
   - security headers
3. Deploy.

**B. Drag & drop**
1. Open https://app.netlify.com/drop.
2. Drag the prebuilt folder **`apps/demo/dist`** onto it.
3. The `_redirects` and `_headers` files inside that folder configure routing and headers.

Camera, WebXR, service workers and passkeys need **HTTPS**. Netlify provides it automatically.

## 2. Local development

```bash
npm install
npm test          # library unit + property tests
npm run dev       # builds the library, copies it to /lib, starts Vite
npm run build     # library + demo → apps/demo/dist
npx vite preview --root apps/demo   # preview the production build
```

## 3. Install on Android

1. Open the deployed URL in Chrome.
2. Tap **Install app**, either from the Security page (`beforeinstallprompt`) or Chrome menu → *Install app*.
3. The app opens standalone with its own icon.

**Android-like features included:**

| feature | how |
|---|---|
| home-screen icon, standalone window | web manifest (`display: standalone`, SVG + maskable icons) |
| quick actions | manifest `shortcuts` (Holo Console, Formula Lab, 5D AR, 4D) |
| offline mode | service worker: precache + stale-while-revalidate; offline navigation fallback |
| share target | manifest `share_target` → OmniFit Lab receives shared text |
| file handling | manifest `file_handlers` (.csv/.txt/.json → OmniFit Lab via `launchQueue`) |
| notifications | `OmniDim.notify` (local, via the service-worker registration) |
| background sync | `omnidim-persona-sync` tag resumes persona work (where supported) |
| push | handler present; needs a push server, which this static build deliberately omits |
| camera / microphone | opt-in, with indicators |
| speech recognition / synthesis | `listenOnce` / `speak` |
| wake lock, fullscreen, orientation lock | Security page buttons |
| device motion, vibration, clipboard, share, drag & drop | Security page; OmniFit Lab drop zone |
| encrypted local storage | `EncryptedStore` (AES-GCM) |

## 4. iOS notes

- Safari supports install via *Share → Add to Home Screen*.
- WebXR `immersive-ar` and Background Sync are not available there; the UI disables those buttons.

## 5. Reusing the library anywhere (no build tools)

```html
<script src="https://cdn.jsdelivr.net/gh/andrometocsglobal/omnijslibardemo@main/packages/omnidim/dist/omnidim.umd.js"></script>
<script>
  const { AP, OmniFit, Geometry } = OmniDim;
  console.log(AP.powerSum(2, 8, 1, 3).toString()); // 2024
</script>
```

The deployed site also serves it from `/lib/omnidim.umd.js`, with `Access-Control-Allow-Origin: *`.
