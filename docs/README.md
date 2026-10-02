# OMNIDIM JS — Research Documentation

These documents explain how the **omnidimensional formula families** and the data structures and algorithms built on them work at scale. They also state precisely which **time and space complexities** are achieved, and how these differ from classical data structures and algorithms.

They follow the published research:

- Blog: *Omnidimensional Formulas Four Families and Upgrading Data Structure and Algorithm Omnidimensional Big Oh Time and Space Complexities* (October 2026)
- Reference PDF: *OMNIDIMENSIONAL Formulas + DSA — OMNIBAL + OmniFit + HORN: Formula Compression, Irregular-Interval Structuralization, and O(1)-Eligible Computing* (Andrometocs / Kumaran Kanniappan, October 2026)

Every formula here is implemented in the library (`packages/omnidim`) and verified against brute-force enumeration by the test suite.

## Contents

| # | Document | Topic |
|---|---|---|
| 01 | [Four formula families](01-four-formula-families.md) | AP, GP, HP, Geometry; OMNIBAL power sums; moment blocks |
| 02 | [OmniSegment & formula-compressed data structures](02-omnisegment-data-structures.md) | O(S + E) storage; OmniArray, OmniRange, OmniSequence, OmniPrefix, OmniWindow, OmniSchedule, OmniGrid |
| 03 | [Algorithms & Big-O: omnidimensional vs classical](03-algorithms-big-o.md) | complexity catalogue, lower bounds, measured benchmarks |
| 04 | [OmniFit structuralization](04-omnifit-structuralization.md) | irregular → regular, residuals, segmentation, streaming |
| 05 | [HORN stochastic engine](05-horn-stochastic-engine.md) | counter replay, fitness mixer, missing-data scenarios |
| 06 | [OmniCache, storage & cookies](06-omnicache-storage.md) | L0–L4 tiers, formula compression, invalidation |
| 07 | [3D / 4D / 5D architecture](07-3d-4d-5d-architecture.md) | digital human, persona state machine, AR persona |
| 08 | [Hand-gesture holo console](08-hand-gesture-console.md) | gesture vocabulary, tracker, stroke compression |
| 09 | [Security & privacy](09-security-privacy.md) | passkeys, signing, permission gate, privacy controls |
| 10 | [PWA, Android & Netlify guide](10-pwa-android-netlify.md) | install, offline, deploy |
| 11 | [WebXR / AR roadmap](11-webxr-roadmap.md) | next steps |
| 12 | [Example scenarios](12-example-scenarios.md) | 3D → 4D → 5D walkthrough and data examples |
| — | [API reference](API.md) | every public export |

## The one-paragraph thesis

> When a large dataset has exploitable mathematical structure, it can be stored as a few formula segments instead of individual elements. Storage then drops from **O(N)** to **O(S + E)** (S segments, E exceptions). Selected indexing, aggregation, scheduling, spatial-addressing and replay operations become **O(1) with respect to N**. Discovering the structure still costs **O(N)**, producing K explicit outputs still costs **Ω(K)**, and arbitrary unstructured data gets no such benefit. The contribution is moving work out of repeated enumeration and into one-time discovery plus compact formulas. It does **not** make "everything O(1)".
