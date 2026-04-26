"use client";

import { Sparkles } from "@react-three/drei";

interface StylizedCottageProps {
  size: { w: number; h: number };
}

/**
 * Half-timbered cottage with stone foundation, lit windows, and a
 * smoking chimney. The lit windows + smoke are the two details that
 * make a building feel inhabited — without them this is just a box.
 *
 * Layout:
 *   - Stone footing (slight overhang at floor level)
 *   - Cream plaster main body + four dark cross-beams (front/back) and
 *     two on the sides for the half-timber look.
 *   - Hipped roof from a 4-sided cone, slightly wider than the walls
 *     so it casts a clean eave shadow.
 *   - Front door + two windows on the front face. Windows are emissive
 *     warm yellow so they read at night/dusk lighting.
 *   - Brick chimney in the back-right corner with rising smoke.
 */
export function StylizedCottage({ size }: StylizedCottageProps) {
  const w = Math.max(0.9, size.w * 0.9);
  const d = Math.max(0.9, size.h * 0.9);
  const wallH = 0.95;
  const roofH = 0.7;
  const beam = 0.05; // half-timber strip thickness
  const eave = 0.15; // roof overhang

  return (
    <group>
      {/* Stone foundation */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.1, 0.16, d + 0.1]} />
        <meshStandardMaterial color="#4a4a4a" roughness={1} flatShading />
      </mesh>

      {/* Plaster main body */}
      <mesh position={[0, 0.16 + wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, d]} />
        <meshStandardMaterial color="#dac9a9" roughness={1} />
      </mesh>

      {/* Half-timber crossbeams — front/back faces.
          We cheat by floating thin dark boxes just outside the wall. */}
      {[d / 2 + 0.001, -d / 2 - 0.001].map((zSign, i) => (
        <group key={`fb-${i}`}>
          {/* horizontal sill + lintel */}
          <mesh position={[0, 0.16 + wallH * 0.18, zSign]}>
            <boxGeometry args={[w, beam, 0.02]} />
            <meshStandardMaterial color="#3a2616" roughness={1} />
          </mesh>
          <mesh position={[0, 0.16 + wallH * 0.82, zSign]}>
            <boxGeometry args={[w, beam, 0.02]} />
            <meshStandardMaterial color="#3a2616" roughness={1} />
          </mesh>
          {/* corner posts */}
          <mesh position={[w / 2 - beam / 2, 0.16 + wallH / 2, zSign]}>
            <boxGeometry args={[beam, wallH, 0.02]} />
            <meshStandardMaterial color="#3a2616" roughness={1} />
          </mesh>
          <mesh position={[-w / 2 + beam / 2, 0.16 + wallH / 2, zSign]}>
            <boxGeometry args={[beam, wallH, 0.02]} />
            <meshStandardMaterial color="#3a2616" roughness={1} />
          </mesh>
        </group>
      ))}

      {/* Front door */}
      <mesh position={[0, 0.16 + 0.32, d / 2 + 0.012]}>
        <boxGeometry args={[0.32, 0.6, 0.02]} />
        <meshStandardMaterial color="#2a1a10" roughness={1} />
      </mesh>

      {/* Two warm windows flanking the door — emissive so they glow */}
      {[-1, 1].map((side) => (
        <mesh
          key={`win-${side}`}
          position={[side * w * 0.32, 0.16 + wallH * 0.62, d / 2 + 0.012]}
        >
          <boxGeometry args={[0.22, 0.22, 0.02]} />
          <meshStandardMaterial
            color="#fff2c8"
            emissive="#ffcb6f"
            emissiveIntensity={0.9}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Hipped roof — slightly wider than walls for visible eaves */}
      <mesh position={[0, 0.16 + wallH + roofH / 2, 0]} castShadow>
        <coneGeometry
          args={[Math.max(w, d) * 0.62 + eave, roofH, 4, 1]}
        />
        <meshStandardMaterial color="#5a361c" roughness={1} flatShading />
      </mesh>

      {/* Chimney */}
      <mesh
        position={[w * 0.32, 0.16 + wallH + roofH * 0.65, -d * 0.28]}
        castShadow
      >
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshStandardMaterial color="#6b3a25" roughness={1} flatShading />
      </mesh>

      {/* Smoke wisps rising from the chimney */}
      <Sparkles
        count={20}
        size={5}
        speed={0.35}
        opacity={0.6}
        color="#dcd4c8"
        scale={[0.6, 1.6, 0.6]}
        position={[w * 0.32, 0.16 + wallH + roofH + 0.9, -d * 0.28]}
      />
    </group>
  );
}
