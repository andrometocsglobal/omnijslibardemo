# 05 — HORN: Controlled Stochastic and Uncertainty Engine

> **HORN IS NOT A CRYPTOGRAPHIC RANDOM NUMBER GENERATOR.**
> Tokens, keys, salts, IDs and signatures in this project use `crypto.getRandomValues` and Web Crypto.

**Abstract.** OMNIBAL answers deterministic questions exactly. HORN exists for questions that have **no** deterministic answer: missing data, uncertainty, Monte Carlo experiments, exploration and procedural behaviour. Its design goals are *replayability* (any sample can be reconstructed) and *robustness* (several structurally different generators are mixed, and a misbehaving one is ejected).

**Rule:** never use HORN where mathematics gives an exact answer.

## 1. Sources

There are four structurally different generators, so a weakness in one design is unlikely to be shared by the others:

| stream | structure |
|---|---|
| `mulberry32` | Weyl sequence + multiply/xorshift output |
| `sfc32` | chaotic add–rotate–xor with a counter |
| `xoshiro128**` | linear xorshift state + multiplicative scrambler |
| `counterHash` | stateless counter-based hash (murmur3 `fmix32` rounds) → 53-bit uniform |

The tests check that each stream's Kolmogorov–Smirnov distance to U(0,1) is below 0.03 over 4,000 draws.

## 2. Counter replay: O(1) random access

```
value = H(seed, workerId, counter)
```

Any sample, such as #1,000,000,000 of worker 3, is recomputed directly. There is no log of earlier draws.

| | classical PRNG + log | HORN counter replay |
|---|---|---|
| reconstruct sample t | Θ(t) regenerate, or Θ(t) stored log | **O(1)** |
| persistent state | Θ(t) log | **O(1)**: (seed, worker, counter) |
| generate N samples | Θ(N) | Θ(N): output-bound, unchanged |

Measured (doc 03): replaying any of 200k samples takes 36 ns per sample. Building the equivalent log took 5.2 ms and 1.53 MB.

## 3. The fitness-weighted mixer

From the research reference:

```
Fitness:        f_i = exp(−η · D_i · √w)          D_i = KS distance of stream i's last w draws
Weight update:  w_i ← w_i·f_i / Σ_j w_j·f_j
Ejection gate:  include i  iff  w_i > τ
Combine:        u_t = frac( Σ_{i: w_i > τ} v_{i,t} )
```

- **Why sum-then-frac?** The fractional part of a sum of independent uniforms is uniform, so one healthy stream is enough to keep the output uniform. A biased stream cannot bias the result unless every stream is biased.
- **Adaptation.** Weights adapt every w draws, costing O(m · w log w). A draw costs O(m), which is O(1) for a fixed number of streams.
- **Test evidence.** A deliberately stuck stream (always 0.1) is ejected, and the mixed output stays uniform (KS < 0.05).

## 4. Worker splitting

```
S_j = { H(K ‖ j, t) }_t
```

Each worker gets an independent stream from one key. `partition(total, workers)` assigns contiguous counter blocks, so parallel Monte Carlo is reproducible regardless of scheduling.

## 5. Omniprojection

Π_Ω(u) → (F₁⁻¹(u₁), …): uniforms are mapped through inverse CDFs.
- normal: Acklam's approximation, |error| < 1.2e-9
- exponential
- uniform ranges

## 6. Missing data: the OmniFit + HORN split

```
10:00 = 100   10:10 = 105   10:20 = ?   10:30 = ?   10:40 = 121
```

- OmniFit fixes the **timeline** exactly: a 10-minute grid, with the missing slots identified.
- HORN fills only the **unknown values** with `bridgeScenarios`: Brownian-bridge paths pinned at 105 and 121, with seeded and replayable variance.
- The output is a set of labelled scenarios, never presented as a measurement.

## 7. Complexity summary

| component | time | space |
|---|---|---|
| one draw, fixed m streams | O(m) = O(1) | O(m·w) windows |
| counter replay of one draw | O(1) | O(1) |
| KS-window adaptation | O(m · w log w) | O(m·w) |
| N samples | Θ(N) | O(1) streaming, or Θ(N) if kept |
