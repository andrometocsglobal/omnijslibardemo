# 12 — Example Scenarios

## A. The 3D → 4D → 5D experience

1. **3D.** Kumaran opens the app. The digital human appears (3D Human page) beside the optional live camera feed.
2. **Instruction.** He says or types: *"Review today's tasks and prepare my project notes."* The 4D page records it and plans eight tasks across levels 0–5.
3. **4D.** He leaves the desk. Presence changes **PRESENT → ABSENT**, either automatically from the 5D page's face detector or with the "I'm leaving" button. The persona **detaches** and works locally:
   - organises project information (L1)
   - drafts project notes into IndexedDB (L2)
   - calculates OMNIBAL values and runs a HORN simulation in the Web Worker (L0/L1)
   - queues "Share notes by email" (L4, external) and "Archive old files" (L3) **for approval**
   - **blocks** "Purchase cloud storage upgrade" (L5, external, no fresh authentication)

   No email is sent, nothing is purchased, and no external system changes.
4. **5D.** In AR mode the detached persona hologram stands in the workspace. Floating cards show "Task 1 complete", "Task 2 needs approval", "Simulation running" and "2 approvals required".
5. **Return.** Presence goes **ABSENT → PRESENT** → **VERIFYING** → passkey or PIN → **ATTACHED**. The persona says:

   > "Welcome back. 5 tasks were prepared. No external actions were executed. 2 approvals are waiting. 1 blocked. Would you like to review them?"

   This exact wording is produced by `PersonaRuntime.summary()`, and the test suite asserts it for its own plan.
6. He approves or rejects each queued item. Every decision is signed into the audit log.

## B. Telemetry ingestion with OmniFit

A sensor reports roughly every 10 minutes, with jitter and two dropouts. `regularize()` returns:
- h* = 10
- each reading's residual
- the missing grid slots
- an AP OmniSegment

Range aggregates over a day are O(1). The two missing values come from `bridgeScenarios` as labelled scenarios, never as measurements.

## C. A billion-event schedule

`new OmniSchedule(start, 600, 1e9)` takes three numbers. `nearest(t)`, `next(t)`, `previous(t)` and `countBetween(t1, t2)` are O(1). Listing the next 50 events is O(50).

## D. Hierarchy capacity

A 16-ary storage tree holding 10¹² leaves:
- `GP.levelsFor(16, 1e12)` = 10 levels
- `GP.levelCount(16, 10)` = total nodes

There is no traversal.

## E. Holo Console session

1. Start hand tracking.
2. Pinch DRAW and sketch a diagram with grid snap on, so straight strokes are stored as OmniFit formulas.
3. Make a `VICTORY` sign to switch to NOTEPAD and type a heading on the air keyboard.
4. Sweep an open palm to switch to DOCUMENT, and pinch H1 and B.
5. Sweep again to ZOOM VIEW and two-hand-pinch into the star lattice. Pinching a cell shows its O(1) address. Σk³ for 2…9 = 2024.
6. Thumb–pinky tap saves.

## F. Using the library from a plain web page

```html
<script src="https://cdn.jsdelivr.net/gh/andrometocsglobal/omnijslibardemo@main/packages/omnidim/dist/omnidim.umd.js"></script>
<script>
  const r = OmniDim.regularize([0, 10, 20, 31, 40, 50, 61, 70]);
  console.log(r.interval, r.rows.map(x => x.regularizedValue)); // 10, [0,10,20,30,40,50,60,70]
  const big = OmniDim.OmniArray.ap(10, 10, 10_000_000_000n);
  console.log(big.valueAt(9_999_999_999n));                      // 100000000000
</script>
```

## G. Node.js

```js
import * as OmniDim from "@omniballabs/omnidim";            // or the dist/omnidim.mjs file
OmniDim.AP.powerSum(782, 2n ** 100n, 7, 50).toString().length; // 1576
```
