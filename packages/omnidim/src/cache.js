/**
 * OmniCache — tiered cache:
 *   L0 memory → L1 formula descriptor → L2 IndexedDB → L3 Cache Storage → L4 network
 *
 * Formula descriptors shrink *repetitive* data (periodic timestamps, grids,
 * animation keyframes…). They do NOT make cookies or storage "O(1)" in general.
 * Invalidation: version + content hash + dependency graph.
 */
import { structuralize } from "./omnifit.js";
import { deserializeSegment, segmentValueAt, serializeSegment, serializedBytes } from "./segment.js";
import { createStore } from "./storage.js";

/** SHA-256 hex via Web Crypto (FNV-1a fallback). */
export async function contentHash(data) {
  const json = typeof data === "string" ? data : JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)) ?? "";
  const bytes = new TextEncoder().encode(json);
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const buf = await subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return `fnv1a-${h.toString(16)}`;
}

/** Compress a number array into formula segments. O(N). */
export function compressNumbers(values, relTol = 1e-9) {
  const res = structuralize(values, { relTol });
  const formula = { segments: res.segments.map(serializeSegment), exceptions: res.exceptions, length: values.length };
  const rawBytes = serializedBytes(values);
  const formulaBytes = serializedBytes(formula);
  return { formula, rawBytes, formulaBytes, worthIt: formulaBytes < rawBytes, ratio: rawBytes / formulaBytes };
}

/** Rebuild the full array. OUTPUT-BOUND O(N). */
export function decompressNumbers(formula) {
  const out = new Array(formula.length);
  for (const s of formula.segments.map(deserializeSegment)) for (let i = s.startIndex; i <= s.endIndex; i++) out[Number(i)] = segmentValueAt(s, i);
  for (const e of formula.exceptions) out[e.index] = e.value;
  return out;
}

/** Random access into a compressed array without decompressing it. */
export function formulaValueAt(formula, index) {
  const ex = formula.exceptions.find((e) => e.index === index);
  if (ex) return ex.value;
  const i = BigInt(index);
  for (const s of formula.segments) if (i >= BigInt(s.startIndex) && i <= BigInt(s.endIndex)) return segmentValueAt(deserializeSegment(s), i);
  throw new RangeError(`formulaValueAt: ${index} not covered`);
}

export class OmniCache {
  constructor({ store, cacheName = "omnidim-cache-v1", version = "1", memoryLimit = 500 } = {}) {
    this.l0 = new Map();
    this.store = store ?? createStore("omnidim-cache", "entries");
    Object.assign(this, { cacheName, version, memoryLimit });
    this.dependents = new Map();
    this.stats = { hits: { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 }, misses: 0 };
  }
  _remember(entry) {
    this.l0.delete(entry.key);
    this.l0.set(entry.key, entry);
    while (this.l0.size > this.memoryLimit) this.l0.delete(this.l0.keys().next().value);
    for (const d of entry.deps) {
      if (!this.dependents.has(d)) this.dependents.set(d, new Set());
      this.dependents.get(d).add(entry.key);
    }
  }
  _value(e) {
    return e.formula ? decompressNumbers(e.formula) : e.value;
  }
  /** Store a value; number arrays are formula-compressed when it saves bytes. */
  async set(key, value, { deps = [], persist = true } = {}) {
    const entry = { key, version: this.version, hash: await contentHash(value), createdAt: Date.now(), deps };
    if (Array.isArray(value) && value.length > 8 && value.every((v) => typeof v === "number")) {
      const c = compressNumbers(value);
      if (c.worthIt) entry.formula = c.formula;
      else entry.value = value;
    } else entry.value = value;
    this._remember(entry);
    if (persist) await this.store.set(key, entry);
    return entry;
  }
  /** Fastest valid tier wins; otherwise run `loader` (L4). Returns {value, tier, ms}. */
  async get(key, loader) {
    const t0 = performance.now();
    const mem = this.l0.get(key);
    if (mem && mem.version === this.version) {
      const tier = mem.formula ? "L1" : "L0";
      this.stats.hits[tier]++;
      return { value: this._value(mem), tier, ms: performance.now() - t0 };
    }
    const disk = await this.store.get(key);
    if (disk && disk.version === this.version) {
      this._remember(disk);
      this.stats.hits.L2++;
      return { value: this._value(disk), tier: "L2", ms: performance.now() - t0 };
    }
    this.stats.misses++;
    if (!loader) return undefined;
    const value = await loader();
    await this.set(key, value);
    this.stats.hits.L4++;
    return { value, tier: "L4", ms: performance.now() - t0 };
  }
  /** L3 Cache Storage, then L4 network. */
  async fetch(url, init) {
    const t0 = performance.now();
    if (typeof caches !== "undefined") {
      const c = await caches.open(this.cacheName);
      const hit = await c.match(url);
      if (hit) {
        this.stats.hits.L3++;
        return { response: hit, tier: "L3", ms: performance.now() - t0 };
      }
      const res = await fetch(url, init);
      if (res.ok) await c.put(url, res.clone());
      this.stats.hits.L4++;
      return { response: res, tier: "L4", ms: performance.now() - t0 };
    }
    const res = await fetch(url, init);
    this.stats.hits.L4++;
    return { response: res, tier: "L4", ms: performance.now() - t0 };
  }
  /** Invalidate a key and everything that depends on it (transitively). */
  async invalidate(key) {
    const removed = [];
    const stack = [key];
    const seen = new Set();
    while (stack.length) {
      const k = stack.pop();
      if (seen.has(k)) continue;
      seen.add(k);
      this.l0.delete(k);
      await this.store.delete(k);
      removed.push(k);
      for (const d of this.dependents.get(k) ?? []) stack.push(d);
      this.dependents.delete(k);
    }
    return removed;
  }
  /** True when `value` hashes differently from what is stored. */
  async isStale(key, value) {
    const e = this.l0.get(key) ?? (await this.store.get(key));
    return !e || e.hash !== (await contentHash(value));
  }
  async clear() {
    this.l0.clear();
    this.dependents.clear();
    await this.store.clear();
    if (typeof caches !== "undefined") await caches.delete(this.cacheName);
  }
  get memorySize() {
    return this.l0.size;
  }
}

// --- Cookies: tiny session values only --------------------------------------

const FORBIDDEN_COOKIE = /(biometric|face|template|landmark|persona|ar_identity|password|secret)/i;

/**
 * Small, short-lived, SameSite=Strict (+Secure on https) cookie.
 * HttpOnly can only be set by a server — this library is client-only.
 */
export function setSessionCookie(name, value, maxAgeSeconds = 3600) {
  if (FORBIDDEN_COOKIE.test(name) || FORBIDDEN_COOKIE.test(value)) throw new Error("setSessionCookie: sensitive data must never be stored in cookies");
  const encoded = encodeURIComponent(value);
  if (encoded.length > 256) throw new RangeError("setSessionCookie: keep cookies ≤ 256 bytes; use IndexedDB for state");
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encoded}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Strict${secure}`;
}

export function getCookie(name) {
  if (typeof document === "undefined") return undefined;
  const key = encodeURIComponent(name) + "=";
  for (const part of document.cookie.split("; ")) if (part.startsWith(key)) return decodeURIComponent(part.slice(key.length));
  return undefined;
}

export function deleteCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Strict`;
}
