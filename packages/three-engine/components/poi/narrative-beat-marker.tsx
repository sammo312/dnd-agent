"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"

interface MapCell {
  terrain: string
  elevation: number
}

interface PlacedNarrativeBeat {
  id: string
  sectionId: string
  nodeId?: string
  name: string
  x: number
  y: number
  type: "section" | "node"
  associatedPOIs?: string[]
}

export function NarrativeBeatMarker({ beat, cells }: { beat: PlacedNarrativeBeat; cells: MapCell[][] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime
    }
  })

  const size = beat.type === "section" ? 0.4 : 0.25
  const color = beat.type === "section" ? "#f59e0b" : "#0ea5e9"

  const cell = cells[beat.y]?.[beat.x]
  const elevation = (cell?.elevation ?? 0) * 0.3

  return (
    <group position={[beat.x + 0.5, elevation + 0.5, beat.y + 0.5]}>
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <Html
        position={[0, 0.8, 0]}
        center
        distanceFactor={15}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap border shadow-lg ${
            beat.type === "section"
              ? "bg-amber-500/90 text-white"
              : "bg-sky-500/90 text-white"
          }`}
        >
          {beat.type === "section" ? "Section" : "Node"}: {beat.name}
        </div>
      </Html>
    </group>
  )
}
