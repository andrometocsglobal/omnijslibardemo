import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import O from "../omni.js";
import Avatar from "../components/Avatar.jsx";
import { usePrivacy } from "../state/privacy.jsx";
import { useVideoStream, useVision } from "../hooks/useVision.js";

/**
 * 3D Layer — a digital human representing the user. Face orientation follows
 * the pointer or (opt-in) the on-device face detector; speech uses the Web
 * Speech API with boundary-driven lip motion. Presentation is user-chosen.
 */
export default function Human3D() {
  const caps = useMemo(() => O.capabilities(), []);
  const { stream, startCamera, stopCamera, cameraAllowed } = usePrivacy();
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [mouth, setMouth] = useState(0);
  const [expression, setExpression] = useState("neutral");
  const [wave, setWave] = useState(false);
  const [text, setText] = useState("Hello, I am your OMNIDIM digital human. Ask me for an OMNIBAL value.");
  const [reply, setReply] = useState("");
  const [presentation, setPresentation] = useState(() => localStorage.getItem("omni.presentation") || "neutral");
  const [scene, setScene] = useState({ face: false, lighting: "—" });
  const videoRef = useRef(null);
  useVideoStream(videoRef, stream);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const vision = useVision(videoRef, {
    hands: false,
    face: true,
    active: !!stream,
    onFrame: (r) => {
      if (r.face) setLook({ x: (r.face.x - 0.5) * 2, y: (r.face.y - 0.5) * 2 });
      setScene((s) => ({ ...s, face: !!r.face }));
    },
  });

  // basic scene awareness: average frame brightness (non-sensitive attribute)
  useEffect(() => {
    if (!stream) return;
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 24;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v?.videoWidth) return;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(v, 0, 0, 32, 24);
      const d = ctx.getImageData(0, 0, 32, 24).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const lum = sum / (d.length / 4);
      setScene((s) => ({ ...s, lighting: lum < 60 ? "dim" : lum > 170 ? "bright" : "normal" }));
    }, 1000);
    return () => clearInterval(id);
  }, [stream]);

  const respond = (q) => {
    const m = q.match(/(\d+)\D+(\d+)/);
    if (/sum|omnibal|cube|power/i.test(q) && m) {
      const [F, L] = [+m[1], +m[2]].sort((a, b) => a - b);
      const v = O.AP.powerSum(F, L - F + 1, 1, 3);
      return `The sum of cubes from ${F} to ${L} is ${v}. I used the OMNIBAL midpoint formula, so no loop over the terms.`;
    }
    if (/harmonic/i.test(q)) return `H of one billion is about ${O.HP.sumApprox(1e9).value.toFixed(6)}, from the Euler–Maclaurin expansion.`;
    return "I can compute omnidimensional formulas. Try: sum of cubes from 2 to 9.";
  };

  const speak = async (line) => {
    setReply(line);
    let timer;
    const pulse = () => {
      setMouth(0.9);
      clearTimeout(timer);
      timer = setTimeout(() => setMouth(0.15), 110);
    };
    const ok = await O.speak(line, { onBoundary: pulse });
    if (!ok) {
      // no speech engine: animate from text cadence instead
      for (const _ of line.split(" ")) {
        pulse();
        await new Promise((r) => setTimeout(r, 180));
      }
    }
    setMouth(0);
  };

  const onPointer = (e) => {
    if (stream) return;
    const r = e.currentTarget.getBoundingClientRect();
    setLook({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  };

  const choose = (p) => {
    setPresentation(p);
    localStorage.setItem("omni.presentation", p);
  };

  return (
    <div className="page">
      <h1>3D Layer · Digital Human</h1>
      <p className="muted">Spatial digital representation of the user. Camera is optional and processed on-device only.</p>
      <div className="split">
        <div className="stage3d" onPointerMove={onPointer}>
          {caps.webgl ? (
            <Canvas camera={{ position: [0, 0, 3.2], fov: 40 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[2, 3, 4]} intensity={1.2} />
              <pointLight position={[-2, 1, 2]} intensity={0.6} color="#22d3ee" />
              <Avatar look={look} mouth={mouth} expression={expression} wave={wave} presentation={presentation} />
            </Canvas>
          ) : (
            <div className="fallback-avatar">
              <svg viewBox="0 0 100 120" width="180">
                <circle cx="50" cy="40" r="26" fill="#e8c4a6" />
                <ellipse cx="50" cy="52" rx="7" ry={2 + mouth * 6} fill="#7f1d1d" />
                <rect x="28" y="70" width="44" height="45" rx="16" fill={O.presentationStyle(presentation).accent} />
              </svg>
              <p className="muted small">WebGL unavailable — 2D fallback avatar.</p>
            </div>
          )}
          <video ref={videoRef} muted playsInline className={`pip mirror ${stream ? "" : "hidden"}`} />
        </div>
        <div className="panel">
          <h3>Speech & response</h3>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          <div className="row gap wrap">
            <button className="btn btn-primary" onClick={() => speak(text)}>🔊 Speak</button>
            <button className="btn" onClick={() => speak(respond(text))}>💬 Respond</button>
            <button className="btn" onClick={async () => { try { const q = await O.listenOnce(); setText(q); speak(respond(q)); } catch (e) { setReply(String(e.message)); } }}>🎙 Ask by voice</button>
          </div>
          {reply && <p className="reply">{reply}</p>}
          <h3>Expression & gesture</h3>
          <div className="row gap wrap">
            {["neutral", "smile", "surprised", "concerned"].map((x) => (
              <button key={x} className={`btn sm ${expression === x ? "btn-primary" : ""}`} onClick={() => setExpression(x)}>{x}</button>
            ))}
            <button className={`btn sm ${wave ? "btn-primary" : ""}`} onClick={() => setWave((w) => !w)}>👋 wave</button>
          </div>
          <h3>Presentation (your explicit choice)</h3>
          <div className="row gap wrap">
            {O.PRESENTATION_PROFILES.map((p) => (
              <button key={p} className={`btn sm ${presentation === p ? "btn-primary" : ""}`} onClick={() => choose(p)}>{O.presentationStyle(p).label}</button>
            ))}
          </div>
          <p className="muted small">The app never infers gender from the camera. Neutral is the default.</p>
          <h3>Camera (optional)</h3>
          <button className="btn" disabled={!cameraAllowed} onClick={() => (stream ? stopCamera(true) : startCamera().catch((e) => setReply(e.message)))}>
            {stream ? "Stop camera" : "Follow my face (on-device)"}
          </button>
          <p className="muted small">Vision: {vision} · face {scene.face ? "detected" : "not detected"} · lighting {scene.lighting}</p>
        </div>
      </div>
    </div>
  );
}
