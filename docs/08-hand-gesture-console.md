# 08 — Hand-Gesture Holo Console

**Abstract.** The Holo Console is a gesture-driven workspace in the spirit of the *Minority Report* gesture interface and *Star Trek* LCARS consoles. It provides four tools — **Draw, Notepad, Document, Zoom View** — operated by hand movements tracked on-device. The gesture vocabulary is modelled on calm, deliberate, wellness-style "brain-gym" hand movements (finger-to-thumb taps, open palm, soft fist, two-hand mirroring), used **purely as input**. The demo contains no exercise features.

## 1. Tracking pipeline

```
camera (opt-in) → MediaPipe HandLandmarker (WASM, on-device, GPU→CPU fallback)
               → 21 landmarks × up to 2 hands per frame
               → OmniDim.GestureTracker
                    classify (O(1)/frame) → debounce (3 stable frames) → One-Euro smoothing
                    → events: cursor · gesturestart/end · drag · hold · swipe · zoom · rotate
               → console actions (press holo buttons, draw, type, scroll, zoom)
```

- **No frames leave the browser.** The MediaPipe WASM runtime is self-hosted (`/mediapipe/wasm`). The model file is a static download, cached by the service worker.
- **Speed.** In headless Chrome with a synthetic camera the loop ran at about 56 fps.

## 2. Gesture vocabulary

| gesture | detection | console action |
|---|---|---|
| `PINCH_INDEX` (thumb–index tap) | normalised tip distance < 0.32·hand size | select / press button / draw |
| `PINCH_MIDDLE` (thumb–middle tap) | " | erase / context |
| `PINCH_RING` (thumb–ring tap) | " | undo |
| `PINCH_PINKY` (thumb–pinky tap) | " | save |
| `POINT` | only the index extended | cursor |
| `OPEN_PALM` | four fingers extended | hover; **hold** ≈ 1 s → gesture map; fast horizontal sweep → previous/next tool |
| `FIST` | no fingers extended, tips curled into the palm | grab & pan / scroll |
| `VICTORY` | index + middle | next tool |
| `THUMBS_UP` | thumb only | accept |
| two-hand `PINCH_INDEX` | both hands pinching | **zoom** (distance ratio) and **rotate** (angle delta) |

**Robustness rules found during testing:**
1. A closed fist puts the thumb on the curled fingertips. Fist detection (all fingertips within 0.55 hand-size of the palm centre) therefore runs **before** pinch detection.
2. A pointing hand often rests the thumb on the curled middle finger. A pinch only counts when the target fingertip is **away from the palm** (> 0.5 hand-size).
3. Thresholds are normalised by hand size (wrist → middle MCP), so distance from the camera does not matter.

**Mouse/touch fallback.** Without a camera, every tool still works: drag = pinch, Shift+drag = erase, Ctrl+wheel = zoom, and buttons can be clicked.

## 3. Tools

### Draw
- glowing strokes, a 6-colour palette and 3 widths
- optional **grid snap**, using O(1) `snap2` → `nearestGridCell`
- undo, clear, PNG export
- **formula-compressed storage** (§4); strokes are saved to IndexedDB

### Notepad
- an **air keyboard**: hover a key with the fingertip and pinch to type
- caps, space, backspace and enter
- notes are encrypted at rest with **AES-GCM** (`EncryptedStore`, non-extractable key in IndexedDB)

### Document
- a Word-style rich-text editor: H1/H2/¶, bold/italic/underline, bullet and numbered lists, centre, undo
- every toolbar button is pinchable
- a fist scrolls the page
- encrypted save and HTML export

### Zoom View
- a star lattice from the three-dimensional AP example: stars at F³…L³ light-years, with two faces at 90°, as in the "Three Dimensional Arithmetic Progression" video
- two-hand zoom/rotate and fist pan
- pinching a cell computes its address with **O(1) `nearestGridCell` + `coordinateToIndex`**, with no lookup table
- the header shows Σk³ from F to L computed by OMNIBAL (`X·[M³ + 3·M·μ₂·s²]`); F = 2, L = 9 gives 2024

## 4. Omnidimensional optimisation: stroke compression

A hand-drawn stroke is a sequence of P points. `compressStroke`:
1. snaps points to a small pixel grid (default 2 px) — FIXED-DIMENSION O(1) each
2. runs `structuralize` separately on the x and y sequences, finding AP runs (straight, evenly sampled stretches) plus exceptions — O(P)
3. **keeps the formula form only if it is smaller**; otherwise it stores raw points (`mode: "raw"`)

| stroke | stored as | result |
|---|---|---|
| straight, evenly sampled (200 pts) | 2–4 AP segments | > 20× fewer numbers (test) |
| free-hand curve | raw | never larger than raw (test) |

This follows the framework's general rule: represent structure when it exists, store exceptions otherwise, and never pretend arbitrary data compresses.

## 5. Complexity

| step | cost |
|---|---|
| classify one hand | O(21) = O(1) |
| tracker update | O(hands) = O(1) |
| One-Euro smoothing | O(1) per sample |
| button hit-test | `elementFromPoint`, browser-native |
| grid snap / cell address | fixed-dimension O(1) |
| stroke compression | O(P) once; storage O(S + E) |
