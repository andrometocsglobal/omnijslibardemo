import { describe, expect, it } from "vitest";
import {
  OmniArray, OmniRange, OmniSequence, OmniPrefix, OmniWindow, OmniSchedule, OmniGrid, OmniFormulaIndex,
  apSegment, gpSegment, serializeSegment, deserializeSegment, segmentValueAt,
  regularize, structuralize, OmniFitStream, classifyFamily, estimateInterval,
  coordinateToIndex, indexToCoordinate, strideMap, nearestGridCell,
  compressNumbers, decompressNumbers, formulaValueAt, OmniCache, MemoryStore, complexityCatalog, NOT_O1,
} from "../src/index.js";

describe("OmniSegment / OmniArray", () => {
  it("ten-billion element AP in O(1) space", () => {
    const a = OmniArray.ap(10, 10, 10_000_000_000n);
    expect(a.valueAt(9_999_999_999n)).toBe(100_000_000_000);
    expect(a.descriptorBytes()).toBeLessThan(400);
    expect(a.materializedBytes()).toBe(80_000_000_000n);
  });
  it("sparse exceptions adjust values and sums", () => {
    const a = OmniArray.ap(1, 1, 100);
    a.set(10, 1000);
    a.set(20, -5);
    expect(a.valueAt(10)).toBe(1000);
    expect(a.valueAt(11)).toBe(12);
    expect(a.sum()).toBe(5050 - 11 + 1000 - 21 - 5);
    expect(a.rangeSum(9, 11)).toBe(10 + 1000 + 12);
  });
  it("serialise round-trip", () => {
    const s = apSegment(5, 3, 1000n, 7n);
    s.exceptions.set(10n, 99);
    const back = deserializeSegment(JSON.parse(JSON.stringify(serializeSegment(s))));
    expect(segmentValueAt(back, 10n)).toBe(99);
    expect(segmentValueAt(back, 11n)).toBe(5 + 4 * 3);
  });
});

describe("formula data structures", () => {
  it("OmniRange", () => {
    const r = OmniRange.of(10, 10_000_000_001, 10);
    expect(r.length).toBe(1_000_000_000n);
    expect(r.contains(500)).toBe(true);
    expect(r.contains(505)).toBe(false);
    expect(r.at(3)).toBe(40n);
    expect(r.countBetween(15, 55)).toBe(4n);
    expect(OmniRange.of(1, 101).sum()).toBe(5050n);
  });
  it("OmniSequence piecewise", () => {
    const seq = new OmniSequence([apSegment(0, 1, 10, 0), gpSegment(1, 2, 5, 10)]);
    expect(seq.valueAt(9)).toBe(9);
    expect(seq.valueAt(12)).toBe(4);
    expect(seq.rangeSum(8, 11)).toBe(8 + 9 + 1 + 2);
    expect(seq.length).toBe(15n);
  });
  it("OmniPrefix / OmniWindow", () => {
    const p = new OmniPrefix("AP", 10, 10);
    expect(p.range(0, 4)).toBe(150);
    const w = new OmniWindow(p, 3);
    expect(w.sum(4)).toBe(30 + 40 + 50);
    const g = new OmniPrefix("GP", 1, 2);
    expect(g.range(0, 3)).toBe(15);
  });
  it("OmniSchedule", () => {
    const s = new OmniSchedule(0, 10, 1000);
    expect(s.nearest(31)).toBe(30);
    expect(s.next(31)).toBe(40);
    expect(s.previous(31)).toBe(30);
    expect(s.countBetween(5, 45)).toBe(4);
  });
  it("grid addressing round-trip", () => {
    const shape = [4, 5, 6];
    expect(strideMap(shape)).toEqual([30, 6, 1]);
    for (let i = 0; i < 120; i++) expect(coordinateToIndex(indexToCoordinate(i, shape), shape)).toBe(i);
    expect(coordinateToIndex([1, 2, 3], shape)).toBe((1 * 5 + 2) * 6 + 3);
    expect(nearestGridCell([2.4, 7.6], [0, 0], 2).cell).toEqual([1, 4]);
    const g = new OmniGrid([10, 10], [0, 0], [0.5, 0.5]);
    expect(g.nearest([1.26, 3.1]).cell).toEqual([3, 6]);
  });
  it("OmniFormulaIndex", () => {
    const idx = new OmniFormulaIndex();
    idx.set("sensor-1", new OmniSequence([apSegment(100, 5, 1e6)]));
    expect(idx.valueAt("sensor-1", 10)).toBe(150);
  });
});

