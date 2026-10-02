import { createContext, useContext, useEffect, useMemo, useState } from "react";
import O, { workerTask } from "../omni.js";

/**
 * One PersonaRuntime (from the OMNIDIM library) shared by the 4D and 5D pages.
 * Tasks run locally: OMNIBAL + HORN work in a Web Worker, drafts in IndexedDB.
 * Every audit entry is signed with a non-extractable device key.
 */
const Ctx = createContext(null);

const store = O.createStore("omnidim-persona", "state");
const drafts = O.createStore("omnidim-persona", "drafts");
const signer = new O.DeviceSigner();

async function runner(task, signal) {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 600)); // visible pacing for the demo timeline
  if (signal.aborted) throw new Error("aborted");
  const t = task.title.toLowerCase();
  if (t.includes("omnibal") || t.includes("simulation") || t.includes("calculate")) {
    const r = await workerTask("persona-task", { X: 1_000_000, p: 3, sims: 50_000 });
    return `Σk³ (k<10⁶) = ${r.powerSum.slice(0, 18)}… · HORN Monte-Carlo mean ${r.monteCarloMean.toFixed(4)} · ${r.ms.toFixed(1)} ms in worker`;
  }
  if (t.includes("draft") || t.includes("notes")) {
    const body = `# Project notes (draft)\n\nPrepared by the 4D persona on ${new Date().toLocaleString()}.\n\n- Review OMNIBAL formula families\n- Validate OmniFit on telemetry\n- Approvals pending: see 4D page`;
    await drafts.set(task.id, { title: task.title, body, at: Date.now() });
    return "Draft saved locally (IndexedDB) — nothing was sent anywhere.";
  }
  if (t.includes("organize") || t.includes("review")) {
    const keys = await drafts.keys();
    return `Organised ${keys.length} local draft(s) and today's task list.`;
  }
  return "Prepared locally.";
}

export const DEFAULT_PLAN = [
  { title: "Review today's tasks", level: 0 },
  { title: "Organize project information", level: 1 },
  { title: "Draft project notes", level: 2 },
  { title: "Calculate OMNIBAL values", level: 0 },
  { title: "Run HORN simulation", level: 1 },
  { title: "Share notes with team by email", level: 4, external: true },
  { title: "Archive old project files", level: 3 },
  { title: "Purchase cloud storage upgrade", level: 5, external: true },
];

export function PersonaProvider({ children }) {
  const runtime = useMemo(
    () =>
      new O.PersonaRuntime(runner, {
        store,
        signer: async (entry) => {
          try {
            const signed = await signer.sign({ personaId: "local-persona", deviceId: "this-device", timestamp: entry.at, actionType: entry.action, authorizationLevel: entry.level ?? -1 }, entry);
            return signed.signature.slice(0, 24) + "…";
          } catch {
            return undefined;
          }
        },
      }),
    [],
  );
  const [state, setState] = useState(runtime.snapshot);
  useEffect(() => {
    const off = runtime.subscribe(setState);
    runtime.restore();
    const onMsg = (e) => e.data?.type === "persona-sync" && runtime.state.mode === "DETACHED" && runtime.work();
    navigator.serviceWorker?.addEventListener?.("message", onMsg);
    const onVisible = () => document.visibilityState === "visible" && runtime.state.mode === "DETACHED" && runtime.work();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      off();
      navigator.serviceWorker?.removeEventListener?.("message", onMsg);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [runtime]);
  const value = useMemo(() => ({ runtime, state, drafts, signer }), [runtime, state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePersona = () => useContext(Ctx);
