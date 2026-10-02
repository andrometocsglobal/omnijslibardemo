/**
 * OmniFit — structure discovery & regularisation.
 *
 *   RAW → Δ / ratio extraction → family scoring → dominant interval →
 *   snap-to-grid → residuals → classification → segments → exceptions
 *
 *   k_i = round((t_i − t0)/h*),   t̂_i = t0 + k_i·h*
 *
 * Discovery is O(N) (must read the data). Afterwards, supported queries on
 * the produced OmniSegments are O(1) in N. Originals are never overwritten.
 */
import { median } from "./math.js";
import { ExceptionIndex, apSegment, gpSegment } from "./segment.js";

/** Δ_i = x_i − x_{i−1}. O(N). */
export function differences(xs) {
  const out = [];
  for (let i = 1; i < xs.length; i++) out.push(xs[i] - xs[i - 1]);
  return out;
}

/** x_i / x_{i−1} (NaN where undefined). O(N). */
export function ratios(xs) {
  const out = [];
  for (let i = 1; i < xs.length; i++) out.push(xs[i - 1] === 0 ? NaN : xs[i] / xs[i - 1]);
  return out;
}

/**
 * Robust dominant interval h*: median of positive differences, refined by
 * averaging differences inside a tolerance band; gaps ≈ m·h count as m steps.
 * O(N log N) (median sort).
 */
export function estimateInterval(values, relTol = 0.25) {
  const all = differences(values);
  const diffs = all.filter((d) => d > 0);
  if (!diffs.length) return { interval: NaN, confidence: 0, differences: all };
  const med = median(diffs);
  let num = 0, den = 0, inBand = 0;
  for (const d of diffs) {
    const m = Math.max(1, Math.round(d / med));
    if (Math.abs(d / m - med) <= relTol * med) {
      num += d;
      den += m;
      inBand++;
    }
  }
  return { interval: den ? num / den : med, confidence: inBand / diffs.length, differences: all };
}

