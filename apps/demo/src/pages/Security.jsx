import { useEffect, useMemo, useState } from "react";
import O from "../omni.js";
import { usePrivacy } from "../state/privacy.jsx";
import { usePersona } from "../state/persona.jsx";

/** Settings · Security · Privacy controls · Android-like app features. */
export default function Security() {
  const p = usePrivacy();
  const { runtime, state, signer } = usePersona();
  const [msg, setMsg] = useState("");
  const [installEvt, setInstallEvt] = useState(null);
  const [pub, setPub] = useState(null);
  const [motion, setMotion] = useState(null);
  const caps = useMemo(() => O.capabilities(), []);
  const passkeyId = localStorage.getItem("omni.passkeyId");

  useEffect(() => {
    const h = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    window.addEventListener("beforeinstallprompt", h);
    signer.init().then(setPub).catch(() => {});
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, [signer]);

  const act = (fn, ok) => async () => {
    try {
      await fn();
      setMsg(ok);
    } catch (e) {
      setMsg(String(e.message ?? e));
    }
  };

  const deleteAll = async () => {
    p.stopCamera(true);
    await runtime.reset();
    for (const db of ["omnidim-persona", "omnidim-identity", "omnidim-console", "omnidim-cache", "omnidim-secure", "omnidim-cachelab"]) await O.deleteDatabase(db);
    ["omni.pin", "omni.passkeyId", "omni.presentation"].forEach((k) => localStorage.removeItem(k));
    await signer.reset();
    setMsg("All persona data, keys, notes, drawings and caches deleted from this device.");
  };

  const clearMemory = async () => {
    if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    sessionStorage.clear();
    setMsg("Local caches and session memory cleared.");
  };

  return (
    <div className="page">
      <h1>Settings · Security · Privacy</h1>
      {msg && <p className="reply">{msg}</p>}
      <div className="split">
        <div className="panel">
          <h3>Privacy controls</h3>
          <label className="toggle"><input type="checkbox" checked={p.cameraAllowed} onChange={(e) => p.setCameraAllowed(e.target.checked)} /> Allow camera (off until you start it)</label>
          <label className="toggle"><input type="checkbox" checked={p.micAllowed} onChange={(e) => p.setMicAllowed(e.target.checked)} /> Allow microphone (voice questions only)</label>
          <label className="toggle"><input type="checkbox" checked={state.agentActionsEnabled} onChange={(e) => runtime.setAgentActions(e.target.checked)} /> Allow persona agent actions</label>
          <div className="row gap wrap">
            <button className="btn" onClick={() => p.stopCamera(true)}>Disable camera now</button>
            <button className="btn btn-danger" onClick={() => runtime.emergencyStop()}>⏹ Emergency stop</button>
            <button className="btn" onClick={clearMemory}>Clear local memory</button>
            <button className="btn btn-danger" onClick={deleteAll}>Delete persona data</button>
          </div>
          <p className="muted small">Camera/mic are off by default, processed on-device, never recorded or transmitted. No user is identified from images. Gender is never inferred.</p>

          <h3>Authentication</h3>
          <p className="small">Passkey: {passkeyId ? "registered ✓" : "not registered"} · PIN: {localStorage.getItem("omni.pin") ? "set ✓" : "not set"}</p>
          <div className="row gap wrap">
            <button className="btn" disabled={!caps.webAuthn} onClick={act(async () => localStorage.setItem("omni.passkeyId", await O.Passkey.register("omnidim-user")), "Passkey registered — OS biometrics/PIN will be used; JavaScript never sees biometric data.")}>Register passkey</button>
            <button className="btn" disabled={!passkeyId} onClick={act(async () => { if (!(await O.Passkey.verify(passkeyId))) throw new Error("Verification failed"); }, "Passkey verified ✓")}>Test passkey</button>
          </div>
          <p className="muted small">Client-only demo: the assertion proves local user verification. A production deployment must verify assertions server-side.</p>
          <h4>Device signing key (ECDSA P-256, non-extractable)</h4>
          <pre className="code small">{pub ? JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x?.slice(0, 16) + "…" }, null, 1) : "—"}</pre>
          <p className="small">{state.audit.length} audit entries signed.</p>
        </div>

        <div className="panel">
          <h3>Android-like app features</h3>
          <div className="row gap wrap">
            <button className="btn btn-primary" disabled={!installEvt} onClick={async () => { installEvt.prompt(); setInstallEvt(null); }}>⤓ Install app</button>
            <button className="btn" onClick={act(() => O.notify("OMNIDIM", "Local notification from the 4D persona"), "Notification shown (if permitted)")}>Notify</button>
            <button className="btn" disabled={!caps.wakeLock} onClick={act(() => O.keepAwake(), "Screen wake lock active")}>Keep awake</button>
            <button className="btn" disabled={!caps.fullscreen} onClick={act(() => document.documentElement.requestFullscreen(), "Fullscreen")}>Fullscreen</button>
            <button className="btn" disabled={!caps.orientationLock} onClick={act(() => screen.orientation.lock("landscape"), "Orientation locked to landscape")}>Lock landscape</button>
            <button className="btn" disabled={!caps.share} onClick={act(() => navigator.share({ title: "OMNIDIM JS", text: "Omnidimensional formulas demo", url: location.origin }), "Shared")}>Share</button>
            <button className="btn" disabled={!caps.clipboard} onClick={act(() => navigator.clipboard.writeText(`Σk³ (2..9) = ${O.AP.powerSum(2, 8, 1, 3)}`), "Copied to clipboard")}>Copy result</button>
            <button className="btn" disabled={!caps.vibrate} onClick={() => navigator.vibrate?.([40, 30, 40])}>Haptic</button>
            <button className="btn" disabled={!caps.deviceMotion} onClick={act(async () => {
              if (typeof DeviceMotionEvent.requestPermission === "function") await DeviceMotionEvent.requestPermission();
              window.addEventListener("devicemotion", (e) => setMotion(e.accelerationIncludingGravity), { once: false });
            }, "Listening to device motion")}>Device motion</button>
          </div>
          {motion && <p className="small mono">accel x {motion.x?.toFixed(2)} y {motion.y?.toFixed(2)} z {motion.z?.toFixed(2)}</p>}
          <p className="muted small">Quick actions (app shortcuts), share target and .csv/.txt file handling are declared in the web manifest. Background Sync resumes persona work when supported. Push needs a push server, which this static build intentionally does not include.</p>

          <h3>Capabilities</h3>
          <div className="caps">
            {Object.entries(caps).map(([k, v]) => (
              <span key={k} className={`cap ${v ? "yes" : "no"}`}>{v ? "✓" : "✗"} {k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
