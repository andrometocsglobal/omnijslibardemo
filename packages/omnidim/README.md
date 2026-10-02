# @omniballabs/omnidim — OMNIDIM JS library

A plain-JavaScript, zero-dependency library for **omnidimensional formulas** and **formula-compressed data structures**. It works from a `<script>` tag, as an ES module, in Node.js and in Web Workers.

```html
<script src="https://cdn.jsdelivr.net/gh/andrometocsglobal/omnijslibardemo@main/packages/omnidim/dist/omnidim.umd.js"></script>
<script>
  const { AP, GP, HP, Geometry, OmniFit, OmniArray } = OmniDim;

  AP.sum(10, 10, 1_000_000);                  // 5000005000000 — O(1), no loop
  AP.powerSum(2, 8, 1, 3);                    // 2024n = 2³+…+9³ (OMNIBAL midpoint formula)
  GP.sum(3, 2, 10);                           // 3069
  HP.sumApprox(1e9);                          // { value: 21.30048150234794…, errorBound, … }
  Geometry.ball.volume(5);                    // 5.2637… (peak unit-ball volume)
  OmniFit.regularize([0,10,20,31,40,50,61,70]).interval;   // 10
  OmniArray.ap(10, 10, 10_000_000_000n).valueAt(9_999_999_999n); // 100000000000
</script>
```

```js
// ES module / Node.js
import * as OmniDim from "@omniballabs/omnidim";
```

## Modules

| module | contents |
|---|---|
| math | exact BigInt `Rational`, Bernoulli, Faulhaber, Γ / lnΓ / ψ, Kahan sums, power mean |
| ap / gp / hp / geometry | the four formula families + regular-grid addressing |
| segment / datastructures | `OmniSegment`, `ExceptionIndex`, `OmniArray`, `OmniRange`, `OmniSequence`, `OmniPrefix`, `OmniWindow`, `OmniSchedule`, `OmniGrid`, `OmniFormulaIndex` |
| omnifit | interval estimation, snap-to-grid with residuals, family scoring, segmentation, streaming |
| horn | replayable, mixed stochastic streams (**not cryptographic**) |
| storage / cache | IndexedDB / memory / AES-GCM stores, `OmniCache` L0–L4, safe cookies |
| identity / agents | passkeys, PIN, device signing, 4D `PersonaRuntime` with a level 0–5 permission gate |
| gesture / spatial / ar | hand-gesture classifier and tracker, stroke compression, One-Euro filter, AR anchors, presence |
| performance / runtime | measured benchmark suite, capability detection, speech, workers |
| complexity | the Big-O contract of every API and the `NOT_O1` boundary |

## Complexity model

```
Structure discovery O(N)  →  representation O(S + E)  →  supported queries O(1) in N
```

See `docs/` in the repository for the research write-ups and the full catalogue. `OmniDim.complexityCatalog()` returns it at runtime.

## Scripts

```bash
npm run build   # dist/omnidim.mjs + dist/omnidim.umd.js
npm test        # 53 unit + property tests (formula == brute force)
```

MIT licence.
