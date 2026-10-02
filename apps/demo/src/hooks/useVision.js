import { useEffect, useRef, useState } from "react";

/**
 * On-device MediaPipe vision (hands + face) — frames never leave the browser.
 * WASM is self-hosted under /mediapipe/wasm (copied at build); the model
 * files are static downloads cached by the service worker.
 */
const WASM = "/mediapipe/wasm";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let filesetPromise = null;
async function fileset() {
  const { FilesetResolver } = await import("@mediapipe/tasks-vision");
  filesetPromise ??= FilesetResolver.forVisionTasks(WASM).catch(() => FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"));
  return filesetPromise;
}

async function createHands() {
  const { HandLandmarker } = await import("@mediapipe/tasks-vision");
  const fs = await fileset();
  const opts = (delegate) => ({ baseOptions: { modelAssetPath: HAND_MODEL, delegate }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
  try {
    return await HandLandmarker.createFromOptions(fs, opts("GPU"));
  } catch {
    return HandLandmarker.createFromOptions(fs, opts("CPU"));
  }
}

async function createFace() {
  const { FaceDetector } = await import("@mediapipe/tasks-vision");
  const fs = await fileset();
  try {
    return await FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" }, runningMode: "VIDEO" });
  } catch {
    return FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" }, runningMode: "VIDEO" });
  }
}

/**
 * Run detection on a <video> each animation frame.
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @param {{hands?: boolean, face?: boolean, active: boolean, onFrame: (r) => void}} opts
 */
export function useVision(videoRef, { hands = true, face = false, active, onFrame }) {
  const [status, setStatus] = useState("idle");
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    if (!active) {
      setStatus("idle");
      return;
    }
    let raf = 0;
    let cancelled = false;
    let handLm = null;
    let faceDet = null;
    let lastTs = -1;
    setStatus("loading models…");
    (async () => {
      try {
        [handLm, faceDet] = await Promise.all([hands ? createHands() : null, face ? createFace() : null]);
        if (cancelled) return;
        setStatus("tracking");
        const loop = () => {
          if (cancelled) return;
          const v = videoRef.current;
          if (v && v.readyState >= 2 && v.videoWidth) {
            const ts = performance.now();
            if (ts > lastTs) {
              lastTs = ts;
              const out = { t: ts, hands: [], face: null };
              if (handLm) {
                const r = handLm.detectForVideo(v, ts);
                out.hands = (r.landmarks ?? []).map((lm, i) => ({ landmarks: lm, handedness: r.handedness?.[i]?.[0]?.categoryName ?? `hand${i}` }));
              }
              if (faceDet) {
                const f = faceDet.detectForVideo(v, ts).detections?.[0];
                if (f) {
                  const b = f.boundingBox;
                  out.face = { x: 1 - (b.originX + b.width / 2) / v.videoWidth, y: (b.originY + b.height / 2) / v.videoHeight, w: b.width / v.videoWidth, h: b.height / v.videoHeight, score: f.categories?.[0]?.score ?? 0 };
                }
              }
              cb.current?.(out);
            }
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        if (!cancelled) setStatus(`vision unavailable: ${e.message ?? e}`);
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      handLm?.close?.();
      faceDet?.close?.();
    };
  }, [active, hands, face, videoRef]);

  return status;
}

/** Attach a MediaStream to a <video> ref. */
export function useVideoStream(videoRef, stream) {
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream ?? null;
    if (stream) v.play().catch(() => {});
  }, [videoRef, stream]);
}
