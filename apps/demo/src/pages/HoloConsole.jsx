import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import O from "../omni.js";
import { usePrivacy } from "../state/privacy.jsx";
import { useVideoStream, useVision } from "../hooks/useVision.js";
import DrawTool from "../components/console/DrawTool.jsx";
import NoteTool from "../components/console/NoteTool.jsx";
import DocTool from "../components/console/DocTool.jsx";
import ViewTool from "../components/console/ViewTool.jsx";
import HandOverlay from "../components/console/HandOverlay.jsx";

const TOOLS = [
  { id: "draw", label: "DRAW", hint: "pinch to draw · middle-tap erase" },
  { id: "note", label: "NOTEPAD", hint: "pinch keys on the air keyboard" },
  { id: "doc", label: "DOCUMENT", hint: "pinch toolbar · fist to scroll" },
  { id: "view", label: "ZOOM VIEW", hint: "two-hand pinch to zoom & rotate" },
];

/**
 * Holo Console — Minority-Report / Star-Trek-console style workspace driven
 * by hand gestures (MediaPipe landmarks → OMNIDIM GestureTracker). Mouse,
 * touch and wheel map onto the same actions when the camera is off.
 */
export default function HoloConsole() {
  const { startCamera, stopCamera, stream, cameraAllowed } = usePrivacy();
  const [tool, setTool] = useState("draw");
  const [zoom, setZoom] = useState({ scale: 1, rot: 0, tx: 0, ty: 0 });
  const [cursors, setCursors] = useState({});
  const [lastGesture, setLastGesture] = useState("—");
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [rawHands, setRawHands] = useState([]);
  const [fps, setFps] = useState(0);
  const consoleRef = useRef(null);
  const videoRef = useRef(null);
  const toolRef = useRef(null);
  const zoomBase = useRef(null);
  const frameCount = useRef({ n: 0, t: performance.now() });

  useVideoStream(videoRef, stream);

  const tracker = useMemo(() => new O.GestureTracker({ stableFrames: 3, holdMs: 1100 }), []);
  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(flash.t);
    flash.t = setTimeout(() => setToast(""), 1400);
  }, []);

  const nextTool = useCallback((dir = 1) => {
    setTool((t) => {
      const i = TOOLS.findIndex((x) => x.id === t);
      const n = TOOLS[(i + dir + TOOLS.length) % TOOLS.length];
      flash(`▶ ${n.label}`);
      return n.id;
    });
  }, [flash]);

  // normalised [0,1] cursor → client px inside the console
  const toClient = useCallback((p) => {
    const r = consoleRef.current?.getBoundingClientRect();
    if (!r) return { clientX: 0, clientY: 0 };
    return { clientX: r.left + p.x * r.width, clientY: r.top + p.y * r.height };
  }, []);

  /** If a holo button is under the point, press it. */
  const pressAt = useCallback((c) => {
    const el = document.elementFromPoint(c.clientX, c.clientY)?.closest?.("[data-holo]");
    if (el) {
      el.classList.add("holo-press");
      setTimeout(() => el.classList.remove("holo-press"), 220);
      el.click();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const offs = [
      tracker.on("cursor", (c) => setCursors((cs) => ({ ...cs, [c.hand]: { ...toClient(c), gesture: c.gesture } }))),
      tracker.on("gesturestart", (e) => {
        setLastGesture(e.gesture);
        const c = toClient(e);
        if (e.gesture === "PINCH_INDEX") {
          if (!pressAt(c)) toolRef.current?.pinchStart?.(c);
        } else if (e.gesture === "PINCH_MIDDLE") toolRef.current?.secondary?.(c);
        else if (e.gesture === "PINCH_RING") {
          toolRef.current?.undo?.();
          flash("↶ undo");
        } else if (e.gesture === "PINCH_PINKY") {
          toolRef.current?.save?.();
          flash("✔ saved");
        } else if (e.gesture === "VICTORY") nextTool(1);
        else if (e.gesture === "THUMBS_UP") flash("👍 accepted");
      }),
      tracker.on("drag", (e) => {
        const c = toClient(e);
        if (e.gesture === "PINCH_INDEX") toolRef.current?.pinchMove?.(c);
        if (e.gesture === "FIST") {
          const r = consoleRef.current.getBoundingClientRect();
          const dx = e.dx * r.width, dy = e.dy * r.height;
          if (!toolRef.current?.pan?.(dx, dy)) setZoom((z) => ({ ...z, tx: z.tx + dx, ty: z.ty + dy }));
        }
      }),
      tracker.on("gestureend", (e) => {
        if (e.gesture === "PINCH_INDEX") toolRef.current?.pinchEnd?.(toClient(e));
        if (e.gesture === "OPEN_PALM") setHelp(false);
      }),
      tracker.on("hold", (e) => e.gesture === "OPEN_PALM" && setHelp(true)),
      tracker.on("swipe", (e) => nextTool(e.direction === "right" ? 1 : -1)),
      tracker.on("zoom", (e) => {
        zoomBase.current ??= zoom.scale;
        setZoom((z) => ({ ...z, scale: O.vec.clamp(z.scale * e.delta, 0.3, 6) }));
      }),
      tracker.on("rotate", (e) => tool === "view" && setZoom((z) => ({ ...z, rot: e.angle }))),
    ];
    return () => offs.forEach((off) => off());
  }, [tracker, toClient, pressAt, nextTool, flash, tool, zoom.scale]);

  const onFrame = useCallback(
    (r) => {
      tracker.update(r.hands, r.t);
      setRawHands(r.hands);
      if (!r.hands.length) setCursors({});
      const fc = frameCount.current;
      fc.n++;
      if (r.t - fc.t > 1000) {
        setFps(Math.round((fc.n * 1000) / (r.t - fc.t)));
        fc.n = 0;
        fc.t = r.t;
      }
    },
    [tracker],
  );
  const vision = useVision(videoRef, { hands: true, active: !!stream, onFrame });

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ---- mouse / touch / wheel fallback (same actions) ----
  const pointer = useRef(false);
  const onPointerDown = (e) => {
    if (e.target.closest("[data-holo]") || e.target.closest("textarea,[contenteditable=true],input")) return;
    pointer.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (e.button === 1 || e.shiftKey) toolRef.current?.secondary?.(e);
    else toolRef.current?.pinchStart?.(e);
  };
  const onPointerMove = (e) => pointer.current && toolRef.current?.pinchMove?.(e);
  const onPointerUp = (e) => {
    if (!pointer.current) return;
    pointer.current = false;
    toolRef.current?.pinchEnd?.(e);
  };
  const onWheel = (e) => {
    if (!e.ctrlKey && tool !== "view") return;
    setZoom((z) => ({ ...z, scale: O.vec.clamp(z.scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.3, 6) }));
  };

  const toggleCamera = async () => {
    try {
      if (stream) stopCamera(true);
      else await startCamera();
    } catch (e) {
      flash(String(e.message ?? e));
    }
  };

  const active = TOOLS.find((t) => t.id === tool);

  return (
    <div className="page console-page">
      <header className="console-head">
        <div>
          <h1 className="holo-title">HOLO CONSOLE</h1>
          <p className="muted">Hand-gesture workspace · on-device tracking · {active.hint}</p>
        </div>
        <div className="row gap">
          <button className={`btn ${stream ? "btn-live" : "btn-primary"}`} onClick={toggleCamera} disabled={!cameraAllowed}>
            {stream ? "■ Stop hand tracking" : "✋ Start hand tracking"}
          </button>
          <button className="btn" onClick={() => setHelp((h) => !h)}>Gesture map</button>
          <button className="btn" onClick={() => setZoom({ scale: 1, rot: 0, tx: 0, ty: 0 })}>Reset view</button>
        </div>
      </header>

      <div className="holo-console" ref={consoleRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}>
        <div className="holo-grid" aria-hidden />
        <div className="holo-dock">
          {TOOLS.map((t) => (
            <button key={t.id} data-holo className={`holo-btn ${tool === t.id ? "on" : ""}`} onClick={() => setTool(t.id)}>
              {t.label}
            </button>
          ))}
          <span className="holo-readout">
            {stream ? `${vision} · ${fps} fps` : "mouse / touch mode"} · gesture <b>{lastGesture}</b> · zoom {zoom.scale.toFixed(2)}×
          </span>
        </div>

        <div className="holo-stage">
          {tool === "draw" && <DrawTool ref={toolRef} zoom={zoom} />}
          {tool === "note" && <NoteTool ref={toolRef} zoom={zoom} />}
          {tool === "doc" && <DocTool ref={toolRef} zoom={zoom} />}
          {tool === "view" && <ViewTool ref={toolRef} zoom={zoom} setZoom={setZoom} />}
        </div>

        <HandOverlay cursors={cursors} consoleRef={consoleRef} />
        {toast && <div className="holo-toast">{toast}</div>}

        <div className={`cam-preview ${stream ? "" : "hidden"}`}>
          <video ref={videoRef} muted playsInline className="mirror" />
          <LandmarkCanvas hands={rawHands} />
        </div>

        {help && (
          <div className="holo-help" data-holo onClick={() => setHelp(false)}>
            <h3>Gesture map</h3>
            <table>
              <tbody>
                {Object.entries(O.GESTURE_ACTIONS).map(([g, a]) => (
                  <tr key={g}>
                    <td><code>{g}</code></td>
                    <td>{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">Calm, deliberate finger-to-thumb taps and open-palm moves — used purely as input. Without a camera: drag = pinch, Shift+drag = erase, Ctrl+wheel = zoom.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Draws the 21 hand landmarks over the mirrored camera preview. */
function LandmarkCanvas({ hands }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    const bones = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
    for (const h of hands) {
      const P = (i) => [(1 - h.landmarks[i].x) * c.width, h.landmarks[i].y * c.height];
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      for (const [a, b] of bones) {
        ctx.beginPath();
        ctx.moveTo(...P(a));
        ctx.lineTo(...P(b));
        ctx.stroke();
      }
      ctx.fillStyle = "#f0abfc";
      for (let i = 0; i < 21; i++) {
        ctx.beginPath();
        ctx.arc(...P(i), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [hands]);
  return <canvas ref={ref} width={320} height={240} className="landmarks" />;
}
