# OMNIDIM JS — Omnidimensional JavaScript Runtime & AR Agent Framework

A **JavaScript library** for omnidimensional formulas and formula-compressed data structures, plus a **client-side React demo**: a hand-gesture holo console, a 3D digital human, a 4D parallel-reality persona and a 5D AR persona. There is no server, no REST API and no Python. It deploys to Netlify as static files.

> Do not store millions of values when a mathematical rule can represent them.
> Do not enumerate when an exact formula can answer.
> Do not use randomness where deterministic mathematics is available.
> Do not let autonomous agents execute high-impact actions without authorisation.

## Repository layout

```
packages/omnidim/          ← the library (plain JavaScript, ES module + UMD <script> build)
  src/                       math · ap · gp · hp · geometry · segment · datastructures · omnifit
                             horn · storage · cache · identity · agents · spatial · gesture · ar
                             performance · runtime · complexity
  test/                      53 unit + property tests (every formula checked against brute force)
  dist/                      omnidim.mjs, omnidim.umd.js   ← committed so the CDN link works
apps/demo/                 ← React app that USES the library through <script src="/lib/omnidim.umd.js">
  src/pages/                 Home · HoloConsole · Human3D · Parallel4D · AR5D · FormulaLab · OmniFitLab
                             HornLab · CacheLab · ComplexityLab · Performance · Security
  public/                    sw.js · manifest · workers/omni-worker.js (importScripts the same library)
  dist/                      ← prebuilt static site (Netlify drag-and-drop ready)
docs/                      ← research documents (formulas, data structures, Big-O, architecture)
scripts/copy-lib.mjs       ← copies the built library + MediaPipe WASM into the app
netlify.toml               ← static deploy config (no functions)
```

## 1. The library, in one `<script>`

```html
<script src="https://cdn.jsdelivr.net/gh/andrometocsglobal/omnijslibardemo@main/packages/omnidim/dist/omnidim.umd.js"></script>
<script>
  OmniDim.AP.powerSum(2, 8, 1, 3);          // 2024n  — Σ k³, k = 2..9, via OMNIBAL (no loop)
  OmniDim.regularize([0,10,20,31,40,50,61,70]).rows.map(r => r.regularizedValue);
                                             // [0,10,20,30,40,50,60,70] — residuals kept
  OmniDim.OmniArray.ap(10, 10, 10_000_000_000n).valueAt(9_999_999_999n); // 1e11 from a ~150-byte descriptor
</script>
```

The four formula families:

| family | core formulas |
|---|---|
| **AP** | a(k) = a0 + k·h · S = N·(first+last)/2 · OMNIBAL D^p = X·Σ C(p,2m)·M^(p−2m)·h^(2m)·μ₂ₘ(X) · X = n^d |
| **GP** | a(k) = a·r^k · S(N) = a(r^N−1)/(r−1) · P(X) = a^X·r^(X(X−1)/2) |
| **HP** | H(N) = Σ1/k ≈ ln N + γ + 1/(2N) − 1/(12N²) + … (no finite closed form; error reported) |
| **Geometry** | ball π^(d/2)/Γ(d/2+1)·R^d · cube a^d · simplex a^d/d!·√((d+1)/2^d) · cross-polytope 2^d/d!·R^d · O(1) grid addressing |

## 2. The demo app

| page | what it shows |
|---|---|
| **Holo Console** | hand-gesture (MediaPipe, on-device) **Draw · Notepad (air keyboard) · Document (rich text) · Zoom View**, Minority Report / Star Trek style; mouse and touch fallback |
| 3D Human | procedural digital human, speech with lip motion, expressions, wave, face-follow, user-chosen presentation |
| 4D Parallel Reality | persona that keeps preparing work while you're away; level 0–5 permission gate; approvals; signed audit |
| 5D AR | camera AR cards anchored to you; detached hologram persona; presence detection; WebXR `immersive-ar` |
| OMNIBAL / OmniFit / HORN / Cache / Big-O / Performance | interactive labs; every timing is measured on your device |
| Security | privacy controls, passkeys, PIN, delete data, emergency stop, Android-like PWA features |

## 3. Run, test and build

```bash
npm install
npm test            # library tests
npm run dev         # build the library → copy to /lib → Vite dev server
npm run build       # library + app → apps/demo/dist
```

## 4. Deploy to Netlify (static only)

- **Git:** import this repo. `netlify.toml` builds with `npm ci && npm run build` and publishes `apps/demo/dist`.
- **Drag & drop:** drop the prebuilt `apps/demo/dist` folder on https://app.netlify.com/drop.

See [docs/10-pwa-android-netlify.md](docs/10-pwa-android-netlify.md) for Android install and the PWA feature list.

## 5. Research documents

Start at [docs/README.md](docs/README.md):

- the four families
- OmniSegment and formula data structures
- **algorithms & Big-O, omnidimensional vs classical**, with measured benchmarks
- OmniFit
- HORN
- caching
- 3D/4D/5D architecture
- the gesture console
- security
- the roadmap
- scenarios
- the API reference

## Honest boundaries

- **Not literal physics.** "3D/4D/5D" are product layers, not physical dimensions.
- **O(1) is limited.** It holds only for supported structured queries, measured in N. Discovery is O(N), outputs are Ω(K), and arbitrary data does not compress.
- **HORN is not a cryptographic RNG.** Security uses Web Crypto.
- **Passkeys are verified locally only.** A production system needs server-side verification.

## Source research

- Blog: <https://kumaran198726.blogspot.com/2026/10/omnidimensional-formulas-four-families.html>
- Reference PDF: *OMNIDIMENSIONAL Formulas + DSA — OMNIBAL + OmniFit + HORN* (Andrometocs / Kumaran Kanniappan, October 2026)

MIT licence.
