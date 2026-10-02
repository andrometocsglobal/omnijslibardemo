# 03 — Algorithms and Big-O: Omnidimensional vs Classical

**Abstract.** This document gives the complexity model of the framework. It lists every operation that becomes O(1) *in N* under explicit structural assumptions, and every operation that cannot. It closes with benchmark results measured on real hardware. The rule used throughout: **an operation is called O(1) only when a mathematical structure removes the dependence on N, never because a benchmark used a small input.**

## 1. The core model

```
Structure discovery      Time  O(N)           (the data must be read)
Formula representation   Space O(S + E)       (S segments, E exceptions)
Supported query          Time  O(1) in N      (after discovery)
Perfectly regular data   S = 1, E = 0  ⇒  Space O(1) in N
```

| symbol | meaning |
|---|---|
| N | number of represented elements |
| S | structural segments |
| E | exceptions |
| p | power (AP power sums) |
| d | dimension |
| m | number of HORN streams |
| K | output size |

## 2. Complexity classes used by the library

Every public API registers a contract (`complexityOf(api)`, `complexityCatalog()`) in one of these classes:

| class | meaning | example |
|---|---|---|
| FORMULA O(1) | closed form, independent of N | `AP.sum`, `OmniSchedule.nearest` |
| AVERAGE O(1) | hash-based, expected constant | `ExceptionIndex.get`, `OmniFormulaIndex.get` |
| AMORTIZED O(1) | constant per item on average | `OmniFitStream.push` |
| FIXED-DIMENSION O(1) | O(d), with d a fixed parameter | `coordinateToIndex`, `nearestGridCell` |
| O(log N) | logarithmic | `OmniSequence.segmentFor` (O(log S)) |
| O(N), O(N log N) | linear / sort-bound | `structuralize`, `regularize` |
| OUTPUT-BOUND | Ω(K) for K outputs | `toArray`, `decompressNumbers`, `OmniSchedule.list` |

## 3. Classical vs omnidimensional: operation table

| operation | classical (materialised) | omnidimensional | precondition |
|---|---|---|---|
| k-th element | O(1) after Θ(N) build; O(k) on a stream | **O(1)** `a0 + k·h` | AP descriptor |
| last element | O(N) stream scan | **O(1)** | AP/GP |
| sum of N | Θ(N) | **O(1)** `N·M` | AP |
| fixed-power sum Σa(k)^p | Θ(N·p) | **O(p²)**, independent of N | AP, fixed p |
| mean / variance | Θ(N) | **O(1)**: M and h²(N²−1)/12 | AP |
| range sum (i, j) | O(j−i), or prefix array Θ(N) build + Θ(N) space | **O(1)**, no table | AP/GP segment |
| sliding-window sum | O(W) buffer | **O(1)**, no buffer | one segment |
| membership | O(N) scan / O(log N) search | **O(1)** modulo test | known start/step/count |
| next / previous / nearest event | O(log N) binary search on N stored events | **O(1)** | fixed interval |
| count of events in a range | O(log N) | **O(1)** | fixed interval |
| GP total / hierarchy node count | Θ(N) / Θ(nodes) traversal | **O(1)** formula calls | uniform ratio / branching |
| harmonic total H(N) | Θ(N) | **O(1)** at fixed precision, with error bound | approximation accepted |
| coordinate ↔ address | lookup table Θ(cells) | **O(d)** = fixed-d O(1) | regular lattice |
| nearest grid cell | kd-tree O(log N) / scan O(N) | **O(d)** | uniform stride |
| d-dimensional volume / faces | voxel count O(cells) / Monte Carlo | **O(1)** formula calls | fixed d |
| random sample #t replay | Θ(t) stored log or regeneration | **O(1)** H(seed, worker, t) | counter-based generator |
| streaming ingest | re-scan O(N) | **O(1)** amortised per item | bounded active state |

## 4. What does not become O(1)

