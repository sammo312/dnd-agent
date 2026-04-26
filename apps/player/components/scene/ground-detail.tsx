"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ExportedMapCell } from "@dnd-agent/shared";

interface GroundDetailProps {
  cells: ExportedMapCell[][];
  width: number;
  height: number;
}

/**
 * Terrain ids that should sprout grass tufts and pebbles. Anything not
 * in this list (water, rock, stone-floor, etc.) stays bare so the
 * scatter actually communicates the *kind* of ground rather than just
 * carpeting the entire map.
 */
const GRASS_TILES = new Set(["grass", "meadow", "marsh", "swamp"]);
/** Forest tiles read better with denser tufts and *no* pebbles. */
const FOREST_TILES = new Set(["forest"]);
/** Stony tiles get pebbles only — no grass. */
const STONY_TILES = new Set(["mountain", "rock", "gravel", "dirt-road"]);

/**
 * Per-frame instanced scatter of grass tufts + pebbles across grass-y
 * tiles of the imported map. Two `<instancedMesh>` instances total —
 * even on a 50×50 map this is two draw calls instead of thousands.
 *
 * Layout is deterministic per cell coordinate so the world doesn't
 * shimmer between renders.
 */
export function GroundDetail({ cells, width, height }: GroundDetailProps) {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const pebbleRef = useRef<THREE.InstancedMesh>(null);

  // Pre-compute every instance's matrix once. We cap the totals so
  // pathologically large maps don't melt low-end GPUs.
  const { grassMatrices, pebbleMatrices } = useMemo(() => {
    const MAX_GRASS = 4500;
    const MAX_PEBBLES = 1500;
    const grass: THREE.Matrix4[] = [];
    const pebbles: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();

    // Cheap deterministic hash → unit float for (x, y, k).
    const hash = (x: number, y: number, k: number) => {
      let n = (x * 374761393 + y * 668265263 + k * 982451653) | 0;
      n = (n ^ (n >> 13)) * 1274126177;
      n = n ^ (n >> 16);
      return ((n >>> 0) % 1000) / 1000;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y]?.[x];
        if (!cell) continue;
        const isGrass = GRASS_TILES.has(cell.terrain);
        const isForest = FOREST_TILES.has(cell.terrain);
        const isStony = STONY_TILES.has(cell.terrain);
        if (!isGrass && !isForest && !isStony) continue;

        const baseY = (cell.elevation ?? 0) * 0.3 + 0.05; // sit on top
        const cellCx = x + 0.5;
        const cellCz = y + 0.5;

        // Grass tufts. Forest = more tufts.
        const tuftCount = isForest ? 6 : isGrass ? 3 : 0;
        for (let i = 0; i < tuftCount && grass.length < MAX_GRASS; i++) {
          const u = hash(x, y, i * 7 + 1);
          const v = hash(x, y, i * 7 + 2);
          const r = hash(x, y, i * 7 + 3);
          const tx = cellCx + (u - 0.5) * 0.85;
          const tz = cellCz + (v - 0.5) * 0.85;
          const sy = 0.12 + r * 0.18;
          dummy.position.set(tx, baseY + sy / 2, tz);
          dummy.rotation.set(0, r * Math.PI * 2, 0);
          dummy.scale.set(1, sy / 0.2, 1);
          dummy.updateMatrix();
          grass.push(dummy.matrix.clone());
        }

        // Pebbles. Grass = small chance, stony = guaranteed.
        const pebbleCount = isStony ? 4 : isGrass ? (hash(x, y, 100) < 0.3 ? 1 : 0) : 0;
        for (let i = 0; i < pebbleCount && pebbles.length < MAX_PEBBLES; i++) {
          const u = hash(x, y, i * 11 + 50);
          const v = hash(x, y, i * 11 + 51);
          const r = hash(x, y, i * 11 + 52);
          const tx = cellCx + (u - 0.5) * 0.85;
          const tz = cellCz + (v - 0.5) * 0.85;
          const s = 0.06 + r * 0.06;
          dummy.position.set(tx, baseY + s * 0.4, tz);
          dummy.rotation.set(r * 0.8, r * 6, r * 0.8);
          dummy.scale.set(s, s * 0.6, s);
          dummy.updateMatrix();
          pebbles.push(dummy.matrix.clone());
        }
      }
    }

    return { grassMatrices: grass, pebbleMatrices: pebbles };
  }, [cells, width, height]);

  // Push the precomputed matrices into the instanced mesh. Done in a
  // layout effect so it runs before paint and the mesh is never seen
  // at the origin.
  useLayoutEffect(() => {
    const g = grassRef.current;
    if (g) {
      grassMatrices.forEach((m, i) => g.setMatrixAt(i, m));
      g.count = grassMatrices.length;
      g.instanceMatrix.needsUpdate = true;
    }
    const p = pebbleRef.current;
    if (p) {
      pebbleMatrices.forEach((m, i) => p.setMatrixAt(i, m));
      p.count = pebbleMatrices.length;
      p.instanceMatrix.needsUpdate = true;
    }
  }, [grassMatrices, pebbleMatrices]);

  return (
    <group>
      {grassMatrices.length > 0 && (
        <instancedMesh
          ref={grassRef}
          args={[undefined, undefined, grassMatrices.length]}
          castShadow={false}
          receiveShadow
        >
          {/* Tall narrow cone reads as a grass blade. 4 segments is
              enough silhouette without exploding poly count. */}
          <coneGeometry args={[0.05, 0.2, 4]} />
          <meshStandardMaterial color="#5d9b41" roughness={1} />
        </instancedMesh>
      )}

      {pebbleMatrices.length > 0 && (
        <instancedMesh
          ref={pebbleRef}
          args={[undefined, undefined, pebbleMatrices.length]}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#7a716b" roughness={1} flatShading />
        </instancedMesh>
      )}
    </group>
  );
}
