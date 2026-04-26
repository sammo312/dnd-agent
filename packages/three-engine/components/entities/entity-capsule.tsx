"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"

// ──────────────────────────────────────────────────────
// Entity capsule: colored cylinder with floating name label.
//
// Spawn animation: scales from 0 to 1 over 0.5s.
// Despawn: controlled by parent (remove from scene).
//
// Color coding:
//   Red    = hostile (dragon, skeleton, bandit)
//   Blue   = friendly (barkeep, mayor, guard)
//   Gold   = quest NPC (mysterious stranger)
//   Green  = neutral
// ──────────────────────────────────────────────────────

interface EntityCapsuleProps {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  color: string
  status?: {
    health?: { current: number; max: number }
    condition?: string
  }
}

export function EntityCapsule({ id, name, position, color, status }: EntityCapsuleProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [scale, setScale] = useState(0)
  const spawnTimeRef = useRef(Date.now())

  // Spawn animation: scale from 0 to 1 over 500ms
  useFrame(() => {
    if (scale < 1) {
      const elapsed = Date.now() - spawnTimeRef.current
      const t = Math.min(1, elapsed / 500)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setScale(eased)
    }
  })

  const healthPercent = status?.health
    ? status.health.current / status.health.max
    : null

  return (
    <group position={[position.x, position.y, position.z]} scale={[scale, scale, scale]}>
      {/* Capsule body */}
      <mesh ref={meshRef} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Floating name label + status */}
      <Html
        position={[0, 1.2, 0]}
        center
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div style={{
          background: "rgba(0, 0, 0, 0.75)",
          color: "white",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "11px",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}>
          <div style={{ fontWeight: "bold" }}>{name}</div>

          {/* Health bar */}
          {healthPercent !== null && (
            <div style={{
              width: "60px",
              height: "4px",
              background: "#333",
              borderRadius: "2px",
              marginTop: "2px",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${healthPercent * 100}%`,
                height: "100%",
                background: healthPercent > 0.5 ? "#22c55e" : healthPercent > 0.25 ? "#eab308" : "#ef4444",
                transition: "width 0.3s ease",
              }} />
            </div>
          )}

          {/* Condition badge */}
          {status?.condition && (
            <div style={{
              fontSize: "9px",
              color: "#fbbf24",
              marginTop: "1px",
            }}>
              {status.condition}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