| problem | bound | reason |
|---|---|---|
| read N arbitrary values | Ω(N) | each must be inspected |
| output N values | Ω(N) | the output has N items |
| discover arbitrary hidden structure | Ω(N) in general | an unseen value can change the classification |
| comparison sort | Ω(N log N) | comparison-model lower bound |
| arbitrary range query | O(log N + K) | ordering + output |
| arbitrary nearest neighbour | not universally O(1) | depends on dimension, index and data |
| graph traversal | O(V + E) | must visit the structure |
| matrix multiplication | not O(1) | work grows with size |
| materialise M missing values | Ω(M) | M outputs |
| return K rows | Ω(K) | K outputs |
| N random samples | Ω(N) | replay is O(1) *per sample* |

These are exported as `NOT_O1` and shown in the demo's Complexity Lab.

## 5. Bit complexity vs formula calls

"O(1)" counts **formula evaluations on machine words**. Three caveats:
- An exact `AP.powerSum` of a 1,576-digit result is O(p²) *rational operations*, but each operation works on large integers.
- Exact `GP.sumBig` needs r^N, which takes O(log N) multiplications of growing size.
- HP is O(1) only at fixed precision.

The library separates float paths (true O(1) machine operations) from BigInt paths, and states this in each contract's `limitation` field.

## 6. Measured benchmarks

The numbers below were measured in headless Chrome in a Web Worker, one run on the development machine, using `runSuite(1_000_000)`. They illustrate scale only, not a guarantee. **Run the demo's Performance page to measure your own device.** Fast operations are timed as batches of 100,000 calls and divided, because a single call is below the browser's timer resolution.

| benchmark (N = 10⁶) | traditional | omnidimensional | speed-up | traditional size | formula size |
|---|---|---|---|---|---|
| Sum of N (build + scan vs formula) | 3.90 ms | 135 ns | ~28,900× | 7.63 MB | 148 B |
| Range sum (prefix build + query vs formula) | 9.60 ms | 25 ns | ~384,000× | 7.63 MB | 24 B |
| Range sum, **query only** (prefix already built) | 22 ns | 25 ns | **0.88×** | 7.63 MB | 24 B |
| Nearest regular event, per query | 397 ns (binary search) | 32 ns | ~12× | 7.63 MB | 42 B |
| Replay any of 200k random samples | 5.20 ms (build log) | 36 ns | ~144,000× | 1.53 MB | 24 B |
| Serialised state, 100k values | — | — | — | 672.8 KB | 45 B |

**Reading the table honestly:**
- **Where the gain comes from.** Most of it is *avoided preprocessing and memory*: the O(N) build, scan or log. Once a classical prefix array exists, a single query is equally fast (0.88× — slightly slower). The formula wins because it never needs the table.
- **Nearest event.** The binary search pays O(log N) ≈ 20 comparisons per query. The formula pays one division and one rounding.
- **Compression ratios.** These hold only because the data is perfectly regular. With E exceptions the formula size grows linearly in E.

## 7. Break-even analysis

Structure discovery costs about c_d·N once. A conventional approach costs about c_q·N per aggregate query when it rescans, or c_b·N once plus Θ(N) memory when it pre-builds an index. The formula approach pays c_d·N once and then O(1) per query, with O(S+E) memory. So:

- **Against rescanning:** structuralisation pays for itself after about c_d/c_q queries, typically a single query.
- **Against a pre-built index:** time per query is similar, but memory drops from Θ(N) to Θ(S+E). That is the deciding factor for caches, IndexedDB, network transfer and cookies.

## 8. Exception and segment sensitivity

The representation degrades gracefully. When E/N → 1 or S/N → 1 it approaches Θ(N), the same as an array, but never worse. `compressNumbers().worthIt` and `compressStroke().mode` detect this case and fall back to raw storage. The research PDF's benchmark matrix asks for exactly this kind of adversarial test. The test suite includes irregular strokes that must fall back to raw storage.
