# 07 — 3D / 4D / 5D Architecture

> **Scientific framing.** No literal fourth or fifth physical dimension is claimed. "3D Layer", "4D Parallel Reality Layer" and "5D AR Layer" are **product abstractions**.

| layer | definition | implementation |
|---|---|---|
| **3D** | spatial digital representation of the user | React Three Fiber digital human (`Avatar`, `Human3D` page) |
| **4D** | persistent "parallel reality" software state that keeps planning, drafting and simulating while the person is absent | `PersonaRuntime` state machine (library `agents.js`) |
| **5D** | AR embodiment of the 4D persona in the physical environment | camera + anchored AR cards + hologram persona; WebXR `immersive-ar` where supported |

## 1. System diagram

```
USER
  │
  ▼
React UI (Vite, React Router, PWA)
  │
  ├──────────────────────────────┐
  ▼                              ▼
3D/4D/5D Runtime             OMNI Data Runtime   ← window.OmniDim (<script> library)
  │                              │
  │                     OmniFit Structuralizer
  │                              │
  │                         OmniSegment
  │                   ┌──────────┴──────────┐
  │                   ▼                     ▼
  │                OMNIBAL                HORN
  │             deterministic           stochastic
  └───────────────────┴──────────┬──────────┘
                                 ▼
                          Agent Runtime (PersonaRuntime)
                                 ▼
                     Permission / Safety Gate (evaluateAction)
                                 ▼
                    Browser / Android-like APIs (camera, WebXR, SW, IndexedDB, Web Crypto, WebAuthn)
```

The library is loaded **once** with `<script src="/lib/omnidim.umd.js">`. React components read `window.OmniDim`. The Web Worker loads the *same file* with `importScripts`, so formula logic is never duplicated or bundled twice.

## 2. 3D Layer: digital human

- **Procedural avatar.** Head, eyes, brows, mouth, torso and arms. No external GLTF, so the build is fully static and offline-capable.
- **Face orientation.** Follows the pointer, or the on-device MediaPipe face detector when the camera is on (opt-in).
- **Expressions.** neutral / smile / surprised / concerned, via brows and mouth.
- **Wave gesture animation and breathing idle.**
- **Speech.** `speechSynthesis` (`OmniDim.speak`). Lip motion is driven by word-boundary events, with a text-cadence fallback when no speech engine exists.
- **Voice input.** `OmniDim.listenOnce` (Web Speech API); the microphone is used only on click.
- **Scene awareness.** Coarse lighting (dim / normal / bright) from a 32×24 luminance sample. No identity and no sensitive attributes.
- **Fallback.** A 2D SVG avatar when WebGL is unavailable.

## 3. 4D Layer: persona state machine

```
        instruct()                 setPresence(ABSENT)
ATTACHED ───────────► tasks ───────────────────────► DETACHED ──work()──► prepared results
   ▲                                                    │
   │ reattach(verified = true)                          │ setPresence(PRESENT)
   └──────────────── VERIFYING ◄─────────────────────────┘
                     (passkey / PIN)
```

**Action levels and the gate** (`evaluateAction`, pure and O(1)):

| level | meaning | decision |
|---|---|---|
| 0 | read-only reasoning | run |
| 1 | prepare recommendation | run |
| 2 | create draft (local) | run |
| 3 | queue reversible action | queue for approval |
| 4 | require user confirmation | queue for approval |
| 5 | prohibited without fresh authentication | **deny**, unless freshly authenticated and attached; then queue |

Any task flagged `external` is queued, whatever its level. Emergency stop denies everything. Approvals are allowed only in `ATTACHED` mode, after identity verification.

**Local task execution.**
- OMNIBAL power sums and HORN Monte Carlo run in the Web Worker.
- Drafts are written to IndexedDB.
- **Nothing is sent anywhere.**

**Persistence.** State is persisted to IndexedDB. After a reload, `running` tasks become `pending` again and are never assumed complete.

**Audit.** Every decision (deny / queue / executed / approved / rejected) is appended to an audit log, signed with a non-extractable ECDSA P-256 device key.

**Browser limitations, stated honestly.**
- Hidden tabs throttle or pause timers. Work resumes on `visibilitychange` or a Background Sync event (where supported).
- There is no unrestricted background execution.
- Server-side agents would require a backend, which this static build intentionally does not have.

## 4. 5D Layer: AR persona

| mode | behaviour |
|---|---|
| `REAL_PERSON_PRESENT` | AR cards (tasks, progress, approvals) anchor around the detected face using `AnchorManager` (smoothed offsets) |
| `DETACHED_PERSONA` | cards float to free positions and a translucent hologram avatar (waving while tasks run) represents the persona |
| return | `PresenceDetector` (hysteresis: 8 frames to enter, 60 to leave) → `VERIFYING` → identity check → `ATTACHED`; state is reconciled and the summary is spoken |

- **Camera warm-up is not "leaving".** Absence is acted on only after the person has been seen once.
- **WebXR.** When `immersive-ar` is supported (e.g. Android Chrome with ARCore), a minimal three.js session places task panels 1.2 m in front of the user (`xr/xrSession.js`).

## 5. Gender-aware presentation, done safely

`presentationProfile` ∈ {neutral (default), masculine, feminine, androgynous, custom} is an **explicit user choice** that changes accent colour and hair style. The camera is never used to infer gender, and the app never states "this user is a man/woman".
