"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContactShadows, Sky, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
  MovementHandler,
  TerrainGrid,
  TerrainMesh,
  WalkToTarget,
  type FirstPersonState,
} from "@dnd-agent/three-engine";
import type { ExportedProject } from "@dnd-agent/shared";
import { playerTerrainPalette } from "@/lib/three/terrain-palette";
import { useNarrativeStore } from "@/lib/narrative/narrative-store";
import { PlayerScrollCamera } from "./player-scroll-camera";
import { BeatProximityWatcher } from "./beat-proximity-watcher";
import { BeatBeacon } from "./beat-beacon";
import { WorldProp } from "./world-prop";
import { MapClickableGround } from "./map-clickable-ground";
import { TouchMovementHandler } from "./touch-movement-handler";
import { GroundDetail } from "./ground-detail";

interface PlayerMapSceneProps {
  project: ExportedProject;
  scrollProgress: number;
  firstPerson: FirstPersonState;
  setFirstPerson: React.Dispatch<React.SetStateAction<FirstPersonState>>;
  eyeHeight?: number;
}

/**
 * Renders the imported workbench project as a 3D scene:
 *
 *   - terrain mesh + grid driven by `project.map.cells`
 *   - POI markers (with optional GLTF) at their cell coords
 *   - narrative beat markers, mapped from the wire-format
 *     `ExportedBeat` shape onto three-engine's `PlacedNarrativeBeat`
 *   - scroll-driven camera that ends in an FPS dive at `map.spawn`
 *   - WASD/arrow movement + click-to-walk once FPS is active
 */
