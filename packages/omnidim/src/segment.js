/**
 * OmniSegment — formula-compressed descriptor + sparse exceptions.
 *
 *   Space = O(S + E)       (S segments, E exceptions)
 *   One perfectly regular run → O(1) relative to N.
 *
 * @typedef {"AP"|"GP"|"HP"|"GEOMETRY"|"HYBRID"} Family
 * @typedef {Object} OmniSegment
 * @property {string} id
 * @property {Family} family
 * @property {bigint} startIndex
 * @property {bigint} endIndex      inclusive
 * @property {number} [startValue]
 * @property {number} [step]
 * @property {number} [ratio]
 * @property {bigint} count
 * @property {number} [power]
 * @property {number} [dimension]
 * @property {number} [residualTolerance]
 * @property {number} confidence
 * @property {ExceptionIndex} [exceptions]
 * @property {Object} [metadata]
 */
import { AP } from "./ap.js";
import { GP } from "./gp.js";

/** Sparse exception index keyed by absolute position. AVERAGE O(1). */
export class ExceptionIndex {
  constructor() {
    this.map = new Map();
  }
  set(index, value, expected, reason) {
    const i = BigInt(index);
    this.map.set(i, { index: i, value, expected, reason });
  }
  get(index) {
    return this.map.get(BigInt(index));
  }
  has(index) {
    return this.map.has(BigInt(index));
  }
  delete(index) {
    return this.map.delete(BigInt(index));
  }
  get size() {
    return this.map.size;
  }
  /** Exceptions with lo ≤ index ≤ hi, sorted. O(E). */
  inRange(lo, hi) {
    const L = BigInt(lo), H = BigInt(hi);
    const out = [];
    for (const r of this.map.values()) if (r.index >= L && r.index <= H) out.push(r);
    return out.sort((a, b) => (a.index < b.index ? -1 : a.index > b.index ? 1 : 0));
  }
  values() {
    return [...this.map.values()].sort((a, b) => (a.index < b.index ? -1 : 1));
  }
  toJSON() {
    return this.values().map((r) => ({ ...r, index: r.index.toString() }));
  }
}

let seq = 0;
export function makeSegmentId(prefix = "seg") {
  seq = (seq + 1) % 1e9;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`;
}

function base(family, count, startIndex, confidence, extra) {
  const c = BigInt(count);
  const s = BigInt(startIndex);
  return { id: makeSegmentId(family.toLowerCase()), family, startIndex: s, endIndex: s + c - 1n, count: c, confidence, exceptions: new ExceptionIndex(), ...extra };
}

/** AP segment covering [startIndex, startIndex + count). */
export const apSegment = (startValue, step, count, startIndex = 0n, confidence = 1) => base("AP", count, startIndex, confidence, { startValue, step });
/** GP segment. */
export const gpSegment = (startValue, ratio, count, startIndex = 0n, confidence = 1) => base("GP", count, startIndex, confidence, { startValue, ratio });
/** HP segment: values 1/(startValue + k·step). */
export const hpSegment = (firstDenominator, step, count, startIndex = 0n, confidence = 1) => base("HP", count, startIndex, confidence, { startValue: firstDenominator, step });

/** Formula value at absolute index (ignores exceptions). FORMULA O(1). */
export function segmentFormulaAt(seg, index) {
  const k = Number(BigInt(index) - seg.startIndex);
  switch (seg.family) {
    case "AP":
      return AP.valueAt(seg.startValue ?? 0, seg.step ?? 0, k);
    case "GP":
      return GP.valueAt(seg.startValue ?? 1, seg.ratio ?? 1, k);
    case "HP":
      return 1 / ((seg.startValue ?? 1) + k * (seg.step ?? 1));
    default:
      throw new Error(`segmentFormulaAt: family ${seg.family} has no scalar formula`);
  }
}

/** Value at absolute index, honouring exceptions. AVERAGE O(1). */
export function segmentValueAt(seg, index) {
  const i = BigInt(index);
  if (i < seg.startIndex || i > seg.endIndex) throw new RangeError(`index ${i} outside segment ${seg.id}`);
  const ex = seg.exceptions?.get(i);
  return ex ? ex.value : segmentFormulaAt(seg, i);
}

/** Sum over absolute indices [i, j] including exception deltas. */
export function segmentRangeSum(seg, i, j) {
  const lo = BigInt(i), hi = BigInt(j);
  const a = Number(lo - seg.startIndex), b = Number(hi - seg.startIndex);
  let total;
  if (seg.family === "AP") total = AP.rangeSum(seg.startValue ?? 0, seg.step ?? 0, a, b);
  else if (seg.family === "GP") total = GP.range(seg.startValue ?? 1, seg.ratio ?? 1, a, b);
  else {
    // HP has no exact closed form — honest O(length) fallback.
    total = 0;
    for (let k = a; k <= b; k++) total += 1 / ((seg.startValue ?? 1) + k * (seg.step ?? 1));
  }
  if (seg.exceptions?.size) for (const ex of seg.exceptions.inRange(lo, hi)) total += ex.value - segmentFormulaAt(seg, ex.index);
  return total;
}

/** JSON-safe form (bigint → string). */
export function serializeSegment(seg) {
  return { ...seg, startIndex: seg.startIndex.toString(), endIndex: seg.endIndex.toString(), count: seg.count.toString(), exceptions: seg.exceptions ? seg.exceptions.toJSON() : [] };
}

export function deserializeSegment(s) {
  const ex = new ExceptionIndex();
  for (const r of s.exceptions ?? []) ex.set(BigInt(r.index), r.value, r.expected, r.reason);
  return { ...s, startIndex: BigInt(s.startIndex), endIndex: BigInt(s.endIndex), count: BigInt(s.count), exceptions: ex };
}

/** UTF-8 JSON byte size (bigint-safe) — used for compression ratios. */
export function serializedBytes(value) {
  const json = JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)) ?? "";
  return new TextEncoder().encode(json).length;
}
