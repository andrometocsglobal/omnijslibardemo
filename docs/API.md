# OMNIDIM JS — API Reference (`@omniballabs/omnidim` v0.1.0)

**Loading**

| environment | how |
|---|---|
| `<script>` | `<script src=".../omnidim.umd.js"></script>` → global `OmniDim` |
| ES module | `import * as OmniDim from "@omniballabs/omnidim"` (or `dist/omnidim.mjs`) |
| Node.js ≥ 20 | the same ESM import; `require()` uses the UMD build |
| Web Worker | `importScripts("/lib/omnidim.umd.js")` → `self.OmniDim` |

**Conventions**
- Time and space are stated in terms of **N**, the number of represented elements.
- `bigint` is accepted wherever counts or indices may exceed 2⁵³.
- Every API's complexity contract can be read at runtime with `OmniDim.complexityOf("AP.sum")`.

---

## Formula families

### `AP`: arithmetic progression

| member | signature | returns | complexity |
|---|---|---|---|
| `describe` | `(a0, h, count)` | `{family:"AP", a0, h, count}` | O(1) |
| `valueAt` | `(a0, h, k)` | a0 + k·h | O(1) |
| `first` / `last` | `(a0)` / `(a0, h, N)` | | O(1) |
| `midpoint` / `mean` | `(a0, h, N)` | (first+last)/2 | O(1) |
| `count` | `(first, last, h)` | number of terms | O(1) |
| `sum` | `(a0, h, N)` | N·M | O(1) |
| `sumBig` | `(a0, h, N)` BigInt | exact sum | O(1) BigInt ops |
| `prefix` | `(a0, h, k)` | sum of first k | O(1) |
| `rangeSum` | `(a0, h, i, j)` | Σ terms i..j | O(1) |
| `windowSum` | `(a0, h, k, w)` | Σ of w terms ending at k | O(1) |
| `contains` / `indexOf` | `(a0, h, x, N?)` | membership / index | O(1) |
| `next` / `previous` / `nearest` | `(a0, h, x, N?)` | neighbour term | O(1) |
| `variance` | `(h, N)` | h²(N²−1)/12 | O(1) |
| `dimensionalCount` | `(n, d)` | BigInt n^d | O(log d) |
| `powerSum` | `(F, X, s, p)` | exact BigInt Σ(F+js)^p | O(p²), independent of X |
| `powerSumRational` | same | `Rational` | O(p²) |
| `powerSumBrute` | same | enumeration (verification) | O(X) |
| `formula` | `(p)` | display string, e.g. `X·[M³ + 3·M·μ₂·s²]` | O(p) |

- `momentBlock(r, X)` returns the exact `Rational` μ_r(X).
- `MOMENT_BLOCK_POLYNOMIALS` holds the display strings for μ₀…μ₁₀.

### `GP`: geometric progression

| member | signature | complexity / note |
|---|---|---|
| `valueAt` | `(a, r, k)` | O(1) |
| `sum` | `(a, r, N)` | O(1); r = 1 and r ≈ 1 handled |
| `sumBig` | `(a, r, N)` | exact; bit-cost grows with N |
| `range` | `(a, r, i, j)` | O(1) |
| `prefix` | `(a, r, k)` | O(1) |
| `product` | `(a, r, X)` | `{sign, log, value}` in log space |
| `productBig` | `(a, r, X)` | exact |
| `sumDimensional` | `(a, r, n, d)` | X = n^d |
| `levelCount` | `(b, L)` | tree nodes |
| `levelsFor` | `(b, capacity)` | levels needed |
| `growth` | `(initial, g, t)` | |
| `periodsToReach` | `(initial, g, target)` | |
| `sumInfinite` | `(a, r)` | \|r\| < 1 |
| `describe` | | descriptor |

### `HP`: harmonic progression (no finite elementary closed form)

| member | returns | complexity |
|---|---|---|
| `valueAt(k, a0=1, h=1)` | 1/(a0+(k−1)h) | O(1) |
| `sumExact(N)` | Kahan-summed H(N) | O(N) |
| `sumRational(N)` | exact `Rational` | O(N) |
| `sumApprox(N, terms=4)` | `{value, errorBound, method}` | O(terms) |
| `sumDimensional(n, d, terms)` | H(n^d) via d·ln n | O(terms) |
| `errorBound(N, terms)` | first omitted term | O(1) |
| `reciprocalPower(s, F, L, terms=6)` | Σ k^(−s) with error estimate | O(1) at fixed precision |
| `progressionSum(a0, h, N)` | Σ 1/(a0+kh) via digamma | O(1) at fixed precision |
| `harmonicMean(xs)` | n/Σ(1/x) | O(n) |

