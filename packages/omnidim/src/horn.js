/**
 * HORN — controlled stochastic / uncertainty engine.
 *
 * ⚠ HORN IS NOT A CRYPTOGRAPHIC RANDOM NUMBER GENERATOR.
 *   Use crypto.getRandomValues / Web Crypto for tokens, keys and secrets.
 * Never use HORN when OMNIBAL gives an exact deterministic answer.
 *
 *   Fitness:        f_i = exp(−η·D_i·√w)
 *   Weight update:  w_i ← w_i·f_i / Σ_j w_j·f_j
 *   Ejection gate:  include i iff w_i > τ
 *   Gated combine:  u_t = frac( Σ_{i: w_i > τ} v_{i,t} )
 *   Worker split:   S_j = { H(K‖j, t) }_t
 *   Replay:         value = H(seed, workerId, counter)   — O(1), no log
 */

export const HORN_SECURITY_NOTICE = "HORN IS NOT A CRYPTOGRAPHIC RANDOM NUMBER GENERATOR.";
const U32 = 4294967296;

function fmix32(h) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Counter-based hash H(seed, worker, counter) → [0, 1). Random access O(1). */
export function counterHash(seed, worker, counter) {
  const lo = counter >>> 0;
  const hi = Math.floor(counter / U32) >>> 0;
  let h = fmix32((seed >>> 0) ^ 0x9e3779b9);
  h = fmix32(h ^ Math.imul(worker >>> 0, 0x85ebca77) ^ 0x632be5ab);
  h = fmix32(h ^ lo);
  h = fmix32(h ^ Math.imul(hi, 0xc2b2ae3d) ^ 0x27d4eb2f);
  const h2 = fmix32(h ^ 0x165667b1);
  return ((h >>> 5) * 67108864 + (h2 >>> 6)) / 9007199254740992;
}

/** Mulberry32 — Weyl sequence + multiply/xorshift. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return {
    name: "mulberry32",
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / U32;
    },
  };
}

/** SFC32 — chaotic add/rotate/xor with counter. */
export function sfc32(seed) {
  let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = seed >>> 0;
  const step = () => {
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t;
  };
  for (let i = 0; i < 15; i++) step();
  return { name: "sfc32", next: () => step() / U32 };
}

/** xoshiro128** — linear xorshift state + scrambler. */
export function xoshiro128ss(seed) {
  const sm = mulberry32(seed ^ 0xdeadbeef);
  let s0 = (sm.next() * U32) >>> 0 || 1, s1 = (sm.next() * U32) >>> 0, s2 = (sm.next() * U32) >>> 0, s3 = (sm.next() * U32) >>> 0;
  const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;
  return {
    name: "xoshiro128**",
    next() {
      const r = Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
      const t = (s1 << 9) >>> 0;
      s2 ^= s0;
      s3 ^= s1;
      s1 ^= s2;
      s0 ^= s3;
      s2 ^= t;
      s3 = rotl(s3, 11);
      return r / U32;
    },
  };
}

/** Random-access counter stream. */
export function counterStream(seed, worker = 0, start = 0) {
  const s = {
    name: "counter-hash",
    counter: start,
    next() {
      return counterHash(seed, worker, s.counter++);
    },
  };
  return s;
}

/** Four structurally different sources. */
export function defaultStreams(seed) {
  return [mulberry32(seed), sfc32(seed ^ 0x5bd1e995), xoshiro128ss(seed ^ 0x27d4eb2f), counterStream(seed ^ 0x165667b1)];
}

/** Kolmogorov–Smirnov distance to U(0,1). O(w log w). */
export function ksUniform(sample) {
  const s = [...sample].sort((a, b) => a - b);
  const n = s.length;
  let d = 0;
  for (let i = 0; i < n; i++) d = Math.max(d, (i + 1) / n - s[i], s[i] - i / n);
  return d;
}

/** HornFitness: f = exp(−η·D·√w). */
export function hornFitness(D, w, eta = 4) {
  return Math.exp(-eta * D * Math.sqrt(w));
}

