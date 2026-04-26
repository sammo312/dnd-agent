"use client";

import { useMemo } from "react";

interface StylizedBushProps {
  position?: [number, number, number];
  scale?: number;
  seed: number;
}

const FLOWER_COLORS = ["#f5b6c8", "#fef3c7", "#c084fc", "#fde047"];

/**
 * Layered icosphere bush with a few flower accents. Tiny but the
 * flowers are what make it read as "deliberately placed" instead of
 * a stray geometry blob.
 */
export function StylizedBush({ position = [0, 0, 0], scale = 1, seed }: StylizedBushProps) {
  const layout = useMemo(() => {
    let t = seed >>> 0;
    const rand = () => {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const flowerCount = 2 + Math.floor(rand() * 3); // 2..4
    return {
      flowers: Array.from({ length: flowerCount }, () => ({
        x: (rand() - 0.5) * 0.45,
        z: (rand() - 0.5) * 0.45,
        y: 0.32 + rand() * 0.08,
        color: FLOWER_COLORS[Math.floor(rand() * FLOWER_COLORS.length)] ?? "#fef3c7",
      })),
    };
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial color="#2f6b2f" roughness={1} />
      </mesh>
      <mesh position={[0.18, 0.28, 0.12]} castShadow>
        <icosahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial color="#3d7b3d" roughness={1} />
      </mesh>
      <mesh position={[-0.16, 0.24, -0.1]} castShadow>
        <icosahedronGeometry args={[0.21, 1]} />
        <meshStandardMaterial color="#4a8a4a" roughness={1} />
      </mesh>

      {/* Flower accents — tiny and bright; the eye picks them up. */}
      {layout.flowers.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, f.z]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial
            color={f.color}
            emissive={f.color}
            emissiveIntensity={0.15}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
