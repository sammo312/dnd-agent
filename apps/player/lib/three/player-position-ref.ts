/**
 * Shared, non-reactive player-position ref.
 *
 * The first-person position lives in React state inside PlayerMapScene
 * because dialogue gating, scroll-camera handoff, and a couple of
 * watchers genuinely need re-renders when it changes. But for the
 * *hot path* — proximity-driven label fades, instanced ground decals,
 * any per-frame culling — every keystroke during walking triggering a
 * cascade of `<WorldProp>` re-renders is what tanks the framerate on
 * a busy map.
 *
 * This module is the escape hatch: a single mutable Vector3 that the
 * scene writes into on every movement frame, and that children read
 * from inside `useFrame` without subscribing to React. No re-renders,
 * no allocation per frame, and no Zustand subscription overhead.
 *
 * Single shared instance is fine — there's exactly one player at a
 * time, and `useFrame` always observes the current value.
 */
import * as THREE from "three";

export const playerPositionRef = {
  current: new THREE.Vector3(),
};

/**
 * Squared distance helper — saves a `Math.sqrt` per check, which adds
 * up when 50+ POIs run a distance test in `useFrame`.
 */
export function distanceToPlayerSq(x: number, z: number) {
  const p = playerPositionRef.current;
  const dx = p.x - x;
  const dz = p.z - z;
  return dx * dx + dz * dz;
}
