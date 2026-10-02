/**
 * Hand-gesture engine for a holographic console (Minority Report / Star Trek
 * console style). Pure JavaScript, works on any 21-point hand-landmark source
 * (MediaPipe Hands / HandLandmarker layout), so it is testable without a camera.
 *
 * The gesture vocabulary follows calm, deliberate "brain-gym"-style hand
 * movements — finger-to-thumb taps, open palm, soft fist, two-hand mirroring —
 * used purely as INPUT. There are no exercise features here.
 *
 *   Landmarks: 0 wrist · 4 thumb tip · 8 index tip · 12 middle tip ·
 *              16 ring tip · 20 pinky tip; PIP joints 6/10/14/18.
 *
 * Gestures (per hand, O(1) per frame):
 *   PINCH_INDEX   thumb–index tap   → primary select / draw
 *   PINCH_MIDDLE  thumb–middle tap  → secondary (erase / context)
 *   PINCH_RING    thumb–ring tap    → undo
 *   PINCH_PINKY   thumb–pinky tap   → save / confirm
 *   POINT         index extended    → cursor
 *   OPEN_PALM     all extended      → hover / release; hold = menu
 *   FIST          none extended     → grab & pan
 *   VICTORY       index+middle      → switch tool
 *   THUMBS_UP     thumb only        → accept
 * Two hands: both PINCH_INDEX → zoom (distance ratio) & rotate (angle delta).
 * Motion: fast horizontal OPEN_PALM sweep → SWIPE_LEFT / SWIPE_RIGHT.
 */
import { OneEuro2D } from "./spatial.js";
import { structuralize } from "./omnifit.js";

const TIPS = [4, 8, 12, 16, 20];
const PIPS = [3, 6, 10, 14, 18];

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

/** Hand scale: wrist → middle-finger MCP distance (normalises thresholds). */
export function handScale(lm) {
  return d(lm[0], lm[9]) || 1e-6;
}

/** Which fingers are extended: [thumb, index, middle, ring, pinky]. */
export function extendedFingers(lm) {
  const wrist = lm[0];
  const out = [];
  for (let f = 0; f < 5; f++) {
    const tip = lm[TIPS[f]];
    const pip = lm[PIPS[f]];
    if (f === 0) {
      // thumb: tip farther from index MCP than its IP joint
      out.push(d(tip, lm[5]) > d(pip, lm[5]) * 1.15 && d(tip, lm[17]) > handScale(lm) * 0.9);
    } else out.push(d(tip, wrist) > d(pip, wrist) * 1.12);
  }
  return out;
}

/** Normalised thumb-tip → fingertip distances (index, middle, ring, pinky). */
export function pinchDistances(lm) {
  const s = handScale(lm);
  return [8, 12, 16, 20].map((t) => d(lm[4], lm[t]) / s);
}

/**
 * Classify one hand. O(1).
 * @param {{x:number,y:number,z?:number}[]} lm 21 landmarks (normalised image coords)
 */
export function classify(lm, pinchThreshold = 0.32) {
  if (!lm || lm.length < 21) return { gesture: "NONE", confidence: 0, extended: [], pinch: [] };
  const ext = extendedFingers(lm);
  const pinch = pinchDistances(lm);
  // A closed fist puts the thumb on the curled fingertips — check it before pinches.
  const s = handScale(lm);
  const palm = [0, 5, 9, 13, 17].reduce((a, i) => ({ x: a.x + lm[i].x / 5, y: a.y + lm[i].y / 5, z: a.z + (lm[i].z ?? 0) / 5 }), { x: 0, y: 0, z: 0 });
  const tipSpread = [8, 12, 16, 20].reduce((a, t) => a + d(lm[t], palm), 0) / 4 / s;
  if (!ext[1] && !ext[2] && !ext[3] && !ext[4] && tipSpread < 0.55) {
    return { gesture: ext[0] ? "THUMBS_UP" : "FIST", confidence: 0.85, extended: ext, pinch };
  }
  // A real pinch holds the target fingertip away from the palm; a thumb resting
  // on a curled finger (e.g. while pointing) is not a pinch.
  const reach = [8, 12, 16, 20].map((t) => d(lm[t], palm) / s);
  const eligible = pinch.map((p, i) => (reach[i] > 0.5 ? p : Infinity));
  const minP = Math.min(...eligible);
  const which = eligible.indexOf(minP);
  if (minP < pinchThreshold) {
    const names = ["PINCH_INDEX", "PINCH_MIDDLE", "PINCH_RING", "PINCH_PINKY"];
    return { gesture: names[which], confidence: 1 - minP / pinchThreshold, extended: ext, pinch };
  }
  const [th, ix, mi, ri, pi] = ext;
  const count = ext.filter(Boolean).length;
  let gesture = "NONE";
  if (count >= 4 && ix && mi && ri && pi) gesture = "OPEN_PALM";
  else if (!ix && !mi && !ri && !pi && th) gesture = "THUMBS_UP";
  else if (!ix && !mi && !ri && !pi) gesture = "FIST";
  else if (ix && mi && !ri && !pi) gesture = "VICTORY";
  else if (ix && !mi && !ri && !pi) gesture = "POINT";
  return { gesture, confidence: gesture === "NONE" ? 0 : 0.8, extended: ext, pinch };
}

