# 02 — OmniSegment and Formula-Compressed Data Structures

**Abstract.** A classical array stores N values and costs Θ(N) space whether or not the values are related. An **OmniSegment** stores the *rule* that generates a run of values, plus a sparse map of the positions that break the rule. For data with S regular segments and E exceptions, space is **Θ(S + E)**. A single perfectly regular run costs Θ(1) relative to N. This document defines the structure, its invariants, and the data structures built on it, and compares each with its classical counterpart.

---

## 1. The OmniSegment record

```js
OmniSegment {
  id, family: "AP" | "GP" | "HP" | "GEOMETRY" | "HYBRID",
  startIndex: bigint, endIndex: bigint (inclusive), count: bigint,
  startValue, step | ratio, power?, dimension?,
  residualTolerance?, confidence,
  exceptions: ExceptionIndex,      // sparse: position → {value, expected, reason}
  metadata?
}
```

**Invariants:**
1. `count = endIndex − startIndex + 1`.
2. `value(i) = exceptions.has(i) ? exceptions.get(i).value : formula(i − startIndex)`.
3. Exceptions are kept, never discarded. The original observation is always recoverable.
4. Indices are `BigInt`, so one descriptor can represent 10¹⁰ or more elements.

**Size.** The test suite builds a 10-billion-element AP (10, 20, 30, …) and measures:
- serialised descriptor: **< 400 bytes**
- equivalent `Float64Array`: **80 GB**

Element #9,999,999,999 is returned as 100,000,000,000 without building any earlier element.

## 2. Sparse exceptions

`ExceptionIndex` is a hash map keyed by absolute position. Lookups are *average* O(1). Range scans are O(E) and output-bound when sorted. Real data with one dominant pattern and a few anomalies, such as a billion regular readings with 20 glitches, is stored as **1 descriptor + 20 records**:

```
space = O(1 + E)   for one segment
space = O(S + E)   in general
```

Range aggregates stay exact. The formula total is corrected by Σ(exception.value − formula.value) over the exceptions inside the range.

## 3. Data structures built on it

| structure | classical counterpart | classical cost | omnidimensional cost | precondition |
|---|---|---|---|---|
| `OmniArray` | `Array` / `Float64Array` | space Θ(N); access O(1) after Θ(N) build | space O(1+E); `valueAt` O(1) | one formula segment |
| `OmniRange` | stored list / Python `range` | membership O(N) scan | `contains`, `at`, `indexOf`, `countBetween`, `sum`: all O(1) | integer start/step |
| `OmniSequence` | array of N values | Θ(N) | space O(S+E); `valueAt` O(log S) | segments sorted |
| `OmniPrefix` | prefix-sum array | build Θ(N), space Θ(N), query O(1) | no build, space O(1), query O(1) | AP/GP (HP approximate) |
| `OmniWindow` | ring buffer of W values | space Θ(W), O(1) amortised update | space O(1), `sum(k)` O(1) | window inside one segment |
| `OmniSchedule` | sorted list of N events | nearest/next O(log N) binary search; space Θ(N) | `at`, `next`, `previous`, `nearest`, `countBetween`: O(1); space O(1) | fixed interval |
| `OmniGrid` | coordinate lookup table | Θ(cells) space | `toIndex`, `toCoord`, `nearest`: fixed-d O(1), no table | uniform lattice |
| `OmniFormulaIndex` | hash map of arrays | O(1) avg + Θ(N) per series | O(1) avg key lookup + O(1) formula query | series are regular |
| `ExceptionIndex` (`OmniSparseExceptionMap`) | dense array of flags | Θ(N) | Θ(E) | E ≪ N |

### 3.1 Formula prefix: the key trick

The classical prefix array costs an O(N) build and O(N) memory. In exchange, range sums cost O(1). For a structured family the prefix *is a function*:

```
Prefix(k)        = F(k)                       AP: k·a0 + h·k(k−1)/2 ;  GP: a(r^k − 1)/(r − 1)
RangeSum(i, j)   = F(j+1) − F(i)
WindowSum(k, W)  = Prefix(k+1) − Prefix(k+1−W)
```

The query cost stays O(1), and the Θ(N) build and Θ(N) memory **disappear**. The measured benchmarks (doc 03) report this honestly. *Per query*, a pre-built prefix array and the formula are about equally fast. The advantage is the build and memory that the formula never needs.

### 3.2 Periodic schedules

```
eventTime(k) = start + k·interval
nearest k    = round((t − start)/interval)     (clamped to [0, count−1])
next(t)      = start + (⌊(t − start)/interval⌋ + 1)·interval
count in [t1, t2] = ⌊(t2 − start)/i⌋ − ⌈(t1 − start)/i⌉ + 1
```

A billion cron-style occurrences need three numbers. Listing K of them is still Ω(K).

### 3.3 Membership

```
x ∈ AP  ⇔  (x − start) mod step = 0  ∧  0 ≤ (x − start)/step < count
```

This is O(1) in place of an O(N) scan or an O(log N) search.

## 4. What the structures deliberately do *not* do

- **Arbitrary data:** no compression. `structuralize` turns non-fitting points into exceptions, and when E ≈ N the representation is Θ(N), the same as an array. `compressNumbers` reports `worthIt: false`, and OmniCache then stores the raw value.
- **Materialisation:** `toArray(limit)` and `decompressNumbers` are OUTPUT-BOUND, O(K) for K values.
- **HP range sums inside a segment:** these fall back to O(length), because HP has no exact closed form (doc 01 §3).

## 5. Serialisation

`serializeSegment` converts the BigInt fields to strings and the exceptions to an array. The result is JSON-safe and round-trips exactly (tested). `serializedBytes()` measures UTF-8 JSON size, and every compression ratio in the docs and demo comes from it.
