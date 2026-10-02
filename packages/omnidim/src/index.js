/**
 * OMNIDIM JS — @omniballabs/omnidim
 *
 *   <script src="omnidim.umd.js"></script>   → window.OmniDim
 *   import * as OmniDim from "@omniballabs/omnidim"
 *
 * Families:   AP · GP · HP · Geometry          (OMNIBAL deterministic kernel)
 * Structure:  OmniFit → OmniSegment → formula data structures
 * Uncertainty: HORN (not cryptographic)
 * Runtime:    OmniCache · storage · identity · 4D agents · gesture · AR · perf
 */
export const VERSION = "0.1.0";

export * from "./complexity.js";
export * from "./math.js";
export { AP, momentBlock, MOMENT_BLOCK_POLYNOMIALS } from "./ap.js";
export { GP } from "./gp.js";
export { HP } from "./hp.js";
export { Geometry, Grid, strideMap, dimensionalCount, coordinateToIndex, indexToCoordinate, nearestGridCell } from "./geometry.js";
export * from "./segment.js";
export * from "./datastructures.js";
export { OmniFit, OmniFitStream, differences, ratios, estimateInterval, niceInterval, regularize, scoreFamilies, classify as classifyFamily, structuralize } from "./omnifit.js";
export * from "./horn.js";
export * from "./storage.js";
export * from "./cache.js";
export * from "./identity.js";
export * from "./agents.js";
export * from "./spatial.js";
export { Gesture, GestureTracker, classify as classifyGesture, extendedFingers, pinchDistances, handScale, cursorOf, palmCenter, compressStroke, decompressStroke, GESTURE_ACTIONS } from "./gesture.js";
export * from "./ar.js";
export * from "./performance.js";
export * from "./runtime.js";
