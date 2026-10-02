// The OMNIDIM library is loaded by <script src="/lib/omnidim.umd.js"> in
// index.html — this module simply hands the global to React components.
const O = globalThis.OmniDim;
if (!O) {
  throw new Error("OmniDim global missing: /lib/omnidim.umd.js did not load. Run `npm run build:lib` and `npm run copy-lib`.");
}
export default O;

/** Run a task in the shared Web Worker (which importScripts the same library). */
export function workerTask(type, payload) {
  return O.runInWorker("/workers/omni-worker.js", { type, payload });
}

export const fmt = (v, digits = 6) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "bigint") return v.toLocaleString("en-US");
  if (typeof v !== "number") return String(v);
  if (!Number.isFinite(v)) return String(v);
  if (v !== 0 && (Math.abs(v) >= 1e12 || Math.abs(v) < 1e-4)) return v.toExponential(digits - 1);
  return Number(v.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: digits });
};

export const bytes = (n) => {
  if (n === null || n === undefined) return "—";
  const v = typeof n === "bigint" ? Number(n) : n;
  if (v < 1024) return `${v} B`;
  const u = ["KB", "MB", "GB", "TB", "PB"];
  let x = v / 1024, i = 0;
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(x < 10 ? 2 : 1)} ${u[i]}`;
};
