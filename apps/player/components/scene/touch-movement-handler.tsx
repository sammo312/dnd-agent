"use client";

/**
 * R3F sibling of `@dnd-agent/three-engine`'s `MovementHandler` — same
 * forward/rotate model, but driven by the touch input store instead
 * of the keyboard. Both run in parallel when active so a tablet user
 * with a Bluetooth keyboard can use either.
 */

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTouchInputStore } from "@/lib/input/touch-input-store";

interface TouchMovementHandlerProps {
  active: boolean;
  position: THREE.Vector3;
  rotation: number;
  onMove: (newPos: THREE.Vector3) => void;
  onRotate: (newRotation: number) => void;
  bounds?: { min: number; max: number };
  moveSpeed?: number;
  rotateSpeed?: number;
}

export function TouchMovementHandler({
  active,
  position,
  rotation,
  onMove,
  onRotate,
  bounds = { min: -10, max: 10 },
  moveSpeed = 4,
  rotateSpeed = 2.5,
}: TouchMovementHandlerProps) {
  const posRef = useRef<THREE.Vector3>(position.clone());

  useEffect(() => {
    posRef.current.copy(position);
  }, [position]);

  useFrame((_, delta) => {
    if (!active) return;

    // Pull state imperatively so the host component doesn't re-render
    // with every joystick wiggle.
    const { axis, consumeLookDelta } = useTouchInputStore.getState();
    const lookDelta = consumeLookDelta();

    let nextRotation = rotation;
    const dr = axis.rotate * rotateSpeed * delta;
    if (dr !== 0) nextRotation += dr;
    if (lookDelta !== 0) nextRotation += lookDelta;
    if (nextRotation !== rotation) onRotate(nextRotation);

    if (axis.forward !== 0) {
      // The engine's rotation convention is "0 = look down +Z", with
      // a forward step pointing along (sin θ, cos θ). Match that
      // exactly so the joystick UP direction always walks where the
      // camera is looking, regardless of map orientation.
      const step = axis.forward * moveSpeed * delta;
      const forward = new THREE.Vector3(
        Math.sin(nextRotation),
        0,
        Math.cos(nextRotation),
      );
      const newPos = posRef.current.clone();
      newPos.add(forward.multiplyScalar(step));
      newPos.x = Math.max(bounds.min, Math.min(bounds.max, newPos.x));
      newPos.z = Math.max(bounds.min, Math.min(bounds.max, newPos.z));
      posRef.current.copy(newPos);
      onMove(newPos.clone());
    }
  });

  return null;
}
