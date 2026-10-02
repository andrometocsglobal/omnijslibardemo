import { useEffect, useMemo, useRef, useState } from "react";
import O, { bytes } from "../omni.js";

/** HORN lab: mixer weights, counter replay, missing-data scenarios. */
export default function HornLab() {
  const [seed, setSeed] = useState(2026);
  const [worker, setWorker] = useState(0);
  const [counter, setCounter] = useState(1_000_000_000);
  const [mix, setMix] = useState(null);
  const canvasRef = useRef(null);

  const replay = useMemo(() => new O.HornReplay(seed), [seed]);
  const sample = replay.at(worker, counter);

  const runMixer = () => {
    const stuck = { name: "faulty (stuck)", next: () => 0.42 };
    const m = new O.HornMixer([...O.defaultStreams(seed), stuck], { window: 256 });
    const t0 = performance.now();
    const out = Array.from({ length: 4096 }, () => m.next());
    const ms = performance.now() - t0;
    setMix({ weights: m.streams.map((s, i) => ({ name: s.name, w: m.weights[i] })), active: m.active(), ks: O.ksUniform(out), ms, out });
  };
  useEffect(runMixer, [seed]);

  const scenarios = useMemo(() => O.bridgeScenarios(105, 121, 2, { scenarios: 6, seed }), [seed]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !mix) return;
    const g = c.getContext("2d");
    g.clearRect(0, 0, c.width, c.height);
    const bins = new Array(32).fill(0);
    mix.out.forEach((u) => bins[Math.min(31, Math.floor(u * 32))]++);
    const max = Math.max(...bins);
    bins.forEach((b, i) => {
      const h = (b / max) * (c.height - 10);
      g.fillStyle = "#22d3ee";
      g.fillRect(i * (c.width / 32) + 1, c.height - h, c.width / 32 - 2, h);
    });
  }, [mix]);

  return (
    <div className="page">
      <h1>HORN Lab</h1>
      <p className="warning">⚠ {O.HORN_SECURITY_NOTICE} Tokens, keys and secrets in this app use Web Crypto.</p>
      <div className="split">
        <div className="panel">
          <h3>Counter replay — H(seed, worker, counter)</h3>
          <label className="field"><span>seed</span><input type="number" value={seed} onChange={(e) => setSeed(+e.target.value)} /></label>
          <label className="field"><span>worker</span><input type="number" value={worker} onChange={(e) => setWorker(+e.target.value)} /></label>
          <label className="field"><span>counter</span><input type="number" value={counter} onChange={(e) => setCounter(+e.target.value)} /></label>
          <p>sample = <b className="mono">{sample.toFixed(15)}</b></p>
          <p className="small muted">Reconstructed in O(1) — no log of the {counter.toLocaleString()} earlier draws (which would need {bytes(counter * 8)}).</p>

          <h3>Missing data → scenarios</h3>
          <p className="small">10:00 = 100 · 10:10 = 105 · 10:20 = ? · 10:30 = ? · 10:40 = 121. OmniFit fixes the 10-minute grid exactly; HORN only fills the genuinely unknown values:</p>
          <table className="table small">
            <thead><tr><th>scenario</th><th>10:20</th><th>10:30</th></tr></thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={i}><td>#{i}</td><td>{s[0].toFixed(2)}</td><td>{s[1].toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>HornMixer — 4 unlike streams + 1 faulty</h3>
          <button className="btn" onClick={runMixer}>Re-run 4,096 draws</button>
          {mix && (
            <>
              <table className="table small">
                <thead><tr><th>stream</th><th>weight w_i</th><th>gate (w &gt; τ)</th></tr></thead>
                <tbody>
                  {mix.weights.map((w) => (
                    <tr key={w.name}><td>{w.name}</td><td>{w.w.toFixed(4)}</td><td>{mix.active.includes(w.name) ? "included" : "ejected"}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="small">KS distance of mixed output to U(0,1): <b>{mix.ks.toFixed(4)}</b> · {mix.ms.toFixed(2)} ms</p>
              <canvas ref={canvasRef} width={480} height={120} className="hist" />
              <p className="muted small">f_i = exp(−η·D_i·√w), w_i ← w_i f_i / Σ w_j f_j, u_t = frac(Σ_{"{w_i>τ}"} v_i,t)</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
