/* OMNIDIM JS service worker — offline-first, client-side only.
 *  - precaches the app shell and the OMNIDIM library script
 *  - stale-while-revalidate for same-origin assets
 *  - cache-first for the MediaPipe model (large, immutable)
 *  - background sync + local notification hooks (no server push backend)
 */
const VERSION = "omnidim-v1";
const SHELL = ["/", "/index.html", "/lib/omnidim.umd.js", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("omnidim-v") && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // SPA navigations: network first, fall back to cached shell (offline mode)
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }

  // MediaPipe model / wasm: cache-first
  if (url.hostname === "storage.googleapis.com" || url.pathname.startsWith("/mediapipe/") || url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // same-origin assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req)
          .then((res) => {
            if (res.ok) c.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || net;
      }),
    );
  }
});

// Background Sync (where supported): tell open pages to resume 4D persona work
self.addEventListener("sync", (event) => {
  if (event.tag === "omnidim-persona-sync") {
    event.waitUntil(self.clients.matchAll().then((cs) => cs.forEach((c) => c.postMessage({ type: "persona-sync" }))));
  }
});

// Push (only if a push service is configured by the deployer; none is by default)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "OMNIDIM", body: "Update" };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/icon.svg" }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow("/"))));
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
