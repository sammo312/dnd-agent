"use client"

import { useRef, useMemo, Suspense } from "react"
import { useFrame } from "@react-three/fiber"
import { Html, useGLTF, Billboard } from "@react-three/drei"
import * as THREE from "three"

interface MapCell {
  terrain: string
  elevation: number
}

interface PlacedPOI {
  id: string
  type: string
  name: string
  icon: string
  x: number
  y: number
  size: { w: number; h: number }
  gltfUrl?: string
}

function GLTFModel({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(), [scene])
  return <primitive object={clonedScene} scale={scale} />
}

function EmojiSprite({ emoji, size = 1 }: { emoji: string; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <Billboard follow lockX={false} lockY={false} lockZ={false}>
      <mesh ref={meshRef}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Html
        position={[0, 0.8, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
      >
        <div className="text-4xl select-none" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
          {emoji}
        </div>
      </Html>
    </Billboard>
  )
}

export function POIMarker({ poi, cells }: { poi: PlacedPOI; cells: MapCell[][] }) {
  const groupRef = useRef<THREE.Group>(null)

  const posX = poi.x + poi.size.w / 2
  const posZ = poi.y + poi.size.h / 2

  const cellX = Math.floor(poi.x)
  const cellY = Math.floor(poi.y)
  const cell = cells[cellY]?.[cellX]
  const elevation = (cell?.elevation ?? 0) * 0.3

  return (
    <group ref={groupRef} position={[posX, elevation + 0.1, posZ]}>
      {poi.gltfUrl ? (
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#888" wireframe />
            </mesh>
          }
        >
          <GLTFModel url={poi.gltfUrl} scale={0.5} />
        </Suspense>
      ) : (
        <EmojiSprite emoji={poi.icon} size={1.2} />
      )}

      <Html
        position={[0, poi.gltfUrl ? 1.5 : 1.8, 0]}
        center
        distanceFactor={15}
        style={{ pointerEvents: "none" }}
      >
        <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium whitespace-nowrap border shadow-lg">
          {poi.name}
        </div>
      </Html>
    </group>
  )
}
