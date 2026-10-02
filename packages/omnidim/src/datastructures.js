/**
 * Formula-based data structures. None of them materialise the represented
 * values; complexity is stated relative to N (represented elements).
 */
import { AP } from "./ap.js";
import { GP } from "./gp.js";
import { HP } from "./hp.js";
import { coordinateToIndex, dimensionalCount, indexToCoordinate, nearestGridCell, strideMap } from "./geometry.js";
import { ExceptionIndex, apSegment, gpSegment, segmentFormulaAt, segmentRangeSum, segmentValueAt, serializeSegment, serializedBytes } from "./segment.js";

/** One formula + sparse exceptions. Space O(1 + E). */
export class OmniArray {
  constructor(segment) {
    this.segment = segment;
  }
  static ap(start, step, length) {
    return new OmniArray(apSegment(start, step, length));
  }
  static gp(start, ratio, length) {
    return new OmniArray(gpSegment(start, ratio, length));
  }
  get length() {
    return this.segment.count;
  }
  /** FORMULA O(1) — no earlier element is built. */
  valueAt(k) {
    return segmentValueAt(this.segment, this.segment.startIndex + BigInt(k));
  }
  /** Override one element sparsely. AVERAGE O(1). */
  set(k, value, reason = "override") {
    const idx = this.segment.startIndex + BigInt(k);
    this.segment.exceptions ??= new ExceptionIndex();
    this.segment.exceptions.set(idx, value, segmentFormulaAt(this.segment, idx), reason);
  }
  /** Total. FORMULA O(1) + O(E). */
  sum() {
    return segmentRangeSum(this.segment, this.segment.startIndex, this.segment.endIndex);
  }
  /** Sum of i..j. FORMULA O(1) + O(E in range). */
  rangeSum(i, j) {
    const s = this.segment.startIndex;
    return segmentRangeSum(this.segment, s + BigInt(i), s + BigInt(j));
  }
  /** OUTPUT-BOUND O(limit). */
  toArray(limit = 1000) {
    const n = Number(this.length < BigInt(limit) ? this.length : BigInt(limit));
    return Array.from({ length: n }, (_, k) => this.valueAt(k));
  }
  descriptorBytes() {
    return serializedBytes(serializeSegment(this.segment));
  }
  /** Size of the equivalent Float64Array. */
  materializedBytes() {
    return this.length * 8n;
  }
}

/** Integer range(start, stop, step) on BigInt. Every op O(1). */
export class OmniRange {
  constructor(start, stop, step = 1n) {
    this.start = BigInt(start);
    this.stop = BigInt(stop);
    this.step = BigInt(step);
    if (this.step === 0n) throw new RangeError("OmniRange: step must be non-zero");
  }
  static of(start, stop, step = 1) {
    return new OmniRange(start, stop, step);
  }
  get length() {
    const { start, stop, step } = this;
    if (step > 0n) return stop > start ? (stop - start + step - 1n) / step : 0n;
    return start > stop ? (start - stop - step - 1n) / -step : 0n;
  }
  at(k) {
    const K = BigInt(k);
    if (K < 0n || K >= this.length) throw new RangeError("OmniRange.at: out of range");
    return this.start + K * this.step;
  }
  /** (x − start) mod step == 0 and in bounds. FORMULA O(1). */
  contains(x) {
    const off = BigInt(x) - this.start;
    if (off % this.step !== 0n) return false;
    const k = off / this.step;
    return k >= 0n && k < this.length;
  }
  indexOf(x) {
    return this.contains(x) ? (BigInt(x) - this.start) / this.step : -1n;
  }
  /** Exact total. FORMULA O(1). */
  sum() {
    return AP.sumBig(this.start, this.step, this.length);
  }
  /** Elements within [lo, hi]. O(1). (positive step) */
  countBetween(lo, hi) {
    const L = BigInt(lo), H = BigInt(hi), n = this.length;
    if (n === 0n || H < L) return 0n;
    const ceilDiv = (a, b) => (a >= 0n ? (a + b - 1n) / b : -(-a / b));
    const floorDiv = (a, b) => (a >= 0n ? a / b : -((-a + b - 1n) / b));
    let kLo = ceilDiv(L - this.start, this.step);
    let kHi = floorDiv(H - this.start, this.step);
    if (kLo < 0n) kLo = 0n;
    if (kHi > n - 1n) kHi = n - 1n;
    return kHi >= kLo ? kHi - kLo + 1n : 0n;
  }
}

