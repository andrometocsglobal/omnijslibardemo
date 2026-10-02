import { useMemo, useState } from "react";
import O from "../omni.js";

/** Complexity Lab — the library's own complexity catalogue + the honest boundary. */
export default function ComplexityLab() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => O.complexityCatalog().filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div className="page">
      <h1>Complexity Lab · Big-O</h1>
      <p className="muted">Every public API documents time, space, preprocessing and the conditions its claim depends on. O(1) always means “in N, the number of represented elements, under the stated structure”.</p>
      <div className="cards4">
        <div className="stat"><span>Structure discovery</span><b>O(N)</b></div>
        <div className="stat"><span>Formula query after discovery</span><b>O(1)*</b></div>
        <div className="stat"><span>Formula storage</span><b>O(S + E)</b></div>
        <div className="stat"><span>One regular segment</span><b>O(1) in N</b></div>
      </div>
      <input placeholder="filter… (e.g. AP, cache, horn)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-wrap">
        <table className="table small">
          <thead>
            <tr><th>operation</th><th>traditional</th><th>OMNI time</th><th>space</th><th>precondition</th><th>preprocessing</th><th>limitation</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.api}><td><code>{r.api}</code></td><td>{r.traditional}</td><td><b>{r.time}</b></td><td>{r.space}</td><td>{r.conditions}</td><td>{r.preprocessing}</td><td className="muted">{r.limitation}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>What does NOT become O(1)</h3>
      <table className="table small">
        <thead><tr><th>problem</th><th>bound</th><th>reason</th></tr></thead>
        <tbody>
          {O.NOT_O1.map((r) => (
            <tr key={r.problem}><td>{r.problem}</td><td><b>{r.bound}</b></td><td>{r.reason}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">* O(1) for supported families after structure is known. Large-integer exponentiation counts formula evaluations, not bit operations.</p>
    </div>
  );
}
