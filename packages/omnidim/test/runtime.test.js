import { describe, expect, it } from "vitest";
import {
  HornReplay, HornMixer, HornWorkerSplit, defaultStreams, counterHash, ksUniform, bridgeScenarios, normalInv,
  PersonaRuntime, evaluateAction, MemoryStore, classifyGesture, GestureTracker, compressStroke, decompressStroke,
  PresenceDetector, AnchorManager, OneEuroFilter, runSuite,
} from "../src/index.js";

describe("HORN", () => {
  it("counter replay is deterministic and random-access", () => {
    const r = new HornReplay(123);
    const seq = r.range(2, 0, 1000);
    expect(r.at(2, 777)).toBe(seq[777]);
    expect(new HornReplay(123).at(2, 777)).toBe(seq[777]);
    expect(r.at(3, 777)).not.toBe(seq[777]);
    expect(seq.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it("streams look uniform (KS)", () => {
    for (const s of defaultStreams(9)) {
      const xs = Array.from({ length: 4000 }, () => s.next());
      expect(ksUniform(xs)).toBeLessThan(0.03);
    }
    const xs = Array.from({ length: 4000 }, (_, i) => counterHash(1, 0, i));
    expect(ksUniform(xs)).toBeLessThan(0.03);
  });
  it("mixer adapts and keeps uniform output", () => {
    const bad = { name: "stuck", next: () => 0.1 };
    const m = new HornMixer([...defaultStreams(5), bad], { window: 128 });
    const out = Array.from({ length: 2048 }, () => m.next());
    expect(m.active()).not.toContain("stuck");
    expect(ksUniform(out)).toBeLessThan(0.05);
  });
  it("worker split partitions exactly", () => {
    const p = new HornWorkerSplit(1).partition(10, 3);
    expect(p).toEqual([{ worker: 0, start: 0, count: 4 }, { worker: 1, start: 4, count: 3 }, { worker: 2, start: 7, count: 3 }]);
  });
  it("normalInv and bridge scenarios", () => {
    expect(normalInv(0.975)).toBeCloseTo(1.959964, 5);
    const sc = bridgeScenarios(105, 121, 2, { scenarios: 3, seed: 1 });
    expect(sc.length).toBe(3);
    expect(sc[0].length).toBe(2);
    expect(bridgeScenarios(105, 121, 2, { scenarios: 3, seed: 1 })).toEqual(sc);
  });
});

describe("4D persona runtime", () => {
  it("gate decisions", () => {
    const ctx = { mode: "ATTACHED", agentActionsEnabled: true, emergencyStop: false, lastAuthAt: 0 };
    expect(evaluateAction(0, ctx)).toBe("run");
    expect(evaluateAction(2, ctx)).toBe("run");
    expect(evaluateAction(2, ctx, true)).toBe("queue");
    expect(evaluateAction(3, ctx)).toBe("queue");
    expect(evaluateAction(5, ctx)).toBe("deny");
    expect(evaluateAction(5, { ...ctx, lastAuthAt: Date.now() })).toBe("queue");
    expect(evaluateAction(0, { ...ctx, emergencyStop: true })).toBe("deny");
  });
  it("detach → work → verify → reattach scenario", async () => {
    const rt = new PersonaRuntime(async (t) => `done: ${t.title}`, { store: new MemoryStore() });
    rt.instruct("Review today's tasks and prepare my project notes.", [
      { title: "Organize project information", level: 0 },
      { title: "Draft project notes", level: 2 },
      { title: "Calculate OMNIBAL values", level: 0 },
      { title: "Send notes by email", level: 4, external: true },
      { title: "Purchase licence", level: 5, external: true },
    ]);
    rt.setPresence("ABSENT");
    await new Promise((r) => setTimeout(r, 10));
    let s = rt.snapshot;
    expect(s.mode).toBe("DETACHED");
    expect(s.tasks.filter((t) => t.status === "done").length).toBe(3);
    expect(s.tasks.find((t) => t.level === 4).status).toBe("awaiting-approval");
    expect(s.tasks.find((t) => t.level === 5).status).toBe("blocked");
    rt.setPresence("PRESENT");
    expect(rt.snapshot.mode).toBe("VERIFYING");
    const msg = await rt.reattach(true);
    expect(msg).toBe("Welcome back. 3 tasks were prepared. No external actions were executed. 1 approval is waiting. 1 blocked. Would you like to review them?");
    expect(rt.snapshot.audit.length).toBeGreaterThan(3);
  });
  it("re-entrant work() never aborts the task in progress", async () => {
    const rt = new PersonaRuntime(async (t) => {
      await new Promise((r) => setTimeout(r, 20));
      return `ok ${t.title}`;
    });
    rt.instruct("x", [{ title: "a", level: 0 }, { title: "b", level: 1 }]);
    const first = rt.detach();
    await new Promise((r) => setTimeout(r, 5));
    await rt.work(); // e.g. a Background Sync wake-up while "a" is running
    await first;
    expect(rt.snapshot.tasks.map((t) => t.status)).toEqual(["done", "done"]);
  });
  it("emergency stop halts work", async () => {
    const rt = new PersonaRuntime(async () => "x");
    rt.instruct("x", [{ title: "a", level: 0 }]);
    rt.emergencyStop();
    await rt.detach();
    expect(rt.snapshot.tasks[0].status).toBe("pending");
  });
});

// Synthetic 21-point hands
function hand({ ext = [true, true, true, true, true], pinch = null } = {}) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  lm[0] = { x: 0.5, y: 0.9, z: 0 };
  const base = { 1: [0.42, 0.82], 5: [0.44, 0.7], 9: [0.5, 0.68], 13: [0.56, 0.7], 17: [0.61, 0.73] };
  for (const [k, [x, y]] of Object.entries(base)) lm[+k] = { x, y, z: 0 };
  const fingers = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
  fingers.forEach((ids, f) => {
    const mcp = lm[ids[0]];
    const dir = f === 0 ? { x: -0.06, y: -0.03 } : { x: (mcp.x - 0.5) * 0.3, y: -0.07 };
    for (let s = 1; s <= 3; s++) {
      const m = ext[f] ? s : s === 1 ? 1 : s === 2 ? 0.6 : 0.2;
      const curl = ext[f] ? 0 : (s - 1) * 0.06;
      lm[ids[s]] = { x: mcp.x + dir.x * m, y: mcp.y + dir.y * m + curl, z: 0 };
    }
  });
  if (!ext[0]) {
    // folded thumb lies across the palm
    lm[3] = { x: 0.47, y: 0.77, z: 0 };
    lm[4] = { x: 0.52, y: 0.74, z: 0 };
  }
  if (pinch !== null) lm[4] = { ...lm[[8, 12, 16, 20][pinch]] };
  return lm;
}

describe("gesture engine", () => {
  it("classifies synthetic hands", () => {
    expect(classifyGesture(hand()).gesture).toBe("OPEN_PALM");
    expect(classifyGesture(hand({ ext: [false, false, false, false, false] })).gesture).toBe("FIST");
    expect(classifyGesture(hand({ ext: [false, true, false, false, false] })).gesture).toBe("POINT");
    expect(classifyGesture(hand({ ext: [false, true, true, false, false] })).gesture).toBe("VICTORY");
    expect(classifyGesture(hand({ pinch: 0 })).gesture).toBe("PINCH_INDEX");
    expect(classifyGesture(hand({ pinch: 3 })).gesture).toBe("PINCH_PINKY");
  });
  it("tracker debounces and emits start/end", () => {
    const tr = new GestureTracker({ stableFrames: 3 });
    const events = [];
    tr.on("gesturestart", (e) => events.push(`start:${e.gesture}`));
    tr.on("gestureend", (e) => events.push(`end:${e.gesture}`));
    let t = 0;
    for (let i = 0; i < 4; i++) tr.update([{ landmarks: hand(), handedness: "Right" }], (t += 33));
    for (let i = 0; i < 4; i++) tr.update([{ landmarks: hand({ pinch: 0 }), handedness: "Right" }], (t += 33));
    tr.update([], (t += 33));
    expect(events).toEqual(["start:OPEN_PALM", "end:OPEN_PALM", "start:PINCH_INDEX", "end:PINCH_INDEX"]);
  });
  it("stroke compression round-trips grid-snapped points", () => {
    const pts = Array.from({ length: 200 }, (_, i) => ({ x: 100 + 4 * i, y: 50 + 2 * i }));
    const c = compressStroke(pts, { grid: 2 });
    expect(c.ratio).toBeGreaterThan(20);
    expect(c.mode).toBe("formula");
    expect(decompressStroke(c)).toEqual(pts);
  });
  it("irregular strokes fall back to raw storage (never larger)", () => {
    const pts = Array.from({ length: 30 }, (_, i) => ({ x: 100 + i * 7.3 + (i % 3), y: 50 + Math.sin(i) * 20 }));
    const c = compressStroke(pts, { grid: 2 });
    expect(c.mode).toBe("raw");
    expect(c.storedNumbers).toBeLessThanOrEqual(c.rawNumbers);
    expect(decompressStroke(c).length).toBe(30);
  });
});

describe("AR helpers", () => {
  it("presence hysteresis", () => {
    const p = new PresenceDetector({ enterFrames: 2, exitFrames: 3 });
    expect(p.update(true)).toBe("ABSENT");
    expect(p.update(true)).toBe("PRESENT");
    expect(p.update(false)).toBe("PRESENT");
    p.update(false);
    expect(p.update(false)).toBe("ABSENT");
  });
  it("anchors follow target", () => {
    const m = new AnchorManager(1);
    m.add("card", { offset: { x: 0.1, y: 0 } });
    expect(m.update({ x: 0.4, y: 0.4 })[0].pos).toEqual({ x: 0.5, y: 0.4 });
  });
  it("one-euro smooths", () => {
    const f = new OneEuroFilter();
    f.filter(0, 0);
    expect(Math.abs(f.filter(1, 16))).toBeLessThan(1);
  });
});

describe("benchmark suite", () => {
  it("runs and measures (no hard-coded numbers)", () => {
    const rows = runSuite(20_000);
    expect(rows.length).toBe(6);
    expect(rows[0].check).toBe("equal");
    for (const r of rows) expect(r.traditionalBytes).toBeGreaterThan(r.omniBytes);
  });
});
