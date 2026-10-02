const Le = [
  "FORMULA O(1)",
  "AVERAGE O(1)",
  "AMORTIZED O(1)",
  "FIXED-DIMENSION O(1)",
  "O(log N)",
  "O(N)",
  "O(N log N)",
  "OUTPUT-BOUND",
  "NOT APPLICABLE"
], pt = /* @__PURE__ */ new Map();
function ce(n) {
  return pt.set(n.api, n), n;
}
function Ge(n) {
  return pt.get(n);
}
function ze() {
  return [...pt.values()].sort((n, t) => n.api.localeCompare(t.api));
}
const M = "FORMULA O(1)", rt = "Huge-integer exponentiation costs O(log k) multiplications and grows in bit cost; 'O(1)' counts formula evaluations, not bit operations.";
[
  // AP
  { api: "AP.valueAt", time: M, space: "O(1)", preprocessing: "none", conditions: "regular AP descriptor (a0, h)", traditional: "O(1) index after O(N) materialisation; O(k) on a stream", limitation: "float precision for huge k·h — use BigInt mode" },
  { api: "AP.sum", time: M, space: "O(1)", preprocessing: "none", conditions: "single AP segment", traditional: "O(N) loop", limitation: "returns the total, not the N values" },
  { api: "AP.rangeSum", time: M, space: "O(1)", preprocessing: "none", conditions: "indices inside one segment", traditional: "O(j−i) loop or O(N) prefix array", limitation: "piecewise data adds an O(log S) segment lookup" },
  { api: "AP.windowSum", time: M, space: "O(1)", preprocessing: "none", conditions: "window inside one segment", traditional: "O(W) buffer", limitation: "-" },
  { api: "AP.contains", time: M, space: "O(1)", preprocessing: "none", conditions: "known start, step, count", traditional: "O(N) scan / O(log N) search", limitation: "floats compared with tolerance" },
  { api: "AP.powerSum", time: "O(p²) in p, independent of X", space: "O(p)", preprocessing: "Bernoulli table cached per p", conditions: "fixed power p, exact BigInt rationals", traditional: "O(X) loop of p-th powers", limitation: rt },
  // GP
  { api: "GP.sum", time: M, space: "O(1)", preprocessing: "none", conditions: "single GP segment (r = 1 handled separately)", traditional: "O(N) loop", limitation: rt },
  { api: "GP.product", time: M, space: "O(1)", preprocessing: "none", conditions: "single GP segment", traditional: "O(N) loop", limitation: "returned in log-space so huge X does not overflow" },
  { api: "GP.levelCount", time: M, space: "O(1)", preprocessing: "none", conditions: "uniform branching factor", traditional: "O(nodes) traversal", limitation: rt },
  // HP
  { api: "HP.sumApprox", time: "O(1) for fixed expansion depth", space: "O(1)", preprocessing: "Bernoulli table", conditions: "fixed precision, N ≥ 1", traditional: "O(N) loop", limitation: "approximation; error reported by HP.errorBound" },
  { api: "HP.sumExact", time: "O(N)", space: "O(1)", preprocessing: "none", conditions: "none", traditional: "O(N)", limitation: "no finite elementary closed form exists" },
  { api: "HP.reciprocalPower", time: "O(1) for fixed precision", space: "O(1)", preprocessing: "none", conditions: "fixed Euler–Maclaurin depth", traditional: "O(L−F) loop", limitation: "approximate; error estimate returned" },
  { api: "HP.progressionSum", time: "O(1) for fixed precision", space: "O(1)", preprocessing: "none", conditions: "a0/h > 0", traditional: "O(N) loop", limitation: "digamma approximation (~1e-13 relative)" },
  // Geometry
  { api: "Geometry.ball.volume", time: "FIXED-DIMENSION O(1)", space: "O(1)", preprocessing: "none", conditions: "d supplied as a parameter", traditional: "Monte Carlo / voxel count O(cells)", limitation: "float range limits very large d" },
  { api: "Grid.coordinateToIndex", time: "FIXED-DIMENSION O(1)", space: "O(d) strides", preprocessing: "O(d) stride map", conditions: "regular row-major grid", traditional: "O(cells) lookup table / hash", limitation: "O(d) per call when d is not fixed" },
  { api: "Grid.indexToCoordinate", time: "FIXED-DIMENSION O(1)", space: "O(d)", preprocessing: "O(d) stride map", conditions: "regular row-major grid", traditional: "O(cells) reverse table", limitation: "O(d) when d grows" },
  { api: "Grid.nearestGridCell", time: "FIXED-DIMENSION O(1)", space: "O(1)", preprocessing: "none", conditions: "uniform stride lattice", traditional: "O(log N) kd-tree or O(N) scan", limitation: "NOT general nearest-neighbour search" },
  // OmniFit
  { api: "OmniFit.structuralize", time: "O(N)", space: "O(S + E)", preprocessing: "single scan", conditions: "none", traditional: "store N values", limitation: "noise above tolerance becomes exceptions / new segments" },
  { api: "OmniFit.regularize", time: "O(N log N)", space: "O(N) output rows", preprocessing: "median interval estimate", conditions: "a dominant interval exists", traditional: "n/a", limitation: "originals kept; residuals reported, never silently overwritten" },
  { api: "OmniFitStream.push", time: "AMORTIZED O(1)", space: "O(1) active state", preprocessing: "none", conditions: "fixed active state", traditional: "re-scan O(N)", limitation: "the closed-segment list still grows O(S)" },
  // Data structures
  { api: "OmniSequence.valueAt", time: "O(log S) + AVERAGE O(1)", space: "O(S + E)", preprocessing: "O(N) discovery", conditions: "segments sorted by start index", traditional: "O(1) after O(N) materialisation", limitation: "O(1) only when S is fixed" },
  { api: "OmniArray.valueAt", time: M, space: "O(1 + E)", preprocessing: "none", conditions: "single segment + sparse exceptions", traditional: "O(N) storage", limitation: "exceptions use a hash map (average O(1))" },
  { api: "OmniPrefix.range", time: M, space: "O(1)", preprocessing: "none", conditions: "AP/GP family", traditional: "O(N) prefix array", limitation: "HP prefix is approximate" },
  { api: "OmniWindow.sum", time: M, space: "O(1)", preprocessing: "none", conditions: "window inside one formula segment", traditional: "O(W) buffer", limitation: "exceptions inside the window add O(E_w)" },
  { api: "OmniSchedule.nearest", time: M, space: "O(1)", preprocessing: "none", conditions: "fixed interval", traditional: "O(log N) binary search over stored events", limitation: "listing K events is OUTPUT-BOUND O(K)" },
  { api: "OmniRange.contains", time: M, space: "O(1)", preprocessing: "none", conditions: "integer start/step", traditional: "O(N) scan", limitation: "-" },
  { api: "OmniFormulaIndex.get", time: "AVERAGE O(1)", space: "O(keys)", preprocessing: "none", conditions: "good hashing", traditional: "same (hash map)", limitation: "a hash index, not a formula" },
  // HORN
  { api: "HornReplay.at", time: M, space: "O(1)", preprocessing: "none", conditions: "counter-based generator", traditional: "O(N) stored random log", limitation: "NOT cryptographic" },
  { api: "HornMixer.next", time: "O(m) = O(1) for fixed m", space: "O(m·w)", preprocessing: "none", conditions: "fixed stream count m", traditional: "single PRNG O(1)", limitation: "NOT cryptographic" },
  // Gesture
  { api: "Gesture.classify", time: "O(1) per frame (21 landmarks)", space: "O(1)", preprocessing: "none", conditions: "fixed landmark count", traditional: "same", limitation: "heuristic; lighting/occlusion affect results" },
  { api: "Stroke.compress", time: "O(P)", space: "O(S + E)", preprocessing: "none", conditions: "points sampled along straight-ish runs", traditional: "store P points", limitation: "curvy strokes produce many short segments" },
  // Cache
  { api: "OmniCache.get (L0)", time: "AVERAGE O(1)", space: "O(entries)", preprocessing: "none", conditions: "Map hit", traditional: "same", limitation: "-" },
  { api: "OmniCache.get (L1 formula)", time: "FORMULA O(1) per element", space: "O(S + E) per entry", preprocessing: "O(N) compression on write", conditions: "data is formula-compressible", traditional: "O(N) stored values", limitation: "returning the full array is OUTPUT-BOUND O(N)" },
  { api: "OmniCache.get (L2 IndexedDB)", time: "I/O bound", space: "disk", preprocessing: "none", conditions: "IndexedDB available", traditional: "-", limitation: "latency is measured, never assumed" }
].forEach(ce);
const Ve = [
  { problem: "Read N arbitrary input values", bound: "Ω(N)", reason: "every value must be inspected" },
  { problem: "Output N explicit values", bound: "Ω(N)", reason: "the output itself has N items" },
  { problem: "Discover arbitrary hidden structure", bound: "Ω(N) in general", reason: "an unseen value can change the classification" },
  { problem: "Comparison sort", bound: "Ω(N log N)", reason: "comparison-model lower bound" },
  { problem: "Arbitrary range query", bound: "O(log N + K)", reason: "ordering plus output size" },
  { problem: "Arbitrary nearest neighbour", bound: "not universally O(1)", reason: "depends on dimension, index and data" },
  { problem: "Full graph traversal", bound: "O(V + E)", reason: "must visit reachable structure" },
  { problem: "Arbitrary matrix multiplication", bound: "not O(1)", reason: "work grows with matrix size" },
  { problem: "Materialise M missing values", bound: "Ω(M)", reason: "must create M outputs" },
  { problem: "Return K database rows", bound: "Ω(K)", reason: "must emit K rows" },
  { problem: "Generate N random samples", bound: "Ω(N)", reason: "replay is O(1) per sample, not for all N" }
], Pt = 0.5772156649015329;
function le(n, t) {
  for (n = n < 0n ? -n : n, t = t < 0n ? -t : t; t; ) [n, t] = [t, n % t];
  return n;
}
class f {
  /** @param {bigint|number} n @param {bigint|number} [d] */
  constructor(t, e = 1n) {
    let i = BigInt(t), s = BigInt(e);
    if (s === 0n) throw new RangeError("Rational: zero denominator");
    s < 0n && (i = -i, s = -s);
    const r = le(i, s);
    this.n = r > 1n ? i / r : i, this.d = r > 1n ? s / r : s;
  }
  static from(t) {
    if (t instanceof f) return t;
    if (typeof t == "number" && !Number.isInteger(t)) throw new TypeError(`Rational.from: ${t} is not an integer`);
    return new f(BigInt(t));
  }
  add(t) {
    const e = f.from(t);
    return new f(this.n * e.d + e.n * this.d, this.d * e.d);
  }
  sub(t) {
    const e = f.from(t);
    return new f(this.n * e.d - e.n * this.d, this.d * e.d);
  }
  mul(t) {
    const e = f.from(t);
    return new f(this.n * e.n, this.d * e.d);
  }
  div(t) {
    const e = f.from(t);
    return new f(this.n * e.d, this.d * e.n);
  }
  neg() {
    return new f(-this.n, this.d);
  }
  /** Integer power. O(log e) multiplications. */
  pow(t) {
    if (!Number.isInteger(t)) throw new TypeError("Rational.pow: integer exponent required");
    if (t < 0) return new f(this.d, this.n).pow(-t);
    const e = BigInt(t);
    return new f(this.n ** e, this.d ** e);
  }
  isZero() {
    return this.n === 0n;
  }
  isInteger() {
    return this.d === 1n;
  }
  equals(t) {
    const e = f.from(t);
    return this.n === e.n && this.d === e.d;
  }
  /** Lossy conversion for display; exact value remains in n/d. */
  toNumber() {
    const t = this.n.toString().length, e = this.d.toString().length;
    if (t < 300 && e < 300) return Number(this.n) / Number(this.d);
    const i = 10n ** BigInt(Math.max(t, e) - 300);
    return Number(this.n / i) / Number(this.d / i || 1n);
  }
  toBigInt() {
    if (this.d !== 1n) throw new RangeError(`Rational ${this} is not an integer`);
    return this.n;
  }
  toString() {
    return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`;
  }
  toJSON() {
    return this.toString();
  }
}
f.ZERO = new f(0n);
f.ONE = new f(1n);
const U = [1n];
function Dt(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("factorial: n must be a non-negative integer");
  for (let t = U.length; t <= n; t++) U[t] = U[t - 1] * BigInt(t);
  return U[n];
}
function K(n, t) {
  const e = BigInt(n);
  let i = BigInt(t);
  if (i < 0n || i > e) return 0n;
  i > e - i && (i = e - i);
  let s = 1n;
  for (let r = 1n; r <= i; r++) s = s * (e - i + r) / r;
  return s;
}
function ot(n, t) {
  if (t < 0 || t > n) return 0;
  t = Math.min(t, n - t);
  let e = 1;
  for (let i = 1; i <= t; i++) e = e * (n - t + i) / i;
  return e < 9e15 ? Math.round(e) : e;
}
const $ = [];
function Ht(n) {
  if (n < $.length) return $[n];
  const t = [];
  for (let e = 0; e <= n; e++) {
    t[e] = new f(1n, BigInt(e + 1));
    for (let i = e; i >= 1; i--) t[i - 1] = t[i - 1].sub(t[i]).mul(i);
    $[e] = t[0];
  }
  return $[n];
}
function ue(n, t) {
  const e = BigInt(n);
  if (e < 1n) return f.ZERO;
  if (t === 0) return new f(e);
  const i = e - 1n;
  let s = f.ZERO;
  for (let r = 0; r <= t; r++) s = s.add(Ht(r).mul(K(t + 1, r)).mul(i ** BigInt(t + 1 - r)));
  return s.div(t + 1);
}
const q = [
  0.9999999999998099,
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.13857109526572012,
  9984369578019572e-21,
  15056327351493116e-23
];
function ft(n) {
  if (n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * ft(1 - n));
  if (Number.isInteger(n) && n <= 171) return Number(Dt(n - 1));
  n -= 1;
  let t = q[0];
  const e = n + 7.5;
  for (let i = 1; i < 9; i++) t += q[i] / (n + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(e, n + 0.5) * Math.exp(-e) * t;
}
function Ft(n) {
  if (n < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * n))) - Ft(1 - n);
  n -= 1;
  let t = q[0];
  const e = n + 7.5;
  for (let i = 1; i < 9; i++) t += q[i] / (n + i);
  return 0.5 * Math.log(2 * Math.PI) + (n + 0.5) * Math.log(e) - e + Math.log(t);
}
function kt(n) {
  if (n <= 0 && Number.isInteger(n)) return NaN;
  let t = 0;
  for (; n < 10; )
    t -= 1 / n, n += 1;
  const e = 1 / (n * n);
  return t + Math.log(n) - 0.5 / n - e * (1 / 12 - e * (1 / 120 - e * (1 / 252 - e * (1 / 240 - e * (1 / 132)))));
}
class L {
  constructor() {
    this.sum = 0, this.c = 0;
  }
  add(t) {
    const e = this.sum + t;
    return Math.abs(this.sum) >= Math.abs(t) ? this.c += this.sum - e + t : this.c += t - e + this.sum, this.sum = e, this;
  }
  get value() {
    return this.sum + this.c;
  }
}
function at(n, t, e = 1e6) {
  const i = BigInt(t);
  if (i < 0n) throw new RangeError("bigPow: negative exponent");
  const s = n < 0n ? -n : n;
  if (s > 1n && Number(i) * s.toString(2).length > e) throw new RangeError(`bigPow: result would exceed ${e} bits`);
  return n ** i;
}
function ht(n) {
  if (!n.length) return NaN;
  const t = [...n].sort((i, s) => i - s), e = t.length >> 1;
  return t.length % 2 ? t[e] : (t[e - 1] + t[e]) / 2;
}
function Ke(n, t = 1, e) {
  const i = n.map((o) => Math.max(1e-300, o)), s = e ?? i.map(() => 1), r = s.reduce((o, a) => o + a, 0) || 1;
  return Math.abs(t) < 1e-12 ? Math.exp(i.reduce((o, a, c) => o + s[c] * Math.log(a), 0) / r) : t === 1 / 0 ? Math.max(...i) : t === -1 / 0 ? Math.min(...i) : Math.pow(i.reduce((o, a, c) => o + s[c] * Math.pow(a, t), 0) / r, 1 / t);
}
const G = /* @__PURE__ */ new Map();
function he(n, t) {
  const e = BigInt(t);
  if (e < 1n) throw new RangeError("momentBlock: X must be ≥ 1");
  if (n === 0) return f.ONE;
  if (n % 2 === 1) return f.ZERO;
  const i = `${n}:${e}`, s = G.get(i);
  if (s) return s;
  const r = new f(e - 1n, 2n);
  let o = f.ZERO;
  for (let c = 0; c <= n; c++) o = o.add(r.neg().pow(n - c).mul(K(n, c)).mul(ue(e, c)));
  const a = o.div(e);
  return G.size > 4096 && G.clear(), G.set(i, a), a;
}
const qe = {
  0: "1",
  2: "(X² − 1)/12",
  4: "(3X⁴ − 10X² + 7)/240",
  6: "(3X⁶ − 21X⁴ + 49X² − 31)/1344",
  8: "(5X⁸ − 60X⁶ + 294X⁴ − 620X² + 381)/11520",
  10: "(3X¹⁰ − 55X⁸ + 462X⁶ − 2046X⁴ + 4191X² − 2555)/33792"
}, de = "⁰¹²³⁴⁵⁶⁷⁸⁹", me = "₀₁₂₃₄₅₆₇₈₉", Bt = (n) => String(n).replace(/\d/g, (t) => de[+t]), pe = (n) => String(n).replace(/\d/g, (t) => me[+t]), y = {
  /** O(1) descriptor regardless of N. */
  describe(n, t, e) {
    return { family: "AP", a0: n, h: t, count: e };
  },
  /** k-th term (0-based). FORMULA O(1). */
  valueAt(n, t, e) {
    return n + e * t;
  },
  first(n) {
    return n;
  },
  /** Last of N terms. O(1). */
  last(n, t, e) {
    return n + (e - 1) * t;
  },
  /** M = (first + last)/2. O(1). */
  midpoint(n, t, e) {
    return (n + y.last(n, t, e)) / 2;
  },
  /** Number of terms from first to last inclusive. O(1). */
  count(n, t, e) {
    if (e === 0) throw new RangeError("AP.count: h must be non-zero");
    return Math.floor((t - n) / e + 1e-9) + 1;
  },
  /** S = N·(first + last)/2. FORMULA O(1). */
  sum(n, t, e) {
    if (!Number.isInteger(e) || e < 0) throw new RangeError("AP.sum: N must be a non-negative integer");
    return e * y.midpoint(n, t, e);
  },
  /** Exact BigInt sum for integer a0, h. */
  sumBig(n, t, e) {
    const i = BigInt(n), s = BigInt(t), r = BigInt(e);
    return r * (2n * i + (r - 1n) * s) / 2n;
  },
  /** Prefix(k) = sum of the first k terms. O(1). */
  prefix(n, t, e) {
    return e <= 0 ? 0 : e * n + t * e * (e - 1) / 2;
  },
  /** Sum of terms i..j inclusive = Prefix(j+1) − Prefix(i). FORMULA O(1). */
  rangeSum(n, t, e, i) {
    return i < e ? 0 : y.prefix(n, t, i + 1) - y.prefix(n, t, e);
  },
  /** Sum of the w terms ending at index k. O(1). */
  windowSum(n, t, e, i) {
    return y.prefix(n, t, e + 1) - y.prefix(n, t, Math.max(0, e + 1 - i));
  },
  /** (x − a0) mod h == 0 and 0 ≤ k < N. O(1). */
  contains(n, t, e, i = 1 / 0, s = 1e-9) {
    if (t === 0) return e === n;
    const r = (e - n) / t, o = Math.round(r);
    return Math.abs(r - o) <= s * Math.max(1, Math.abs(r)) && o >= 0 && o < i;
  },
  indexOf(n, t, e, i = 1 / 0) {
    return y.contains(n, t, e, i) ? Math.round((e - n) / t) : -1;
  },
  /** Smallest term > x (h > 0). O(1). */
  next(n, t, e) {
    return n + Math.max(0, Math.floor((e - n) / t) + 1) * t;
  },
  /** Largest term < x (h > 0), NaN if none. O(1). */
  previous(n, t, e) {
    const i = Math.ceil((e - n) / t) - 1;
    return i < 0 ? NaN : n + i * t;
  },
  /** Nearest term: k = round((x − a0)/h). O(1). */
  nearest(n, t, e, i = 1 / 0) {
    return n + Math.min(Math.max(0, Math.round((e - n) / t)), i - 1) * t;
  },
  /** Mean of the AP = midpoint. O(1). */
  mean(n, t, e) {
    return y.midpoint(n, t, e);
  },
  /** Population variance h²·(N² − 1)/12 = h²·μ₂(N). O(1). */
  variance(n, t) {
    return n * n * (t * t - 1) / 12;
  },
  /** X = n^d. */
  dimensionalCount(n, t) {
    return BigInt(n) ** BigInt(t);
  },
  /**
   * OMNIBAL power sum Σ_{j=0}^{X−1} (F + j·s)^p, exact BigInt.
   * Cost depends on p only, not X.
   */
  powerSum(n, t, e, i) {
    return y.powerSumRational(n, t, e, i).toBigInt();
  },
  /** Exact Rational version (allows half-integer midpoints mid-computation). */
  powerSumRational(n, t, e, i) {
    if (!Number.isInteger(i) || i < 0) throw new RangeError("powerSum: p must be a non-negative integer");
    const s = BigInt(t);
    if (s < 1n) return f.ZERO;
    const r = BigInt(n), o = BigInt(e), a = r + (s - 1n) * o, c = new f(r + a, 2n);
    let u = f.ZERO;
    for (let l = 0; 2 * l <= i; l++)
      u = u.add(c.pow(i - 2 * l).mul(K(i, 2 * l)).mul(o ** BigInt(2 * l)).mul(he(2 * l, s)));
    return u.mul(s);
  },
  /** Brute force Σ (F + j·s)^p for verification — O(X). */
  powerSumBrute(n, t, e, i) {
    let s = 0n;
    const r = BigInt(n), o = BigInt(e), a = BigInt(i);
    for (let c = 0; c < t; c++) s += (r + BigInt(c) * o) ** a;
    return s;
  },
  /** Expanded OMNIBAL bracket, e.g. p=4 → "X·[M⁴ + 6·M²·μ₂·s² + μ₄·s⁴]". */
  formula(n) {
    const t = [];
    for (let e = 0; 2 * e <= n; e++) {
      const i = K(n, 2 * e), s = n - 2 * e, r = s === 0 ? "" : s === 1 ? "M" : `M${Bt(s)}`, o = e === 0 ? "" : `μ${pe(2 * e)}·s${Bt(2 * e)}`, a = [r, o].filter(Boolean).join("·") || "1";
      t.push(i === 1n ? a : `${i}·${a}`);
    }
    return `X·[${t.join(" + ")}]`;
  }
}, A = {
  describe(n, t, e) {
    return { family: "GP", a: n, r: t, count: e };
  },
  /** k-th term a·r^k. O(1) formula call. */
  valueAt(n, t, e) {
    return n * Math.pow(t, e);
  },
  /** Sum of N terms. O(1) formula calls. */
  sum(n, t, e) {
    return e <= 0 ? 0 : t === 1 ? n * e : t > 0 && Math.abs(t - 1) < 1e-3 ? n * Math.expm1(e * Math.log1p(t - 1)) / (t - 1) : n * (Math.pow(t, e) - 1) / (t - 1);
  },
  /** Exact sum for integer a, r. */
  sumBig(n, t, e) {
    const i = BigInt(n), s = BigInt(t), r = BigInt(e);
    return r <= 0n ? 0n : s === 1n ? i * r : i * (at(s, r) - 1n) / (s - 1n);
  },
  /** Sum of terms i..j = a·r^i·(r^(j−i+1) − 1)/(r − 1). O(1). */
  range(n, t, e, i) {
    return i < e ? 0 : A.sum(A.valueAt(n, t, e), t, i - e + 1);
  },
  /** Prefix(k) = sum of first k terms. O(1). */
  prefix(n, t, e) {
    return A.sum(n, t, e);
  },
  /** Product of X terms in log-space: {sign, log, value}. O(1). */
  product(n, t, e) {
    if (e <= 0) return { sign: 1, log: 0, value: 1 };
    if (n === 0 || t === 0) return { sign: 0, log: -1 / 0, value: 0 };
    const i = e * (e - 1) / 2, s = e * Math.log(Math.abs(n)) + i * Math.log(Math.abs(t)), r = (n < 0 && e % 2 === 1) != (t < 0 && i % 2 === 1) ? -1 : 1;
    return { sign: r, log: s, value: s < 709 ? r * Math.exp(s) : r * (1 / 0) };
  },
  /** Exact product for integer a, r. */
  productBig(n, t, e) {
    const i = BigInt(e);
    return i <= 0n ? 1n : at(BigInt(n), i) * at(BigInt(t), i * (i - 1n) / 2n);
  },
  /** Omnidimensional sum with X = n^d terms. */
  sumDimensional(n, t, e, i) {
    return A.sum(n, t, Math.pow(e, i));
  },
  /** Nodes in a uniform b-ary tree with L levels below the root. O(1). */
  levelCount(n, t) {
    return A.sum(1, n, t + 1);
  },
  /** Levels needed for a b-ary hierarchy to hold `capacity` leaves. O(1). */
  levelsFor(n, t) {
    return t <= 1 ? 0 : Math.ceil(Math.log(t) / Math.log(n) - 1e-12);
  },
  /** Exponential resource model: initial·(1+g)^t. O(1). */
  growth(n, t, e) {
    return n * Math.pow(1 + t, e);
  },
  /** Whole periods until `initial` reaches `target` at rate g. O(1). */
  periodsToReach(n, t, e) {
    return Math.ceil(Math.log(e / n) / Math.log(1 + t) - 1e-12);
  },
  /** a/(1 − r) for |r| < 1. */
  sumInfinite(n, t) {
    return Math.abs(t) >= 1 ? NaN : n / (1 - t);
  }
}, _ = (n) => Ht(n).toNumber(), Ut = {
  /** k-th term (1-based) of 1/(a0 + (k−1)h); default 1/k. O(1). */
  valueAt(n, t = 1, e = 1) {
    return 1 / (t + (n - 1) * e);
  },
  /** Exact finite iteration with compensated summation. O(N). */
  sumExact(n) {
    const t = new L();
    for (let e = n; e >= 1; e--) t.add(1 / e);
    return t.value;
  },
  /** H(N) as an exact Rational (small N). O(N) BigInt ops. */
  sumRational(n) {
    let t = f.ZERO;
    for (let e = 1; e <= n; e++) t = t.add(new f(1n, BigInt(e)));
    return t;
  },
  /**
   * Euler–Maclaurin with `terms` Bernoulli corrections. O(terms).
   * @returns {{value:number, errorBound:number, method:string}}
   */
  sumApprox(n, t = 4) {
    if (n < 1) return { value: 0, errorBound: 0, method: "euler-maclaurin" };
    let e = Math.log(n) + Pt + 1 / (2 * n);
    for (let s = 1; s <= t; s++) e -= _(2 * s) / (2 * s * Math.pow(n, 2 * s));
    const i = Math.abs(_(2 * t + 2) / ((2 * t + 2) * Math.pow(n, 2 * t + 2)));
    return { value: e, errorBound: i, method: "euler-maclaurin" };
  },
  /** H(n^d) using ln(n^d) = d·ln n, so X is never formed explicitly. */
  sumDimensional(n, t, e = 4) {
    const i = t * Math.log(n), s = Math.exp(i);
    let r = i + Pt, o = 0;
    if (Number.isFinite(s)) {
      r += 1 / (2 * s);
      for (let a = 1; a <= e; a++) r -= _(2 * a) / (2 * a * Math.pow(s, 2 * a));
      o = Math.abs(_(2 * e + 2) / ((2 * e + 2) * Math.pow(s, 2 * e + 2)));
    }
    return { value: r, errorBound: o, method: "euler-maclaurin" };
  },
  /** Error estimate of sumApprox(N, terms). */
  errorBound(n, t = 4) {
    return Ut.sumApprox(n, t).errorBound;
  },
  /**
   * Σ_{k=F}^{L} k^(−s) for real s > 0, integers 1 ≤ F ≤ L.
   * Direct head sum, then Euler–Maclaurin on the tail. O(head + terms).
   */
  reciprocalPower(n, t, e, i = 6, s = 10) {
    if (e < t) return { value: 0, errorBound: 0, method: "exact-iteration" };
    if (e - t < 64) {
      const l = new L();
      for (let h = e; h >= t; h--) l.add(Math.pow(h, -n));
      return { value: l.value, errorBound: 0, method: "exact-iteration" };
    }
    const r = new L(), o = t + s;
    for (let l = t; l < o; l++) r.add(Math.pow(l, -n));
    const a = (l) => Math.pow(l, -n);
    r.add(n === 1 ? Math.log(e / o) : (Math.pow(e, 1 - n) - Math.pow(o, 1 - n)) / (1 - n)), r.add((a(o) + a(e)) / 2);
    const c = (l, h) => {
      let p = 1;
      for (let d = 0; d < h; d++) p *= n + d;
      return (h % 2 === 0 ? 1 : -1) * p * Math.pow(l, -n - h);
    }, u = (l) => _(2 * l) / Number(Dt(2 * l)) * (c(e, 2 * l - 1) - c(o, 2 * l - 1));
    for (let l = 1; l <= i; l++) r.add(u(l));
    return { value: r.value, errorBound: Math.abs(u(i + 1)), method: "euler-maclaurin" };
  },
  /** Σ_{k=0}^{N−1} 1/(a0 + k·h) via digamma. O(1) fixed precision. */
  progressionSum(n, t, e) {
    const i = n / t, s = (kt(i + e) - kt(i)) / t;
    return { value: s, errorBound: Math.abs(s) * 1e-13, method: "digamma" };
  },
  /** Harmonic mean n / Σ 1/x_i. O(n). */
  harmonicMean(n) {
    const t = new L();
    for (const e of n) t.add(1 / e);
    return n.length / t.value;
  }
}, z = (n) => ft(n + 1), S = {
  ball: {
    /** V = π^(d/2)/Γ(d/2+1)·R^d. FIXED-DIMENSION O(1). */
    volume(n, t = 1) {
      return Math.exp(n / 2 * Math.log(Math.PI) - Ft(n / 2 + 1)) * Math.pow(t, n);
    },
    /** S = d·V/R. */
    surface(n, t = 1) {
      return n * S.ball.volume(n, t) / t;
    },
    fill(n) {
      return Math.pow(Math.PI, n / 2) / ft(n / 2 + 1);
    },
    /** Integer dimension with the largest unit-ball volume (5). */
    peakDimension(n = 40) {
      let t = 0, e = -1 / 0;
      for (let i = 0; i <= n; i++) {
        const s = S.ball.volume(i, 1);
        s > e && ([t, e] = [i, s]);
      }
      return t;
    }
  },
  cube: {
    volume: (n, t = 1) => Math.pow(t, n),
    /** S = 2d·a^(d−1). */
    surface: (n, t = 1) => 2 * n * Math.pow(t, n - 1),
    diagonal: (n, t = 1) => t * Math.sqrt(n),
    /** k-faces: C(d,k)·2^(d−k). */
    faces: (n, t) => ot(n, t) * Math.pow(2, n - t),
    fill: () => 1
  },
  simplex: {
    /** Regular simplex, side a: a^d/d!·√((d+1)/2^d). */
    volume: (n, t = 1) => Math.pow(t, n) / z(n) * Math.sqrt((n + 1) / Math.pow(2, n)),
    /** k-faces: C(d+1, k+1). */
    faces: (n, t) => ot(n + 1, t + 1),
    fill: (n) => Math.sqrt((n + 1) / Math.pow(2, n)) / z(n)
  },
  crossPolytope: {
    /** Orthoplex, radius R: 2^d/d!·R^d. */
    volume: (n, t = 1) => Math.pow(2, n) / z(n) * Math.pow(t, n),
    /** k-faces: 2^(k+1)·C(d, k+1). */
    faces: (n, t) => Math.pow(2, t + 1) * ot(n, t + 1),
    fill: (n) => Math.pow(2, n) / z(n)
  },
  unified: {
    /** V(d) = k(d)·s^d for "ball" | "cube" | "simplex" | "crossPolytope". */
    volume(n, t, e) {
      return (n === "ball" ? S.ball.fill(t) : n === "cube" ? 1 : n === "simplex" ? S.simplex.fill(t) : S.crossPolytope.fill(t)) * Math.pow(e, t);
    },
    /** S = d·V/r with r = inradius. */
    surface(n, t, e) {
      return n * t / e;
    }
  },
  /** Volumes for d = 1..maxD. */
  table(n = 10, t = 1) {
    const e = [];
    for (let i = 1; i <= n; i++)
      e.push({
        d: i,
        ball: S.ball.volume(i, t),
        cube: S.cube.volume(i, t),
        simplex: S.simplex.volume(i, t),
        crossPolytope: S.crossPolytope.volume(i, t),
        cubeVertices: S.cube.faces(i, 0),
        cubeEdges: S.cube.faces(i, 1)
      });
    return e;
  }
};
function gt(n) {
  const t = new Array(n.length);
  let e = 1;
  for (let i = n.length - 1; i >= 0; i--)
    t[i] = e, e *= n[i];
  return t;
}
function yt(n, t) {
  return typeof n == "number" ? Math.pow(n, t ?? 1) : n.reduce((e, i) => e * i, 1);
}
function $t(n, t, e = gt(t)) {
  let i = 0;
  for (let s = 0; s < t.length; s++) {
    const r = n[s];
    if (r < 0 || r >= t[s]) throw new RangeError(`coordinate[${s}]=${r} outside 0..${t[s] - 1}`);
    i += r * e[s];
  }
  return i;
}
function Lt(n, t) {
  const e = yt(t);
  if (n < 0 || n >= e) throw new RangeError(`index ${n} outside 0..${e - 1}`);
  const i = new Array(t.length);
  for (let s = t.length - 1; s >= 0; s--)
    i[s] = n % t[s], n = Math.floor(n / t[s]);
  return i;
}
function wt(n, t, e, i) {
  const s = [], r = [], o = [];
  for (let a = 0; a < n.length; a++) {
    const c = typeof e == "number" ? e : e[a];
    let u = Math.round((n[a] - t[a]) / c);
    i && (u = Math.min(Math.max(u, 0), i[a] - 1));
    const l = t[a] + u * c;
    s.push(u), r.push(l), o.push(n[a] - l);
  }
  return { cell: s, snapped: r, residual: o };
}
const Xe = { strideMap: gt, dimensionalCount: yt, coordinateToIndex: $t, indexToCoordinate: Lt, nearestGridCell: wt };
class Z {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  set(t, e, i, s) {
    const r = BigInt(t);
    this.map.set(r, { index: r, value: e, expected: i, reason: s });
  }
  get(t) {
    return this.map.get(BigInt(t));
  }
  has(t) {
    return this.map.has(BigInt(t));
  }
  delete(t) {
    return this.map.delete(BigInt(t));
  }
  get size() {
    return this.map.size;
  }
  /** Exceptions with lo ≤ index ≤ hi, sorted. O(E). */
  inRange(t, e) {
    const i = BigInt(t), s = BigInt(e), r = [];
    for (const o of this.map.values()) o.index >= i && o.index <= s && r.push(o);
    return r.sort((o, a) => o.index < a.index ? -1 : o.index > a.index ? 1 : 0);
  }
  values() {
    return [...this.map.values()].sort((t, e) => t.index < e.index ? -1 : 1);
  }
  toJSON() {
    return this.values().map((t) => ({ ...t, index: t.index.toString() }));
  }
}
let ct = 0;
function fe(n = "seg") {
  return ct = (ct + 1) % 1e9, `${n}-${Date.now().toString(36)}-${ct.toString(36)}`;
}
function bt(n, t, e, i, s) {
  const r = BigInt(t), o = BigInt(e);
  return { id: fe(n.toLowerCase()), family: n, startIndex: o, endIndex: o + r - 1n, count: r, confidence: i, exceptions: new Z(), ...s };
}
const Y = (n, t, e, i = 0n, s = 1) => bt("AP", e, i, s, { startValue: n, step: t }), xt = (n, t, e, i = 0n, s = 1) => bt("GP", e, i, s, { startValue: n, ratio: t }), je = (n, t, e, i = 0n, s = 1) => bt("HP", e, i, s, { startValue: n, step: t });
function Mt(n, t) {
  const e = Number(BigInt(t) - n.startIndex);
  switch (n.family) {
    case "AP":
      return y.valueAt(n.startValue ?? 0, n.step ?? 0, e);
    case "GP":
      return A.valueAt(n.startValue ?? 1, n.ratio ?? 1, e);
    case "HP":
      return 1 / ((n.startValue ?? 1) + e * (n.step ?? 1));
    default:
      throw new Error(`segmentFormulaAt: family ${n.family} has no scalar formula`);
  }
}
function Q(n, t) {
  const e = BigInt(t);
  if (e < n.startIndex || e > n.endIndex) throw new RangeError(`index ${e} outside segment ${n.id}`);
  const i = n.exceptions?.get(e);
  return i ? i.value : Mt(n, e);
}
function dt(n, t, e) {
  const i = BigInt(t), s = BigInt(e), r = Number(i - n.startIndex), o = Number(s - n.startIndex);
  let a;
  if (n.family === "AP") a = y.rangeSum(n.startValue ?? 0, n.step ?? 0, r, o);
  else if (n.family === "GP") a = A.range(n.startValue ?? 1, n.ratio ?? 1, r, o);
  else {
    a = 0;
    for (let c = r; c <= o; c++) a += 1 / ((n.startValue ?? 1) + c * (n.step ?? 1));
  }
  if (n.exceptions?.size) for (const c of n.exceptions.inRange(i, s)) a += c.value - Mt(n, c.index);
  return a;
}
function vt(n) {
  return { ...n, startIndex: n.startIndex.toString(), endIndex: n.endIndex.toString(), count: n.count.toString(), exceptions: n.exceptions ? n.exceptions.toJSON() : [] };
}
function Gt(n) {
  const t = new Z();
  for (const e of n.exceptions ?? []) t.set(BigInt(e.index), e.value, e.expected, e.reason);
  return { ...n, startIndex: BigInt(n.startIndex), endIndex: BigInt(n.endIndex), count: BigInt(n.count), exceptions: t };
}
function k(n) {
  const t = JSON.stringify(n, (e, i) => typeof i == "bigint" ? i.toString() : i) ?? "";
  return new TextEncoder().encode(t).length;
}
class X {
  constructor(t) {
    this.segment = t;
  }
  static ap(t, e, i) {
    return new X(Y(t, e, i));
  }
  static gp(t, e, i) {
    return new X(xt(t, e, i));
  }
  get length() {
    return this.segment.count;
  }
  /** FORMULA O(1) — no earlier element is built. */
  valueAt(t) {
    return Q(this.segment, this.segment.startIndex + BigInt(t));
  }
  /** Override one element sparsely. AVERAGE O(1). */
  set(t, e, i = "override") {
    var r;
    const s = this.segment.startIndex + BigInt(t);
    (r = this.segment).exceptions ?? (r.exceptions = new Z()), this.segment.exceptions.set(s, e, Mt(this.segment, s), i);
  }
  /** Total. FORMULA O(1) + O(E). */
  sum() {
    return dt(this.segment, this.segment.startIndex, this.segment.endIndex);
  }
  /** Sum of i..j. FORMULA O(1) + O(E in range). */
  rangeSum(t, e) {
    const i = this.segment.startIndex;
    return dt(this.segment, i + BigInt(t), i + BigInt(e));
  }
  /** OUTPUT-BOUND O(limit). */
  toArray(t = 1e3) {
    const e = Number(this.length < BigInt(t) ? this.length : BigInt(t));
    return Array.from({ length: e }, (i, s) => this.valueAt(s));
  }
  descriptorBytes() {
    return k(vt(this.segment));
  }
  /** Size of the equivalent Float64Array. */
  materializedBytes() {
    return this.length * 8n;
  }
}
class zt {
  constructor(t, e, i = 1n) {
    if (this.start = BigInt(t), this.stop = BigInt(e), this.step = BigInt(i), this.step === 0n) throw new RangeError("OmniRange: step must be non-zero");
  }
  static of(t, e, i = 1) {
    return new zt(t, e, i);
  }
  get length() {
    const { start: t, stop: e, step: i } = this;
    return i > 0n ? e > t ? (e - t + i - 1n) / i : 0n : t > e ? (t - e - i - 1n) / -i : 0n;
  }
  at(t) {
    const e = BigInt(t);
    if (e < 0n || e >= this.length) throw new RangeError("OmniRange.at: out of range");
    return this.start + e * this.step;
  }
  /** (x − start) mod step == 0 and in bounds. FORMULA O(1). */
  contains(t) {
    const e = BigInt(t) - this.start;
    if (e % this.step !== 0n) return !1;
    const i = e / this.step;
    return i >= 0n && i < this.length;
  }
  indexOf(t) {
    return this.contains(t) ? (BigInt(t) - this.start) / this.step : -1n;
  }
  /** Exact total. FORMULA O(1). */
  sum() {
    return y.sumBig(this.start, this.step, this.length);
  }
  /** Elements within [lo, hi]. O(1). (positive step) */
  countBetween(t, e) {
    const i = BigInt(t), s = BigInt(e), r = this.length;
    if (r === 0n || s < i) return 0n;
    const o = (l, h) => l >= 0n ? (l + h - 1n) / h : -(-l / h), a = (l, h) => l >= 0n ? l / h : -((-l + h - 1n) / h);
    let c = o(i - this.start, this.step), u = a(s - this.start, this.step);
    return c < 0n && (c = 0n), u > r - 1n && (u = r - 1n), u >= c ? u - c + 1n : 0n;
  }
}
class We {
  constructor(t) {
    this.segments = [...t].sort((e, i) => e.startIndex < i.startIndex ? -1 : 1);
  }
  get length() {
    const t = this.segments[this.segments.length - 1];
    return t ? t.endIndex + 1n : 0n;
  }
  /** Binary search: O(log S). */
  segmentFor(t) {
    const e = BigInt(t);
    let i = 0, s = this.segments.length - 1;
    for (; i <= s; ) {
      const r = i + s >> 1, o = this.segments[r];
      if (e < o.startIndex) s = r - 1;
      else if (e > o.endIndex) i = r + 1;
      else return o;
    }
  }
  /** O(log S) + FORMULA O(1). */
  valueAt(t) {
    const e = this.segmentFor(t);
    if (!e) throw new RangeError(`OmniSequence: no segment covers ${t}`);
    return Q(e, t);
  }
  /** O(segments touched). */
  rangeSum(t, e) {
    const i = BigInt(t), s = BigInt(e);
    let r = 0;
    for (const o of this.segments)
      o.endIndex < i || o.startIndex > s || (r += dt(o, i > o.startIndex ? i : o.startIndex, s < o.endIndex ? s : o.endIndex));
    return r;
  }
  get exceptionCount() {
    return this.segments.reduce((t, e) => t + (e.exceptions?.size ?? 0), 0);
  }
  descriptorBytes() {
    return k(this.segments.map(vt));
  }
}
class Je {
  /** @param {"AP"|"GP"|"HP"} family */
  constructor(t, e, i) {
    Object.assign(this, { family: t, a: e, stepOrRatio: i });
  }
  /** Prefix(k) = sum of first k terms. FORMULA O(1) (HP: fixed-precision). */
  at(t) {
    return this.family === "AP" ? y.prefix(this.a, this.stepOrRatio, t) : this.family === "GP" ? A.prefix(this.a, this.stepOrRatio, t) : t <= 0 ? 0 : Ut.progressionSum(this.a, this.stepOrRatio, t).value;
  }
  /** RangeSum(i, j) = F(j+1) − F(i). */
  range(t, e) {
    return e < t ? 0 : this.at(e + 1) - this.at(t);
  }
}
class Ze {
  constructor(t, e) {
    this.prefix = t, this.width = e;
  }
  /** WindowSum(k) = Prefix(k+1) − Prefix(k+1−w). FORMULA O(1). */
  sum(t) {
    return this.prefix.at(t + 1) - this.prefix.at(Math.max(0, t + 1 - this.width));
  }
  average(t) {
    return this.sum(t) / Math.min(this.width, t + 1);
  }
}
class ge {
  constructor(t, e, i = 1 / 0) {
    if (e <= 0) throw new RangeError("OmniSchedule: interval must be > 0");
    Object.assign(this, { start: t, interval: e, count: i });
  }
  at(t) {
    if (t < 0 || t >= this.count) throw new RangeError("OmniSchedule.at: out of range");
    return this.start + t * this.interval;
  }
  /** k = round((t − start)/interval), clamped. */
  nearestIndex(t) {
    return Math.min(Math.max(0, Math.round((t - this.start) / this.interval)), this.count - 1);
  }
  nearest(t) {
    return this.at(this.nearestIndex(t));
  }
  next(t) {
    const e = Math.max(0, Math.floor((t - this.start) / this.interval) + 1);
    return e < this.count ? this.start + e * this.interval : NaN;
  }
  previous(t) {
    const e = Math.min(Math.ceil((t - this.start) / this.interval) - 1, this.count - 1);
    return e >= 0 ? this.start + e * this.interval : NaN;
  }
  /** Events in [t1, t2]. O(1). */
  countBetween(t, e) {
    if (e < t) return 0;
    const i = Math.max(0, Math.ceil((t - this.start) / this.interval - 1e-12)), s = Math.min(this.count - 1, Math.floor((e - this.start) / this.interval + 1e-12));
    return s >= i ? s - i + 1 : 0;
  }
  /** OUTPUT-BOUND O(K). */
  list(t, e) {
    const i = [];
    for (let s = t; s < Math.min(this.count, t + e); s++) i.push(this.at(s));
    return i;
  }
}
class Ye {
  constructor(t, e = t.map(() => 0), i = t.map(() => 1)) {
    Object.assign(this, { shape: t, origin: e, spacing: i, strides: gt(t) });
  }
  get size() {
    return yt(this.shape);
  }
  toIndex(t) {
    return $t(t, this.shape, this.strides);
  }
  toCoord(t) {
    return Lt(t, this.shape);
  }
  position(t) {
    return t.map((e, i) => this.origin[i] + e * this.spacing[i]);
  }
  nearest(t) {
    return wt(t, this.origin, this.spacing, this.shape);
  }
}
class Qe {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  set(t, e) {
    this.map.set(t, e);
  }
  get(t) {
    return this.map.get(t);
  }
  valueAt(t, e) {
    return this.map.get(t)?.valueAt(e);
  }
  keys() {
    return [...this.map.keys()];
  }
  get size() {
    return this.map.size;
  }
}
function j(n) {
  const t = [];
  for (let e = 1; e < n.length; e++) t.push(n[e] - n[e - 1]);
  return t;
}
function Vt(n) {
  const t = [];
  for (let e = 1; e < n.length; e++) t.push(n[e - 1] === 0 ? NaN : n[e] / n[e - 1]);
  return t;
}
function Kt(n, t = 0.25) {
  const e = j(n), i = e.filter((c) => c > 0);
  if (!i.length) return { interval: NaN, confidence: 0, differences: e };
  const s = ht(i);
  let r = 0, o = 0, a = 0;
  for (const c of i) {
    const u = Math.max(1, Math.round(c / s));
    Math.abs(c / u - s) <= t * s && (r += c, o += u, a++);
  }
  return { interval: o ? r / o : s, confidence: a / i.length, differences: e };
}
function qt(n, t = 0.05) {
  if (!Number.isFinite(n) || n <= 0) return n;
  const e = Math.pow(10, Math.floor(Math.log10(n)));
  for (const i of [1, 2, 2.5, 5, 10]) {
    const s = e * i / 10, r = Math.round(n / s) * s;
    if (Math.abs(r - n) <= t * n) return Number(r.toPrecision(12));
  }
  return n;
}
function ye(n, t = {}) {
  if (!n.length) throw new RangeError("regularize: empty input");
  const e = Kt(n);
  let i = t.interval ?? e.interval;
  t.nice !== !1 && t.interval === void 0 && (i = qt(i));
  const s = t.t0 ?? n[0], r = t.exceptionTol ?? 0.3, o = /* @__PURE__ */ new Set();
  let a = 0;
  const c = n.map((d, g) => {
    const w = Math.round((d - s) / i), x = s + w * i, v = d - x, b = Math.abs(v) / i, O = b > r || o.has(w);
    return o.add(w), a += Math.abs(v), { index: g, k: w, originalValue: d, regularizedValue: x, residual: v, confidence: Math.max(0, 1 - 2 * b), isException: O };
  }), u = c.filter((d) => d.isException), l = Math.max(...c.map((d) => d.k)), h = [];
  if (l < 1e6) for (let d = 0; d <= l; d++) o.has(d) || h.push(d);
  const p = Y(s, i, BigInt(l + 1), 0n, e.confidence);
  p.residualTolerance = r * i, p.exceptions = new Z();
  for (const d of u) p.exceptions.set(d.k, d.originalValue, d.regularizedValue, "residual");
  return p.metadata = { source: "OmniFit.regularize", observations: n.length, missing: h.length }, {
    t0: s,
    interval: i,
    rows: c,
    exceptions: u,
    segment: p,
    missingK: h,
    meanAbsResidual: a / n.length,
    confidence: e.confidence * (1 - u.length / n.length)
  };
}
function lt(n) {
  const t = n.filter(Number.isFinite);
  if (!t.length) return { center: NaN, rel: 1 / 0 };
  const e = ht(t), i = ht(t.map((s) => Math.abs(s - e)));
  return { center: e, rel: i / Math.max(Math.abs(e), 1e-12) + (t.length < n.length ? 1 : 0) };
}
function Xt(n) {
  if (n.length < 3) return [{ family: "NOISE", dispersion: 1 / 0, parameter: NaN, score: 0 }];
  const t = lt(j(n)), e = n.some((r) => r === 0) ? { center: NaN, rel: 1 / 0 } : lt(Vt(n)), i = n.every((r) => r !== 0) ? lt(j(n.map((r) => 1 / r))) : { center: NaN, rel: 1 / 0 }, s = (r) => Number.isFinite(r) ? 1 / (1 + 50 * r) : 0;
  return [
    { family: "AP", dispersion: t.rel, parameter: t.center, score: s(t.rel) },
    { family: "GP", dispersion: e.rel, parameter: e.center, score: s(e.rel) * (Math.abs(e.center - 1) < 1e-9 ? 0.5 : 1) },
    { family: "HP", dispersion: i.rel, parameter: i.center, score: s(i.rel) * 0.98 }
  ].sort((r, o) => o.score - r.score);
}
function we(n, t = 0.5) {
  const e = Xt(n)[0];
  return e.score >= t ? e : { ...e, family: "NOISE" };
}
function W(n, t = {}) {
  const e = t.relTol ?? 1e-9, i = Math.max(3, t.minRun ?? 3), s = n.length, r = [], o = [], a = (l, h) => Math.abs(l - h) <= e * Math.max(1, Math.abs(l), Math.abs(h));
  let c = 0;
  for (; c < s; ) {
    if (c + 2 >= s) {
      for (; c < s; c++) o.push({ index: c, value: n[c] });
      break;
    }
    const l = n[c], h = n[c + 1] - l;
    let p = c + 1;
    for (; p + 1 < s && a(n[p + 1] - n[p], h); ) p++;
    const d = p - c + 1;
    let g = 0, w = NaN;
    if (l !== 0) {
      w = n[c + 1] / l;
      let x = c + 1;
      for (; x + 1 < s && n[x] !== 0 && a(n[x + 1] / n[x], w); ) x++;
      g = x - c + 1;
    }
    d >= i && d >= g ? (r.push(Y(l, h, d, c)), c += d) : g >= i ? (r.push(xt(l, w, g, c)), c += g) : (o.push({ index: c, value: l }), c += 1);
  }
  const u = r.length * 4 + o.length * 2;
  return {
    segments: r,
    exceptions: o,
    stats: { n: s, segments: r.length, exceptions: o.length, descriptorTerms: u, compressionRatio: u ? s / u : 1 / 0 }
  };
}
class be {
  constructor(t = 1e-9) {
    this.relTol = t, this.segments = [], this.exceptions = [], this.index = 0, this.count = 0, this.family = null, this.param = NaN;
  }
  _close(t, e) {
    return Math.abs(t - e) <= this.relTol * Math.max(1, Math.abs(t), Math.abs(e));
  }
  _fits(t, e, i) {
    return e === "AP" ? this._close(t - this.last, i) : this.last !== 0 && this._close(t / this.last, i);
  }
  _begin(t, e) {
    this.start = t, this.first = this.prev = this.last = e, this.count = 1, this.family = null, this.param = NaN;
  }
  _emit() {
    const t = this.family === "AP" ? Y(this.first, this.param, this.count, this.start) : xt(this.first, this.param, this.count, this.start);
    return this.segments.push(t), t;
  }
  /** Feed one value; returns a segment when one closes. */
  push(t) {
    const e = this.index++;
    if (this.count === 0)
      return this._begin(e, t), null;
    if (this.count === 1)
      return this.prev = this.last, this.last = t, this.count = 2, null;
    if (this.family === null) {
      const i = this.last - this.prev, s = this.prev !== 0 ? this.last / this.prev : NaN;
      if (this._fits(t, "AP", i)) [this.family, this.param] = ["AP", i];
      else if (Number.isFinite(s) && this._fits(t, "GP", s)) [this.family, this.param] = ["GP", s];
      else
        return this.exceptions.push({ index: this.start, value: this.first }), this.start += 1, this.first = this.prev = this.last, this.last = t, null;
    } else if (!this._fits(t, this.family, this.param)) {
      const i = this._emit();
      return this._begin(e, t), i;
    }
    return this.prev = this.last, this.last = t, this.count++, null;
  }
  /** Close the active run at end of stream. */
  end() {
    let t = null;
    return this.family && this.count >= 3 ? t = this._emit() : this.count >= 1 && (this.exceptions.push({ index: this.start, value: this.first }), this.count === 2 && this.exceptions.push({ index: this.start + 1, value: this.last })), this.count = 0, this.family = null, t;
  }
}
const tn = { differences: j, ratios: Vt, estimateInterval: Kt, niceInterval: qt, regularize: ye, scoreFamilies: Xt, classify: we, structuralize: W, OmniFitStream: be }, xe = "HORN IS NOT A CRYPTOGRAPHIC RANDOM NUMBER GENERATOR.", E = 4294967296;
function R(n) {
  return n ^= n >>> 16, n = Math.imul(n, 2246822507), n ^= n >>> 13, n = Math.imul(n, 3266489909), n ^= n >>> 16, n >>> 0;
}
function Ot(n, t, e) {
  const i = e >>> 0, s = Math.floor(e / E) >>> 0;
  let r = R(n >>> 0 ^ 2654435769);
  r = R(r ^ Math.imul(t >>> 0, 2246822519) ^ 1663821227), r = R(r ^ i), r = R(r ^ Math.imul(s, 3266489917) ^ 668265263);
  const o = R(r ^ 374761393);
  return ((r >>> 5) * 67108864 + (o >>> 6)) / 9007199254740992;
}
function tt(n) {
  let t = n >>> 0;
  return {
    name: "mulberry32",
    next() {
      t = t + 1831565813 >>> 0;
      let e = t;
      return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / E;
    }
  };
}
function jt(n) {
  let t = 2654435769, e = 608135816, i = 3084996962, s = n >>> 0;
  const r = () => {
    const o = (t + e >>> 0) + s >>> 0;
    return s = s + 1 >>> 0, t = e ^ e >>> 9, e = i + (i << 3) >>> 0, i = (i << 21 | i >>> 11) >>> 0, i = i + o >>> 0, o;
  };
  for (let o = 0; o < 15; o++) r();
  return { name: "sfc32", next: () => r() / E };
}
function Wt(n) {
  const t = tt(n ^ 3735928559);
  let e = t.next() * E >>> 0 || 1, i = t.next() * E >>> 0, s = t.next() * E >>> 0, r = t.next() * E >>> 0;
  const o = (a, c) => (a << c | a >>> 32 - c) >>> 0;
  return {
    name: "xoshiro128**",
    next() {
      const a = Math.imul(o(Math.imul(i, 5) >>> 0, 7), 9) >>> 0, c = i << 9 >>> 0;
      return s ^= e, r ^= i, i ^= s, e ^= r, s ^= c, r = o(r, 11), a / E;
    }
  };
}
function It(n, t = 0, e = 0) {
  const i = {
    name: "counter-hash",
    counter: e,
    next() {
      return Ot(n, t, i.counter++);
    }
  };
  return i;
}
function Me(n) {
  return [tt(n), jt(n ^ 1540483477), Wt(n ^ 668265263), It(n ^ 374761393)];
}
function Jt(n) {
  const t = [...n].sort((s, r) => s - r), e = t.length;
  let i = 0;
  for (let s = 0; s < e; s++) i = Math.max(i, (s + 1) / e - t[s], t[s] - s / e);
  return i;
}
function Zt(n, t, e = 4) {
  return Math.exp(-e * n * Math.sqrt(t));
}
class ve {
  constructor(t, { eta: e = 4, tau: i = 0.05, window: s = 256 } = {}) {
    if (!t.length) throw new RangeError("HornMixer needs at least one stream");
    this.streams = t, this.weights = t.map(() => 1 / t.length), this.windows = t.map(() => []), Object.assign(this, { eta: e, tau: i, w: s, draws: 0 });
  }
  /** u_t = frac(Σ_{w_i > τ} v_{i,t}). */
  next() {
    let t = 0;
    return this.streams.forEach((e, i) => {
      const s = e.next(), r = this.windows[i];
      r.push(s), r.length > this.w && r.shift(), this.weights[i] > this.tau && (t += s);
    }), ++this.draws % this.w === 0 && this.adapt(), t - Math.floor(t);
  }
  /** w_i ← w_i·f_i / Σ w_j·f_j  with D_i = KS distance of stream i's window. */
  adapt() {
    const t = this.windows.map((i) => Zt(Jt(i), i.length, this.eta / Math.sqrt(Math.max(1, i.length)))), e = this.weights.reduce((i, s, r) => i + s * t[r], 0) || 1;
    return this.weights = this.weights.map((i, s) => i * t[s] / e), [...this.weights];
  }
  /** Streams passing the ejection gate. */
  active() {
    return this.streams.filter((t, e) => this.weights[e] > this.tau).map((t) => t.name);
  }
}
class St {
  constructor(t) {
    this.seed = t;
  }
  /** FORMULA O(1). */
  at(t, e) {
    return Ot(this.seed, t, e);
  }
  /** OUTPUT-BOUND O(count). */
  range(t, e, i) {
    return Array.from({ length: i }, (s, r) => this.at(t, e + r));
  }
}
class Oe {
  constructor(t) {
    this.key = t;
  }
  stream(t, e = 0) {
    return It(this.key, t, e);
  }
  partition(t, e) {
    const i = Math.floor(t / e), s = t % e, r = [];
    let o = 0;
    for (let a = 0; a < e; a++) {
      const c = i + (a < s ? 1 : 0);
      r.push({ worker: a, start: o, count: c }), o += c;
    }
    return r;
  }
}
function Nt(n) {
  if (n <= 0) return -1 / 0;
  if (n >= 1) return 1 / 0;
  const t = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], e = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], i = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], s = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416], r = (c) => (((((i[0] * c + i[1]) * c + i[2]) * c + i[3]) * c + i[4]) * c + i[5]) / ((((s[0] * c + s[1]) * c + s[2]) * c + s[3]) * c + 1);
  if (n < 0.02425) return r(Math.sqrt(-2 * Math.log(n)));
  if (n > 1 - 0.02425) return -r(Math.sqrt(-2 * Math.log(1 - n)));
  const o = n - 0.5, a = o * o;
  return (((((t[0] * a + t[1]) * a + t[2]) * a + t[3]) * a + t[4]) * a + t[5]) * o / (((((e[0] * a + e[1]) * a + e[2]) * a + e[3]) * a + e[4]) * a + 1);
}
const Ie = {
  normal: (n, t = 0, e = 1) => t + e * Nt(n),
  exponential: (n, t = 1) => -Math.log(1 - n) / t,
  uniform: (n, t = 0, e = 1) => t + (e - t) * n
};
function Se(n, t, e, { scenarios: i = 5, sigma: s, seed: r = 42 } = {}) {
  const o = s ?? Math.abs(t - n) / (e + 1) / 2, a = new St(r), c = [];
  for (let u = 0; u < i; u++) {
    const l = [];
    let h = n;
    for (let p = 1; p <= e; p++) {
      const d = e + 1 - p, g = Nt(Math.min(1 - 1e-12, Math.max(1e-12, a.at(u, p))));
      h = h + (t - h) / (d + 1) + o * Math.sqrt(d / (d + 1)) * g, l.push(h);
    }
    c.push(l);
  }
  return c;
}
const en = { counterHash: Ot, mulberry32: tt, sfc32: jt, xoshiro128ss: Wt, counterStream: It, defaultStreams: Me, ksUniform: Jt, hornFitness: Zt, HornMixer: ve, HornReplay: St, HornWorkerSplit: Oe, normalInv: Nt, project: Ie, bridgeScenarios: Se, HORN_SECURITY_NOTICE: xe };
class Ne {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  async get(t) {
    return this.map.get(t);
  }
  async set(t, e) {
    this.map.set(t, e);
  }
  async delete(t) {
    this.map.delete(t);
  }
  async keys() {
    return [...this.map.keys()];
  }
  async clear() {
    this.map.clear();
  }
}
const C = (n) => new Promise((t, e) => {
  n.onsuccess = () => t(n.result), n.onerror = () => e(n.error);
});
class mt {
  constructor(t = "omnidim", e = "kv") {
    this.dbName = t, this.storeName = e, this.dbp = null;
  }
  static available() {
    try {
      return typeof indexedDB < "u" && indexedDB !== null;
    } catch {
      return !1;
    }
  }
  /**
   * Open the database; if this store does not exist yet (several stores can
   * share one database), reopen with version + 1 to create it.
   */
  _db() {
    const t = (e) => new Promise((i, s) => {
      const r = e ? indexedDB.open(this.dbName, e) : indexedDB.open(this.dbName);
      r.onupgradeneeded = () => {
        r.result.objectStoreNames.contains(this.storeName) || r.result.createObjectStore(this.storeName);
      }, r.onsuccess = () => {
        const o = r.result;
        o.onversionchange = () => {
          o.close(), this.dbp = null;
        }, i(o);
      }, r.onerror = () => s(r.error), r.onblocked = () => s(new Error(`IndexedDB upgrade of "${this.dbName}" blocked by another tab`));
    });
    return this.dbp ?? (this.dbp = t().then((e) => {
      if (e.objectStoreNames.contains(this.storeName)) return e;
      const i = e.version + 1;
      return e.close(), t(i);
    }).catch((e) => {
      throw this.dbp = null, e;
    })), this.dbp;
  }
  async _tx(t) {
    return (await this._db()).transaction(this.storeName, t).objectStore(this.storeName);
  }
  async get(t) {
    return C((await this._tx("readonly")).get(t));
  }
  async set(t, e) {
    await C((await this._tx("readwrite")).put(e, t));
  }
  async delete(t) {
    await C((await this._tx("readwrite")).delete(t));
  }
  async keys() {
    return (await C((await this._tx("readonly")).getAllKeys())).map(String);
  }
  async clear() {
    await C((await this._tx("readwrite")).clear());
  }
}
function At(n = "omnidim", t = "kv") {
  return mt.available() ? new mt(n, t) : new Ne();
}
async function nn(n) {
  mt.available() && await new Promise((t) => {
    const e = indexedDB.deleteDatabase(n);
    e.onsuccess = e.onerror = e.onblocked = () => t();
  });
}
class sn {
  constructor(t = At("omnidim-secure", "kv")) {
    this.store = t, this.key = null;
  }
  async _key() {
    return this.key ? this.key : (this.key = await this.store.get("__aes_key__"), this.key || (this.key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, !1, ["encrypt", "decrypt"]), await this.store.set("__aes_key__", this.key)), this.key);
  }
  async set(t, e) {
    const i = crypto.getRandomValues(new Uint8Array(12)), s = new TextEncoder().encode(JSON.stringify(e)), r = await crypto.subtle.encrypt({ name: "AES-GCM", iv: i }, await this._key(), s);
    await this.store.set(t, { iv: i, ct: r });
  }
  async get(t) {
    const e = await this.store.get(t);
    if (!e) return;
    const i = await crypto.subtle.decrypt({ name: "AES-GCM", iv: e.iv }, await this._key(), e.ct);
    return JSON.parse(new TextDecoder().decode(i));
  }
  async delete(t) {
    await this.store.delete(t);
  }
}
async function _t(n) {
  const t = typeof n == "string" ? n : JSON.stringify(n, (r, o) => typeof o == "bigint" ? o.toString() : o) ?? "", e = new TextEncoder().encode(t), i = globalThis.crypto?.subtle;
  if (i) {
    const r = await i.digest("SHA-256", e);
    return [...new Uint8Array(r)].map((o) => o.toString(16).padStart(2, "0")).join("");
  }
  let s = 2166136261;
  for (const r of e) s = Math.imul(s ^ r, 16777619) >>> 0;
  return `fnv1a-${s.toString(16)}`;
}
function Ae(n, t = 1e-9) {
  const e = W(n, { relTol: t }), i = { segments: e.segments.map(vt), exceptions: e.exceptions, length: n.length }, s = k(n), r = k(i);
  return { formula: i, rawBytes: s, formulaBytes: r, worthIt: r < s, ratio: s / r };
}
function Ee(n) {
  const t = new Array(n.length);
  for (const e of n.segments.map(Gt)) for (let i = e.startIndex; i <= e.endIndex; i++) t[Number(i)] = Q(e, i);
  for (const e of n.exceptions) t[e.index] = e.value;
  return t;
}
function rn(n, t) {
  const e = n.exceptions.find((s) => s.index === t);
  if (e) return e.value;
  const i = BigInt(t);
  for (const s of n.segments) if (i >= BigInt(s.startIndex) && i <= BigInt(s.endIndex)) return Q(Gt(s), i);
  throw new RangeError(`formulaValueAt: ${t} not covered`);
}
class on {
  constructor({ store: t, cacheName: e = "omnidim-cache-v1", version: i = "1", memoryLimit: s = 500 } = {}) {
    this.l0 = /* @__PURE__ */ new Map(), this.store = t ?? At("omnidim-cache", "entries"), Object.assign(this, { cacheName: e, version: i, memoryLimit: s }), this.dependents = /* @__PURE__ */ new Map(), this.stats = { hits: { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 }, misses: 0 };
  }
  _remember(t) {
    for (this.l0.delete(t.key), this.l0.set(t.key, t); this.l0.size > this.memoryLimit; ) this.l0.delete(this.l0.keys().next().value);
    for (const e of t.deps)
      this.dependents.has(e) || this.dependents.set(e, /* @__PURE__ */ new Set()), this.dependents.get(e).add(t.key);
  }
  _value(t) {
    return t.formula ? Ee(t.formula) : t.value;
  }
  /** Store a value; number arrays are formula-compressed when it saves bytes. */
  async set(t, e, { deps: i = [], persist: s = !0 } = {}) {
    const r = { key: t, version: this.version, hash: await _t(e), createdAt: Date.now(), deps: i };
    if (Array.isArray(e) && e.length > 8 && e.every((o) => typeof o == "number")) {
      const o = Ae(e);
      o.worthIt ? r.formula = o.formula : r.value = e;
    } else r.value = e;
    return this._remember(r), s && await this.store.set(t, r), r;
  }
  /** Fastest valid tier wins; otherwise run `loader` (L4). Returns {value, tier, ms}. */
  async get(t, e) {
    const i = performance.now(), s = this.l0.get(t);
    if (s && s.version === this.version) {
      const a = s.formula ? "L1" : "L0";
      return this.stats.hits[a]++, { value: this._value(s), tier: a, ms: performance.now() - i };
    }
    const r = await this.store.get(t);
    if (r && r.version === this.version)
      return this._remember(r), this.stats.hits.L2++, { value: this._value(r), tier: "L2", ms: performance.now() - i };
    if (this.stats.misses++, !e) return;
    const o = await e();
    return await this.set(t, o), this.stats.hits.L4++, { value: o, tier: "L4", ms: performance.now() - i };
  }
  /** L3 Cache Storage, then L4 network. */
  async fetch(t, e) {
    const i = performance.now();
    if (typeof caches < "u") {
      const r = await caches.open(this.cacheName), o = await r.match(t);
      if (o)
        return this.stats.hits.L3++, { response: o, tier: "L3", ms: performance.now() - i };
      const a = await fetch(t, e);
      return a.ok && await r.put(t, a.clone()), this.stats.hits.L4++, { response: a, tier: "L4", ms: performance.now() - i };
    }
    const s = await fetch(t, e);
    return this.stats.hits.L4++, { response: s, tier: "L4", ms: performance.now() - i };
  }
  /** Invalidate a key and everything that depends on it (transitively). */
  async invalidate(t) {
    const e = [], i = [t], s = /* @__PURE__ */ new Set();
    for (; i.length; ) {
      const r = i.pop();
      if (!s.has(r)) {
        s.add(r), this.l0.delete(r), await this.store.delete(r), e.push(r);
        for (const o of this.dependents.get(r) ?? []) i.push(o);
        this.dependents.delete(r);
      }
    }
    return e;
  }
  /** True when `value` hashes differently from what is stored. */
  async isStale(t, e) {
    const i = this.l0.get(t) ?? await this.store.get(t);
    return !i || i.hash !== await _t(e);
  }
  async clear() {
    this.l0.clear(), this.dependents.clear(), await this.store.clear(), typeof caches < "u" && await caches.delete(this.cacheName);
  }
  get memorySize() {
    return this.l0.size;
  }
}
const Rt = /(biometric|face|template|landmark|persona|ar_identity|password|secret)/i;
function an(n, t, e = 3600) {
  if (Rt.test(n) || Rt.test(t)) throw new Error("setSessionCookie: sensitive data must never be stored in cookies");
  const i = encodeURIComponent(t);
  if (i.length > 256) throw new RangeError("setSessionCookie: keep cookies ≤ 256 bytes; use IndexedDB for state");
  const s = typeof location < "u" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(n)}=${i}; Max-Age=${e}; Path=/; SameSite=Strict${s}`;
}
function cn(n) {
  if (typeof document > "u") return;
  const t = encodeURIComponent(n) + "=";
  for (const e of document.cookie.split("; ")) if (e.startsWith(t)) return decodeURIComponent(e.slice(t.length));
}
function ln(n) {
  document.cookie = `${encodeURIComponent(n)}=; Max-Age=0; Path=/; SameSite=Strict`;
}
const un = ["neutral", "masculine", "feminine", "androgynous", "custom"], D = (n) => btoa(String.fromCharCode(...new Uint8Array(n instanceof Uint8Array ? n : new Uint8Array(n)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), Et = (n) => Uint8Array.from(atob(n.replace(/-/g, "+").replace(/_/g, "/")), (t) => t.charCodeAt(0));
function Ct(n = 16) {
  return D(crypto.getRandomValues(new Uint8Array(n)));
}
async function Pe(n) {
  const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(n));
  return [...new Uint8Array(t)].map((e) => e.toString(16).padStart(2, "0")).join("");
}
const hn = {
  async supported() {
    try {
      return typeof PublicKeyCredential < "u" && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return !1;
    }
  },
  /** Create a platform passkey; returns its id reference. */
  async register(n, t = "OMNIDIM JS") {
    const e = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: t },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: n, displayName: n },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
        timeout: 6e4
      }
    });
    if (!e) throw new Error("Passkey registration cancelled");
    return D(e.rawId);
  },
  /** OS-level user verification with the stored passkey. */
  async verify(n) {
    try {
      return !!await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ type: "public-key", id: Et(n) }],
          userVerification: "required",
          timeout: 6e4
        }
      });
    } catch {
      return !1;
    }
  }
}, ke = {
  async hash(n, t) {
    const e = t ? Et(t) : crypto.getRandomValues(new Uint8Array(16)), i = await crypto.subtle.importKey("raw", new TextEncoder().encode(n), "PBKDF2", !1, ["deriveBits"]), s = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: e, iterations: 21e4, hash: "SHA-256" }, i, 256);
    return { salt: D(e), hash: D(s) };
  },
  async verify(n, t) {
    const { hash: e } = await ke.hash(n, t.salt);
    if (e.length !== t.hash.length) return !1;
    let i = 0;
    for (let s = 0; s < e.length; s++) i |= e.charCodeAt(s) ^ t.hash.charCodeAt(s);
    return i === 0;
  }
};
class dn {
  constructor(t = At("omnidim-identity", "keys")) {
    this.store = t, this.keyPair = null;
  }
  async init() {
    const t = await this.store.get("device-key");
    return t?.privateKey ? this.keyPair = t : (this.keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, !1, ["sign", "verify"]), await this.store.set("device-key", this.keyPair)), crypto.subtle.exportKey("jwk", this.keyPair.publicKey);
  }
  /** Sign {personaId, deviceId, timestamp, actionType, authorizationLevel} + payload hash. */
  async sign(t, e) {
    this.keyPair || await this.init();
    const i = await Pe(JSON.stringify(e ?? null)), s = JSON.stringify({ ...t, payloadHash: i }), r = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, this.keyPair.privateKey, new TextEncoder().encode(s));
    return { ...t, payloadHash: i, signature: D(r) };
  }
  async verify(t) {
    this.keyPair || await this.init();
    const { signature: e, ...i } = t;
    return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, this.keyPair.publicKey, Et(e), new TextEncoder().encode(JSON.stringify(i)));
  }
  async reset() {
    this.keyPair = null, await this.store.delete("device-key");
  }
}
function mn(n) {
  switch (n) {
    case "masculine":
      return { accent: "#3b82f6", hair: "short", label: "Masculine" };
    case "feminine":
      return { accent: "#ec4899", hair: "long", label: "Feminine" };
    case "androgynous":
      return { accent: "#a855f7", hair: "medium", label: "Androgynous" };
    case "custom":
      return { accent: "#f59e0b", hair: "medium", label: "Custom" };
    default:
      return { accent: "#14b8a6", hair: "none", label: "Neutral" };
  }
}
function pn(n = "neutral") {
  return { personaId: Ct(12), deviceId: Ct(12), presentation: n, createdAt: Date.now() };
}
const Be = {
  0: "Read-only reasoning",
  1: "Prepare recommendation",
  2: "Create draft",
  3: "Queue reversible action",
  4: "Require user confirmation",
  5: "Prohibited without explicit fresh authentication"
};
function _e(n, t, e = !1) {
  return t.emergencyStop || !t.agentActionsEnabled && n > 0 ? "deny" : n === 5 ? Date.now() - t.lastAuthAt < (t.freshAuthWindowMs ?? 6e4) && t.mode === "ATTACHED" ? "queue" : "deny" : e || n >= 3 ? "queue" : "run";
}
const ut = () => ({
  presence: "PRESENT",
  mode: "ATTACHED",
  tasks: [],
  timeline: [],
  audit: [],
  instruction: "",
  agentActionsEnabled: !0,
  emergencyStop: !1,
  lastAuthAt: 0,
  detachedAt: null
});
let Re = 0;
class fn {
  /**
   * @param {(task, signal: AbortSignal) => Promise<string>} runner  local task executor
   * @param {{store?: object, signer?: (entry) => Promise<string|undefined>, storageKey?: string}} [opts]
   */
  constructor(t, e = {}) {
    this.runner = t, this.opts = e, this.state = ut(), this.listeners = /* @__PURE__ */ new Set(), this.abort = null;
  }
  get snapshot() {
    return this.state;
  }
  subscribe(t) {
    return this.listeners.add(t), t(this.state), () => this.listeners.delete(t);
  }
  _set(t) {
    this.state = { ...this.state, ...t }, this.listeners.forEach((e) => e(this.state)), this.opts.store?.set(this.opts.storageKey ?? "persona-state", this.state);
  }
  _log(t, e) {
    this._set({ timeline: [...this.state.timeline, { at: Date.now(), kind: t, message: e }].slice(-200) });
  }
  async _audit(t) {
    const e = await this.opts.signer?.(t);
    this._set({ audit: [...this.state.audit, { ...t, signature: e }].slice(-500) });
  }
  /** Restore persisted state; running tasks become pending again. */
  async restore() {
    const t = await this.opts.store?.get(this.opts.storageKey ?? "persona-state");
    t && (this.state = { ...ut(), ...t, tasks: t.tasks.map((e) => e.status === "running" ? { ...e, status: "pending" } : e) }, this.listeners.forEach((e) => e(this.state)));
  }
  /** Record an instruction and its planned tasks [{title, level, external?}]. */
  instruct(t, e) {
    const i = Date.now(), s = e.map((r) => ({ id: `t${++Re}-${i.toString(36)}`, title: r.title, level: r.level, external: !!r.external, status: "pending", createdAt: i, updatedAt: i }));
    this._set({ instruction: t, tasks: [...this.state.tasks, ...s] }), this._log("instruction", `Instruction recorded: “${t}” → ${s.length} tasks planned`);
  }
  /** Presence from a detector or manual toggle. */
  setPresence(t) {
    t !== this.state.presence && (this._set({ presence: t }), this._log("presence", t === "PRESENT" ? "Presence ABSENT → PRESENT" : "Presence PRESENT → ABSENT"), t === "ABSENT" && this.state.mode === "ATTACHED" && this.detach(), t === "PRESENT" && this.state.mode === "DETACHED" && (this._set({ mode: "VERIFYING" }), this._log("verify", "Identity confirmation requested before reattaching")));
  }
  async detach() {
    this._set({ mode: "DETACHED", detachedAt: Date.now() }), this._log("detach", "Persona detached — continuing in the 4D parallel reality layer"), await this.work();
  }
  /**
   * Run every pending task the gate allows. Re-entrant calls (visibility,
   * Background Sync, approvals) never abort the run in progress — they just
   * schedule another pass once it finishes.
   */
  async work() {
    if (this._working) {
      this._again = !0;
      return;
    }
    this._working = !0;
    const t = new AbortController();
    this.abort = t;
    try {
      do {
        this._again = !1;
        let e;
        for (; !t.signal.aborted && !this.state.emergencyStop && (e = this.state.tasks.find((i) => i.status === "pending" || i.status === "approved")); )
          await this._process(e, t);
      } while (this._again && !t.signal.aborted && !this.state.emergencyStop);
    } finally {
      this._working = !1;
    }
  }
  /** Gate one task, then run, queue or block it. */
  async _process(t, e) {
    const i = t.status === "approved" ? "run" : _e(t.level, this._ctx(), t.external);
    if (i === "deny") {
      this._patch(t.id, { status: "blocked", result: `Blocked: ${Be[t.level]}` }), await this._audit({ at: Date.now(), taskId: t.id, action: t.title, level: t.level, decision: "deny" });
      return;
    }
    if (i === "queue") {
      this._patch(t.id, { status: "awaiting-approval" }), await this._audit({ at: Date.now(), taskId: t.id, action: t.title, level: t.level, decision: "queue" }), this._log("approval", `Approval required: ${t.title}`);
      return;
    }
    this._patch(t.id, { status: "running" });
    try {
      const s = await this.runner(t, e.signal);
      this._patch(t.id, { status: "done", result: s }), await this._audit({ at: Date.now(), taskId: t.id, action: t.title, level: t.level, decision: "executed" }), this._log("task", `Completed: ${t.title}`);
    } catch (s) {
      this._patch(t.id, { status: e.signal.aborted ? "pending" : "failed", result: e.signal.aborted ? void 0 : String(s) });
    }
  }
  _ctx() {
    const t = this.state;
    return { mode: t.mode, agentActionsEnabled: t.agentActionsEnabled, emergencyStop: t.emergencyStop, lastAuthAt: t.lastAuthAt };
  }
  _patch(t, e) {
    this._set({ tasks: this.state.tasks.map((i) => i.id === t ? { ...i, ...e, updatedAt: Date.now() } : i) });
  }
  /** After a passkey/PIN check. Returns the welcome summary. */
  async reattach(t) {
    return t ? (this._set({ mode: "ATTACHED", lastAuthAt: Date.now(), detachedAt: null }), this._log("reattach", "Identity confirmed — persona reattached to the real person"), this.summary()) : (this._log("verify", "Identity check failed — persona stays detached"), this._set({ mode: "DETACHED" }), "Identity could not be confirmed. The persona remains detached.");
  }
  summary() {
    const t = this.state.tasks, e = t.filter((r) => r.status === "done").length, i = t.filter((r) => r.status === "awaiting-approval").length, s = t.filter((r) => r.status === "blocked").length;
    return `Welcome back. ${e} task${e === 1 ? " was" : "s were"} prepared. No external actions were executed.` + (i ? ` ${i} approval${i === 1 ? " is" : "s are"} waiting.` : "") + (s ? ` ${s} blocked.` : "") + " Would you like to review them?";
  }
  async approve(t, e) {
    const i = this.state.tasks.find((s) => s.id === t);
    if (!(!i || i.status !== "awaiting-approval")) {
      if (this.state.mode !== "ATTACHED") throw new Error("Approvals require the attached, verified user");
      this._patch(t, { status: e ? "approved" : "rejected" }), await this._audit({ at: Date.now(), taskId: t, action: i.title, level: i.level, decision: e ? "approved" : "rejected" }), this._log("approval", `${e ? "Approved" : "Rejected"}: ${i.title}`), e && await this.work();
    }
  }
  setAgentActions(t) {
    this._set({ agentActionsEnabled: t });
  }
  emergencyStop() {
    this.abort?.abort(), this._set({ emergencyStop: !0, tasks: this.state.tasks.map((t) => t.status === "running" ? { ...t, status: "pending" } : t) }), this._log("stop", "EMERGENCY STOP — all agent work halted");
  }
  resume() {
    this._set({ emergencyStop: !1 });
  }
  async reset() {
    this.abort?.abort(), this.state = ut(), await this.opts.store?.delete(this.opts.storageKey ?? "persona-state"), this.listeners.forEach((t) => t(this.state));
  }
}
const V = {
  dist2: (n, t) => Math.hypot(n.x - t.x, n.y - t.y),
  dist3: (n, t) => Math.hypot(n.x - t.x, n.y - t.y, (n.z ?? 0) - (t.z ?? 0)),
  lerp: (n, t, e) => n + (t - n) * e,
  mid: (n, t) => ({ x: (n.x + t.x) / 2, y: (n.y + t.y) / 2 }),
  clamp: (n, t, e) => Math.min(e, Math.max(t, n))
};
class Tt {
  constructor(t = 1.2, e = 0.02, i = 1) {
    Object.assign(this, { minCutoff: t, beta: e, dCutoff: i, xPrev: null, dxPrev: 0, tPrev: 0 });
  }
  _alpha(t, e) {
    return 1 / (1 + 1 / (2 * Math.PI * t) / e);
  }
  filter(t, e) {
    if (this.xPrev === null)
      return this.xPrev = t, this.tPrev = e, t;
    const i = Math.max(1e-3, (e - this.tPrev) / 1e3);
    this.tPrev = e;
    const s = this._alpha(this.dCutoff, i);
    this.dxPrev = s * ((t - this.xPrev) / i) + (1 - s) * this.dxPrev;
    const r = this._alpha(this.minCutoff + this.beta * Math.abs(this.dxPrev), i);
    return this.xPrev = r * t + (1 - r) * this.xPrev, this.xPrev;
  }
  reset() {
    this.xPrev = null, this.dxPrev = 0;
  }
}
class Ce {
  constructor(t = 1.2, e = 0.02) {
    this.fx = new Tt(t, e), this.fy = new Tt(t, e);
  }
  filter(t, e) {
    return { x: this.fx.filter(t.x, e), y: this.fy.filter(t.y, e) };
  }
  reset() {
    this.fx.reset(), this.fy.reset();
  }
}
function gn(n, t, e = { x: 0, y: 0 }) {
  const i = wt([n.x, n.y], [e.x, e.y], t);
  return { x: i.snapped[0], y: i.snapped[1] };
}
const Te = [4, 8, 12, 16, 20], De = [3, 6, 10, 14, 18], N = (n, t) => Math.hypot(n.x - t.x, n.y - t.y, (n.z ?? 0) - (t.z ?? 0));
function et(n) {
  return N(n[0], n[9]) || 1e-6;
}
function Yt(n) {
  const t = n[0], e = [];
  for (let i = 0; i < 5; i++) {
    const s = n[Te[i]], r = n[De[i]];
    i === 0 ? e.push(N(s, n[5]) > N(r, n[5]) * 1.15 && N(s, n[17]) > et(n) * 0.9) : e.push(N(s, t) > N(r, t) * 1.12);
  }
  return e;
}
function Qt(n) {
  const t = et(n);
  return [8, 12, 16, 20].map((e) => N(n[4], n[e]) / t);
}
function te(n, t = 0.32) {
  if (!n || n.length < 21) return { gesture: "NONE", confidence: 0, extended: [], pinch: [] };
  const e = Yt(n), i = Qt(n), s = et(n), r = [0, 5, 9, 13, 17].reduce((b, O) => ({ x: b.x + n[O].x / 5, y: b.y + n[O].y / 5, z: b.z + (n[O].z ?? 0) / 5 }), { x: 0, y: 0, z: 0 }), o = [8, 12, 16, 20].reduce((b, O) => b + N(n[O], r), 0) / 4 / s;
  if (!e[1] && !e[2] && !e[3] && !e[4] && o < 0.55)
    return { gesture: e[0] ? "THUMBS_UP" : "FIST", confidence: 0.85, extended: e, pinch: i };
  const a = [8, 12, 16, 20].map((b) => N(n[b], r) / s), c = i.map((b, O) => a[O] > 0.5 ? b : 1 / 0), u = Math.min(...c), l = c.indexOf(u);
  if (u < t)
    return { gesture: ["PINCH_INDEX", "PINCH_MIDDLE", "PINCH_RING", "PINCH_PINKY"][l], confidence: 1 - u / t, extended: e, pinch: i };
  const [h, p, d, g, w] = e, x = e.filter(Boolean).length;
  let v = "NONE";
  return x >= 4 && p && d && g && w ? v = "OPEN_PALM" : !p && !d && !g && !w && h ? v = "THUMBS_UP" : !p && !d && !g && !w ? v = "FIST" : p && d && !g && !w ? v = "VICTORY" : p && !d && !g && !w && (v = "POINT"), { gesture: v, confidence: v === "NONE" ? 0 : 0.8, extended: e, pinch: i };
}
function ee(n, t = !0) {
  const e = n[8];
  return { x: t ? 1 - e.x : e.x, y: e.y };
}
function ne(n, t = !0) {
  const e = [0, 5, 9, 13, 17], i = e.reduce((r, o) => r + n[o].x, 0) / e.length, s = e.reduce((r, o) => r + n[o].y, 0) / e.length;
  return { x: t ? 1 - i : i, y: s };
}
class He {
  constructor({ stableFrames: t = 3, holdMs: e = 900, swipeVelocity: i = 1.6, mirror: s = !0 } = {}) {
    Object.assign(this, { stableFrames: t, holdMs: e, swipeVelocity: i, mirror: s }), this.handlers = /* @__PURE__ */ new Map(), this.hands = /* @__PURE__ */ new Map(), this.zoom = null;
  }
  on(t, e) {
    return this.handlers.has(t) || this.handlers.set(t, /* @__PURE__ */ new Set()), this.handlers.get(t).add(e), () => this.handlers.get(t)?.delete(e);
  }
  emit(t, e) {
    this.handlers.get(t)?.forEach((i) => i(e));
  }
  _state(t) {
    return this.hands.has(t) || this.hands.set(t, { filter: new Ce(1, 0.03), candidate: "NONE", frames: 0, active: "NONE", since: 0, held: !1, last: null, track: [] }), this.hands.get(t);
  }
  /**
   * Feed one frame.
   * @param {Array<{landmarks: {x,y,z}[], handedness?: string}>} hands
   * @param {number} tMs timestamp in ms
   */
  update(t, e) {
    const i = /* @__PURE__ */ new Set();
    t.forEach((s, r) => {
      const o = s.handedness ?? `hand${r}`;
      i.add(o);
      const a = this._state(o), { gesture: c } = te(s.landmarks), u = c === "OPEN_PALM" || c === "FIST" ? ne(s.landmarks, this.mirror) : ee(s.landmarks, this.mirror), l = a.filter.filter(u, e);
      for (this.emit("cursor", { ...l, hand: o, gesture: a.active }), c === a.candidate ? a.frames++ : (a.candidate = c, a.frames = 1), a.frames >= this.stableFrames && c !== a.active && (a.active !== "NONE" && this.emit("gestureend", { gesture: a.active, hand: o, ...l }), a.active = c, a.since = e, a.held = !1, c !== "NONE" && this.emit("gesturestart", { gesture: c, hand: o, ...l })), a.active !== "NONE" && !a.held && e - a.since > this.holdMs && (a.held = !0, this.emit("hold", { gesture: a.active, hand: o, ms: e - a.since, ...l })), a.last && (a.active === "FIST" || a.active === "PINCH_INDEX") && this.emit("drag", { ...l, dx: l.x - a.last.x, dy: l.y - a.last.y, hand: o, gesture: a.active }), a.track.push({ ...l, t: e }); a.track.length && e - a.track[0].t > 250; ) a.track.shift();
      if (a.active === "OPEN_PALM" && a.track.length > 3) {
        const h = a.track[0], p = a.track[a.track.length - 1], d = (p.x - h.x) / Math.max(1e-3, (p.t - h.t) / 1e3);
        Math.abs(d) > this.swipeVelocity && Math.abs(p.y - h.y) < 0.15 && (this.emit("swipe", { direction: d > 0 ? "right" : "left", hand: o }), a.track = []);
      }
      a.last = l, a.position = l;
    });
    for (const [s, r] of this.hands)
      i.has(s) || (r.active !== "NONE" && this.emit("gestureend", { gesture: r.active, hand: s, ...r.position ?? { x: 0, y: 0 } }), this.hands.delete(s));
    this._twoHand();
  }
  _twoHand() {
    const t = [...this.hands.values()].filter((e) => e.active === "PINCH_INDEX" && e.position);
    if (t.length === 2) {
      const [e, i] = t.map((a) => a.position), s = Math.hypot(e.x - i.x, e.y - i.y), r = Math.atan2(i.y - e.y, i.x - e.x);
      this.zoom || (this.zoom = { dist0: s, angle0: r, lastScale: 1 });
      const o = s / Math.max(1e-6, this.zoom.dist0);
      this.emit("zoom", { scale: o, delta: o / this.zoom.lastScale }), this.emit("rotate", { angle: r - this.zoom.angle0 }), this.zoom.lastScale = o;
    } else this.zoom = null;
  }
  reset() {
    this.hands.clear(), this.zoom = null;
  }
}
function Fe(n, { grid: t = 2, relTol: e = 1e-9 } = {}) {
  const i = n.map((u) => Math.round(u.x / t) * t), s = n.map((u) => Math.round(u.y / t) * t), r = W(i, { relTol: e }), o = W(s, { relTol: e }), a = n.length * 2, c = r.stats.descriptorTerms + o.stats.descriptorTerms;
  return c >= a ? { n: n.length, grid: t, mode: "raw", xs: i, ys: s, rawNumbers: a, storedNumbers: a, ratio: 1 } : { n: n.length, grid: t, mode: "formula", x: r, y: o, rawNumbers: a, storedNumbers: c, ratio: a / c };
}
function Ue(n) {
  if (n.mode === "raw") return n.xs.map((s, r) => ({ x: s, y: n.ys[r] }));
  const t = (s) => {
    const r = new Array(n.n);
    for (const o of s.segments) {
      const a = Number(o.startIndex);
      for (let c = 0; c < Number(o.count); c++) r[a + c] = o.family === "AP" ? o.startValue + c * o.step : o.startValue * Math.pow(o.ratio, c);
    }
    for (const o of s.exceptions) r[o.index] = o.value;
    return r;
  }, e = t(n.x), i = t(n.y);
  return e.map((s, r) => ({ x: s, y: i[r] }));
}
const $e = {
  PINCH_INDEX: "Select / draw",
  PINCH_MIDDLE: "Erase / context",
  PINCH_RING: "Undo",
  PINCH_PINKY: "Save / confirm",
  POINT: "Cursor",
  OPEN_PALM: "Hover · hold for menu · sweep to switch panel",
  FIST: "Grab & pan",
  VICTORY: "Next tool",
  THUMBS_UP: "Accept",
  TWO_HAND_PINCH: "Zoom & rotate"
}, yn = { classify: te, extendedFingers: Yt, pinchDistances: Qt, handScale: et, cursorOf: ee, palmCenter: ne, GestureTracker: He, compressStroke: Fe, decompressStroke: Ue, GESTURE_ACTIONS: $e };
async function wn() {
  const n = typeof navigator < "u" ? navigator.xr : void 0, t = { webxr: !!n, immersiveAR: !1, immersiveVR: !1, camera: typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia };
  if (n) {
    try {
      t.immersiveAR = await n.isSessionSupported("immersive-ar");
    } catch {
    }
    try {
      t.immersiveVR = await n.isSessionSupported("immersive-vr");
    } catch {
    }
  }
  return t;
}
async function bn({ facingMode: n = "user", width: t = 1280, height: e = 720, audio: i = !1 } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera API not available in this browser");
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: n, width: { ideal: t }, height: { ideal: e } }, audio: i });
}
function xn(n) {
  n?.getTracks().forEach((t) => t.stop());
}
class Mn {
  constructor(t = 0.2) {
    this.smoothing = t, this.anchors = /* @__PURE__ */ new Map();
  }
  /** offset is relative to the target in normalised [0,1] screen units. */
  add(t, { offset: e = { x: 0, y: 0 }, content: i = null, free: s = { x: 0.5, y: 0.5 } } = {}) {
    return this.anchors.set(t, { id: t, offset: e, content: i, pos: { ...s }, free: s }), this.anchors.get(t);
  }
  remove(t) {
    this.anchors.delete(t);
  }
  /** Move anchors toward target+offset (attached) or their free spot (detached). */
  update(t) {
    for (const e of this.anchors.values()) {
      const i = t ? { x: t.x + e.offset.x, y: t.y + e.offset.y } : e.free;
      e.pos = { x: V.clamp(V.lerp(e.pos.x, i.x, this.smoothing), 0, 1), y: V.clamp(V.lerp(e.pos.y, i.y, this.smoothing), 0, 1) };
    }
    return [...this.anchors.values()];
  }
  list() {
    return [...this.anchors.values()];
  }
}
class vn {
  constructor({ enterFrames: t = 5, exitFrames: e = 45 } = {}) {
    Object.assign(this, { enterFrames: t, exitFrames: e, present: !1, seen: 0, missing: 0 });
  }
  /** Feed one frame's detection result; returns "PRESENT" | "ABSENT". */
  update(t) {
    return t ? (this.seen++, this.missing = 0, !this.present && this.seen >= this.enterFrames && (this.present = !0)) : (this.missing++, this.seen = 0, this.present && this.missing >= this.exitFrames && (this.present = !1)), this.present ? "PRESENT" : "ABSENT";
  }
}
const J = () => typeof performance < "u" ? performance.now() : Date.now();
function T(n, t, { iterations: e = 20, warmup: i = 3 } = {}) {
  for (let a = 0; a < i; a++) t();
  const s = [];
  let r;
  for (let a = 0; a < e; a++) {
    const c = J();
    r = t(), s.push(J() - c);
  }
  s.sort((a, c) => a - c);
  const o = s.reduce((a, c) => a + c, 0) / s.length;
  return { name: n, iterations: e, median: s[s.length >> 1], mean: o, p95: s[Math.floor(s.length * 0.95)] ?? s[s.length - 1], min: s[0], result: r };
}
function B(n, t, { ops: e = 1e5, iterations: i = 5 } = {}) {
  let s = 0;
  const r = T(n, () => {
    for (let o = 0; o < e; o++) s += +t(o) || 0;
    return s;
  }, { iterations: i, warmup: 1 });
  return { ...r, perCall: r.median / e, ops: e };
}
async function On(n, t, { iterations: e = 10 } = {}) {
  const i = [];
  let s;
  for (let r = 0; r < e; r++) {
    const o = J();
    s = await t(), i.push(J() - o);
  }
  return i.sort((r, o) => r - o), { name: n, iterations: e, median: i[i.length >> 1], mean: i.reduce((r, o) => r + o, 0) / i.length, min: i[0], result: s };
}
function In() {
  return globalThis.performance?.memory?.usedJSHeapSize ?? null;
}
function Sn(n = 1e6) {
  const t = [];
  let s;
  const r = T("materialise", () => {
    s = new Float64Array(n);
    for (let m = 0; m < n; m++) s[m] = 10 + m * 10;
    return s.length;
  }, { iterations: 5, warmup: 1 }), o = T("loop sum", () => {
    let m = 0;
    for (let I = 0; I < n; I++) m += s[I];
    return m;
  }, { iterations: 10 }), a = X.ap(10, 10, n), c = B("formula sum", () => a.sum(), { ops: 2e4 });
  t.push({ benchmark: "Sum of N values (build + scan vs formula)", N: n, traditionalMs: r.median + o.median, omniMs: c.perCall, traditionalBytes: n * 8, omniBytes: a.descriptorBytes(), check: o.result === a.sum() ? "equal" : `Δ=${Math.abs(o.result - a.sum())}` });
  let u;
  const l = T("prefix build", () => {
    u = new Float64Array(n + 1);
    for (let m = 0; m < n; m++) u[m + 1] = u[m] + s[m];
    return u.length;
  }, { iterations: 5, warmup: 1 }), h = Math.max(1, Math.floor(n / 3)), p = B("prefix query", (m) => u[m % h + h + 1] - u[m % h]), d = B("formula range", (m) => y.rangeSum(10, 10, m % h, m % h + h)), g = 7 % h, w = Math.abs(u[g + h + 1] - u[g] - y.rangeSum(10, 10, g, g + h)) < 1e-6 * y.rangeSum(10, 10, g, g + h);
  t.push({ benchmark: "Range sum (prefix build + query vs formula)", N: n, traditionalMs: l.median + p.perCall, omniMs: d.perCall, traditionalBytes: (n + 1) * 8, omniBytes: 24, check: w ? "equal" : "float drift" }), t.push({ benchmark: "Range sum — query only (after prefix built)", N: n, traditionalMs: p.perCall, omniMs: d.perCall, traditionalBytes: (n + 1) * 8, omniBytes: 24, check: "both O(1) per query; formula needs no O(N) table" });
  const x = new ge(0, 600, n), v = s, b = (m) => 10 + m * 7919 % n * 10 + 3.7, O = B("binary search", (m) => {
    const I = b(m);
    let F = 0, it = n - 1;
    for (; F < it; ) {
      const st = F + it >> 1;
      v[st] < I ? F = st + 1 : it = st;
    }
    return F;
  }), ie = B("formula nearest", (m) => y.nearest(10, 10, b(m), n));
  t.push({ benchmark: "Nearest regular event (per query)", N: n, traditionalMs: O.perCall, omniMs: ie.perCall, traditionalBytes: n * 8, omniBytes: k({ start: x.start, interval: x.interval, count: x.count }), check: "O(log N) vs O(1)" });
  const P = Math.min(n, 2e5);
  let H;
  const se = T("random log", () => {
    const m = tt(7);
    H = new Float64Array(P);
    for (let I = 0; I < P; I++) H[I] = m.next();
    return H[P - 1];
  }, { iterations: 3, warmup: 1 }), re = new St(7), oe = B("counter replay", (m) => re.at(0, m % P));
  t.push({ benchmark: `Replay any of ${P} samples (log build vs counter)`, N: P, traditionalMs: se.median, omniMs: oe.perCall, traditionalBytes: P * 8, omniBytes: 24, check: "log needed vs (seed, worker, counter)" });
  const nt = Array.from({ length: Math.min(n, 1e5) }, (m, I) => 10 + I * 10), ae = k(nt);
  return t.push({ benchmark: "Serialized state (JSON)", N: nt.length, traditionalMs: null, omniMs: null, traditionalBytes: ae, omniBytes: k(y.describe(10, 10, nt.length)), check: "bytes only" }), s = u = H = null, t.map((m) => ({ ...m, compressionRatio: m.omniBytes ? m.traditionalBytes / m.omniBytes : null, speedup: m.traditionalMs != null && m.omniMs ? m.traditionalMs / m.omniMs : null }));
}
function Nn() {
  const n = globalThis, t = n.navigator ?? {};
  let e = !1;
  try {
    const i = n.document?.createElement("canvas");
    e = !!(i?.getContext("webgl2") || i?.getContext("webgl"));
  } catch {
  }
  return {
    serviceWorker: "serviceWorker" in t,
    indexedDB: typeof n.indexedDB < "u",
    cacheStorage: typeof n.caches < "u",
    webWorker: typeof n.Worker < "u",
    sharedWorker: typeof n.SharedWorker < "u",
    broadcastChannel: typeof n.BroadcastChannel < "u",
    webgl: e,
    webgpu: "gpu" in t,
    webxr: "xr" in t,
    camera: !!t.mediaDevices?.getUserMedia,
    speechSynthesis: "speechSynthesis" in n,
    speechRecognition: !!(n.SpeechRecognition || n.webkitSpeechRecognition),
    notifications: "Notification" in n,
    push: "PushManager" in n,
    backgroundSync: typeof n.SyncManager < "u",
    wakeLock: "wakeLock" in t,
    share: "share" in t,
    clipboard: !!t.clipboard,
    vibrate: "vibrate" in t,
    fullscreen: !!n.document?.documentElement?.requestFullscreen,
    orientationLock: !!n.screen?.orientation?.lock,
    deviceMotion: "DeviceMotionEvent" in n,
    fileHandling: "launchQueue" in n,
    webAuthn: typeof n.PublicKeyCredential < "u",
    crypto: !!n.crypto?.subtle
  };
}
function An(n, { rate: t = 1, pitch: e = 1, onBoundary: i } = {}) {
  return new Promise((s) => {
    if (!("speechSynthesis" in globalThis)) return s(!1);
    const r = new SpeechSynthesisUtterance(n);
    r.rate = t, r.pitch = e, i && (r.onboundary = i), r.onend = () => s(!0), r.onerror = () => s(!1), speechSynthesis.cancel(), speechSynthesis.speak(r);
  });
}
function En({ lang: n = "en-US" } = {}) {
  const t = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  return t ? new Promise((e, i) => {
    const s = new t();
    s.lang = n, s.interimResults = !1, s.onresult = (r) => e(r.results[0][0].transcript), s.onerror = (r) => i(new Error(r.error)), s.start();
  }) : Promise.reject(new Error("Speech recognition not supported"));
}
async function Pn() {
  if (!("wakeLock" in navigator)) return () => {
  };
  const n = await navigator.wakeLock.request("screen");
  return () => n.release();
}
async function kn(n, t) {
  if (!("Notification" in globalThis) || (Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission) !== "granted") return !1;
  const i = await navigator.serviceWorker?.getRegistration?.();
  return i ? await i.showNotification(n, { body: t, icon: "icons/icon.svg" }) : new Notification(n, { body: t }), !0;
}
function Bn(n, t) {
  return new Promise((e, i) => {
    const s = new Worker(n);
    s.onmessage = (r) => {
      e(r.data), s.terminate();
    }, s.onerror = (r) => {
      i(r), s.terminate();
    }, s.postMessage(t);
  });
}
const _n = "0.1.0";
export {
  Be as ACTION_LEVELS,
  y as AP,
  Mn as AnchorManager,
  Le as COMPLEXITY_CLASSES,
  dn as DeviceSigner,
  Pt as EULER_GAMMA,
  sn as EncryptedStore,
  Z as ExceptionIndex,
  $e as GESTURE_ACTIONS,
  A as GP,
  S as Geometry,
  yn as Gesture,
  He as GestureTracker,
  Xe as Grid,
  xe as HORN_SECURITY_NOTICE,
  Ut as HP,
  en as Horn,
  ve as HornMixer,
  St as HornReplay,
  Oe as HornWorkerSplit,
  mt as IndexedDBStore,
  L as KahanSum,
  qe as MOMENT_BLOCK_POLYNOMIALS,
  Ne as MemoryStore,
  Ve as NOT_O1,
  X as OmniArray,
  on as OmniCache,
  tn as OmniFit,
  be as OmniFitStream,
  Qe as OmniFormulaIndex,
  Ye as OmniGrid,
  Je as OmniPrefix,
  zt as OmniRange,
  ge as OmniSchedule,
  We as OmniSequence,
  Z as OmniSparseExceptionMap,
  Ze as OmniWindow,
  Ce as OneEuro2D,
  Tt as OneEuroFilter,
  un as PRESENTATION_PROFILES,
  hn as Passkey,
  fn as PersonaRuntime,
  ke as Pin,
  vn as PresenceDetector,
  f as Rational,
  _n as VERSION,
  Y as apSegment,
  T as bench,
  On as benchAsync,
  B as benchOps,
  Ht as bernoulli,
  at as bigPow,
  K as binomial,
  ot as binomialNumber,
  Se as bridgeScenarios,
  Nn as capabilities,
  we as classifyFamily,
  te as classifyGesture,
  ze as complexityCatalog,
  Ge as complexityOf,
  Ae as compressNumbers,
  Fe as compressStroke,
  _t as contentHash,
  $t as coordinateToIndex,
  Ot as counterHash,
  It as counterStream,
  At as createStore,
  ee as cursorOf,
  Ee as decompressNumbers,
  Ue as decompressStroke,
  Me as defaultStreams,
  ce as defineComplexity,
  ln as deleteCookie,
  nn as deleteDatabase,
  Gt as deserializeSegment,
  wn as detectXR,
  j as differences,
  kt as digamma,
  yt as dimensionalCount,
  Kt as estimateInterval,
  _e as evaluateAction,
  Yt as extendedFingers,
  Dt as factorial,
  ue as faulhaber,
  rn as formulaValueAt,
  ft as gamma,
  le as gcd,
  cn as getCookie,
  xt as gpSegment,
  et as handScale,
  In as heapUsed,
  Zt as hornFitness,
  je as hpSegment,
  Lt as indexToCoordinate,
  Pn as keepAwake,
  Jt as ksUniform,
  En as listenOnce,
  Ft as lnGamma,
  fe as makeSegmentId,
  ht as median,
  he as momentBlock,
  tt as mulberry32,
  wt as nearestGridCell,
  pn as newPersonaCredential,
  qt as niceInterval,
  Nt as normalInv,
  kn as notify,
  ne as palmCenter,
  Qt as pinchDistances,
  Ke as powerMean,
  mn as presentationStyle,
  Ie as project,
  Ct as randomId,
  Vt as ratios,
  ye as regularize,
  Bn as runInWorker,
  Sn as runSuite,
  Xt as scoreFamilies,
  Mt as segmentFormulaAt,
  dt as segmentRangeSum,
  Q as segmentValueAt,
  vt as serializeSegment,
  k as serializedBytes,
  an as setSessionCookie,
  jt as sfc32,
  gn as snap2,
  An as speak,
  bn as startCamera,
  xn as stopStream,
  gt as strideMap,
  W as structuralize,
  V as vec,
  Wt as xoshiro128ss
};
//# sourceMappingURL=omnidim.mjs.map
