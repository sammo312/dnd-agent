"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface StylizedTreeProps {
  position?: [number, number, number];
  scale?: number;
  /** Seed drives foliage jitter so a forest doesn't look photocopied. */
  seed: number;
}

/**
 * Tapered trunk + 4-blob fluffy canopy. Reads as a stylized fantasy
 * tree (Quaternius / Kenney style) without authoring a GLTF:
 *
 *   - Cylinder trunk with the radius narrower at the top so it doesn't
 *     look like a fence post.
 *   - Stacked icospheres of decreasing size form the canopy. Smooth
 *     shading + slight per-blob color jitter gives the illusion of
 *     hand-painted leaf clumps.
 *   - High roughness + saturated green so the canopy reads warm under
 *     the golden-hour rig instead of plasticky.
 */
export function StylizedTree({ position = [0, 0, 0], scale = 1, seed }: StylizedTreeProps) {
  // Stable color jitter on the canopy. Two darker blobs at the bottom,
  // two brighter blobs on top, all clustered around #3f8a3f.
  const blobColors = useMemo(() => {
    // Cheap deterministic mix derived from seed bits.
    const tweak = (offset: number) =>
      ((((seed >>> offset) & 0xff) - 128) / 1280); // ~ ±0.1
    const base = new THREE.Color("#3f8a3f");
    return [
      new THREE.Color().copy(base).offsetHSL(tweak(0), 0, -0.05).getStyle(),
      new THREE.Color().copy(base).offsetHSL(tweak(8), 0, 0).getStyle(),
      new THREE.Color().copy(base).offsetHSL(tweak(16), 0, 0.04).getStyle(),
      new THREE.Color().copy(base).offsetHSL(tweak(24), 0, 0.08).getStyle(),
    ];
  }, [seed]);

  // Per-blob micro-jitter so each tree has a slightly different
  // silhouette without going abstract.
  const offsets = useMemo(() => {
    const j = (offset: number) => (((seed >>> offset) & 0xff) - 128) / 800;
    return [
      [j(2), 0, j(3)],
      [j(5), 0, j(6)],
      [j(9), 0, j(11)],
      [j(13), 0, j(15)],
    ] as Array<[number, number, number]>;
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      {/* Trunk — tapered, 8 radial segments for a cleaner outline */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.1, 8]} />
        <meshStandardMaterial color="#5c3b1e" roughness={1} metalness={0} />
      </mesh>

      {/* Canopy — four stacked clumps, each smooth-shaded */}
      <mesh position={[0 + offsets[0][0], 1.05, 0 + offsets[0][2]]} castShadow>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color={blobColors[0]} roughness={1} />
      </mesh>
      <mesh position={[0 + offsets[1][0], 1.35, 0 + offsets[1][2]]} castShadow>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={blobColors[1]} roughness={1} />
      </mesh>
      <mesh position={[0 + offsets[2][0], 1.65, 0 + offsets[2][2]]} castShadow>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color={blobColors[2]} roughness={1} />
      </mesh>
      <mesh position={[0 + offsets[3][0], 1.92, 0 + offsets[3][2]]} castShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={blobColors[3]} roughness={1} />
      </mesh>
    </group>
  );
}
