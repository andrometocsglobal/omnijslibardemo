import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import O from "../omni.js";
import Avatar from "../components/Avatar.jsx";
import IdentityCheck from "../components/IdentityCheck.jsx";
import { usePrivacy } from "../state/privacy.jsx";
import { usePersona, DEFAULT_PLAN } from "../state/persona.jsx";
import { useVideoStream, useVision } from "../hooks/useVision.js";
import { startXRSession } from "../xr/xrSession.js";

/**
 * 5D AR Layer — the 4D persona embodied in augmented reality.
 * REAL_PERSON_PRESENT: AR cards anchor around the person (face position).
 * DETACHED_PERSONA:    the hologram persona stays and shows its progress.
 * Presence comes from on-device face detection with hysteresis.
 */
export default function AR5D() {
  const { stream, startCamera, stopCamera, cameraAllowed } = usePrivacy();
  const { runtime, state } = usePersona();
  const [face, setFace] = useState(null);
  const [anchors, setAnchors] = useState([]);
  const [xr, setXr] = useState(null);
  const [msg, setMsg] = useState("");
  const [auto, setAuto] = useState(true);
  const videoRef = useRef(null);
  const seenOnce = useRef(false);
  useVideoStream(videoRef, stream);
  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => {
    if (!stream) seenOnce.current = false;
  }, [stream]);
  useEffect(() => {
    O.detectXR().then(setXr);
  }, []);

  const presence = useMemo(() => new O.PresenceDetector({ enterFrames: 8, exitFrames: 60 }), []);
  const manager = useMemo(() => {
    const m = new O.AnchorManager(0.25);
    m.add("tasks", { offset: { x: 0.26, y: -0.12 }, free: { x: 0.78, y: 0.2 } });
    m.add("progress", { offset: { x: -0.27, y: -0.05 }, free: { x: 0.2, y: 0.25 } });
    m.add("approvals", { offset: { x: 0.24, y: 0.2 }, free: { x: 0.78, y: 0.72 } });
    return m;
  }, []);

  const vision = useVision(videoRef, {
    hands: false,
    face: true,
    active: !!stream,
    onFrame: (r) => {
      setFace(r.face);
      const p = presence.update(!!r.face);
      if (p === "PRESENT") seenOnce.current = true;
      // act on ABSENT only after the person was seen once (camera warm-up is not "leaving")
      if (auto && seenOnce.current) runtime.setPresence(p);
      setAnchors(manager.update(runtime.snapshot.mode === "ATTACHED" && r.face ? r.face : null));
    },
  });

  // keep anchors animating when no camera frames arrive
  useEffect(() => {
    if (stream) return;
    const id = setInterval(() => setAnchors(manager.update(null)), 50);
    return () => clearInterval(id);
  }, [stream, manager]);

  const t = state.tasks;
  const done = t.filter((x) => x.status === "done").length;
  const running = t.filter((x) => x.status === "running").length;
  const approvals = t.filter((x) => x.status === "awaiting-approval").length;
  const detached = state.mode !== "ATTACHED";

  const cards = {
    tasks: (
      <>
        <h4>Tasks</h4>
        {t.slice(0, 5).map((x, i) => (
          <div key={x.id} className="ar-line">Task {i + 1} · {x.status === "done" ? "complete" : x.status === "awaiting-approval" ? "needs approval" : x.status}</div>
        ))}
        {!t.length && <div className="ar-line">No tasks — plan some</div>}
      </>
    ),
    progress: (
      <>
        <h4>{detached ? "Detached persona" : "Workspace"}</h4>
        <div className="ar-line">{done} prepared · {running ? "simulation running" : "idle"}</div>
        <div className="ar-meter"><span style={{ width: `${t.length ? (100 * done) / t.length : 0}%` }} /></div>
      </>
    ),
    approvals: (
      <>
        <h4>Approvals</h4>
        <div className="ar-line">{approvals} approval{approvals === 1 ? "" : "s"} required</div>
        <div className="ar-line muted">No external actions executed</div>
      </>
    ),
  };

  const enterXR = async () => {
    try {
      await startXRSession({ tasks: t.map((x) => `${x.title}: ${x.status}`), mode: state.mode });
    } catch (e) {
      setMsg(String(e.message ?? e));
    }
  };

  return (
    <div className="page">
      <h1>5D Layer · AR Persona</h1>
      <p className="muted">4D persistent persona + AR embodiment. Camera frames stay on this device; nothing is recorded or uploaded.</p>
      <div className="row gap wrap">
        <button className={`btn ${stream ? "btn-live" : "btn-primary"}`} disabled={!cameraAllowed} onClick={() => (stream ? stopCamera(true) : startCamera().catch((e) => setMsg(e.message)))}>
          {stream ? "■ Stop camera" : "📷 Start AR camera"}
        </button>
        <button className="btn" onClick={() => runtime.instruct("Review today's tasks and prepare my project notes.", DEFAULT_PLAN)}>Plan demo tasks</button>
        <button className="btn" onClick={() => runtime.detach()}>Detach persona</button>
        <button className="btn" onClick={() => runtime.setPresence("PRESENT")}>Attach persona</button>
        <label className="row gap small"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> auto presence</label>
        <button className="btn" disabled={!xr?.immersiveAR} onClick={enterXR} title={xr?.immersiveAR ? "" : "immersive-ar not supported on this device/browser"}>
          🥽 WebXR AR {xr?.immersiveAR ? "" : "(unsupported)"}
        </button>
      </div>
      {msg && <p className="muted">{msg}</p>}

      <div className="ar-stage">
        <video ref={videoRef} muted playsInline className="mirror ar-video" />
        {!stream && <div className="ar-placeholder">Camera off — AR cards float in demo space</div>}
        <div className={`ar-mode ${detached ? "detached" : ""}`}>{detached ? "DETACHED_PERSONA" : face ? "REAL_PERSON_PRESENT" : "WAITING FOR PERSON"}</div>
        {anchors.map((a) => (
          <div key={a.id} className="ar-card" style={{ left: `${a.pos.x * 100}%`, top: `${a.pos.y * 100}%` }}>
            {cards[a.id]}
          </div>
        ))}
        {detached && (
          <div className="ar-persona">
            <Canvas camera={{ position: [0, 0, 3], fov: 40 }} gl={{ alpha: true }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[1, 2, 3]} intensity={1.5} />
              <Avatar hologram presentation={localStorage.getItem("omni.presentation") || "neutral"} wave={running > 0} expression="smile" />
            </Canvas>
          </div>
        )}
      </div>

      {state.mode === "VERIFYING" && (
        <IdentityCheck onResult={async (ok) => { const m = await runtime.reattach(ok); setMsg(m); O.speak(m); }} />
      )}
      <p className="muted small">Vision: {vision} · WebXR {xr ? (xr.immersiveAR ? "immersive-ar ✓" : "immersive-ar ✗") : "…"} · persona {state.mode}</p>
    </div>
  );
}
