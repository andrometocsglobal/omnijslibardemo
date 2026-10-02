import { NavLink, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { usePrivacy } from "./state/privacy.jsx";
import { usePersona } from "./state/persona.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const HoloConsole = lazy(() => import("./pages/HoloConsole.jsx"));
const Human3D = lazy(() => import("./pages/Human3D.jsx"));
const Parallel4D = lazy(() => import("./pages/Parallel4D.jsx"));
const AR5D = lazy(() => import("./pages/AR5D.jsx"));
const FormulaLab = lazy(() => import("./pages/FormulaLab.jsx"));
const OmniFitLab = lazy(() => import("./pages/OmniFitLab.jsx"));
const HornLab = lazy(() => import("./pages/HornLab.jsx"));
const CacheLab = lazy(() => import("./pages/CacheLab.jsx"));
const ComplexityLab = lazy(() => import("./pages/ComplexityLab.jsx"));
const Performance = lazy(() => import("./pages/Performance.jsx"));
const Security = lazy(() => import("./pages/Security.jsx"));

export const NAV = [
  { to: "/", label: "Home", icon: "◎", end: true },
  { to: "/console", label: "Holo Console", icon: "✋" },
  { to: "/human", label: "3D Human", icon: "☺" },
  { to: "/parallel", label: "4D Parallel", icon: "∞" },
  { to: "/ar", label: "5D AR", icon: "◈" },
  { to: "/formulas", label: "OMNIBAL", icon: "∑" },
  { to: "/omnifit", label: "OmniFit", icon: "≋" },
  { to: "/horn", label: "HORN", icon: "⚄" },
  { to: "/cache", label: "Cache", icon: "▤" },
  { to: "/complexity", label: "Big-O", icon: "O" },
  { to: "/performance", label: "Perf", icon: "⏱" },
  { to: "/security", label: "Security", icon: "⛨" },
];

function StatusBar() {
  const { cameraOn, micOn } = usePrivacy();
  const { state } = usePersona();
  return (
    <div className="statusbar" role="status">
      <span className={`pill ${cameraOn ? "pill-live" : ""}`} title="Camera indicator">● CAM {cameraOn ? "ON" : "off"}</span>
      <span className={`pill ${micOn ? "pill-live" : ""}`} title="Microphone indicator">● MIC {micOn ? "ON" : "off"}</span>
      <span className="pill">PERSONA {state.mode}</span>
      {state.emergencyStop && <span className="pill pill-stop">EMERGENCY STOP</span>}
    </div>
  );
}

export default function App() {
  return (
    <div className="shell">
      <nav className="sidenav" aria-label="Main">
        <div className="brand">
          <img src="/icons/icon.svg" alt="" width="28" height="28" />
          <span>OMNIDIM</span>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `navlink ${isActive ? "active" : ""}`}>
            <span className="navicon" aria-hidden>{n.icon}</span>
            <span className="navlabel">{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="main">
        <StatusBar />
        <Suspense fallback={<div className="loading">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/console" element={<HoloConsole />} />
            <Route path="/human" element={<Human3D />} />
            <Route path="/parallel" element={<Parallel4D />} />
            <Route path="/ar" element={<AR5D />} />
            <Route path="/formulas" element={<FormulaLab />} />
            <Route path="/omnifit" element={<OmniFitLab />} />
            <Route path="/horn" element={<HornLab />} />
            <Route path="/cache" element={<CacheLab />} />
            <Route path="/complexity" element={<ComplexityLab />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/security" element={<Security />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
