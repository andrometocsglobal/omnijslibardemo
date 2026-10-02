/**
 * 5D AR Layer helpers — camera, WebXR capability detection, screen anchors.
 * The camera is OFF by default and only starts on an explicit call.
 */
import { vec } from "./spatial.js";

/** Which XR modes this browser supports. */
export async function detectXR() {
  const xr = typeof navigator !== "undefined" ? navigator.xr : undefined;
  const out = { webxr: !!xr, immersiveAR: false, immersiveVR: false, camera: typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia };
  if (xr) {
    try {
      out.immersiveAR = await xr.isSessionSupported("immersive-ar");
    } catch {}
    try {
      out.immersiveVR = await xr.isSessionSupported("immersive-vr");
    } catch {}
  }
  return out;
}

/** Start the camera on explicit user action. Returns the MediaStream. */
export async function startCamera({ facingMode = "user", width = 1280, height = 720, audio = false } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera API not available in this browser");
  return navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: width }, height: { ideal: height } }, audio });
}

/** Stop every track of a stream (camera indicator turns off). */
export function stopStream(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

/**
 * Screen-space anchors: AR cards that follow a target (e.g. the person's head
 * or palm) with smoothing, or float freely when detached. O(anchors) per frame.
 */
export class AnchorManager {
  constructor(smoothing = 0.2) {
    this.smoothing = smoothing;
    this.anchors = new Map();
  }
  /** offset is relative to the target in normalised [0,1] screen units. */
  add(id, { offset = { x: 0, y: 0 }, content = null, free = { x: 0.5, y: 0.5 } } = {}) {
    this.anchors.set(id, { id, offset, content, pos: { ...free }, free });
    return this.anchors.get(id);
  }
  remove(id) {
    this.anchors.delete(id);
  }
  /** Move anchors toward target+offset (attached) or their free spot (detached). */
  update(target) {
    for (const a of this.anchors.values()) {
      const goal = target ? { x: target.x + a.offset.x, y: target.y + a.offset.y } : a.free;
      a.pos = { x: vec.clamp(vec.lerp(a.pos.x, goal.x, this.smoothing), 0, 1), y: vec.clamp(vec.lerp(a.pos.y, goal.y, this.smoothing), 0, 1) };
    }
    return [...this.anchors.values()];
  }
  list() {
    return [...this.anchors.values()];
  }
}

/** Presence from face/hand detections with hysteresis (frames). */
export class PresenceDetector {
  constructor({ enterFrames = 5, exitFrames = 45 } = {}) {
    Object.assign(this, { enterFrames, exitFrames, present: false, seen: 0, missing: 0 });
  }
  /** Feed one frame's detection result; returns "PRESENT" | "ABSENT". */
  update(detected) {
    if (detected) {
      this.seen++;
      this.missing = 0;
      if (!this.present && this.seen >= this.enterFrames) this.present = true;
    } else {
      this.missing++;
      this.seen = 0;
      if (this.present && this.missing >= this.exitFrames) this.present = false;
    }
    return this.present ? "PRESENT" : "ABSENT";
  }
}