/** Cursor anchor: index tip (mirrored for selfie view). */
export function cursorOf(lm, mirror = true) {
  const p = lm[8];
  return { x: mirror ? 1 - p.x : p.x, y: p.y };
}

/** Palm centre (mean of wrist + MCPs). */
export function palmCenter(lm, mirror = true) {
  const ids = [0, 5, 9, 13, 17];
  const x = ids.reduce((a, i) => a + lm[i].x, 0) / ids.length;
  const y = ids.reduce((a, i) => a + lm[i].y, 0) / ids.length;
  return { x: mirror ? 1 - x : x, y };
}

/**
 * Temporal gesture tracker: debouncing + hysteresis, One-Euro smoothed
 * cursor, swipe detection, two-hand zoom/rotate. Emits high-level events.
 *
 * Events: "cursor" {x,y,hand} · "gesturestart"/"gestureend" {gesture,hand,x,y}
 *         "drag" {x,y,dx,dy,hand} · "zoom" {scale, delta} · "rotate" {angle}
 *         "swipe" {direction} · "hold" {gesture, ms}
 */
export class GestureTracker {
  constructor({ stableFrames = 3, holdMs = 900, swipeVelocity = 1.6, mirror = true } = {}) {
    Object.assign(this, { stableFrames, holdMs, swipeVelocity, mirror });
    this.handlers = new Map();
    this.hands = new Map(); // id → state
    this.zoom = null;
  }
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(fn);
    return () => this.handlers.get(event)?.delete(fn);
  }
  emit(event, payload) {
    this.handlers.get(event)?.forEach((fn) => fn(payload));
  }
  _state(id) {
    if (!this.hands.has(id)) this.hands.set(id, { filter: new OneEuro2D(1.0, 0.03), candidate: "NONE", frames: 0, active: "NONE", since: 0, held: false, last: null, track: [] });
    return this.hands.get(id);
  }
  /**
   * Feed one frame.
   * @param {Array<{landmarks: {x,y,z}[], handedness?: string}>} hands
   * @param {number} tMs timestamp in ms
   */
  update(hands, tMs) {
    const seen = new Set();
    hands.forEach((h, i) => {
      const id = h.handedness ?? `hand${i}`;
      seen.add(id);
      const st = this._state(id);
      const { gesture } = classify(h.landmarks);
      const raw = gesture === "OPEN_PALM" || gesture === "FIST" ? palmCenter(h.landmarks, this.mirror) : cursorOf(h.landmarks, this.mirror);
      const p = st.filter.filter(raw, tMs);
      this.emit("cursor", { ...p, hand: id, gesture: st.active });
      // debounce
      if (gesture === st.candidate) st.frames++;
      else {
        st.candidate = gesture;
        st.frames = 1;
      }
      if (st.frames >= this.stableFrames && gesture !== st.active) {
        if (st.active !== "NONE") this.emit("gestureend", { gesture: st.active, hand: id, ...p });
        st.active = gesture;
        st.since = tMs;
        st.held = false;
        if (gesture !== "NONE") this.emit("gesturestart", { gesture, hand: id, ...p });
      }
      if (st.active !== "NONE" && !st.held && tMs - st.since > this.holdMs) {
        st.held = true;
        this.emit("hold", { gesture: st.active, hand: id, ms: tMs - st.since, ...p });
      }
      if (st.last && (st.active === "FIST" || st.active === "PINCH_INDEX")) this.emit("drag", { ...p, dx: p.x - st.last.x, dy: p.y - st.last.y, hand: id, gesture: st.active });
      // swipe: open palm moving fast horizontally
      st.track.push({ ...p, t: tMs });
      while (st.track.length && tMs - st.track[0].t > 250) st.track.shift();
      if (st.active === "OPEN_PALM" && st.track.length > 3) {
        const a = st.track[0], b = st.track[st.track.length - 1];
        const vx = (b.x - a.x) / Math.max(1e-3, (b.t - a.t) / 1000);
        if (Math.abs(vx) > this.swipeVelocity && Math.abs(b.y - a.y) < 0.15) {
          this.emit("swipe", { direction: vx > 0 ? "right" : "left", hand: id });
          st.track = [];
        }
      }
      st.last = p;
      st.position = p;
    });
    for (const [id, st] of this.hands) {
      if (!seen.has(id)) {
        if (st.active !== "NONE") this.emit("gestureend", { gesture: st.active, hand: id, ...(st.position ?? { x: 0, y: 0 }) });
        this.hands.delete(id);
      }
    }
    this._twoHand();
  }
  _twoHand() {
    const pinching = [...this.hands.values()].filter((s) => s.active === "PINCH_INDEX" && s.position);
    if (pinching.length === 2) {
      const [a, b] = pinching.map((s) => s.position);
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (!this.zoom) this.zoom = { dist0: dist, angle0: angle, lastScale: 1 };
      const scale = dist / Math.max(1e-6, this.zoom.dist0);
      this.emit("zoom", { scale, delta: scale / this.zoom.lastScale });
      this.emit("rotate", { angle: angle - this.zoom.angle0 });
      this.zoom.lastScale = scale;
    } else this.zoom = null;
  }
  reset() {
    this.hands.clear();
    this.zoom = null;
  }
}