### `Geometry` and grid

| member | returns |
|---|---|
| `Geometry.ball.volume(d, R)` | π^(d/2)/Γ(d/2+1)·R^d |
| `Geometry.ball.surface(d, R)` | d·V/R |
| `Geometry.ball.fill(d)` | fill number k(d) |
| `Geometry.ball.peakDimension()` | 5 |
| `Geometry.cube.volume` / `surface` / `diagonal` / `faces(d, k)` / `fill` | |
| `Geometry.simplex.volume` / `faces` / `fill` | |
| `Geometry.crossPolytope.volume` / `faces` / `fill` | |
| `Geometry.unified.volume(shape, d, s)` | V(d) = k(d)·s^d |
| `Geometry.unified.surface(d, V, inradius)` | d·V/inradius |
| `Geometry.table(maxD, size)` | volumes for d = 1..maxD |

Grid functions (also grouped as `Grid`), each fixed-dimension O(1):
- `strideMap(shape)`
- `dimensionalCount(shape | n, d)`
- `coordinateToIndex(coord, shape)`
- `indexToCoordinate(index, shape)`
- `nearestGridCell(point, origin, spacing, shape?)` → `{cell, snapped, residual}`

## Structure: OmniSegment and data structures

**Segment functions:**
- `apSegment` / `gpSegment` / `hpSegment(startValue, stepOrRatio, count, startIndex?, confidence?)` → `OmniSegment`
- `segmentFormulaAt(seg, i)`, `segmentValueAt(seg, i)`, `segmentRangeSum(seg, i, j)`
- `serializeSegment` / `deserializeSegment`
- `serializedBytes(value)`
- `makeSegmentId`

**`ExceptionIndex`** (alias `OmniSparseExceptionMap`):
- `set(index, value, expected?, reason?)`
- `get`, `has`, `delete`, `size`
- `inRange(lo, hi)`, `values()`, `toJSON()`

**Classes:**

| class | key methods |
|---|---|
| `OmniArray` | `ap(start, step, len)`, `gp(...)`, `valueAt(k)`, `set(k, v)`, `sum()`, `rangeSum(i, j)`, `toArray(limit)`, `descriptorBytes()`, `materializedBytes()` |
| `OmniRange` | `of(start, stop, step)`, `length`, `at`, `contains`, `indexOf`, `sum`, `countBetween` |
| `OmniSequence` | `new (segments)`, `segmentFor`, `valueAt`, `rangeSum`, `length`, `exceptionCount`, `descriptorBytes` |
| `OmniPrefix` | `new ("AP"\|"GP"\|"HP", a, stepOrRatio)`, `at(k)`, `range(i, j)` |
| `OmniWindow` | `new (prefix, width)`, `sum(k)`, `average(k)` |
| `OmniSchedule` | `new (start, interval, count)`, `at`, `nearest`, `nearestIndex`, `next`, `previous`, `countBetween`, `list` |
| `OmniGrid` | `new (shape, origin?, spacing?)`, `size`, `toIndex`, `toCoord`, `position`, `nearest` |
| `OmniFormulaIndex` | `set`, `get`, `valueAt(key, i)`, `keys`, `size` |

## OmniFit

All of these are also available grouped as `OmniFit`:
- `differences(xs)`, `ratios(xs)`
- `estimateInterval(values, relTol?)` → `{interval, confidence, differences}`
- `niceInterval(h)`
- `regularize(values, {interval?, t0?, exceptionTol?, nice?})` → `{t0, interval, rows[{index, k, originalValue, regularizedValue, residual, confidence, isException}], exceptions, segment, missingK, meanAbsResidual, confidence}`
- `scoreFamilies(values)`
- `classifyFamily(values, minScore?)` → `{family: "AP"|"GP"|"HP"|"NOISE", parameter, score, dispersion}`
- `structuralize(values, {relTol?, minRun?})` → `{segments, exceptions, stats}`
- `new OmniFitStream(relTol?)`: `push(x)`, `end()`, `segments`, `exceptions`

## HORN (not cryptographic)

All of these are also available grouped as `Horn`:
- generators: `counterHash(seed, worker, counter)`, `mulberry32`, `sfc32`, `xoshiro128ss`, `counterStream`, `defaultStreams(seed)`
- statistics: `ksUniform(sample)`, `hornFitness(D, w, eta)`
- `new HornMixer(streams, {eta, tau, window})`: `next()`, `adapt()`, `active()`, `weights`
- `new HornReplay(seed)`: `at(worker, counter)`, `range(worker, start, count)`
- `new HornWorkerSplit(key)`: `stream(workerId)`, `partition(total, workers)`
- projection: `normalInv(p)`, `project.normal` / `exponential` / `uniform`
- `bridgeScenarios(before, after, gaps, {scenarios, sigma, seed})`
- `HORN_SECURITY_NOTICE`

