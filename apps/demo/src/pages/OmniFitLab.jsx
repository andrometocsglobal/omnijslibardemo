import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import O, { bytes, fmt } from "../omni.js";

const EXAMPLES = {
  "Irregular timestamps (min)": "00:00, 00:10, 00:20, 00:31, 00:40, 00:50, 01:01, 01:10",
  "AP with an anomaly": "10, 20, 30, 40, 55, 60, 70, 80, 90, 100",
  "GP growth": "3, 6, 12, 24, 48, 96, 192",
  "HP weights": "1, 0.5, 0.3333333333, 0.25, 0.2, 0.1666666667",
  "Hybrid run": "1, 2, 3, 4, 5, 6, 100, 200, 400, 800, 1600, 7, 9",
};

/** "hh:mm" or plain numbers → number[] (minutes for clock values). */
function parse(text) {
  return text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map((t) => (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t) ? t.split(":").reduce((a, v, i) => a + +v * [60, 1, 1 / 60][i], 0) : +t))
    .filter(Number.isFinite);
}
const clock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;

export default function OmniFitLab() {
  const [params] = useSearchParams();
  const [text, setText] = useState(EXAMPLES["Irregular timestamps (min)"]);
  useEffect(() => {
    const shared = params.get("text") || params.get("title");
    if (shared) setText(shared);
    // File Handling API (installed PWA opening a .csv/.txt)
    if ("launchQueue" in window) {
      window.launchQueue.setConsumer(async (lp) => {
        const f = await lp.files?.[0]?.getFile();
        if (f) setText(await f.text());
      });
    }
  }, [params]);

  const isClock = /\d:\d\d/.test(text);
  const values = useMemo(() => parse(text), [text]);
  const res = useMemo(() => {
    if (values.length < 2) return null;
    const scores = O.scoreFamilies(values);
    const fam = O.classifyFamily(values);
    const reg = O.regularize(values);
    const st = O.structuralize(values, { relTol: 1e-6 });
    return { scores, fam, reg, st };
  }, [values]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (f) setText(await f.text());
  };

  return (
    <div className="page">
      <h1>OmniFit Lab</h1>
      <p className="muted">Paste a sequence (numbers or hh:mm). OmniFit finds the dominant interval, snaps to the grid, keeps originals + residuals, and emits OmniSegments with sparse exceptions.</p>
      <div className="row gap wrap">
        {Object.keys(EXAMPLES).map((k) => (
          <button key={k} className="btn sm" onClick={() => setText(EXAMPLES[k])}>{k}</button>
        ))}
        <label className="btn sm">Open file <input type="file" accept=".csv,.txt,.json" hidden onChange={onFile} /></label>
      </div>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} onDrop={async (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setText(await f.text()); }} />
      {!res ? (
        <p className="muted">Enter at least two values.</p>
      ) : (
        <div className="split">
          <div className="panel">
            <h3>Detected family: {res.fam.family}</h3>
            <table className="table small">
              <thead><tr><th>family</th><th>score</th><th>parameter</th><th>dispersion</th></tr></thead>
              <tbody>
                {res.scores.map((s) => (
                  <tr key={s.family}><td>{s.family}</td><td>{s.score.toFixed(3)}</td><td>{fmt(s.parameter)}</td><td>{fmt(s.dispersion, 3)}</td></tr>
                ))}
              </tbody>
            </table>
            <h3>Regularisation</h3>
            <p>common interval h* = <b>{fmt(res.reg.interval)}</b> · confidence {(res.reg.confidence * 100).toFixed(0)}% · mean |residual| {fmt(res.reg.meanAbsResidual, 3)} · missing slots {res.reg.missingK.length ? res.reg.missingK.join(", ") : "none"}</p>
            <table className="table small">
              <thead><tr><th>#</th><th>k</th><th>original</th><th>regularised</th><th>residual</th><th>conf.</th></tr></thead>
              <tbody>
                {res.reg.rows.map((r) => (
                  <tr key={r.index} className={r.isException ? "exception" : ""}>
                    <td>{r.index}</td><td>{r.k}</td>
                    <td>{isClock ? clock(r.originalValue) : fmt(r.originalValue)}</td>
                    <td>{isClock ? clock(r.regularizedValue) : fmt(r.regularizedValue)}</td>
                    <td>{fmt(r.residual, 3)}</td><td>{r.confidence.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <h3>Generated OmniSegment (grid)</h3>
            <pre className="code">{JSON.stringify(O.serializeSegment(res.reg.segment), null, 2)}</pre>
            <h3>Structuralize (piecewise)</h3>
            <p className="small">{res.st.stats.segments} segment(s) + {res.st.stats.exceptions} exception(s) for {res.st.stats.n} values · compression {fmt(res.st.stats.compressionRatio, 3)}× · raw {bytes(O.serializedBytes(values))}</p>
            <ul className="small">
              {res.st.segments.map((s) => (
                <li key={s.id}><b>{s.family}</b> idx {String(s.startIndex)}–{String(s.endIndex)} · start {fmt(s.startValue)} · {s.family === "AP" ? `step ${fmt(s.step)}` : `ratio ${fmt(s.ratio)}`}</li>
              ))}
              {res.st.exceptions.map((e) => (
                <li key={`e${e.index}`} className="exception">exception @ {e.index}: {fmt(e.value)}</li>
              ))}
            </ul>
            <p className="muted small">Discovery is O(N); queries on the segments are O(1) in N. Values are never overwritten — residuals are stored alongside.</p>
          </div>
        </div>
      )}
    </div>
  );
}