/**
 * Stroke compression with OmniFit: x and y sequences are segmented into AP
 * runs (straight, evenly sampled stretches) + exceptions. Points are first
 * snapped to a pixel grid of pitch `grid` so near-regular motion compresses.
 * O(P) time, O(S + E) storage.
 */
export function compressStroke(points, { grid = 2, relTol = 1e-9 } = {}) {
  const xs = points.map((p) => Math.round(p.x / grid) * grid);
  const ys = points.map((p) => Math.round(p.y / grid) * grid);
  const sx = structuralize(xs, { relTol });
  const sy = structuralize(ys, { relTol });
  const raw = points.length * 2;
  const formulaTerms = sx.stats.descriptorTerms + sy.stats.descriptorTerms;
  // Irregular hand-drawn strokes may not compress: keep whichever is smaller.
  if (formulaTerms >= raw) return { n: points.length, grid, mode: "raw", xs, ys, rawNumbers: raw, storedNumbers: raw, ratio: 1 };
  return { n: points.length, grid, mode: "formula", x: sx, y: sy, rawNumbers: raw, storedNumbers: formulaTerms, ratio: raw / formulaTerms };
}

/** Rebuild the (grid-snapped) points. OUTPUT-BOUND O(P). */
export function decompressStroke(c) {
  if (c.mode === "raw") return c.xs.map((x, i) => ({ x, y: c.ys[i] }));
  const axis = (s) => {
    const out = new Array(c.n);
    for (const seg of s.segments) {
      const k0 = Number(seg.startIndex);
      for (let k = 0; k < Number(seg.count); k++) out[k0 + k] = seg.family === "AP" ? seg.startValue + k * seg.step : seg.startValue * Math.pow(seg.ratio, k);
    }
    for (const e of s.exceptions) out[e.index] = e.value;
    return out;
  };
  const x = axis(c.x), y = axis(c.y);
  return x.map((vx, i) => ({ x: vx, y: y[i] }));
}

export const GESTURE_ACTIONS = {
  PINCH_INDEX: "Select / draw",
  PINCH_MIDDLE: "Erase / context",
  PINCH_RING: "Undo",
  PINCH_PINKY: "Save / confirm",
  POINT: "Cursor",
  OPEN_PALM: "Hover · hold for menu · sweep to switch panel",
  FIST: "Grab & pan",
  VICTORY: "Next tool",
  THUMBS_UP: "Accept",
  TWO_HAND_PINCH: "Zoom & rotate",
};

export const Gesture = { classify, extendedFingers, pinchDistances, handScale, cursorOf, palmCenter, GestureTracker, compressStroke, decompressStroke, GESTURE_ACTIONS };
