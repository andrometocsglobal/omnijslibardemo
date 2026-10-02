/**
 * OMNIDIMENSIONAL GEOMETRY — Ball | Cube | Simplex | Cross-polytope
 * and regular-grid addressing.
 *
 * Unified lens:  V(d) = k(d)·s^d   (k = "fill number")
 * Surface law:   S = d·V/s holds when s is the INRADIUS (ball: R, cube: a/2).
 */
import { binomialNumber, gamma, lnGamma } from "./math.js";

const fact = (d) => gamma(d + 1);

export const Geometry = {
  ball: {
    /** V = π^(d/2)/Γ(d/2+1)·R^d. FIXED-DIMENSION O(1). */
    volume(d, R = 1) {
      return Math.exp((d / 2) * Math.log(Math.PI) - lnGamma(d / 2 + 1)) * Math.pow(R, d);
    },
    /** S = d·V/R. */
    surface(d, R = 1) {
      return (d * Geometry.ball.volume(d, R)) / R;
    },
    fill(d) {
      return Math.pow(Math.PI, d / 2) / gamma(d / 2 + 1);
    },
    /** Integer dimension with the largest unit-ball volume (5). */
    peakDimension(maxD = 40) {
      let best = 0, bestV = -Infinity;
      for (let d = 0; d <= maxD; d++) {
        const v = Geometry.ball.volume(d, 1);
        if (v > bestV) [best, bestV] = [d, v];
      }
      return best;
    },
  },
  cube: {
    volume: (d, a = 1) => Math.pow(a, d),
    /** S = 2d·a^(d−1). */
    surface: (d, a = 1) => 2 * d * Math.pow(a, d - 1),
    diagonal: (d, a = 1) => a * Math.sqrt(d),
    /** k-faces: C(d,k)·2^(d−k). */
    faces: (d, k) => binomialNumber(d, k) * Math.pow(2, d - k),
    fill: () => 1,
  },
  simplex: {
    /** Regular simplex, side a: a^d/d!·√((d+1)/2^d). */
    volume: (d, a = 1) => (Math.pow(a, d) / fact(d)) * Math.sqrt((d + 1) / Math.pow(2, d)),
    /** k-faces: C(d+1, k+1). */
    faces: (d, k) => binomialNumber(d + 1, k + 1),
    fill: (d) => Math.sqrt((d + 1) / Math.pow(2, d)) / fact(d),
  },
  crossPolytope: {
    /** Orthoplex, radius R: 2^d/d!·R^d. */
    volume: (d, R = 1) => (Math.pow(2, d) / fact(d)) * Math.pow(R, d),
    /** k-faces: 2^(k+1)·C(d, k+1). */
    faces: (d, k) => Math.pow(2, k + 1) * binomialNumber(d, k + 1),
    fill: (d) => Math.pow(2, d) / fact(d),
  },
  unified: {
    /** V(d) = k(d)·s^d for "ball" | "cube" | "simplex" | "crossPolytope". */
    volume(shape, d, s) {
      const k = shape === "ball" ? Geometry.ball.fill(d) : shape === "cube" ? 1 : shape === "simplex" ? Geometry.simplex.fill(d) : Geometry.crossPolytope.fill(d);
      return k * Math.pow(s, d);
    },
    /** S = d·V/r with r = inradius. */
    surface(d, volume, inradius) {
      return (d * volume) / inradius;
    },
  },
  /** Volumes for d = 1..maxD. */
  table(maxD = 10, size = 1) {
    const rows = [];
    for (let d = 1; d <= maxD; d++) {
      rows.push({
        d,
        ball: Geometry.ball.volume(d, size),
        cube: Geometry.cube.volume(d, size),
        simplex: Geometry.simplex.volume(d, size),
        crossPolytope: Geometry.crossPolytope.volume(d, size),
        cubeVertices: Geometry.cube.faces(d, 0),
        cubeEdges: Geometry.cube.faces(d, 1),
      });
    }
    return rows;
  },
};

/** Row-major strides: [Nx,Ny,Nz] → [Ny·Nz, Nz, 1]. O(d). */
export function strideMap(shape) {
  const strides = new Array(shape.length);
  let s = 1;
  for (let i = shape.length - 1; i >= 0; i--) {
    strides[i] = s;
    s *= shape[i];
  }
  return strides;
}

/** Total cells n1·…·nd, or n^d when called as (n, d). */
export function dimensionalCount(shape, d) {
  if (typeof shape === "number") return Math.pow(shape, d ?? 1);
  return shape.reduce((a, b) => a * b, 1);
}

/** Coordinate → index, e.g. ((x·Ny)+y)·Nz+z. FIXED-DIMENSION O(1). */
export function coordinateToIndex(coord, shape, strides = strideMap(shape)) {
  let idx = 0;
  for (let i = 0; i < shape.length; i++) {
    const c = coord[i];
    if (c < 0 || c >= shape[i]) throw new RangeError(`coordinate[${i}]=${c} outside 0..${shape[i] - 1}`);
    idx += c * strides[i];
  }
  return idx;
}

/** Index → coordinate via div/mod. FIXED-DIMENSION O(1). */
export function indexToCoordinate(index, shape) {
  const total = dimensionalCount(shape);
  if (index < 0 || index >= total) throw new RangeError(`index ${index} outside 0..${total - 1}`);
  const out = new Array(shape.length);
  for (let i = shape.length - 1; i >= 0; i--) {
    out[i] = index % shape[i];
    index = Math.floor(index / shape[i]);
  }
  return out;
}

/**
 * Nearest lattice cell: k_i = round((x_i − origin_i)/h_i).
 * FIXED-DIMENSION O(1). NOT general nearest-neighbour search.
 */
export function nearestGridCell(point, origin, spacing, shape) {
  const cell = [], snapped = [], residual = [];
  for (let i = 0; i < point.length; i++) {
    const h = typeof spacing === "number" ? spacing : spacing[i];
    let k = Math.round((point[i] - origin[i]) / h);
    if (shape) k = Math.min(Math.max(k, 0), shape[i] - 1);
    const s = origin[i] + k * h;
    cell.push(k);
    snapped.push(s);
    residual.push(point[i] - s);
  }
  return { cell, snapped, residual };
}

export const Grid = { strideMap, dimensionalCount, coordinateToIndex, indexToCoordinate, nearestGridCell };
