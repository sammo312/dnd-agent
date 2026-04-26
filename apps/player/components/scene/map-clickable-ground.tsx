"use client";

/**
 * Replacement for `@dnd-agent/three-engine`'s `ClickableGround`, which
 * is a 50×50 plane centered at the world origin. Map cells live in
 * positive world space `(0,0)..(width,height)`, so the engine version
 * silently misses any click on a tile beyond ~25 along either axis —
 * which is exactly why click-to-walk to a far-corner POI like a crypt
 * entrance or a tavern at the village edge appeared to "do nothing".
 *
 * This version sits flush with the map footprint, slightly oversized
 * so clicks at the very edge still register, and at y < 0 so the
 * terrain mesh wins any depth ties for visible geometry.
 */

import * as THREE from "three";

interface MapClickableGroundProps {
  width: number;
  height: number;
  visible: boolean;
  onClickPosition: (pos: THREE.Vector3) => void;
}

export function MapClickableGround({
  width,
  height,
  visible,
  onClickPosition,
}: MapClickableGroundProps) {
  if (!visible) return null;

  // 1.5x oversize so a click slightly outside the map still snaps to
  // a sensible target; WalkToTarget will clamp into bounds anyway.
  const w = Math.max(width * 1.5, 50);
  const h = Math.max(height * 1.5, 50);

  return (
    <mesh
      position={[width / 2, -0.1, height / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.point) onClickPosition(e.point.clone());
      }}
      onPointerOver={() => {
        document.body.style.cursor = "crosshair";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
