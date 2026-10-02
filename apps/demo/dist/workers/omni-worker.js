/* Web Worker that reuses the OMNIDIM library through importScripts —
 * the same <script> build the page uses. Runs heavy work off the UI thread. */
importScripts("/lib/omnidim.umd.js");
const O = self.OmniDim;

self.onmessage = (e) => {
  const { type, payload } = e.data || {};
  try {
    if (type === "suite") {
      self.postMessage({ ok: true, rows: O.runSuite(payload.N) });
    } else if (type === "persona-task") {
      // Local, read-only 4D work: OMNIBAL computation + HORN simulation.
      const t0 = performance.now();
      const ps = O.AP.powerSum(1, payload.X ?? 1_000_000, 1, payload.p ?? 3).toString();
      const replay = new O.HornReplay(payload.seed ?? 7);
      let acc = 0;
      const sims = payload.sims ?? 50_000;
      for (let i = 0; i < sims; i++) acc += replay.at(0, i);
      self.postMessage({ ok: true, powerSum: ps, monteCarloMean: acc / sims, ms: performance.now() - t0 });
    } else if (type === "powersum") {
      const t0 = performance.now();
      const v = O.AP.powerSum(payload.F, BigInt(payload.X), payload.s, payload.p).toString();
      self.postMessage({ ok: true, value: v, digits: v.replace("-", "").length, ms: performance.now() - t0 });
    } else self.postMessage({ ok: false, error: `unknown task ${type}` });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};
