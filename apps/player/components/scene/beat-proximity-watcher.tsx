"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type {
  ExportedBeat,
  ExportedProject,
} from "@dnd-agent/shared";
import { useNarrativeStore } from "@/lib/narrative/narrative-store";

interface BeatProximityWatcherProps {
  project: ExportedProject;
  /** Live FPS player position. Map coords use (x, z) on the ground plane. */
  position: THREE.Vector3;
  /** Don't run while the dialogue overlay is up. */
  paused: boolean;
}

/**
 * Each frame, checks the player's distance against every beat. When
 * the player crosses *into* a beat's radius we fire it (if not
 * already-triggered for oneShot, and not already-inside this visit).
 * Crossing back out clears the inside flag so non-oneShot beats can
 * fire again on a future approach.
 *
 * Lives inside <Canvas> because that's where useFrame is valid.
 * Renders nothing.
 */
export function BeatProximityWatcher({
  project,
  position,
  paused,
}: BeatProximityWatcherProps) {
  const fireBeat = useNarrativeStore((s) => s.fireBeat);
  const markInside = useNarrativeStore((s) => s.markInside);
  const markOutside = useNarrativeStore((s) => s.markOutside);
  const setProximity = useNarrativeStore((s) => s.setProximity);

  // We don't want to read these from the store every frame — it would
  // re-subscribe and re-render. Pull them lazily on each tick instead.
  const lastInsideRef = useRef<Set<string>>(new Set());

  useFrame(() => {
    if (paused) return;

    const beats = project.map.beats;
    if (beats.length === 0) return;

    const px = position.x;
    const pz = position.z;
    const lastInside = lastInsideRef.current;
    const stillInside = new Set<string>();

    // Track the closest *non-triggered* beat for the approach HUD.
    const triggered = useNarrativeStore.getState().triggered;
    let closest: ExportedBeat | null = null;
    let closestDist = Infinity;

    for (const beat of beats) {
      // Beat coords are integer cell indices; convert to world by
      // adding the same +0.5 offset used by the spawn / FPS body so
      // distance is measured cell-center to cell-center.
      const dx = px - (beat.x + 0.5);
      const dz = pz - (beat.y + 0.5);
      const dist = Math.hypot(dx, dz);
      const inside = dist <= beat.radius;

      if (inside) {
        stillInside.add(beat.id);
        if (!lastInside.has(beat.id)) {
          // Crossed in this frame.
          markInside(beat.id);
          fireBeat(project, beat.id);
        }
      } else if (lastInside.has(beat.id)) {
        // Crossed out this frame.
        markOutside(beat.id);
      }

      if (!triggered.has(beat.id) && dist < closestDist) {
        closest = beat;
        closestDist = dist;
      }
    }

    setProximity(
      closest
        ? {
            beatId: closest.id,
            beatName: closest.name,
            distance: closestDist,
            radius: closest.radius,
          }
        : {
            beatId: null,
            beatName: null,
            distance: Infinity,
            radius: 0,
          },
    );

    lastInsideRef.current = stillInside;
  });

  return null;
}
