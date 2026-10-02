# 11 — WebXR / AR Roadmap

## Delivered

- Capability detection: `detectXR()` reports WebXR, `immersive-ar` and `immersive-vr`.
- A minimal `immersive-ar` session: three.js task panels 1.2 m ahead, an animated orb, and `dom-overlay` when available.
- Camera-based screen-space AR: `AnchorManager` cards that follow the face and float free when the persona is detached.
- Presence with hysteresis (`PresenceDetector`).

## Next

1. **Hit-test anchoring.** Use `XRHitTestSource` to pin persona panels to real surfaces such as a desk or wall, plus `XRAnchor` so they persist across frames.
2. **Hand input in XR.** Feed WebXR Hand Input (25 joints) into the same `GestureTracker`. This needs a joint-mapping adapter from the 25 XR joints to the 21 MediaPipe landmarks, so console gestures work in a headset.
3. **Light estimation.** Light the hologram persona with `XRLightProbe`.
4. **Depth sensing.** Occlude the persona behind real objects.
5. **Avatar.** An optional GLTF / VRM avatar with blend-shape visemes driven by audio-amplitude lip sync (Web Audio `AnalyserNode`).
6. **Multi-device persona.** Sync the 4D state across devices with end-to-end encryption. This needs a relay server, so it is out of scope for the static build.
7. **WebGPU.** Render OMNIBAL lattices in compute shaders for very large grids, with addressing still O(1) per cell.
8. **Formula-compressed XR scene graphs.** Describe repeated geometry (grids, rings, AP spacings) with OmniSegments instead of per-object transforms.

## Platform matrix (2026)

| capability | Android Chrome | Quest Browser | Desktop Chrome | iOS Safari |
|---|---|---|---|---|
| camera + on-device ML | ✓ | ✓ | ✓ | ✓ |
| WebXR immersive-ar | ✓ (ARCore) | ✓ (passthrough) | — | — |
| WebXR hand input | — | ✓ | — | — |
| Background Sync | ✓ | ✓ | ✓ | — |
| passkeys | ✓ | ✓ | ✓ | ✓ |
