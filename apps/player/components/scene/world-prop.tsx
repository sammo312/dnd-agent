"use client";

/**
 * Player-side rendering of a POI from the export.
 *
 * Design intent: POIs are scenery, not interactives. Beats are the only
 * thing that triggers dialogue, so POIs need to *recede* visually
 * compared to the new beat beacons.
 *
 *   - If the export ships a `gltfUrl`, use it (real asset wins).
 *   - Otherwise pick a procedural prop (tree / rock / bush / fence /
 *     building) by sniffing the `type`, `icon`, or `name` strings.
 *   - As a last resort, render the icon as a small grounded billboard
 *     — but never with a permanent floating label, which is what made
 *     the world feel like a menu of buttons.
 *   - Names only appear when the player is close enough to read them
 *     organically (within 5 tiles).
 */

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

import {
  FencePost,
  RunescapeBush,
  RunescapeRock,
  RunescapeTree,
} from "@dnd-agent/three-engine";
import type { ExportedMapCell, ExportedPOI } from "@dnd-agent/shared";

interface WorldPropProps {
  poi: ExportedPOI;
  cells: ExportedMapCell[][];
  /** Player position in world space — drives label fade. */
  playerPosition: [number, number, number];
}

type PropKind = "tree" | "rock" | "bush" | "fence" | "building" | "icon";

/**
 * Best-effort routing from a freeform POI to a procedural asset. The
 * workbench doesn't constrain `type`/`icon`, so we sniff the strings
 * the DM most likely typed.
 */
function classifyPOI(poi: ExportedPOI): PropKind {
  const haystack = `${poi.type} ${poi.icon} ${poi.name}`.toLowerCase();
  if (/(tree|forest|wood|oak|pine|fir)/.test(haystack)) return "tree";
  if (/(rock|stone|boulder|cliff|crag)/.test(haystack)) return "rock";
  if (/(bush|shrub|hedge|grass|fern)/.test(haystack)) return "bush";
  if (/(fence|post|stake|palisade)/.test(haystack)) return "fence";
  if (
    /(house|hut|inn|tavern|shop|tower|temple|chapel|building|cabin|barn|mill|fort|keep|castle)/.test(
      haystack,
    )
  ) {
    return "building";
  }
  // Emoji-based fallbacks for the common library entries.
  if (/🌳|🌲|🌴/.test(poi.icon)) return "tree";
  if (/🪨|⛰/.test(poi.icon)) return "rock";
  if (/🌿|🌱|🍀/.test(poi.icon)) return "bush";
  if (/🏠|🏡|🏚|🏰|⛪|🛖|🏯/.test(poi.icon)) return "building";
  return "icon";
}

function GLTFModel({ url, scale = 0.5 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={scale} />;
}

/** Tiny procedural cottage — flat-shaded, matches the Runescape props. */
function ProceduralBuilding({ size }: { size: { w: number; h: number } }) {
  const w = Math.max(0.8, size.w * 0.9);
  const d = Math.max(0.8, size.h * 0.9);
  const wallH = 0.9;
  const roofH = 0.6;
  return (
    <group>
      <mesh position={[0, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, wallH, d]} />
        <meshStandardMaterial color="#a1856b" flatShading />
      </mesh>
      <mesh position={[0, wallH + roofH / 2, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.75, roofH, 4]} />
        <meshStandardMaterial color="#5c3a1e" flatShading />
      </mesh>
      <mesh position={[0, 0.35, d / 2 + 0.01]}>
        <planeGeometry args={[0.25, 0.45]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
    </group>
  );
}

/** Last-resort grounded icon. Floats subtly so it's not a static decal. */
function IconSprite({ poi }: { poi: ExportedPOI }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    // Slow vertical bob on the wrapper group; Billboard inside it
    // continues to face the camera regardless.
    ref.current.position.y =
      0.6 + Math.sin(state.clock.elapsedTime * 1.2) * 0.05;
  });
  return (
    <group ref={ref}>
      <Billboard>
        <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div
            className="select-none text-3xl"
            style={{ textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}
          >
            {poi.icon || "•"}
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

export function WorldProp({ poi, cells, playerPosition }: WorldPropProps) {
  const groupRef = useRef<THREE.Group>(null);

  const posX = poi.x + poi.size.w / 2;
  const posZ = poi.y + poi.size.h / 2;

  const cellX = Math.floor(poi.x);
  const cellY = Math.floor(poi.y);
  const elevation = useMemo(() => {
    const cell = cells[cellY]?.[cellX];
    return (cell?.elevation ?? 0) * 0.3;
  }, [cells, cellX, cellY]);

  // Stable but varied scale so a forest of trees doesn't look like a
  // photocopy. Hash from the POI id.
  const scale = useMemo(() => {
    let h = 0;
    for (let i = 0; i < poi.id.length; i++) h = (h * 31 + poi.id.charCodeAt(i)) | 0;
    const norm = ((h >>> 0) % 1000) / 1000;
    return 0.85 + norm * 0.4; // 0.85..1.25
  }, [poi.id]);

  const kind = useMemo(() => classifyPOI(poi), [poi]);

  // Distance-gated label. Prevents the world from looking like a menu
  // unless the player is right next to a thing.
  const dx = playerPosition[0] - (poi.x + poi.size.w / 2);
  const dz = playerPosition[2] - (poi.y + poi.size.h / 2);
  const playerDist = Math.sqrt(dx * dx + dz * dz);
  const showLabel = playerDist < 5;

  return (
    <group ref={groupRef} position={[posX, elevation, posZ]}>
      {poi.gltfUrl ? (
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color="#52525b" wireframe />
            </mesh>
          }
        >
          <GLTFModel url={poi.gltfUrl} scale={0.5 * scale} />
        </Suspense>
      ) : kind === "tree" ? (
        <RunescapeTree position={[0, 0, 0]} scale={scale} />
      ) : kind === "rock" ? (
        <RunescapeRock position={[0, 0, 0]} scale={scale} />
      ) : kind === "bush" ? (
        <RunescapeBush position={[0, 0, 0]} scale={scale} />
      ) : kind === "fence" ? (
        <FencePost position={[0, 0, 0]} />
      ) : kind === "building" ? (
        <ProceduralBuilding size={poi.size} />
      ) : (
        <IconSprite poi={poi} />
      )}

      {showLabel && (
        <Html
          position={[0, 1.6, 0]}
          center
          distanceFactor={14}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="whitespace-nowrap rounded-none border px-2 py-0.5 text-[10px] tracking-wide shadow-md"
            style={{
              fontFamily:
                'var(--font-mono, ui-monospace, "JetBrains Mono", monospace)',
              background: "rgba(24, 24, 27, 0.85)",
              color: "#e4e4e7",
              borderColor: "rgba(82, 82, 91, 0.6)",
              opacity: Math.max(0, Math.min(1, (5 - playerDist) / 1.5)),
            }}
          >
            {poi.name}
          </div>
        </Html>
      )}
    </group>
  );
}
