import { useState } from "react";
import O, { bytes } from "../omni.js";

/**
 * Cache Lab — every number on this page is measured live on this device.
 * Compares raw vs formula storage across memory, IndexedDB and Cache Storage.
 */
export default function CacheLab() {
  const [N, setN] = useState(100_000);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [cookieMsg, setCookieMsg] = useState("");

  const run = async () => {
    setBusy(true);
    const out = [];
    const values = Array.from({ length: N }, (_, k) => 1_700_000_000 + 600 * k); // periodic timestamps
    values[Math.floor(N / 2)] += 7; // one anomaly → exception

    // compression
    let t0 = performance.now();
    const c = O.compressNumbers(values);
    const compressMs = performance.now() - t0;
    t0 = performance.now();
    const back = O.decompressNumbers(c.formula);
    const decompressMs = performance.now() - t0;
    t0 = performance.now();
    const one = O.formulaValueAt(c.formula, N - 1);
    const randomMs = performance.now() - t0;
    out.push({ test: "Formula compress (O(N) once)", ms: compressMs, size: `${bytes(c.rawBytes)} → ${bytes(c.formulaBytes)} (${c.ratio.toFixed(0)}×)` });
    out.push({ test: "Formula reconstruct all N (output-bound)", ms: decompressMs, size: back[N - 1] === values[N - 1] ? "round-trip ✓" : "mismatch ✗" });
    out.push({ test: "Formula random access 1 value", ms: randomMs, size: one === values[N - 1] ? "exact ✓" : "✗" });

    // OmniCache tiers
    const cache = new O.OmniCache({ version: "lab" });
    await cache.set("raw-object", { values: values.slice(0, 1000) });
    await cache.set("timestamps", values);
    const l0 = await cache.get("raw-object");
    const l1 = await cache.get("timestamps");
    out.push({ test: `OmniCache ${l0.tier} memory hit`, ms: l0.ms, size: "Map lookup" });
    out.push({ test: `OmniCache ${l1.tier} formula hit (rebuild N)`, ms: l1.ms, size: `${N.toLocaleString()} values` });
    const fresh = new O.OmniCache({ version: "lab" });
    const l2 = await fresh.get("timestamps");
    out.push({ test: `OmniCache ${l2?.tier ?? "L2"} IndexedDB hit (cold memory)`, ms: l2?.ms ?? NaN, size: "formula entry from disk" });

    // raw IndexedDB vs formula IndexedDB
    const idb = O.createStore("omnidim-cachelab", "kv");
    t0 = performance.now();
    await idb.set("raw", values);
    const wRaw = performance.now() - t0;
    t0 = performance.now();
    await idb.set("formula", c.formula);
    const wF = performance.now() - t0;
    t0 = performance.now();
    await idb.get("raw");
    const rRaw = performance.now() - t0;
    t0 = performance.now();
    await idb.get("formula");
    const rF = performance.now() - t0;
    out.push({ test: "IndexedDB write raw array", ms: wRaw, size: bytes(c.rawBytes) });
    out.push({ test: "IndexedDB write formula", ms: wF, size: bytes(c.formulaBytes) });
    out.push({ test: "IndexedDB read raw array", ms: rRaw, size: "" });
    out.push({ test: "IndexedDB read formula", ms: rF, size: "" });

    // Cache Storage
    if ("caches" in window) {
      const cs = await caches.open("omnidim-cachelab");
      t0 = performance.now();
      await cs.put("/__lab/raw.json", new Response(JSON.stringify(values)));
      const pRaw = performance.now() - t0;
      t0 = performance.now();
      await cs.put("/__lab/formula.json", new Response(JSON.stringify(c.formula, (_k, v) => (typeof v === "bigint" ? v.toString() : v))));
      const pF = performance.now() - t0;
      t0 = performance.now();
      await (await cs.match("/__lab/raw.json")).json();
      const mRaw = performance.now() - t0;
      t0 = performance.now();
      await (await cs.match("/__lab/formula.json")).json();
      const mF = performance.now() - t0;
      out.push({ test: "Cache Storage put raw / formula", ms: pRaw, size: `formula: ${pF.toFixed(2)} ms` });
      out.push({ test: "Cache Storage match+parse raw / formula", ms: mRaw, size: `formula: ${mF.toFixed(2)} ms` });
    }

    // memory
    const heap = O.heapUsed();
    out.push({ test: "JS heap (Chromium only)", ms: null, size: heap ? bytes(heap) : "not exposed by this browser" });
    setRows(out);
    setBusy(false);
  };

  const cookie = () => {
    try {
      O.setSessionCookie("omni_session_hint", "v1", 600);
      setCookieMsg(`Set tiny cookie omni_session_hint=${O.getCookie("omni_session_hint")} (SameSite=Strict, 10 min).`);
      O.setSessionCookie("persona_template", "x");
    } catch (e) {
      setCookieMsg((m) => `${m} Refused sensitive cookie: “${e.message}”.`);
    }
  };

  return (
    <div className="page">
      <h1>Cache Lab</h1>
      <p className="muted">L0 memory → L1 formula descriptor → L2 IndexedDB → L3 Cache Storage → L4 network. Timings are measured now, on this device — nothing is hard-coded.</p>
      <div className="row gap wrap">
        <label className="field"><span>N periodic timestamps</span><input type="number" value={N} min={10} max={5_000_000} onChange={(e) => setN(+e.target.value)} /></label>
        <button className="btn btn-primary" disabled={busy} onClick={run}>{busy ? "Measuring…" : "Run measurements"}</button>
        <button className="btn" onClick={cookie}>Cookie policy demo</button>
      </div>
      {cookieMsg && <p className="small">{cookieMsg}</p>}
      {!!rows.length && (
        <table className="table">
          <thead><tr><th>measurement</th><th>time</th><th>size / note</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.test}><td>{r.test}</td><td className="mono">{r.ms === null ? "—" : `${r.ms.toFixed(3)} ms`}</td><td>{r.size}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small">Formula descriptors shrink repetitive data; they do not make storage or cookies O(1) in general. Cookies carry only tiny session hints — never biometric, persona or AR identity data.</p>
    </div>
  );
}
