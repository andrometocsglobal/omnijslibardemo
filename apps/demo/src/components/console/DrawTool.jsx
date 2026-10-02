import { useEffect, useImperativeHandle, useRef, useState } from "react";
import O, { bytes } from "../../omni.js";

const W = 1600, H = 1000;
const COLORS = ["#22d3ee", "#f0abfc", "#a3e635", "#fbbf24", "#f87171", "#e5e7eb"];
const store = O.createStore("omnidim-console", "drawings");

/**
 * Gesture drawing board. Every finished stroke is formula-compressed with
 * OMNIDIM compressStroke (OmniFit AP segments + exceptions) and stored that
 * way; the panel shows raw vs stored numbers. Optional O(1) grid snapping.
 */
export default function DrawTool({ ref, zoom }) {
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(6);
  const [snap, setSnap] = useState(false);
  const current = useRef(null);

  useEffect(() => {
    store.get("last").then((saved) => saved?.strokes && setStrokes(saved.strokes.map((s) => ({ ...s, points: O.decompressStroke(s.compressed) }))));
  }, []);

  const toLocal = (c) => {
    const r = canvasRef.current.getBoundingClientRect();
    let p = { x: ((c.clientX - r.left) / r.width) * W, y: ((c.clientY - r.top) / r.height) * H };
    if (snap) p = O.snap2(p, 40);
    return p;
  };

  const redraw = (list, live) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (const s of live ? [...list, live] : list) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }
  };
  useEffect(() => redraw(strokes), [strokes]);

  const finish = () => {
    const s = current.current;
    current.current = null;
    if (!s || s.points.length < 2) return;
    const compressed = O.compressStroke(s.points, { grid: 2 });
    setStrokes((list) => [...list, { ...s, points: O.decompressStroke(compressed), compressed }]);
  };

  useImperativeHandle(ref, () => ({
    pinchStart(c) {
      current.current = { color, width, points: [toLocal(c)] };
    },
    pinchMove(c) {
      if (!current.current) return;
      const p = toLocal(c);
      const last = current.current.points.at(-1);
      if (Math.hypot(p.x - last.x, p.y - last.y) > 1.5) current.current.points.push(p);
      redraw(strokes, current.current);
    },
    pinchEnd: finish,
    secondary(c) {
      const p = toLocal(c);
      setStrokes((list) => list.filter((s) => !s.points.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 30)));
    },
    undo() {
      setStrokes((list) => list.slice(0, -1));
    },
    async save() {
      await store.set("last", { at: Date.now(), strokes: strokes.map(({ color, width, compressed }) => ({ color, width, compressed })) });
    },
  }));

  const raw = strokes.reduce((a, s) => a + s.compressed.rawNumbers, 0);
  const stored = strokes.reduce((a, s) => a + s.compressed.storedNumbers, 0);

  const exportPng = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = "omnidim-drawing.png";
    a.click();
  };

  return (
    <div className="tool">
      <div className="tool-bar">
        {COLORS.map((c) => (
          <button key={c} data-holo className={`swatch ${c === color ? "on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`colour ${c}`} />
        ))}
        {[3, 6, 12].map((w) => (
          <button key={w} data-holo className={`holo-btn sm ${w === width ? "on" : ""}`} onClick={() => setWidth(w)}>{w}px</button>
        ))}
        <button data-holo className={`holo-btn sm ${snap ? "on" : ""}`} onClick={() => setSnap((s) => !s)}>GRID SNAP</button>
        <button data-holo className="holo-btn sm" onClick={() => setStrokes((l) => l.slice(0, -1))}>UNDO</button>
        <button data-holo className="holo-btn sm" onClick={() => setStrokes([])}>CLEAR</button>
        <button data-holo className="holo-btn sm" onClick={exportPng}>EXPORT PNG</button>
        <span className="holo-readout">
          {strokes.length} strokes · raw {raw} numbers ({bytes(raw * 8)}) → stored {stored} ({bytes(stored * 8)}) · {strokes.filter((s) => s.compressed.mode === "formula").length} as OmniFit formulas{raw > stored ? ` · ${(raw / Math.max(1, stored)).toFixed(1)}× smaller` : ""}{snap ? "" : " · tip: GRID SNAP makes straight strokes compress"}
        </span>
      </div>
      <div className="tool-surface" style={{ transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})` }}>
        <canvas ref={canvasRef} width={W} height={H} className="draw-canvas" />
      </div>
    </div>
  );
}
