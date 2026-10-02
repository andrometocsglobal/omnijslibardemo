import { useState } from "react";
import O from "../omni.js";

/**
 * Identity confirmation before the persona reattaches.
 * Passkey (OS biometrics/PIN via WebAuthn) when registered, otherwise a local
 * PBKDF2-hashed PIN. No face matching, no biometric data in JavaScript.
 */
export default function IdentityCheck({ onResult }) {
  const passkeyId = localStorage.getItem("omni.passkeyId");
  const pinRec = JSON.parse(localStorage.getItem("omni.pin") || "null");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");

  const viaPasskey = async () => {
    setMsg("Waiting for your device…");
    const ok = await O.Passkey.verify(passkeyId);
    setMsg(ok ? "" : "Passkey verification failed");
    onResult(ok);
  };

  const viaPin = async (e) => {
    e.preventDefault();
    if (!pinRec) {
      if (pin.length < 4) return setMsg("Choose a PIN of at least 4 digits");
      localStorage.setItem("omni.pin", JSON.stringify(await O.Pin.hash(pin)));
      setMsg("PIN created");
      return onResult(true);
    }
    const ok = await O.Pin.verify(pin, pinRec);
    setMsg(ok ? "" : "Wrong PIN");
    setPin("");
    onResult(ok);
  };

  return (
    <div className="identity">
      <h3>Identity confirmation</h3>
      {passkeyId && (
        <button className="btn btn-primary" onClick={viaPasskey}>🔑 Verify with passkey</button>
      )}
      <form onSubmit={viaPin} className="row gap">
        <input type="password" inputMode="numeric" autoComplete="off" placeholder={pinRec ? "Enter PIN" : "Create a PIN"} value={pin} onChange={(e) => setPin(e.target.value)} />
        <button className="btn" type="submit">{pinRec ? "Verify PIN" : "Create PIN"}</button>
      </form>
      {msg && <p className="muted small">{msg}</p>}
    </div>
  );
}
