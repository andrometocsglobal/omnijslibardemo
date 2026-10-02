/**
 * OMNIDIMENSIONAL GP — Geometric Progression.
 *
 *   a(k) = a·r^k
 *   S(N) = a·(r^N − 1)/(r − 1),  r ≠ 1
 *   P(X) = a^X · r^(X(X−1)/2)
 *   X = n^d  →  S(d) = a·(r^(n^d) − 1)/(r − 1)
 *
 * "O(1)" = a constant number of formula evaluations. Exponentiation of huge
 * numbers is not constant bit-cost; the BigInt variants make that explicit.
 */
import { bigPow } from "./math.js";

export const GP = {
  describe(a, r, count) {
    return { family: "GP", a, r, count };
  },
  /** k-th term a·r^k. O(1) formula call. */
  valueAt(a, r, k) {
    return a * Math.pow(r, k);
  },
  /** Sum of N terms. O(1) formula calls. */
  sum(a, r, N) {
    if (N <= 0) return 0;
    if (r === 1) return a * N;
    if (r > 0 && Math.abs(r - 1) < 1e-3) return (a * Math.expm1(N * Math.log1p(r - 1))) / (r - 1);
    return (a * (Math.pow(r, N) - 1)) / (r - 1);
  },
  /** Exact sum for integer a, r. */
  sumBig(a, r, N) {
    const A = BigInt(a), R = BigInt(r), n = BigInt(N);
    if (n <= 0n) return 0n;
    if (R === 1n) return A * n;
    return (A * (bigPow(R, n) - 1n)) / (R - 1n);
  },
  /** Sum of terms i..j = a·r^i·(r^(j−i+1) − 1)/(r − 1). O(1). */
  range(a, r, i, j) {
    return j < i ? 0 : GP.sum(GP.valueAt(a, r, i), r, j - i + 1);
  },
  /** Prefix(k) = sum of first k terms. O(1). */
  prefix(a, r, k) {
    return GP.sum(a, r, k);
  },
  /** Product of X terms in log-space: {sign, log, value}. O(1). */
  product(a, r, X) {
    if (X <= 0) return { sign: 1, log: 0, value: 1 };
    if (a === 0 || r === 0) return { sign: 0, log: -Infinity, value: 0 };
    const tri = (X * (X - 1)) / 2;
    const log = X * Math.log(Math.abs(a)) + tri * Math.log(Math.abs(r));
    const sign = (a < 0 && X % 2 === 1) !== (r < 0 && tri % 2 === 1) ? -1 : 1;
    return { sign, log, value: log < 709 ? sign * Math.exp(log) : sign * Infinity };
  },
  /** Exact product for integer a, r. */
  productBig(a, r, X) {
    const n = BigInt(X);
    if (n <= 0n) return 1n;
    return bigPow(BigInt(a), n) * bigPow(BigInt(r), (n * (n - 1n)) / 2n);
  },
  /** Omnidimensional sum with X = n^d terms. */
  sumDimensional(a, r, n, d) {
    return GP.sum(a, r, Math.pow(n, d));
  },
  /** Nodes in a uniform b-ary tree with L levels below the root. O(1). */
  levelCount(b, L) {
    return GP.sum(1, b, L + 1);
  },
  /** Levels needed for a b-ary hierarchy to hold `capacity` leaves. O(1). */
  levelsFor(b, capacity) {
    return capacity <= 1 ? 0 : Math.ceil(Math.log(capacity) / Math.log(b) - 1e-12);
  },
  /** Exponential resource model: initial·(1+g)^t. O(1). */
  growth(initial, g, t) {
    return initial * Math.pow(1 + g, t);
  },
  /** Whole periods until `initial` reaches `target` at rate g. O(1). */
  periodsToReach(initial, g, target) {
    return Math.ceil(Math.log(target / initial) / Math.log(1 + g) - 1e-12);
  },
  /** a/(1 − r) for |r| < 1. */
  sumInfinite(a, r) {
    return Math.abs(r) >= 1 ? NaN : a / (1 - r);
  },
};
