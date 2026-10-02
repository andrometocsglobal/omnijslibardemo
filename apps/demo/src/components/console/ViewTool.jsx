import { useEffect, useImperativeHandle, useRef, useState } from "react";
import O from "../../omni.js";

/**
 * Zoom view: a "star lattice" built from the omnidimensional cube sequence
 * (stars at F³…L³ light-years, from the 3D AP video) on a regular grid.
 * Hover → O(1) nearestGridCell + coordinateToIndex (no lookup table).
 * Two-hand pinch → zoom, two-hand twist → rotate, fist → pan.
 */
const N = 24; // grid is N×N
const grid = new O.OmniGrid([N, N], [0, 0], [1, 1]);

export default function ViewTool({ ref, zoom, setZoom }) {
  const canvasRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [F, setF] = useState(2);
  const [L, setL] = useState(9);

  const toWorld = (c) => {
    const cv = canvasRef.current;
    const r = cv.getBoundingClientRect();
    const sx = ((c.clientX - r.left) / r.width) * cv.width - cv.width / 2 - zoom.tx;
    const sy = ((c.clientY - r.top) / r.height) * cv.height - cv.height / 2 - zoom.ty;
    const cos = Math.cos(-zoom.rot), sin = Math.sin(-zoom.rot);
    const unit = (Math.min(cv.width, cv.height) / (N + 2)) * zoom.scale;
    return { x: (sx * cos - sy * sin) / unit + N / 2 - 0.5, y: (sx * sin + sy * cos) / unit + N / 2 - 0.5 };
  };

  const pick = (c) => {
    const w = toWorld(c);
    const r = grid.nearest([w.x, w.y]);
    setHover({ cell: r.cell, index: grid.toIndex(r.cell), residual: r.residual.map((v) => v.toFixed(2)) });
  };

  useImperativeHandle(ref, () => ({
    pinchStart: pick,
    pinchMove: pick,
    pinchEnd: () => {},
    pan(dx, dy) {
      setZoom((z) => ({ ...z, tx: z.tx + dx, ty: z.ty + dy }));
      return true;
    },
    undo: () => setZoom({ scale: 1, rot: 0, tx: 0, ty: 0 }),
    save: () => {},
  }));

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    const { width: Wd, height: Ht } = cv;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, Wd, Ht);
    const unit = (Math.min(Wd, Ht) / (N + 2)) * zoom.scale;
    ctx.translate(Wd / 2 + zoom.tx, Ht / 2 + zoom.ty);
    ctx.rotate(zoom.rot);
    const P = (x, y) => [(x - N / 2 + 0.5) * unit, (y - N / 2 + 0.5) * unit];
    ctx.strokeStyle = "rgba(34,211,238,.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= N; i++) {
      ctx.beginPath();
      ctx.moveTo(...P(i - 0.5, -0.5));
      ctx.lineTo(...P(i - 0.5, N - 0.5));
      ctx.moveTo(...P(-0.5, i - 0.5));
      ctx.lineTo(...P(N - 0.5, i - 0.5));
      ctx.stroke();
    }
    // stars: k³ for k = F..L placed along the lattice — 3D AP formation (two faces)
    const ks = [];
    for (let k = F; k <= L; k++) ks.push(k);
    ks.forEach((k, i) => {
      const half = Math.ceil(ks.length / 2);
      const face = i < half ? 0 : 1;
      const j = face ? i - half : i;
      const x = 4 + (j % 2) * 7 + face * 3;
      const y = 4 + Math.floor(j / 2) * 7 + face * 3;
      const [px, py] = P(x, y);
      const r = 4 + Math.cbrt(k ** 3) * 1.2 * Math.sqrt(zoom.scale);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
      g.addColorStop(0, face ? "#f0abfc" : "#67e8f9");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e0f2fe";
      ctx.font = `${Math.max(10, 11 * Math.sqrt(zoom.scale))}px ui-monospace, monospace`;
      ctx.fillText(`${k}³=${k ** 3} ly`, px + r + 4, py - r);
    });
    if (hover) {
      const [hx, hy] = P(hover.cell[0], hover.cell[1]);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.strokeRect(hx - unit / 2, hy - unit / 2, unit, unit);
    }
  }, [zoom, hover, F, L]);

  const sum = O.AP.powerSum(F, L - F + 1, 1, 3);

  return (
    <div className="tool">
      <div className="tool-bar">
        <label className="holo-readout">F <input type="number" min="1" max="30" value={F} onChange={(e) => setF(Math.max(1, Math.min(+e.target.value, L)))} /></label>
        <label className="holo-readout">L <input type="number" min="1" max="40" value={L} onChange={(e) => setL(Math.max(F, Math.min(+e.target.value, 40)))} /></label>
        <button data-holo className="holo-btn sm" onClick={() => setZoom((z) => ({ ...z, scale: Math.min(6, z.scale * 1.25) }))}>ZOOM +</button>
        <button data-holo className="holo-btn sm" onClick={() => setZoom((z) => ({ ...z, scale: Math.max(0.3, z.scale / 1.25) }))}>ZOOM −</button>
        <button data-holo className="holo-btn sm" onClick={() => setZoom((z) => ({ ...z, rot: z.rot + Math.PI / 12 }))}>ROTATE</button>
        <span className="holo-readout">
          Σk³ ({F}…{L}) = <b>{sum.toString()}</b> via OMNIBAL {O.AP.formula(3)} ·{" "}
          {hover ? `cell (${hover.cell.join(",")}) → index ${hover.index} [O(1)], residual (${hover.residual.join(", ")})` : "pinch / drag to pick a cell"}
        </span>
      </div>
      <canvas ref={canvasRef} width={1400} height={820} className="view-canvas" />
    </div>
  );
}
