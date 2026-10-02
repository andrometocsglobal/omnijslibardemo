/**
 * Exact and numeric math core: BigInt rationals, combinatorics, Bernoulli
 * numbers, Faulhaber power sums, Gamma / lnGamma / digamma, compensated sums.
 */

export const EULER_GAMMA = 0.5772156649015329;

export function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Exact rational number on BigInt, always normalised (d > 0, gcd = 1). */
export class Rational {
  /** @param {bigint|number} n @param {bigint|number} [d] */
  constructor(n, d = 1n) {
    let nn = BigInt(n);
    let dd = BigInt(d);
    if (dd === 0n) throw new RangeError("Rational: zero denominator");
    if (dd < 0n) {
      nn = -nn;
      dd = -dd;
    }
    const g = gcd(nn, dd);
    this.n = g > 1n ? nn / g : nn;
    this.d = g > 1n ? dd / g : dd;
  }

  static from(v) {
    if (v instanceof Rational) return v;
    if (typeof v === "number" && !Number.isInteger(v)) throw new TypeError(`Rational.from: ${v} is not an integer`);
    return new Rational(BigInt(v));
  }

  add(o) {
    const b = Rational.from(o);
    return new Rational(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  sub(o) {
    const b = Rational.from(o);
    return new Rational(this.n * b.d - b.n * this.d, this.d * b.d);
  }
  mul(o) {
    const b = Rational.from(o);
    return new Rational(this.n * b.n, this.d * b.d);
  }
  div(o) {
    const b = Rational.from(o);
    return new Rational(this.n * b.d, this.d * b.n);
  }
  neg() {
    return new Rational(-this.n, this.d);
  }
  /** Integer power. O(log e) multiplications. */
  pow(e) {
    if (!Number.isInteger(e)) throw new TypeError("Rational.pow: integer exponent required");
    if (e < 0) return new Rational(this.d, this.n).pow(-e);
    const E = BigInt(e);
    return new Rational(this.n ** E, this.d ** E);
  }
  isZero() {
    return this.n === 0n;
  }
  isInteger() {
    return this.d === 1n;
  }
  equals(o) {
    const b = Rational.from(o);
    return this.n === b.n && this.d === b.d;
  }
  /** Lossy conversion for display; exact value remains in n/d. */
  toNumber() {
    const ns = this.n.toString().length;
    const ds = this.d.toString().length;
    if (ns < 300 && ds < 300) return Number(this.n) / Number(this.d);
    const shift = 10n ** BigInt(Math.max(ns, ds) - 300);
    return Number(this.n / shift) / Number(this.d / shift || 1n);
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

Rational.ZERO = new Rational(0n);
Rational.ONE = new Rational(1n);

const factCache = [1n];

/** n! exactly (cached). */
export function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("factorial: n must be a non-negative integer");
  for (let i = factCache.length; i <= n; i++) factCache[i] = factCache[i - 1] * BigInt(i);
  return factCache[n];
}

/** C(n, k) exactly. O(min(k, n−k)). */
export function binomial(n, k) {
  const N = BigInt(n);
  let K = BigInt(k);
  if (K < 0n || K > N) return 0n;
  if (K > N - K) K = N - K;
  let r = 1n;
  for (let i = 1n; i <= K; i++) r = (r * (N - K + i)) / i;
  return r;
}

/** C(n, k) as a float (geometry with large d). */
export function binomialNumber(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r < 9e15 ? Math.round(r) : r;
}

const bernoulliCache = [];

/** Bernoulli number B_n exactly (Akiyama–Tanigawa, B_1 = +1/2). O(n²) once, cached. */
export function bernoulli(n) {
  if (n < bernoulliCache.length) return bernoulliCache[n];
  const work = [];
  for (let m = 0; m <= n; m++) {
    work[m] = new Rational(1n, BigInt(m + 1));
    for (let j = m; j >= 1; j--) work[j - 1] = work[j - 1].sub(work[j]).mul(j);
    bernoulliCache[m] = work[0];
  }
  return bernoulliCache[n];
}

/**
 * Σ_{k=0}^{n−1} k^p exactly (Faulhaber/Bernoulli).
 * Cost depends on p only — not on n.
 * @returns {Rational}
 */
export function faulhaber(n, p) {
  const N = BigInt(n);
  if (N < 1n) return Rational.ZERO;
  if (p === 0) return new Rational(N);
  const upper = N - 1n;
  let total = Rational.ZERO;
  for (let k = 0; k <= p; k++) total = total.add(bernoulli(k).mul(binomial(p + 1, k)).mul(upper ** BigInt(p + 1 - k)));
  return total.div(p + 1);
}

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** Γ(x) (Lanczos g = 7; exact factorial for small integers). */
export function gamma(x) {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  if (Number.isInteger(x) && x <= 171) return Number(factorial(x - 1));
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}

/** ln Γ(x), stable for large x. */
export function lnGamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Digamma ψ(x), x > 0: recurrence to x ≥ 10 then asymptotic series (~1e-15). */
export function digamma(x) {
  if (x <= 0 && Number.isInteger(x)) return NaN;
  let r = 0;
  while (x < 10) {
    r -= 1 / x;
    x += 1;
  }
  const f = 1 / (x * x);
  return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f * (1 / 132)))));
}

/** Kahan–Neumaier compensated summation. */
export class KahanSum {
  constructor() {
    this.sum = 0;
    this.c = 0;
  }
  add(v) {
    const t = this.sum + v;
    if (Math.abs(this.sum) >= Math.abs(v)) this.c += this.sum - t + v;
    else this.c += v - t + this.sum;
    this.sum = t;
    return this;
  }
  get value() {
    return this.sum + this.c;
  }
}

/** BigInt power with a guard against accidental gigantic results. */
export function bigPow(base, exp, maxBits = 1_000_000) {
  const e = BigInt(exp);
  if (e < 0n) throw new RangeError("bigPow: negative exponent");
  const b = base < 0n ? -base : base;
  if (b > 1n && Number(e) * b.toString(2).length > maxBits) throw new RangeError(`bigPow: result would exceed ${maxBits} bits`);
  return base ** e;
}

export function median(xs) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Generalized power mean M_p (p = −1 harmonic, 0 geometric, 1 arithmetic, 2 RMS). */
export function powerMean(values, p = 1, weights) {
  const xs = values.map((v) => Math.max(1e-300, v));
  const ws = weights ?? xs.map(() => 1);
  const W = ws.reduce((a, b) => a + b, 0) || 1;
  if (Math.abs(p) < 1e-12) return Math.exp(xs.reduce((a, x, i) => a + ws[i] * Math.log(x), 0) / W);
  if (p === Infinity) return Math.max(...xs);
  if (p === -Infinity) return Math.min(...xs);
  return Math.pow(xs.reduce((a, x, i) => a + ws[i] * Math.pow(x, p), 0) / W, 1 / p);
}
