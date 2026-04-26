"use client";

import { useMemo } from "react";

interface StylizedRockProps {
  position?: [number, number, number];
  scale?: number;
  /** Seed drives the cluster layout so rocks don't shimmer per-frame. */
  seed: number;
}

/**
 * Cluster of 3-4 weathered rocks with a small moss patch on the
 * largest one. The cluster shape (positions, rotations, scales) is
 * fully derived from the seed so identical POI ids always render
 * identically. Flat shading on the rock material reads as carved
 * stone; the moss is smooth-shaded to feel organic on top of it.
 */
export function StylizedRock({ position = [0, 0, 0], scale = 1, seed }: StylizedRockProps) {
  const rocks = useMemo(() => {
    // Deterministic small-state PRNG.
    let t = seed >>> 0;
    const rand = () => {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };

    const count = 3 + Math.floor(rand() * 2); // 3 or 4
    return Array.from({ length: count }, (_, i) => ({
      x: (rand() - 0.5) * 0.6,
      z: (rand() - 0.5) * 0.6,
      y: 0.05 + rand() * 0.05,
      r: 0.18 + rand() * 0.18,
      rx: rand() * 0.5,
      ry: rand() * Math.PI * 2,
      rz: rand() * 0.5,
      // Slightly varied gray so the cluster has internal contrast.
      shade: i % 2 === 0 ? "#6a6a6a" : "#525252",
    }));
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.y + r.r * 0.5, r.z]}
          rotation={[r.rx, r.ry, r.rz]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[r.r, 0]} />
          <meshStandardMaterial color={r.shade} roughness={1} flatShading />
        </mesh>
      ))}

      {/* Moss patch on the tallest rock — smooth-shaded so it visibly
          contrasts with the carved-stone facets below. */}
      {rocks[0] && (
        <mesh
          position={[rocks[0].x, rocks[0].y + rocks[0].r * 0.95, rocks[0].z]}
          castShadow
        >
          <icosahedronGeometry args={[rocks[0].r * 0.55, 1]} />
          <meshStandardMaterial color="#4d7a3a" roughness={1} />
        </mesh>
      )}
    </group>
  );
}
