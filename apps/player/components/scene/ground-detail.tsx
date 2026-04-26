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
 * Terrain ids that should get a soft tone-jitter pass on top of the
 * cube. Anything not in this list (water, lava, paved roads, etc.)
 * stays untouched so the variation actually communicates "this is
 * alive ground" rather than carpeting the whole map.
 */
const NATURAL_TILES = new Set([
  "grass",
  "meadow",
  "forest",
  "swamp",
  "marsh",
  "dirt",
  "dirt-road",
  "gravel",
  "mountain",
  "rock",
  "sand",
  "desert",
]);

/**
 * Subtle ground texture variation. Instead of standing 3D blades and
 * pebbles (which read as discrete *objects* the player walks past),
 * we lay flat textured patches on top of natural-ground cells. From
 * eye level they read as ground texture; only the silhouettes of the
 * cube edges + props show through.
 *
 * Implementation: a single instanced flat ring of low-opacity discs,
 * tinted by terrain. One draw call covers the whole map.
 *
 * Cost on a 50×50 map: ~1 disc per natural cell, capped at 3500.
 */
export function GroundDetail({ cells, width, height }: GroundDetailProps) {
  const decalRef = useRef<THREE.InstancedMesh>(null);

  const { matrices, colors } = useMemo(() => {
    const MAX_DECALS = 3500;
    const ms: THREE.Matrix4[] = [];
    const cs: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    // Cheap deterministic hash → unit float for (x, y, k).
    const hash = (x: number, y: number, k: number) => {
      let n = (x * 374761393 + y * 668265263 + k * 982451653) | 0;
      n = (n ^ (n >> 13)) * 1274126177;
      n = n ^ (n >> 16);
      return ((n >>> 0) % 1000) / 1000;
    };

    // Tone shift table — what color the patch nudges *toward*. We
    // never paint the patch white or saturated; we only nudge a
    // little lighter or darker than the underlying terrain, which is
    // what real ground does in golden-hour light.
    const tonesByTerrain: Record<string, [string, string]> = {
      grass: ["#6fa552", "#3f6b30"],
      meadow: ["#8eb86b", "#4d7a3b"],
      forest: ["#3a5e2c", "#22381a"],
      swamp: ["#4f5c3a", "#2c331f"],
      marsh: ["#5a6a47", "#33402a"],
      dirt: ["#8c6a48", "#5a4128"],
      "dirt-road": ["#a08456", "#705733"],
      gravel: ["#9a948b", "#6b6660"],
      mountain: ["#9a948b", "#5b554f"],
      rock: ["#a09a92", "#5e5853"],
      sand: ["#e8d5a6", "#bfa372"],
      desert: ["#e0c890", "#b59a60"],
    };

    for (let y = 0; y < height && ms.length < MAX_DECALS; y++) {
      for (let x = 0; x < width && ms.length < MAX_DECALS; x++) {
        const cell = cells[y]?.[x];
        if (!cell) continue;
        if (!NATURAL_TILES.has(cell.terrain)) continue;

        const tones = tonesByTerrain[cell.terrain];
        if (!tones) continue;

        const baseY = (cell.elevation ?? 0) * 0.3 + 0.011; // hover just above
        const cellCx = x + 0.5;
        const cellCz = y + 0.5;

        // 1 patch per cell, varied size + offset so a row of grass
        // tiles doesn't look like a polka-dot pattern.
        const u = hash(x, y, 1);
        const v = hash(x, y, 2);
        const r = hash(x, y, 3);
        const t = hash(x, y, 4);

        const tx = cellCx + (u - 0.5) * 0.4;
        const tz = cellCz + (v - 0.5) * 0.4;
        const size = 0.55 + r * 0.45; // 0.55..1.0 cell-widths

        dummy.position.set(tx, baseY, tz);
        dummy.rotation.set(-Math.PI / 2, 0, t * Math.PI * 2);
        dummy.scale.set(size, size, 1);
        dummy.updateMatrix();
        ms.push(dummy.matrix.clone());

        // Tone: pick light or dark side, then jitter a hair so the
        // map reads as continuous variation rather than two flavors.
        const pick = t < 0.5 ? tones[0] : tones[1];
        const c = new THREE.Color(pick);
        const jitter = (hash(x, y, 9) - 0.5) * 0.06;
        c.offsetHSL(0, 0, jitter);
        cs.push(c);
      }
    }

    return { matrices: ms, colors: cs };
  }, [cells, width, height]);

  useLayoutEffect(() => {
    const m = decalRef.current;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    colors.forEach((c, i) => m.setColorAt(i, c));
    m.count = matrices.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  if (matrices.length === 0) return null;

  return (
    <instancedMesh
      ref={decalRef}
      args={[undefined, undefined, matrices.length]}
      receiveShadow
    >
      {/* A circular patch with 12 segments — soft enough silhouette
          to read as organic ground tone, cheap enough for thousands
          of instances. */}
      <circleGeometry args={[0.5, 12]} />
      <meshStandardMaterial
        // Per-instance tinting via setColorAt. White base lets the
        // tint pass through unchanged.
        color="#ffffff"
        roughness={1}
        // Big-deal: transparent + low opacity makes the patch feel
        // like a tone shift in the underlying ground rather than a
        // physical layer floating above it.
        transparent
        opacity={0.55}
        // Without polygon offset the decal z-fights with the cube
        // top face on flat terrain.
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
