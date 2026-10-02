/**
 * Runtime capability detection and small browser-feature wrappers used by
 * the "Android-like" PWA features. Every function degrades gracefully.
 */

/** Snapshot of what this browser supports. */
export function capabilities() {
  const g = globalThis;
  const nav = g.navigator ?? {};
  let webgl = false;
  try {
    const c = g.document?.createElement("canvas");
    webgl = !!(c?.getContext("webgl2") || c?.getContext("webgl"));
  } catch {}
  return {
    serviceWorker: "serviceWorker" in nav,
    indexedDB: typeof g.indexedDB !== "undefined",
    cacheStorage: typeof g.caches !== "undefined",
    webWorker: typeof g.Worker !== "undefined",
    sharedWorker: typeof g.SharedWorker !== "undefined",
    broadcastChannel: typeof g.BroadcastChannel !== "undefined",
    webgl,
    webgpu: "gpu" in nav,
    webxr: "xr" in nav,
    camera: !!nav.mediaDevices?.getUserMedia,
    speechSynthesis: "speechSynthesis" in g,
    speechRecognition: !!(g.SpeechRecognition || g.webkitSpeechRecognition),
    notifications: "Notification" in g,
    push: "PushManager" in g,
    backgroundSync: typeof g.SyncManager !== "undefined",
    wakeLock: "wakeLock" in nav,
    share: "share" in nav,
    clipboard: !!nav.clipboard,
    vibrate: "vibrate" in nav,
    fullscreen: !!g.document?.documentElement?.requestFullscreen,
    orientationLock: !!g.screen?.orientation?.lock,
    deviceMotion: "DeviceMotionEvent" in g,
    fileHandling: "launchQueue" in g,
    webAuthn: typeof g.PublicKeyCredential !== "undefined",
    crypto: !!g.crypto?.subtle,
  };
}

/** Speak text with the Web Speech API. Returns a promise that resolves on end. */
export function speak(text, { rate = 1, pitch = 1, onBoundary } = {}) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in globalThis)) return resolve(false);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    if (onBoundary) u.onboundary = onBoundary;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

/** Speech recognition abstraction (one utterance). Mic only on explicit call. */
export function listenOnce({ lang = "en-US" } = {}) {
  const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!SR) return Promise.reject(new Error("Speech recognition not supported"));
  return new Promise((resolve, reject) => {
    const r = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.onresult = (e) => resolve(e.results[0][0].transcript);
    r.onerror = (e) => reject(new Error(e.error));
    r.start();
  });
}

/** Screen wake lock (where permitted). Returns a release function. */
export async function keepAwake() {
  if (!("wakeLock" in navigator)) return () => {};
  const lock = await navigator.wakeLock.request("screen");
  return () => lock.release();
}

/** Ask for notification permission and show one local notification. */
export async function notify(title, body) {
  if (!("Notification" in globalThis)) return false;
  const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (perm !== "granted") return false;
  const reg = await navigator.serviceWorker?.getRegistration?.();
  if (reg) await reg.showNotification(title, { body, icon: "icons/icon.svg" });
  else new Notification(title, { body });
  return true;
}

/** Run a function inside a Web Worker built from a script URL. */
export function runInWorker(workerUrl, message) {
  return new Promise((resolve, reject) => {
    const w = new Worker(workerUrl);
    w.onmessage = (e) => {
      resolve(e.data);
      w.terminate();
    };
    w.onerror = (e) => {
      reject(e);
      w.terminate();
    };
    w.postMessage(message);
  });
}
