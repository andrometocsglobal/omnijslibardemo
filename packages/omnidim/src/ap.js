/**
 * OMNIDIMENSIONAL AP — Arithmetic Progression.
 *
 *   a(k) = a0 + k·h
 *   S    = N·(first + last)/2 = N·M        (M = midpoint, the "balance point")
 *   X    = n^d                              (omnidimensional count)
 *   OMNIBAL:  D^p = X · Σ_{m=0}^{⌊p/2⌋} C(p,2m) · M^(p−2m) · h^(2m) · μ_2m(X)
 *   μ_r(X) = (1/X) Σ_{j=0}^{X−1} (j − (X−1)/2)^r       (odd r → 0)
 *
 * Every query is O(1) in N. powerSum costs O(p²) in p, independent of X.
 */
import { Rational, binomial, faulhaber } from "./math.js";

const momentCache = new Map();

/** Normalised central moment μ_r(X) exactly. Cost depends on r only. */
export function momentBlock(r, X) {
  const XX = BigInt(X);
  if (XX < 1n) throw new RangeError("momentBlock: X must be ≥ 1");
  if (r === 0) return Rational.ONE;
  if (r % 2 === 1) return Rational.ZERO;
  const key = `${r}:${XX}`;
  const hit = momentCache.get(key);
  if (hit) return hit;
  const center = new Rational(XX - 1n, 2n);
  let s = Rational.ZERO;
  for (let t = 0; t <= r; t++) s = s.add(center.neg().pow(r - t).mul(binomial(r, t)).mul(faulhaber(XX, t)));
  const out = s.div(XX);
  if (momentCache.size > 4096) momentCache.clear();
  momentCache.set(key, out);
  return out;
}

/** Display polynomials of the moment blocks μ0..μ10. */
export const MOMENT_BLOCK_POLYNOMIALS = {
  0: "1",
  2: "(X² − 1)/12",
  4: "(3X⁴ − 10X² + 7)/240",
  6: "(3X⁶ − 21X⁴ + 49X² − 31)/1344",
  8: "(5X⁸ − 60X⁶ + 294X⁴ − 620X² + 381)/11520",
  10: "(3X¹⁰ − 55X⁸ + 462X⁶ − 2046X⁴ + 4191X² − 2555)/33792",
};

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sup = (n) => String(n).replace(/\d/g, (c) => SUP[+c]);
const sub = (n) => String(n).replace(/\d/g, (c) => SUB[+c]);

