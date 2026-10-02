/**
 * Complexity classification for every public API.
 *
 * A claim is always relative to a named size variable (usually N, the number
 * of represented elements) and holds only under the stated conditions.
 * Nothing is labelled O(1) just because a benchmark used a small input.
 *
 * @typedef {"FORMULA O(1)"|"AVERAGE O(1)"|"AMORTIZED O(1)"|"FIXED-DIMENSION O(1)"|"O(log N)"|"O(N)"|"O(N log N)"|"OUTPUT-BOUND"|"NOT APPLICABLE"} ComplexityClass
 *
 * @typedef {Object} ComplexitySpec
 * @property {string} api            Public API name, e.g. "AP.sum"
 * @property {string} time
 * @property {string} space
 * @property {string} preprocessing
 * @property {string} conditions     Conditions required for the claim
 * @property {string} traditional    Cost of a conventional materialised implementation
 * @property {string} limitation     Honest caveat
 */

export const COMPLEXITY_CLASSES = [
  "FORMULA O(1)",
  "AVERAGE O(1)",
  "AMORTIZED O(1)",
  "FIXED-DIMENSION O(1)",
  "O(log N)",
  "O(N)",
  "O(N log N)",
  "OUTPUT-BOUND",
  "NOT APPLICABLE",
];

/** @type {Map<string, ComplexitySpec>} */
const registry = new Map();

/** Register (or overwrite) the complexity contract of an API. */
export function defineComplexity(spec) {
  registry.set(spec.api, spec);
  return spec;
}

/** @returns {ComplexitySpec|undefined} */
export function complexityOf(api) {
  return registry.get(api);
}

/** All registered contracts sorted by API name. */
export function complexityCatalog() {
  return [...registry.values()].sort((a, b) => a.api.localeCompare(b.api));
}

const F = "FORMULA O(1)";
const BIG =
  "Huge-integer exponentiation costs O(log k) multiplications and grows in bit cost; 'O(1)' counts formula evaluations, not bit operations.";

[
  // AP
  { api: "AP.valueAt", time: F, space: "O(1)", preprocessing: "none", conditions: "regular AP descriptor (a0, h)", traditional: "O(1) index after O(N) materialisation; O(k) on a stream", limitation: "float precision for huge k·h — use BigInt mode" },
  { api: "AP.sum", time: F, space: "O(1)", preprocessing: "none", conditions: "single AP segment", traditional: "O(N) loop", limitation: "returns the total, not the N values" },
  { api: "AP.rangeSum", time: F, space: "O(1)", preprocessing: "none", conditions: "indices inside one segment", traditional: "O(j−i) loop or O(N) prefix array", limitation: "piecewise data adds an O(log S) segment lookup" },
  { api: "AP.windowSum", time: F, space: "O(1)", preprocessing: "none", conditions: "window inside one segment", traditional: "O(W) buffer", limitation: "-" },
  { api: "AP.contains", time: F, space: "O(1)", preprocessing: "none", conditions: "known start, step, count", traditional: "O(N) scan / O(log N) search", limitation: "floats compared with tolerance" },
  { api: "AP.powerSum", time: "O(p²) in p, independent of X", space: "O(p)", preprocessing: "Bernoulli table cached per p", conditions: "fixed power p, exact BigInt rationals", traditional: "O(X) loop of p-th powers", limitation: BIG },
  // GP
  { api: "GP.sum", time: F, space: "O(1)", preprocessing: "none", conditions: "single GP segment (r = 1 handled separately)", traditional: "O(N) loop", limitation: BIG },
  { api: "GP.product", time: F, space: "O(1)", preprocessing: "none", conditions: "single GP segment", traditional: "O(N) loop", limitation: "returned in log-space so huge X does not overflow" },
  { api: "GP.levelCount", time: F, space: "O(1)", preprocessing: "none", conditions: "uniform branching factor", traditional: "O(nodes) traversal", limitation: BIG },
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
  { api: "OmniArray.valueAt", time: F, space: "O(1 + E)", preprocessing: "none", conditions: "single segment + sparse exceptions", traditional: "O(N) storage", limitation: "exceptions use a hash map (average O(1))" },
  { api: "OmniPrefix.range", time: F, space: "O(1)", preprocessing: "none", conditions: "AP/GP family", traditional: "O(N) prefix array", limitation: "HP prefix is approximate" },
  { api: "OmniWindow.sum", time: F, space: "O(1)", preprocessing: "none", conditions: "window inside one formula segment", traditional: "O(W) buffer", limitation: "exceptions inside the window add O(E_w)" },
  { api: "OmniSchedule.nearest", time: F, space: "O(1)", preprocessing: "none", conditions: "fixed interval", traditional: "O(log N) binary search over stored events", limitation: "listing K events is OUTPUT-BOUND O(K)" },
  { api: "OmniRange.contains", time: F, space: "O(1)", preprocessing: "none", conditions: "integer start/step", traditional: "O(N) scan", limitation: "-" },
  { api: "OmniFormulaIndex.get", time: "AVERAGE O(1)", space: "O(keys)", preprocessing: "none", conditions: "good hashing", traditional: "same (hash map)", limitation: "a hash index, not a formula" },
  // HORN
  { api: "HornReplay.at", time: F, space: "O(1)", preprocessing: "none", conditions: "counter-based generator", traditional: "O(N) stored random log", limitation: "NOT cryptographic" },
  { api: "HornMixer.next", time: "O(m) = O(1) for fixed m", space: "O(m·w)", preprocessing: "none", conditions: "fixed stream count m", traditional: "single PRNG O(1)", limitation: "NOT cryptographic" },
  // Gesture
  { api: "Gesture.classify", time: "O(1) per frame (21 landmarks)", space: "O(1)", preprocessing: "none", conditions: "fixed landmark count", traditional: "same", limitation: "heuristic; lighting/occlusion affect results" },
  { api: "Stroke.compress", time: "O(P)", space: "O(S + E)", preprocessing: "none", conditions: "points sampled along straight-ish runs", traditional: "store P points", limitation: "curvy strokes produce many short segments" },
  // Cache
  { api: "OmniCache.get (L0)", time: "AVERAGE O(1)", space: "O(entries)", preprocessing: "none", conditions: "Map hit", traditional: "same", limitation: "-" },
  { api: "OmniCache.get (L1 formula)", time: "FORMULA O(1) per element", space: "O(S + E) per entry", preprocessing: "O(N) compression on write", conditions: "data is formula-compressible", traditional: "O(N) stored values", limitation: "returning the full array is OUTPUT-BOUND O(N)" },
  { api: "OmniCache.get (L2 IndexedDB)", time: "I/O bound", space: "disk", preprocessing: "none", conditions: "IndexedDB available", traditional: "-", limitation: "latency is measured, never assumed" },
].forEach(defineComplexity);

/** Problems that do NOT become O(1) — the honest boundary. */
export const NOT_O1 = [
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
  { problem: "Generate N random samples", bound: "Ω(N)", reason: "replay is O(1) per sample, not for all N" },
];
