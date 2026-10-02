# 06 — OmniCache, Browser Storage and Cookies

**Abstract.** Browsers offer several storage tiers with very different latency and capacity. OmniCache layers them and adds a **formula tier**: number arrays that OmniFit can describe exactly are stored as OmniSegments. For repetitive metadata this shrinks storage by orders of magnitude. The claim is deliberately narrow. Formula descriptors reduce the bytes of *repetitive* data. They do **not** make storage, IndexedDB or cookies O(1) in general.

## 1. Tiers

| tier | medium | typical use | lookup |
|---|---|---|---|
| L0 | in-memory `Map` (LRU-bounded) | hot objects | average O(1) |
| L1 | formula descriptor (in memory / persisted) | periodic timestamps, grids, keyframes | O(1) per element; full rebuild O(N) |
| L2 | IndexedDB | durable entries | I/O-bound, measured |
| L3 | Cache Storage | Request/Response pairs, offline assets | I/O-bound, measured |
| L4 | network | origin | network-bound |

`OmniCache.get(key, loader)` returns `{value, tier, ms}`, so every hit is attributed to a tier and timed.

## 2. Formula compression on write

`set(key, numberArray)` runs `compressNumbers()`, which costs O(N) once. The formula form is stored **only if it is smaller** (`worthIt`). Otherwise the raw value is kept.

Measured: timestamps 600 s apart with one anomaly in the middle. Each case becomes **2 segments + 1 exception**:

| N | raw JSON | formula JSON | ratio |
|---|---|---|---|
| 1,000 | 11.0 KB | 380 B | 29× |
| 10,000 | 110 KB | 387 B | 284× |
| 100,000 | 1.10 MB | 394 B | 2,792× |
| 1,000,000 | 11.0 MB | 401 B | 27,431× |

The formula size is essentially constant (it grows with S + E). The raw size grows with N. Random access into the compressed form (`formulaValueAt`) needs no decompression.

Data that compresses well:
- periodic timestamps
- version ranges
- resource schedules
- coordinate grids
- repeating layouts
- animation keyframe times
- deterministic simulation state

## 3. Invalidation

Four mechanisms combine:
1. **Version.** An entry from another version is a miss.
2. **Content hash.** SHA-256 via Web Crypto (FNV-1a fallback); `isStale(key, value)` compares hashes.
3. **Timestamp.** `createdAt` is kept for TTL policies.
4. **Dependency graph.** `set(k, v, {deps})` records edges, and `invalidate(k)` removes k and everything that transitively depends on it. The tests verify that `base` → `derived` cascades.

## 4. Cookies: tiny and boring by design

`setSessionCookie(name, value, maxAge)`:
- sets `SameSite=Strict`, plus `Secure` on https
- uses a short `Max-Age`
- rejects values over 256 bytes, with "use IndexedDB for state"
- **rejects sensitive names or values** (biometric, face, template, landmark, persona, ar_identity, password, secret)

`HttpOnly` can only be set by a server. This project is client-only, so cookies are limited to harmless session hints. Biometric templates, persona state and AR identity data never go into cookies.

## 5. Service worker strategy (`apps/demo/public/sw.js`)

| request | strategy |
|---|---|
| navigation | network-first, falling back to the cached shell (offline) |
| `/lib/omnidim.umd.js`, app shell | precached on install |
| same-origin assets | stale-while-revalidate |
| MediaPipe WASM / model | cache-first (large, immutable) |

`Background Sync` (`omnidim-persona-sync`) wakes open pages so the 4D persona can resume work.

## 6. What the Cache Lab measures

Everything is measured live on the device:
- compression, reconstruction and random-access time
- L0, L1 and L2 hit latency
- raw vs formula IndexedDB write/read time
- Cache Storage put/match time
- JS heap, where the browser exposes it

No number is hard-coded.
