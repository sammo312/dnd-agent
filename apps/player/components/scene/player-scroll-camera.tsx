"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { lerpCamera, type FirstPersonState } from "@dnd-agent/three-engine";

interface PlayerScrollCameraProps {
  scrollProgress: number;
  firstPerson: FirstPersonState;
  /** Imported map width in cells. */
  mapWidth: number;
  /** Imported map height in cells. */
  mapHeight: number;
  /** Cell coordinate the player spawns at when entering FPS. */
  spawn: { x: number; y: number };
  /** Eye height for the FPS dive. */
  eyeHeight?: number;
  /** Initial yaw in radians for the dive. Defaults to looking at map center. */
  diveFacing?: number;
}

/**
 * Drives the camera through the scroll-driven flythrough → FPS dive
 * for an arbitrarily-sized imported map.
 *
 * Stages:
 *  - 0.00 → 0.50: pure top-down birds-eye over the map center.
 *  - 0.50 → 0.85: tilt + pull toward the spawn point.
 *  - 0.85 → 1.00: dive to eye-height at spawn, easing into FPS facing.
 *
 * Once `firstPerson.active` flips on, the camera locks to the player's
 * position/rotation (handled identically to the demo scroll camera).
 */
export function PlayerScrollCamera({
  scrollProgress,
  firstPerson,
  mapWidth,
  mapHeight,
  spawn,
  eyeHeight = 0.7,
  diveFacing,
}: PlayerScrollCameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  // World-space spawn (cell center).
  const spawnWorld = new THREE.Vector3(spawn.x + 0.5, eyeHeight, spawn.y + 0.5);
  const mapCenter = new THREE.Vector3(mapWidth / 2, 0, mapHeight / 2);

  // Default facing: from spawn toward map center, so the dive ends with
  // the player looking "into" the world.
  const facing =
    diveFacing ??
    Math.atan2(mapCenter.x - spawnWorld.x, mapCenter.z - spawnWorld.z);

  // Top-down framing height — tall enough to fit the larger axis.
  const birdsEyeHeight = Math.max(mapWidth, mapHeight) * 0.95;
  const tiltHeight = Math.max(mapWidth, mapHeight) * 0.45;

  useFrame(() => {
    if (firstPerson.active) {
      const pos =
        firstPerson.position.y > 0.1 ? firstPerson.position : spawnWorld;
      const forward = new THREE.Vector3(
        Math.sin(firstPerson.rotation),
        0,
        Math.cos(firstPerson.rotation)
      );
      targetPosition.current.copy(pos);
      targetLookAt.current.copy(pos).add(forward.multiplyScalar(5));
    } else {
      let pos: THREE.Vector3;
      let lookAt: THREE.Vector3;

      if (scrollProgress < 0.5) {
        // Birds-eye, slowly drifting toward spawn-side of map.
        const t = scrollProgress / 0.5;
        const startPos = new THREE.Vector3(
          mapCenter.x,
          birdsEyeHeight,
          mapCenter.z + 0.1
        );
        const endPos = new THREE.Vector3(
          THREE.MathUtils.lerp(mapCenter.x, spawnWorld.x, 0.4),
          birdsEyeHeight * 0.85,
          THREE.MathUtils.lerp(mapCenter.z, spawnWorld.z, 0.4)
        );
        pos = new THREE.Vector3().lerpVectors(startPos, endPos, t);
        lookAt = mapCenter.clone();
      } else if (scrollProgress < 0.85) {
        // Tilt into the world: arc from above toward spawn.
        const t = (scrollProgress - 0.5) / 0.35;
        const eased = t * t * (3 - 2 * t);
        const startPos = new THREE.Vector3(
          THREE.MathUtils.lerp(mapCenter.x, spawnWorld.x, 0.4),
          birdsEyeHeight * 0.85,
          THREE.MathUtils.lerp(mapCenter.z, spawnWorld.z, 0.4)
        );
        const endPos = new THREE.Vector3(
          spawnWorld.x - Math.sin(facing) * 4,
          tiltHeight,
          spawnWorld.z - Math.cos(facing) * 4
        );
        pos = new THREE.Vector3().lerpVectors(startPos, endPos, eased);
        lookAt = new THREE.Vector3().lerpVectors(mapCenter, spawnWorld, eased);
      } else {
        // Final dive to eye-height at spawn, looking along `facing`.
        const t = (scrollProgress - 0.85) / 0.15;
        const eased = t * t * (3 - 2 * t);
        const startPos = new THREE.Vector3(
          spawnWorld.x - Math.sin(facing) * 4,
          tiltHeight,
          spawnWorld.z - Math.cos(facing) * 4
        );
        const endPos = spawnWorld.clone();
        pos = new THREE.Vector3().lerpVectors(startPos, endPos, eased);

        const forward = new THREE.Vector3(
          Math.sin(facing),
          0,
          Math.cos(facing)
        );
        const startLook = new THREE.Vector3().lerpVectors(
          mapCenter,
          spawnWorld,
          1
        );
        const endLook = spawnWorld.clone().add(forward.multiplyScalar(5));
        lookAt = new THREE.Vector3().lerpVectors(startLook, endLook, eased);
      }

      targetPosition.current.copy(pos);
      targetLookAt.current.copy(lookAt);
    }

    const lerpSpeed = firstPerson.active ? 0.2 : 0.08;
    lerpCamera(
      camera,
      targetPosition.current,
      currentLookAt.current,
      targetLookAt.current,
      lerpSpeed
    );
  });

  return null;
}
