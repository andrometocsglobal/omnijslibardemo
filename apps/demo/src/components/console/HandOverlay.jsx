/** Glowing holographic cursors, one per tracked hand. */
export default function HandOverlay({ cursors, consoleRef }) {
  const r = consoleRef.current?.getBoundingClientRect();
  if (!r) return null;
  return (
    <div className="hand-overlay" aria-hidden>
      {Object.entries(cursors).map(([hand, c]) => {
        const pinching = c.gesture?.startsWith("PINCH");
        return (
          <div
            key={hand}
            className={`hand-cursor ${pinching ? "pinch" : ""} ${c.gesture === "FIST" ? "grab" : ""}`}
            style={{ transform: `translate(${c.clientX - r.left}px, ${c.clientY - r.top}px)` }}
          >
            <span className="ring" />
            <span className="label">{hand} · {c.gesture ?? "…"}</span>
          </div>
        );
      })}
    </div>
  );
}
