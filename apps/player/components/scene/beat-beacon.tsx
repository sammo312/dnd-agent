"use client";

/**
 * In-world objective beacon for a story beat.
 *
 * The brief: the player needs to instantly know "that thing over there
 * triggers a story event". The previous spinning octahedron looked
 * indistinguishable from POI props. This replaces it with the visual
 * grammar of an objective marker:
 *
 *   - A flat ring on the ground at the *exact* trigger radius, so the
 *     player can see where they need to walk.
 *   - A vertical column of warm light reaching skyward.
 *   - A pulsing halo + label hovering above the column.
 *   - A dimmed gray treatment once the beat has already fired, so the
 *     world doesn't shout at the player about places they've been.
 *
 * Color is locked to amber (`--accent`) — the same brand color used in
 * the import / dialogue UIs — so beacons read as "the same kind of
 * interactive object" everywhere the player encounters them.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import * as THREE from "three";

import type { ExportedBeat, ExportedMapCell } from "@dnd-agent/shared";

const ACTIVE_COLOR = "#f59e0b"; // amber — matches our brand accent
const TRIGGERED_COLOR = "#52525b"; // muted neutral when already played

interface BeatBeaconProps {
  beat: ExportedBeat;
  cells: ExportedMapCell[][];
  triggered: boolean;
}

export function BeatBeacon({ beat, cells, triggered }: BeatBeaconProps) {
  const groupRef = useRef<THREE.Group>(null);
  const columnRef = useRef<THREE.Mesh>(null);
  const ringPulseRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Stand the beacon on top of whatever terrain elevation is under it.
  // Match the same 0.3 vertical-scale factor used by the terrain mesh
  // so the column visibly rises from the ground rather than floating.
  const elevation = useMemo(() => {
    const cell = cells[beat.y]?.[beat.x];
    return (cell?.elevation ?? 0) * 0.3;
  }, [cells, beat.x, beat.y]);

  const color = triggered ? TRIGGERED_COLOR : ACTIVE_COLOR;
  // Column reaches well above any reasonable elevation so it's visible
  // from across the map without being so tall it pokes into the sky-
  // dome lighting.
  const columnHeight = 12;

  useFrame((state) => {
    if (triggered) return;
    const t = state.clock.elapsedTime;
    // Slow vertical drift on the column gives it presence without the
    // marker spinning frenetically like the old octahedron did.
    if (columnRef.current) {
      const m = columnRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + 0.12 * Math.sin(t * 1.6);
    }
    // Outer ring pulse — a second ring expands beyond the trigger
    // radius and fades out, reading as a beacon "ping".
    if (ringPulseRef.current) {
      const phase = (t % 2) / 2; // 0..1
      const pulseScale = 1 + phase * 0.6;
      ringPulseRef.current.scale.set(pulseScale, pulseScale, 1);
      const m = ringPulseRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.5 * (1 - phase);
    }
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.6;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[beat.x + 0.5, elevation + 0.01, beat.y + 0.5]}
    >
      {/* Trigger-radius ring on the ground. The player can literally
          see where they need to walk. Filled disc is faint; the outer
          stroke is what reads. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[Math.max(0, beat.radius - 0.08), beat.radius, 64]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={triggered ? 0.25 : 0.85}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0, beat.radius, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={triggered ? 0.05 : 0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Outward "ping" — only when active. */}
      {!triggered && (
        <mesh
          ref={ringPulseRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
        >
          <ringGeometry args={[beat.radius - 0.05, beat.radius, 64]} />
          <meshBasicMaterial
            color={ACTIVE_COLOR}
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Vertical column of light. Additive blending reads like
          volumetric light without needing a real volumetric pass. */}
      <mesh
        ref={columnRef}
        position={[0, columnHeight / 2, 0]}
        renderOrder={1}
      >
        <cylinderGeometry args={[0.18, 0.18, columnHeight, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={triggered ? 0.08 : 0.25}
          side={THREE.DoubleSide}
          blending={triggered ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Tighter inner core for a sharper beacon line. */}
      <mesh position={[0, columnHeight / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, columnHeight, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={triggered ? 0.2 : 0.7}
          depthWrite={false}
        />
      </mesh>

      {/* Hovering halo + label, sits at a comfortable read-height. */}
      <Billboard position={[0, 2.4, 0]}>
        <mesh ref={haloRef}>
          <ringGeometry args={[0.32, 0.42, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={triggered ? 0.3 : 0.85}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      <Html
        position={[0, 3.0, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="whitespace-nowrap rounded-none border px-2.5 py-1 text-[11px] tracking-wide shadow-lg"
          style={{
            fontFamily:
              'var(--font-mono, ui-monospace, "JetBrains Mono", monospace)',
            background: triggered
              ? "rgba(24, 24, 27, 0.85)"
              : "rgba(245, 158, 11, 0.95)",
            color: triggered ? "#a1a1aa" : "#0c0a09",
            borderColor: triggered
              ? "rgba(82, 82, 91, 0.6)"
              : "rgba(120, 53, 15, 0.9)",
          }}
        >
          {triggered ? "✓ " : "▼ "}
          {beat.name}
        </div>
      </Html>
    </group>
  );
}
