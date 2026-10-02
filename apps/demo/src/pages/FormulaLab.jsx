import { useMemo, useState } from "react";
import O, { bytes, fmt, workerTask } from "../omni.js";

const FAMILIES = ["AP", "GP", "HP", "Geometry"];

function Num({ label, value, onChange, step = 1, min }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} min={min} onChange={(e) => onChange(e.target.value === "" ? "" : +e.target.value)} />
    </label>
  );
}

/** OMNIBAL calculator for the four families, with complexity + memory avoided. */
export default function FormulaLab() {
  const [fam, setFam] = useState("AP");
  const [start, setStart] = useState(10);
  const [interval, setInterval] = useState(10);
  const [ratio, setRatio] = useState(2);
  const [count, setCount] = useState(1_000_000);
  const [power, setPower] = useState(3);
  const [dim, setDim] = useState(3);
  const [n, setN] = useState(10);
  const [big, setBig] = useState(null);

  const out = useMemo(() => {
    try {
      const N = Math.max(0, Math.floor(count || 0));
      if (fam === "AP") {
        const X = O.AP.dimensionalCount(n, dim);
        const ps = N <= 5e6 && Number.isInteger(start) && Number.isInteger(interval) ? O.AP.powerSum(start, N, interval, power) : null;
        return {
          formula: `a(k) = a0 + k·h ; S = N·(first+last)/2 ; ${O.AP.formula(power)}`,
          rows: [
            ["k-th (k = N−1)", fmt(O.AP.last(start, interval, N))],
            ["midpoint M", fmt(O.AP.midpoint(start, interval, N))],
            ["sum S", fmt(O.AP.sum(start, interval, N))],
            [`power sum Σ a(k)^${power}`, ps === null ? "(integers & N ≤ 5e6 for inline exact)" : ps.toString().length > 60 ? `${ps.toString().slice(0, 30)}…(${ps.toString().length} digits)` : ps.toString()],
            ["variance", fmt(O.AP.variance(interval, N))],
            [`X = n^d = ${n}^${dim}`, X.toLocaleString()],
            ["contains(start + 7h)?", String(O.AP.contains(start, interval, start + 7 * interval, N))],
          ],
          complexity: O.complexityOf("AP.sum"),
          descriptor: O.AP.describe(start, interval, N),
          N,
        };
      }
      if (fam === "GP") {
        const prod = O.GP.product(start, ratio, N);
        return {
          formula: "a(k) = a·r^k ; S(N) = a(r^N − 1)/(r − 1) ; P(X) = a^X · r^(X(X−1)/2)",
          rows: [
            ["k-th (k = N−1)", fmt(O.GP.valueAt(start, ratio, N - 1))],
            ["sum S(N)", fmt(O.GP.sum(start, ratio, N))],
            ["product (log₁₀)", fmt(prod.log / Math.LN10)],
            [`sum with X = n^d = ${n}^${dim}`, fmt(O.GP.sumDimensional(start, ratio, n, dim))],
            [`tree nodes, branching ${ratio}, ${dim} levels`, fmt(O.GP.levelCount(ratio, dim))],
            ["levels to hold N leaves", fmt(O.GP.levelsFor(ratio, N))],
          ],
          complexity: O.complexityOf("GP.sum"),
          descriptor: O.GP.describe(start, ratio, N),
          N,
        };
      }
      if (fam === "HP") {
        const a = O.HP.sumApprox(N, 4);
        const exact = N <= 2e7 ? O.HP.sumExact(N) : null;
        return {
          formula: "H(N) = Σ1/k ≈ ln N + γ + 1/(2N) − 1/(12N²) + 1/(120N⁴) − … (no finite elementary closed form)",
          rows: [
            ["H(N) Euler–Maclaurin", a.value.toPrecision(15)],
            ["error bound", a.errorBound.toExponential(2)],
            ["H(N) exact iteration O(N)", exact === null ? "skipped (N > 2e7)" : exact.toPrecision(15)],
            [`H(n^d) = H(${n}^${dim}) ≈ d·ln n + γ…`, O.HP.sumDimensional(n, dim).value.toPrecision(15)],
            [`Σ k^(−${power}) for k=1..N`, O.HP.reciprocalPower(power, 1, Math.max(1, N)).value.toPrecision(15)],
            [`Σ 1/(${start} + k·${interval})`, O.HP.progressionSum(start, interval, N).value.toPrecision(15)],
          ],
          complexity: O.complexityOf("HP.sumApprox"),
          descriptor: { family: "HP", a0: start, h: interval, count: N },
          N,
        };
      }
      const G = O.Geometry;
      return {
        formula: "V(d) = k(d)·s^d ; ball π^(d/2)/Γ(d/2+1)·R^d ; cube a^d ; simplex a^d/d!·√((d+1)/2^d) ; cross 2^d/d!·R^d",
        rows: [
          [`ball V(${dim}), R=${start}`, fmt(G.ball.volume(dim, start))],
          [`ball S(${dim})`, fmt(G.ball.surface(dim, start))],
          [`cube V, S, diagonal (a=${start})`, `${fmt(G.cube.volume(dim, start))} · ${fmt(G.cube.surface(dim, start))} · ${fmt(G.cube.diagonal(dim, start))}`],
          [`cube k-faces k=0..${Math.min(dim, 6)}`, Array.from({ length: Math.min(dim, 6) + 1 }, (_, k) => G.cube.faces(dim, k)).join(", ")],
          [`simplex V(${dim})`, fmt(G.simplex.volume(dim, start))],
          [`cross-polytope V(${dim})`, fmt(G.crossPolytope.volume(dim, start))],
          [`grid cells n^d = ${n}^${dim}`, fmt(O.dimensionalCount(n, dim))],
          ["unit-ball peak dimension", String(G.ball.peakDimension())],
        ],
        complexity: O.complexityOf("Geometry.ball.volume"),
        descriptor: { family: "GEOMETRY", d: dim, size: start },
        N: Number(O.dimensionalCount(n, dim)),
      };
    } catch (e) {
      return { error: String(e.message ?? e) };
    }
  }, [fam, start, interval, ratio, count, power, dim, n]);

  const runBig = async () => {
    setBig({ busy: true });
    const r = await workerTask("powersum", { F: start, X: String(count), s: interval, p: power });
    setBig(r);
  };

  return (
    <div className="page">
      <h1>OMNIBAL Formula Lab</h1>
      <div className="tabs">
        {FAMILIES.map((f) => (
          <button key={f} className={`tab ${fam === f ? "on" : ""}`} onClick={() => setFam(f)}>{f}</button>
        ))}
      </div>
      <div className="split">
        <div className="panel">
          <Num label={fam === "Geometry" ? "size (a or R)" : "start a0"} value={start} onChange={setStart} />
          {fam !== "Geometry" && fam !== "GP" && <Num label="interval h" value={interval} onChange={setInterval} />}
          {fam === "GP" && <Num label="ratio r" value={ratio} step={0.1} onChange={setRatio} />}
          {fam !== "Geometry" && <Num label="count N" value={count} min={0} onChange={setCount} />}
          {(fam === "AP" || fam === "HP") && <Num label={fam === "AP" ? "power p" : "reciprocal power s"} value={power} min={0} onChange={setPower} />}
          <Num label="dimension d" value={dim} min={0} onChange={setDim} />
          <Num label="n per axis (X = n^d)" value={n} min={1} onChange={setN} />
          {fam === "AP" && (
            <>
              <button className="btn" onClick={runBig}>Exact power sum in Web Worker (any N)</button>
              {big && <p className="small muted">{big.busy ? "computing…" : big.ok ? `${big.digits} digits in ${big.ms.toFixed(2)} ms — ${big.value.slice(0, 40)}${big.digits > 40 ? "…" : ""}` : big.error}</p>}
            </>
          )}
        </div>
        <div className="panel">
          {out.error ? (
            <p className="error">{out.error}</p>
          ) : (
            <>
              <p className="formula">{out.formula}</p>
              <table className="table">
                <tbody>
                  {out.rows.map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td className="mono">{v}</td></tr>
                  ))}
                </tbody>
              </table>
              <h4>Complexity</h4>
              <p className="small">time <b>{out.complexity?.time}</b> · space {out.complexity?.space} · needs: {out.complexity?.conditions}<br /><span className="muted">traditional: {out.complexity?.traditional} · caveat: {out.complexity?.limitation}</span></p>
              <h4>Formula descriptor</h4>
              <pre className="code">{JSON.stringify(out.descriptor, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2)}</pre>
              <p className="small">Descriptor {bytes(new TextEncoder().encode(JSON.stringify(out.descriptor)).length)} vs materialised Float64Array {bytes((out.N || 0) * 8)} → memory avoided ≈ {bytes(Math.max(0, (out.N || 0) * 8))}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
