"use client";

import { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import {
  PlayerScene,
  type FirstPersonState,
} from "@dnd-agent/three-engine";

interface PlayerViewProps {
  scrollProgress: number;
  onFirstPersonChange?: (active: boolean) => void;
}

export default function PlayerView({
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

  return (
    <Canvas
      camera={{ position: [0, 14, 0.1], fov: 50 }}
      shadows
      className="w-full h-full"
    >
      <PlayerScene
        scrollProgress={scrollProgress}
        firstPerson={firstPerson}
        setFirstPerson={setFirstPerson}
      />
    </Canvas>
  );
}
