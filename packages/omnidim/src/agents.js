/**
 * 4D Parallel Reality Layer — persistent persona *software* state machine.
 * (Not a literal fourth dimension: state that keeps planning while the real
 * person is absent.)
 *
 *   REAL PERSON → DETACH → 4D PERSONA (prepare, simulate, draft)
 *   4D PERSONA → identity check → REATTACH → summary → approvals → continue
 *
 * Action levels:
 *   0 read-only reasoning        → run
 *   1 prepare recommendation     → run
 *   2 create draft               → run (local only)
 *   3 queue reversible action    → awaits approval
 *   4 require user confirmation  → awaits approval
 *   5 prohibited w/o fresh auth  → blocked unless freshly authenticated
 *
 * Browser limitation: a suspended tab does not run timers. Work resumes when
 * the page is visible again — no unrestricted background execution is claimed.
 */

export const ACTION_LEVELS = {
  0: "Read-only reasoning",
  1: "Prepare recommendation",
  2: "Create draft",
  3: "Queue reversible action",
  4: "Require user confirmation",
  5: "Prohibited without explicit fresh authentication",
};

/**
 * Pure permission gate. O(1).
 * @returns {"run"|"queue"|"deny"}
 */
export function evaluateAction(level, ctx, external = false) {
  if (ctx.emergencyStop) return "deny";
  if (!ctx.agentActionsEnabled && level > 0) return "deny";
  if (level === 5) {
    const fresh = Date.now() - ctx.lastAuthAt < (ctx.freshAuthWindowMs ?? 60_000);
    return fresh && ctx.mode === "ATTACHED" ? "queue" : "deny";
  }
  if (external || level >= 3) return "queue";
  return "run";
}

const initialState = () => ({
  presence: "PRESENT",
  mode: "ATTACHED",
  tasks: [],
  timeline: [],
  audit: [],
  instruction: "",
  agentActionsEnabled: true,
  emergencyStop: false,
  lastAuthAt: 0,
  detachedAt: null,
});

let taskSeq = 0;