/** Snap an interval to a "nice" value within tolerance (9.86 → 10). */
export function niceInterval(h, relTol = 0.05) {
  if (!Number.isFinite(h) || h <= 0) return h;
  const mag = Math.pow(10, Math.floor(Math.log10(h)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const unit = (mag * step) / 10;
    const c = Math.round(h / unit) * unit;
    if (Math.abs(c - h) <= relTol * h) return Number(c.toPrecision(12));
  }
  return h;
}

/**
 * Snap observations to a regular grid. Keeps originalValue, regularizedValue,
 * residual and confidence per row. |residual| > exceptionTol·h, or a second
 * observation on the same slot, is flagged as an exception.
 */
export function regularize(values, opts = {}) {
  if (!values.length) throw new RangeError("regularize: empty input");
  const est = estimateInterval(values);
  let h = opts.interval ?? est.interval;
  if (opts.nice !== false && opts.interval === undefined) h = niceInterval(h);
  const t0 = opts.t0 ?? values[0];
  const tol = opts.exceptionTol ?? 0.3;
  const seen = new Set();
  let absSum = 0;
  const rows = values.map((v, index) => {
    const k = Math.round((v - t0) / h);
    const reg = t0 + k * h;
    const residual = v - reg;
    const rel = Math.abs(residual) / h;
    const isException = rel > tol || seen.has(k);
    seen.add(k);
    absSum += Math.abs(residual);
    return { index, k, originalValue: v, regularizedValue: reg, residual, confidence: Math.max(0, 1 - 2 * rel), isException };
  });
  const exceptions = rows.filter((r) => r.isException);
  const maxK = Math.max(...rows.map((r) => r.k));
  const missingK = [];
  if (maxK < 1e6) for (let k = 0; k <= maxK; k++) if (!seen.has(k)) missingK.push(k);
  const segment = apSegment(t0, h, BigInt(maxK + 1), 0n, est.confidence);
  segment.residualTolerance = tol * h;
  segment.exceptions = new ExceptionIndex();
  for (const r of exceptions) segment.exceptions.set(r.k, r.originalValue, r.regularizedValue, "residual");
  segment.metadata = { source: "OmniFit.regularize", observations: values.length, missing: missingK.length };
  return {
    t0,
    interval: h,
    rows,
    exceptions,
    segment,
    missingK,
    meanAbsResidual: absSum / values.length,
    confidence: est.confidence * (1 - exceptions.length / values.length),
  };
}

function dispersion(xs) {
  const finite = xs.filter(Number.isFinite);
  if (!finite.length) return { center: NaN, rel: Infinity };
  const c = median(finite);
  const spread = median(finite.map((x) => Math.abs(x - c)));
  return { center: c, rel: spread / Math.max(Math.abs(c), 1e-12) + (finite.length < xs.length ? 1 : 0) };
}

/** Score AP / GP / HP candidates. O(N log N). */
export function scoreFamilies(values) {
  if (values.length < 3) return [{ family: "NOISE", dispersion: Infinity, parameter: NaN, score: 0 }];
  const ap = dispersion(differences(values));
  const gp = values.some((v) => v === 0) ? { center: NaN, rel: Infinity } : dispersion(ratios(values));
  const hp = values.every((v) => v !== 0) ? dispersion(differences(values.map((v) => 1 / v))) : { center: NaN, rel: Infinity };
  const toScore = (rel) => (Number.isFinite(rel) ? 1 / (1 + 50 * rel) : 0);
  return [
    { family: "AP", dispersion: ap.rel, parameter: ap.center, score: toScore(ap.rel) },
    { family: "GP", dispersion: gp.rel, parameter: gp.center, score: toScore(gp.rel) * (Math.abs(gp.center - 1) < 1e-9 ? 0.5 : 1) },
    { family: "HP", dispersion: hp.rel, parameter: hp.center, score: toScore(hp.rel) * 0.98 },
  ].sort((a, b) => b.score - a.score);
}

/** Best family, or NOISE when nothing fits. */
export function classify(values, minScore = 0.5) {
  const best = scoreFamilies(values)[0];
  return best.score >= minScore ? best : { ...best, family: "NOISE" };
}

/**
 * Greedy piecewise segmentation into AP/GP runs + sparse exceptions.
 * Single pass O(N); output O(S + E).
 */
export function structuralize(values, opts = {}) {
  const relTol = opts.relTol ?? 1e-9;
  const minRun = Math.max(3, opts.minRun ?? 3);
  const n = values.length;
  const segments = [];
  const exceptions = [];
  const close = (a, b) => Math.abs(a - b) <= relTol * Math.max(1, Math.abs(a), Math.abs(b));
  let i = 0;
  while (i < n) {
    if (i + 2 >= n) {
      for (; i < n; i++) exceptions.push({ index: i, value: values[i] });
      break;
    }
    const a = values[i];
    const step = values[i + 1] - a;
    let j = i + 1;
    while (j + 1 < n && close(values[j + 1] - values[j], step)) j++;
    const apLen = j - i + 1;
    let gpLen = 0, ratio = NaN;
    if (a !== 0) {
      ratio = values[i + 1] / a;
      let g = i + 1;
      while (g + 1 < n && values[g] !== 0 && close(values[g + 1] / values[g], ratio)) g++;
      gpLen = g - i + 1;
    }
    if (apLen >= minRun && apLen >= gpLen) {
      segments.push(apSegment(a, step, apLen, i));
      i += apLen;
    } else if (gpLen >= minRun) {
      segments.push(gpSegment(a, ratio, gpLen, i));
      i += gpLen;
    } else {
      exceptions.push({ index: i, value: a });
      i += 1;
    }
  }
  const descriptorTerms = segments.length * 4 + exceptions.length * 2;
  return {
    segments,
    exceptions,
    stats: { n, segments: segments.length, exceptions: exceptions.length, descriptorTerms, compressionRatio: descriptorTerms ? n / descriptorTerms : Infinity },
  };
}

/**
 * Streaming OmniFit: O(1) active state, amortised O(1) per push.
 * Emits a closed segment whenever the pattern breaks.
 */
export class OmniFitStream {
  constructor(relTol = 1e-9) {
    this.relTol = relTol;
    this.segments = [];
    this.exceptions = [];
    this.index = 0;
    this.count = 0;
    this.family = null;
    this.param = NaN;
  }
  _close(a, b) {
    return Math.abs(a - b) <= this.relTol * Math.max(1, Math.abs(a), Math.abs(b));
  }
  _fits(x, family, param) {
    return family === "AP" ? this._close(x - this.last, param) : this.last !== 0 && this._close(x / this.last, param);
  }
  _begin(idx, x) {
    this.start = idx;
    this.first = this.prev = this.last = x;
    this.count = 1;
    this.family = null;
    this.param = NaN;
  }
  _emit() {
    const seg = this.family === "AP" ? apSegment(this.first, this.param, this.count, this.start) : gpSegment(this.first, this.param, this.count, this.start);
    this.segments.push(seg);
    return seg;
  }
  /** Feed one value; returns a segment when one closes. */
  push(x) {
    const idx = this.index++;
    if (this.count === 0) {
      this._begin(idx, x);
      return null;
    }
    if (this.count === 1) {
      this.prev = this.last;
      this.last = x;
      this.count = 2;
      return null;
    }
    if (this.family === null) {
      const step = this.last - this.prev;
      const ratio = this.prev !== 0 ? this.last / this.prev : NaN;
      if (this._fits(x, "AP", step)) [this.family, this.param] = ["AP", step];
      else if (Number.isFinite(ratio) && this._fits(x, "GP", ratio)) [this.family, this.param] = ["GP", ratio];
      else {
        this.exceptions.push({ index: this.start, value: this.first });
        this.start += 1;
        this.first = this.prev = this.last;
        this.last = x;
        return null;
      }
    } else if (!this._fits(x, this.family, this.param)) {
      const closed = this._emit();
      this._begin(idx, x);
      return closed;
    }
    this.prev = this.last;
    this.last = x;
    this.count++;
    return null;
  }
  /** Close the active run at end of stream. */
  end() {
    let closed = null;
    if (this.family && this.count >= 3) closed = this._emit();
    else if (this.count >= 1) {
      this.exceptions.push({ index: this.start, value: this.first });
      if (this.count === 2) this.exceptions.push({ index: this.start + 1, value: this.last });
    }
    this.count = 0;
    this.family = null;
    return closed;
  }
}

export const OmniFit = { differences, ratios, estimateInterval, niceInterval, regularize, scoreFamilies, classify, structuralize, OmniFitStream };