describe("OmniFit", () => {
  const minutes = [0, 10, 20, 31, 40, 50, 61, 70];
  it("detects the common interval and regularises the research example", () => {
    expect(estimateInterval(minutes).interval).toBeCloseTo(10, 0);
    const r = regularize(minutes);
    expect(r.interval).toBe(10);
    expect(r.rows.map((x) => x.regularizedValue)).toEqual([0, 10, 20, 30, 40, 50, 60, 70]);
    expect(r.rows.map((x) => x.originalValue)).toEqual(minutes); // originals kept
    expect(r.rows[3].residual).toBe(1);
    expect(r.exceptions.length).toBe(0);
  });
  it("finds gaps and outliers", () => {
    const r = regularize([0, 10, 20, 50, 60, 64]);
    expect(r.missingK).toEqual([3, 4]);
    expect(r.exceptions.length).toBe(1); // 64 collides with slot 6
  });
  it("classifies families", () => {
    expect(classifyFamily([3, 7, 11, 15, 19]).family).toBe("AP");
    expect(classifyFamily([2, 6, 18, 54, 162]).family).toBe("GP");
    expect(classifyFamily([1, 1 / 2, 1 / 3, 1 / 4, 1 / 5]).family).toBe("HP");
    expect(classifyFamily([5, -3, 17, 2, 99, 4]).family).toBe("NOISE");
  });
  it("structuralize: segments + exceptions", () => {
    const data = [...Array.from({ length: 1000 }, (_, k) => 10 + 10 * k), 7, ...Array.from({ length: 20 }, (_, k) => 2 ** k)];
    const r = structuralize(data);
    expect(r.segments.length).toBe(2);
    expect(r.exceptions).toEqual([{ index: 1000, value: 7 }]);
    expect(r.stats.compressionRatio).toBeGreaterThan(50);
  });
  it("streaming OmniFit matches offline result", () => {
    const data = [1, 2, 3, 4, 5, 100, 200, 400, 800, 1600, 9, 8];
    const s = new OmniFitStream();
    data.forEach((x) => s.push(x));
    s.end();
    // 100, 200, 400, 800, 1600 is itself a GP run (ratio 2) starting at index 5
    expect(s.segments.map((g) => [g.family, Number(g.startIndex), Number(g.count)])).toEqual([["AP", 0, 5], ["GP", 5, 5]]);
    expect(s.exceptions.map((e) => e.index).sort((a, b) => a - b)).toEqual([10, 11]);
  });
});

describe("OmniCache", () => {
  it("formula-compresses regular arrays and round-trips", async () => {
    const values = Array.from({ length: 5000 }, (_, k) => 1700000000 + 600 * k);
    const c = compressNumbers(values);
    expect(c.worthIt).toBe(true);
    expect(c.ratio).toBeGreaterThan(100);
    expect(decompressNumbers(c.formula)).toEqual(values);
    expect(formulaValueAt(c.formula, 4321)).toBe(values[4321]);
  });
  it("tiers and dependency invalidation", async () => {
    const cache = new OmniCache({ store: new MemoryStore() });
    await cache.set("base", { a: 1 });
    await cache.set("derived", { b: 2 }, { deps: ["base"] });
    expect((await cache.get("base")).tier).toBe("L0");
    await cache.set("times", Array.from({ length: 100 }, (_, k) => k * 5));
    expect((await cache.get("times")).tier).toBe("L1");
    const removed = await cache.invalidate("base");
    expect(removed.sort()).toEqual(["base", "derived"]);
    const miss = await cache.get("derived", async () => ({ b: 3 }));
    expect(miss.tier).toBe("L4");
    expect(await cache.isStale("derived", { b: 3 })).toBe(false);
  });
});

describe("complexity catalogue", () => {
  it("documents every claim with conditions", () => {
    const cat = complexityCatalog();
    expect(cat.length).toBeGreaterThan(25);
    for (const c of cat) for (const k of ["time", "space", "preprocessing", "conditions", "limitation"]) expect(c[k]).toBeTruthy();
    expect(NOT_O1.find((x) => x.problem.includes("sort")).bound).toBe("Ω(N log N)");
  });
});
