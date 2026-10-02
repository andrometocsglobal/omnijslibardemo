import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import O from "../omni.js";

/**
 * Procedural holographic digital human (no external GLTF needed, so the demo
 * stays fully static). Supports face orientation, expressions, a wave
 * gesture and amplitude-driven lip movement.
 *
 * props: look {x,y} in [-1,1] · mouth 0..1 · expression · wave · presentation · hologram
 */
export default function Avatar({ look = { x: 0, y: 0 }, mouth = 0, expression = "neutral", wave = false, presentation = "neutral", hologram = false, position = [0, 0, 0], scale = 1 }) {
  const root = useRef();
  const head = useRef();
  const mouthRef = useRef();
  const armR = useRef();
  const browL = useRef();
  const browR = useRef();
  const style = O.presentationStyle(presentation);
  const accent = style.accent;
  const skin = hologram ? accent : "#e8c4a6";
  const mat = { transparent: hologram, opacity: hologram ? 0.55 : 1, emissive: hologram ? accent : "#000000", emissiveIntensity: hologram ? 0.6 : 0 };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (head.current) {
      head.current.rotation.y += (look.x * 0.6 - head.current.rotation.y) * 0.12;
      head.current.rotation.x += (look.y * 0.35 - head.current.rotation.x) * 0.12;
    }
    if (root.current) root.current.position.y = position[1] + Math.sin(t * 1.4) * 0.02; // breathing
    if (mouthRef.current) {
      const open = expression === "surprised" ? 0.9 : mouth;
      mouthRef.current.scale.y += (0.25 + open * 1.6 - mouthRef.current.scale.y) * 0.4;
      mouthRef.current.scale.x = expression === "smile" ? 1.35 : 1;
    }
    const browY = expression === "surprised" ? 0.36 : expression === "concerned" ? 0.3 : 0.33;
    if (browL.current) {
      browL.current.position.y = browY;
      browL.current.rotation.z = expression === "concerned" ? -0.25 : 0;
    }
    if (browR.current) {
      browR.current.position.y = browY;
      browR.current.rotation.z = expression === "concerned" ? 0.25 : 0;
    }
    if (armR.current) armR.current.rotation.z = wave ? -2.4 + Math.sin(t * 8) * 0.35 : -0.15;
  });

  return (
    <group ref={root} position={position} scale={scale}>
      {/* torso */}
      <mesh position={[0, -0.75, 0]}>
        <capsuleGeometry args={[0.38, 0.7, 8, 16]} />
        <meshStandardMaterial color={accent} {...mat} />
      </mesh>
      {/* arms */}
      <mesh position={[-0.5, -0.65, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.09, 0.6, 6, 12]} />
        <meshStandardMaterial color={skin} {...mat} />
      </mesh>
      <group ref={armR} position={[0.48, -0.35, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <capsuleGeometry args={[0.09, 0.6, 6, 12]} />
          <meshStandardMaterial color={skin} {...mat} />
        </mesh>
      </group>
      {/* neck + head */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 16]} />
        <meshStandardMaterial color={skin} {...mat} />
      </mesh>
      <group ref={head} position={[0, 0.32, 0]}>
        <mesh>
          <sphereGeometry args={[0.36, 32, 32]} />
          <meshStandardMaterial color={skin} {...mat} />
        </mesh>
        {style.hair !== "none" && (
          <mesh position={[0, 0.12, -0.04]} scale={[1.05, style.hair === "long" ? 1.2 : 0.8, 1.05]}>
            <sphereGeometry args={[0.36, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
            <meshStandardMaterial color={hologram ? accent : "#2b2118"} {...mat} />
          </mesh>
        )}
        {style.hair === "long" && (
          <mesh position={[0, -0.18, -0.2]}>
            <boxGeometry args={[0.62, 0.55, 0.12]} />
            <meshStandardMaterial color={hologram ? accent : "#2b2118"} {...mat} />
          </mesh>
        )}
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.06, 0.31]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#0b1020" emissive={hologram ? "#ffffff" : "#000"} emissiveIntensity={hologram ? 0.8 : 0} />
          </mesh>
        ))}
        <mesh ref={browL} position={[-0.12, 0.33, 0.29]}>
          <boxGeometry args={[0.12, 0.02, 0.02]} />
          <meshStandardMaterial color="#1f150e" />
        </mesh>
        <mesh ref={browR} position={[0.12, 0.33, 0.29]}>
          <boxGeometry args={[0.12, 0.02, 0.02]} />
          <meshStandardMaterial color="#1f150e" />
        </mesh>
        <mesh ref={mouthRef} position={[0, -0.14, 0.32]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#7f1d1d" />
        </mesh>
      </group>
    </group>
  );
}
