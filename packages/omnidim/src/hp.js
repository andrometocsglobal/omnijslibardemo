/**
 * OMNIDIMENSIONAL HP — Harmonic Progression.
 *
 *   H(N) = Σ_{k=1}^{N} 1/k                 (NO finite elementary closed form)
 *   H(N) ≈ ln N + γ + 1/(2N) − 1/(12N²) + 1/(120N⁴) − 1/(252N⁶) + …
 *   X = n^d  →  H(n^d) ≈ d·ln n + γ + 1/(2n^d) − …
 *   Σ_{k=F}^{L} k^(−s)  via Euler–Maclaurin, with an error estimate
 *   Σ_{k=0}^{N−1} 1/(a0 + k·h) = [ψ(a0/h + N) − ψ(a0/h)]/h   (digamma)
 *
 * "O(1)" applies only to fixed-precision approximation.
 */
import { EULER_GAMMA, KahanSum, Rational, bernoulli, digamma, factorial } from "./math.js";

const bern = (k) => bernoulli(k).toNumber();

export const HP = {
  /** k-th term (1-based) of 1/(a0 + (k−1)h); default 1/k. O(1). */
  valueAt(k, a0 = 1, h = 1) {
    return 1 / (a0 + (k - 1) * h);
  },
  /** Exact finite iteration with compensated summation. O(N). */
  sumExact(N) {
    const s = new KahanSum();
    for (let k = N; k >= 1; k--) s.add(1 / k);
    return s.value;
  },
  /** H(N) as an exact Rational (small N). O(N) BigInt ops. */
  sumRational(N) {
    let r = Rational.ZERO;
    for (let k = 1; k <= N; k++) r = r.add(new Rational(1n, BigInt(k)));
    return r;
  },
  /**
   * Euler–Maclaurin with `terms` Bernoulli corrections. O(terms).
   * @returns {{value:number, errorBound:number, method:string}}
   */
  sumApprox(N, terms = 4) {
    if (N < 1) return { value: 0, errorBound: 0, method: "euler-maclaurin" };
    let v = Math.log(N) + EULER_GAMMA + 1 / (2 * N);
    for (let k = 1; k <= terms; k++) v -= bern(2 * k) / (2 * k * Math.pow(N, 2 * k));
    const next = Math.abs(bern(2 * terms + 2) / ((2 * terms + 2) * Math.pow(N, 2 * terms + 2)));
    return { value: v, errorBound: next, method: "euler-maclaurin" };
  },
  /** H(n^d) using ln(n^d) = d·ln n, so X is never formed explicitly. */
  sumDimensional(n, d, terms = 4) {
    const lnX = d * Math.log(n);
    const X = Math.exp(lnX);
    let v = lnX + EULER_GAMMA;
    let next = 0;
    if (Number.isFinite(X)) {
      v += 1 / (2 * X);
      for (let k = 1; k <= terms; k++) v -= bern(2 * k) / (2 * k * Math.pow(X, 2 * k));
      next = Math.abs(bern(2 * terms + 2) / ((2 * terms + 2) * Math.pow(X, 2 * terms + 2)));
    }
    return { value: v, errorBound: next, method: "euler-maclaurin" };
  },
  /** Error estimate of sumApprox(N, terms). */
  errorBound(N, terms = 4) {
    return HP.sumApprox(N, terms).errorBound;
  },
  /**
   * Σ_{k=F}^{L} k^(−s) for real s > 0, integers 1 ≤ F ≤ L.
   * Direct head sum, then Euler–Maclaurin on the tail. O(head + terms).
   */
  reciprocalPower(s, F, L, terms = 6, head = 10) {
    if (L < F) return { value: 0, errorBound: 0, method: "exact-iteration" };
    if (L - F < 64) {
      const ks = new KahanSum();
      for (let k = L; k >= F; k--) ks.add(Math.pow(k, -s));
      return { value: ks.value, errorBound: 0, method: "exact-iteration" };
    }
    const acc = new KahanSum();
    const a = F + head;
    for (let k = F; k < a; k++) acc.add(Math.pow(k, -s));
    const f = (x) => Math.pow(x, -s);
    acc.add(s === 1 ? Math.log(L / a) : (Math.pow(L, 1 - s) - Math.pow(a, 1 - s)) / (1 - s));
    acc.add((f(a) + f(L)) / 2);
    // f^(m)(x) = (−1)^m · s(s+1)…(s+m−1) · x^(−s−m)
    const deriv = (x, m) => {
      let c = 1;
      for (let i = 0; i < m; i++) c *= s + i;
      return (m % 2 === 0 ? 1 : -1) * c * Math.pow(x, -s - m);
    };
    const term = (j) => (bern(2 * j) / Number(factorial(2 * j))) * (deriv(L, 2 * j - 1) - deriv(a, 2 * j - 1));
    for (let j = 1; j <= terms; j++) acc.add(term(j));
    return { value: acc.value, errorBound: Math.abs(term(terms + 1)), method: "euler-maclaurin" };
  },
  /** Σ_{k=0}^{N−1} 1/(a0 + k·h) via digamma. O(1) fixed precision. */
  progressionSum(a0, h, N) {
    const q = a0 / h;
    const value = (digamma(q + N) - digamma(q)) / h;
    return { value, errorBound: Math.abs(value) * 1e-13, method: "digamma" };
  },
  /** Harmonic mean n / Σ 1/x_i. O(n). */
  harmonicMean(xs) {
    const s = new KahanSum();
    for (const x of xs) s.add(1 / x);
    return xs.length / s.value;
  },
};
