import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import O from "../omni.js";

/**
 * Privacy-by-design: camera and mic are OFF by default, start only on an
 * explicit click, can be globally disabled, and one shared stream is used so
 * the indicator is always truthful. Nothing is recorded or transmitted.
 */
const Ctx = createContext(null);

const load = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : JSON.parse(v);
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export function PrivacyProvider({ children }) {
  const [cameraAllowed, setCameraAllowed] = useState(() => load("omni.cameraAllowed", true));
  const [micAllowed, setMicAllowed] = useState(() => load("omni.micAllowed", true));
  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const users = useRef(0);

  useEffect(() => save("omni.cameraAllowed", cameraAllowed), [cameraAllowed]);
  useEffect(() => save("omni.micAllowed", micAllowed), [micAllowed]);

  const startCamera = useCallback(async () => {
    if (!cameraAllowed) throw new Error("Camera is disabled in Security settings");
    users.current++;
    if (stream) return stream;
    const s = await O.startCamera({ facingMode: "user" });
    setStream(s);
    return s;
  }, [cameraAllowed, stream]);

  const stopCamera = useCallback(
    (force = false) => {
      users.current = force ? 0 : Math.max(0, users.current - 1);
      if (users.current === 0 && stream) {
        O.stopStream(stream);
        setStream(null);
      }
    },
    [stream],
  );

  useEffect(() => {
    if (!cameraAllowed && stream) stopCamera(true);
  }, [cameraAllowed, stream, stopCamera]);

  const value = useMemo(
    () => ({ cameraAllowed, setCameraAllowed, micAllowed, setMicAllowed, stream, cameraOn: !!stream, startCamera, stopCamera, micOn, setMicOn }),
    [cameraAllowed, micAllowed, stream, startCamera, stopCamera, micOn],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePrivacy = () => useContext(Ctx);
