import { useEffect, useState } from "react";
import O, { bytes, fmt, workerTask } from "../omni.js";

const time = (ms) => (ms == null ? "—" : ms >= 1 ? `${ms.toFixed(2)} ms` : ms >= 0.001 ? `${(ms * 1000).toFixed(2)} µs` : `${(ms * 1e6).toFixed(1)} ns`);

/** Runs the library's benchmark suite in a Web Worker and reports real numbers. */
export default function Performance() {
  const [N, setN] = useState(1_000_000);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [nav, setNav] = useState(null);
  const [lcp, setLcp] = useState(null);

  useEffect(() => {
    const e = performance.getEntriesByType("navigation")[0];
    if (e) setNav({ type: e.type, ttfb: e.responseStart, dcl: e.domContentLoadedEventEnd, load: e.loadEventEnd, transfer: e.transferSize, sw: !!navigator.serviceWorker?.controller });
    let po;
    try {
      po = new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) setLcp(last.startTime);
      });
      po.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}
    return () => po?.disconnect();
  }, []);

  const run = async () => {
    setBusy(true);
    try {
      const r = await workerTask("suite", { N });
      setRows(r.ok ? r.rows : [{ benchmark: r.error }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Performance</h1>
      <p className="muted">Benchmarks run in a Web Worker (which loads the same <code>omnidim.umd.js</code> via importScripts). Results are measured on this device — run them yourself; nothing is pre-filled.</p>
      {nav && (
        <div className="cards4">
          <div className="stat"><span>Start</span><b>{nav.sw ? "warm (SW cache)" : "cold"}</b></div>
          <div className="stat"><span>TTFB</span><b>{nav.ttfb.toFixed(0)} ms</b></div>
          <div className="stat"><span>DOMContentLoaded</span><b>{nav.dcl.toFixed(0)} ms</b></div>
          <div className="stat"><span>LCP</span><b>{lcp ? `${lcp.toFixed(0)} ms` : "—"}</b></div>
        </div>
      )}
      <div className="row gap wrap">
        <label className="field"><span>N</span><input type="number" value={N} min={1000} max={20_000_000} onChange={(e) => setN(+e.target.value)} /></label>
        <button className="btn btn-primary" disabled={busy} onClick={run}>{busy ? "Measuring…" : "Run benchmark suite"}</button>
      </div>
      {rows && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>benchmark</th><th>N</th><th>traditional</th><th>OMNI</th><th>speed-up</th><th>traditional size</th><th>OMNI size</th><th>ratio</th><th>check</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.benchmark}>
                  <td>{r.benchmark}</td><td>{fmt(r.N)}</td>
                  <td className="mono">{time(r.traditionalMs)}</td>
                  <td className="mono">{time(r.omniMs)}</td>
                  <td>{r.speedup ? `${fmt(r.speedup, 3)}×` : "—"}</td>
                  <td>{bytes(r.traditionalBytes)}</td><td>{bytes(r.omniBytes)}</td>
                  <td>{r.compressionRatio ? `${fmt(r.compressionRatio, 3)}×` : "—"}</td>
                  <td className="muted small">{r.check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">Fast O(1) operations are timed as batches of 100,000 calls and divided (single calls are below browser timer resolution). Where noted, the “traditional” column includes the O(N) build that the formula avoids.</p>
    </div>
  );
}
