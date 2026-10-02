/**
 * Spatial helpers: vectors, One-Euro smoothing, grid snapping.
 */
import { nearestGridCell } from "./geometry.js";

export const vec = {
  dist2: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  dist3: (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0)),
  lerp: (a, b, t) => a + (b - a) * t,
  mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
  clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)),
};

/** One-Euro filter (Casiez et al. 2012): low jitter at rest, low lag in motion. O(1)/sample. */
export class OneEuroFilter {
  constructor(minCutoff = 1.2, beta = 0.02, dCutoff = 1.0) {
    Object.assign(this, { minCutoff, beta, dCutoff, xPrev: null, dxPrev: 0, tPrev: 0 });
  }
  _alpha(cutoff, dt) {
    return 1 / (1 + 1 / (2 * Math.PI * cutoff) / dt);
  }
  filter(x, tMs) {
    if (this.xPrev === null) {
      this.xPrev = x;
      this.tPrev = tMs;
      return x;
    }
    const dt = Math.max(1e-3, (tMs - this.tPrev) / 1000);
    this.tPrev = tMs;
    const aD = this._alpha(this.dCutoff, dt);
    this.dxPrev = aD * ((x - this.xPrev) / dt) + (1 - aD) * this.dxPrev;
    const a = this._alpha(this.minCutoff + this.beta * Math.abs(this.dxPrev), dt);
    this.xPrev = a * x + (1 - a) * this.xPrev;
    return this.xPrev;
  }
  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
  }
}

export class OneEuro2D {
  constructor(minCutoff = 1.2, beta = 0.02) {
    this.fx = new OneEuroFilter(minCutoff, beta);
    this.fy = new OneEuroFilter(minCutoff, beta);
  }
  filter(p, tMs) {
    return { x: this.fx.filter(p.x, tMs), y: this.fy.filter(p.y, tMs) };
  }
  reset() {
    this.fx.reset();
    this.fy.reset();
  }
}

/** Snap a 2-D point to a grid of pitch h. FIXED-DIMENSION O(1). */
export function snap2(p, h, origin = { x: 0, y: 0 }) {
  const r = nearestGridCell([p.x, p.y], [origin.x, origin.y], h);
  return { x: r.snapped[0], y: r.snapped[1] };
}
