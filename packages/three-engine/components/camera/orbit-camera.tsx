"use client"

import { OrbitControls } from "@react-three/drei"

interface OrbitCameraProps {
  mapWidth: number
  mapHeight: number
  minDistance?: number
  maxDistance?: number
}

export function OrbitCamera({ mapWidth, mapHeight, minDistance = 3, maxDistance }: OrbitCameraProps) {
  return (
    <OrbitControls
      makeDefault
      minDistance={minDistance}
      maxDistance={maxDistance ?? Math.max(mapWidth, mapHeight) * 3}
      target={[mapWidth / 2, 0, mapHeight / 2]}
    />
  )
}
