"use client"

import { useMemo } from "react"
import * as THREE from "three"

interface TerrainGridProps {
  width: number
  height: number
}

export function TerrainGrid({ width, height }: TerrainGridProps) {
  const lines = useMemo(() => {
    const points: THREE.Vector3[] = []

    for (let x = 0; x <= width; x++) {
      points.push(new THREE.Vector3(x, 0.01, 0))
      points.push(new THREE.Vector3(x, 0.01, height))
    }

    for (let y = 0; y <= height; y++) {
      points.push(new THREE.Vector3(0, 0.01, y))
      points.push(new THREE.Vector3(width, 0.01, y))
    }

    return points
  }, [width, height])

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={lines.length}
          array={new Float32Array(lines.flatMap((v) => [v.x, v.y, v.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#333" transparent opacity={0.5} />
    </lineSegments>
  )
}