/** Fitness-weighted mixer. next(): O(m) = O(1) for fixed m. */
export class HornMixer {
  constructor(streams, { eta = 4, tau = 0.05, window = 256 } = {}) {
    if (!streams.length) throw new RangeError("HornMixer needs at least one stream");
    this.streams = streams;
    this.weights = streams.map(() => 1 / streams.length);
    this.windows = streams.map(() => []);
    Object.assign(this, { eta, tau, w: window, draws: 0 });
  }
  /** u_t = frac(Σ_{w_i > τ} v_{i,t}). */
  next() {
    let sum = 0;
    this.streams.forEach((s, i) => {
      const v = s.next();
      const win = this.windows[i];
      win.push(v);
      if (win.length > this.w) win.shift();
      if (this.weights[i] > this.tau) sum += v;
    });
    if (++this.draws % this.w === 0) this.adapt();
    return sum - Math.floor(sum);
  }
  /** w_i ← w_i·f_i / Σ w_j·f_j  with D_i = KS distance of stream i's window. */
  adapt() {
    const f = this.windows.map((win) => hornFitness(ksUniform(win), win.length, this.eta / Math.sqrt(Math.max(1, win.length))));
    const z = this.weights.reduce((acc, w, i) => acc + w * f[i], 0) || 1;
    this.weights = this.weights.map((w, i) => (w * f[i]) / z);
    return [...this.weights];
  }
  /** Streams passing the ejection gate. */
  active() {
    return this.streams.filter((_, i) => this.weights[i] > this.tau).map((s) => s.name);
  }
}

/** Counter-addressed replay — any sample reconstructed without a log. */
export class HornReplay {
  constructor(seed) {
    this.seed = seed;
  }
  /** FORMULA O(1). */
  at(worker, counter) {
    return counterHash(this.seed, worker, counter);
  }
  /** OUTPUT-BOUND O(count). */
  range(worker, start, count) {
    return Array.from({ length: count }, (_, i) => this.at(worker, start + i));
  }
}

/** S_j = { H(K‖j, t) }: independent per-worker streams. */
export class HornWorkerSplit {
  constructor(key) {
    this.key = key;
  }
  stream(workerId, start = 0) {
    return counterStream(this.key, workerId, start);
  }
  partition(total, workers) {
    const base = Math.floor(total / workers), extra = total % workers;
    const out = [];
    let start = 0;
    for (let w = 0; w < workers; w++) {
      const count = base + (w < extra ? 1 : 0);
      out.push({ worker: w, start, count });
      start += count;
    }
    return out;
  }
}

/** Inverse standard-normal CDF (Acklam, |err| < 1.2e-9). */
export function normalInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5, r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Omniprojection Π_Ω(u) → F⁻¹(u). */
export const project = {
  normal: (u, mean = 0, sd = 1) => mean + sd * normalInv(u),
  exponential: (u, rate = 1) => -Math.log(1 - u) / rate,
  uniform: (u, lo = 0, hi = 1) => lo + (hi - lo) * u,
};

/**
 * Missing-value scenarios between two known points (Brownian-bridge style).
 * Use ONLY where deterministic reconstruction is not justified. OUTPUT-BOUND.
 */
export function bridgeScenarios(before, after, gaps, { scenarios = 5, sigma, seed = 42 } = {}) {
  const sd = sigma ?? Math.abs(after - before) / (gaps + 1) / 2;
  const replay = new HornReplay(seed);
  const out = [];
  for (let s = 0; s < scenarios; s++) {
    const path = [];
    let prev = before;
    for (let g = 1; g <= gaps; g++) {
      const remaining = gaps + 1 - g;
      const z = normalInv(Math.min(1 - 1e-12, Math.max(1e-12, replay.at(s, g))));
      prev = prev + (after - prev) / (remaining + 1) + sd * Math.sqrt(remaining / (remaining + 1)) * z;
      path.push(prev);
    }
    out.push(path);
  }
  return out;
}

export const Horn = { counterHash, mulberry32, sfc32, xoshiro128ss, counterStream, defaultStreams, ksUniform, hornFitness, HornMixer, HornReplay, HornWorkerSplit, normalInv, project, bridgeScenarios, HORN_SECURITY_NOTICE };
