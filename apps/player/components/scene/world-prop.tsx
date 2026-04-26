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

import { FencePost } from "@dnd-agent/three-engine";
import type { ExportedMapCell, ExportedPOI } from "@dnd-agent/shared";

import { StylizedTree } from "./props/stylized-tree";
import { StylizedRock } from "./props/stylized-rock";
import { StylizedBush } from "./props/stylized-bush";
import { StylizedCottage } from "./props/stylized-cottage";

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

/**
 * Deterministic small-state PRNG. Same seed in → same numbers out,
 * so a "tree" POI lays out the same on every render and a forest of
 * trees doesn't shimmer when the camera pans.
 */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/**
 * Three trees in a tight cluster, with stable random offsets and a
 * gentle wind sway on the whole group. A single tree reads as "demo
 * art"; three at varied scales read as "a real spot in the world".
 */
function TreeCluster({ scale, seed }: { scale: number; seed: number }) {
  const rootRef = useRef<THREE.Group>(null);

  const offsets = useMemo(() => {
    const rng = mulberry32(seed);
    // Each child gets its own seed so canopy color jitter varies
    // per-tree even within a single cluster.
    return [
      {
        x: 0,
        z: 0,
        s: scale,
        phase: rng() * Math.PI * 2,
        childSeed: (seed * 31 + 1) >>> 0,
      },
      {
        x: (rng() - 0.5) * 1.4,
        z: (rng() - 0.5) * 1.4,
        s: scale * (0.55 + rng() * 0.25),
        phase: rng() * Math.PI * 2,
        childSeed: (seed * 31 + 2) >>> 0,
      },
      {
        x: (rng() - 0.5) * 1.6,
        z: (rng() - 0.5) * 1.6,
        s: scale * (0.45 + rng() * 0.25),
        phase: rng() * Math.PI * 2,
        childSeed: (seed * 31 + 3) >>> 0,
      },
    ];
  }, [scale, seed]);

  // Wind: a slow lean on the whole cluster, plus per-tree phase so
  // they don't sway in lockstep. Small angles only — anything more
  // than a few degrees and trees start to look like jelly.
  useFrame((state) => {
    if (!rootRef.current) return;
    const t = state.clock.elapsedTime;
    rootRef.current.children.forEach((child, i) => {
      const phase = offsets[i]?.phase ?? 0;
      child.rotation.z = Math.sin(t * 0.7 + phase) * 0.035;
      child.rotation.x = Math.cos(t * 0.5 + phase) * 0.02;
    });
  });

  return (
    <group ref={rootRef}>
      {offsets.map((o, i) => (
        <StylizedTree
          key={i}
          position={[o.x, 0, o.z]}
          scale={o.s}
          seed={o.childSeed}
        />
      ))}
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
  const seed = useMemo(() => hashString(poi.id), [poi.id]);
  const scale = useMemo(() => {
    const norm = (seed % 1000) / 1000;
    return 0.85 + norm * 0.4; // 0.85..1.25
  }, [seed]);

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
        <TreeCluster scale={scale} seed={seed} />
      ) : kind === "rock" ? (
        <StylizedRock scale={scale} seed={seed} />
      ) : kind === "bush" ? (
        <StylizedBush scale={scale} seed={seed} />
      ) : kind === "fence" ? (
        <FencePost position={[0, 0, 0]} />
      ) : kind === "building" ? (
        <StylizedCottage size={poi.size} />
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
