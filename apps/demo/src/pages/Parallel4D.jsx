import { useState } from "react";
import O from "../omni.js";
import { DEFAULT_PLAN, usePersona } from "../state/persona.jsx";
import IdentityCheck from "../components/IdentityCheck.jsx";

const STATUS_ICON = { pending: "○", running: "◐", done: "●", "awaiting-approval": "⚠", approved: "✔", rejected: "✖", blocked: "⛔", failed: "✖" };

/**
 * 4D Parallel Reality Layer — persistent persona state that keeps preparing
 * work while the real person is absent. Not a literal fourth dimension.
 */
export default function Parallel4D() {
  const { runtime, state } = usePersona();
  const [instruction, setInstruction] = useState("Review today's tasks and prepare my project notes.");
  const [welcome, setWelcome] = useState("");

  const plan = () => runtime.instruct(instruction, DEFAULT_PLAN);
  const leave = () => {
    setWelcome("");
    runtime.setPresence("ABSENT");
    if ("serviceWorker" in navigator) navigator.serviceWorker.ready.then((r) => r.sync?.register("omnidim-persona-sync")).catch(() => {});
  };
  const back = () => runtime.setPresence("PRESENT");
  const verified = async (ok) => {
    const msg = await runtime.reattach(ok);
    setWelcome(msg);
    O.speak(msg);
  };

  return (
    <div className="page">
      <h1>4D Layer · Parallel Reality</h1>
      <p className="muted">Persistent digital-persona state. It plans, drafts and simulates locally while you are away — and never executes external or high-impact actions without your approval.</p>

      <div className="cards4">
        <div className="stat"><span>Real user</span><b>{state.presence}</b></div>
        <div className="stat"><span>Persona</span><b>{state.mode}</b></div>
        <div className="stat"><span>Done</span><b>{state.tasks.filter((t) => t.status === "done").length}</b></div>
        <div className="stat"><span>Approvals</span><b>{state.tasks.filter((t) => t.status === "awaiting-approval").length}</b></div>
      </div>

      <div className="split">
        <div className="panel">
          <h3>1 · Instruction (3D)</h3>
          <textarea rows={2} value={instruction} onChange={(e) => setInstruction(e.target.value)} />
          <button className="btn btn-primary" onClick={plan}>Record & plan tasks</button>

          <h3>2 · Presence</h3>
          <div className="row gap wrap">
            <button className="btn" disabled={state.presence === "ABSENT"} onClick={leave}>🚶 I'm leaving (PRESENT → ABSENT)</button>
            <button className="btn" disabled={state.presence === "PRESENT"} onClick={back}>🙋 I'm back (ABSENT → PRESENT)</button>
          </div>
          <p className="muted small">Tip: the 5D AR page detects presence automatically from the camera (on-device face detection).</p>

          {state.mode === "VERIFYING" && <IdentityCheck onResult={verified} />}
          {welcome && <p className="reply">{welcome}</p>}

          <h3>Safety</h3>
          <div className="row gap wrap">
            <button className="btn btn-danger" onClick={() => runtime.emergencyStop()}>⏹ Emergency stop</button>
            <button className="btn" onClick={() => runtime.resume()}>Resume</button>
            <button className="btn" onClick={() => runtime.reset()}>Reset persona</button>
          </div>
          <p className="muted small">Browsers pause timers in hidden tabs. Work resumes when the page is visible again (or via Background Sync where supported). Nothing runs on a server.</p>
        </div>

        <div className="panel">
          <h3>Tasks</h3>
          <table className="table">
            <thead>
              <tr><th></th><th>Task</th><th>Level</th><th>Status</th></tr>
            </thead>
            <tbody>
              {state.tasks.map((t) => (
                <tr key={t.id}>
                  <td>{STATUS_ICON[t.status]}</td>
                  <td>
                    {t.title}
                    {t.result && <div className="muted small">{t.result}</div>}
                    {t.status === "awaiting-approval" && state.mode === "ATTACHED" && (
                      <div className="row gap">
                        <button className="btn sm btn-primary" onClick={() => runtime.approve(t.id, true)}>Approve</button>
                        <button className="btn sm" onClick={() => runtime.approve(t.id, false)}>Reject</button>
                      </div>
                    )}
                  </td>
                  <td title={O.ACTION_LEVELS[t.level]}>L{t.level}{t.external ? " · ext" : ""}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
              {!state.tasks.length && <tr><td colSpan={4} className="muted">No tasks yet — record an instruction.</td></tr>}
            </tbody>
          </table>

          <h3>Detach / reattach timeline</h3>
          <ol className="timeline">
            {[...state.timeline].reverse().slice(0, 30).map((e, i) => (
              <li key={i} className={`tl-${e.kind}`}><time>{new Date(e.at).toLocaleTimeString()}</time> {e.message}</li>
            ))}
          </ol>

          <details>
            <summary>Signed audit log ({state.audit.length})</summary>
            <table className="table small">
              <tbody>
                {[...state.audit].reverse().slice(0, 40).map((a, i) => (
                  <tr key={i}><td>{new Date(a.at).toLocaleTimeString()}</td><td>{a.action}</td><td>L{a.level}</td><td>{a.decision}</td><td><code>{a.signature ?? "—"}</code></td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </div>
    </div>
  );
}