export function PlayerMapScene({
  project,
  scrollProgress,
  firstPerson,
  setFirstPerson,
  eyeHeight = 0.7,
}: PlayerMapSceneProps) {
  const { map } = project;
  const hasAutoEnteredRef = useRef(false);
  const [walkTarget, setWalkTarget] = useState<THREE.Vector3 | null>(null);

  // Map cells occupy positive world space [0..width] / [0..height].
  // The engine's MovementHandler / WalkToTarget default to (-10..10),
  // which silently traps the player in a 10×10 box on any larger map.
  // Use a single bounds box covering both axes (the engine API is
  // single-axis), and pad slightly inside the map so the player body
  // doesn't sink past the terrain edge.
  const movementBounds = {
    min: 0.5,
    max: Math.max(map.width, map.height) - 0.5,
  };

  // Narrative runtime: while a dialogue is active, freeze the player.
  const dialogueActive = useNarrativeStore((s) => s.active !== null);
  const firePrefaceIfNeeded = useNarrativeStore(
    (s) => s.firePrefaceIfNeeded,
  );
  // Drives the dim/gray treatment on already-played beacons.
  const triggeredBeats = useNarrativeStore((s) => s.triggered);

  // Auto-run the preface section the first time the player actually
  // enters the world (i.e. FPS engages). Doing it earlier would fire
  // before the map is composed; doing it later misses the dramatic
  // beat of the camera dive.
  useEffect(() => {
    if (firstPerson.active) firePrefaceIfNeeded(project);
  }, [firstPerson.active, firePrefaceIfNeeded, project]);

  const enterFirstPerson = useCallback(() => {
    const facing = Math.atan2(
      map.width / 2 - (map.spawn.x + 0.5),
      map.height / 2 - (map.spawn.y + 0.5)
    );
    setFirstPerson({
      active: true,
      pieceId: "player",
      position: new THREE.Vector3(
        map.spawn.x + 0.5,
        eyeHeight,
        map.spawn.y + 0.5
      ),
      rotation: facing,
    });
  }, [setFirstPerson, eyeHeight, map.spawn, map.width, map.height]);

  // Auto-enter FPS at scroll bottom (mirrors three-engine PlayerScene).
  useEffect(() => {
    if (
      scrollProgress >= 0.98 &&
      !firstPerson.active &&
      !hasAutoEnteredRef.current
    ) {
      hasAutoEnteredRef.current = true;
      enterFirstPerson();
    } else if (scrollProgress < 0.85 && hasAutoEnteredRef.current) {
      hasAutoEnteredRef.current = false;
    }
  }, [scrollProgress, firstPerson.active, enterFirstPerson]);

  const handleMove = useCallback(
    (newPos: THREE.Vector3) => {
      setFirstPerson((prev) => ({ ...prev, position: newPos }));
    },
    [setFirstPerson]
  );

  const handleRotate = useCallback(
    (newRotation: number) => {
      setFirstPerson((prev) => ({ ...prev, rotation: newRotation }));
    },
    [setFirstPerson]
  );

  const handleClickToWalk = useCallback(
    (pos: THREE.Vector3) => {
      if (firstPerson.active) {
        setWalkTarget(
          new THREE.Vector3(pos.x, firstPerson.position.y, pos.z)
        );
      }
    },
    [firstPerson]
  );

  const handleReachTarget = useCallback(() => {
    setWalkTarget(null);
  }, []);

  const hasCells = map.cells.length > 0 && map.cells[0]?.length > 0;

  return (
    <>
      <PlayerScrollCamera
        scrollProgress={scrollProgress}
        firstPerson={firstPerson}
        mapWidth={map.width}
        mapHeight={map.height}
        spawn={map.spawn}
        eyeHeight={eyeHeight}
      />

      {firstPerson.active && !dialogueActive && (
        <>
          {/* Keyboard (W/A/S/D) — desktop. */}
          <MovementHandler
            active={firstPerson.active}
            position={firstPerson.position}
            rotation={firstPerson.rotation}
            onMove={handleMove}
            onRotate={handleRotate}
            bounds={movementBounds}
          />
          {/* Virtual joystick + look-drag — touch. The two run in
              parallel so a tablet with a paired keyboard can use
              either. */}
          <TouchMovementHandler
            active={firstPerson.active}
            position={firstPerson.position}
            rotation={firstPerson.rotation}
            onMove={handleMove}
            onRotate={handleRotate}
            bounds={movementBounds}
          />
        </>
      )}

      <WalkToTarget
        active={walkTarget !== null && !dialogueActive}
        targetPosition={walkTarget}
        currentPosition={firstPerson.position}
        rotation={firstPerson.rotation}
        onMove={handleMove}
        onRotate={handleRotate}
        onReachTarget={handleReachTarget}
        bounds={movementBounds}
      />

      <MapClickableGround
        width={map.width}
        height={map.height}
        visible={firstPerson.active && !dialogueActive}
        onClickPosition={handleClickToWalk}
      />

      {firstPerson.active && (
        <BeatProximityWatcher
          project={project}
          position={firstPerson.position}
          paused={dialogueActive}
        />
      )}

      {/* Golden-hour lighting rig.
          - Hemisphere light grounds objects in sky/ground color
            (warm sky overhead, cool grass underneath) — way more
            convincing than a flat ambient.
          - Directional sun is dropped low on the horizon for long
            warm shadows. Shadow camera is sized to the map so the
            entire world shows contact, not just a 10×10 box. */}
      <hemisphereLight
        args={["#fde6b0", "#3b2f1a", 0.55]}
      />
      <directionalLight
        position={[map.width * 0.85, Math.max(map.width, map.height) * 0.7, map.height * 0.2]}
        intensity={1.4}
        color="#ffd6a0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={Math.max(map.width, map.height) * 3}
        shadow-camera-left={-map.width}
        shadow-camera-right={map.width}
        shadow-camera-top={map.height}
        shadow-camera-bottom={-map.height}
        shadow-bias={-0.0005}
      />
      <ambientLight intensity={0.18} color="#7a8aa6" />

      {/* Distance fog matched to the sky horizon — kills the
          "edge of the world" look on big maps. */}
      <fog
        attach="fog"
        args={[
          "#dab9a0",
          Math.max(map.width, map.height) * 0.4,
          Math.max(map.width, map.height) * 1.4,
        ]}
      />

      {/* Single-frame contact shadow plane covering the whole map.
          frames={1} bakes once on mount so we don't pay the depth
          pass every render — the world is largely static. */}
      <ContactShadows
        position={[map.width / 2, 0.02, map.height / 2]}
        scale={Math.max(map.width, map.height) * 1.2}
        resolution={1024}
        far={6}
        blur={2.4}
        opacity={0.55}
        frames={1}
      />

      {/* Drifting motes give the air physical depth. Scaled to the
          whole map so the player walks through them rather than
          past a single column. */}
      <Sparkles
        count={Math.min(220, map.width * map.height * 0.04)}
        size={3.2}
        speed={0.25}
        opacity={0.45}
        color="#fde6b0"
        scale={[map.width, 4, map.height]}
        position={[map.width / 2, 1.8, map.height / 2]}
      />

      {hasCells ? (
        <>
          <TerrainMesh
            cells={map.cells}
            width={map.width}
            height={map.height}
            terrains={playerTerrainPalette}
          />
          <TerrainGrid width={map.width} height={map.height} />
        </>
      ) : (
        // Empty cells (e.g. an unfinished export) — still draw a flat
        // ground plane so the DM can verify spawn / POIs are placed.
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[map.width / 2, 0, map.height / 2]}
          receiveShadow
        >
          <planeGeometry args={[map.width, map.height]} />
          <meshStandardMaterial color="#3d7a3d" />
        </mesh>
      )}

      {/* Scattered grass tufts + pebbles on grass-y / forest /
          stony tiles. Two instanced draw calls covering the whole
          map — adds the "lived in" texture the bare cube terrain
          was missing. */}
      <GroundDetail cells={map.cells} width={map.width} height={map.height} />

      {map.pois.map((poi) => (
        <WorldProp
          key={poi.id}
          poi={poi}
          cells={map.cells}
          playerPosition={[
            firstPerson.position.x,
            firstPerson.position.y,
            firstPerson.position.z,
          ]}
        />
      ))}

      {map.beats.map((beat) => (
        <BeatBeacon
          key={beat.id}
          beat={beat}
          cells={map.cells}
          triggered={triggeredBeats.has(beat.id)}
        />
      ))}

      {/* Spawn marker — a subtle ring so the DM can see where the
          player will start when the dive completes. */}
      <mesh
        position={[map.spawn.x + 0.5, 0.05, map.spawn.y + 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.35, 0.5, 32]} />
        <meshBasicMaterial color="#f5b04a" transparent opacity={0.85} />
      </mesh>

      {/* Sun dropped low + heavy rayleigh = warm sunset gradient.
          Mie scatter cranked so the sun bloom feels like late
          afternoon rather than mid-day flat lighting. */}
      <Sky
        sunPosition={[100, 8, 60]}
        turbidity={6}
        rayleigh={2.4}
        mieCoefficient={0.012}
        mieDirectionalG={0.92}
      />
    </>
  );
}
