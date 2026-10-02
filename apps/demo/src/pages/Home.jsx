import { Link } from "react-router-dom";
import { useMemo } from "react";
import O, { bytes, fmt } from "../omni.js";
import { usePersona } from "../state/persona.jsx";

export default function Home() {
  const caps = useMemo(() => O.capabilities(), []);
  const { state } = usePersona();
  const live = useMemo(() => {
    const t0 = performance.now();
    const arr = O.OmniArray.ap(10, 10, 10_000_000_000n);
    const v = arr.valueAt(9_999_999_999n);
    const ms = performance.now() - t0;
    return { v, ms, desc: arr.descriptorBytes(), mat: arr.materializedBytes() };
  }, []);

  const tiles = [
    { to: "/console", title: "Holo Console", sub: "Hand-gesture draw · notepad · document · zoom", icon: "✋" },
    { to: "/human", title: "3D Layer", sub: "Digital human · speech · expressions", icon: "☺" },
    { to: "/parallel", title: "4D Layer", sub: `Persona ${state.mode} · ${state.tasks.length} tasks`, icon: "∞" },
    { to: "/ar", title: "5D Layer", sub: "AR persona · attach / detach · WebXR", icon: "◈" },
    { to: "/formulas", title: "OMNIBAL", sub: "AP · GP · HP · Geometry", icon: "∑" },
    { to: "/omnifit", title: "OmniFit", sub: "Irregular → regular structure", icon: "≋" },
    { to: "/horn", title: "HORN", sub: "Replayable uncertainty (not crypto)", icon: "⚄" },
    { to: "/performance", title: "Performance", sub: "Measured on this device", icon: "⏱" },
  ];

  return (
    <div className="page">
      <section className="hero">
        <h1 className="holo-title">OMNIDIM JS</h1>
        <p>Omnidimensional JavaScript runtime & AR agent framework — <b>structure discovery</b> (OmniFit) → <b>formula storage</b> (OmniSegment) → <b>exact computation</b> (OMNIBAL) → <b>explicit uncertainty</b> (HORN).</p>
        <p className="muted">
          Live: element #9,999,999,999 of the AP 10, 20, 30… is <b>{fmt(live.v)}</b>, computed in {live.ms.toFixed(3)} ms from a {bytes(live.desc)} descriptor — the materialised array would need {bytes(live.mat)}.
        </p>
      </section>
      <div className="tiles">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="tile">
            <span className="tile-icon">{t.icon}</span>
            <b>{t.title}</b>
            <span className="muted small">{t.sub}</span>
          </Link>
        ))}
      </div>
      <h3>This device</h3>
      <div className="caps">
        {Object.entries(caps).map(([k, v]) => (
          <span key={k} className={`cap ${v ? "yes" : "no"}`}>{v ? "✓" : "✗"} {k}</span>
        ))}
      </div>
      <p className="muted small">
        Library loaded via <code>&lt;script src="/lib/omnidim.umd.js"&gt;</code> · <code>window.OmniDim</code> v{O.VERSION} · {Object.keys(O).length} exports. Everything runs client-side; there is no server API.
      </p>
    </div>
  );
}
