import { describe, expect, it } from "vitest";
import { AP, GP, HP, Geometry, momentBlock, bernoulli, faulhaber, Rational, gamma, digamma, EULER_GAMMA, binomial } from "../src/index.js";

// small deterministic PRNG for property-style tests
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

describe("math core", () => {
  it("Bernoulli numbers (B1 = +1/2 convention)", () => {
    expect(bernoulli(0).toString()).toBe("1");
    expect(bernoulli(1).toString()).toBe("1/2");
    expect(bernoulli(2).toString()).toBe("1/6");
    expect(bernoulli(4).toString()).toBe("-1/30");
    expect(bernoulli(12).toString()).toBe("-691/2730");
    expect(bernoulli(3).isZero()).toBe(true);
  });
  it("Faulhaber matches enumeration", () => {
    for (let p = 0; p <= 8; p++)
      for (let n = 1; n <= 30; n++) {
        let s = 0n;
        for (let k = 0n; k < BigInt(n); k++) s += k ** BigInt(p);
        expect(faulhaber(n, p).toBigInt()).toBe(s);
      }
  });
  it("Rational arithmetic", () => {
    const a = new Rational(1n, 3n).add(new Rational(1n, 6n));
    expect(a.toString()).toBe("1/2");
    expect(new Rational(6n, -4n).toString()).toBe("-3/2");
  });
  it("gamma / digamma", () => {
    expect(gamma(5)).toBe(24);
    expect(gamma(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 12);
    expect(digamma(1)).toBeCloseTo(-EULER_GAMMA, 12);
    expect(binomial(10, 3)).toBe(120n);
  });
});

describe("AP family", () => {
  it("basic queries", () => {
    expect(AP.valueAt(10, 10, 4)).toBe(50);
    expect(AP.sum(10, 10, 5)).toBe(150);
    expect(AP.midpoint(10, 10, 5)).toBe(30);
    expect(AP.contains(10, 10, 70)).toBe(true);
    expect(AP.contains(10, 10, 75)).toBe(false);
    expect(AP.next(10, 10, 35)).toBe(40);
    expect(AP.previous(10, 10, 35)).toBe(30);
    expect(AP.count(10, 100, 10)).toBe(10);
    expect(AP.sumBig(10n, 10n, 10_000_000_000n)).toBe(500000000050000000000n);
  });
  it("rangeSum / windowSum agree with enumeration", () => {
    const r = rng(1);
    for (let t = 0; t < 200; t++) {
      const a0 = int(r, -50, 50), h = int(r, -9, 9), n = int(r, 1, 60);
      const xs = Array.from({ length: n }, (_, k) => a0 + k * h);
      const i = int(r, 0, n - 1), j = int(r, i, n - 1);
      expect(AP.rangeSum(a0, h, i, j)).toBe(xs.slice(i, j + 1).reduce((a, b) => a + b, 0));
      const w = int(r, 1, n);
      const k = int(r, 0, n - 1);
      expect(AP.windowSum(a0, h, k, w)).toBe(xs.slice(Math.max(0, k + 1 - w), k + 1).reduce((a, b) => a + b, 0));
    }
  });
  it("moment blocks match the published polynomials", () => {
    const poly = {
      2: (X) => new Rational(X * X - 1n, 12n),
      4: (X) => new Rational(3n * X ** 4n - 10n * X ** 2n + 7n, 240n),
      6: (X) => new Rational(3n * X ** 6n - 21n * X ** 4n + 49n * X ** 2n - 31n, 1344n),
      8: (X) => new Rational(5n * X ** 8n - 60n * X ** 6n + 294n * X ** 4n - 620n * X ** 2n + 381n, 11520n),
      10: (X) => new Rational(3n * X ** 10n - 55n * X ** 8n + 462n * X ** 6n - 2046n * X ** 4n + 4191n * X ** 2n - 2555n, 33792n),
    };
    for (const r of [2, 4, 6, 8, 10]) for (let X = 1n; X <= 40n; X++) expect(momentBlock(r, X).equals(poly[r](X))).toBe(true);
    expect(momentBlock(3, 10n).isZero()).toBe(true);
  });
  it("OMNIBAL power sum == brute force (property test)", () => {
    const r = rng(7);
    for (let t = 0; t < 300; t++) {
      const p = int(r, 0, 12), F = int(r, -20, 20), X = int(r, 1, 40), s = int(r, -5, 5) || 1;
      expect(AP.powerSum(F, X, s, p)).toBe(AP.powerSumBrute(F, X, s, p));
    }
  });
  it("supplied cases from the research", () => {
    expect(AP.powerSum(1, 3, 1, 9)).toBe(20196n);
    expect(AP.powerSum(2, 8, 1, 3)).toBe(2024n); // 2³ + … + 9³ (3D AP video)
    expect(AP.powerSum(782, 61, 7, 50)).toBe(AP.powerSumBrute(782, 61, 7, 50));
    const huge = AP.powerSum(782, 2n ** 100n, 7, 50).toString();
    expect(huge.length).toBe(1576);
    expect(huge.startsWith("631407463195053066509491173552")).toBe(true);
    expect(huge.endsWith("82715355476602650624")).toBe(true);
  });
  it("formula strings", () => {
    expect(AP.formula(3)).toBe("X·[M³ + 3·M·μ₂·s²]");
    expect(AP.dimensionalCount(10, 3)).toBe(1000n);
  });
});

describe("GP family", () => {
  it("sum / range / product", () => {
    expect(GP.sum(3, 2, 10)).toBe(3069);
    expect(GP.sumBig(3n, 2n, 10n)).toBe(3069n);
    expect(GP.range(2, 2, 2, 4)).toBe(8 + 16 + 32);
    expect(GP.sum(5, 1, 4)).toBe(20);
    expect(GP.productBig(2n, 3n, 4n)).toBe(2n * 6n * 18n * 54n);
    expect(GP.product(2, 3, 4).value).toBeCloseTo(2 * 6 * 18 * 54, 6);
    expect(GP.levelCount(2, 3)).toBe(15);
    expect(GP.levelsFor(10, 1000)).toBe(3);
  });
  it("matches enumeration", () => {
    const r = rng(3);
    for (let t = 0; t < 100; t++) {
      const a = int(r, 1, 9), q = int(r, 2, 4), n = int(r, 1, 20);
      let s = 0;
      for (let k = 0; k < n; k++) s += a * q ** k;
      expect(GP.sum(a, q, n)).toBeCloseTo(s, 6);
    }
  });
});

describe("HP family", () => {
  it("approximation is within its own error bound", () => {
    for (const N of [10, 100, 1000, 12345]) {
      const exact = HP.sumExact(N);
      const ap = HP.sumApprox(N, 3);
      expect(Math.abs(ap.value - exact)).toBeLessThanOrEqual(ap.errorBound + 1e-13);
    }
  });
  it("exact rational for small N", () => {
    expect(HP.sumRational(4).toString()).toBe("25/12");
  });
  it("reciprocal powers", () => {
    const z2 = HP.reciprocalPower(2, 1, 1_000_000);
    expect(z2.value).toBeCloseTo(Math.PI ** 2 / 6 - 1 / 1_000_000, 9);
    let s = 0;
    for (let k = 5; k <= 5000; k++) s += k ** -1.5;
    expect(HP.reciprocalPower(1.5, 5, 5000).value).toBeCloseTo(s, 9);
  });
  it("progression sum via digamma", () => {
    let s = 0;
    for (let k = 0; k < 500; k++) s += 1 / (3 + 2 * k);
    expect(HP.progressionSum(3, 2, 500).value).toBeCloseTo(s, 10);
  });
  it("dimensional H(n^d) = d ln n + γ + …", () => {
    expect(HP.sumDimensional(10, 3).value).toBeCloseTo(HP.sumExact(1000), 10);
  });
});

describe("Geometry family", () => {
  it("volumes", () => {
    expect(Geometry.ball.volume(2, 1)).toBeCloseTo(Math.PI, 12);
    expect(Geometry.ball.volume(3, 2)).toBeCloseTo((4 / 3) * Math.PI * 8, 10);
    expect(Geometry.ball.surface(3, 1)).toBeCloseTo(4 * Math.PI, 10);
    expect(Geometry.ball.peakDimension()).toBe(5);
    expect(Geometry.cube.surface(3, 2)).toBe(24);
    expect(Geometry.cube.diagonal(4, 1)).toBe(2);
    expect(Geometry.simplex.volume(2, 1)).toBeCloseTo(Math.sqrt(3) / 4, 12);
    expect(Geometry.simplex.volume(3, 1)).toBeCloseTo(1 / (6 * Math.SQRT2), 12);
    expect(Geometry.crossPolytope.volume(3, 1)).toBeCloseTo(4 / 3, 12);
  });
  it("face counts", () => {
    expect([0, 1, 2, 3].map((k) => Geometry.cube.faces(3, k))).toEqual([8, 12, 6, 1]);
    expect([0, 1, 2, 3].map((k) => Geometry.cube.faces(4, k))).toEqual([16, 32, 24, 8]);
    expect([0, 1, 2].map((k) => Geometry.simplex.faces(3, k))).toEqual([4, 6, 4]);
    expect([0, 1, 2].map((k) => Geometry.crossPolytope.faces(3, k))).toEqual([6, 12, 8]);
  });
  it("unified law with inradius", () => {
    const a = 3, d = 4;
    const V = Geometry.unified.volume("cube", d, a);
    expect(Geometry.unified.surface(d, V, a / 2)).toBeCloseTo(Geometry.cube.surface(d, a), 9);
  });
});
