"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { type FirstPersonState } from "@dnd-agent/three-engine";
import type { ExportedProject } from "@dnd-agent/shared";
import { PlayerMapScene } from "./scene/player-map-scene";

interface PlayerViewProps {
  project: ExportedProject;
  scrollProgress: number;
  onFirstPersonChange?: (active: boolean) => void;
}

export default function PlayerView({
  project,
  scrollProgress,
  onFirstPersonChange,
}: PlayerViewProps) {
  const [firstPerson, setFirstPerson] = useState<FirstPersonState>({
    active: false,
    pieceId: null,
    position: new THREE.Vector3(),
    rotation: 0,
  });

  // Notify parent of first person state changes
  useEffect(() => {
    onFirstPersonChange?.(firstPerson.active);
  }, [firstPerson.active, onFirstPersonChange]);

  // Handle escape key and exitFirstPerson event
  useEffect(() => {
    const handleExit = () => {
      setFirstPerson({
        active: false,
        pieceId: null,
        position: new THREE.Vector3(),
        rotation: 0,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && firstPerson.active) {
        handleExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("exitFirstPerson", handleExit);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("exitFirstPerson", handleExit);
    };
  }, [firstPerson.active]);

  // Initial camera position: top-down over the imported map. The
  // PlayerScrollCamera will lerp from here on the first frame.
  const { width, height } = project.map;
  const initialY = Math.max(width, height) * 0.95;

  return (
    <Canvas
      camera={{
        position: [width / 2, initialY, height / 2 + 0.1],
        fov: 50,
      }}
      shadows
      // Cap dpr at 2 — anything higher costs perf without a visible
      // gain on retina, and on low-end devices we still get a crisp 1x.
      dpr={[1, 2]}
      gl={{
        antialias: true,
        // ACES gives the world the cinematic warmth the procedural
        // flat-shaded props lacked under linear tone mapping.
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      className="w-full h-full"
    >
      <PlayerMapScene
        project={project}
        scrollProgress={scrollProgress}
        firstPerson={firstPerson}
        setFirstPerson={setFirstPerson}
      />
    </Canvas>
  );
}
