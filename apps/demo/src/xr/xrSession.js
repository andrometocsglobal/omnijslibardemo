import * as THREE from "three";

/**
 * Minimal WebXR immersive-ar session (Android Chrome with ARCore, Quest
 * browser, …). Places floating task panels 1.2 m in front of the user.
 * Started only from an explicit button press.
 */
export async function startXRSession({ tasks = [], mode = "ATTACHED" } = {}) {
  if (!navigator.xr) throw new Error("WebXR not available");
  const session = await navigator.xr.requestSession("immersive-ar", { optionalFeatures: ["local-floor", "dom-overlay"], domOverlay: { root: document.body } });

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.style.display = "none";
  document.body.appendChild(renderer.domElement);
  await renderer.xr.setSession(session);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.2));

  const panel = (lines, title) => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 320;
    const g = c.getContext("2d");
    g.fillStyle = "rgba(3,7,18,0.82)";
    g.fillRect(0, 0, 512, 320);
    g.strokeStyle = "#22d3ee";
    g.lineWidth = 4;
    g.strokeRect(2, 2, 508, 316);
    g.fillStyle = "#67e8f9";
    g.font = "bold 30px sans-serif";
    g.fillText(title, 20, 44);
    g.fillStyle = "#e0f2fe";
    g.font = "22px sans-serif";
    lines.slice(0, 9).forEach((l, i) => g.fillText(l.slice(0, 40), 20, 84 + i * 26));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3125), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, side: THREE.DoubleSide }));
    return mesh;
  };

  const p1 = panel(tasks.length ? tasks : ["No tasks"], mode === "ATTACHED" ? "OMNIDIM workspace" : "Detached persona");
  p1.position.set(0, 0, -1.2);
  const p2 = panel(["Formulas: AP · GP · HP · Geometry", "No external actions executed"], "Status");
  p2.position.set(0.6, 0.2, -1.4);
  p2.rotation.y = -0.4;
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 1), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7490, wireframe: true }));
  orb.position.set(-0.5, 0.1, -1.1);
  scene.add(p1, p2, orb);

  renderer.setAnimationLoop((t) => {
    orb.rotation.y = t / 1000;
    orb.position.y = 0.1 + Math.sin(t / 600) * 0.03;
    renderer.render(scene, camera);
  });

  session.addEventListener("end", () => {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer.domElement.remove();
  });
  return session;
}