/** Piecewise segments + exceptions. Space O(S + E). */
export class OmniSequence {
  constructor(segments) {
    this.segments = [...segments].sort((a, b) => (a.startIndex < b.startIndex ? -1 : 1));
  }
  get length() {
    const last = this.segments[this.segments.length - 1];
    return last ? last.endIndex + 1n : 0n;
  }
  /** Binary search: O(log S). */
  segmentFor(index) {
    const i = BigInt(index);
    let lo = 0, hi = this.segments.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const s = this.segments[mid];
      if (i < s.startIndex) hi = mid - 1;
      else if (i > s.endIndex) lo = mid + 1;
      else return s;
    }
    return undefined;
  }
  /** O(log S) + FORMULA O(1). */
  valueAt(index) {
    const s = this.segmentFor(index);
    if (!s) throw new RangeError(`OmniSequence: no segment covers ${index}`);
    return segmentValueAt(s, index);
  }
  /** O(segments touched). */
  rangeSum(i, j) {
    const lo = BigInt(i), hi = BigInt(j);
    let total = 0;
    for (const s of this.segments) {
      if (s.endIndex < lo || s.startIndex > hi) continue;
      total += segmentRangeSum(s, lo > s.startIndex ? lo : s.startIndex, hi < s.endIndex ? hi : s.endIndex);
    }
    return total;
  }
  get exceptionCount() {
    return this.segments.reduce((a, s) => a + (s.exceptions?.size ?? 0), 0);
  }
  descriptorBytes() {
    return serializedBytes(this.segments.map(serializeSegment));
  }
}

/** Formula prefix — replaces an O(N) prefix array. */
export class OmniPrefix {
  /** @param {"AP"|"GP"|"HP"} family */
  constructor(family, a, stepOrRatio) {
    Object.assign(this, { family, a, stepOrRatio });
  }
  /** Prefix(k) = sum of first k terms. FORMULA O(1) (HP: fixed-precision). */
  at(k) {
    if (this.family === "AP") return AP.prefix(this.a, this.stepOrRatio, k);
    if (this.family === "GP") return GP.prefix(this.a, this.stepOrRatio, k);
    return k <= 0 ? 0 : HP.progressionSum(this.a, this.stepOrRatio, k).value;
  }
  /** RangeSum(i, j) = F(j+1) − F(i). */
  range(i, j) {
    return j < i ? 0 : this.at(j + 1) - this.at(i);
  }
}

/** Sliding window without a buffer. */
export class OmniWindow {
  constructor(prefix, width) {
    this.prefix = prefix;
    this.width = width;
  }
  /** WindowSum(k) = Prefix(k+1) − Prefix(k+1−w). FORMULA O(1). */
  sum(k) {
    return this.prefix.at(k + 1) - this.prefix.at(Math.max(0, k + 1 - this.width));
  }
  average(k) {
    return this.sum(k) / Math.min(this.width, k + 1);
  }
}

/** Periodic schedule start + k·interval. Every query O(1). */
export class OmniSchedule {
  constructor(start, interval, count = Infinity) {
    if (interval <= 0) throw new RangeError("OmniSchedule: interval must be > 0");
    Object.assign(this, { start, interval, count });
  }
  at(k) {
    if (k < 0 || k >= this.count) throw new RangeError("OmniSchedule.at: out of range");
    return this.start + k * this.interval;
  }
  /** k = round((t − start)/interval), clamped. */
  nearestIndex(t) {
    return Math.min(Math.max(0, Math.round((t - this.start) / this.interval)), this.count - 1);
  }
  nearest(t) {
    return this.at(this.nearestIndex(t));
  }
  next(t) {
    const k = Math.max(0, Math.floor((t - this.start) / this.interval) + 1);
    return k < this.count ? this.start + k * this.interval : NaN;
  }
  previous(t) {
    const k = Math.min(Math.ceil((t - this.start) / this.interval) - 1, this.count - 1);
    return k >= 0 ? this.start + k * this.interval : NaN;
  }
  /** Events in [t1, t2]. O(1). */
  countBetween(t1, t2) {
    if (t2 < t1) return 0;
    const lo = Math.max(0, Math.ceil((t1 - this.start) / this.interval - 1e-12));
    const hi = Math.min(this.count - 1, Math.floor((t2 - this.start) / this.interval + 1e-12));
    return hi >= lo ? hi - lo + 1 : 0;
  }
  /** OUTPUT-BOUND O(K). */
  list(k0, K) {
    const out = [];
    for (let k = k0; k < Math.min(this.count, k0 + K); k++) out.push(this.at(k));
    return out;
  }
}

/** Regular d-dimensional grid. Fixed-d queries O(1). */
export class OmniGrid {
  constructor(shape, origin = shape.map(() => 0), spacing = shape.map(() => 1)) {
    Object.assign(this, { shape, origin, spacing, strides: strideMap(shape) });
  }
  get size() {
    return dimensionalCount(this.shape);
  }
  toIndex(coord) {
    return coordinateToIndex(coord, this.shape, this.strides);
  }
  toCoord(index) {
    return indexToCoordinate(index, this.shape);
  }
  position(coord) {
    return coord.map((c, i) => this.origin[i] + c * this.spacing[i]);
  }
  nearest(point) {
    return nearestGridCell(point, this.origin, this.spacing, this.shape);
  }
}

/** Hash index (AVERAGE O(1)) of named OmniSequences (FORMULA O(1) queries). */
export class OmniFormulaIndex {
  constructor() {
    this.map = new Map();
  }
  set(key, seq) {
    this.map.set(key, seq);
  }
  get(key) {
    return this.map.get(key);
  }
  valueAt(key, index) {
    return this.map.get(key)?.valueAt(index);
  }
  keys() {
    return [...this.map.keys()];
  }
  get size() {
    return this.map.size;
  }
}

export { ExceptionIndex as OmniSparseExceptionMap };