export const AP = {
  /** O(1) descriptor regardless of N. */
  describe(a0, h, count) {
    return { family: "AP", a0, h, count };
  },
  /** k-th term (0-based). FORMULA O(1). */
  valueAt(a0, h, k) {
    return a0 + k * h;
  },
  first(a0) {
    return a0;
  },
  /** Last of N terms. O(1). */
  last(a0, h, N) {
    return a0 + (N - 1) * h;
  },
  /** M = (first + last)/2. O(1). */
  midpoint(a0, h, N) {
    return (a0 + AP.last(a0, h, N)) / 2;
  },
  /** Number of terms from first to last inclusive. O(1). */
  count(first, last, h) {
    if (h === 0) throw new RangeError("AP.count: h must be non-zero");
    return Math.floor((last - first) / h + 1e-9) + 1;
  },
  /** S = N·(first + last)/2. FORMULA O(1). */
  sum(a0, h, N) {
    if (!Number.isInteger(N) || N < 0) throw new RangeError("AP.sum: N must be a non-negative integer");
    return N * AP.midpoint(a0, h, N);
  },
  /** Exact BigInt sum for integer a0, h. */
  sumBig(a0, h, N) {
    const A = BigInt(a0), H = BigInt(h), n = BigInt(N);
    return (n * (2n * A + (n - 1n) * H)) / 2n;
  },
  /** Prefix(k) = sum of the first k terms. O(1). */
  prefix(a0, h, k) {
    return k <= 0 ? 0 : k * a0 + (h * k * (k - 1)) / 2;
  },
  /** Sum of terms i..j inclusive = Prefix(j+1) − Prefix(i). FORMULA O(1). */
  rangeSum(a0, h, i, j) {
    return j < i ? 0 : AP.prefix(a0, h, j + 1) - AP.prefix(a0, h, i);
  },
  /** Sum of the w terms ending at index k. O(1). */
  windowSum(a0, h, k, w) {
    return AP.prefix(a0, h, k + 1) - AP.prefix(a0, h, Math.max(0, k + 1 - w));
  },
  /** (x − a0) mod h == 0 and 0 ≤ k < N. O(1). */
  contains(a0, h, x, N = Infinity, eps = 1e-9) {
    if (h === 0) return x === a0;
    const k = (x - a0) / h;
    const kr = Math.round(k);
    return Math.abs(k - kr) <= eps * Math.max(1, Math.abs(k)) && kr >= 0 && kr < N;
  },
  indexOf(a0, h, x, N = Infinity) {
    return AP.contains(a0, h, x, N) ? Math.round((x - a0) / h) : -1;
  },
  /** Smallest term > x (h > 0). O(1). */
  next(a0, h, x) {
    return a0 + Math.max(0, Math.floor((x - a0) / h) + 1) * h;
  },
  /** Largest term < x (h > 0), NaN if none. O(1). */
  previous(a0, h, x) {
    const k = Math.ceil((x - a0) / h) - 1;
    return k < 0 ? NaN : a0 + k * h;
  },
  /** Nearest term: k = round((x − a0)/h). O(1). */
  nearest(a0, h, x, N = Infinity) {
    return a0 + Math.min(Math.max(0, Math.round((x - a0) / h)), N - 1) * h;
  },
  /** Mean of the AP = midpoint. O(1). */
  mean(a0, h, N) {
    return AP.midpoint(a0, h, N);
  },
  /** Population variance h²·(N² − 1)/12 = h²·μ₂(N). O(1). */
  variance(h, N) {
    return (h * h * (N * N - 1)) / 12;
  },
  /** X = n^d. */
  dimensionalCount(n, d) {
    return BigInt(n) ** BigInt(d);
  },
  /**
   * OMNIBAL power sum Σ_{j=0}^{X−1} (F + j·s)^p, exact BigInt.
   * Cost depends on p only, not X.
   */
  powerSum(F, X, s, p) {
    return AP.powerSumRational(F, X, s, p).toBigInt();
  },
  /** Exact Rational version (allows half-integer midpoints mid-computation). */
  powerSumRational(F, X, s, p) {
    if (!Number.isInteger(p) || p < 0) throw new RangeError("powerSum: p must be a non-negative integer");
    const XX = BigInt(X);
    if (XX < 1n) return Rational.ZERO;
    const FF = BigInt(F), SS = BigInt(s);
    const L = FF + (XX - 1n) * SS;
    const M = new Rational(FF + L, 2n);
    let acc = Rational.ZERO;
    for (let m = 0; 2 * m <= p; m++) {
      acc = acc.add(M.pow(p - 2 * m).mul(binomial(p, 2 * m)).mul(SS ** BigInt(2 * m)).mul(momentBlock(2 * m, XX)));
    }
    return acc.mul(XX);
  },
  /** Brute force Σ (F + j·s)^p for verification — O(X). */
  powerSumBrute(F, X, s, p) {
    let t = 0n;
    const FF = BigInt(F), SS = BigInt(s), P = BigInt(p);
    for (let j = 0; j < X; j++) t += (FF + BigInt(j) * SS) ** P;
    return t;
  },
  /** Expanded OMNIBAL bracket, e.g. p=4 → "X·[M⁴ + 6·M²·μ₂·s² + μ₄·s⁴]". */
  formula(p) {
    const parts = [];
    for (let m = 0; 2 * m <= p; m++) {
      const c = binomial(p, 2 * m);
      const mp = p - 2 * m;
      const Mterm = mp === 0 ? "" : mp === 1 ? "M" : `M${sup(mp)}`;
      const mu = m === 0 ? "" : `μ${sub(2 * m)}·s${sup(2 * m)}`;
      const body = [Mterm, mu].filter(Boolean).join("·") || "1";
      parts.push(c === 1n ? body : `${c}·${body}`);
    }
    return `X·[${parts.join(" + ")}]`;
  },
};
