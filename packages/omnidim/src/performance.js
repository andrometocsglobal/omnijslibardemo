/**
 * Benchmark harness. Never fabricates numbers: everything is measured on the
 * device running it with performance.now().
 */
import { AP } from "./ap.js";
import { OmniArray, OmniSchedule } from "./datastructures.js";
import { HornReplay, mulberry32 } from "./horn.js";
import { serializedBytes } from "./segment.js";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Time `fn` for `iterations` runs; returns median/mean/p95 in ms. */
export function bench(name, fn, { iterations = 20, warmup = 3 } = {}) {
  for (let i = 0; i < warmup; i++) fn();
  const times = [];
  let result;
  for (let i = 0; i < iterations; i++) {
    const t0 = now();
    result = fn();
    times.push(now() - t0);
  }
  times.sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  return { name, iterations, median: times[times.length >> 1], mean, p95: times[Math.floor(times.length * 0.95)] ?? times[times.length - 1], min: times[0], result };
}

/**
 * Per-call cost of a very fast operation: time `ops` calls in a batch and
 * divide (single calls are below browser timer resolution). Returns ms/call.
 */
export function benchOps(name, fn, { ops = 100_000, iterations = 5 } = {}) {
  let sink = 0;
  const r = bench(name, () => {
    for (let i = 0; i < ops; i++) sink += +fn(i) || 0;
    return sink;
  }, { iterations, warmup: 1 });
  return { ...r, perCall: r.median / ops, ops };
}

export async function benchAsync(name, fn, { iterations = 10 } = {}) {
  const times = [];
  let result;
  for (let i = 0; i < iterations; i++) {
    const t0 = now();
    result = await fn();
    times.push(now() - t0);
  }
  times.sort((a, b) => a - b);
  return { name, iterations, median: times[times.length >> 1], mean: times.reduce((a, b) => a + b, 0) / times.length, min: times[0], result };
}

/** JS heap in bytes when the browser exposes it (Chromium), else null. */
export function heapUsed() {
  return globalThis.performance?.memory?.usedJSHeapSize ?? null;
}

/**
 * The standard suite from the research benchmark matrix, at size N.
 * Each row: {benchmark, N, traditional ms, omni ms, traditional bytes, omni bytes, ratio}.
 */
export function runSuite(N = 1_000_000) {
  const rows = [];
  const a0 = 10, h = 10;

  // 1. materialised array vs OmniSegment — total
  let arr;
  const build = bench("materialise", () => {
    arr = new Float64Array(N);
    for (let i = 0; i < N; i++) arr[i] = a0 + i * h;
    return arr.length;
  }, { iterations: 5, warmup: 1 });
  const loopSum = bench("loop sum", () => {
    let s = 0;
    for (let i = 0; i < N; i++) s += arr[i];
    return s;
  }, { iterations: 10 });
  const omni = OmniArray.ap(a0, h, N);
  const formulaSum = benchOps("formula sum", () => omni.sum(), { ops: 20_000 });
  rows.push({ benchmark: "Sum of N values (build + scan vs formula)", N, traditionalMs: build.median + loopSum.median, omniMs: formulaSum.perCall, traditionalBytes: N * 8, omniBytes: omni.descriptorBytes(), check: loopSum.result === omni.sum() ? "equal" : `Δ=${Math.abs(loopSum.result - omni.sum())}` });

  // 2. prefix array vs formula prefix (range query)
  let prefix;
  const prefixBuild = bench("prefix build", () => {
    prefix = new Float64Array(N + 1);
    for (let i = 0; i < N; i++) prefix[i + 1] = prefix[i] + arr[i];
    return prefix.length;
  }, { iterations: 5, warmup: 1 });
  const span = Math.max(1, Math.floor(N / 3));
  const prefixQ = benchOps("prefix query", (k) => prefix[(k % span) + span + 1] - prefix[k % span]);
  const formulaQ = benchOps("formula range", (k) => AP.rangeSum(a0, h, k % span, (k % span) + span));
  const qi = 7 % span;
  const same = Math.abs(prefix[qi + span + 1] - prefix[qi] - AP.rangeSum(a0, h, qi, qi + span)) < 1e-6 * AP.rangeSum(a0, h, qi, qi + span);
  rows.push({ benchmark: "Range sum (prefix build + query vs formula)", N, traditionalMs: prefixBuild.median + prefixQ.perCall, omniMs: formulaQ.perCall, traditionalBytes: (N + 1) * 8, omniBytes: 3 * 8, check: same ? "equal" : "float drift" });
  rows.push({ benchmark: "Range sum — query only (after prefix built)", N, traditionalMs: prefixQ.perCall, omniMs: formulaQ.perCall, traditionalBytes: (N + 1) * 8, omniBytes: 3 * 8, check: "both O(1) per query; formula needs no O(N) table" });

  // 3. nearest scheduled event: binary search vs formula
  const sched = new OmniSchedule(0, 600, N);
  const events = arr; // sorted regular event times
  const tgt = (k) => a0 + ((k * 7919) % N) * h + 3.7;
  const bsearch = benchOps("binary search", (k) => {
    const target = tgt(k);
    let lo = 0, hi = N - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (events[m] < target) lo = m + 1;
      else hi = m;
    }
    return lo;
  });
  const nearestF = benchOps("formula nearest", (k) => AP.nearest(a0, h, tgt(k), N));
  rows.push({ benchmark: "Nearest regular event (per query)", N, traditionalMs: bsearch.perCall, omniMs: nearestF.perCall, traditionalBytes: N * 8, omniBytes: serializedBytes({ start: sched.start, interval: sched.interval, count: sched.count }), check: "O(log N) vs O(1)" });

  // 4. random replay log vs counter replay
  const R = Math.min(N, 200_000);
  let log;
  const logBuild = bench("random log", () => {
    const g = mulberry32(7);
    log = new Float64Array(R);
    for (let k = 0; k < R; k++) log[k] = g.next();
    return log[R - 1];
  }, { iterations: 3, warmup: 1 });
  const replay = new HornReplay(7);
  const replayQ = benchOps("counter replay", (k) => replay.at(0, k % R));
  rows.push({ benchmark: `Replay any of ${R} samples (log build vs counter)`, N: R, traditionalMs: logBuild.median, omniMs: replayQ.perCall, traditionalBytes: R * 8, omniBytes: 3 * 8, check: "log needed vs (seed, worker, counter)" });

  // 5. JSON state vs formula state
  const sample = Array.from({ length: Math.min(N, 100_000) }, (_, k) => a0 + k * h);
  const jsonBytes = serializedBytes(sample);
  rows.push({ benchmark: "Serialized state (JSON)", N: sample.length, traditionalMs: null, omniMs: null, traditionalBytes: jsonBytes, omniBytes: serializedBytes(AP.describe(a0, h, sample.length)), check: "bytes only" });

  arr = prefix = log = null;
  return rows.map((r) => ({ ...r, compressionRatio: r.omniBytes ? r.traditionalBytes / r.omniBytes : null, speedup: r.traditionalMs != null && r.omniMs ? r.traditionalMs / r.omniMs : null }));
}