export class PersonaRuntime {
  /**
   * @param {(task, signal: AbortSignal) => Promise<string>} runner  local task executor
   * @param {{store?: object, signer?: (entry) => Promise<string|undefined>, storageKey?: string}} [opts]
   */
  constructor(runner, opts = {}) {
    this.runner = runner;
    this.opts = opts;
    this.state = initialState();
    this.listeners = new Set();
    this.abort = null;
  }
  get snapshot() {
    return this.state;
  }
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }
  _set(patch) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
    this.opts.store?.set(this.opts.storageKey ?? "persona-state", this.state);
  }
  _log(kind, message) {
    this._set({ timeline: [...this.state.timeline, { at: Date.now(), kind, message }].slice(-200) });
  }
  async _audit(entry) {
    const signature = await this.opts.signer?.(entry);
    this._set({ audit: [...this.state.audit, { ...entry, signature }].slice(-500) });
  }
  /** Restore persisted state; running tasks become pending again. */
  async restore() {
    const saved = await this.opts.store?.get(this.opts.storageKey ?? "persona-state");
    if (saved) {
      this.state = { ...initialState(), ...saved, tasks: saved.tasks.map((t) => (t.status === "running" ? { ...t, status: "pending" } : t)) };
      this.listeners.forEach((l) => l(this.state));
    }
  }
  /** Record an instruction and its planned tasks [{title, level, external?}]. */
  instruct(text, plan) {
    const now = Date.now();
    const tasks = plan.map((p) => ({ id: `t${++taskSeq}-${now.toString(36)}`, title: p.title, level: p.level, external: !!p.external, status: "pending", createdAt: now, updatedAt: now }));
    this._set({ instruction: text, tasks: [...this.state.tasks, ...tasks] });
    this._log("instruction", `Instruction recorded: “${text}” → ${tasks.length} tasks planned`);
  }
  /** Presence from a detector or manual toggle. */
  setPresence(p) {
    if (p === this.state.presence) return;
    this._set({ presence: p });
    this._log("presence", p === "PRESENT" ? "Presence ABSENT → PRESENT" : "Presence PRESENT → ABSENT");
    if (p === "ABSENT" && this.state.mode === "ATTACHED") this.detach();
    if (p === "PRESENT" && this.state.mode === "DETACHED") {
      this._set({ mode: "VERIFYING" });
      this._log("verify", "Identity confirmation requested before reattaching");
    }
  }
  async detach() {
    this._set({ mode: "DETACHED", detachedAt: Date.now() });
    this._log("detach", "Persona detached — continuing in the 4D parallel reality layer");
    await this.work();
  }
  /**
   * Run every pending task the gate allows. Re-entrant calls (visibility,
   * Background Sync, approvals) never abort the run in progress — they just
   * schedule another pass once it finishes.
   */
  async work() {
    if (this._working) {
      this._again = true;
      return;
    }
    this._working = true;
    const ac = new AbortController();
    this.abort = ac;
    try {
      do {
        this._again = false;
        let task;
        while (!ac.signal.aborted && !this.state.emergencyStop && (task = this.state.tasks.find((t) => t.status === "pending" || t.status === "approved"))) {
          await this._process(task, ac);
        }
      } while (this._again && !ac.signal.aborted && !this.state.emergencyStop);
    } finally {
      this._working = false;
    }
  }

  /** Gate one task, then run, queue or block it. */
  async _process(task, ac) {
    const decision = task.status === "approved" ? "run" : evaluateAction(task.level, this._ctx(), task.external);
    if (decision === "deny") {
      this._patch(task.id, { status: "blocked", result: `Blocked: ${ACTION_LEVELS[task.level]}` });
      await this._audit({ at: Date.now(), taskId: task.id, action: task.title, level: task.level, decision: "deny" });
      return;
    }
    if (decision === "queue") {
      this._patch(task.id, { status: "awaiting-approval" });
      await this._audit({ at: Date.now(), taskId: task.id, action: task.title, level: task.level, decision: "queue" });
      this._log("approval", `Approval required: ${task.title}`);
      return;
    }
    this._patch(task.id, { status: "running" });
    try {
      const result = await this.runner(task, ac.signal);
      this._patch(task.id, { status: "done", result });
      await this._audit({ at: Date.now(), taskId: task.id, action: task.title, level: task.level, decision: "executed" });
      this._log("task", `Completed: ${task.title}`);
    } catch (e) {
      this._patch(task.id, { status: ac.signal.aborted ? "pending" : "failed", result: ac.signal.aborted ? undefined : String(e) });
    }
  }
  _ctx() {
    const s = this.state;
    return { mode: s.mode, agentActionsEnabled: s.agentActionsEnabled, emergencyStop: s.emergencyStop, lastAuthAt: s.lastAuthAt };
  }
  _patch(id, patch) {
    this._set({ tasks: this.state.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)) });
  }
  /** After a passkey/PIN check. Returns the welcome summary. */
  async reattach(verified) {
    if (!verified) {
      this._log("verify", "Identity check failed — persona stays detached");
      this._set({ mode: "DETACHED" });
      return "Identity could not be confirmed. The persona remains detached.";
    }
    this._set({ mode: "ATTACHED", lastAuthAt: Date.now(), detachedAt: null });
    this._log("reattach", "Identity confirmed — persona reattached to the real person");
    return this.summary();
  }
  summary() {
    const t = this.state.tasks;
    const done = t.filter((x) => x.status === "done").length;
    const approvals = t.filter((x) => x.status === "awaiting-approval").length;
    const blocked = t.filter((x) => x.status === "blocked").length;
    return (
      `Welcome back. ${done} task${done === 1 ? " was" : "s were"} prepared. No external actions were executed.` +
      (approvals ? ` ${approvals} approval${approvals === 1 ? " is" : "s are"} waiting.` : "") +
      (blocked ? ` ${blocked} blocked.` : "") +
      " Would you like to review them?"
    );
  }
  async approve(taskId, approved) {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task || task.status !== "awaiting-approval") return;
    if (this.state.mode !== "ATTACHED") throw new Error("Approvals require the attached, verified user");
    this._patch(taskId, { status: approved ? "approved" : "rejected" });
    await this._audit({ at: Date.now(), taskId, action: task.title, level: task.level, decision: approved ? "approved" : "rejected" });
    this._log("approval", `${approved ? "Approved" : "Rejected"}: ${task.title}`);
    if (approved) await this.work();
  }
  setAgentActions(enabled) {
    this._set({ agentActionsEnabled: enabled });
  }
  emergencyStop() {
    this.abort?.abort();
    this._set({ emergencyStop: true, tasks: this.state.tasks.map((t) => (t.status === "running" ? { ...t, status: "pending" } : t)) });
    this._log("stop", "EMERGENCY STOP — all agent work halted");
  }
  resume() {
    this._set({ emergencyStop: false });
  }
  async reset() {
    this.abort?.abort();
    this.state = initialState();
    await this.opts.store?.delete(this.opts.storageKey ?? "persona-state");
    this.listeners.forEach((l) => l(this.state));
  }
}
