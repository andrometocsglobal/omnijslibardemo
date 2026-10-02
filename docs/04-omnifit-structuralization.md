# 04 — OmniFit: Structuralizing Irregular Data

**Abstract.** OmniFit is the discovery layer. It takes raw, noisy, irregular observations and finds the formula structure that OMNIBAL can then compute on. It never overwrites the evidence: every regularised value is stored with its original value, its residual and a confidence. Discovery costs O(N), or O(N log N) with the robust median. After discovery, supported queries are O(1) in N.

## 1. Pipeline

```
RAW DATA
  → difference / ratio extraction         Δ_i = x_i − x_{i−1},  ρ_i = x_i / x_{i−1}
  → candidate family scoring              AP · GP · HP · (Geometry) · NOISE
  → dominant interval detection           h* = robust estimate
  → snap-to-grid                          k_i = round((t_i − t0)/h*)
  → residual / error calculation          r_i = t_i − (t0 + k_i·h*)
  → classification                        AP / GP / HP / Geometry / Hybrid
  → segment creation                      OmniSegment(s)
  → exception extraction                  sparse ExceptionIndex
  → OMNIBAL formula compression
  → (HORN for remaining uncertainty)
```

## 2. Dominant-interval estimation

The research example:

```
input:      00:00 00:10 00:20 00:31 00:40 00:50 01:01 01:10
Δ:              10    10    11     9    10    11     9
h*:         10 minutes
regular:    00:00 00:10 00:20 00:30 00:40 00:50 01:00 01:10
```

**Estimator (`estimateInterval`):**
1. Take the positive differences and their median, med.
2. A difference d close to m·med is treated as a *gap* of m intervals, so missing observations do not bias the estimate.
3. Average the differences inside a tolerance band (default ±25%), weighted by m.
4. Confidence = the fraction of differences inside the band.
5. `niceInterval` optionally snaps h* to a nearby round value (1, 2, 2.5, 5 or 10 × 10^k) when within 5%.

The median makes the estimate robust to outliers. The sort makes it O(N log N); a streaming mode estimate would be O(N).

## 3. Snap-to-grid with preserved evidence

Every row of `regularize()` contains:

| field | meaning |
|---|---|
| `originalValue` | the observation, untouched |
| `regularizedValue` | t0 + k·h* |
| `residual` | original − regularised |
| `confidence` | max(0, 1 − 2·\|residual\|/h*) |
| `isException` | \|residual\| > 0.3·h*, or a second observation on the same slot |

The function also returns:
- `missingK`: grid slots with no observation
- the generated **OmniSegment**, whose exceptions are already stored sparsely
- the mean absolute residual

Missing slots are *not* invented. If values are needed there, that is HORN's job, and HORN's output is labelled as stochastic (doc 05).

## 4. Family scoring

For a value series, OmniFit measures the *relative dispersion* of each family's invariant: median absolute deviation divided by |median|.

| family | invariant | regular when |
|---|---|---|
| AP | Δ_i | differences ≈ constant |
| GP | ρ_i | ratios ≈ constant (no zeros) |
| HP | Δ(1/x_i) | reciprocals form an AP |
| NOISE | — | best score below threshold: **do not force-fit** |

score = 1/(1 + 50·dispersion). The tests confirm:
- `[3,7,11,15,19]` → AP
- `[2,6,18,54,162]` → GP
- `[1, ½, ⅓, ¼, ⅕]` → HP
- `[5,−3,17,2,99,4]` → NOISE

## 5. Piecewise segmentation (`structuralize`)

A greedy single pass. At each position it extends the longest AP run and the longest GP run, keeps the longer one if it has at least `minRun` (default 3) points, and otherwise records the point as an exception.

**Example from the tests:**
- input: 1,000 AP values, then one stray value, then 20 GP values
- output: **2 segments + 1 exception**, a compression ratio above 50×

Time O(N); output O(S + E).

## 6. Streaming OmniFit (`OmniFitStream`)

Active state is a fixed set of fields: start index, first, previous and last value, count, family, and parameter. Each `push(x)`:
- extends the run if x fits (AP: x − last ≈ step; GP: x / last ≈ ratio)
- otherwise closes the run as a segment (if it has ≥ 3 points) and starts a new one
- a 2-point run that cannot be extended releases its oldest point as an exception

This is O(1) amortised per item with bounded memory, which suits telemetry and IoT ingestion. Total storage grows with S + E, not with N.

## 7. Failure modes, stated plainly

- **Pure noise:** E ≈ N. The representation is no better than an array, and OmniFit reports it.
- **Drift:** a slowly changing interval splits into several segments. A future piecewise-linear interval model could absorb it.
- **Multi-modal intervals** (e.g. alternating 10/20 min): the median picks one mode; the other appears as gaps or exceptions.
- **Exact equality tolerance** for `structuralize` is `relTol` (1e-9 by default). Noisy floats need a larger tolerance, or `regularize` first.