## Storage, cache, cookies

**Storage:**
- `MemoryStore`, `IndexedDBStore(db, store)`, `createStore(db, store)`, `deleteDatabase(db)`
- `EncryptedStore(store?)`: AES-GCM with a non-extractable key; `set`, `get`, `delete`

**Cache:**
- `contentHash(data)` (SHA-256)
- `compressNumbers(values)` → `{formula, rawBytes, formulaBytes, worthIt, ratio}`
- `decompressNumbers(formula)`, `formulaValueAt(formula, i)`
- `new OmniCache({store?, cacheName?, version?, memoryLimit?})`:
  - `set(key, value, {deps, persist})`
  - `get(key, loader?)` → `{value, tier, ms}`
  - `fetch(url)` (L3/L4), `invalidate(key)`, `isStale(key, value)`, `clear()`, `stats`

**Cookies:** `setSessionCookie(name, value, maxAge)` (tiny, `SameSite=Strict`, rejects sensitive data), `getCookie`, `deleteCookie`.

## Identity and agents

**Identity:**
- `Passkey.supported()`, `Passkey.register(userName)`, `Passkey.verify(passkeyId)`
- `Pin.hash(pin)`, `Pin.verify(pin, stored)`
- `new DeviceSigner(store?)`: `init()` → public JWK, `sign(action, payload)`, `verify(signed)`, `reset()`
- `newPersonaCredential(presentation)`, `randomId(bytes)`
- `PRESENTATION_PROFILES`, `presentationStyle(profile)`

**Agents:**
- `ACTION_LEVELS`
- `evaluateAction(level, ctx, external?)` → `"run" | "queue" | "deny"`
- `new PersonaRuntime(runner, {store?, signer?, storageKey?})`:
  - `subscribe(fn)`, `snapshot`, `restore()`
  - `instruct(text, plan)`, `setPresence("PRESENT"|"ABSENT")`
  - `detach()`, `work()`, `reattach(verified)`, `summary()`, `approve(taskId, ok)`
  - `setAgentActions(bool)`, `emergencyStop()`, `resume()`, `reset()`

## Gesture, spatial, AR

**Gesture:**
- `classifyGesture(landmarks21)` → `{gesture, confidence, extended, pinch}`
- `extendedFingers`, `pinchDistances`, `handScale`, `cursorOf`, `palmCenter`
- `new GestureTracker({stableFrames, holdMs, swipeVelocity, mirror})`:
  - `on(event, fn)`, `update(hands, tMs)`, `reset()`
  - events: `cursor`, `gesturestart`, `gestureend`, `drag`, `hold`, `swipe`, `zoom`, `rotate`
- `compressStroke(points, {grid})` → `{mode: "formula"|"raw", ratio, …}`, `decompressStroke(c)`
- `GESTURE_ACTIONS`

**Spatial:** `vec`, `OneEuroFilter`, `OneEuro2D`, `snap2(p, h, origin?)`

**AR:**
- `detectXR()`, `startCamera(opts)`, `stopStream(stream)`
- `AnchorManager`: `add`, `remove`, `update(target|null)`, `list`
- `PresenceDetector({enterFrames, exitFrames})`: `update(detected)`

## Runtime and performance

**Runtime:**
- `capabilities()` → feature flags
- `speak(text, {onBoundary})`, `listenOnce()`
- `keepAwake()`, `notify(title, body)`, `runInWorker(url, message)`

**Performance:**
- `bench(name, fn, {iterations})`, `benchOps(name, fn, {ops})` (per-call cost), `benchAsync`
- `heapUsed()`
- `runSuite(N)` → measured rows

## Math core and complexity

**Math:**
- `Rational`, `gcd`, `factorial`, `binomial`, `binomialNumber`
- `bernoulli(n)`, `faulhaber(n, p)`
- `gamma`, `lnGamma`, `digamma`
- `KahanSum`, `bigPow`, `median`
- `powerMean(values, p, weights?)`
- `EULER_GAMMA`

**Complexity:** `COMPLEXITY_CLASSES`, `defineComplexity(spec)`, `complexityOf(api)`, `complexityCatalog()`, `NOT_O1`

**Version:** `VERSION`
